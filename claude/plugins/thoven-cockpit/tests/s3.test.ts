// S3 (THV-1060): review proof. Skill capture in pane sessions, the Review cell V C T D, amber T,
// "claimed, not run", the builder's self-check mark, and the best-effort Codex read.
//
// Derived inputs, each said where it is built: the verifier brief VERIFY_BRIEF_THV_1016 retargeted
// to THV-1003, so it meets the real THV-1003 PRs (BE #142, 446 lines over 4 top dirs; FE #137, 280
// lines in one); verify-this and code-review `skill.prompt` events made from the real deslop one
// with the skill renamed (no log holds theirs); one snapshot pane turned into the Codex pane in the
// rollout's folder, since no snapshot on file holds a Codex pane.

import { expect, test } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { parseRollout } from '../hooks/codex.ts'
import { BACKEND, FRONTEND, parsePrList } from '../hooks/github.ts'
import { isSessionId, type Fact, type Pr, type World } from '../hooks/model.ts'
import { SOURCES } from '../hooks/sources.ts'
import { parseFact } from '../hooks/store.ts'
import { cellText } from '../hooks/view.ts'
import { GH_BACKEND, GH_FRONTEND } from './fixtures/github.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import * as REPORTS from './fixtures/reports.ts'
import { ROLLOUT_VERIFY_THV_1000, ROLLOUT_VERIFY_THV_1000_PATH, SKILL_PROMPT_DESLOP, SKILL_TOOL_CALL, SKILL_TOOL_RESULT } from './fixtures/review.ts'
import { HOME, fakeAsk, fresh, idOf, mainOf, must, relabelTab, rowOf, stage, start, submit, tk, worldOf, type Stage } from './stage.ts'

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
