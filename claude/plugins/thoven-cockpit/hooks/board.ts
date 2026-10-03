// board.ts: World → Board. The one place tickets are joined.
//
// Pure and total: every World, however stale or half-empty, gives a Board. A failed source
// makes its own cells stale and leaves the others drawing.
//
// The join, as far as S1 reaches:
//   1. Space panes: snapshot panes with `space === me.space`, minus main's own pane.
//   2. Each pane's label, first match wins: pane label (snapshot, else `herdr pane get`), tab
//      label, terminal title. A label naming several tickets gives one row per ticket, sharing
//      the pane.
//   3. A Build or Fix label, or an older label that names a ticket and no Kind, is a Build row.
//      A second pane on the same ticket joins that row's Pane cell. A Review pane is the verifier
//      of each of its tickets' Build rows; a ticket it names with no Build row gets a Review row
//      on that pane. Everything else is an Other item; a pane with neither a label nor an agent
//      (a plain shell) is not shown.
//   4. Main's own branch ticket, when no row has it yet, is the "this session" row.

import { branchTicket, pickLabel } from './dispatch.ts'
import type { Board, Health, Kind, Label, OtherItem, Pane, PaneCell, Polled, Row, SourceId, Sources, SpaceMap, Ticket, World } from './model.ts'
import { valueOf } from './sources.ts'

const BUILD_KINDS: ReadonlyArray<Kind | undefined> = ['Build', 'Fix', undefined]

export function project(world: World): Board {
  const { me } = world
  const snap = valueOf(world.sources.herdr)
  const labels = valueOf(world.sources.labels)?.byPane
  const space = snap?.spaces.find((s) => s.space === me.space) ?? { space: me.space, label: me.space }
  const projectName = projectOf(valueOf(world.sources.spaces), space.label)

  const panes = (snap?.panes ?? []).filter((p) => p.space === me.space && p.pane !== me.pane)
  const labelled = panes.map((p) => ({ p, label: pickLabel([p.paneLabel ?? labels?.get(p.pane), p.tabLabel, p.terminalTitle], undefined) }))

  const rows = new Map<Ticket, Row>()
  for (const { p, label } of labelled) {
    if (!label || !BUILD_KINDS.includes(label.kind)) continue
    for (const t of label.tickets) {
      const r = rows.get(t)
      rows.set(t, r ? { ...r, extraPanes: [...r.extraPanes, live(p)] } : row(t, label, 'label', live(p), projectName))
    }
  }

  for (const { p, label } of labelled) {
    if (label?.kind !== 'Review') continue
    for (const t of label.tickets) rows.set(t, { ...(rows.get(t) ?? row(t, label, 'label', live(p), projectName)), verifierPane: live(p) })
  }

  const other: OtherItem[] = []
  for (const { p, label } of labelled) {
    if (label && (BUILD_KINDS.includes(label.kind) || label.kind === 'Review') && label.tickets.length > 0) continue
    if (label) other.push({ label: label.title, kind: label.kind, ticket: label.tickets[0], pane: live(p), note: undefined })
    else if (p.agent) other.push({ label: `tab "${p.tabLabel ?? p.tab}"`, kind: undefined, ticket: undefined, pane: live(p), note: 'unlabelled' })
  }

  const mine = thisSession(world, snap?.panes.find((p) => p.pane === me.pane), projectName)
  if (mine && !rows.has(mine.ticket)) rows.set(mine.ticket, mine)

  return {
    space,
    project: projectName,
    here: undefined,
    build: [...rows.values()].map((r) => ({ k: 'single', row: r })),
    other,
    prs: { project: [], space: [] },
    pending: [],
    health: health(world.sources),
    working: panes.filter((p) => p.status === 'working').map((p) => p.pane),
  }
}

/** The row for work main does itself: its branch names a ticket no pane holds. */
function thisSession(world: World, mainPane: Pane | undefined, projectName: string | undefined): Row | undefined {
  const branch = valueOf(world.sources.branches)?.get(world.me.cwd)
  const t = branch === undefined ? undefined : branchTicket(branch)
  if (!t || !branch) return undefined
  const label = pickLabel([mainPane?.paneLabel, mainPane?.tabLabel], undefined)
  const title = label?.tickets.includes(t) ? label.title : (mainPane?.terminalTitle ?? branch)
  return row(t, { kind: label?.tickets.includes(t) ? label.kind : undefined, title, tickets: [t] }, 'this-session', mainPane ? live(mainPane) : { k: 'none' }, projectName)
}

function row(ticket: Ticket, label: Label, origin: Row['origin'], pane: PaneCell, projectName: string | undefined): Row {
  return {
    ticket,
    title: label.title,
    kind: label.kind,
    origin,
    pane,
    extraPanes: [],
    verifierPane: { k: 'none' },
    report: { k: 'none' },
    fix: { k: 'none' },
    review: { k: 'none', offer: undefined },
    pr: { k: 'none' },
    ci: { k: 'none' },
    linear: projectName === undefined ? { k: 'hidden' } : { k: 'none' },
  }
}

/** herdr's space label and WORKFLOW.md's `COPPA` differ in case (`Coppa`), so the match ignores it. */
function projectOf(spaces: SpaceMap | undefined, label: string): string | undefined {
  const want = label.toLowerCase()
  for (const [space, name] of spaces ?? []) if (space.toLowerCase() === want) return name
  return undefined
}

const live = (p: Pane): Extract<PaneCell, { k: 'live' }> => ({ k: 'live', status: p.status, tool: p.tool, pane: p.pane })

function health(sources: Sources): Health {
  const of = (p: Polled<unknown>): Health[SourceId] =>
    p.k === 'stale' ? { k: 'stale', since: p.since } : p.k === 'down' ? { k: 'unavailable' } : { k: 'ok' }
  return {
    herdr: of(sources.herdr),
    labels: of(sources.labels),
    spaces: of(sources.spaces),
    heads: of(sources.heads),
    branches: of(sources.branches),
    github: of(sources.github),
    linear: of(sources.linear),
    inbox: of(sources.inbox),
    codex: of(sources.codex),
  }
}
