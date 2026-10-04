// expiry.ts: which `cockpit:` keys main deletes, decided from one read of the store.
//
// Two rules (spec "Store keys"):
//   merged-done  a fact about a ticket whose PR merged and whose Linear state is completed, once the
//                ticket has left the board, so a row still on screen keeps its cells
//   untouched    a key whose `at` is more than 14 days old. A write stamps the time it was made,
//                except a `review` and a claimed `ran`, which keep the time the skill ran
//
// A `main:` claim never expires by age: its `at` is the claim time, and a main does not rewrite its
// claim, because that would be a read-then-write against a newer claim (ADR3). Nor does a key the
// Linear cell reads while its ticket has a row: without its `happened:` the next draw records the
// event again, and without its `update:` and newer `readback:` a report event, which no Linear
// state ever shows, is pending again. Either way its ↻ comes back. Nor do the `send:` and `brief:`
// keys that tie a ticket to a pane or place its closed row (board.ts). A closed row keeps every key
// of its ticket: no pane will write them again, and they are all its cells have to show.
// A parent summary has no ↻ and no cells, so it keeps nothing.

import { isDone, ticketsOn, type LinearEntry } from './linear.ts'
import { isCockpitKey, isFactKey, parseFact } from './store.ts'
import type { Board, Fact, FactKind, Ms, Pr, Ticket } from './model.ts'

export const EXPIRY_MS = 14 * 24 * 60 * 60_000

/** One stored key and its raw value, as `$.store` returned them. */
export type Stored = { key: string; value: unknown }

/** What the Linear read last saw of each ticket. */
export type LinearEntries = ReadonlyMap<Ticket, LinearEntry>

export type ExpiryContext = {
  now: Ms
  /** The last `gh pr list` answer; undefined while gh never answered. */
  prs: readonly Pr[] | undefined
  /** Undefined until a Linear read answered: no read, no merged-done deletion. */
  linear: LinearEntries | undefined
  /** Tickets with a Work row on the board main last drew, children included (linear.ts ticketsOn). */
  onBoard: ReadonlySet<Ticket>
  /** Those of them whose row is closed: its panes are gone. */
  closed: ReadonlySet<Ticket>
}

/** What a board keeps from age expiry: its rows' tickets, and which of those rows are closed. */
export type Kept = Pick<ExpiryContext, 'onBoard' | 'closed'>

export function keptBy(board: Pick<Board, 'build'> | undefined): Kept {
  const rows = (board?.build ?? []).flatMap((g) => (g.k === 'single' ? [g.row] : g.children))
  return { onBoard: new Set(ticketsOn(board)), closed: new Set(rows.flatMap((r) => (r.panes.k === 'gone' ? [r.ticket] : []))) }
}

export type Expiry = { key: string; why: 'merged-done' | 'untouched' }

/** When a stored value was written: its numeric `at`, even for a value this version cannot parse. */
export function ageOf(value: unknown, now: Ms): Ms | undefined {
  if (typeof value !== 'object' || value === null || !('at' in value)) return undefined
  return typeof value.at === 'number' && Number.isFinite(value.at) ? now - value.at : undefined
}

const isPastExpiry = (age: Ms | undefined): boolean => age !== undefined && age > EXPIRY_MS

/** The kinds linear.ts linearOf reads from the store, and the kinds board.ts ties a pane and places a closed row by. */
const KEPT_ON_BOARD: ReadonlySet<FactKind> = new Set(['happened', 'update', 'readback', 'send', 'brief'])

/** Whether a row on the board still reads this fact: any fact of a closed row, a KEPT_ON_BOARD kind of any row. */
function isReadByRow(fact: Fact | undefined, { onBoard, closed }: Kept): boolean {
  if (fact === undefined || !('ticket' in fact)) return false
  return closed.has(fact.ticket) || (KEPT_ON_BOARD.has(fact.kind) && onBoard.has(fact.ticket))
}

/** Whether main deletes a stored key for its age: past the 14-day line, not a `main:` claim, and not a fact a row on the board reads. */
export function expiresByAge({ key, value }: Stored, now: Ms, kept: Kept): boolean {
  if (isFactKey(key, 'main') || !isPastExpiry(ageOf(value, now))) return false
  return !isReadByRow(parseFact(key, value), kept)
}

/** A ticket whose PR merged and whose Linear state is completed, whatever the team named it. */
export function isMergedAndDone(t: Ticket, prs: readonly Pr[], linear: LinearEntries): boolean {
  const e = linear.get(t)
  return e !== undefined && isDone(e) && prs.some((pr) => pr.state === 'MERGED' && pr.tickets.includes(t))
}

export function expired(stored: readonly Stored[], c: ExpiryContext): Expiry[] {
  return stored.flatMap((s): Expiry[] => {
    if (!isCockpitKey(s.key)) return []
    const fact = parseFact(s.key, s.value)
    if (fact && 'ticket' in fact && c.prs && c.linear && !c.onBoard.has(fact.ticket) && isMergedAndDone(fact.ticket, c.prs, c.linear)) return [{ key: s.key, why: 'merged-done' }]
    if (expiresByAge(s, c.now, c)) return [{ key: s.key, why: 'untouched' }]
    return []
  })
}

/** How often main runs an expiry pass. A 14-day rule needs no finer grain than an hour. */
export const EXPIRY_PASS_MS = 60 * 60_000
