// S2a: reports and fix rounds. The dispatch-work grammar on real prompt text (no kit), the board
// cells it fills, then the hooks under kit stubs: a prompt or hand-back writes a fact, main's own
// send.sh call writes a fact, the inbox marks an unsent report, and main reads them all.

import { expect, test } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { inboxFile, readPrompt, sendCalls, statusLines, unwrapPasted } from '../hooks/dispatch.ts'
import { parseSnapshot } from '../hooks/herdr.ts'
import type { Fact, InboxFile, Main, PaneId, Polled, Row, SessionId, Snapshot, Sources, SpaceId, World } from '../hooks/model.ts'
import { parseLiveSpaces } from '../hooks/sources.ts'
import { parseFact, parseKey } from '../hooks/store.ts'
import { cellText } from '../hooks/view.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { INBOX_NAMES, OUT_ESCALATION_THV_1004, OUT_RESEARCH_THV_1038_HEAD } from './fixtures/inbox.ts'
import {
  BLOCKED_THV_869,
  BUILD_BRIEF_THV_1014,
  DONE_WITH_CONCERNS_THV_967,
  FIX_ROUND_2_THV_711,
  FIX_ROUND_3_THV_1015,
  INDENTED_VERIFIED_THV_1003,
  NEEDS_CONTEXT_THV_929,
  PASTED_CONCERNS_THV_1041,
  PASTED_DONE_FIX_ROUND_THV_1041,
  VERIFY_BRIEF_THV_1016,
} from './fixtures/reports.ts'
import { SEND_1, SEND_2, SEND_3, SEND_4, SEND_5, SEND_6, SEND_FIX2_THV_1004 } from './fixtures/send.ts'
import { WORKFLOW_LIVE_SPACES } from './fixtures/workflow.ts'
import { HOME, MAIN_CWD, PANE, TMPDIR, bash, cockpit, receive, relabelTab, stage, start, submit } from './stage.ts'

/** p8V's session id in SNAPSHOT_LIVE (`agent_session.value`). */
const P8V_SID = '27c71f2d-e064-4ebc-ae51-e993d40abfac'
/** Derived: the `Mods` tab named the way label.sh would name THV-1041's build tab. */
const SNAPSHOT_W18_1041 = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Archived learner purge (THV-1041)')
/** Derived: what `$TMPDIR/dispatch/out/THV-1041.md` held, since send.sh sends `"$(cat <that file>)"`. */
const OUT_THV_1041 = unwrapPasted(PASTED_CONCERNS_THV_1041).trim() + '\n'

const fresh = <T>(value: T): Polled<T> => ({ k: 'fresh', value, at: 0 })
const never = { k: 'never' } as const

function snap(json: string): Snapshot {
  const s = parseSnapshot(json)
  if (!s) throw new Error('fixture did not parse')
  return s
}

function mainOf(space: string, pane: string): Main {
  return { k: 'main', space: space as SpaceId, pane: pane as PaneId, sid: 'sid-main' as SessionId, cwd: MAIN_CWD, home: HOME, tmp: TMPDIR }
}

function worldOf(me: Main, snapshot: string, facts: Fact[], extra: Partial<Sources> = {}): World {
  return {
    now: 10_000,
    me,
    sources: {
      herdr: fresh(snap(snapshot)),
      labels: never,
      spaces: fresh(parseLiveSpaces(WORKFLOW_LIVE_SPACES)),
      heads: never,
      branches: never,
      github: never,
      linear: never,
      inbox: never,
      codex: never,
      ...extra,
    },
    facts,
    readbacks: new Map(),
    inFlight: new Set(),
    mainSkill: undefined,
  }
}

/** What main reads back from the store: every key that parses, as loadFacts does. */
function factsIn(saved: Map<string, unknown>): Fact[] {
  return [...saved].flatMap(([key, value]) => {
    const info = parseKey(key)
    const fact = info ? parseFact(info, value) : undefined
    return fact ? [fact] : []
  })
}

function rowOf(world: World, ticket: string): Row {
  const row = project(world)
    .build.flatMap((g) => (g.k === 'single' ? [g.row] : g.children))
    .find((r) => r.ticket === ticket)
  if (!row) throw new Error(`no row for ${ticket}`)
  return row
}

const W18_MAIN = mainOf('w18', 'w18:p8W')

// ── unit: the status-line parser (ADR6) ─────────────────────────────────────────────────────

test('a pasted report reads DONE_WITH_CONCERNS with its one unmet Acceptance row', async () => {
  expect(statusLines(PASTED_CONCERNS_THV_1041)).toEqual([{ ticket: 'THV-1041', word: 'DONE_WITH_CONCERNS', line: 'DONE_WITH_CONCERNS THV-1041' }])
  expect(readPrompt(PASTED_CONCERNS_THV_1041)).toEqual({
    briefs: [],
    lines: [{ ticket: 'THV-1041', word: 'DONE_WITH_CONCERNS', line: 'DONE_WITH_CONCERNS THV-1041' }],
    concerns: 1,
  })
})

test('an indented verdict in a subagent hand-back reads VERIFIED', async () => {
  expect(statusLines(INDENTED_VERIFIED_THV_1003)).toEqual([{ ticket: 'THV-1003', word: 'VERIFIED', line: '  VERIFIED THV-1003' }])
})

test('suffix text after the ticket still reads as DONE', async () => {
  expect(statusLines(PASTED_DONE_FIX_ROUND_THV_1041)).toEqual([{ ticket: 'THV-1041', word: 'DONE', line: 'DONE THV-1041 (fix round 1)' }])
})

test('the DONE prefix trap: DONE_WITH_CONCERNS is never DONE', async () => {
  expect(statusLines(DONE_WITH_CONCERNS_THV_967).map((l) => [l.ticket, l.word])).toEqual([['THV-967', 'DONE_WITH_CONCERNS']])
  // The spec's own case, `DONE_WITH_CONCERNS THV-7`.
  expect(statusLines('DONE_WITH_CONCERNS THV-7')).toEqual([{ ticket: 'THV-7', word: 'DONE_WITH_CONCERNS', line: 'DONE_WITH_CONCERNS THV-7' }])
})

test('typed text above a paste, and a peer wrapper, still give their status lines', async () => {
  expect(statusLines(BLOCKED_THV_869).map((l) => [l.ticket, l.word])).toEqual([['THV-869', 'BLOCKED']])
  expect(statusLines(NEEDS_CONTEXT_THV_929).map((l) => [l.ticket, l.word])).toEqual([['THV-929', 'NEEDS_CONTEXT']])
})

// ── unit: briefs are not reports ───────────────────────────────────────────────────────────

test('a verifier brief quoting the builder DONE line is a brief, not a report', async () => {
  // The quoted line is there, line-anchored, so only the brief rule keeps it out.
  expect(unwrapPasted(VERIFY_BRIEF_THV_1016).split('\n')).toContain('DONE THV-1016')
  expect(readPrompt(VERIFY_BRIEF_THV_1016)).toEqual({
    briefs: [{ ticket: 'THV-1016', role: 'verifier', round: 0, playbook: 'Verify', title: 'Marketplace search tracking: report age, genre and subject filters' }],
    lines: [],
    concerns: 0,
  })
})

test('a builder brief gives its ticket, kind and title, and no status line', async () => {
  expect(readPrompt(BUILD_BRIEF_THV_1014)).toEqual({
    briefs: [{ ticket: 'THV-1014', role: 'builder', round: 0, playbook: 'Build', title: "Compiled-CSS tests can't fail: Tailwind builds the sheet from the tests' own class strings" }],
    lines: [],
    concerns: 0,
  })
})

test('a FIX ROUND prompt is a builder brief for that round, pasted or typed', async () => {
  expect(readPrompt(FIX_ROUND_3_THV_1015).briefs).toEqual([{ ticket: 'THV-1015', role: 'builder', round: 3 }])
  expect(readPrompt(FIX_ROUND_2_THV_711).briefs).toEqual([{ ticket: 'THV-711', role: 'builder', round: 2 }])
  expect(readPrompt(FIX_ROUND_3_THV_1015).lines).toEqual([])
})

// ── unit: main's send.sh calls ─────────────────────────────────────────────────────────────

test('send.sh calls give the pane, ticket, role and round from the brief file name', async () => {
  expect(sendCalls(SEND_FIX2_THV_1004)).toEqual([{ pane: 'w40:pC', ticket: 'THV-1004', role: 'builder', round: 2, file: 'THV-1004-fix2.md' }])
  expect(sendCalls(SEND_1)).toEqual([{ pane: 'w4X:p1', ticket: 'THV-1029', role: 'builder', round: 1, file: 'THV-1029-fix1.md' }])
  expect(sendCalls(SEND_2)).toEqual([{ pane: 'w4V:p2', ticket: 'THV-1030', role: 'builder', round: 0, file: 'THV-1030.md' }])
  expect(sendCalls(SEND_3)).toEqual([{ pane: 'w4V:p3', ticket: 'THV-1030', role: 'verifier', round: 0, file: 'THV-1030-verify.md' }])
  expect(sendCalls(SEND_4)).toEqual([{ pane: 'w40:pA', ticket: 'THV-1042', role: 'builder', round: 0, file: 'THV-1042.md' }])
  expect(sendCalls(SEND_5)).toEqual([{ pane: 'w18:p7W', ticket: 'THV-980', role: 'verifier', round: 0, file: 'THV-980-verify.md' }])
  expect(sendCalls(SEND_6)).toEqual([{ pane: 'w18:p5J', ticket: 'THV-768', role: 'verifier', round: 0, file: 'THV-768-verify.md' }])
  expect(sendCalls('herdr agent read w4V:p2 --source visible --lines 15')).toEqual([])
})

// ── unit: the inbox ────────────────────────────────────────────────────────────────────────

test('an inbox file is an unsent report only when it starts with its own status line', async () => {
  expect(inboxFile('THV-1041.md', OUT_THV_1041, 7000)).toEqual({
    name: 'THV-1041.md',
    ticket: 'THV-1041',
    line: { ticket: 'THV-1041', word: 'DONE_WITH_CONCERNS', line: 'DONE_WITH_CONCERNS THV-1041' },
    head: 'DONE_WITH_CONCERNS THV-1041',
    at: 7000,
  })
  expect(inboxFile('THV-1004.md', OUT_ESCALATION_THV_1004, 1)?.line).toBeUndefined()
  expect(inboxFile('THV-1004.md', OUT_ESCALATION_THV_1004, 1)?.head).toBe(
    '[thoven verify] THV-1004 pane w56:p1 reported done 3 times and still: 1 live process: sleep 30 (pid 71389). Nudged 2x; needs you.',
  )
  expect(inboxFile('THV-1038.md', OUT_RESEARCH_THV_1038_HEAD, 1)?.line).toBeUndefined()
  expect(INBOX_NAMES.map((n) => inboxFile(n, '', 1)?.ticket)).toEqual(['THV-1004', 'THV-1038', 'THV-909', 'THV-911', 'THV-912', 'THV-914', undefined])
})

// ── unit: the board cells ───────────────────────────────────────────────────────────────────

const report = (ticket: string, sid: string, status: 'DONE' | 'DONE_WITH_CONCERNS' | 'NEEDS_CONTEXT' | 'BLOCKED', at: number, concerns = 0): Fact => ({
  kind: 'report',
  ticket: ticket as never,
  sid: sid as SessionId,
  status,
  text: `${status} ${ticket}`,
  concerns,
  at,
})

test('Report cell glyphs: done, concerns with their count, ask, blocked', async () => {
  const cell = (status: 'DONE' | 'DONE_WITH_CONCERNS' | 'NEEDS_CONTEXT' | 'BLOCKED', concerns = 0) =>
    cellText(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [report('THV-1041', 'sid-b', status, 1000, concerns)]), 'THV-1041')).report
  expect(cell('DONE')).toBe('✓')
  expect(cell('DONE_WITH_CONCERNS', 1)).toBe('1 !')
  expect(cell('DONE_WITH_CONCERNS', 0)).toBe('!')
  expect(cell('NEEDS_CONTEXT')).toBe('ask')
  expect(cell('BLOCKED')).toBe('blocked')
})

test('the newest report by at wins, whichever session received it', async () => {
  const older = report('THV-1041', 'sid-main', 'DONE_WITH_CONCERNS', 1000, 1)
  const newer = report('THV-1041', 'sid-b', 'DONE', 5000)
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [newer, older]), 'THV-1041').report).toEqual({ k: 'in', status: 'DONE', at: 5000, concerns: 0, selfChecked: false })
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [older, newer]), 'THV-1041').report).toEqual({ k: 'in', status: 'DONE', at: 5000, concerns: 0, selfChecked: false })
})

test('an inbox file newer than any delivered report shows unsent; an older one does not', async () => {
  const file = inboxFile('THV-1041.md', OUT_THV_1041, 7000) as InboxFile
  const inbox = { inbox: fresh([file]) }
  const unsent = rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [report('THV-1041', 'sid-b', 'DONE', 5000)], inbox), 'THV-1041')
  expect(unsent.report).toEqual({ k: 'undelivered', status: 'DONE_WITH_CONCERNS', file: 'THV-1041.md', selfChecked: false })
  expect(cellText(unsent).report).toBe('unsent')
  const delivered = rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [report('THV-1041', 'sid-b', 'DONE', 9000)], inbox), 'THV-1041')
  expect(delivered.report.k).toBe('in')
})

test('Fix cell: main send.sh round wins; without one, the pane FIX ROUND brief gives it', async () => {
  const send: Fact = { kind: 'send', ticket: 'THV-1041' as never, pane: 'w40:pC' as PaneId, role: 'builder', round: 2, file: 'THV-1041-fix2.md', at: 1 }
  const brief: Fact = { kind: 'brief', ticket: 'THV-1041' as never, sid: P8V_SID as SessionId, pane: 'w18:p8V' as PaneId, role: 'builder', round: 3, at: 2 }
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [send, brief]), 'THV-1041').fix).toEqual({ k: 'round', round: 2, of: 5 })
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [brief]), 'THV-1041').fix).toEqual({ k: 'round', round: 3, of: 5 })
  expect(cellText(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [brief]), 'THV-1041')).fix).toBe('3/5')
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, []), 'THV-1041').fix).toEqual({ k: 'none' })
})

test('a report on a row asks main to record report STATUS once; a recorded one is not asked again', async () => {
  const done = report('THV-1041', 'sid-b', 'DONE', 5000)
  expect(project(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [done])).newEvents).toEqual([{ ticket: 'THV-1041', event: { k: 'report', status: 'DONE' }, id: 'report-DONE' }])
  const happened: Fact = { kind: 'happened', ticket: 'THV-1041' as never, event: 'report-DONE' as never, at: 5000 }
  expect(project(worldOf(W18_MAIN, SNAPSHOT_W18_1041, [done, happened])).newEvents).toEqual([])
})

// ── kit: the hooks write facts ─────────────────────────────────────────────────────────────

test('a pasted report reaching a pane session writes its report fact', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  await s.clock.advance(3000)
  await submit($, PASTED_CONCERNS_THV_1041)
  expect(s.saved.get(`cockpit:report:THV-1041:${P8V_SID}`)).toEqual({
    kind: 'report',
    ticket: 'THV-1041',
    sid: P8V_SID,
    status: 'DONE_WITH_CONCERNS',
    text: 'DONE_WITH_CONCERNS THV-1041',
    concerns: 1,
    at: 3000,
  })
  expect(cellText(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, factsIn(s.saved)), 'THV-1041')).report).toBe('1 !')
})

test('an indented verdict in a peer hand-back writes a verdict fact', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  await receive($, INDENTED_VERIFIED_THV_1003)
  expect(s.saved.get(`cockpit:verdict:THV-1003:${P8V_SID}`)).toEqual({
    kind: 'verdict',
    ticket: 'THV-1003',
    sid: P8V_SID,
    verdict: 'VERIFIED',
    text: '  VERIFIED THV-1003',
    at: 0,
  })
})

test('a report reaching a non-main session lands as a fact main reads, newest by at winning', async ($, on) => {
  const older = { kind: 'report', ticket: 'THV-1041', sid: 'sid-main', status: 'DONE_WITH_CONCERNS', text: 'DONE_WITH_CONCERNS THV-1041', concerns: 1, at: 1000 }
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE, store: { 'cockpit:report:THV-1041:sid-main': older } })
  await start($)
  await s.clock.advance(5000)
  await submit($, PASTED_DONE_FIX_ROUND_THV_1041)
  const row = rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, factsIn(s.saved)), 'THV-1041')
  expect(row.report).toEqual({ k: 'in', status: 'DONE', at: 5000, concerns: 0, selfChecked: false })
  expect(cellText(row).report).toBe('✓')
})

test('Bash send.sh of THV-1004-fix2.md writes the send fact, and the Fix cell reads 2/5', async ($, on) => {
  const s = stage(on, { pane: 'w56:p2', sid: 'sid-main', snapshot: SNAPSHOT_LIVE })
  await start($)
  await bash($, SEND_FIX2_THV_1004)
  expect(s.saved.get('cockpit:send:THV-1004:w40:pC')).toEqual({ kind: 'send', ticket: 'THV-1004', pane: 'w40:pC', role: 'builder', round: 2, file: 'THV-1004-fix2.md', at: 0 })
  // w56:p1's terminal title names THV-1004.
  const row = rowOf(worldOf(mainOf('w56', 'w56:p2'), SNAPSHOT_LIVE, factsIn(s.saved)), 'THV-1004')
  expect(row.fix).toEqual({ k: 'round', round: 2, of: 5 })
  expect(cellText(row).fix).toBe('2/5')
})

test('FIX ROUND 3/5 received by a pane with no send.sh gives Fix round 3', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  await submit($, FIX_ROUND_3_THV_1015)
  expect(s.saved.get(`cockpit:brief:THV-1015:${P8V_SID}`)).toEqual({ kind: 'brief', ticket: 'THV-1015', sid: P8V_SID, pane: 'w18:p8V', role: 'builder', round: 3, at: 0 })
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_LIVE, factsIn(s.saved)), 'THV-1015').fix).toEqual({ k: 'round', round: 3, of: 5 })
})

test('a brief received by an unlabelled pane ties that pane to its ticket', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  await submit($, BUILD_BRIEF_THV_1014)
  expect(s.saved.get(`cockpit:brief:THV-1014:${P8V_SID}`)).toEqual({
    kind: 'brief',
    ticket: 'THV-1014',
    sid: P8V_SID,
    pane: 'w18:p8V',
    role: 'builder',
    round: 0,
    playbook: 'Build',
    title: "Compiled-CSS tests can't fail: Tailwind builds the sheet from the tests' own class strings",
    at: 0,
  })
})

test('the tie: p8V, whose Mods tab has no label, is the THV-1014 Build row and leaves Other', async () => {
  const brief: Fact = {
    kind: 'brief',
    ticket: 'THV-1014' as never,
    sid: P8V_SID as SessionId,
    pane: 'w18:p8V' as PaneId,
    role: 'builder',
    round: 0,
    playbook: 'Build',
    title: "Compiled-CSS tests can't fail: Tailwind builds the sheet from the tests' own class strings",
    at: 1,
  }
  const board = project(worldOf(W18_MAIN, SNAPSHOT_LIVE, [brief]))
  const row = rowOf(worldOf(W18_MAIN, SNAPSHOT_LIVE, [brief]), 'THV-1014')
  expect([row.title, row.kind, row.origin, row.pane]).toEqual([
    "Compiled-CSS tests can't fail: Tailwind builds the sheet from the tests' own class strings",
    'Build',
    'dispatch',
    { k: 'live', status: 'idle', tool: 'C', pane: 'w18:p8V' },
  ])
  expect(board.other.map((o) => o.label)).toEqual(['tab "Research"'])
})

test('a verifier brief received by a pane writes a brief and no report', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  await submit($, VERIFY_BRIEF_THV_1016)
  expect([...s.saved.keys()]).toEqual([`cockpit:brief:THV-1016:${P8V_SID}`])
  expect((s.saved.get(`cockpit:brief:THV-1016:${P8V_SID}`) as { role: string }).role).toBe('verifier')
})

test('a plain prompt costs a pane session no store call', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  const before = s.storeCalls.n
  await submit($, 'run the tests again and tell me which failed')
  await bash($, 'git status --short')
  expect(s.storeCalls.n).toBe(before)
})

test('main draws an unsent report from the inbox, and records report DONE once', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-main', snapshot: SNAPSHOT_W18_1041 })
  s.inbox.set('THV-1041.md', { text: OUT_THV_1041, mtimeMs: 7000 })
  s.inbox.set('THV-1038.md', { text: OUT_RESEARCH_THV_1038_HEAD, mtimeMs: 7000 })
  await start($)
  await cockpit($)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: 'unsent' })).toBeDefined()

  // The pane's send succeeds: it deletes the file, and its report reaches main.
  s.inbox.delete('THV-1041.md')
  await s.clock.advance(1000)
  await submit($, PASTED_DONE_FIX_ROUND_THV_1041)
  await s.clock.advance(10_000)
  const drawn = await $.ui.mount(PANE)
  expect(await drawn.find({ type: 'Text', text: 'unsent' })).toBeUndefined()
  expect(await drawn.find({ type: 'Text', text: '✓' })).toBeDefined()
  const happened = s.saved.get('cockpit:happened:THV-1041:report-DONE')
  expect(happened).toEqual({ kind: 'happened', ticket: 'THV-1041', event: 'report-DONE', at: 5000 })
  await s.clock.advance(20_000)
  expect(s.saved.get('cockpit:happened:THV-1041:report-DONE')).toEqual(happened)
})
