// expiry.ts: which `cockpit:` keys main deletes, decided from one read of the store.
//
// Two rules (spec "Store keys"):
//   merged-done  a fact about a ticket whose PR merged and whose Linear state is completed, once the
//                ticket has left the board, so a row still on screen keeps its cells
//   untouched    a key whose value was last written more than 14 days ago. Every write replaces a
//                whole value with a fresh `at`, so `at` is when the key was last touched
//
// A `main:` claim never expires by age: its `at` is the claim time, and a main does not rewrite its
// claim, because that would be a read-then-write against a newer claim (ADR3). Nor does a key the
// Linear cell reads while its ticket is on the board: without its `happened:` the next draw records
// the event again, and without its `update:` and newer `readback:` a report event, which no Linear
// state ever shows, is pending again. Either way its ↻ comes back. Nor do the `send:` and `brief:`
// keys that place a closed row (board.ts): without them the row, and its pending ↻, leave the board.

import { isDone, type LinearEntry } from './linear.ts'
import { isCockpitKey, isFactKey, parseFact } from './store.ts'
import type { Board, FactKind, Ms, Pr, Ticket } from './model.ts'

export const EXPIRY_MS = 14 * 24 * 60 * 60_000

/** One stored key and its raw value, as `$.store` returned them. */
export type Stored = { key: string; value: unknown }

/** What the Linear read last saw of each ticket. */
export type LinearStates = ReadonlyMap<Ticket, LinearEntry>

export type ExpiryContext = {
  now: Ms
  /** The last `gh pr list` answer; undefined while gh never answered. */
  prs: readonly Pr[] | undefined
  /** Undefined until a Linear read answered: no read, no merged-done deletion. */
  linear: LinearStates | undefined
  /** Tickets with a row on the board main last drew. */
  onBoard: ReadonlySet<Ticket>
}

export type Expiry = { key: string; why: 'merged-done' | 'untouched' }

/** When a stored value was written: its numeric `at`, even for a value this version cannot parse. */
export function ageOf(value: unknown, now: Ms): Ms | undefined {
  if (typeof value !== 'object' || value === null || !('at' in value)) return undefined
  return typeof value.at === 'number' && Number.isFinite(value.at) ? now - value.at : undefined
}

const isPastExpiry = (age: Ms | undefined): boolean => age !== undefined && age > EXPIRY_MS

/** The kinds linear.ts linearOf reads from the store, and the kinds board.ts places a closed row by. */
const KEPT_ON_BOARD: ReadonlySet<FactKind> = new Set(['happened', 'update', 'readback', 'send', 'brief'])

/** Whether main deletes a stored key for its age: past the 14-day line, not a `main:` claim, and not one that keeps a ticket on the board in its row or its Linear cell. */
export function expiresByAge({ key, value }: Stored, now: Ms, onBoard: ReadonlySet<Ticket>): boolean {
  if (isFactKey(key, 'main') || !isPastExpiry(ageOf(value, now))) return false
  const fact = parseFact(key, value)
  return !(fact && 'ticket' in fact && KEPT_ON_BOARD.has(fact.kind) && onBoard.has(fact.ticket))
}

/** A ticket whose PR merged and whose Linear state is completed, whatever the team named it. */
export function isMergedAndDone(t: Ticket, prs: readonly Pr[], linear: LinearStates): boolean {
  const e = linear.get(t)
  return e !== undefined && isDone(e) && prs.some((pr) => pr.state === 'MERGED' && pr.tickets.includes(t))
}

export function expired(stored: readonly Stored[], c: ExpiryContext): Expiry[] {
  return stored.flatMap((s): Expiry[] => {
    if (!isCockpitKey(s.key)) return []
    const fact = parseFact(s.key, s.value)
    if (fact && 'ticket' in fact && c.prs && c.linear && !c.onBoard.has(fact.ticket) && isMergedAndDone(fact.ticket, c.prs, c.linear)) return [{ key: s.key, why: 'merged-done' }]
    if (expiresByAge(s, c.now, c.onBoard)) return [{ key: s.key, why: 'untouched' }]
    return []
  })
}

/** Every ticket with a row on a board, parents included. */
export function ticketsOn(board: Pick<Board, 'build'>): Set<Ticket> {
  return new Set(board.build.flatMap((g) => (g.k === 'single' ? [g.row.ticket] : [g.parent, ...g.children.map((r) => r.ticket)])))
}

/** How often main runs an expiry pass. A 14-day rule needs no finer grain than an hour. */
export const EXPIRY_PASS_MS = 60 * 60_000
