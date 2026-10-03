// sources.ts: every outside read the cockpit makes.
//
// The mods validator only lets `$` reach top-level functions of register.ts, so effects live
// there. Each source here is one `run(world, ask)`: it reads through `ask`, which register.ts
// builds over `$` for each poll, and says what the answers mean. That gives one place where a
// failure becomes "stale since hh:mm" for that source only, and sources that tests run against a
// table of real answers without the test kit. A process can only be one commands.ts built.

import { COMMANDS, type Req } from './commands.ts'
import { FIXED_REPOS, configPathOf, parseOrigin, parsePrList } from './github.ts'
import { parsePaneLabel, parseSnapshot } from './herdr.ts'
import { inboxFile, inboxTicket } from './dispatch.ts'
import type { Branches, GithubView, HeadPaths, InboxFile, Ms, Origins, Pane, PaneLabels, Polled, Pr, SourceId, SourceValues, Sources, SpaceMap, World } from './model.ts'

/** What one outside read gave: its value, or why there is none. */
export type Answer<T> = { k: 'ok'; value: T } | { k: 'fail'; error: string }

/** One directory entry, as register.ts reduces `$.fs.list`. A folder that does not exist lists `[]`. */
export type Listing = ReadonlyArray<{ name: string; kind: string; mtimeMs: number }>

/** The reads a source may make. Each answers, never throws, so a source decides what a failure means. */
export type Ask = {
  proc(req: Req): Promise<Answer<string>>
  read(path: string): Promise<Answer<string>>
  list(path: string): Promise<Answer<Listing>>
}

/**
 * One polled source. `run` may read sources polled before it in this tick, and returns undefined
 * to mean "unusable", which marks the source stale (or down, if it never answered).
 */
export type Source<T> = {
  everyMs: Ms
  run(world: World, ask: Ask): Promise<T | undefined>
}

/** The heartbeat period: the shortest `everyMs`. One timer drives every source. */
export const HEARTBEAT_MS = 5000

export function valueOf<T>(p: Polled<T>): T | undefined {
  return p.k === 'fresh' || p.k === 'stale' ? p.value : undefined
}

/** The next state of a source after one poll. A failure keeps the last good value and the time it went bad. */
export function settle<T>(prev: Polled<T>, value: T | undefined, now: Ms, error: string): Polled<T> {
  if (value !== undefined) return { k: 'fresh', value, at: now }
  if (prev.k === 'fresh') return { k: 'stale', value: prev.value, at: prev.at, since: now, error }
  if (prev.k === 'stale') return { ...prev, error }
  return { k: 'down', since: prev.k === 'down' ? prev.since : now, error }
}

/** Which sources are due. A source never run is due now, so a reload or a new claim fills every column at once. */
export function due(lastRun: Partial<Record<SourceId, Ms>>, now: Ms): SourceId[] {
  // Timer callbacks drift a few ms either way; without the slack a 5 s source would skip alternate beats.
  const slack = HEARTBEAT_MS / 2
  return SOURCE_IDS.filter((id) => {
    const last = lastRun[id]
    return last === undefined || now - last >= SOURCES[id].everyMs - slack
  })
}

const ok = <T>(a: Answer<T>): T | undefined => (a.k === 'ok' ? a.value : undefined)

// ── herdr ──────────────────────────────────────────────────────────────────────────────────

/** Panes of main's space, other than main's own, whose snapshot entry has no label. */
function unlabelled(world: World): Pane[] {
  const snap = valueOf(world.sources.herdr)
  if (!snap) return []
  return snap.panes.filter((p) => p.space === world.me.space && p.pane !== world.me.pane && p.paneLabel === undefined)
}

/** What a cached pane label was read against: herdr shows no label change, only these. */
const seenOf = (p: Pane): string => `${p.tabLabel ?? ''}\n${p.terminalTitle ?? ''}`

/** Unlabelled panes with no cached label, or one read when their tab label or title differed. */
function toRead(world: World): Pane[] {
  const cache = valueOf(world.sources.labels)?.byPane
  return unlabelled(world).filter((p) => cache?.get(p.pane)?.seen !== seenOf(p))
}

// ── WORKFLOW.md §8 Live spaces ─────────────────────────────────────────────────────────────

const workflowPath = (home: string): string => `${home}/.agents/skills/workspace/references/WORKFLOW.md`

/**
 * The `### Live spaces` table, `| \`COPPA\` | COPPA and Data Compliance Audit |` per row.
 * A WORKFLOW.md without the table means no space has a Project.
 */
export function parseLiveSpaces(markdown: string): SpaceMap {
  const map = new Map<string, string>()
  const start = markdown.search(/^### Live spaces\s*$/m)
  if (start < 0) return map
  const body = markdown.slice(start).split('\n').slice(1)
  const end = body.findIndex((l) => /^#{1,3} /.test(l))
  for (const line of end < 0 ? body : body.slice(0, end)) {
    const cells = line.split('|').map((c) => c.trim())
    if (cells.length < 4 || cells[0] !== '') continue
    const space = (cells[1] ?? '').replace(/^`|`$/g, '')
    const project = cells[2] ?? ''
    if (!space || !project || /^-+$/.test(space) || space === 'herdr space') continue
    map.set(space, project)
  }
  return map
}

// ── git HEAD files (synthesis graft 4: read the file, never run git) ─────────────────────────

/** The folders whose branch main needs: its own, and every pane's in its space, as a pane's last label fallback. */
function trackedCwds(world: World): string[] {
  const panes = (valueOf(world.sources.herdr)?.panes ?? []).filter((p) => p.space === world.me.space && p.pane !== world.me.pane)
  return [...new Set([world.me.cwd, ...panes.map((p) => p.cwd)])].filter((cwd) => cwd !== '')
}

/**
 * Where a folder's HEAD lives, from the text of `<cwd>/.git`. A worktree's `.git` is a file
 * naming its gitdir; a checkout's is a directory, which does not read as text.
 */
export function headPathOf(cwd: string, dotGit: string | undefined): string {
  const m = dotGit === undefined ? null : /^gitdir:\s*(.+?)\s*$/m.exec(dotGit)
  if (!m?.[1]) return `${cwd}/.git/HEAD`
  return m[1].startsWith('/') ? `${m[1]}/HEAD` : `${cwd}/${m[1]}/HEAD`
}

/**
 * Where `cwd`'s HEAD lives, or undefined when a read failed. Only a `.git` that lists as a file
 * is read: a checkout's is a folder, and a folder outside git has none.
 */
async function headOf(cwd: string, ask: Ask): Promise<string | undefined> {
  const entries = ok(await ask.list(cwd))
  if (!entries) return undefined
  if (entries.find((e) => e.name === '.git')?.kind !== 'file') return headPathOf(cwd, undefined)
  const dotGit = ok(await ask.read(`${cwd}/.git`))
  return dotGit === undefined ? undefined : headPathOf(cwd, dotGit)
}

/** `ref: refs/heads/fix/thv-1050` → `fix/thv-1050`. A detached HEAD (a bare sha) has no branch. */
export function parseHead(text: string): string | undefined {
  return /^ref: refs\/heads\/(.+?)\s*$/m.exec(text)?.[1]
}

// ── Repos: each tracked folder's origin, plus frontend and backend (synthesis A4) ────────────

/** The `.git/config` of each tracked folder whose HEAD path is known, one entry per repo. */
function configPaths(world: World): string[] {
  const heads = valueOf(world.sources.heads)
  return [...new Set(trackedCwds(world).flatMap((cwd) => {
    const head = heads?.get(cwd)
    return head === undefined ? [] : [configPathOf(head)]
  }))]
}

/** Configs not read yet. A config is read once: an unreadable one stays cached as no repo. */
function unreadConfigs(world: World): string[] {
  const known = valueOf(world.sources.origins)
  return configPaths(world).filter((path) => !known?.has(path))
}

/** The repos main asks gh about, frontend and backend first. */
function reposOf(world: World): string[] {
  const origins = valueOf(world.sources.origins)
  return [...new Set([...FIXED_REPOS, ...configPaths(world).flatMap((path) => origins?.get(path) ?? [])])]
}

// ── $TMPDIR/dispatch/out, main's inbox ───────────────────────────────────────────────────────

/** macOS's TMPDIR ends in `/`. No TMPDIR, no inbox. */
const inboxDir = (tmp: string): string | undefined => (tmp === '' ? undefined : `${tmp.replace(/\/+$/, '')}/dispatch/out`)

/** Files whose name names a ticket: no row can show another (`w40-p1.md`), so it is never read. */
const ticketFiles = (listing: Listing): Listing => listing.filter((e) => e.kind === 'file' && inboxTicket(e.name) !== undefined)

// ── The registry ─────────────────────────────────────────────────────────────────────────────

/** Poll order is this object's key order. A source's `run` reads only sources above it. */
export const SOURCES: { [K in SourceId]: Source<SourceValues[K]> } = {
  herdr: {
    everyMs: HEARTBEAT_MS,
    run: async (_world, ask) => {
      const text = ok(await ask.proc(COMMANDS['herdr api snapshot']()))
      return text === undefined ? undefined : parseSnapshot(text)
    },
  },

  // ADR4: each pane's label is read once and kept until that pane's tab label or title changes.
  // A failed read keeps the old entry, so the pane is tried again next tick.
  labels: {
    everyMs: HEARTBEAT_MS,
    run: async (world, ask): Promise<PaneLabels> => {
      const read = await Promise.all(toRead(world).map(async (p) => [p, ok(await ask.proc(COMMANDS['herdr pane get'](p.pane)))] as const))
      const cache = valueOf(world.sources.labels)?.byPane
      const byPane = new Map(unlabelled(world).flatMap((p) => {
        const kept = cache?.get(p.pane)
        return kept ? [[p.pane, kept] as const] : []
      }))
      for (const [p, text] of read) if (text !== undefined) byPane.set(p.pane, { seen: seenOf(p), label: parsePaneLabel(text) })
      return { byPane }
    },
  },

  spaces: {
    everyMs: 5 * 60_000,
    run: async (world, ask) => {
      const text = ok(await ask.read(workflowPath(world.me.home)))
      return text === undefined ? undefined : parseLiveSpaces(text)
    },
  },

  // Rebuilt from the tracked folders each poll. A folder whose read failed is left out, so it is
  // asked again next poll rather than cached as a checkout.
  heads: {
    everyMs: HEARTBEAT_MS,
    run: async (world, ask): Promise<HeadPaths> => {
      const known = valueOf(world.sources.heads)
      const found = await Promise.all(trackedCwds(world).map(async (cwd) => [cwd, known?.get(cwd) ?? (await headOf(cwd, ask))] as const))
      return new Map(found.flatMap(([cwd, head]) => (head === undefined ? [] : [[cwd, head] as const])))
    },
  },

  branches: {
    everyMs: HEARTBEAT_MS,
    run: async (world, ask): Promise<Branches> => {
      const heads = [...(valueOf(world.sources.heads) ?? [])]
      const read = await Promise.all(heads.map(async ([cwd, path]) => [cwd, ok(await ask.read(path))] as const))
      const branches = new Map<string, string>()
      for (const [cwd, text] of read) {
        const branch = text === undefined ? undefined : parseHead(text)
        if (branch) branches.set(cwd, branch)
      }
      return branches
    },
  },

  origins: {
    everyMs: HEARTBEAT_MS,
    run: async (world, ask): Promise<Origins> => {
      const read = await Promise.all(unreadConfigs(world).map(async (path) => [path, ok(await ask.read(path))] as const))
      const origins = new Map(valueOf(world.sources.origins))
      for (const [path, text] of read) origins.set(path, text === undefined ? undefined : parseOrigin(text))
      return origins
    },
  },

  // One `gh pr list` per repo. Any repo failing marks the whole source stale, so the PR and CI
  // cells keep the last full answer rather than mixing two polls.
  github: {
    everyMs: 60_000,
    run: async (world, ask): Promise<GithubView | undefined> => {
      const lists = await Promise.all(reposOf(world).map(async (repo) => {
        const text = ok(await ask.proc(COMMANDS['gh pr list'](repo)))
        return text === undefined ? undefined : parsePrList(repo, text)
      }))
      const prs: Pr[] = []
      for (const list of lists) {
        if (!list) return undefined
        prs.push(...list)
      }
      return { prs }
    },
  },

  // An unchanged file keeps its last read, so a 46 KB deliverable is read once.
  inbox: {
    everyMs: 10_000,
    run: async (world, ask): Promise<InboxFile[] | undefined> => {
      const dir = inboxDir(world.me.tmp)
      if (dir === undefined) return []
      const listing = ok(await ask.list(dir))
      if (!listing) return undefined
      const known = valueOf(world.sources.inbox) ?? []
      const files = await Promise.all(ticketFiles(listing).map(async (e) => {
        const kept = known.filter((f) => f.name === e.name && f.at === e.mtimeMs)
        if (kept.length > 0) return kept
        const text = ok(await ask.read(`${dir}/${e.name}`))
        const file = text === undefined ? undefined : inboxFile(e.name, text, e.mtimeMs)
        return file ? [file] : []
      }))
      return files.flat()
    },
  },
}

const SOURCE_IDS = Object.keys(SOURCES).filter((k): k is SourceId => Object.hasOwn(SOURCES, k))

/** One value per source, in poll order. */
export function bySource<V>(of: (id: SourceId) => V): { [K in SourceId]: V } {
  return Object.fromEntries(SOURCE_IDS.map((id) => [id, of(id)])) as { [K in SourceId]: V }
}

/** Every source before its first poll. */
export const unpolled = (): Sources => bySource((): Polled<never> => ({ k: 'never' }))
