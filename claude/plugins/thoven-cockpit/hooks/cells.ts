// cells.ts: one row's cells, and the events on it main has not recorded yet.
//
// Report is the newest report fact by `at`, from whichever session received it, unless the inbox
// still holds a newer file for the ticket (unsent, or herdr's escalation note). Fix is main's
// highest send.sh fix round, else the pane's highest FIX ROUND brief. PR and CI come from the PR
// join (prs.ts). The row itself (`started`), every report status its ticket has had, and every
// open or merged PR attached to it, with no `happened` fact yet, is a new event for main to record
// once (synthesis A1), so the ↻ (linear.ts)
// survives a later report replacing it or the PR falling out of gh's last 50.

import { newest, type BoardFacts } from './facts.ts'
import { eventId, type Cells, type CiCell, type CodexRollout, type FixCell, type InboxFile, type Pending, type Pr, type ReportCell, type Row, type RowIdentity, type Ticket } from './model.ts'
import type { PrJoin } from './prs.ts'
import { reviewCell, selfChecked } from './review.ts'

/** What a row is built from besides its identity: the facts about its ticket, the inbox, where PRs attach, and the space's Codex verifier rollouts. */
export type RowContext = { facts: BoardFacts; inbox: readonly InboxFile[]; join: PrJoin; codex: readonly CodexRollout[] }

/** A row's cells, and the events on it main has not recorded yet, from one pass over its context. */
export function rowOf(id: RowIdentity, c: RowContext): { row: Row; events: Pending[] } {
  const t = id.ticket
  return { row: { ...id, cells: cellsOf(id, c) }, events: [...newStartedEvent(t, c.facts), ...newReportEvents(t, c.facts), ...newPrEvents(t, c.join.attached(t), c.facts)] }
}

/** Every cell of a row, from the facts about its ticket and what the sources say. */
function cellsOf(id: RowIdentity, c: RowContext): Cells {
  const t = id.ticket
  const pr = c.join.cell(t)
  return {
    report: reportCell(t, c.facts, c.inbox),
    fix: fixCell(c.facts),
    review: reviewCell(c.facts, c.codex.filter((r) => r.review?.ticket === t), pr.k === 'none' ? undefined : pr.pr, id.verifierPane),
    pr,
    ci: pr.k === 'none' ? { k: 'none' } : ciCell(pr.pr),
    linear: { k: 'none' },
  }
}

/** Any failed check fails CI, even while others run. A PR with no checks has no CI cell. */
export function ciCell(pr: Pr): CiCell {
  const { total, done, failed } = pr.checks
  if (total === 0) return { k: 'none' }
  if (failed.length > 0) return { k: 'fail', failed: failed.length }
  return done < total ? { k: 'running', done, total } : { k: 'pass' }
}

/** A row on the board is work under way: `started`, once. */
function newStartedEvent(t: Ticket, about: BoardFacts): Pending[] {
  const id = eventId('started')
  return about.happened.some((f) => f.event === id) ? [] : [{ ticket: t, event: { k: 'started' }, id }]
}

/**
 * `pr <n>` for each open or merged PR attached to the ticket, and `merged <n>` for each merged one,
 * not yet recorded. The id carries the repo, so FE #138 and BE #138 are two events (THV-1061).
 */
function newPrEvents(t: Ticket, prs: readonly Pr[], about: BoardFacts): Pending[] {
  const recorded = new Set<string>(about.happened.map((f) => f.event))
  const out = new Map<string, Pending>()
  for (const pr of prs) {
    if (pr.state === 'CLOSED') continue
    const opened = eventId('pr', `${pr.repo}-${pr.number}`)
    if (!recorded.has(opened)) out.set(opened, { ticket: t, event: { k: 'pr', number: pr.number }, id: opened })
    const merged = eventId('merged', `${pr.repo}-${pr.number}`)
    if (pr.state === 'MERGED' && !recorded.has(merged)) out.set(merged, { ticket: t, event: { k: 'merged', number: pr.number }, id: merged })
  }
  return [...out.values()]
}

function reportCell(t: Ticket, about: BoardFacts, inbox: readonly InboxFile[]): ReportCell {
  const report = newest(about.report)
  // An undelivered verdict is the verifier's, so it waits for the Review cell (S3), never this one.
  const file = newest(inbox.filter((f) => f.ticket === t && (f.k === 'report' || f.k === 'escalation') && (report === undefined || f.at > report.at)))
  if (file?.k === 'report') return { k: 'undelivered', status: file.line.word, file: file.name, selfChecked: selfChecked(about) }
  if (file?.k === 'escalation') return { k: 'escalation', head: file.head }
  return report ? { k: 'in', status: report.status, at: report.at, concerns: report.concerns, selfChecked: selfChecked(about) } : { k: 'none' }
}

/** brief.md's fix-round limit (`FIX ROUND <n>/5`), for a send.sh round no FIX ROUND brief gave a denominator. */
const FIX_ROUNDS = 5

function fixCell(about: BoardFacts): FixCell {
  const top = (rounds: number[]) => rounds.reduce((a, b) => Math.max(a, b), 0)
  const fixes = about.brief.flatMap((f) => (f.k === 'fix' && f.round > 0 ? [f] : []))
  const fix = fixes.reduce<(typeof fixes)[number] | undefined>((a, f) => (a === undefined || f.round > a.round ? f : a), undefined)
  const sent = top(about.send.filter((f) => f.role === 'builder').map((f) => f.round))
  if (sent > 0) return { k: 'round', round: sent, of: fix?.of ?? FIX_ROUNDS }
  return fix ? { k: 'round', round: fix.round, of: fix.of } : { k: 'none' }
}

/** `report <STATUS>` for each status the ticket was reported in, in the order they arrived, not yet recorded. */
function newReportEvents(t: Ticket, about: BoardFacts): Pending[] {
  const recorded = new Set(about.happened.map((f) => f.event))
  const statuses = [...new Set([...about.report].sort((a, b) => a.at - b.at).map((f) => f.status))]
  return statuses.flatMap((status) => {
    const id = eventId('report', status)
    return recorded.has(id) ? [] : [{ ticket: t, event: { k: 'report', status }, id }]
  })
}
