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
import { inboxFile } from './dispatch.ts'
import { carry, keyPath, parseStates, stateQuery, ticketsOn, type LinearView, type StateQuery } from './linear.ts'
import { readRollouts } from './codex.ts'
import type { Board, Branches, CodexRollout, GithubView, HeadPaths, InboxFile, Ms, Origins, Pane, PaneId, PaneLabels, Polled, Pr, HealthId, Snapshot, SourceId, SourceValues, Sources, SpaceMap, Ticket, World } from './model.ts'

/** One directory entry, as register.ts reduces `$.fs.list`. A folder that does not exist lists `[]`. */
export type Listing = ReadonlyArray<{ name: string; kind: string; mtimeMs: number }>

/**
 * The reads a source may make. Each throws when its read fails, and a throw out of `run` marks
 * the whole source stale. A read the source can do without is wrapped in `tolerate`.
 */
export type Ask = {
  proc(req: Req): Promise<string>
  read(path: string): Promise<string>
  list(path: string): Promise<Listing>
  /** POST the one Linear body there is to LINEAR_URL with `key`, and answer the response text. */
  linear(body: StateQuery, key: string): Promise<string>
}

/**
 * What a source may read: who main is, what each source last gave, and the rows and Project of the
 * board last drawn. Only those two fields: Board's Health is read off SOURCES, which reads Seen.
 */
export type Seen = Pick<World, 'me' | 'sources' | 'now'> & { board?: Pick<Board, 'project' | 'build'> | undefined }

/**
 * One polled source. `run` reads its own last value and the sources named in `needs`, which a
 * tick polls in an earlier stage. It returns undefined to mean "unusable", which marks the source
 * stale (or down, if it never answered). `N` keeps `needs` as literals, so stagesOf rejects a
 * need that names no source at compile time.
 */
export type Source<T, N extends string = string, H extends string = string> = {
  everyMs: Ms
  needs: readonly N[]
  /** The Health entry this source shares with others; a source without one is its own entry. */
  shows?: H
  /** Due now as well as every `everyMs`, when this says so. */
  dueIf?: (world: Seen) => boolean
  run(world: Seen, ask: Ask): Promise<T | undefined>
}

/** A SOURCES entry. Its value type is read off `run`'s return type, which SourceValues collects. */
function source<T, const N extends string, const H extends string = never>(s: Source<T, N, H>): Source<T, N, H> {
  return s
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
export function due(lastRun: Partial<Record<SourceId, Ms>>, now: Ms, world?: Seen): SourceId[] {
  // Timer callbacks drift a few ms either way; without the slack a 5 s source would skip alternate beats.
  const slack = HEARTBEAT_MS / 2
  return SOURCE_IDS.filter((id) => {
    const last = lastRun[id]
    return last === undefined || now - last >= SOURCES[id].everyMs - slack || (world !== undefined && BY_ID[id].dueIf?.(world) === true)
  })
}

/** A read this source can do without: a failure is undefined here, and the read is tried again next poll. */
const tolerate = <T>(read: Promise<T>): Promise<T | undefined> => read.catch(() => undefined)

// ── herdr ──────────────────────────────────────────────────────────────────────────────────

/** Panes of main's space, other than main's own, whose snapshot entry has no label. */
function unlabelled(world: Seen): Pane[] {
  const snap = valueOf(world.sources.herdr)
  if (!snap) return []
  return snap.panes.filter((p) => p.space === world.me.space && p.pane !== world.me.pane && p.paneLabel === undefined)
}

/** What a cached pane label was read against: herdr shows no label change, only these. */
const seenOf = (p: Pane): string => `${p.tabLabel ?? ''}\n${p.terminalTitle ?? ''}`

/** Unlabelled panes with no cached label, or one read when their tab label or title differed. */
function toRead(world: Seen): Pane[] {
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
function trackedCwds(world: Seen): string[] {
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
 * Where `cwd`'s HEAD lives. Only a `.git` that lists as a file is read: a checkout's is a folder,
 * and a folder outside git has none.
 */
async function headOf(cwd: string, ask: Ask): Promise<string> {
  const entries = await ask.list(cwd)
  if (entries.find((e) => e.name === '.git')?.kind !== 'file') return headPathOf(cwd, undefined)
  return headPathOf(cwd, await ask.read(`${cwd}/.git`))
}

/** `ref: refs/heads/fix/thv-1050` → `fix/thv-1050`. A detached HEAD (a bare sha) has no branch. */
export function parseHead(text: string): string | undefined {
  return /^ref: refs\/heads\/(.+?)\s*$/m.exec(text)?.[1]
}

// ── Repos: each tracked folder's origin, plus frontend and backend (synthesis A4) ────────────

/** The `.git/config` of each tracked folder whose HEAD path is known, one entry per repo. */
function configPaths(world: Seen): string[] {
  const heads = valueOf(world.sources.heads)
  return [...new Set(trackedCwds(world).flatMap((cwd) => {
    const head = heads?.get(cwd)
    return head === undefined ? [] : [configPathOf(head)]
  }))]
}

/** Configs not read yet. A config is read once: an unreadable one stays cached as no repo. */
function unreadConfigs(world: Seen): string[] {
  const known = valueOf(world.sources.origins)
  return configPaths(world).filter((path) => !known?.has(path))
}

/** The repos main asks gh about, frontend and backend first. */
function reposOf(world: Seen): string[] {
  const origins = valueOf(world.sources.origins)
  return [...new Set([...FIXED_REPOS, ...configPaths(world).flatMap((path) => origins?.get(path) ?? [])])]
}

// ── $TMPDIR/dispatch/out, main's inbox ───────────────────────────────────────────────────────

/** macOS's TMPDIR ends in `/`. No TMPDIR, no inbox. */
const inboxDir = (tmp: string): string | undefined => (tmp === '' ? undefined : `${tmp.replace(/\/+$/, '')}/dispatch/out`)

// ── Linear (ADR10) ─────────────────────────────────────────────────────────────────────────────

const NOTHING_ASKED: LinearView = { asked: [], issues: new Map(), states: [] }

/** The tickets the state read is for: those on the board, in a space with a Project. None before the first board. */
const linearTickets = (world: Seen): Ticket[] => (world.board?.project === undefined ? [] : ticketsOn(world.board))

// ── The registry ─────────────────────────────────────────────────────────────────────────────

/** A source's `needs` are listed above it, so STAGES can be read off in one pass. */
export const SOURCES = {
  herdr: source({
    everyMs: HEARTBEAT_MS,
    needs: [],
    run: async (_world, ask): Promise<Snapshot | undefined> => parseSnapshot(await ask.proc(COMMANDS['herdr api snapshot']())),
  }),

  // ADR4: each pane's label is read once and kept until that pane's tab label or title changes.
  // A failed read keeps the old entry, so the pane is tried again next tick.
  labels: source({
    everyMs: HEARTBEAT_MS,
    needs: ['herdr'],
    run: async (world, ask): Promise<PaneLabels> => {
      const read = await Promise.all(toRead(world).map(async (p): Promise<[Pane, string | undefined]> => [p, await tolerate(ask.proc(COMMANDS['herdr pane get'](p.pane)))]))
      const cache = valueOf(world.sources.labels)?.byPane
      const byPane = new Map(unlabelled(world).flatMap((p): Array<[PaneId, { seen: string; label: string | undefined }]> => {
        const kept = cache?.get(p.pane)
        return kept ? [[p.pane, kept]] : []
      }))
      for (const [p, text] of read) if (text !== undefined) byPane.set(p.pane, { seen: seenOf(p), label: parsePaneLabel(text) })
      return { byPane }
    },
  }),

  spaces: source({
    everyMs: 5 * 60_000,
    needs: [],
    run: async (world, ask): Promise<SpaceMap> => parseLiveSpaces(await ask.read(workflowPath(world.me.home))),
  }),

  // Rebuilt from the tracked folders each poll. A folder whose read failed is left out, so it is
  // asked again next poll rather than cached as a checkout.
  heads: source({
    everyMs: HEARTBEAT_MS,
    shows: 'git',
    needs: ['herdr'],
    run: async (world, ask): Promise<HeadPaths> => {
      const known = valueOf(world.sources.heads)
      const found = await Promise.all(trackedCwds(world).map(async (cwd): Promise<[string, string | undefined]> => [cwd, known?.get(cwd) ?? (await tolerate(headOf(cwd, ask)))]))
      return new Map(found.flatMap(([cwd, head]): Array<[string, string]> => (head === undefined ? [] : [[cwd, head]])))
    },
  }),

  branches: source({
    everyMs: HEARTBEAT_MS,
    shows: 'git',
    needs: ['heads'],
    run: async (world, ask): Promise<Branches> => {
      const heads = [...(valueOf(world.sources.heads) ?? [])]
      const read = await Promise.all(heads.map(async ([cwd, path]): Promise<[string, string | undefined]> => [cwd, await tolerate(ask.read(path))]))
      const branches = new Map<string, string>()
      for (const [cwd, text] of read) {
        const branch = text === undefined ? undefined : parseHead(text)
        if (branch) branches.set(cwd, branch)
      }
      return branches
    },
  }),

  origins: source({
    everyMs: HEARTBEAT_MS,
    shows: 'git',
    needs: ['herdr', 'heads'],
    run: async (world, ask): Promise<Origins> => {
      const read = await Promise.all(unreadConfigs(world).map(async (path): Promise<[string, string | undefined]> => [path, await tolerate(ask.read(path))]))
      const origins = new Map(valueOf(world.sources.origins))
      for (const [path, text] of read) origins.set(path, text === undefined ? undefined : parseOrigin(text))
      return origins
    },
  }),

  // One `gh pr list` per repo. Any repo failing marks the whole source stale, so the PR and CI
  // cells keep the last full answer rather than mixing two polls. allSettled, so a failed repo
  // does not end the poll while another repo's gh still runs into the next one.
  github: source({
    everyMs: 60_000,
    needs: ['herdr', 'heads', 'origins'],
    run: async (world, ask): Promise<GithubView | undefined> => {
      const lists = await Promise.allSettled(reposOf(world).map(async (repo) => parsePrList(repo, await ask.proc(COMMANDS['gh pr list'](repo)))))
      const prs: Pr[] = []
      for (const list of lists) {
        if (list.status === 'rejected') throw list.reason
        if (!list.value) return undefined
        prs.push(...list.value)
      }
      return { prs }
    },
  }),

  // An unchanged file keeps its last read, so a 46 KB deliverable is read once.
  inbox: source({
    everyMs: 10_000,
    needs: [],
    run: async (world, ask): Promise<InboxFile[] | undefined> => {
      const dir = inboxDir(world.me.tmp)
      if (dir === undefined) return []
      const listing = await ask.list(dir)
      const known = valueOf(world.sources.inbox) ?? []
      const files = await Promise.all(listing.filter((e) => e.kind === 'file').map(async (e) => {
        const kept = known.filter((f) => f.name === e.name && f.at === e.mtimeMs)
        if (kept.length > 0) return kept
        const text = await tolerate(ask.read(`${dir}/${e.name}`))
        const file = text === undefined ? undefined : inboxFile(e.name, text, e.mtimeMs)
        return file ? [file] : []
      }))
      return files.flat()
    },
  }),

  // Best effort (ADR11): Codex rollouts, read only while a Codex pane is in the space. A rollout
  // that cannot be read is left out, never a failed source, since some history is simply gone.
  codex: source({
    everyMs: 60_000,
    needs: ['herdr'],
    run: async (world, ask): Promise<CodexRollout[]> => {
      const panes = valueOf(world.sources.herdr)?.panes ?? []
      if (!panes.some((p) => p.space === world.me.space && p.tool === 'X')) return []
      return readRollouts(ask, world.me.home, valueOf(world.sources.codex) ?? [])
    },
  }),
  // Every 5 minutes, and at once when a ticket comes on screen that no read has asked about, unless
  // the last read failed: a failing Linear is retried on the 5-minute beat only. A read asks about
  // the tickets on screen only and carries every other entry forward (carry in linear.ts).
  // `NOTHING_ASKED` is the value before the first board; it adds nothing to carry.
  linear: source({
    everyMs: 5 * 60_000,
    needs: [],
    dueIf: (world): boolean => {
      const last = world.sources.linear
      if (last.k === 'stale' || last.k === 'down') return false
      const asked = valueOf(last)?.asked ?? []
      return linearTickets(world).some((t) => !asked.includes(t))
    },
    run: async (world, ask): Promise<LinearView | undefined> => {
      const tickets = linearTickets(world)
      const last = valueOf(world.sources.linear)
      if (tickets.length === 0) return last ?? NOTHING_ASKED
      const key = (await ask.read(keyPath(world.me.home))).trim()
      if (key === '') throw new Error('~/.linear-api-key is empty')
      const read = parseStates(await ask.linear(stateQuery(tickets), key), tickets, world.now)
      return read && carry(last, read)
    },
  }),
}

const SOURCE_IDS = Object.keys(SOURCES).filter((k): k is SourceId => Object.hasOwn(SOURCES, k))

/**
 * The sources in stages: a stage runs once every earlier one settled, and each source sits one
 * stage after the deepest source it needs. Sources in one stage never wait on each other.
 */
export const STAGES: ReadonlyArray<readonly SourceId[]> = stagesOf()

function stagesOf(): SourceId[][] {
  const depth = new Map<SourceId, number>()
  const stages: SourceId[][] = []
  for (const id of SOURCE_IDS) {
    let d = 0
    for (const need of SOURCES[id].needs) {
      const at = depth.get(need)
      if (at === undefined) throw new Error(`source ${id} needs ${need}, which is not above it in SOURCES`)
      d = Math.max(d, at + 1)
    }
    depth.set(id, d)
    ;(stages[d] ??= []).push(id)
  }
  return stages
}

/** SOURCES seen through SourceValues, so a poll of `id` is typed by `id`. */
export const BY_ID: { [K in SourceId]: Source<SourceValues[K]> } = SOURCES

/** The sources that share one Health entry, in poll order. */
export const sharing = (entry: HealthId): SourceId[] => SOURCE_IDS.filter((id) => BY_ID[id].shows === entry)

type Unpolled = { [K in SourceId]: { k: 'never' } }
const isUnpolled = (o: Readonly<Record<string, { k: 'never' }>>): o is Unpolled => SOURCE_IDS.every((id) => Object.hasOwn(o, id))

/** Every source before its first poll. */
export function unpolled(): Sources {
  const all = Object.fromEntries(SOURCE_IDS.map((id): [SourceId, { k: 'never' }] => [id, { k: 'never' }]))
  if (!isUnpolled(all)) throw new Error('unreachable: SOURCE_IDS lists every source')
  return all
}
