// facts.ts: the queries over loaded facts. store.ts owns how a fact is stored; this file owns
// how the rest of the cockpit asks which facts say what.

import type { Fact, FactKind, FactOf, PaneId, SpaceId, Ticket } from './model.ts'

/** The fact kinds that name a ticket. */
type TicketKind = { [K in FactKind]: FactOf<K> extends { ticket: Ticket } ? K : never }[FactKind]

/** The facts that name a ticket, one list per kind. */
export type BoardFacts = { readonly [K in TicketKind]: ReadonlyArray<FactOf<K>> }
type Lists = { [K in TicketKind]: Array<FactOf<K>> }

/** Every fact that names a ticket, and the same facts per ticket. Built once per tick. */
export type FactIndex = { all: BoardFacts; about(t: Ticket): BoardFacts }

const lists = (): Lists => ({ brief: [], report: [], verdict: [], send: [], happened: [], status: [], review: [], self: [], update: [], readback: [] })
const NONE: BoardFacts = lists()

const put = <K extends TicketKind>(into: Lists, kind: K, f: FactOf<K>): void => {
  into[kind].push(f)
}

export function indexFacts(facts: readonly Fact[]): FactIndex {
  const all = lists()
  const byTicket = new Map<Ticket, Lists>()
  for (const f of facts) {
    if (!('ticket' in f)) continue
    let mine = byTicket.get(f.ticket)
    if (mine === undefined) byTicket.set(f.ticket, (mine = lists()))
    put(all, f.kind, f)
    put(mine, f.kind, f)
  }
  return { all, about: (t) => byTicket.get(t) ?? NONE }
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
