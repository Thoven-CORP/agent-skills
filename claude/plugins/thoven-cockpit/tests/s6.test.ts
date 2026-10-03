// S6: the doctor and key expiry. The pure rules on real PR fixtures (no kit), then sessions under
// kit stubs: doctor in a pane session and in main, and main deleting a 15-day-old key.
//
// Derived inputs: stored facts are built literals whose text is a real status line from
// fixtures/reports.ts, and whose `at` places them in time. The Linear states are a fixture map,
// because S4's Linear read lands in parallel.

import { expect, test } from 'claude-code/testing'
import { doctor, mainCheckoutDir } from '../hooks/doctor.ts'
import { EXPIRY_MS, ageOf, expired, isMergedAndDone, type LinearStates, type Stored } from '../hooks/expiry.ts'
import { FRONTEND, parsePrList } from '../hooks/github.ts'
import { isLinearEventId, isPaneId, isSessionId, isSpaceId, type Fact, type Health, type Pr } from '../hooks/model.ts'
import { keyOf } from '../hooks/store.ts'
import { doctorText } from '../hooks/view.ts'
import { GH_FRONTEND } from './fixtures/github.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { HOME, cockpit, idOf, must, relabelTab, stage, start, tk } from './stage.ts'

const DAY = 86_400_000
/** The clock when the sessions below run: 20 days after the epoch the stored `at`s count from. */
const NOW = 20 * DAY
const SNAPSHOT = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Consent evidence hardening (THV-1045)')

const sid = (s: string) => idOf(isSessionId, s)

/** A report another session received, with a real status line from fixtures/reports.ts. */
const report = (ticket: string, receiver: string, at: number): Fact => ({
  kind: 'report',
  ticket: tk(ticket),
  sid: sid(receiver),
  status: 'DONE_WITH_CONCERNS',
  text: 'DONE_WITH_CONCERNS THV-1041',
  concerns: 0,
  at,
})
const verdict = (ticket: string, receiver: string, at: number): Fact => ({ kind: 'verdict', ticket: tk(ticket), sid: sid(receiver), verdict: 'VERIFIED', text: '  VERIFIED THV-1003', at })
const claim = (space: string, pane: string, at: number): Fact => ({ kind: 'main', space: idOf(isSpaceId, space), sid: sid('sid-other-main'), pane: idOf(isPaneId, pane), at })

const entry = (f: Fact): [string, unknown] => [keyOf(f), f]
const storedOf = (entries: Array<[string, unknown]>): Stored[] => entries.map(([key, value]) => ({ key, value }))

const OLD_REPORT = report('THV-1041', 'sid-b', NOW - 15 * DAY)
const RECENT_VERDICT = verdict('THV-1003', 'sid-c', NOW - 13 * DAY)
const OLD_CLAIM = claim('w4D', 'w4D:pH', NOW - 15 * DAY)
/** A key an older version wrote: it does not parse, but its `at` still dates it. */
const OLD_UNREADABLE: [string, unknown] = ['cockpit:report:THV-9:sid-gone', { kind: 'report', at: NOW - 16 * DAY }]
/** A cockpit key with no `at`: its age is unknown, so it never expires. */
const UNDATED: [string, unknown] = ['cockpit:note', 'free text']
/** Not the cockpit's: neither listed nor deleted. */
const FOREIGN: [string, unknown] = ['spike:ping', { at: 0 }]

const prs = (): Pr[] => must(parsePrList(FRONTEND, GH_FRONTEND))
const DONE: LinearStates = new Map([[tk('THV-1038'), 'Done']])

// ── unit: the expiry rules ───────────────────────────────────────────────────────────────────

test('a key last written 15 days ago expires, one written 13 days ago and a main claim do not', async () => {
  const gone = expired(storedOf([entry(OLD_REPORT), entry(RECENT_VERDICT), entry(OLD_CLAIM), OLD_UNREADABLE, UNDATED, FOREIGN]), { now: NOW, prs: undefined, linear: undefined, onBoard: new Set() })
  expect(gone).toEqual([
    { key: 'cockpit:report:THV-1041:sid-b', why: 'untouched' },
    { key: 'cockpit:report:THV-9:sid-gone', why: 'untouched' },
  ])
  expect(ageOf(OLD_REPORT, NOW)).toBe(15 * DAY)
  expect(ageOf('free text', NOW)).toBe(undefined)
})

test('the 14-day line: exactly 14 days stays, a millisecond more expires', async () => {
  const at = (age: number): Stored[] => storedOf([entry(report('THV-1041', 'sid-b', NOW - age))])
  const ctx = { now: NOW, prs: undefined, linear: undefined, onBoard: new Set<never>() }
  expect(expired(at(EXPIRY_MS), ctx)).toEqual([])
  expect(expired(at(EXPIRY_MS + 1), ctx).map((e) => e.why)).toEqual(['untouched'])
})

test('FE #138 merged and THV-1038 reads Done: every fresh THV-1038 key goes once the ticket leaves the board', async () => {
  const fresh = NOW - 60_000
  const keys = storedOf([entry(report('THV-1038', 'sid-b', fresh)), entry({ kind: 'happened', ticket: tk('THV-1038'), event: idOf(isLinearEventId, 'merged-138'), at: fresh }), entry(report('THV-1045', 'sid-b', fresh))])
  expect(isMergedAndDone(tk('THV-1038'), prs(), DONE)).toBe(true)
  expect(expired(keys, { now: NOW, prs: prs(), linear: DONE, onBoard: new Set() })).toEqual([
    { key: 'cockpit:report:THV-1038:sid-b', why: 'merged-done' },
    { key: 'cockpit:happened:THV-1038:merged-138', why: 'merged-done' },
  ])
  // Still on screen, not Done yet, no Linear read, or no merged PR: nothing goes.
  expect(expired(keys, { now: NOW, prs: prs(), linear: DONE, onBoard: new Set([tk('THV-1038')]) })).toEqual([])
  expect(expired(keys, { now: NOW, prs: prs(), linear: new Map([[tk('THV-1038'), 'In Review']]), onBoard: new Set() })).toEqual([])
  expect(expired(keys, { now: NOW, prs: prs(), linear: undefined, onBoard: new Set() })).toEqual([])
  expect(expired(keys, { now: NOW, prs: prs().filter((p) => p.number !== 138), linear: DONE, onBoard: new Set() })).toEqual([])
})

// ── unit: the doctor report ──────────────────────────────────────────────────────────────────

const HEALTH: Health = { herdr: { k: 'ok' }, labels: { k: 'ok' }, spaces: { k: 'ok' }, git: { k: 'ok' }, github: { k: 'unavailable' }, inbox: { k: 'ok' }, codex: { k: 'ok' } }

test('doctor lists keys older than 14 days first, oldest first, then the rest, undated last', async () => {
  const r = doctor({
    now: NOW,
    stored: storedOf([entry(RECENT_VERDICT), UNDATED, entry(OLD_REPORT), OLD_UNREADABLE, FOREIGN, entry(claim('w18', 'w18:p8W', NOW - DAY))]),
    space: idOf(isSpaceId, 'w18'),
    pane: idOf(isPaneId, 'w18:p8W'),
    health: HEALTH,
    plugin: { root: mainCheckoutDir(HOME), env: mainCheckoutDir(HOME), home: HOME },
  })
  expect(r.keys.map((k) => [k.key, k.isExpired, k.isReadable])).toEqual([
    ['cockpit:report:THV-9:sid-gone', true, false],
    ['cockpit:report:THV-1041:sid-b', true, true],
    ['cockpit:verdict:THV-1003:sid-c', false, true],
    ['cockpit:main:w18', false, true],
    ['cockpit:note', false, false],
  ])
  expect(r.claim).toEqual({ k: 'held', space: 'w18', pane: 'w18:p8W', sid: 'sid-other-main', ageMs: DAY, isMine: true })
  expect(r.plugin.isMainCheckout).toBe(true)
  const text = doctorText(r)
  expect(text.split('\n').slice(0, 11)).toEqual([
    'Cockpit doctor',
    `Plugin: ${HOME}/thoven/agent-skills/claude/plugins/thoven-cockpit, the main checkout. CLAUDE_CODE_PLUGIN_DIRS: ${HOME}/thoven/agent-skills/claude/plugins/thoven-cockpit.`,
    'Main of w18: this session, claimed 1 d ago.',
    'Sources:',
    '  herdr: ok',
    '  pane labels: ok',
    '  Live spaces: ok',
    '  git: ok',
    '  gh: unavailable',
    '  dispatch inbox: ok',
    '  Codex rollouts: ok',
    'Store: 5 cockpit keys.',
  ])
  expect(text.split('\n').slice(11)).toEqual([
    '  16 d   cockpit:report:THV-9:sid-gone  older than 14 days, main deletes it  (unreadable)',
    '  15 d   cockpit:report:THV-1041:sid-b  older than 14 days, main deletes it',
    '  13 d   cockpit:verdict:THV-1003:sid-c',
    '  1 d    cockpit:main:w18',
    '  ?      cockpit:note  (unreadable)',
  ])
})

test('doctor names a worktree load, another session\'s claim, and a session outside herdr', async () => {
  const base = { now: NOW, health: undefined, stored: storedOf([entry(claim('w18', 'w18:p7W', NOW - 3 * 3_600_000))]) }
  const worktree = `${HOME}/thoven/agent-skills-thv-1063/claude/plugins/thoven-cockpit`
  const other = doctor({ ...base, space: idOf(isSpaceId, 'w18'), pane: idOf(isPaneId, 'w18:p8W'), plugin: { root: worktree, env: undefined, home: HOME } })
  expect(other.plugin.isMainCheckout).toBe(false)
  const lines = doctorText(other).split('\n')
  expect(lines[1]).toBe(`Plugin: ${worktree}, not the main checkout (${mainCheckoutDir(HOME)}). CLAUDE_CODE_PLUGIN_DIRS: unset.`)
  expect(lines[2]).toBe('Main of w18: pane w18:p7W, session sid-other-main, claimed 3 h ago.')
  expect(lines[3]).toBe('Sources: polled only by main, and this session is not main.')
  const outside = doctor({ ...base, space: undefined, pane: undefined, plugin: { root: worktree, env: undefined, home: HOME } })
  expect(doctorText(outside).split('\n')[2]).toBe('Main: this session is not in a herdr pane, so it has no space.')
})

// ── kit: the Expiry case ─────────────────────────────────────────────────────────────────────

test('Expiry: doctor lists the 15-day-old key first, then main deletes it and writes no other session\'s key', async ($, on) => {
  const store = Object.fromEntries([entry(OLD_REPORT), entry(RECENT_VERDICT), entry(OLD_CLAIM), OLD_UNREADABLE, UNDATED, FOREIGN])
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT, store })
  await s.clock.set(NOW)
  await start($)

  const before = must((await cockpit($, 'doctor')).text).split('\n')
  expect(before[2]).toBe('Main of w18: none. Run /cockpit to claim it.')
  expect(before[3]).toBe('Sources: polled only by main, and this session is not main.')
  expect(before.filter((l) => l.startsWith('  ') && l.includes('cockpit:'))).toEqual([
    '  16 d   cockpit:report:THV-9:sid-gone  older than 14 days, main deletes it  (unreadable)',
    '  15 d   cockpit:report:THV-1041:sid-b  older than 14 days, main deletes it',
    '  15 d   cockpit:main:w4D',
    '  13 d   cockpit:verdict:THV-1003:sid-c',
    '  ?      cockpit:note  (unreadable)',
  ])
  // Doctor reads only: no claim, no poll, no write, nothing deleted.
  expect([s.setKeys, s.snapshots(), s.opened]).toEqual([[], 0, []])
  expect(s.saved.has('cockpit:report:THV-1041:sid-b')).toBe(true)

  await cockpit($)
  await s.clock.advance(0)
  expect([...s.saved.keys()].sort()).toEqual(['cockpit:main:w18', 'cockpit:main:w4D', 'cockpit:note', 'cockpit:verdict:THV-1003:sid-c', 'spike:ping'])
  // Deleting wrote no value back: the only sets are main's own claim.
  expect(s.setKeys).toEqual(['cockpit:main:w18'])

  const after = must((await cockpit($, 'doctor')).text).split('\n')
  expect(after[2]).toBe('Main of w18: this session, claimed 0 s ago.')
  expect(after.slice(3, 10)).toEqual(['Sources:', '  herdr: ok', '  pane labels: ok', '  Live spaces: ok', '  git: ok', '  gh: ok', '  dispatch inbox: ok'])
  expect(after.some((l) => l.includes('older than 14 days'))).toBe(false)
})

test('main runs an expiry pass once an hour, not every tick', { timeoutMs: 20_000 }, async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT })
  await s.clock.set(NOW)
  await start($)
  await cockpit($)
  await s.clock.advance(0)
  const late = report('THV-1041', 'sid-b', NOW - 15 * DAY)
  s.saved.set(keyOf(late), late)
  await s.clock.advance(30 * 60_000)
  expect(s.saved.has(keyOf(late))).toBe(true)
  await s.clock.advance(31 * 60_000)
  expect(s.saved.has(keyOf(late))).toBe(false)
})

test('doctor shows the folder the plugin loaded from', async ($, on) => {
  stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT })
  await start($)
  const plugin = must((await cockpit($, 'doctor')).text).split('\n')[1] ?? ''
  expect(plugin).toMatch(/^Plugin: \/.*thoven-cockpit, (the main checkout|not the main checkout \(.+\))\. CLAUDE_CODE_PLUGIN_DIRS: unset\.$/)
})
