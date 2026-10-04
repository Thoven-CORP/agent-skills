// facts.ts: the queries over loaded facts. store.ts owns how a fact is stored; this file owns
// how the rest of the cockpit asks which facts say what.

import type { Fact, FactKind, FactOf, PaneId, SpaceId, Ticket } from './model.ts'

/** The fact kinds that name a ticket. */
type TicketKind = { [K in FactKind]: FactOf<K> extends { ticket: Ticket } ? K : never }[FactKind]

/** The facts that name a ticket, one list per kind. */
export type BoardFacts = { readonly [K in TicketKind]: ReadonlyArray<FactOf<K>> }

/** The facts that name a ticket, grouped by kind; with `ticket`, only that ticket's. */
export function byKind(facts: readonly Fact[], ticket?: Ticket): BoardFacts {
  const of = <K extends TicketKind>(kind: K): Array<FactOf<K>> =>
    facts.filter((f): f is FactOf<K> => f.kind === kind && (ticket === undefined || ('ticket' in f && f.ticket === ticket)))
  return { brief: of('brief'), report: of('report'), verdict: of('verdict'), send: of('send'), happened: of('happened'), status: of('status'), review: of('review'), self: of('self'), update: of('update'), readback: of('readback') }
}

/** The fact with the latest `at`. */
export const newest = <F extends { at: number }>(fs: readonly F[]): F | undefined => fs.reduce<F | undefined>((a, f) => (a === undefined || f.at > a.at ? f : a), undefined)

type Claim = FactOf<'main'>

/** The claim on a space, which says who its main is. */
export function claimOf(facts: readonly Fact[], space: SpaceId): Claim | undefined {
  return facts.find((f): f is Claim => f.kind === 'main' && f.space === space)
}

/** The claim a pane holds, so a reload or `/clear` finds its main role again. */
export function claimHeldBy(facts: readonly Fact[], pane: PaneId): Claim | undefined {
  return facts.find((f): f is Claim => f.kind === 'main' && f.pane === pane)
}
