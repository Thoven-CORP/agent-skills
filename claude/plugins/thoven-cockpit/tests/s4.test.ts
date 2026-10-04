// S4 (THV-1061): the Linear cell. The spec's mod-test cases "Linear hides ↻", "↻ round trip",
// "↻ error" and "Sub-issues", plus the read's own rules: tickets on screen only, carried entries,
// no Project no read, and a failing Linear retried on the 5-minute beat only.
//
// Derived inputs, each built below from a real fixture: the space `Research` (w18) is relabelled
// `COPPA` so it has a Project; tabs and pane labels name the spec's tickets; and the 2026-10-03
// Linear answer has a ticket moved to the team's own `In Progress` node from the same answer.

import type { RenderNode } from 'claude-code'
import { expect, test } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { FRONTEND, BACKEND } from '../hooks/github.ts'
import { AGENT_SKILLS, parsePrList } from '../hooks/github.ts'
import { EXPIRY_MS, expired, ticketsOn } from '../hooks/expiry.ts'
import { LINEAR_URL, carry, eventOf, linearEntries, parseStates, pendingOf, readbacks, stateQuery, updateArgs } from '../hooks/linear.ts'
import { eventId, isLinearEventId, isSessionId, type Board, type Fact, type Pr } from '../hooks/model.ts'
import { SOURCES, parseLiveSpaces, valueOf } from '../hooks/sources.ts'
import { keyOf, parseFact } from '../hooks/store.ts'
import { cellText, drawCockpit, type ColumnId } from '../hooks/view.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { LINEAR_STATES_945_1038, READBACK_DONE_THV_1038, READBACK_ERROR_THV_1038 } from './fixtures/linear.ts'
import { GH_AGENT_SKILLS_WAVE, LINEAR_WAVE, LINEAR_WAVE_CHILDREN, SNAPSHOT_AFTER_WAVE, STORE_WAVE, WORKFLOW_LIVE_SPACES_COCKPIT } from './fixtures/wave.ts'
import { HOME, PANE, bash, cockpit, fakeAsk, fresh, idOf, mainOf, must, relabelPane, relabelTab, rowOf, rowsOf, stage, start, submit, tk, worldOf } from './stage.ts'

const KEY = 'lin_api_fixture_not_a_real_key'

/** The live snapshot with one space renamed, so it has a Live spaces row. */
function relabelSpace(snapshot: string, space: string, label: string): string {
  const root = JSON.parse(snapshot)
  for (const w of root.result.snapshot.workspaces) if (w.workspace_id === space) w.label = label
  return JSON.stringify(root)
}

/** The real Linear answer with some tickets moved to the team's own `In Progress` state node. */
function inProgress(...tickets: string[]): string {
  const root = JSON.parse(LINEAR_STATES_945_1038)
  const node = root.data.teams.nodes[0].states.nodes.find((s: { name: string }) => s.name === 'In Progress')
  for (const n of root.data.issues.nodes) if (tickets.includes(n.identifier)) n.state = node
  return JSON.stringify(root)
}

const COPPA = relabelSpace(SNAPSHOT_LIVE, 'w18', 'COPPA')
/** p8V's Mods tab names THV-1038, with the mock's title. */
const W18_1038 = relabelTab(COPPA, 'w18:t45', 'Build · Retire thoven2.0 (THV-1038)')
const MERGED_FE_138 = eventId('merged', `${FRONTEND}-138`)
const happened = (ticket: string, event: string, at = 0): Fact => ({ kind: 'happened', ticket: tk(ticket), event: idOf(isLinearEventId, event), at })
const linear = (text: string, tickets: string[]) => fresh(must(parseStates(text, tickets.map(tk), 0)))

// ── pure: the cell ───────────────────────────────────────────────────────────────────────────

test('Linear hides ↻: a pending merged 138 while Linear already reads Done is ✓, and u has nothing to send', async () => {
  const world = worldOf(mainOf('w18', 'w18:p8W'), W18_1038, { facts: [happened('THV-1038', MERGED_FE_138)], sources: { linear: linear(LINEAR_STATES_945_1038, ['THV-1038']) } })
  expect(rowOf(world, 'THV-1038').cells.linear).toEqual({ k: 'ok' })
  expect(cellText(rowOf(world, 'THV-1038'), 'linear')).toBe('✓')
  expect(project(world).pending).toEqual([])

  // The same event at In Progress is pending; `started` is not, because In Progress shows it.
  const moving = worldOf(world.me, W18_1038, { facts: world.facts, sources: { linear: linear(inProgress('THV-1038'), ['THV-1038']) } })
  expect(project(moving).pending).toEqual([{ ticket: 'THV-1038', event: { k: 'merged', number: 138 }, id: MERGED_FE_138 }])
  expect(cellText(rowOf(moving, 'THV-1038'), 'linear')).toBe('↻')
})

test('no ↻ before Linear answered for the ticket, and none in a space with no Project', async () => {
  const facts = [happened('THV-1038', MERGED_FE_138)]
  expect(rowOf(worldOf(mainOf('w18', 'w18:p8W'), W18_1038, { facts }), 'THV-1038').cells.linear).toEqual({ k: 'none' })
  const noProject = worldOf(mainOf('w18', 'w18:p8W'), relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Retire thoven2.0 (THV-1038)'), { facts, sources: { linear: linear(inProgress('THV-1038'), ['THV-1038']) } })
  expect(project(noProject).project).toBeUndefined()
  expect(rowOf(noProject, 'THV-1038').cells.linear).toEqual({ k: 'none' })
  expect(project(noProject).pending).toEqual([])
})

test('FE #138 and BE #138 are two events; /workspace update still reads merged 138 for each', async () => {
  const pr = (repo: string): Pr => ({ repo, number: 138, title: 'x', branch: 'docs/thv-1038', state: 'MERGED', tickets: [tk('THV-1038')], checks: { total: 0, done: 0, failed: [], running: [] }, changedLines: 0, topDirs: 0, url: '' })
  const world = worldOf(mainOf('w18', 'w18:p8W'), W18_1038, { sources: { github: fresh({ prs: [pr(FRONTEND), pr(BACKEND)] }), linear: linear(inProgress('THV-1038'), ['THV-1038']) } })
  const merged = project(world).pending.filter((p) => p.event.k === 'merged')
  expect(merged.map((p) => p.id)).toEqual([`merged-${BACKEND}-138`, `merged-${FRONTEND}-138`])
  expect(updateArgs(merged)).toBe('update THV-1038 merged 138 THV-1038 merged 138')
  expect(eventOf(`merged-${FRONTEND}-138`)).toEqual({ k: 'merged', number: 138 })
  expect(eventOf('merged-138')).toEqual({ k: 'merged', number: 138 })
})

test('read-back lines: set-status.js forms are read, a status line and prose are not', async () => {
  expect(readbacks(READBACK_DONE_THV_1038)).toEqual([{ ticket: 'THV-1038', isError: false, text: 'Done' }])
  expect(readbacks(READBACK_ERROR_THV_1038)).toEqual([{ ticket: 'THV-1038', isError: true, text: 'not found' }])
  expect(readbacks('- `THV-1045 In Progress`\n')).toEqual([{ ticket: 'THV-1045', isError: false, text: 'In Progress' }])
  expect(readbacks('DONE THV-1038\nTHV-1038 is done, I think we should merge it\n')).toEqual([])
})

// ── pure: parent groups ──────────────────────────────────────────────────────────────────────

const SUBS = relabelPane(
  relabelPane(relabelPane(COPPA, 'w18:p8P', "Build · The teacher's daily join starts the session record (THV-978)"), 'w18:p8V', 'Build · Joins are measured and routed as real joins (THV-979)'),
  'w18:p8W',
  'Build · Public copy matches the product (THV-980)',
)
/** Main sits outside the three child panes, so every one of them is a row. */
const SUBS_MAIN = mainOf('w18', 'w57:p1')

/** Element constructors that keep only text and buttons, as pin.test.ts's do. */
const isNode = (c: unknown): c is RenderNode => typeof c === 'string' || (typeof c === 'object' && c !== null && 'type' in c)
const kids = (c: unknown): RenderNode[] => (Array.isArray(c) ? c.flatMap(kids) : isNode(c) ? [c] : [])
const EL: Parameters<typeof drawCockpit>[0] = {
  Box: (p) => ({ type: 'Box', props: {}, children: kids(p.children) }),
  Text: (p) => ({ type: 'Text', props: {}, children: kids(p.children) }),
  Button: (p) => ({ type: 'Button', props: { key: p.key ?? '', label: p.label ?? '' }, press: { plugin: 's4', handle: 0 } }),
}
function texts(n: RenderNode): string[] {
  if (typeof n === 'string') return [n]
  if (n.type === 'Button') return [`[${n.props.label}]`]
  if (n.type === 'Text') return [kids(n.children).flatMap(texts).join('')]
  return 'children' in n ? kids(n.children).flatMap(texts) : []
}

test('Sub-issues: THV-978, 979 and 980 sit under a THV-945 summary row, which has no ↻', async () => {
  const facts = [happened('THV-980', 'report-NEEDS_CONTEXT'), { kind: 'report', ticket: tk('THV-980'), sid: idOf(isSessionId, 'sid-b'), status: 'NEEDS_CONTEXT', text: 'NEEDS_CONTEXT THV-980', concerns: 0, at: 1 } satisfies Fact]
  const world = worldOf(SUBS_MAIN, SUBS, { facts, sources: { linear: linear(LINEAR_STATES_945_1038, ['THV-978', 'THV-979', 'THV-980']) } })
  const board = project(world)
  expect(board.build.map((g) => (g.k === 'parent' ? [g.parent, g.title, g.done, g.total, g.needsYou, g.children.map((r) => r.ticket)] : g.row.ticket))).toEqual([
    ['THV-945', 'Daily video: webhooks, recordings and rooms', 3, 3, 1, ['THV-978', 'THV-979', 'THV-980']],
  ])
  // Derived: THV-979 moved back to In Progress, so the summary reads 2 of 3.
  const moving = project(worldOf(SUBS_MAIN, SUBS, { facts, sources: { linear: linear(inProgress('THV-979'), ['THV-978', 'THV-979', 'THV-980']) } }))
  const drawn = texts(drawCockpit(EL, moving, { tab: 'work', selected: undefined, selectedPr: undefined, checks: undefined }, 100, () => undefined))
  // Its 2026-10-03 answer predates the children field, so the count comes from the rows on screen and says so.
  expect(drawn).toContain('Daily video: webhooks, recordings and rooms THV-945: 2 of 3 done on screen, 1 needs you')
  // THV-979's `started` shows at In Progress; only the report on THV-980 is pending, on its own row.
  expect(moving.pending.map((p) => [p.ticket, p.id])).toEqual([['THV-980', 'report-NEEDS_CONTEXT']])
  expect(drawn.filter((t) => t.includes('↻'))).toEqual(['[↻]', '[update all ↻]'])
  expect(rowsOf(moving).some((r) => r.ticket === tk('THV-945'))).toBe(false)
})

test('a parent row on screen is replaced by its summary', async () => {
  const withParent = relabelTab(SUBS, 'w18:t30', 'Build · Daily video (THV-945)')
  const world = worldOf(SUBS_MAIN, relabelPane(withParent, 'w18:p8P', undefined), { sources: { linear: linear(LINEAR_STATES_945_1038, ['THV-945', 'THV-979', 'THV-980']) } })
  expect(project(world).build.map((g) => (g.k === 'parent' ? `${g.parent}: ${g.children.map((r) => r.ticket).join(' ')}` : g.row.ticket))).toEqual(['THV-945: THV-979 THV-980'])
})

// ── the source ───────────────────────────────────────────────────────────────────────────────

test('the read asks only about tickets on screen and carries every other entry forward, with its read time', async () => {
  const me = mainOf('w18', 'w18:p8W')
  const first = must(parseStates(LINEAR_STATES_945_1038, ['THV-945', 'THV-978', 'THV-979', 'THV-980', 'THV-1038'].map(tk), 1000))
  const board = project(worldOf(me, W18_1038))
  const ask = fakeAsk({ read: { [`${HOME}/.linear-api-key`]: `${KEY}\n` }, linear: inProgress('THV-1038') })
  const world = { ...worldOf(me, W18_1038, { sources: { linear: fresh(first) } }), now: 9000, board }
  const next = must(await SOURCES.linear.run(world, ask))
  expect(ask.asked).toEqual([`read ${HOME}/.linear-api-key`, `linear ${JSON.stringify(stateQuery([tk('THV-1038')]))}`])
  const entries = linearEntries({ linear: fresh(next) })
  expect([...entries].map(([t, e]) => [t, e.state.name, e.at])).toEqual([
    ['THV-980', 'Done', 1000],
    ['THV-979', 'Done', 1000],
    ['THV-978', 'Done', 1000],
    ['THV-945', 'Done', 1000],
    ['THV-1038', 'In Progress', 9000],
  ])
  expect(carry(next, must(parseStates('{"data":{"issues":{"nodes":[]}}}', [tk('THV-978')], 9500))).issues.has(tk('THV-978'))).toBe(false)
})

// ── kit: ↻ end to end ────────────────────────────────────────────────────────────────────────

type Runs = Array<{ command: string; args: string }>

/** Main of COPPA with THV-1038 on screen, its FE #138 merge recorded, Linear answering `answer`. */
function stageLinear(on: any, answer: string | (() => { status: number; text: string })) {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-main', snapshot: W18_1038, store: { [`cockpit:happened:THV-1038:${MERGED_FE_138}`]: happened('THV-1038', MERGED_FE_138) } })
  s.files.set(`${HOME}/.linear-api-key`, `${KEY}\n`)
  const fetches: Array<{ url: string; init?: { method?: string; headers?: Record<string, string>; body?: string } }> = []
  const runs: Runs = []
  on('http.fetch', (_$: unknown, e: (typeof fetches)[number]) => {
    fetches.push(e)
    const r = typeof answer === 'string' ? { status: 200, text: answer } : answer()
    return { value: { status: r.status, ok: r.status < 300, headers: {}, text: r.text } }
  })
  on('command.run', (_$: unknown, e: { command: string; args: string }) => (runs.push({ command: e.command, args: e.args }), { value: {} }))
  return { s, fetches, runs }
}

const answer = ($: any, text: string) => $.turn.complete({ answer: text, durationMs: 10, isAborted: false, turnId: 'turn-1', reason: 'answer' })
const workspaceRuns = (runs: Runs) => runs.filter((r) => r.command === 'workspace')

test('↻ round trip: pressing ↻ on THV-1038 hands /workspace update THV-1038 merged 138 to the session; THV-1038 Done clears it', async ($, on) => {
  const { s, fetches, runs } = stageLinear(on, inProgress('THV-1038'))
  await start($)
  await cockpit($)
  await s.clock.advance(5000)
  const ui = await $.ui.mount(PANE)
  expect((await ui.find({ type: 'Button', key: 'linear-THV-1038' }))?.props.label).toBe('↻')

  await ui.press({ key: 'linear-THV-1038' })
  expect(workspaceRuns(runs)).toEqual([])
  await s.clock.advance(0)
  expect(workspaceRuns(runs)).toEqual([{ command: 'workspace', args: 'update THV-1038 merged 138' }])
  expect(s.saved.get(`cockpit:update:THV-1038:${MERGED_FE_138}`)).toEqual({ kind: 'update', ticket: 'THV-1038', event: MERGED_FE_138, at: 5000 })

  await s.clock.advance(1000)
  await answer($, READBACK_DONE_THV_1038)
  await s.clock.advance(5000)
  expect(await ui.find({ type: 'Button', key: 'linear-THV-1038' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: '✓' })).toBeDefined()

  // One read, of THV-1038 only, read-only, the key in the header and nowhere else.
  expect(fetches.length).toBe(1)
  expect(fetches[0]?.url).toBe(LINEAR_URL)
  expect(fetches[0]?.init?.headers?.Authorization).toBe(KEY)
  expect(fetches[0]?.init?.body).toBe(JSON.stringify(stateQuery([tk('THV-1038')])))
  expect(JSON.stringify([...s.saved.values()]).includes(KEY) || s.logs.some((l) => l.includes(KEY))).toBe(false)
})

test('↻ error: a read-back THV-1038 ERROR not found keeps the ↻, and u sends the event again', async ($, on) => {
  const { s, runs } = stageLinear(on, inProgress('THV-1038'))
  await start($)
  await cockpit($)
  await s.clock.advance(5000)
  const ui = await $.ui.mount(PANE)
  await ui.press({ key: 'linear-THV-1038' })
  await s.clock.advance(1000)

  s.bashStdout = READBACK_ERROR_THV_1038
  await bash($, 'node ~/.agents/skills/workspace/tools/set-status.js "Done" THV-1038')
  await s.clock.advance(5000)
  expect((await ui.find({ type: 'Button', key: 'linear-THV-1038' }))?.props.label).toBe('↻ !')

  await ui.press({ key: 'update-all' })
  await s.clock.advance(0)
  expect(workspaceRuns(runs)).toEqual([
    { command: 'workspace', args: 'update THV-1038 merged 138' },
    { command: 'workspace', args: 'update THV-1038 merged 138' },
  ])
  // A read-back in a prompt clears it too.
  await s.clock.advance(1000)
  await submit($, READBACK_DONE_THV_1038)
  await s.clock.advance(5000)
  expect(await ui.find({ type: 'Button', key: 'linear-THV-1038' })).toBeUndefined()
})

test('a manual Linear move clears the ↻ on the next 5-minute read, not before', async ($, on) => {
  let text = inProgress('THV-1038')
  const { s, fetches } = stageLinear(on, () => ({ status: 200, text }))
  await start($)
  await cockpit($)
  await s.clock.advance(5000)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Button', key: 'linear-THV-1038' })).toBeDefined()
  text = LINEAR_STATES_945_1038
  await s.clock.advance(4 * 60_000)
  expect(await ui.find({ type: 'Button', key: 'linear-THV-1038' })).toBeDefined()
  await s.clock.advance(60_000)
  expect(fetches.length).toBe(2)
  expect(await ui.find({ type: 'Button', key: 'linear-THV-1038' })).toBeUndefined()
})

test('Linear failing marks only its column stale and is retried on the 5-minute beat, never each tick', async ($, on) => {
  let status = 200
  const { s, fetches } = stageLinear(on, () => ({ status, text: status === 200 ? inProgress('THV-1038') : 'Bad Gateway' }))
  await start($)
  await cockpit($)
  await s.clock.advance(5000)
  status = 502
  await s.clock.advance(5 * 60_000)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /^Linear stale since / })).toBeDefined()
  await s.clock.advance(60_000)
  expect(fetches.length).toBe(2)
  expect(await ui.find({ type: 'Text', text: '○ C' })).toBeDefined()
})

test('no Project: no Linear read, no key read, no Linear column and no u', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Retire thoven2.0 (THV-1038)') })
  const fetches: unknown[] = []
  on('http.fetch', (_$: unknown, e: unknown) => (fetches.push(e), { deny: 'no Linear here' }))
  await start($)
  await cockpit($)
  await s.clock.advance(6 * 60_000)
  const ui = await $.ui.mount(PANE)
  expect(fetches).toEqual([])
  expect(s.fsCalls.filter((c) => c.includes('.linear-api-key'))).toEqual([])
  expect(await ui.find({ type: 'Text', text: 'Linear' })).toBeUndefined()
  expect(await ui.find({ type: 'Button', key: 'update-all' })).toBeUndefined()
})

// ── Rows outlive their panes (THV-1102, F3 and F7 of the THV-1094 wave) ─────────────────────
//
// Derived inputs, each from a fixture in fixtures/wave.ts: the store keys as they stood when a
// replayed moment happened (every key written by then), and the Linear answer with tickets moved to
// the team's own state node truth.log read for them at that moment.

const WAVE_MAIN = mainOf('w5E', 'w5E:p1')
const waveFacts = (until = Infinity): Fact[] => Object.entries(STORE_WAVE).flatMap(([key, value]) => parseFact(key, value) ?? []).filter((f) => f.at <= until)
/** A wave Linear answer with tickets moved to a state node from the same answer, as truth.log read them, in their own node and in their parent's children. */
function waveAt(moves: Record<string, string>, answer = LINEAR_WAVE): string {
  const root = JSON.parse(answer)
  const nodes: Array<{ name: string; type: string }> = root.data.teams.nodes[0].states.nodes
  const moved = (id: string) => must(nodes.find((s) => s.name === moves[id]))
  for (const n of root.data.issues.nodes) {
    if (moves[n.identifier]) n.state = moved(n.identifier)
    for (const c of n.parent?.children?.nodes ?? []) if (moves[c.identifier]) c.state = { type: moved(c.identifier).type }
  }
  return JSON.stringify(root)
}
const WAVE = ['THV-1094', 'THV-1095', 'THV-1096', 'THV-1097']
const waveWorld = (facts: Fact[], linearText: string) =>
  worldOf(WAVE_MAIN, SNAPSHOT_AFTER_WAVE, {
    facts,
    sources: { spaces: fresh(parseLiveSpaces(WORKFLOW_LIVE_SPACES_COCKPIT)), github: fresh({ prs: must(parsePrList(AGENT_SKILLS, GH_AGENT_SKILLS_WAVE)) }), linear: linear(linearText, WAVE) },
  })
/** `happened:THV-1097:merged-…-35`, written 46 s after #35 merged; main closed both panes right after. */
/** Derived: what a ↻ press leaves for a ticket after the wave, an `update` fact for each of its events and a newer `THV-n Done` read-back. */
const handedBack = (t: string): Fact[] => [
  ...waveFacts().flatMap((f): Fact[] => (f.kind === 'happened' && f.ticket === t ? [{ kind: 'update', ticket: f.ticket, event: f.event, at: AFTER_WAVE }] : [])),
  { kind: 'readback', ticket: tk(t), sid: idOf(isSessionId, 'sid-main'), isError: false, text: 'Done', at: AFTER_WAVE + 1 },
]
const AFTER_WAVE = Math.max(...waveFacts().map((f) => f.at)) + 1
const MERGED_35_AT = must(waveFacts().find((f) => f.kind === 'happened' && f.event === `merged-${AGENT_SKILLS}-35`)).at

test('THV-1097 after #35 merged and its panes closed keeps its row: pane gone, ↻ merged 35, its Review cell', async () => {
  // 20:04, truth.log: THV-1097 and THV-1095 read Ready, and no wave pane is left in w5E.
  const world = waveWorld(waveFacts(MERGED_35_AT), waveAt({ 'THV-1097': 'Ready', 'THV-1095': 'Ready', 'THV-1096': 'Backlog' }))
  const row = rowOf(world, 'THV-1097')
  expect(row.panes).toEqual({ k: 'gone' })
  const columns: ColumnId[] = ['pane', 'report', 'review', 'pr', 'linear']
  expect(columns.map((c) => cellText(row, c))).toEqual(['gone', '✓', 'V C T D', '#35', '↻'])
  expect(project(world).pending.filter((p) => p.ticket === tk('THV-1097')).map((p) => p.id)).toEqual(['report-DONE', 'report-NEEDS_CONTEXT', `merged-${AGENT_SKILLS}-35`])
})

test("THV-1094's summary counts the rows whose panes closed: 2 of 3 done while THV-1096 reads Ready", async () => {
  // 20:41, truth.log's last read: THV-1095 and THV-1097 Done, THV-1096 Ready, every wave pane closed.
  const board = project(waveWorld(waveFacts(), waveAt({ 'THV-1096': 'Ready' })))
  const group = must(board.build.find((g) => g.k === 'parent' && g.parent === tk('THV-1094')))
  expect(group.k === 'parent' && { done: group.done, total: group.total, children: group.children.map((r) => [r.ticket, r.panes.k]) }).toEqual({
    done: 2,
    total: 3,
    children: [['THV-1095', 'gone'], ['THV-1097', 'gone'], ['THV-1096', 'gone']],
  })
})

test('a row whose panes closed leaves once Linear shows every event on it, and never shows in another space', async () => {
  const done = waveWorld([...waveFacts(), ...['THV-1095', 'THV-1096', 'THV-1097'].flatMap((t) => handedBack(t))], LINEAR_WAVE)
  expect(rowsOf(project(done)).map((r) => r.ticket)).not.toContain('THV-1097')
  const elsewhere = worldOf(mainOf('w57', 'w57:p1'), SNAPSHOT_AFTER_WAVE, { facts: waveFacts(), sources: { spaces: fresh(parseLiveSpaces(WORKFLOW_LIVE_SPACES_COCKPIT)), linear: linear(LINEAR_WAVE, WAVE) } })
  expect(rowsOf(project(elsewhere)).map((r) => r.ticket).filter((t) => WAVE.includes(t))).toEqual([])
})

test('a closed row with a pending ↻ survives a 14-day expiry pass, and its keys go on the first pass after it leaves', async () => {
  const stored = Object.entries(STORE_WAVE).map(([key, value]) => ({ key, value }))
  const pass = (keys: typeof stored, linearText: string, now: number) => {
    const world = { ...waveWorld(keys.flatMap((s) => parseFact(s.key, s.value) ?? []), linearText), now }
    const gone = new Set(expired(keys, { now, prs: valueOf(world.sources.github)?.prs, linear: linearEntries(world.sources), onBoard: ticketsOn(project(world)) }).map((e) => e.key))
    return keys.filter((s) => !gone.has(s.key))
  }
  // 14 days and an hour after the wave's last write, THV-1097 still reads Ready: its ↻ merged 35 is pending.
  const ready = waveAt({ 'THV-1097': 'Ready', 'THV-1096': 'Ready' })
  const kept = pass(stored, ready, AFTER_WAVE + EXPIRY_MS + 3_600_000)
  const row = rowOf(waveWorld(kept.flatMap((s) => parseFact(s.key, s.value) ?? []), ready), 'THV-1097')
  expect([row.panes.k, cellText(row, 'linear')]).toEqual(['gone', '↻'])
  expect(pendingOf(row.cells.linear).map((p) => p.id)).toContain(`merged-${AGENT_SKILLS}-35`)

  // Every event handed back and Linear Done: the rows leave, and the next pass deletes each wave ticket's keys as merged-done.
  const back = [...stored, ...['THV-1095', 'THV-1096', 'THV-1097'].flatMap(handedBack).map((f) => ({ key: keyOf(f), value: f }))]
  // The three `$P` sends no longer parse (F4), so no ticket names them: they go by age, as any unreadable key does.
  const unreadable = ['cockpit:send:THV-1095:$P:verifier:0', 'cockpit:send:THV-1096:$P:builder:0', 'cockpit:send:THV-1096:$P:verifier:0']
  const left = pass(back, LINEAR_WAVE, AFTER_WAVE + 3_600_000)
  expect(left.map((s) => s.key).filter((k) => /THV-109[5-7]:/.test(k))).toEqual(unreadable)
  expect(pass(left, LINEAR_WAVE, AFTER_WAVE + EXPIRY_MS + 3_600_000).map((s) => s.key).filter((k) => /THV-109[5-7]:/.test(k))).toEqual([])
})

const workText = (board: Board): string[] => texts(drawCockpit(EL, board, { tab: 'work', selected: undefined, selectedPr: undefined, checks: undefined }, 100, () => undefined))

test("the parent summary counts its children from Linear: after ↻ hands back THV-1095 and THV-1097, THV-1094 reads 2 of 4 done", async () => {
  // 20:41 with the ↻ pressed: THV-1096 reads Ready, and Linear lists THV-1100 (Backlog) as THV-1094's fourth child.
  const handed = [...waveFacts(), ...['THV-1095', 'THV-1097'].flatMap(handedBack)]
  const board = project(waveWorld(handed, waveAt({ 'THV-1096': 'Ready' }, LINEAR_WAVE_CHILDREN)))
  const group = must(board.build.find((g) => g.k === 'parent' && g.parent === tk('THV-1094')))
  expect(group.k === 'parent' && { done: group.done, total: group.total, counted: group.counted, children: group.children.map((r) => r.ticket) }).toEqual({ done: 2, total: 4, counted: 'linear', children: ['THV-1096'] })
  expect(workText(board)).toContain('Cockpit: tidy-ups from the S2 re-verify THV-1094: 2 of 4 done')
})

test('a stale Linear read counts the parent from the rows on screen, and the summary says so', async () => {
  const world = waveWorld(waveFacts(), waveAt({ 'THV-1096': 'Ready' }, LINEAR_WAVE_CHILDREN))
  const read = must(valueOf(world.sources.linear))
  const stale = { ...world, sources: { ...world.sources, linear: { k: 'stale' as const, value: read, at: 0, since: 0, error: 'Bad Gateway' } } }
  const group = must(project(stale).build.find((g) => g.k === 'parent'))
  expect(group.k === 'parent' && [group.done, group.total, group.counted]).toEqual([2, 3, 'screen'])
  expect(workText(project(stale))).toContain('Cockpit: tidy-ups from the S2 re-verify THV-1094: 2 of 3 done on screen')
})
