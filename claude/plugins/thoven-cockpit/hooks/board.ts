// board.ts: World → Board. The one place tickets are joined.
//
// Pure and total: every World, however stale or half-empty, gives a Board. A failed source
// makes its own cells stale and leaves the others drawing.
//
// The join, as far as S1 reaches:
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
//   5. Per row: Report is the newest report fact by `at`, from whichever session received it,
//      unless the inbox still holds a newer file for the ticket (unsent, or herdr's escalation
//      note). Fix is main's highest send.sh fix round, else the pane's highest FIX ROUND brief.
//   6. PRs attach to a row by branch, then by ticket (design: "branch ticket ∪ the title's
//      trailing `(…)` group only"). A PR whose head branch is checked out in one of the row's
//      folders (in the same repo, when the folder's origin is known) wins; else a PR whose
//      `tickets` name the row's. Open beats merged beats closed. When panes of several tickets sit
//      on that branch, each of their PR cells says `in #N`.
//   7. Every report status a row's ticket has had, and every merged PR attached to it, with no
//      `happened` fact yet, is a new event for main to record once (synthesis A1), so S4's ↻
//      survives a later report replacing it or the PR falling out of gh's last 50.

import { branchTicket, labelOfBranch, pickLabel } from './dispatch.ts'
import { factsOf } from './facts.ts'
import { configPathOf } from './github.ts'
import {
  isOneOf,
  type Board,
  type CiCell,
  type Fact,
  type FactOf,
  type FixCell,
  type Health,
  type InboxFile,
  type Kind,
  type Label,
  type LinearEventId,
  type OtherItem,
  type Pane,
  type PaneCell,
  type PaneId,
  type Pending,
  type Polled,
  type Pr,
  type PrCell,
  type PrGroup,
  type ReportCell,
  type Row,
  type Sources,
  type SpaceMap,
  type Ticket,
  type World,
} from './model.ts'
import { bySource, valueOf } from './sources.ts'

const BUILD_KINDS: ReadonlyArray<Kind | undefined> = ['Build', 'Fix', undefined]

export function project(world: World): Board {
  const { me } = world
  const snap = valueOf(world.sources.herdr)
  const labels = valueOf(world.sources.labels)?.byPane
  const space = snap?.spaces.find((s) => s.space === me.space) ?? { space: me.space, label: me.space }
  const projectName = projectOf(valueOf(world.sources.spaces), space.label)

  const panes = (snap?.panes ?? []).filter((p) => p.space === me.space && p.pane !== me.pane)
  const branches = valueOf(world.sources.branches)
  const labelled = panes.map((p) => {
    const label = pickLabel([p.paneLabel ?? labels?.get(p.pane)?.label, p.tabLabel, p.terminalTitle]) ?? labelOfBranch(branches?.get(p.cwd))
    if (label && label.tickets.length > 0) return { p, label, origin: 'label' as const }
    const tied = tiedLabel(world.facts, p)
    return tied ? { p, label: tied, origin: 'dispatch' as const } : { p, label, origin: 'label' as const }
  })

  const rows = new Map<Ticket, Row>()
  for (const { p, label, origin } of labelled) {
    if (!label || !BUILD_KINDS.includes(label.kind)) continue
    for (const t of label.tickets) {
      const r = rows.get(t)
      rows.set(t, r ? { ...r, extraPanes: [...r.extraPanes, live(p)] } : row(t, label, origin, live(p), projectName))
    }
  }

  for (const { p, label, origin } of labelled) {
    if (label?.kind !== 'Review') continue
    for (const t of label.tickets) rows.set(t, { ...(rows.get(t) ?? row(t, label, origin, live(p), projectName)), verifierPane: live(p) })
  }

  const other: OtherItem[] = []
  for (const { p, label } of labelled) {
    if (label && (BUILD_KINDS.includes(label.kind) || label.kind === 'Review') && label.tickets.length > 0) continue
    if (label) other.push({ label: label.title, kind: label.kind, ticket: label.tickets[0], pane: live(p), note: undefined })
    else if (p.agent) other.push({ label: `tab "${p.tabLabel ?? p.tab}"`, kind: undefined, ticket: undefined, pane: live(p), note: 'unlabelled' })
  }

  const mine = thisSession(world, snap?.panes.find((p) => p.pane === me.pane), projectName)
  if (mine && !rows.has(mine.ticket)) rows.set(mine.ticket, mine)

  const inbox = valueOf(world.sources.inbox) ?? []
  const join = prJoin(world, panes, [...rows.values()])
  for (const [t, r] of rows) {
    const pr = join.cell(t)
    rows.set(t, { ...r, report: reportCell(t, world.facts, inbox), fix: fixCell(t, world.facts), pr, ci: pr.k === 'none' ? { k: 'none' } : ciCell(pr.pr) })
  }

  return {
    space,
    project: projectName,
    here: undefined,
    build: [...rows.values()].map((r) => ({ k: 'single', row: r })),
    other,
    prs: join.groups(),
    pending: [],
    health: health(world.sources),
    working: panes.filter((p) => p.status === 'working').map((p) => p.pane),
    newEvents: [...rows.keys()].flatMap((t) => [...newReportEvents(t, world.facts), ...newMergedEvents(t, join.attached(t), world.facts)]),
  }
}

// ── PRs ──────────────────────────────────────────────────────────────────────────────────────

/** A folder on a branch. `repo` is its origin, undefined until (or unless) its config names one. */
type Place = { repo: string | undefined; branch: string }

const STATE_RANK: Record<Pr['state'], number> = { OPEN: 0, MERGED: 1, CLOSED: 2 }
const best = (prs: readonly Pr[]): Pr | undefined => [...prs].sort((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state])[0]
const keyOf = (pr: Pr): string => `${pr.repo}#${pr.number}`
const isOn = (pr: Pr, places: readonly Place[]): boolean => places.some((p) => p.branch === pr.branch && (p.repo === undefined || p.repo === pr.repo))

/**
 * Where each row's panes are, and which PRs that ties to it. A stale gh source still joins on its
 * last answer; a gh that never answered joins nothing.
 */
function prJoin(world: World, panes: readonly Pane[], rows: readonly Row[]) {
  const prs = valueOf(world.sources.github)?.prs ?? []
  const heads = valueOf(world.sources.heads)
  const branches = valueOf(world.sources.branches)
  const origins = valueOf(world.sources.origins)
  const placeOf = (cwd: string): Place[] => {
    const branch = branches?.get(cwd)
    const head = heads?.get(cwd)
    return branch === undefined ? [] : [{ repo: head === undefined ? undefined : origins?.get(configPathOf(head)), branch }]
  }
  // Main's own folder is its session cwd, which the snapshot may not show.
  const cwdOf = new Map<PaneId, string>([...panes.map((p): [PaneId, string] => [p.pane, p.cwd]), [world.me.pane, world.me.cwd]])
  const placesOf = (r: Row): Place[] =>
    [r.pane, ...r.extraPanes, r.verifierPane].flatMap((c) => {
      const cwd = c.k === 'live' ? cwdOf.get(c.pane) : undefined
      return cwd === undefined ? [] : placeOf(cwd)
    })
  const places = new Map(rows.map((r) => [r.ticket, placesOf(r)]))

  const byBranch = (t: Ticket) => prs.filter((pr) => isOn(pr, places.get(t) ?? []))
  const byTicket = (t: Ticket) => prs.filter((pr) => pr.tickets.includes(t))
  const attached = (t: Ticket): Pr[] => [...new Set([...byBranch(t), ...byTicket(t)])]

  const cell = (t: Ticket): PrCell => {
    const onBranch = best(byBranch(t))
    if (onBranch) return rows.filter((r) => isOn(onBranch, places.get(r.ticket) ?? [])).length > 1 ? { k: 'shared', pr: onBranch } : { k: 'own', pr: onBranch }
    const named = best(byTicket(t))
    return named ? { k: 'own', pr: named } : { k: 'none' }
  }

  /** Each PR once, with the rows it attached to, plus ticketless PRs on any space folder's branch. */
  const groups = (): PrGroup[] => {
    const tickets = new Map<string, Ticket[]>()
    for (const r of rows) for (const pr of attached(r.ticket)) tickets.set(keyOf(pr), [...(tickets.get(keyOf(pr)) ?? []), r.ticket])
    const spacePlaces = [...cwdOf.values()].flatMap(placeOf)
    for (const pr of prs) if (pr.tickets.length === 0 && !tickets.has(keyOf(pr)) && isOn(pr, spacePlaces)) tickets.set(keyOf(pr), [])
    const out: PrGroup[] = []
    for (const pr of prs) {
      const ts = tickets.get(keyOf(pr))
      if (ts === undefined) continue
      let group = out.find((g) => g.repo === pr.repo)
      if (!group) {
        group = { repo: pr.repo, items: [] }
        out.push(group)
      }
      group.items.push({ pr, tickets: ts })
    }
    return out
  }

  return { cell, attached, groups }
}

/** Any failed check fails CI, even while others run. A PR with no checks has no CI cell. */
export function ciCell(pr: Pr): CiCell {
  const { total, done, failed } = pr.checks
  if (total === 0) return { k: 'none' }
  if (failed.length > 0) return { k: 'fail', failed: failed.length }
  return done < total ? { k: 'running', done, total } : { k: 'pass' }
}

/** `merged <n>` for each merged PR attached to the ticket, not yet recorded. */
function newMergedEvents(t: Ticket, prs: readonly Pr[], facts: readonly Fact[]): Pending[] {
  const recorded = new Set(factsOf(facts, 'happened', t).map((f) => f.event))
  const ids = new Set<string>()
  return prs.flatMap((pr) => {
    const id = `merged-${pr.number}` as LinearEventId
    if (pr.state !== 'MERGED' || recorded.has(id) || ids.has(id)) return []
    ids.add(id)
    return [{ ticket: t, event: { k: 'merged', number: pr.number }, id }]
  })
}

const newest = <F extends { at: number }>(fs: readonly F[]): F | undefined => fs.reduce<F | undefined>((a, f) => (a === undefined || f.at > a.at ? f : a), undefined)

/**
 * The label a pane with no ticket in its label gets from what it was sent: the briefs its current
 * session received (a /clear starts over), else the newest send.sh call main made to it.
 */
function tiedLabel(facts: readonly Fact[], p: Pane): Label | undefined {
  const briefs = facts.filter((f): f is FactOf<'brief'> => f.kind === 'brief' && f.pane === p.pane && f.sid === p.sid)
  const latest = newest(briefs)
  if (latest) {
    const titled = newest(briefs.filter((b) => b.title !== undefined))
    return {
      kind: latest.k === 'first' && latest.role === 'verifier' ? 'Review' : latest.labelKind,
      title: titled?.title ?? p.terminalTitle ?? latest.ticket,
      tickets: [...new Set(briefs.map((b) => b.ticket))],
    }
  }
  const sent = newest(facts.filter((f): f is FactOf<'send'> => f.kind === 'send' && f.pane === p.pane))
  return sent ? { kind: sent.role === 'verifier' ? 'Review' : undefined, title: p.terminalTitle ?? sent.ticket, tickets: [sent.ticket] } : undefined
}

function reportCell(t: Ticket, facts: readonly Fact[], inbox: readonly InboxFile[]): ReportCell {
  const report = newest(factsOf(facts, 'report', t))
  // An undelivered verdict is the verifier's, so it waits for the Review cell (S3), never this one.
  const file = newest(inbox.filter((f) => f.ticket === t && (f.k === 'report' || f.k === 'escalation') && (report === undefined || f.at > report.at)))
  if (file?.k === 'report') return { k: 'undelivered', status: file.line.word, file: file.name, selfChecked: false }
  if (file?.k === 'escalation') return { k: 'escalation', head: file.head }
  return report ? { k: 'in', status: report.status, at: report.at, concerns: report.concerns, selfChecked: false } : { k: 'none' }
}

function fixCell(t: Ticket, facts: readonly Fact[]): FixCell {
  const top = (rounds: number[]) => rounds.reduce((a, b) => Math.max(a, b), 0)
  const sent = top(factsOf(facts, 'send', t).filter((f) => f.role === 'builder').map((f) => f.round))
  if (sent > 0) return { k: 'round', round: sent, of: 5 }
  const fixes = factsOf(facts, 'brief', t).flatMap((f) => (f.k === 'fix' && f.round > 0 ? [f] : []))
  const fix = fixes.reduce<(typeof fixes)[number] | undefined>((a, f) => (a === undefined || f.round > a.round ? f : a), undefined)
  return fix ? { k: 'round', round: fix.round, of: fix.of } : { k: 'none' }
}

/** `report <STATUS>` for each status the ticket was reported in, in the order they arrived, not yet recorded. */
function newReportEvents(t: Ticket, facts: readonly Fact[]): Pending[] {
  const recorded = new Set(factsOf(facts, 'happened', t).map((f) => f.event))
  const statuses = [...new Set(factsOf(facts, 'report', t).sort((a, b) => a.at - b.at).map((f) => f.status))]
  return statuses.flatMap((status) => {
    const id = `report-${status}` as LinearEventId
    return recorded.has(id) ? [] : [{ ticket: t, event: { k: 'report', status }, id }]
  })
}

/** The row for work main does itself: its branch names a ticket no pane holds. */
function thisSession(world: World, mainPane: Pane | undefined, projectName: string | undefined): Row | undefined {
  const branch = valueOf(world.sources.branches)?.get(world.me.cwd)
  const t = branch === undefined ? undefined : branchTicket(branch)
  if (!t || !branch) return undefined
  const label = pickLabel([mainPane?.paneLabel, mainPane?.tabLabel])
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
  return bySource((id) => {
    const p: Polled<unknown> = sources[id]
    return p.k === 'stale' ? { k: 'stale', since: p.since } : p.k === 'down' ? { k: 'unavailable' } : { k: 'ok' }
  })
}
