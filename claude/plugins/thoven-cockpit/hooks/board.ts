// board.ts: World → Board. The one place tickets are joined.
//
// Pure and total: every World, however stale or half-empty, gives a Board. A failed source
// keeps its last answer, which view.ts dims in the columns naming it, and leaves the others drawing.
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

import { branchTicket, pickLabel } from './dispatch.ts'
import { indexFacts, type BoardFacts } from './facts.ts'
import { configPathOf } from './github.ts'
import type { Board, Branches, Cells, CiCell, FixCell, Health, InboxFile, Kind, LinearEventId, LivePane, NonEmpty, OtherItem, Pane, PaneCell, PaneId, PaneLabels, Panes, Pending, Polled, Pr, PrCell, PrGroup, ReportCell, RowIdentity, SourceHealth, SourceId, Sources, SpaceMap, Ticket, World } from './model.ts'
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
  const context = { inbox: valueOf(world.sources.inbox) ?? [], join }

  return {
    space,
    project: projectName,
    here: undefined,
    build: ids.map((id) => ({ k: 'single', row: { ...id, cells: cellsOf(id.ticket, facts.about(id.ticket), context) } })),
    other,
    prs: join.groups(),
    pending: [],
    health: health(world.sources),
    working: panes.filter((p) => p.status === 'working').map((p) => p.pane),
    newEvents: ids.flatMap(({ ticket: t }) => {
      const about = facts.about(t)
      return [...newReportEvents(t, about), ...newMergedEvents(t, join.attached(t), about)]
    }),
  }
}

/** Every cell of a row, from the facts about its ticket and what the sources say. */
function cellsOf(t: Ticket, about: BoardFacts, s: { inbox: readonly InboxFile[]; join: ReturnType<typeof prJoin> }): Cells {
  const pr = s.join.cell(t)
  return {
    report: reportCell(t, about, s.inbox),
    fix: fixCell(about),
    review: { k: 'none' },
    pr,
    ci: pr.k === 'none' ? { k: 'none' } : ciCell(pr.pr),
    linear: { k: 'none' },
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
function prJoin(world: World, panes: readonly Pane[], rows: readonly RowIdentity[]) {
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
  const placesOf = (r: RowIdentity): Place[] =>
    [...(r.panes.k === 'live' ? r.panes.list : []), ...(r.verifierPane.k === 'live' ? [r.verifierPane] : [])].flatMap((c) => {
      const cwd = cwdOf.get(c.pane)
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
function newMergedEvents(t: Ticket, prs: readonly Pr[], about: BoardFacts): Pending[] {
  const recorded = new Set(about.happened.map((f) => f.event))
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

function reportCell(t: Ticket, about: BoardFacts, inbox: readonly InboxFile[]): ReportCell {
  const report = newest(about.report)
  // An undelivered verdict is the verifier's, so it waits for the Review cell (S3), never this one.
  const file = newest(inbox.filter((f) => f.ticket === t && (f.k === 'report' || f.k === 'escalation') && (report === undefined || f.at > report.at)))
  if (file?.k === 'report') return { k: 'undelivered', status: file.line.word, file: file.name, selfChecked: false }
  if (file?.k === 'escalation') return { k: 'escalation', head: file.head }
  return report ? { k: 'in', status: report.status, at: report.at, concerns: report.concerns, selfChecked: false } : { k: 'none' }
}

function fixCell(about: BoardFacts): FixCell {
  const top = (rounds: number[]) => rounds.reduce((a, b) => Math.max(a, b), 0)
  const sent = top(about.send.filter((f) => f.role === 'builder').map((f) => f.round))
  if (sent > 0) return { k: 'round', round: sent, of: 5 }
  const fixes = about.brief.flatMap((f) => (f.k === 'fix' && f.round > 0 ? [f] : []))
  const fix = fixes.reduce<(typeof fixes)[number] | undefined>((a, f) => (a === undefined || f.round > a.round ? f : a), undefined)
  return fix ? { k: 'round', round: fix.round, of: fix.of } : { k: 'none' }
}

/** `report <STATUS>` for each status the ticket was reported in, in the order they arrived, not yet recorded. */
function newReportEvents(t: Ticket, about: BoardFacts): Pending[] {
  const recorded = new Set(about.happened.map((f) => f.event))
  const statuses = [...new Set([...about.report].sort((a, b) => a.at - b.at).map((f) => f.status))]
  return statuses.flatMap((status) => {
    const id = `report-${status}` as LinearEventId
    return recorded.has(id) ? [] : [{ ticket: t, event: { k: 'report', status }, id }]
  })
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
