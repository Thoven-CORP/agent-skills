// sources.ts: every outside read the cockpit makes, described as data.
//
// The mods validator only lets `$` reach top-level functions of register.ts, so effects live
// there. Each source here says what to ask (`plan`) and how to read the answers (`read`), and
// register.ts runs them through one executor, `perform($, req)`. That gives one place where a
// failure becomes "stale since hh:mm" for that source only, and parsers that tests feed real
// text without the test kit. A process argv can only be an `Argv` from commands.ts.

import type { Argv } from './commands.ts'
import { paneGetReq, parsePaneLabel, parseSnapshot, snapshotReq } from './herdr.ts'
import type { Branches, HeadPaths, Ms, Pane, PaneId, PaneLabels, Polled, SourceId, SourceValues, SpaceMap, World } from './model.ts'

/** One outside read. `perform($, req)` in register.ts is the only code that turns these into `$` calls. */
export type Req = { k: 'proc'; argv: Argv; timeoutMs: number } | { k: 'read'; path: string }

/** What came back, already reduced to text so parsers never see a `$` result type. */
export type Resp = { k: 'ok'; text: string } | { k: 'fail'; error: string }

/**
 * One polled source. `plan` may read sources polled before it in this tick. `read` gets one
 * Resp per planned Req, in order, and returns undefined to mean "unusable", which marks the
 * source stale (or down, if it never answered).
 */
export type Source<T> = {
  everyMs: Ms
  plan(world: World): Req[]
  read(world: World, resps: readonly Resp[]): T | undefined
}

/** The heartbeat period: the shortest `everyMs`. One timer drives every source. */
export const HEARTBEAT_MS = 5000

/** Poll order. A source's `plan` reads only sources earlier in this list. */
export const SOURCE_ORDER = ['herdr', 'labels', 'spaces', 'heads', 'branches'] as const
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

const readSetOf = (panes: readonly Pane[]): string => panes.map((p) => p.pane).sort().join(',')

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

  // ADR4: a pane's label is read once and kept until the set of unlabelled panes changes.
  labels: {
    everyMs: HEARTBEAT_MS,
    plan: (world) => {
      const panes = unlabelled(world)
      return valueOf(world.sources.labels)?.readSet === readSetOf(panes) ? [] : panes.map((p) => paneGetReq(p.pane))
    },
    read: (world, resps): PaneLabels => {
      const panes = unlabelled(world)
      const prev = valueOf(world.sources.labels)
      if (prev && prev.readSet === readSetOf(panes)) return prev
      const byPane = new Map<PaneId, string>()
      const answered: Pane[] = []
      panes.forEach((p, i) => {
        const text = ok(resps[i])
        if (text === undefined) return
        answered.push(p)
        const label = parsePaneLabel(text)
        if (label) byPane.set(p.pane, label)
      })
      return { readSet: readSetOf(answered), byPane }
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
}
