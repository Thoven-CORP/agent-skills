// facts.ts: the queries over loaded facts. store.ts owns how a fact is stored; this file owns
// how the rest of the cockpit asks which facts say what.

import type { Fact, FactOf, PaneId, SpaceId, Ticket } from './model.ts'

/** Every fact of one kind about one ticket. */
export const factsOf = <K extends Fact['kind']>(facts: readonly Fact[], kind: K, ticket: Ticket): Array<FactOf<K>> =>
  facts.filter((f): f is FactOf<K> => f.kind === kind && 'ticket' in f && f.ticket === ticket)

type Claim = FactOf<'main'>

/** The claim on a space, which says who its main is. */
export function claimOf(facts: readonly Fact[], space: SpaceId): Claim | undefined {
  return facts.find((f): f is Claim => f.kind === 'main' && f.space === space)
}

/** The claim a pane holds, so a reload or `/clear` finds its main role again. */
export function claimHeldBy(facts: readonly Fact[], pane: PaneId): Claim | undefined {
  return facts.find((f): f is Claim => f.kind === 'main' && f.pane === pane)
}
