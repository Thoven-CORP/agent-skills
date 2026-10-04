// expiry.ts: which `cockpit:` keys main deletes, decided from one read of the store.
//
// Two rules (spec "Store keys"):
//   merged-done  a fact about a ticket whose PR merged and whose Linear state is completed, once the
//                ticket has left the board, so a row still on screen keeps its cells
//   untouched    a key whose value was last written more than 14 days ago. Every write replaces a
//                whole value with a fresh `at`, so `at` is when the key was last touched
//
// A `main:` claim never expires by age: its `at` is the claim time, and a main does not rewrite its
// claim, because that would be a read-then-write against a newer claim (ADR3).

import { isDone, type LinearEntry } from './linear.ts'
import { isCockpitKey, isFactKey, parseFact } from './store.ts'
import type { Board, Ms, Pr, Ticket } from './model.ts'

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

/** Whether a stored key is past the 14-day line. A `main:` claim never is. */
export const expiresByAge = (key: string, value: unknown, now: Ms): boolean => !isFactKey(key, 'main') && isPastExpiry(ageOf(value, now))

/** A ticket whose PR merged and whose Linear state is completed, whatever the team named it. */
export function isMergedAndDone(t: Ticket, prs: readonly Pr[], linear: LinearStates): boolean {
  const e = linear.get(t)
  return e !== undefined && isDone(e) && prs.some((pr) => pr.state === 'MERGED' && pr.tickets.includes(t))
}

export function expired(stored: readonly Stored[], c: ExpiryContext): Expiry[] {
  return stored.flatMap(({ key, value }): Expiry[] => {
    if (!isCockpitKey(key)) return []
    const fact = parseFact(key, value)
    if (fact && 'ticket' in fact && c.prs && c.linear && !c.onBoard.has(fact.ticket) && isMergedAndDone(fact.ticket, c.prs, c.linear)) return [{ key, why: 'merged-done' }]
    if (expiresByAge(key, value, c.now)) return [{ key, why: 'untouched' }]
    return []
  })
}

/** Every ticket with a row on a board, parents included. */
export function ticketsOn(board: Board): Set<Ticket> {
  return new Set(board.build.flatMap((g) => (g.k === 'single' ? [g.row.ticket] : [g.parent, ...g.children.map((r) => r.ticket)])))
}

/** How often main runs an expiry pass. A 14-day rule needs no finer grain than an hour. */
export const EXPIRY_PASS_MS = 60 * 60_000
