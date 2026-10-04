// store.ts: the one owner of the `$.store` key format.
//
// Every key is `cockpit:<kind>:<subject…>:<writer>`. The writer is part of the key, so the
// machine-wide store (shared, not atomic) never sees two sessions race on one key, and no code
// path does get-then-set. The one contested key is `main:<space>`, where the last claim wins.
//
// No other module builds or parses a key string. If reading ~50 keys per tick proves too slow
// (synthesis A2), this file is the only one that changes.

import { KINDS, REPORT_STATUSES, REVIEW_SKILLS, ROLES, VERDICTS, isLinearEventId, isOneOf, isPaneId, isSessionId, isSpaceId, type Fact, type FactKind, type FactOf, type SkillRun, type Ticket } from './model.ts'
import { ticket } from './dispatch.ts'
import { checkpointShape } from './background.ts'

const PREFIX = 'cockpit:'

/** The key a fact lives at. Total over Fact: a new Fact variant without a key fails to compile. */
export function keyOf(fact: Fact): string {
  switch (fact.kind) {
    case 'main':
      return `${PREFIX}main:${fact.space}`
    case 'brief':
    case 'report':
    case 'verdict':
    case 'status':
      return `${PREFIX}${fact.kind}:${fact.ticket}:${fact.sid}`
    case 'send':
      // Role and round in the key, so a plain send never overwrites the fix round before it.
      return `${PREFIX}send:${fact.ticket}:${fact.pane}:${fact.role}:${fact.round}`
    case 'happened':
      return `${PREFIX}happened:${fact.ticket}:${fact.event}`
    case 'checkpoint':
      return `${PREFIX}checkpoint:${fact.sid}`
    case 'review':
    case 'self':
      return `${PREFIX}${fact.kind}:${fact.ticket}:${fact.sid}:${fact.skill}`
    case 'update':
      return `${PREFIX}${fact.kind}:${fact.ticket}:${fact.event}`
    case 'readback':
      return `${PREFIX}readback:${fact.ticket}:${fact.sid}`
    case 'ran':
      return `${PREFIX}ran:${fact.sid}:${fact.skill}`
    default:
      return fact satisfies never
  }
}

/** Whether a key is the cockpit's at all, fact or not: the only keys expiry and doctor touch. */
export const isCockpitKey = (key: string): boolean => key.startsWith(PREFIX)

/** Whether a key is a fact's, or one kind's: `cockpit:<kind>:…`. */
export function isFactKey(key: string, only?: FactKind): boolean {
  return (only === undefined ? FACT_KINDS : [only]).some((k) => key.startsWith(`${PREFIX}${k}:`))
}

type Raw = Readonly<Record<string, unknown>>

const isStr = (v: unknown): v is string => typeof v === 'string' && v !== ''
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isTicket = (v: unknown): v is Ticket => typeof v === 'string' && ticket(v) === v

/** One shape check per kind: a new Fact kind without one fails to compile. */
const SHAPES: { [K in FactKind]: (v: Raw) => FactOf<K> | undefined } = {
  main: (v) => (isSpaceId(v.space) && isSessionId(v.sid) && isPaneId(v.pane) && isNum(v.at) ? { kind: 'main', space: v.space, sid: v.sid, pane: v.pane, at: v.at } : undefined),
  brief: (v) => {
    if (!isTicket(v.ticket) || !isSessionId(v.sid) || !isPaneId(v.pane) || !isNum(v.at)) return undefined
    const named = { ...(isOneOf(KINDS)(v.labelKind) ? { labelKind: v.labelKind } : {}), ...(isStr(v.title) ? { title: v.title } : {}) }
    const writer = { sid: v.sid, pane: v.pane, at: v.at }
    if (v.k === 'first' && isOneOf(ROLES)(v.role)) return { kind: 'brief', k: 'first', ticket: v.ticket, role: v.role, ...named, ...writer }
    if (v.k === 'fix' && isNum(v.round) && isNum(v.of)) return { kind: 'brief', k: 'fix', ticket: v.ticket, round: v.round, of: v.of, ...named, ...writer }
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
  happened: (v) => (isTicket(v.ticket) && isLinearEventId(v.event) && isNum(v.at) ? { kind: 'happened', ticket: v.ticket, event: v.event, at: v.at } : undefined),
  status: (v) =>
    isTicket(v.ticket) && isSessionId(v.sid) && isOneOf(REPORT_STATUSES)(v.status) && typeof v.text === 'string' && isNum(v.at)
      ? { kind: 'status', ticket: v.ticket, sid: v.sid, status: v.status, text: v.text, at: v.at }
      : undefined,
  checkpoint: (v) => checkpointShape(v),
  review: (v) => {
    const run = skillRun(v)
    return run && { kind: 'review', ...run }
  },
  self: (v) => {
    const run = skillRun(v)
    return run && { kind: 'self', ...run }
  },
  update: (v) => (isTicket(v.ticket) && isLinearEventId(v.event) && isNum(v.at) ? { kind: 'update', ticket: v.ticket, event: v.event, at: v.at } : undefined),
  readback: (v) =>
    isTicket(v.ticket) && isSessionId(v.sid) && typeof v.isError === 'boolean' && isStr(v.text) && isNum(v.at)
      ? { kind: 'readback', ticket: v.ticket, sid: v.sid, isError: v.isError, text: v.text, at: v.at }
      : undefined,
  ran: (v) =>
    isSessionId(v.sid) && isOneOf(REVIEW_SKILLS)(v.skill) && isNum(v.at)
      ? { kind: 'ran', sid: v.sid, skill: v.skill, at: v.at, ...(v.claimed === true ? { claimed: true } : {}) }
      : undefined,
}

function skillRun(v: Raw): SkillRun | undefined {
  return isTicket(v.ticket) && isSessionId(v.sid) && isOneOf(REVIEW_SKILLS)(v.skill) && isNum(v.round) && isNum(v.at)
    ? { ticket: v.ticket, sid: v.sid, skill: v.skill, round: v.round, at: v.at }
    : undefined
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
