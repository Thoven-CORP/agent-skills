// board.ts: World → Board. Which pane goes in which slot, and the rows that makes.
//
// Pure and total: every World, however stale or half-empty, gives a Board. A failed source
// keeps its last answer, which view.ts dims in the columns naming it, and leaves the others drawing.
// Each row's cells and unrecorded events come from cells.ts, its PRs from prs.ts.
//
// The slot fold:
//   1. Space panes: snapshot panes with `space === me.space`, minus main's own pane.
//   2. Each pane's label, first match wins: pane label (snapshot, else `herdr pane get`), tab
//      label, terminal title, then the `thv-(\d+)` of the branch its folder is on. A label naming
//      several tickets gives one row per ticket, sharing the pane.
//   3. A Build or Fix label, or an older label that names a ticket and no Kind, is a Build row.
//      A second pane on the same ticket joins that row's Pane cell. A Review pane is the verifier
//      of each of its tickets' Build rows; a ticket it names with no Build row gets a Review row
//      on that pane. Everything else is an Other item; a pane with neither a label nor an agent
//      (a plain shell) is not shown.
//      A pane whose label names no ticket takes its tickets from the briefs its current session
//      received, else from the newest send.sh call main made to it: a hand-typed or self-brief
//      ties a pane as surely as a label (spec "Failure handling").
//   4. Main's own branch ticket, when no row has it yet, is the "this session" row.

import { branchTicket, pickLabel } from './dispatch.ts'
import { indexFacts, newest, type BoardFacts } from './facts.ts'
import { rowOf } from './cells.ts'
import { prJoin } from './prs.ts'
import type { Board, Branches, Health, Kind, LivePane, NonEmpty, OtherItem, Pane, PaneCell, PaneLabels, Panes, Polled, RowIdentity, SourceHealth, SourceId, Sources, SpaceMap, Ticket, World } from './model.ts'
import { valueOf } from './sources.ts'

/** What ties a pane to its work: its label, else its folder's branch, else what main sent it. */
type Tie = { kind: Kind | undefined; title: string; tickets: Ticket[]; origin: 'label' | 'branch' | 'dispatch' }

/** Where a pane goes on the board. A shell (no tie, no agent) goes nowhere. */
type Slot = { k: 'build' | 'review'; tie: Tie; pane: Pane } | { k: 'other'; tie: Tie | undefined; pane: Pane } | { k: 'shell' }

/** The slot a tie naming a ticket takes, by its Kind. A tie with no Kind is an older Build label. */
const SLOT_OF_KIND: Record<Kind, 'build' | 'review' | 'other'> = { Build: 'build', Fix: 'build', Review: 'review', Meta: 'other', Plan: 'other', Design: 'other', Research: 'other', Audit: 'other' }

function slotOf(tie: Tie | undefined, p: Pane): Slot {
  if (tie === undefined) return p.agent ? { k: 'other', tie, pane: p } : { k: 'shell' }
  if (tie.tickets.length === 0) return { k: 'other', tie, pane: p }
  return { k: tie.kind === undefined ? 'build' : SLOT_OF_KIND[tie.kind], tie, pane: p }
}

export function project(world: World): Board {
  const { me } = world
  const snap = valueOf(world.sources.herdr)
  const labels = valueOf(world.sources.labels)?.byPane
  const space = snap?.spaces.find((s) => s.space === me.space) ?? { space: me.space, label: me.space }
  const projectName = projectOf(valueOf(world.sources.spaces), space.label)

  const panes = (snap?.panes ?? []).filter((p) => p.space === me.space && p.pane !== me.pane)
  const branches = valueOf(world.sources.branches)
  const facts = indexFacts(world.facts)

  // A Build row is ordered by its first Build pane, a Review-only row after them all by its first Review pane.
  const builds = new Map<Ticket, { tie: Tie; panes: NonEmpty<LivePane> }>()
  const reviews = new Map<Ticket, { tie: Tie; pane: Pane; verifier: Pane }>()
  const other: OtherItem[] = []
  for (const s of panes.map((p) => slotOf(tieOf(facts.all, p, labels, branches), p))) {
    if (s.k === 'build')
      for (const t of s.tie.tickets) {
        const b = builds.get(t)
        if (b) b.panes.push(live(s.pane))
        else builds.set(t, { tie: s.tie, panes: [live(s.pane)] })
      }
    else if (s.k === 'review')
      for (const t of s.tie.tickets) {
        const r = reviews.get(t)
        reviews.set(t, { tie: r?.tie ?? s.tie, pane: r?.pane ?? s.pane, verifier: s.pane })
      }
    else if (s.k === 'other') other.push(otherItem(s.tie, s.pane))
  }

  const verifierOf = (t: Ticket): PaneCell => {
    const v = reviews.get(t)?.verifier
    return v ? cell(v) : { k: 'none' }
  }
  const ids = [
    ...[...builds].map(([t, b]) => holding(t, b.tie, { k: 'live', list: b.panes }, verifierOf(t))),
    ...[...reviews].filter(([t]) => !builds.has(t)).map(([t, r]) => holding(t, r.tie, { k: 'live', list: [live(r.pane)] }, verifierOf(t))),
  ]
  const mine = thisSession(world, snap?.panes.find((p) => p.pane === me.pane))
  if (mine && !ids.some((id) => id.ticket === mine.ticket)) ids.push(mine)

  const join = prJoin(world, panes, ids)
  const inbox = valueOf(world.sources.inbox) ?? []
  const rows = ids.map((id) => rowOf(id, { facts: facts.about(id.ticket), inbox, join }))

  return {
    space,
    project: projectName,
    here: undefined,
    build: rows.map(({ row }) => ({ k: 'single', row })),
    other,
    prs: join.groups(),
    pending: [],
    health: health(world.sources),
    working: panes.filter((p) => p.status === 'working').map((p) => p.pane),
    newEvents: rows.flatMap(({ events }) => events),
  }
}

/**
 * A pane's label when it names a ticket; else, when no label matched, the ticket its folder's
 * branch names; else what it was sent; else its ticketless label.
 */
function tieOf(facts: BoardFacts, p: Pane, labels: PaneLabels['byPane'] | undefined, branches: Branches | undefined): Tie | undefined {
  const label = pickLabel([p.paneLabel ?? labels?.get(p.pane)?.label, p.tabLabel, p.terminalTitle])
  if (label && label.tickets.length > 0) return { ...label, origin: 'label' }
  const branch = label === undefined ? branches?.get(p.cwd) : undefined
  const t = branch === undefined ? undefined : branchTicket(branch)
  if (t && branch) return { kind: undefined, title: branch, tickets: [t], origin: 'branch' }
  return dispatchTie(facts, p) ?? (label && { ...label, origin: 'label' })
}

const otherItem = (tie: Tie | undefined, p: Pane): OtherItem =>
  tie ? { k: 'labelled', title: tie.title, kind: tie.kind, ticket: tie.tickets[0], pane: cell(p) } : { k: 'unlabelled', tab: p.tabLabel ?? p.tab, pane: cell(p) }

/**
 * What a pane with no ticket in its label was sent: the briefs its current session received (a
 * /clear starts over), else the newest send.sh call main made to it.
 */
function dispatchTie(facts: BoardFacts, p: Pane): Tie | undefined {
  const briefs = facts.brief.filter((f) => f.pane === p.pane && f.sid === p.sid)
  const latest = newest(briefs)
  if (latest) {
    const titled = newest(briefs.filter((b) => b.title !== undefined))
    return {
      kind: latest.k === 'first' && latest.role === 'verifier' ? 'Review' : latest.labelKind,
      title: titled?.title ?? p.terminalTitle ?? latest.ticket,
      tickets: [...new Set(briefs.map((b) => b.ticket))],
      origin: 'dispatch',
    }
  }
  const sent = newest(facts.send.filter((f) => f.pane === p.pane))
  return sent ? { kind: sent.role === 'verifier' ? 'Review' : undefined, title: p.terminalTitle ?? sent.ticket, tickets: [sent.ticket], origin: 'dispatch' } : undefined
}


/** The row for work main does itself: its branch names a ticket no pane holds. */
function thisSession(world: World, mainPane: Pane | undefined): RowIdentity | undefined {
  const branch = valueOf(world.sources.branches)?.get(world.me.cwd)
  const t = branch === undefined ? undefined : branchTicket(branch)
  if (!t || !branch) return undefined
  const label = pickLabel([mainPane?.paneLabel, mainPane?.tabLabel])
  const named = label?.tickets.includes(t) ? label : undefined
  const panes: Panes = mainPane ? { k: 'live', list: [live(mainPane)] } : { k: 'none' }
  return holding(t, { kind: named?.kind, title: named?.title ?? mainPane?.terminalTitle ?? branch, origin: 'this-session' }, panes, { k: 'none' })
}

const holding = (ticket: Ticket, by: Pick<RowIdentity, 'kind' | 'title' | 'origin'>, panes: Panes, verifierPane: PaneCell): RowIdentity => ({ ticket, title: by.title, kind: by.kind, origin: by.origin, panes, verifierPane })

/** herdr's space label and WORKFLOW.md's `COPPA` differ in case (`Coppa`), so the match ignores it. */
function projectOf(spaces: SpaceMap | undefined, label: string): string | undefined {
  const want = label.toLowerCase()
  for (const [space, name] of spaces ?? []) if (space.toLowerCase() === want) return name
  return undefined
}

const live = (p: Pane): LivePane => ({ status: p.status, tool: p.tool, pane: p.pane })
const cell = (p: Pane): PaneCell => ({ k: 'live', ...live(p) })

/** Each entry is the first of its sources, in poll order, that is not ok. */
function health(sources: Sources): Health {
  const of = (...ids: SourceId[]): SourceHealth => {
    const p = ids.map((id): Polled<unknown> => sources[id]).find((s) => s.k === 'stale' || s.k === 'down')
    return p?.k === 'stale' ? { k: 'stale', since: p.since } : p?.k === 'down' ? { k: 'unavailable' } : { k: 'ok' }
  }
  return { herdr: of('herdr'), labels: of('labels'), spaces: of('spaces'), git: of('heads', 'branches', 'origins'), github: of('github'), inbox: of('inbox') }
}
