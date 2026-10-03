// store.ts: the one owner of the `$.store` key format.
//
// Every key is `cockpit:<kind>:<subject…>:<writer>`. The writer is part of the key, so the
// machine-wide store (shared, not atomic) never sees two sessions race on one key, and no code
// path does get-then-set. The one contested key is `main:<space>`, where the last claim wins.
//
// No other module builds or parses a key string. If reading ~50 keys per tick proves too slow
// (synthesis A2), this file is the only one that changes.

import type { Fact, FactKind, LinearEventId, PaneId, SessionId, SpaceId, Ticket } from './model.ts'
import { ticket } from './dispatch.ts'

export const PREFIX = 'cockpit:'

/** What a key alone says, without fetching its value. */
export type KeyInfo =
  | { kind: 'main'; space: SpaceId }
  | { kind: 'brief' | 'report' | 'verdict' | 'sent'; ticket: Ticket; sid: SessionId }
  | { kind: 'send'; ticket: Ticket; pane: PaneId }
  | { kind: 'ran'; sid: SessionId; skill: string }
  | { kind: 'happened' | 'ack'; ticket: Ticket; event: LinearEventId }
  | { kind: 'checkpoint'; sid: SessionId }

/** The key a fact lives at. Total over Fact: a new Fact variant without a key fails to compile. */
export function keyOf(fact: Fact): string {
  switch (fact.kind) {
    case 'main':
      return `${PREFIX}main:${fact.space}`
    case 'brief':
    case 'report':
    case 'verdict':
    case 'sent':
      return `${PREFIX}${fact.kind}:${fact.ticket}:${fact.sid}`
    case 'send':
      return `${PREFIX}send:${fact.ticket}:${fact.pane}`
    case 'ran':
      return `${PREFIX}ran:${fact.sid}:${fact.skill}`
    case 'happened':
    case 'ack':
      return `${PREFIX}${fact.kind}:${fact.ticket}:${fact.event}`
    case 'checkpoint':
      return `${PREFIX}checkpoint:${fact.sid}`
    default:
      return fact satisfies never
  }
}

/**
 * Undefined for keys that are not ours or do not parse. Pane ids hold a colon (`w18:p8W`), so a
 * subject or writer that can be a pane id is everything after the fixed fields.
 */
export function parseKey(key: string): KeyInfo | undefined {
  if (!key.startsWith(PREFIX)) return undefined
  const [kind, ...parts] = key.slice(PREFIX.length).split(':') as [string, ...string[]]
  const rest = parts.join(':')
  const head = parts[0] ?? ''
  const tail = parts.slice(1).join(':')
  switch (kind as FactKind) {
    case 'main':
      return rest ? { kind: 'main', space: rest as SpaceId } : undefined
    case 'brief':
    case 'report':
    case 'verdict':
    case 'sent': {
      const t = ticket(head)
      return t && tail ? { kind: kind as 'brief', ticket: t, sid: tail as SessionId } : undefined
    }
    case 'send': {
      const t = ticket(head)
      return t && tail ? { kind: 'send', ticket: t, pane: tail as PaneId } : undefined
    }
    case 'ran':
      return head && tail ? { kind: 'ran', sid: head as SessionId, skill: tail } : undefined
    case 'happened':
    case 'ack': {
      const t = ticket(head)
      return t && tail ? { kind: kind as 'ack', ticket: t, event: tail as LinearEventId } : undefined
    }
    case 'checkpoint':
      return rest ? { kind: 'checkpoint', sid: rest as SessionId } : undefined
    default:
      return undefined
  }
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v !== ''

/**
 * Validate a stored value into a Fact. The store is a boundary: a value an older version wrote,
 * or a hand edit, comes back undefined and is ignored, never thrown on. Kinds a later slice reads
 * are undefined until that slice adds their check.
 */
export function parseFact(info: KeyInfo, value: unknown): Fact | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const v = value as Record<string, unknown>
  switch (info.kind) {
    case 'main':
      return v.kind === 'main' && v.space === info.space && isStr(v.sid) && isStr(v.pane) && typeof v.at === 'number'
        ? { kind: 'main', space: info.space, sid: v.sid as SessionId, pane: v.pane as PaneId, at: v.at }
        : undefined
    default:
      return undefined
  }
}

type Claim = Extract<Fact, { kind: 'main' }>

/** The claim on a space, which says who its main is. */
export function claimOf(facts: readonly Fact[], space: SpaceId): Claim | undefined {
  return facts.find((f): f is Claim => f.kind === 'main' && f.space === space)
}

/** The claim a pane holds, so a reload or `/clear` finds its main role again. */
export function claimHeldBy(facts: readonly Fact[], pane: PaneId): Claim | undefined {
  return facts.find((f): f is Claim => f.kind === 'main' && f.pane === pane)
}
