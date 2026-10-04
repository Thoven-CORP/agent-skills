// S3 (THV-1060): review proof. Skill capture in pane sessions, the Review cell V C T D, amber T,
// "claimed, not run", the builder's self-check mark, and the best-effort Codex read.
//
// Derived inputs, each said where it is built: the verifier brief VERIFY_BRIEF_THV_1016 retargeted
// to THV-1003, so it meets the real THV-1003 PRs (BE #142, 446 lines over 4 top dirs; FE #137, 280
// lines in one); verify-this and code-review `skill.prompt` events made from the real deslop one
// with the skill renamed (no log holds theirs); one snapshot pane turned into the Codex pane in the
// rollout's folder, since no snapshot on file holds a Codex pane. The THV-1096 brief from wave
// THV-1094 meets a tab relabelled to its ticket, and each poteto-mode playbook name is set into its head.

import { expect, test } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { parseRollout } from '../hooks/codex.ts'
import { briefOf } from '../hooks/dispatch.ts'
import { expired } from '../hooks/expiry.ts'
import { BACKEND, FRONTEND, parsePrList } from '../hooks/github.ts'
import { labelRecords } from '../hooks/background.ts'
import { isPaneId, isSessionId, type Fact, type Pr, type World } from '../hooks/model.ts'
import { SOURCES } from '../hooks/sources.ts'
import { parseFact } from '../hooks/store.ts'
import { cellText } from '../hooks/view.ts'
import { GH_BACKEND, GH_FRONTEND } from './fixtures/github.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import * as REPORTS from './fixtures/reports.ts'
import { BRIEF_BUG_FIX_THV_1096 } from './fixtures/wave.ts'
import { ROLLOUT_VERIFY_THV_1000, ROLLOUT_VERIFY_THV_1000_PATH, SKILL_PROMPT_DESLOP, SKILL_TOOL_CALL, SKILL_TOOL_RESULT } from './fixtures/review.ts'
import { HOME, cockpit, fakeAsk, fresh, idOf, mainOf, must, relabelTab, rowOf, rowsOf, stage, start, submit, tk, turnEnd, worldOf, type Stage } from './stage.ts'

const P8V_SID = '27c71f2d-e064-4ebc-ae51-e993d40abfac'
const W18 = mainOf('w18', 'w18:p8W')
/** Derived: the real verifier brief, for THV-1003. */
const VERIFY_THV_1003 = REPORTS.VERIFY_BRIEF_THV_1016.replaceAll('THV-1016', 'THV-1003')
const W18_1003 = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Consent and purge (THV-1003)')
const prOf = (repo: string, json: string, n: number): Pr => must(must(parsePrList(repo, json)).find((p) => p.number === n))
const BE_142 = prOf(BACKEND, GH_BACKEND, 142) // 446 changed lines: thermo due
const FE_137 = prOf(FRONTEND, GH_FRONTEND, 137) // 280 lines, one top dir: not due

/** Derived: a skill.prompt for `skill`, the real deslop event renamed. */
const skillPrompt = ($: any, skill: string) => $.skill.prompt({ ...SKILL_PROMPT_DESLOP, skill })
/** The real model-invoked Skill call, for `skill`, in a subagent's loop when `agentId` is given. */
const skillCall = ($: any, skill: string, agentId?: string) =>
  $.tool.call({ tool: 'Skill', skill, args: SKILL_TOOL_CALL.args, tool_use_id: SKILL_TOOL_CALL.tool_use_id, ...(agentId === undefined ? {} : { agentId }) })
const factsOf = (s: Stage): Fact[] => [...s.saved].flatMap(([k, v]) => parseFact(k, v) ?? [])
const reviewKeys = (s: Stage): string[] => [...s.saved.keys()].filter((k) => /^cockpit:(review|self):/.test(k)).sort()
const briefKeys = (s: Stage): string[] => [...s.saved.keys()].filter((k) => k.startsWith('cockpit:brief:'))

/** A pane session that took `brief`, then ran `skills` as typed slash commands. */
async function paneRan($: any, on: any, brief: string, skills: string[]): Promise<Stage> {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  await s.clock.advance(1000)
  await submit($, brief)
  await s.clock.advance(1000)
  for (const skill of skills) await skillPrompt($, skill)
  return s
}

const verdict = (v: 'VERIFIED' | 'FINDINGS', at: number): Fact => ({ kind: 'verdict', ticket: tk('THV-1003'), sid: idOf(isSessionId, 'sid-main'), verdict: v, text: `${v} THV-1003`, at })
const world1003 = (facts: Fact[], prs: Pr[]): World => worldOf(W18, W18_1003, { facts, sources: { github: fresh({ prs }) } })

// ── Claude verifier ──────────────────────────────────────────────────────────────────────────

test('Claude verifier: verify-this, code-review and deslop on a 446-line diff read V C · D with an amber T', async ($, on) => {
  const s = await paneRan($, on, VERIFY_THV_1003, ['poteto-mode', 'verify-this', 'code-review', 'deslop'])
  // One `review` fact per Review skill, in the brief's round; poteto-mode names no letter.
  expect(reviewKeys(s)).toEqual([`cockpit:review:THV-1003:${P8V_SID}:code-review`, `cockpit:review:THV-1003:${P8V_SID}:deslop`, `cockpit:review:THV-1003:${P8V_SID}:verify-this`])
  expect(s.saved.get(`cockpit:review:THV-1003:${P8V_SID}:deslop`)).toEqual({ kind: 'review', ticket: 'THV-1003', sid: P8V_SID, skill: 'deslop', round: 1000, at: 2000 })

  const row = rowOf(world1003(factsOf(s), [BE_142]), 'THV-1003')
  expect(row.cells.review).toEqual({ k: 'review', lights: { V: 'lit', C: 'lit', T: 'amber', D: 'lit' }, round: 1, tool: 'C' })
  expect(cellText(row, 'review')).toBe('V C · D')
  // Thermo is not due on 280 lines in one directory, so T is a plain dash.
  expect(cellText(rowOf(world1003(factsOf(s), [FE_137]), 'THV-1003'), 'review')).toBe('V C – D')
})

test('only the latest verifier round lights: a re-verify brief in the same pane starts over', async ($, on) => {
  const s = await paneRan($, on, VERIFY_THV_1003, ['verify-this', 'code-review', 'deslop'])
  await s.clock.advance(5000)
  await submit($, VERIFY_THV_1003)
  await skillPrompt($, 'verify-this')
  const row = rowOf(world1003(factsOf(s), [FE_137]), 'THV-1003')
  expect(row.cells.review.k === 'review' && row.cells.review.lights).toEqual({ V: 'lit', C: 'off', T: 'off', D: 'off' })
})

test('a builder session records `self`, never `review`: V stays unlit and the self-check mark shows', async ($, on) => {
  const s = await paneRan($, on, VERIFY_THV_1003.replace('/poteto-mode Verify', '/poteto-mode Build'), ['verify-this'])
  expect(reviewKeys(s)).toEqual([`cockpit:self:THV-1003:${P8V_SID}:verify-this`])
  const report: Fact = { kind: 'report', ticket: tk('THV-1003'), sid: idOf(isSessionId, 'sid-main'), status: 'DONE', text: 'DONE THV-1003', concerns: 0, at: 9000 }
  const row = rowOf(world1003([...factsOf(s), report], [BE_142]), 'THV-1003')
  expect(row.cells.review).toEqual({ k: 'none' })
  expect(cellText(row, 'review')).toBe('– – – –')
  expect(cellText(row, 'report')).toBe('✓ᵛ')

  // A fix round's brief asks for /verify-this again, so the mark waits for it.
  await s.clock.advance(5000)
  await submit($, REPORTS.FIX_ROUND_3_THV_1015.replaceAll('THV-1015', 'THV-1003'))
  expect(cellText(rowOf(world1003([...factsOf(s), report], [BE_142]), 'THV-1003'), 'report')).toBe('✓')
})

// ── A two-word playbook (THV-1103, wave F6) ──────────────────────────────────────────────────

const TITLE_1096 = 'Cockpit: expiry checks for a completed state, keeps the events of tickets still on the board, and doctor says when Linear is not read'
const W18_1096 = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · expiry, board events and doctor\'s Linear line (THV-1096)')

test('the real THV-1096 brief, `/poteto-mode Bug fix`, is a builder brief: verify-this lights ✓ᵛ, and a fix round keeps its title', async ($, on) => {
  const s = await paneRan($, on, BRIEF_BUG_FIX_THV_1096, ['verify-this'])
  expect(s.saved.get(`cockpit:brief:THV-1096:${P8V_SID}`)).toEqual({ kind: 'brief', k: 'first', ticket: 'THV-1096', role: 'builder', title: TITLE_1096, sid: P8V_SID, pane: 'w18:p8V', at: 1000 })
  expect(reviewKeys(s)).toEqual([`cockpit:self:THV-1096:${P8V_SID}:verify-this`])
  const report: Fact = { kind: 'report', ticket: tk('THV-1096'), sid: idOf(isSessionId, 'sid-main'), status: 'DONE', text: 'DONE THV-1096', concerns: 0, at: 9000 }
  expect(cellText(rowOf(worldOf(W18, W18_1096, { facts: [...factsOf(s), report] }), 'THV-1096'), 'report')).toBe('✓ᵛ')

  await s.clock.advance(5000)
  await submit($, REPORTS.FIX_ROUND_3_THV_1015.replaceAll('THV-1015', 'THV-1096'))
  expect(s.saved.get(`cockpit:brief:THV-1096:${P8V_SID}`)).toEqual({ kind: 'brief', k: 'fix', ticket: 'THV-1096', round: 3, of: 5, title: TITLE_1096, sid: P8V_SID, pane: 'w18:p8V', at: 7000 })
})

test('every poteto-mode playbook whose name has more than one word reads as a builder brief', async () => {
  // The playbook names of ~/.claude/skills/poteto-mode/SKILL.md, "## Playbooks", on 2026-10-03.
  const names = ['Bug fix', 'Perf issue', 'Visual parity', 'Runtime forensics', 'Trace forensics', 'Authoring or modifying a skill', 'Autonomous run', 'Session pickup', 'Pause safely', 'Multi-phase or multi-PR plan', 'Worktree and simulator cleanup', 'Opening a PR']
  const read = names.map((name) => briefOf(BRIEF_BUG_FIX_THV_1096.replace('/poteto-mode Bug fix ', `/poteto-mode ${name} `)))
  expect(read).toEqual(names.map(() => ({ k: 'first', ticket: 'THV-1096', role: 'builder', title: TITLE_1096 })))
  expect(briefOf(BRIEF_BUG_FIX_THV_1096.replace('/poteto-mode Bug fix ', '$poteto-mode Perf issue '))).toEqual({ k: 'first', ticket: 'THV-1096', role: 'builder', title: TITLE_1096 })
})

test('a head that names no playbook is no brief: "Verification only for THV-1003", then FINDINGS, makes a verifier whose skills write `review`', async ($, on) => {
  // The verifier's probe on fix round 1: the real verify brief with its head's playbook replaced.
  const s = await paneRan($, on, VERIFY_THV_1003.replace('/poteto-mode Verify THV-1003', '/poteto-mode Verification only for THV-1003'), [])
  expect(briefKeys(s)).toEqual([])
  await turnEnd($, 'FINDINGS THV-1003\n\nThe purge skips an archived learner with a pending booking request.')
  await s.clock.advance(1000)
  for (const skill of ['verify-this', 'code-review']) await skillPrompt($, skill)
  expect(reviewKeys(s)).toEqual([`cockpit:review:THV-1003:${P8V_SID}:code-review`, `cockpit:review:THV-1003:${P8V_SID}:verify-this`])
  expect(cellText(rowOf(world1003(factsOf(s), [FE_137]), 'THV-1003'), 'review')).toBe('V C – –')
  expect(briefOf('/poteto-mode why does the cockpit drop rows for THV-1097')).toBeUndefined()
})

// ── A verifier by its reply (THV-1095) ────────────────────────────────────────────────────────

test('a pane that replies FINDINGS THV-1003 with no brief is its verifier: the skills it runs next write `review`', async ($, on) => {
  const s = await paneRan($, on, 'Look over the THV-1003 purge diff for me.', [])
  await turnEnd($, 'FINDINGS THV-1003\n\nThe purge skips an archived learner with a pending booking request.')
  expect(s.saved.get(`cockpit:brief:THV-1003:${P8V_SID}`)).toEqual({ kind: 'brief', k: 'first', ticket: 'THV-1003', role: 'verifier', sid: P8V_SID, pane: 'w18:p8V', at: 2000 })
  await s.clock.advance(1000)
  for (const skill of ['verify-this', 'code-review']) await skillPrompt($, skill)
  expect(reviewKeys(s)).toEqual([`cockpit:review:THV-1003:${P8V_SID}:code-review`, `cockpit:review:THV-1003:${P8V_SID}:verify-this`])
  expect(s.saved.get(`cockpit:review:THV-1003:${P8V_SID}:verify-this`)).toEqual({ kind: 'review', ticket: 'THV-1003', sid: P8V_SID, skill: 'verify-this', round: 2000, at: 3000 })
  expect(cellText(rowOf(world1003(factsOf(s), [FE_137]), 'THV-1003'), 'review')).toBe('V C – –')
})

test('a verdict reply makes the whole session the verifier: verify-this and code-review run before FINDINGS THV-1003 light V and C', async ($, on) => {
  const s = await paneRan($, on, 'Look over the THV-1003 purge diff for me.', ['verify-this', 'code-review'])
  await s.clock.advance(1000)
  await turnEnd($, 'FINDINGS THV-1003\n\nThe purge skips an archived learner with a pending booking request.')
  expect(reviewKeys(s)).toEqual([`cockpit:review:THV-1003:${P8V_SID}:code-review`, `cockpit:review:THV-1003:${P8V_SID}:verify-this`])
  expect(s.saved.get(`cockpit:review:THV-1003:${P8V_SID}:verify-this`)).toEqual({ kind: 'review', ticket: 'THV-1003', sid: P8V_SID, skill: 'verify-this', round: 3000, at: 2000 })
  expect(cellText(rowOf(world1003(factsOf(s), [FE_137]), 'THV-1003'), 'review')).toBe('V C – –')
  // A VERIFIED after it claims only D: the two that ran stay lit.
  const row = rowOf(world1003([...factsOf(s), verdict('VERIFIED', 4000)], [FE_137]), 'THV-1003')
  expect(row.cells.review.k === 'review' && row.cells.review.lights).toEqual({ V: 'lit', C: 'lit', T: 'off', D: 'claimed' })
})

test('a run counts for the first verdict that claims it: VERIFIED THV-1004 a minute after FINDINGS THV-1003 gets none of its runs', async ($, on) => {
  const s = await paneRan($, on, 'Look over the THV-1003 purge diff for me.', ['verify-this', 'code-review'])
  await s.clock.advance(1000)
  await turnEnd($, 'FINDINGS THV-1003')
  await s.clock.advance(60_000)
  await turnEnd($, 'VERIFIED THV-1004')
  expect(briefKeys(s).sort()).toEqual([`cockpit:brief:THV-1003:${P8V_SID}`, `cockpit:brief:THV-1004:${P8V_SID}`])
  expect(reviewKeys(s)).toEqual([`cockpit:review:THV-1003:${P8V_SID}:code-review`, `cockpit:review:THV-1003:${P8V_SID}:verify-this`])
  // A run after the first verdict is the verifier brief's own, and lights only that ticket.
  await skillPrompt($, 'deslop')
  expect(reviewKeys(s)).toContain(`cockpit:review:THV-1004:${P8V_SID}:deslop`)
  expect(reviewKeys(s).filter((k) => k.includes('THV-1004'))).toEqual([`cockpit:review:THV-1004:${P8V_SID}:deslop`])
})

test('merged-done expiry does not let a later verdict reclaim another ticket\'s runs', async ($, on) => {
  const s = await paneRan($, on, 'Look over the THV-1003 purge diff for me.', ['verify-this', 'code-review'])
  await s.clock.advance(1000)
  await turnEnd($, 'FINDINGS THV-1003')
  expect(reviewKeys(s)).toEqual([`cockpit:review:THV-1003:${P8V_SID}:code-review`, `cockpit:review:THV-1003:${P8V_SID}:verify-this`])

  const removed = expired([...s.saved].map(([key, value]) => ({ key, value })), {
    now: 3000,
    prs: [{ ...BE_142, state: 'MERGED' }],
    linear: new Map([[tk('THV-1003'), { state: { name: 'Done', type: 'completed', position: 0 }, parent: undefined, at: 0 }]]),
    onBoard: new Set(),
  })
  expect(removed.map(({ key }) => key).sort()).toEqual([
    `cockpit:brief:THV-1003:${P8V_SID}`,
    `cockpit:review:THV-1003:${P8V_SID}:code-review`,
    `cockpit:review:THV-1003:${P8V_SID}:verify-this`,
  ])
  for (const { key } of removed) s.saved.delete(key)
  expect(factsOf(s).filter((f) => f.kind === 'ran').map((f) => f.skill).sort()).toEqual(['code-review', 'verify-this'])

  await s.clock.advance(60_000)
  await turnEnd($, 'VERIFIED THV-1010')
  expect(briefKeys(s)).toEqual([`cockpit:brief:THV-1010:${P8V_SID}`])
  expect(reviewKeys(s)).toEqual([])
})

test('one answer naming two tickets makes the pane both tickets\' verifier, and credits its runs to the first it names', async ($, on) => {
  const s = await paneRan($, on, 'Look over THV-1003 and THV-1004 for me.', ['verify-this'])
  await s.clock.advance(1000)
  await turnEnd($, 'FINDINGS THV-1003\n\nThe purge skips a pending booking request.\n\nVERIFIED THV-1004')
  expect(briefKeys(s).sort()).toEqual([`cockpit:brief:THV-1003:${P8V_SID}`, `cockpit:brief:THV-1004:${P8V_SID}`])
  expect(reviewKeys(s)).toEqual([`cockpit:review:THV-1003:${P8V_SID}:verify-this`])
})

test('a builder that replies FINDINGS on its own ticket keeps its builder brief, its status-line warning and its self-check', async ($, on) => {
  const s = await paneRan($, on, REPORTS.BUILD_BRIEF_THV_1014, [])
  const brief = s.saved.get(`cockpit:brief:THV-1014:${P8V_SID}`)
  expect(brief).toMatchObject({ k: 'first', role: 'builder' })
  await turnEnd($, 'FINDINGS THV-1014 addressed: the compiled sheet is asserted now.')
  expect(s.saved.get(`cockpit:brief:THV-1014:${P8V_SID}`)).toEqual(brief)
  const next = (await turnEnd($, 'Still on the sheet.')).text
  expect(next).toContain('this turn ended with no status line')
  expect(next).toContain('THV-1014 as brief.md REPORT says')
  await skillPrompt($, 'verify-this')
  expect(reviewKeys(s)).toEqual([`cockpit:self:THV-1014:${P8V_SID}:verify-this`])
})

test('a builder in a tab whose label names no ticket stays a Build pane for its own ticket when it replies VERIFIED THV-1003', async ($, on) => {
  const s = await paneRan($, on, REPORTS.BUILD_BRIEF_THV_1014, [])
  const p8v = idOf(isPaneId, 'w18:p8V')
  const board = () => project(worldOf(W18, SNAPSHOT_LIVE, { facts: factsOf(s) }))
  const rows = (b: ReturnType<typeof board>) => rowsOf(b).map((r) => [r.ticket, r.kind, r.title])
  const before = board()
  await turnEnd($, 'VERIFIED THV-1003')
  await skillPrompt($, 'verify-this')
  const after = board()
  expect(rowsOf(after).find((r) => r.ticket === tk('THV-1014'))?.kind).toBe('Build')
  expect(rows(after)).toEqual(rows(before))
  expect(labelRecords(before).get(p8v)?.title).toMatch(/\(THV-1014\)$/)
  expect(labelRecords(after).get(p8v)).toEqual(labelRecords(before).get(p8v))
  expect(reviewKeys(s)).toEqual([`cockpit:self:THV-1014:${P8V_SID}:verify-this`])
})

test('after a fix round, the builder of THV-1014 that replies VERIFIED THV-1003 stays a Build pane for THV-1014 alone', async ($, on) => {
  const s = await paneRan($, on, REPORTS.BUILD_BRIEF_THV_1014, [])
  await s.clock.advance(1000)
  await submit($, REPORTS.FIX_ROUND_3_THV_1015.replaceAll('THV-1015', 'THV-1014'))
  expect(s.saved.get(`cockpit:brief:THV-1014:${P8V_SID}`)).toMatchObject({ k: 'fix', labelKind: 'Build' })
  const board = () => project(worldOf(W18, SNAPSHOT_LIVE, { facts: factsOf(s) }))
  const rows = (b: ReturnType<typeof board>) => rowsOf(b).map((r) => [r.ticket, r.kind, r.title])
  const before = board()
  await turnEnd($, 'VERIFIED THV-1003')
  expect(briefKeys(s)).toEqual([`cockpit:brief:THV-1014:${P8V_SID}`])
  expect(rowsOf(board()).find((r) => r.ticket === tk('THV-1014'))?.kind).toBe('Build')
  expect(rows(board())).toEqual(rows(before))
})

test('an aborted turn that ends on FINDINGS THV-1003 makes no verifier; an answer does', async ($, on) => {
  const s = await paneRan($, on, 'Look over the THV-1003 purge diff for me.', [])
  await turnEnd($, 'FINDINGS THV-1003', 'aborted')
  expect(briefKeys(s)).toEqual([])
  await turnEnd($, 'FINDINGS THV-1003')
  expect(briefKeys(s)).toEqual([`cockpit:brief:THV-1003:${P8V_SID}`])
})

test('a verifier that replies VERIFIED keeps its brief, so the round its skills ran in still lights', async ($, on) => {
  const s = await paneRan($, on, VERIFY_THV_1003, ['verify-this', 'code-review', 'deslop'])
  const brief = s.saved.get(`cockpit:brief:THV-1003:${P8V_SID}`)
  await s.clock.advance(5000)
  await turnEnd($, 'VERIFIED THV-1003')
  expect(s.saved.get(`cockpit:brief:THV-1003:${P8V_SID}`)).toEqual(brief)
  expect(cellText(rowOf(world1003(factsOf(s), [FE_137]), 'THV-1003'), 'review')).toBe('V C – D')
})

test("a subagent's VERIFIED reply is not the session's; the session's own is", async ($, on) => {
  const s = await paneRan($, on, 'Look over the THV-1003 purge diff for me.', [])
  await $.turn.complete({ answer: 'VERIFIED THV-1003', reason: 'answer', durationMs: 1_000, isAborted: false, turnId: 'turn-sub', agentId: 'a1b2' })
  expect(briefKeys(s)).toEqual([])
  await turnEnd($, 'VERIFIED THV-1003')
  expect(briefKeys(s)).toEqual([`cockpit:brief:THV-1003:${P8V_SID}`])
})

test('main relaying a VERIFIED line is not a verifier', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: W18_1003 })
  await start($)
  await cockpit($)
  await turnEnd($, 'VERIFIED THV-1003\n\nThe verifier pane signed it off.')
  expect(briefKeys(s)).toEqual([])
})

// ── Skill capture rules ───────────────────────────────────────────────────────────────────────

test('a Skill call whose result is read-only is not counted, and the skill.prompt inside it is left to the call', async ($, on) => {
  const s = await paneRan($, on, VERIFY_THV_1003, [])
  // The real flow: skill.prompt fires inside the Skill call, before its result says read-only.
  s.skillResult = { ...SKILL_TOOL_RESULT, isReadOnly: true }
  s.skillInside = () => skillPrompt($, 'deslop')
  await skillCall($, 'deslop')
  s.skillResult = { result: { ...SKILL_TOOL_RESULT.result, readOnly: true }, text: SKILL_TOOL_RESULT.text }
  s.skillInside = () => skillPrompt($, 'code-review')
  await skillCall($, 'code-review')
  expect(reviewKeys(s)).toEqual([])

  s.skillResult = SKILL_TOOL_RESULT
  s.skillInside = undefined
  await skillCall($, 'deslop')
  expect(reviewKeys(s)).toEqual([`cockpit:review:THV-1003:${P8V_SID}:deslop`])
})

test("a subagent's skills are not the session's", async ($, on) => {
  const s = await paneRan($, on, VERIFY_THV_1003, [])
  const inSubagent = { ...SKILL_PROMPT_DESLOP, agentId: 'a1b2' }
  await $.skill.prompt(inSubagent)
  await skillCall($, 'verify-this', 'a1b2')
  expect(reviewKeys(s)).toEqual([])
})

test('a session holding no brief writes no review or self fact', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: P8V_SID, snapshot: SNAPSHOT_LIVE })
  await start($)
  await skillPrompt($, 'verify-this')
  expect(reviewKeys(s)).toEqual([])
})

// ── Claimed, not run ─────────────────────────────────────────────────────────────────────────

test('claimed, not run: VERIFIED after a round that ran verify-this and code-review marks D claimed, T amber', async ($, on) => {
  const s = await paneRan($, on, VERIFY_THV_1003, ['verify-this', 'code-review'])
  const row = rowOf(world1003([...factsOf(s), verdict('VERIFIED', 5000)], [BE_142]), 'THV-1003')
  expect(row.cells.review.k === 'review' && row.cells.review.lights).toEqual({ V: 'lit', C: 'lit', T: 'amber', D: 'claimed' })
  // A FINDINGS reply claims nothing, and a VERIFIED from before this round is not this round's claim.
  expect(rowOf(world1003([...factsOf(s), verdict('FINDINGS', 5000)], [BE_142]), 'THV-1003').cells.review).toMatchObject({ lights: { D: 'off' } })
  expect(rowOf(world1003([...factsOf(s), verdict('VERIFIED', 500)], [BE_142]), 'THV-1003').cells.review).toMatchObject({ lights: { D: 'off' } })
})

test('claimed, not run: a VERIFIED with no verifier run at all claims V, C and D', async () => {
  const row = rowOf(world1003([verdict('VERIFIED', 5000)], [FE_137]), 'THV-1003')
  expect(row.cells.review.k === 'review' && row.cells.review.lights).toEqual({ V: 'claimed', C: 'claimed', T: 'off', D: 'claimed' })
})

// ── Codex verifier ───────────────────────────────────────────────────────────────────────────

const ROLLOUT = must(parseRollout(ROLLOUT_VERIFY_THV_1000_PATH, 1, ROLLOUT_VERIFY_THV_1000))
const CODEX_CWD = '/Users/andresmartinez/thoven/frontend-thv-1000'

/** Derived: pane w18:p8V as the Codex verifier, in the rollout's folder, labelled as label.sh does. */
function withCodexPane(snapshot: string, cwd = CODEX_CWD): string {
  const root = JSON.parse(snapshot)
  const snap = root.result.snapshot
  for (const p of [...snap.panes, ...snap.agents])
    if (p.pane_id === 'w18:p8V') Object.assign(p, { agent: 'codex', agent_session: null, foreground_cwd: cwd, label: 'Review · Sentry session replay (THV-1000)' })
  return JSON.stringify(root)
}
const codexWorld = (o: { now?: number; cwd?: string } = {}): World => ({
  ...worldOf(W18, withCodexPane(SNAPSHOT_LIVE, o.cwd), { sources: { codex: fresh([ROLLOUT]) } }),
  now: o.now ?? ROLLOUT.startedAt + 3_600_000,
})

test('the real Codex rollout reads as a THV-1000 verifier: two reviewers spawned, three skills only selected', async () => {
  expect(ROLLOUT).toMatchObject({ cwd: CODEX_CWD, startedAt: Date.parse('2026-10-01T17:51:36.931Z') })
  expect(ROLLOUT.review).toEqual({ ticket: 'THV-1000', spawned: ['standards_review', 'spec_review'], selected: ['code-review', 'deslop', 'verify-this'] })
})

test('Codex verifier: C lit from spawn_agent, V and D dimmed, and the X tag', async () => {
  const row = rowOf(codexWorld(), 'THV-1000')
  expect(row.cells.review).toEqual({ k: 'review', lights: { V: 'dim', C: 'lit', T: 'off', D: 'dim' }, round: 1, tool: 'X' })
  expect(row.panes.k === 'live' && row.panes.list[0].tool).toBe('X')
  expect(cellText(row, 'review')).toBe('V C – D')
  // Outside the 2-day window, or in another folder, the rollout is not this pane's.
  expect(rowOf(codexWorld({ now: ROLLOUT.startedAt + 3 * 86_400_000 }), 'THV-1000').cells.review).toEqual({ k: 'none' })
  expect(rowOf(codexWorld({ cwd: '/Users/andresmartinez/thoven/frontend' }), 'THV-1000').cells.review).toEqual({ k: 'none' })
})

test('the codex source reads the newest day folders only while a Codex pane is in the space, and keeps an unchanged file', async () => {
  const root = `${HOME}/.codex/sessions`
  const name = ROLLOUT_VERIFY_THV_1000_PATH.split('/').pop() ?? ''
  const dir = (...names: string[]) => names.map((n) => ({ name: n, kind: 'dir', mtimeMs: 0 }))
  const ask = fakeAsk({
    list: { [root]: dir('2026'), [`${root}/2026`]: dir('09', '10'), [`${root}/2026/10`]: dir('01'), [`${root}/2026/09`]: dir('28', '29', '30'), [`${root}/2026/10/01`]: [{ name, kind: 'file', mtimeMs: 7 }] },
    read: { [ROLLOUT_VERIFY_THV_1000_PATH]: ROLLOUT_VERIFY_THV_1000 },
  })
  const seen = (snapshot: string, codex: World['sources']['codex']) => {
    const w = worldOf(W18, snapshot)
    return { me: W18, now: w.now, sources: { ...w.sources, codex } }
  }
  expect(await SOURCES.codex.run(seen(SNAPSHOT_LIVE, { k: 'never' }), ask)).toEqual([])
  expect(ask.asked).toEqual([])

  const got = must(await SOURCES.codex.run(seen(withCodexPane(SNAPSHOT_LIVE), { k: 'never' }), ask))
  expect(got).toEqual([{ ...ROLLOUT, at: 7 }])
  expect(ask.asked).toContain(`list ${root}/2026/09/29`)
  expect(ask.asked).not.toContain(`list ${root}/2026/09/28`)
  const reads = ask.asked.filter((a) => a.startsWith('read ')).length
  await SOURCES.codex.run(seen(withCodexPane(SNAPSHOT_LIVE), fresh(got)), ask)
  expect(ask.asked.filter((a) => a.startsWith('read ')).length).toBe(reads)
  expect(SOURCES.codex.everyMs).toBe(60_000)
})
