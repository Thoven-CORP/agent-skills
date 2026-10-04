// S6: the doctor and key expiry. The pure rules on real PR fixtures (no kit), then sessions under
// kit stubs: doctor in a pane session and in main, and main deleting a 15-day-old key.
//
// Derived inputs: stored facts are built literals whose text is a real status line from
// fixtures/reports.ts, and whose `at` places them in time. The Linear entries are built literals
// (stage.ts linearEntry), so each test names the one state it turns on.

import { expect, test } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { doctor, mainCheckoutDir } from '../hooks/doctor.ts'
import { EXPIRY_MS, ageOf, expired, isMergedAndDone, keptBy, type LinearEntries, type Stored } from '../hooks/expiry.ts'
import { indexFacts } from '../hooks/facts.ts'
import { FRONTEND, parsePrList } from '../hooks/github.ts'
import { linearOf, parseStates, readbacks, type LinearView } from '../hooks/linear.ts'
import { isLinearEventId, isPaneId, isSessionId, isSpaceId, type Fact, type Health, type Pr, type Ticket } from '../hooks/model.ts'
import { HEARTBEAT_MS } from '../hooks/sources.ts'
import { keyOf, parseFact } from '../hooks/store.ts'
import { doctorText } from '../hooks/view.ts'
import { GH_FRONTEND } from './fixtures/github.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { LINEAR_STATES_945_1038 } from './fixtures/linear.ts'
import { HOME, cockpit, idOf, linearEntry, mainOf, must, relabelTab, stage, start, tk, worldOf } from './stage.ts'

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
const DONE: LinearEntries = new Map([[tk('THV-1038'), linearEntry('Done', 'completed')]])

// ── unit: the expiry rules ───────────────────────────────────────────────────────────────────

test('a key last written 15 days ago expires, one written 13 days ago and a main claim do not', async () => {
  const gone = expired(storedOf([entry(OLD_REPORT), entry(RECENT_VERDICT), entry(OLD_CLAIM), OLD_UNREADABLE, UNDATED, FOREIGN]), { now: NOW, prs: undefined, linear: undefined, onBoard: new Set(), closed: new Set() })
  expect(gone).toEqual([
    { key: 'cockpit:report:THV-1041:sid-b', why: 'untouched' },
    { key: 'cockpit:report:THV-9:sid-gone', why: 'untouched' },
  ])
  expect(ageOf(OLD_REPORT, NOW)).toBe(15 * DAY)
  expect(ageOf('free text', NOW)).toBe(undefined)
})

test('the 14-day line: exactly 14 days stays, a millisecond more expires', async () => {
  const at = (age: number): Stored[] => storedOf([entry(report('THV-1041', 'sid-b', NOW - age))])
  const ctx = { now: NOW, prs: undefined, linear: undefined, onBoard: new Set<never>(), closed: new Set<never>() }
  expect(expired(at(EXPIRY_MS), ctx)).toEqual([])
  expect(expired(at(EXPIRY_MS + 1), ctx).map((e) => e.why)).toEqual(['untouched'])
})

test('FE #138 merged and THV-1038 reads Done: every fresh THV-1038 key goes once the ticket leaves the board', async () => {
  const fresh = NOW - 60_000
  const keys = storedOf([entry(report('THV-1038', 'sid-b', fresh)), entry({ kind: 'happened', ticket: tk('THV-1038'), event: idOf(isLinearEventId, 'merged-138'), at: fresh }), entry(report('THV-1045', 'sid-b', fresh))])
  expect(isMergedAndDone(tk('THV-1038'), prs(), DONE)).toBe(true)
  expect(expired(keys, { now: NOW, prs: prs(), linear: DONE, onBoard: new Set(), closed: new Set() })).toEqual([
    { key: 'cockpit:report:THV-1038:sid-b', why: 'merged-done' },
    { key: 'cockpit:happened:THV-1038:merged-138', why: 'merged-done' },
  ])
  // Still on screen, not Done yet, no Linear read, or no merged PR: nothing goes.
  expect(expired(keys, { now: NOW, prs: prs(), linear: DONE, onBoard: new Set([tk('THV-1038')]), closed: new Set() })).toEqual([])
  expect(expired(keys, { now: NOW, prs: prs(), linear: new Map([[tk('THV-1038'), linearEntry('In Review', 'started')]]), onBoard: new Set(), closed: new Set() })).toEqual([])
  expect(expired(keys, { now: NOW, prs: prs(), linear: undefined, onBoard: new Set(), closed: new Set() })).toEqual([])
  expect(expired(keys, { now: NOW, prs: prs().filter((p) => p.number !== 138), linear: DONE, onBoard: new Set(), closed: new Set() })).toEqual([])
})

test('Done is a completed state, whatever its name: THV-1038 in Shipped loses its keys, one in a started state named Done keeps them', async () => {
  const fresh = NOW - 60_000
  const keys = storedOf([entry(report('THV-1038', 'sid-b', fresh)), entry({ kind: 'happened', ticket: tk('THV-1038'), event: idOf(isLinearEventId, 'merged-138'), at: fresh })])
  const shipped: LinearEntries = new Map([[tk('THV-1038'), linearEntry('Shipped', 'completed')]])
  expect(isMergedAndDone(tk('THV-1038'), prs(), shipped)).toBe(true)
  expect(expired(keys, { now: NOW, prs: prs(), linear: shipped, onBoard: new Set(), closed: new Set() })).toEqual([
    { key: 'cockpit:report:THV-1038:sid-b', why: 'merged-done' },
    { key: 'cockpit:happened:THV-1038:merged-138', why: 'merged-done' },
  ])
  const startedDone: LinearEntries = new Map([[tk('THV-1038'), linearEntry('Done', 'started')]])
  expect(expired(keys, { now: NOW, prs: prs(), linear: startedDone, onBoard: new Set(), closed: new Set() })).toEqual([])
})

test('a happened key whose ticket is on the board never expires by age; its report and an off-board event still do', async () => {
  const event = (ticket: string, id: string): Fact => ({ kind: 'happened', ticket: tk(ticket), event: idOf(isLinearEventId, id), at: NOW - 15 * DAY })
  const keys = storedOf([entry(event('THV-1045', 'report-DONE')), entry(report('THV-1045', 'sid-b', NOW - 15 * DAY)), entry(event('THV-1041', 'report-DONE'))])
  expect(expired(keys, { now: NOW, prs: undefined, linear: undefined, onBoard: new Set([tk('THV-1045')]), closed: new Set() })).toEqual([
    { key: 'cockpit:report:THV-1045:sid-b', why: 'untouched' },
    { key: 'cockpit:happened:THV-1041:report-DONE', why: 'untouched' },
  ])
})

// THV-1104: a report event leaves the Linear cell only through an `update` and a newer `readback`
// (linear.ts linearOf). Both probes are the THV-1096 verifier's, on the real expired() and linearOf().
const REPORT_EVENT = idOf(isLinearEventId, 'report-DONE_WITH_CONCERNS')
/** THV-1045 In Progress, in the team's states from the real 2026-10-03 read. */
const TEAM_STATES = must(parseStates(LINEAR_STATES_945_1038, [tk('THV-1038')], 0)).states
const IN_PROGRESS = must(TEAM_STATES.find((s) => s.name === 'In Progress'))
const VIEW_1045: LinearView = { asked: [tk('THV-1045')], issues: new Map([[tk('THV-1045'), { state: IN_PROGRESS, parent: undefined, at: NOW }]]), states: TEAM_STATES }
/** The set-status.js line s4 parses, as the readback fact record() stores. */
const READBACK_1045 = must(readbacks('THV-1045 In Progress\n')[0])

/** A report-event round trip for THV-1045: the report, its event, the update sent, and the read-back after it. */
const roundTrip = (ages: { report: number; happened: number; update: number; readback: number }): Fact[] => [
  report('THV-1045', 'sid-b', NOW - ages.report),
  { kind: 'happened', ticket: tk('THV-1045'), event: REPORT_EVENT, at: NOW - ages.happened },
  { kind: 'update', ticket: tk('THV-1045'), event: REPORT_EVENT, at: NOW - ages.update - 1000 },
  { kind: 'readback', ticket: tk('THV-1045'), sid: sid('sid-b'), isError: READBACK_1045.isError, text: READBACK_1045.text, at: NOW - ages.readback },
]

/** A 15-day-old round trip for THV-1045, on the board in SNAPSHOT, and a 15-day-old event for THV-1041, which is not. */
const LATE: Fact[] = [...roundTrip({ report: 15 * DAY, happened: 15 * DAY, update: 15 * DAY, readback: 15 * DAY }), { kind: 'happened', ticket: tk('THV-1041'), event: REPORT_EVENT, at: NOW - 15 * DAY }]

function cellAcrossExpiry(facts: Fact[], onBoard: ReadonlySet<Ticket>) {
  const stored = storedOf(facts.map(entry))
  const gone = new Set(expired(stored, { now: NOW, prs: undefined, linear: undefined, onBoard, closed: new Set() }).map((e) => e.key))
  const left = stored.flatMap((s) => (gone.has(s.key) ? [] : (parseFact(s.key, s.value) ?? [])))
  const cell = (fs: readonly Fact[]) => linearOf(tk('THV-1045'), indexFacts(fs).about(tk('THV-1045')), [], VIEW_1045).k
  return { deleted: [...gone].sort(), before: cell(facts), after: cell(left) }
}

test('probe A: every key of a report round trip 15 days old, ticket on the board: only the report goes and the Linear cell stays ok', async () => {
  const r = cellAcrossExpiry(roundTrip({ report: 15 * DAY, happened: 15 * DAY, update: 15 * DAY, readback: 15 * DAY }), new Set([tk('THV-1045')]))
  expect(r).toEqual({ deleted: ['cockpit:report:THV-1045:sid-b'], before: 'ok', after: 'ok' })
})

test('probe B: happened 20 days old, update and read-back 15, a fresh report, ticket on the board: nothing goes and the Linear cell stays ok', async () => {
  const r = cellAcrossExpiry(roundTrip({ report: DAY, happened: 20 * DAY, update: 15 * DAY, readback: 15 * DAY }), new Set([tk('THV-1045')]))
  expect(r).toEqual({ deleted: [], before: 'ok', after: 'ok' })
})

test('the same round trip for a ticket off the board expires by age, every key', async () => {
  const r = cellAcrossExpiry(roundTrip({ report: 15 * DAY, happened: 15 * DAY, update: 15 * DAY, readback: 15 * DAY }), new Set())
  expect(r.deleted).toEqual(['cockpit:happened:THV-1045:report-DONE_WITH_CONCERNS', 'cockpit:readback:THV-1045:sid-b', 'cockpit:report:THV-1045:sid-b', 'cockpit:update:THV-1045:report-DONE_WITH_CONCERNS'])
})

// ── unit: the doctor report ──────────────────────────────────────────────────────────────────

const HEALTH: Health = { herdr: { k: 'ok' }, labels: { k: 'ok' }, spaces: { k: 'ok' }, git: { k: 'ok' }, github: { k: 'unavailable' }, inbox: { k: 'ok' }, codex: { k: 'ok' }, linear: { k: 'ok' } }

test('doctor lists keys older than 14 days first, oldest first, then the rest, undated last', async () => {
  const r = doctor({
    now: NOW,
    stored: storedOf([entry(RECENT_VERDICT), UNDATED, entry(OLD_REPORT), OLD_UNREADABLE, FOREIGN, entry(claim('w18', 'w18:p8W', NOW - DAY))]),
    space: idOf(isSpaceId, 'w18'),
    pane: idOf(isPaneId, 'w18:p8W'),
    board: { health: HEALTH, project: 'Thoven cockpit', build: [] },
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
  expect(text.split('\n').slice(0, 13)).toEqual([
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
    '  Linear: ok',
    'Store: 5 cockpit keys.',
  ])
  expect(text.split('\n').slice(13)).toEqual([
    '  16 d   cockpit:report:THV-9:sid-gone  older than 14 days, main deletes it  (unreadable)',
    '  15 d   cockpit:report:THV-1041:sid-b  older than 14 days, main deletes it',
    '  13 d   cockpit:verdict:THV-1003:sid-c',
    '  1 d    cockpit:main:w18',
    '  ?      cockpit:note  (unreadable)',
  ])
})

test('doctor names a worktree load, another session\'s claim, and a session outside herdr', async () => {
  const base = { now: NOW, board: undefined, stored: storedOf([entry(claim('w18', 'w18:p7W', NOW - 3 * 3_600_000))]) }
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

test('doctor in a space with no Project says Linear is not read here, not ok', async () => {
  const at = (project: string | undefined) => doctorText(doctor({ now: NOW, stored: [], space: idOf(isSpaceId, 'w18'), pane: idOf(isPaneId, 'w18:p8W'), board: { health: HEALTH, project, build: [] }, plugin: { root: mainCheckoutDir(HOME), env: undefined, home: HOME } })).split('\n')
  expect(at(undefined)).toContain('  Linear: not read here, this space has no Project')
  expect(at(undefined)).not.toContain('  Linear: ok')
  expect(at('Thoven cockpit')).toContain('  Linear: ok')
})

test('doctor whose Live spaces never answered says that is why Linear is not read, not that the space has no Project', async () => {
  const health: Health = { ...HEALTH, spaces: { k: 'unavailable' } }
  const lines = doctorText(doctor({ now: NOW, stored: [], space: idOf(isSpaceId, 'w18'), pane: idOf(isPaneId, 'w18:p8W'), board: { health, project: undefined, build: [] }, plugin: { root: mainCheckoutDir(HOME), env: undefined, home: HOME } })).split('\n')
  expect(lines.filter((l) => l.startsWith('  Linear:'))).toEqual(['  Linear: not read here, Live spaces is unavailable'])
})

test('doctor in main flags exactly the keys main deletes: THV-1045 on the board keeps its round trip, THV-1041 off it does not', async () => {
  const board = project(worldOf(mainOf('w18', 'w18:p8W'), SNAPSHOT))
  const stored = storedOf(LATE.map(entry))
  const r = doctor({ now: NOW, stored, space: idOf(isSpaceId, 'w18'), pane: idOf(isPaneId, 'w18:p8W'), board, plugin: { root: mainCheckoutDir(HOME), env: undefined, home: HOME } })
  const flagged = r.keys.flatMap((k) => (k.isExpired ? [k.key] : [])).sort()
  expect(flagged).toEqual(['cockpit:happened:THV-1041:report-DONE_WITH_CONCERNS', 'cockpit:report:THV-1045:sid-b'])
  expect(flagged).toEqual(expired(stored, { now: NOW, prs: undefined, linear: undefined, ...keptBy(board) }).map((e) => e.key).sort())
  expect(doctorText(r).split('\n').filter((l) => l.includes('THV-1045:'))).toEqual([
    '  15 d   cockpit:report:THV-1045:sid-b  older than 14 days, main deletes it',
    '  15 d   cockpit:update:THV-1045:report-DONE_WITH_CONCERNS',
    '  15 d   cockpit:happened:THV-1045:report-DONE_WITH_CONCERNS',
    '  15 d   cockpit:readback:THV-1045:sid-b',
  ])
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
  expect([...s.saved.keys()].sort()).toEqual(['cockpit:happened:THV-1045:started', 'cockpit:main:w18', 'cockpit:main:w4D', 'cockpit:note', 'cockpit:verdict:THV-1003:sid-c', 'spike:ping'])
  // Deleting wrote no value back: the only sets are main's own claim.
  // Main writes only its own keys: its claim, and the set-once started event S4 records for the row on screen.
  expect(s.setKeys).toEqual(['cockpit:main:w18', 'cockpit:happened:THV-1045:started'])

  const after = must((await cockpit($, 'doctor')).text).split('\n')
  expect(after[2]).toBe('Main of w18: this session, claimed 0 s ago.')
  expect(after.slice(3, 10)).toEqual(['Sources:', '  herdr: ok', '  pane labels: ok', '  Live spaces: ok', '  git: ok', '  gh: ok', '  dispatch inbox: ok'])
  expect(after.some((l) => l.includes('older than 14 days'))).toBe(false)
  // w18 is Research, which has no row in Live spaces: main never reads Linear there.
  expect(after.filter((l) => l.startsWith('  Linear:'))).toEqual(['  Linear: not read here, this space has no Project'])
})

test('main keeps a 15-day-old happened key for the ticket on screen, so its event is not recorded again', async ($, on) => {
  const started: Fact = { kind: 'happened', ticket: tk('THV-1045'), event: idOf(isLinearEventId, 'started'), at: NOW - 15 * DAY }
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT, store: Object.fromEntries([entry(started)]) })
  await s.clock.set(NOW)
  await start($)
  await cockpit($)
  await s.clock.advance(0)
  await s.clock.advance(HEARTBEAT_MS)
  expect(s.saved.get('cockpit:happened:THV-1045:started')).toEqual(started)
  expect(s.setKeys).toEqual(['cockpit:main:w18'])
})

test('doctor in main flags exactly the keys main\'s next pass deletes, and THV-1045 on screen keeps its round trip', { timeoutMs: 20_000 }, async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT })
  await s.clock.set(NOW)
  await start($)
  await cockpit($)
  await s.clock.advance(0)
  for (const f of LATE) s.saved.set(keyOf(f), f)
  const flagged = must((await cockpit($, 'doctor')).text).split('\n').filter((l) => l.includes('main deletes it'))
  expect(flagged).toEqual([
    '  15 d   cockpit:happened:THV-1041:report-DONE_WITH_CONCERNS  older than 14 days, main deletes it',
    '  15 d   cockpit:report:THV-1045:sid-b  older than 14 days, main deletes it',
  ])
  await s.clock.advance(61 * 60_000)
  expect(LATE.map(keyOf).filter((k) => !s.saved.has(k)).sort()).toEqual(['cockpit:happened:THV-1041:report-DONE_WITH_CONCERNS', 'cockpit:report:THV-1045:sid-b'])
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
