// sources.ts: every outside read the cockpit makes, described as data.
//
// The mods validator only lets `$` reach top-level functions of register.ts, so effects live
// there. Each source here says what to ask (`plan`) and how to read the answers (`read`), and
// register.ts runs them through one executor, `perform($, req)`. That gives one place where a
// failure becomes "stale since hh:mm" for that source only, and parsers that tests feed real
// text without the test kit. A process argv can only be an `Argv` from commands.ts.

import type { Argv } from './commands.ts'
import { FIXED_REPOS, configPathOf, parseOrigin, parsePrList, prListReq } from './github.ts'
import { paneGetReq, parsePaneLabel, parseSnapshot, snapshotReq } from './herdr.ts'
import { inboxFile } from './dispatch.ts'
import type { Branches, GithubView, HeadPaths, InboxFile, Ms, Origins, Pane, PaneId, PaneLabels, Polled, Pr, SourceId, SourceValues, SpaceMap, World } from './model.ts'

/** One outside read. `perform($, req)` in register.ts is the only code that turns these into `$` calls. */
export type Req = { k: 'proc'; argv: Argv; timeoutMs: number } | { k: 'read'; path: string } | { k: 'list'; path: string }

/** What came back, already reduced to text so parsers never see a `$` result type. A `list` answers `Listing` as JSON. */
export type Resp = { k: 'ok'; text: string } | { k: 'fail'; error: string }

/**
 * One polled source. `plan` may read sources polled before it in this tick. `read` gets one
 * Resp per planned Req, in order, and returns undefined to mean "unusable", which marks the
 * source stale (or down, if it never answered).
 */
export type Source<T> = {
  everyMs: Ms
  plan(world: World): Req[]
  /** Reads that depend on `plan`'s answers. `read` gets plan's Resps, then these, in order. */
  follow?(world: World, resps: readonly Resp[]): Req[]
  read(world: World, resps: readonly Resp[]): T | undefined
}

/** One directory entry, as `perform` reduces `$.fs.list`. A folder that does not exist lists `[]`. */
export type Listing = Array<{ name: string; kind: string; mtimeMs: number }>

/** The heartbeat period: the shortest `everyMs`. One timer drives every source. */
export const HEARTBEAT_MS = 5000

/** Poll order. A source's `plan` reads only sources earlier in this list. */
export const SOURCE_ORDER = ['herdr', 'labels', 'spaces', 'heads', 'branches', 'origins', 'github', 'inbox'] as const
export type PolledId = (typeof SOURCE_ORDER)[number]

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
export function due(lastRun: Partial<Record<SourceId, Ms>>, now: Ms): PolledId[] {
  // Timer callbacks drift a few ms either way; without the slack a 5 s source would skip alternate beats.
  const slack = HEARTBEAT_MS / 2
  return SOURCE_ORDER.filter((id) => {
    const last = lastRun[id]
    return last === undefined || now - last >= SOURCES[id].everyMs - slack
  })
}

const ok = (r: Resp | undefined): string | undefined => (r?.k === 'ok' ? r.text : undefined)

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

export const workflowPath = (home: string): string => `${home}/.agents/skills/workspace/references/WORKFLOW.md`

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
export function reposOf(world: World): string[] {
  const origins = valueOf(world.sources.origins)
  return [...new Set([...FIXED_REPOS, ...configPaths(world).flatMap((path) => origins?.get(path) ?? [])])]
}

// ── $TMPDIR/dispatch/out, main's inbox ───────────────────────────────────────────────────────

/** macOS's TMPDIR ends in `/`. No TMPDIR, no inbox. */
export const inboxDir = (tmp: string): string | undefined => (tmp === '' ? undefined : `${tmp.replace(/\/+$/, '')}/dispatch/out`)

function listingOf(r: Resp | undefined): Listing | undefined {
  const text = ok(r)
  if (text === undefined) return undefined
  try {
    const parsed: unknown = JSON.parse(text)
    return Array.isArray(parsed) ? (parsed as Listing) : undefined
  } catch {
    return undefined
  }
}

/** `THV-n.md` files only: other names (`w40-p1.md`) name no ticket, so no row can show them. */
const ticketFiles = (listing: Listing): Listing => listing.filter((e) => e.kind === 'file' && /^THV-\d+\.md$/i.test(e.name))

/** Files not yet read at this mtime. An unchanged file keeps its last read, so a 46 KB deliverable is read once. */
function unread(world: World, listing: Listing): Listing {
  const known = valueOf(world.sources.inbox) ?? []
  return ticketFiles(listing).filter((e) => !known.some((f) => f.name === e.name && f.at === e.mtimeMs))
}

// ── The registry ─────────────────────────────────────────────────────────────────────────────

export const SOURCES: { [K in PolledId]: Source<SourceValues[K]> } = {
  herdr: {
    everyMs: HEARTBEAT_MS,
    plan: () => [snapshotReq()],
    read: (_world, [r]) => {
      const text = ok(r)
      return text === undefined ? undefined : parseSnapshot(text)
    },
  },

  // ADR4: each pane's label is read once and kept until that pane's tab label or title changes.
  // A failed read keeps the old entry, so the pane is tried again next tick.
  labels: {
    everyMs: HEARTBEAT_MS,
    plan: (world) => toRead(world).map((p) => paneGetReq(p.pane)),
    read: (world, resps): PaneLabels => {
      const cache = valueOf(world.sources.labels)?.byPane
      const byPane = new Map<PaneId, { seen: string; label: string | undefined }>()
      for (const p of unlabelled(world)) {
        const kept = cache?.get(p.pane)
        if (kept) byPane.set(p.pane, kept)
      }
      toRead(world).forEach((p, i) => {
        const text = ok(resps[i])
        if (text !== undefined) byPane.set(p.pane, { seen: seenOf(p), label: parsePaneLabel(text) })
      })
      return { byPane }
    },
  },

  spaces: {
    everyMs: 5 * 60_000,
    plan: (world) => [{ k: 'read', path: workflowPath(world.me.home) }],
    read: (_world, [r]) => {
      const text = ok(r)
      return text === undefined ? undefined : parseLiveSpaces(text)
    },
  },

  heads: {
    everyMs: HEARTBEAT_MS,
    plan: (world) => {
      const known = valueOf(world.sources.heads)
      return trackedCwds(world)
        .filter((cwd) => !known?.has(cwd))
        .map((cwd) => ({ k: 'read', path: `${cwd}/.git` }))
    },
    read: (world, resps): HeadPaths => {
      const known = valueOf(world.sources.heads)
      const heads = new Map(known)
      trackedCwds(world)
        .filter((cwd) => !known?.has(cwd))
        .forEach((cwd, i) => heads.set(cwd, headPathOf(cwd, ok(resps[i]))))
      return heads
    },
  },

  branches: {
    everyMs: HEARTBEAT_MS,
    plan: (world) => [...(valueOf(world.sources.heads) ?? new Map<string, string>()).values()].map((path) => ({ k: 'read', path })),
    read: (world, resps): Branches => {
      const branches = new Map<string, string>()
      ;[...(valueOf(world.sources.heads) ?? new Map<string, string>()).keys()].forEach((cwd, i) => {
        const text = ok(resps[i])
        const branch = text === undefined ? undefined : parseHead(text)
        if (branch) branches.set(cwd, branch)
      })
      return branches
    },
  },

  origins: {
    everyMs: HEARTBEAT_MS,
    plan: (world) => unreadConfigs(world).map((path) => ({ k: 'read', path })),
    read: (world, resps): Origins => {
      const origins = new Map(valueOf(world.sources.origins))
      unreadConfigs(world).forEach((path, i) => {
        const text = ok(resps[i])
        origins.set(path, text === undefined ? undefined : parseOrigin(text))
      })
      return origins
    },
  },

  // One `gh pr list` per repo. Any repo failing marks the whole source stale, so the PR and CI
  // cells keep the last full answer rather than mixing two polls.
  github: {
    everyMs: 60_000,
    plan: (world) => reposOf(world).map(prListReq),
    read: (world, resps): GithubView | undefined => {
      const prs: Pr[] = []
      for (const [i, repo] of reposOf(world).entries()) {
        const text = ok(resps[i])
        const list = text === undefined ? undefined : parsePrList(repo, text)
        if (!list) return undefined
        prs.push(...list)
      }
      return { prs }
    },
  },

  inbox: {
    everyMs: 10_000,
    plan: (world) => {
      const dir = inboxDir(world.me.tmp)
      return dir === undefined ? [] : [{ k: 'list', path: dir }]
    },
    follow: (world, [list]) => {
      const dir = inboxDir(world.me.tmp)
      const listing = listingOf(list)
      return dir === undefined || !listing ? [] : unread(world, listing).map((e) => ({ k: 'read', path: `${dir}/${e.name}` }))
    },
    read: (world, [list, ...reads]): InboxFile[] | undefined => {
      if (inboxDir(world.me.tmp) === undefined) return []
      const listing = listingOf(list)
      if (!listing) return undefined
      const known = valueOf(world.sources.inbox) ?? []
      const fresh = unread(world, listing)
      return ticketFiles(listing).flatMap((e) => {
        const i = fresh.findIndex((f) => f.name === e.name)
        if (i < 0) return known.filter((f) => f.name === e.name && f.at === e.mtimeMs)
        const text = ok(reads[i])
        return text === undefined ? [] : [inboxFile(e.name, text, e.mtimeMs)]
      })
    },
  },
}
