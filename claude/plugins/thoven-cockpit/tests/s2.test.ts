// S2a: reports and fix rounds. The dispatch-work grammar on real prompt text (no kit), the board
// cells it fills, then the hooks under kit stubs: a prompt or hand-back writes a fact, main's own
// send.sh call writes a fact, the inbox marks an unsent report, and main reads them all.

import { expect, test } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { ciCell } from '../hooks/cells.ts'
import { inboxFile, readPrompt, sendCalls, statusLines, unwrapPasted } from '../hooks/dispatch.ts'
import { isLinearEventId, isPaneId, isSessionId, type Fact, type InboxFile } from '../hooks/model.ts'
import { AGENT_SKILLS, FRONTEND, parsePrList } from '../hooks/github.ts'
import { parseFact } from '../hooks/store.ts'
import { cellText } from '../hooks/view.ts'
import { GH_FRONTEND } from './fixtures/github.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { OUT_ESCALATION_THV_1004, OUT_RESEARCH_THV_1038_HEAD } from './fixtures/inbox.ts'
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
import { BUILT_CONCERNS_TABLE_THV_1045 } from './fixtures/built.ts'
import { SEND_1, SEND_2, SEND_3, SEND_4, SEND_5, SEND_6, SEND_FIX2_THV_1004 } from './fixtures/send.ts'
import { GH_AGENT_SKILLS_WAVE, SEND_P_THV_1095, SNAPSHOT_AFTER_WAVE, STORE_WAVE } from './fixtures/wave.ts'
import { PANE, bash, cockpit, fresh, idOf, mainOf, must, receive, relabelPane, relabelTab, rowOf, stage, start, submit, tk, worldOf } from './stage.ts'

/** p8V's session id in SNAPSHOT_LIVE (`agent_session.value`). */
const P8V_SID = '27c71f2d-e064-4ebc-ae51-e993d40abfac'
/** Derived: the `Mods` tab named the way label.sh would name THV-1041's build tab. */
const SNAPSHOT_W18_1041 = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Archived learner purge (THV-1041)')
/** Derived: what `$TMPDIR/dispatch/out/THV-1041.md` held, since send.sh sends `"$(cat <that file>)"`. */
const OUT_THV_1041 = unwrapPasted(PASTED_CONCERNS_THV_1041).trim() + '\n'

/** What main reads back from the store: every key that parses, as loadFacts does. */
function factsIn(saved: Map<string, unknown>): Fact[] {
  return [...saved].flatMap(([key, value]) => parseFact(key, value) ?? [])
}

/** A fact as the store hands it back, so its ids are minted by the store's own checks, never cast. */
function storedFact(key: string, value: object): Fact {
  const fact = parseFact(key, value)
  if (!fact) throw new Error(`${key} did not parse`)
  return fact
}

/** The title BUILD_BRIEF_THV_1014 quotes on its first line. */
const TITLE_1014 = "Compiled-CSS tests can't fail: Tailwind builds the sheet from the tests' own class strings"

test('a stored fact is read back only at its own key', async () => {
  const fact = { kind: 'send', ticket: 'THV-1004', pane: 'w40:pC', role: 'builder', round: 2, file: 'THV-1004-fix2.md', at: 1 }
  expect(parseFact('cockpit:send:THV-1004:w40:pC:builder:2', fact)).toEqual(fact)
  expect(parseFact('cockpit:send:THV-1004:w40:pD:builder:2', fact)).toBeUndefined()
  expect(parseFact('cockpit:brief:THV-1004:w40:pC', fact)).toBeUndefined()
  expect(parseFact('cockpit:send:THV-1004:w40:pC:builder:2', { ...fact, ticket: 'thv-1004' })).toBeUndefined()
  expect(parseFact('cockpit:send:THV-1004:w40:pC:builder:2', { ...fact, round: '2' })).toBeUndefined()
})

const W18_MAIN = mainOf('w18', 'w18:p8W')

// ── unit: the status-line parser (ADR6) ─────────────────────────────────────────────────────

const report1 = (ticket: string, word: string, line: string, concerns = 0) => ({ k: 'report', lines: [{ ticket, word, line, concerns }] })

/** Every prompt grammar case, read the one way a hook reads it: through readPrompt. */
const PROMPTS: ReadonlyArray<[string, string, unknown]> = [
  ['a pasted report reads DONE_WITH_CONCERNS with its one unmet Acceptance row', PASTED_CONCERNS_THV_1041, report1('THV-1041', 'DONE_WITH_CONCERNS', 'DONE_WITH_CONCERNS THV-1041', 1)],
  ['an indented verdict in a subagent hand-back reads VERIFIED', INDENTED_VERIFIED_THV_1003, report1('THV-1003', 'VERIFIED', '  VERIFIED THV-1003')],
  ['suffix text after the ticket still reads as DONE', PASTED_DONE_FIX_ROUND_THV_1041, report1('THV-1041', 'DONE', 'DONE THV-1041 (fix round 1)')],
  // The spec's own DONE prefix trap: DONE_WITH_CONCERNS is never DONE.
  ['the DONE prefix trap: DONE_WITH_CONCERNS THV-7 is never DONE', 'DONE_WITH_CONCERNS THV-7', report1('THV-7', 'DONE_WITH_CONCERNS', 'DONE_WITH_CONCERNS THV-7')],
  [
    'concerns are counted per DONE_WITH_CONCERNS line, from its own section only',
    'DONE THV-1\n[x] shipped\n\nDONE_WITH_CONCERNS THV-2\n[~] row a\n[ ] row b\n',
    {
      k: 'report',
      lines: [
        { ticket: 'THV-1', word: 'DONE', line: 'DONE THV-1', concerns: 0 },
        { ticket: 'THV-2', word: 'DONE_WITH_CONCERNS', line: 'DONE_WITH_CONCERNS THV-2', concerns: 2 },
      ],
    },
  ],
  ['a concerns table counts one concern per row, and an all-✓ Acceptance table none', BUILT_CONCERNS_TABLE_THV_1045, report1('THV-1045', 'DONE_WITH_CONCERNS', 'DONE_WITH_CONCERNS THV-1045 consent evidence holds; two concerns need main.', 2)],
  ['a plain prompt is neither brief nor report', 'just a question about the build', undefined],
  // The quoted `DONE THV-1016` is there, line-anchored, so only the brief rule keeps it out.
  [
    'a verifier brief quoting the builder DONE line is a brief, not a report',
    VERIFY_BRIEF_THV_1016,
    { k: 'brief', brief: { k: 'first', ticket: 'THV-1016', role: 'verifier', title: 'Marketplace search tracking: report age, genre and subject filters' } },
  ],
  ['a builder brief gives its ticket, kind and title, and no status line', BUILD_BRIEF_THV_1014, { k: 'brief', brief: { k: 'first', ticket: 'THV-1014', role: 'builder', labelKind: 'Build', title: TITLE_1014 } }],
  ['a pasted FIX ROUND prompt is a builder brief for that round', FIX_ROUND_3_THV_1015, { k: 'brief', brief: { k: 'fix', ticket: 'THV-1015', round: 3, of: 5 } }],
  ['a typed FIX ROUND prompt is a builder brief for that round', FIX_ROUND_2_THV_711, { k: 'brief', brief: { k: 'fix', ticket: 'THV-711', round: 2, of: 5 } }],
  ['a FIX ROUND denominator is read, not assumed', FIX_ROUND_2_THV_711.replace('2/5', '2/3'), { k: 'brief', brief: { k: 'fix', ticket: 'THV-711', round: 2, of: 3 } }],
]

for (const [name, text, read] of PROMPTS) test(`readPrompt: ${name}`, async () => expect(readPrompt(text)).toEqual(read))

test('the status lines of the remaining reports, the first per ticket', async () => {
  expect(unwrapPasted(VERIFY_BRIEF_THV_1016).split('\n')).toContain('DONE THV-1016')
  expect(statusLines(DONE_WITH_CONCERNS_THV_967).map((l) => [l.ticket, l.word])).toEqual([['THV-967', 'DONE_WITH_CONCERNS']])
  expect(statusLines(BLOCKED_THV_869).map((l) => [l.ticket, l.word])).toEqual([['THV-869', 'BLOCKED']])
  expect(statusLines(NEEDS_CONTEXT_THV_929).map((l) => [l.ticket, l.word])).toEqual([['THV-929', 'NEEDS_CONTEXT']])
})

test('a fix round brief draws its own denominator', async () => {
  const brief = storedFact(`cockpit:brief:THV-1041:${P8V_SID}`, { kind: 'brief', k: 'fix', ticket: 'THV-1041', round: 2, of: 3, sid: P8V_SID, pane: 'w18:p8V', at: 1 })
  expect(cellText(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [brief] }), 'THV-1041'), 'fix')).toBe('2/3')
})

test('a send.sh fix round takes its denominator from the FIX ROUND brief, and 5 when no brief gave one', async () => {
  const send = storedFact('cockpit:send:THV-1041:w40:pC:builder:2', { kind: 'send', ticket: 'THV-1041', pane: 'w40:pC', role: 'builder', round: 2, file: 'THV-1041-fix2.md', at: 3 })
  const brief = storedFact(`cockpit:brief:THV-1041:${P8V_SID}`, { kind: 'brief', k: 'fix', ticket: 'THV-1041', round: 1, of: 3, sid: P8V_SID, pane: 'w18:p8V', at: 1 })
  expect(cellText(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [send, brief] }), 'THV-1041'), 'fix')).toBe('2/3')
  expect(cellText(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [send] }), 'THV-1041'), 'fix')).toBe('2/5')
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

test('send.sh $P from the THV-1094 wave gives no send call, and its stored key no fact: only a herdr w…:p… id is a pane', async () => {
  expect(sendCalls(SEND_P_THV_1095)).toEqual([])
  expect(parseFact('cockpit:send:THV-1095:$P:verifier:0', STORE_WAVE['cockpit:send:THV-1095:$P:verifier:0'])).toBeUndefined()
  expect(parseFact('cockpit:send:THV-1095:w5E:p5:verifier:2', STORE_WAVE['cockpit:send:THV-1095:w5E:p5:verifier:2'])).toEqual(STORE_WAVE['cockpit:send:THV-1095:w5E:p5:verifier:2'])
  for (const text of ['$P', '"$P"', '--clear-title', 'p1', 'w5E', 'w5E:t1', 'w5E:p5 ']) expect(isPaneId(text)).toBe(false)
  for (const text of ['w5E:p1', 'w18:p8W', 'w40:pC']) expect(isPaneId(text)).toBe(true)
})

test('a Bash send.sh $P writes no send fact', async ($, on) => {
  const s = stage(on, { pane: 'w5E:p1', sid: 'sid-main', snapshot: SNAPSHOT_AFTER_WAVE })
  await start($)
  await bash($, SEND_P_THV_1095)
  expect([...s.saved.keys()].filter((k) => k.startsWith('cockpit:send:'))).toEqual([])
})

test('CI reads – for a PR whose only checks are NEUTRAL bot checks, as on every agent-skills PR of the wave', async () => {
  const prs = must(parsePrList(AGENT_SKILLS, GH_AGENT_SKILLS_WAVE))
  const pr35 = must(prs.find((p) => p.number === 35))
  expect(pr35.checks).toEqual({ total: 0, done: 0, failed: [], running: [] })
  expect(ciCell(pr35)).toEqual({ k: 'none' })
  // Derived: w5E:p9 labelled the way label.sh labelled THV-1097's builder pane.
  const row = rowOf(worldOf(mainOf('w5E', 'w5E:p1'), relabelPane(SNAPSHOT_AFTER_WAVE, 'w5E:p9', 'Build · Delete dead code (THV-1097)'), { sources: { github: fresh({ prs }) } }), 'THV-1097')
  expect([cellText(row, 'pr'), cellText(row, 'ci')]).toEqual(['#35', '–'])
})

test('a PR mixing NEUTRAL bot checks with real CI counts every check: frontend #136 reads 13 of 13 and ✓', async () => {
  const pr136 = must(must(parsePrList(FRONTEND, GH_FRONTEND)).find((p) => p.number === 136))
  expect(JSON.parse(GH_FRONTEND).find((p: { number: number }) => p.number === 136).statusCheckRollup.filter((c: { conclusion?: string }) => c.conclusion === 'NEUTRAL').length).toBe(2)
  expect(pr136.checks).toEqual({ total: 13, done: 13, failed: [], running: [] })
  expect(ciCell(pr136)).toEqual({ k: 'pass' })
})

// ── unit: the inbox ────────────────────────────────────────────────────────────────────────

test('an inbox file is a report or verdict only when it starts with its own status line', async () => {
  expect(inboxFile('THV-1041.md', OUT_THV_1041, 7000)).toEqual({
    name: 'THV-1041.md',
    ticket: 'THV-1041',
    at: 7000,
    k: 'report',
    line: { ticket: 'THV-1041', word: 'DONE_WITH_CONCERNS', line: 'DONE_WITH_CONCERNS THV-1041' },
  })
  expect(inboxFile('THV-1003.md', 'VERIFIED THV-1003\n', 1)).toEqual({
    name: 'THV-1003.md',
    ticket: 'THV-1003',
    at: 1,
    k: 'verdict',
    line: { ticket: 'THV-1003', word: 'VERIFIED', line: 'VERIFIED THV-1003' },
  })
  expect(inboxFile('THV-1004.md', OUT_ESCALATION_THV_1004, 1)).toEqual({
    name: 'THV-1004.md',
    ticket: 'THV-1004',
    at: 1,
    k: 'escalation',
    head: '[thoven verify] THV-1004 pane w56:p1 reported done 3 times and still: 1 live process: sleep 30 (pid 71389). Nudged 2x; needs you.',
  })
  expect(inboxFile('THV-1038.md', OUT_RESEARCH_THV_1038_HEAD, 1)).toEqual({ name: 'THV-1038.md', ticket: 'THV-1038', at: 1, k: 'note' })
  // Another ticket's status line is a note.
  expect(inboxFile('THV-1041.md', 'DONE THV-1003\n', 1)?.k).toBe('note')
})

// ── unit: the board cells ───────────────────────────────────────────────────────────────────

const report = (ticket: string, sid: string, status: 'DONE' | 'DONE_WITH_CONCERNS' | 'NEEDS_CONTEXT' | 'BLOCKED', at: number, concerns = 0): Fact => ({
  kind: 'report',
  ticket: tk(ticket),
  sid: idOf(isSessionId, sid),
  status,
  text: `${status} ${ticket}`,
  concerns,
  at,
})

test('Report cell glyphs: done, concerns with their count, ask, blocked', async () => {
  const cell = (status: 'DONE' | 'DONE_WITH_CONCERNS' | 'NEEDS_CONTEXT' | 'BLOCKED', concerns = 0) =>
    cellText(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [report('THV-1041', 'sid-b', status, 1000, concerns)] }), 'THV-1041'), 'report')
  expect(cell('DONE')).toBe('✓')
  expect(cell('DONE_WITH_CONCERNS', 1)).toBe('1 !')
  expect(cell('DONE_WITH_CONCERNS', 0)).toBe('!')
  expect(cell('NEEDS_CONTEXT')).toBe('ask')
  expect(cell('BLOCKED')).toBe('blocked')
})

test('the newest report by at wins, whichever session received it', async () => {
  const older = report('THV-1041', 'sid-main', 'DONE_WITH_CONCERNS', 1000, 1)
  const newer = report('THV-1041', 'sid-b', 'DONE', 5000)
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [newer, older] }), 'THV-1041').cells.report).toEqual({ k: 'in', status: 'DONE', at: 5000, concerns: 0, selfChecked: false })
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [older, newer] }), 'THV-1041').cells.report).toEqual({ k: 'in', status: 'DONE', at: 5000, concerns: 0, selfChecked: false })
})

test('an inbox file newer than any delivered report shows unsent; an older one does not', async () => {
  const file = inboxFile('THV-1041.md', OUT_THV_1041, 7000)
  const inbox = { inbox: fresh(file ? [file] : []) }
  const unsent = rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [report('THV-1041', 'sid-b', 'DONE', 5000)], sources: inbox }), 'THV-1041')
  expect(unsent.cells.report).toEqual({ k: 'undelivered', status: 'DONE_WITH_CONCERNS', file: 'THV-1041.md', selfChecked: false })
  expect(cellText(unsent, 'report')).toBe('unsent')
  const delivered = rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [report('THV-1041', 'sid-b', 'DONE', 9000)], sources: inbox }), 'THV-1041')
  expect(delivered.cells.report.k).toBe('in')
  // Of two files for one ticket, the newer one is the cell, whichever the listing gives first.
  const escalation = inboxFile('thv-1041.md', OUT_ESCALATION_THV_1004.replaceAll('THV-1004', 'THV-1041'), 8000)
  const both = (files: InboxFile[]) => rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { sources: { inbox: fresh(files) } }), 'THV-1041').cells.report.k
  expect(file && escalation ? [both([file, escalation]), both([escalation, file])] : []).toEqual(['escalation', 'escalation'])
  // An undelivered verdict is never the Report cell: the delivered report stays.
  const verdict = inboxFile('THV-1041.md', 'VERIFIED THV-1041\n', 7000)
  const withVerdict = rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [report('THV-1041', 'sid-b', 'DONE', 5000)], sources: { inbox: fresh(verdict ? [verdict] : []) } }), 'THV-1041')
  expect(withVerdict.cells.report).toEqual({ k: 'in', status: 'DONE', at: 5000, concerns: 0, selfChecked: false })
})

test('Fix cell: main send.sh round wins; without one, the pane FIX ROUND brief gives it', async () => {
  const send = storedFact('cockpit:send:THV-1041:w40:pC:builder:2', { kind: 'send', ticket: 'THV-1041', pane: 'w40:pC', role: 'builder', round: 2, file: 'THV-1041-fix2.md', at: 1 })
  const brief = storedFact(`cockpit:brief:THV-1041:${P8V_SID}`, { kind: 'brief', k: 'fix', ticket: 'THV-1041', round: 3, of: 5, sid: P8V_SID, pane: 'w18:p8V', at: 2 })
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [send, brief] }), 'THV-1041').cells.fix).toEqual({ k: 'round', round: 2, of: 5 })
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [brief] }), 'THV-1041').cells.fix).toEqual({ k: 'round', round: 3, of: 5 })
  expect(cellText(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: [brief] }), 'THV-1041'), 'fix')).toBe('3/5')
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041), 'THV-1041').cells.fix).toEqual({ k: 'none' })
})

test('a report on a row asks main to record report STATUS once; a recorded one is not asked again', async () => {
  const done = report('THV-1041', 'sid-b', 'DONE', 5000)
  const reports = (facts: Fact[]) => project(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts })).newEvents.filter((e) => e.event.k === 'report')
  expect(reports([done])).toEqual([{ ticket: 'THV-1041', event: { k: 'report', status: 'DONE' }, id: 'report-DONE' }])
  const happened: Fact = { kind: 'happened', ticket: tk('THV-1041'), event: idOf(isLinearEventId, 'report-DONE'), at: 5000 }
  expect(reports([done, happened])).toEqual([])
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
  expect(cellText(rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: factsIn(s.saved) }), 'THV-1041'), 'report')).toBe('1 !')
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
  const row = rowOf(worldOf(W18_MAIN, SNAPSHOT_W18_1041, { facts: factsIn(s.saved) }), 'THV-1041')
  expect(row.cells.report).toEqual({ k: 'in', status: 'DONE', at: 5000, concerns: 0, selfChecked: false })
  expect(cellText(row, 'report')).toBe('✓')
})

test('Bash send.sh of THV-1004-fix2.md writes the send fact, and the Fix cell reads 2/5', async ($, on) => {
  const s = stage(on, { pane: 'w56:p2', sid: 'sid-main', snapshot: SNAPSHOT_LIVE })
  await start($)
  await bash($, SEND_FIX2_THV_1004)
  expect(s.saved.get('cockpit:send:THV-1004:w40:pC:builder:2')).toEqual({ kind: 'send', ticket: 'THV-1004', pane: 'w40:pC', role: 'builder', round: 2, file: 'THV-1004-fix2.md', at: 0 })
  // w56:p1's terminal title names THV-1004.
  const row = rowOf(worldOf(mainOf('w56', 'w56:p2'), SNAPSHOT_LIVE, { facts: factsIn(s.saved) }), 'THV-1004')
  expect(row.cells.fix).toEqual({ k: 'round', round: 2, of: 5 })
  expect(cellText(row, 'fix')).toBe('2/5')
})

test('a plain send.sh after a fix-2 send to the same pane keeps the Fix cell at 2', async ($, on) => {
  const s = stage(on, { pane: 'w56:p2', sid: 'sid-main', snapshot: SNAPSHOT_LIVE })
  await start($)
  await bash($, SEND_FIX2_THV_1004)
  await s.clock.advance(1000)
  await bash($, '~/.claude/skills/dispatch-work/scripts/send.sh w40:pC $TMPDIR/dispatch/THV-1004.md 2>&1 | tail -1')
  const row = rowOf(worldOf(mainOf('w56', 'w56:p2'), SNAPSHOT_LIVE, { facts: factsIn(s.saved) }), 'THV-1004')
  expect(row.cells.fix).toEqual({ k: 'round', round: 2, of: 5 })
})

test('a Bash tool that throws beneath the cockpit still fails through it, and the cockpit neither logs nor records it', async ($, on) => {
  const s = stage(on, { pane: 'w56:p2', sid: 'sid-main', snapshot: SNAPSHOT_LIVE })
  await start($)
  s.bashThrows = 'Bash crashed'
  const failed = await bash($, SEND_FIX2_THV_1004).then(
    () => 'resolved',
    (err: unknown) => (err instanceof Error ? err.message : String(err)),
  )
  // The kit reports a throwing tool its own way; what matters is that the call still fails.
  expect(failed).not.toBe('resolved')
  expect(s.logs.filter((l) => l.startsWith('cockpit '))).toEqual([])
  expect(s.setKeys).toEqual([])
})

test('FIX ROUND 3/5 received by a pane with no send.sh gives Fix round 3', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  await submit($, FIX_ROUND_3_THV_1015)
  expect(s.saved.get(`cockpit:brief:THV-1015:${P8V_SID}`)).toEqual({ kind: 'brief', k: 'fix', ticket: 'THV-1015', round: 3, of: 5, sid: P8V_SID, pane: 'w18:p8V', at: 0 })
  expect(rowOf(worldOf(W18_MAIN, SNAPSHOT_LIVE, { facts: factsIn(s.saved) }), 'THV-1015').cells.fix).toEqual({ k: 'round', round: 3, of: 5 })
})

test('a brief received by an unlabelled pane ties that pane to its ticket', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  await submit($, BUILD_BRIEF_THV_1014)
  expect(s.saved.get(`cockpit:brief:THV-1014:${P8V_SID}`)).toEqual({
    kind: 'brief',
    k: 'first',
    ticket: 'THV-1014',
    sid: P8V_SID,
    pane: 'w18:p8V',
    role: 'builder',
    labelKind: 'Build',
    title: TITLE_1014,
    at: 0,
  })
})

test('the tie: p8V, whose Mods tab has no label, is the THV-1014 Build row and leaves Other', async () => {
  const brief = storedFact(`cockpit:brief:THV-1014:${P8V_SID}`, { kind: 'brief', k: 'first', ticket: 'THV-1014', sid: P8V_SID, pane: 'w18:p8V', role: 'builder', labelKind: 'Build', title: TITLE_1014, at: 1 })
  const board = project(worldOf(W18_MAIN, SNAPSHOT_LIVE, { facts: [brief] }))
  const row = rowOf(worldOf(W18_MAIN, SNAPSHOT_LIVE, { facts: [brief] }), 'THV-1014')
  expect([row.title, row.kind, row.origin, row.panes]).toEqual([
    TITLE_1014,
    'Build',
    'dispatch',
    { k: 'live', list: [{ status: 'idle', tool: 'C', pane: 'w18:p8V' }] },
  ])
  expect(board.other.map((o) => o.k === 'unlabelled' && o.tab)).toEqual(['Research'])
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
  const before = s.storeCalls
  await submit($, 'run the tests again and tell me which failed')
  await bash($, 'git status --short')
  expect(s.storeCalls).toBe(before)
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
  expect(await ui.find({ type: 'Text', text: 'unsent' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: '✓' })).toBeDefined()
  const happened = s.saved.get('cockpit:happened:THV-1041:report-DONE')
  expect(happened).toEqual({ kind: 'happened', ticket: 'THV-1041', event: 'report-DONE', at: 5000 })
  await s.clock.advance(20_000)
  expect(s.saved.get('cockpit:happened:THV-1041:report-DONE')).toEqual(happened)
})
