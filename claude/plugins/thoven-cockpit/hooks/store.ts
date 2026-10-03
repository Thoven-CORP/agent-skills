// store.ts: the one owner of the `$.store` key format.
//
// Every key is `cockpit:<kind>:<subject…>:<writer>`. The writer is part of the key, so the
// machine-wide store (shared, not atomic) never sees two sessions race on one key, and no code
// path does get-then-set. The one contested key is `main:<space>`, where the last claim wins.
//
// No other module builds or parses a key string. If reading ~50 keys per tick proves too slow
// (synthesis A2), this file is the only one that changes.

import { KINDS, REPORT_STATUSES, ROLES, VERDICTS, isOneOf, isPaneId, isSessionId, isSpaceId, type Fact, type FactKind, type FactOf, type LinearEventId, type Ticket } from './model.ts'
import { ticket } from './dispatch.ts'

const PREFIX = 'cockpit:'

/** The key a fact lives at. Total over Fact: a new Fact variant without a key fails to compile. */
export function keyOf(fact: Fact): string {
  switch (fact.kind) {
    case 'main':
      return `${PREFIX}main:${fact.space}`
    case 'brief':
    case 'report':
    case 'verdict':
      return `${PREFIX}${fact.kind}:${fact.ticket}:${fact.sid}`
    case 'send':
      // Role and round in the key, so a plain send never overwrites the fix round before it.
      return `${PREFIX}send:${fact.ticket}:${fact.pane}:${fact.role}:${fact.round}`
    case 'happened':
      return `${PREFIX}happened:${fact.ticket}:${fact.event}`
    default:
      return fact satisfies never
  }
}

/** Whether a key is a fact's, or one kind's: `cockpit:<kind>:…`. */
export function isFactKey(key: string, only?: FactKind): boolean {
  return (only === undefined ? FACT_KINDS : [only]).some((k) => key.startsWith(`${PREFIX}${k}:`))
}

type Raw = Readonly<Record<string, unknown>>

const isStr = (v: unknown): v is string => typeof v === 'string' && v !== ''
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isTicket = (v: unknown): v is Ticket => typeof v === 'string' && ticket(v) === v
// The store hands back what a session wrote, so an id is a non-empty string; its key proves the rest.
const isEvent = (v: unknown): v is LinearEventId => isStr(v)

/** One shape check per kind: a new Fact kind without one fails to compile. */
const SHAPES: { [K in FactKind]: (v: Raw) => FactOf<K> | undefined } = {
  main: (v) => (isSpaceId(v.space) && isSessionId(v.sid) && isPaneId(v.pane) && isNum(v.at) ? { kind: 'main', space: v.space, sid: v.sid, pane: v.pane, at: v.at } : undefined),
  brief: (v) => {
    if (!isTicket(v.ticket) || !isSessionId(v.sid) || !isPaneId(v.pane) || !isNum(v.at)) return undefined
    const held = { ...(isOneOf(KINDS)(v.labelKind) ? { labelKind: v.labelKind } : {}), ...(isStr(v.title) ? { title: v.title } : {}) }
    const writer = { sid: v.sid, pane: v.pane, at: v.at }
    if (v.k === 'first' && isOneOf(ROLES)(v.role)) return { kind: 'brief', k: 'first', ticket: v.ticket, role: v.role, ...held, ...writer }
    if (v.k === 'fix' && isNum(v.round) && isNum(v.of)) return { kind: 'brief', k: 'fix', ticket: v.ticket, round: v.round, of: v.of, ...held, ...writer }
    return undefined
  },
  report: (v) =>
    isTicket(v.ticket) && isSessionId(v.sid) && isOneOf(REPORT_STATUSES)(v.status) && typeof v.text === 'string' && isNum(v.concerns) && isNum(v.at)
      ? { kind: 'report', ticket: v.ticket, sid: v.sid, status: v.status, text: v.text, concerns: v.concerns, at: v.at }
      : undefined,
  verdict: (v) =>
    isTicket(v.ticket) && isSessionId(v.sid) && isOneOf(VERDICTS)(v.verdict) && typeof v.text === 'string' && isNum(v.at)
      ? { kind: 'verdict', ticket: v.ticket, sid: v.sid, verdict: v.verdict, text: v.text, at: v.at }
      : undefined,
  send: (v) =>
    isTicket(v.ticket) && isPaneId(v.pane) && isOneOf(ROLES)(v.role) && isNum(v.round) && isStr(v.file) && isNum(v.at)
      ? { kind: 'send', ticket: v.ticket, pane: v.pane, role: v.role, round: v.round, file: v.file, at: v.at }
      : undefined,
  happened: (v) => (isTicket(v.ticket) && isEvent(v.event) && isNum(v.at) ? { kind: 'happened', ticket: v.ticket, event: v.event, at: v.at } : undefined),
}

const isRaw = (v: unknown): v is Raw => typeof v === 'object' && v !== null
const isFactKind = (k: unknown): k is FactKind => typeof k === 'string' && Object.hasOwn(SHAPES, k)
const FACT_KINDS = Object.keys(SHAPES).filter(isFactKind)

/**
 * Validate a stored value into the Fact at `key`. The store is a boundary: a value an older version
 * wrote, a hand edit, or a value whose own key is not `key`, comes back undefined, never thrown on.
 */
export function parseFact(key: string, value: unknown): Fact | undefined {
  if (!isRaw(value) || !isFactKind(value.kind)) return undefined
  const fact = SHAPES[value.kind](value)
  return fact && keyOf(fact) === key ? fact : undefined
}
