// facts.ts: the queries over loaded facts. store.ts owns how a fact is stored; this file owns
// how the rest of the cockpit asks which facts say what.

import type { Fact, FactOf, PaneId, SpaceId, Ticket } from './model.ts'

/** The fact kinds the board reads, each split out of the loaded facts once per tick. */
export type BoardFacts = { report: Array<FactOf<'report'>>; send: Array<FactOf<'send'>>; brief: Array<FactOf<'brief'>>; happened: Array<FactOf<'happened'>> }

export function boardFacts(facts: readonly Fact[]): BoardFacts {
  const of = <K extends Fact['kind']>(kind: K): Array<FactOf<K>> => facts.filter((f): f is FactOf<K> => f.kind === kind)
  return { report: of('report'), send: of('send'), brief: of('brief'), happened: of('happened') }
}

/** The same facts, only those about one ticket. */
export function aboutTicket(facts: BoardFacts, t: Ticket): BoardFacts {
  const about = <F extends { ticket: Ticket }>(fs: readonly F[]): F[] => fs.filter((f) => f.ticket === t)
  return { report: about(facts.report), send: about(facts.send), brief: about(facts.brief), happened: about(facts.happened) }
}

type Claim = FactOf<'main'>

/** The claim on a space, which says who its main is. */
export function claimOf(facts: readonly Fact[], space: SpaceId): Claim | undefined {
  return facts.find((f): f is Claim => f.kind === 'main' && f.space === space)
}

/** The claim a pane holds, so a reload or `/clear` finds its main role again. */
export function claimHeldBy(facts: readonly Fact[], pane: PaneId): Claim | undefined {
  return facts.find((f): f is Claim => f.kind === 'main' && f.pane === pane)
}
