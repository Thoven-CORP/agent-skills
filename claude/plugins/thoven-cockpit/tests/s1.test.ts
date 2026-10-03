// S1: label grammar, the snapshot parse and the board join on real text (no kit), then the hooks
// under kit stubs: the claim, the heartbeat on mock.clock, and the Work tab drawing.

import { expect, test } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { parseLabel, pickLabel } from '../hooks/dispatch.ts'
import { parseSnapshot } from '../hooks/herdr.ts'
import type { Main, PaneId, Polled, SessionId, Snapshot, Sources, SpaceId, World } from '../hooks/model.ts'
import { headPathOf, parseHead, parseLiveSpaces } from '../hooks/sources.ts'
import { cellText, columnsFor } from '../hooks/view.ts'
import { DOT_GIT_WORKTREE, HEAD_COCKPIT } from './fixtures/git.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { WORKFLOW_LIVE_SPACES } from './fixtures/workflow.ts'
import { MAIN_CWD, PANE, cockpit, relabelPane, relabelTab, stage, start } from './stage.ts'

const CONSENT = 'Build · Consent evidence hardening (THV-1045)'
/** w18 with its `Mods` tab named the way label.sh names a build tab. p8V sits in it with no pane label. */
const SNAPSHOT_W18_BUILD = relabelTab(SNAPSHOT_LIVE, 'w18:t45', CONSENT)

const fresh = <T>(value: T): Polled<T> => ({ k: 'fresh', value, at: 0 })
const never = { k: 'never' } as const

function snap(json: string): Snapshot {
  const s = parseSnapshot(json)
  if (!s) throw new Error('fixture did not parse')
  return s
}

function mainOf(space: string, pane: string, cwd = MAIN_CWD): Main {
  return { k: 'main', space: space as SpaceId, pane: pane as PaneId, sid: 'sid-a' as SessionId, cwd, home: '/Users/andresmartinez' }
}

function worldOf(me: Main, snapshot: Snapshot, extra: Partial<Sources> = {}): World {
  return {
    now: 0,
    me,
    sources: {
      herdr: fresh(snapshot),
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
    facts: [],
    readbacks: new Map(),
    inFlight: new Set(),
    mainSkill: undefined,
  }
}

const NO_LATER_CELLS = {
  verifierPane: { k: 'none' },
  report: { k: 'none' },
  fix: { k: 'none' },
  review: { k: 'none', offer: undefined },
  pr: { k: 'none' },
  ci: { k: 'none' },
}

// ── unit: dispatch.ts label grammar ──────────────────────────────────────────────────────────

test('a Build tab label with a null pane label gives a Build row titled from the tab', async () => {
  expect(parseLabel(CONSENT)).toEqual({ kind: 'Build', title: 'Consent evidence hardening', tickets: ['THV-1045'] })
  expect(pickLabel([undefined, CONSENT, 'Cockpit availability for main orchestrator'], 'legal/thv-1045')).toEqual({
    kind: 'Build',
    title: 'Consent evidence hardening',
    tickets: ['THV-1045'],
  })
})

test('a multi-ticket label gives three tickets', async () => {
  expect(parseLabel('Book Lessons follow-ups (THV-843 847 851)')).toEqual({ kind: undefined, title: 'Book Lessons follow-ups', tickets: ['THV-843', 'THV-847', 'THV-851'] })
})

test("herdr's default tab name '1' is no label", async () => {
  expect(parseLabel('1')).toBeUndefined()
  expect(parseLabel('Mods')).toBeUndefined()
  expect(parseLabel('main · COPPA orchestrator')).toBeUndefined()
})

// ── unit: herdr.ts on the real snapshot ──────────────────────────────────────────────────────

test('the live snapshot parses: 5 spaces, 7 panes, labels only where herdr gave one', async () => {
  const s = snap(SNAPSHOT_LIVE)
  expect(s.spaces.map((x) => `${x.space} ${x.label}`)).toEqual(['w18 Research', 'w4D UI Polishes', 'w54 frontend', 'w56 Coppa', 'w57 thoven'])
  expect(s.panes.map((p) => p.pane)).toEqual(['w18:p8P', 'w18:p8V', 'w18:p8W', 'w4D:pH', 'w54:p1', 'w56:p1', 'w57:p1'])
  expect(s.panes.filter((p) => p.paneLabel !== undefined).map((p) => p.paneLabel)).toEqual(['Plan · Cockpit spec (THV-1053)', 'UI polish walkthrough (THV-481)'])
  expect(s.panes.find((p) => p.pane === 'w18:p8P')).toMatchObject({ tab: 'w18:t30', tabLabel: 'Research', tool: 'C', status: 'idle', cwd: '/Users/andresmartinez/thoven' })
  expect(s.panes.find((p) => p.pane === 'w54:p1')).toMatchObject({ status: 'blocked', tabLabel: '1', terminalTitle: 'After-cutover cleanup audit' })
})

test('a snapshot of an unknown shape is undefined, not a throw', async () => {
  expect(parseSnapshot('{"result":{}}')).toBeUndefined()
  expect(parseSnapshot('not json')).toBeUndefined()
})

// ── unit: board.ts on the real snapshot ──────────────────────────────────────────────────────

test("w18 with a Build tab: p8V is the THV-1045 row, main's own labelled pane is not a row", async () => {
  const board = project(worldOf(mainOf('w18', 'w18:p8W'), snap(SNAPSHOT_W18_BUILD)))
  expect(board.space).toEqual({ space: 'w18', label: 'Research' })
  expect(board.project).toBeUndefined()
  expect(board.build).toEqual([
    {
      k: 'single',
      row: {
        ticket: 'THV-1045',
        title: 'Consent evidence hardening',
        kind: 'Build',
        origin: 'label',
        pane: { k: 'live', status: 'idle', tool: 'C', pane: 'w18:p8V' },
        extraPanes: [],
        linear: { k: 'hidden' },
        ...NO_LATER_CELLS,
      },
    },
  ])
  expect(board.working).toEqual([])
})

test('UI Polishes: the THV-481 tab is a Build row with no Kind, and the space has its Project', async () => {
  const board = project(worldOf(mainOf('w4D', 'w18:p8W'), snap(SNAPSHOT_LIVE)))
  expect(board.project).toBe('Design System')
  expect(board.build.map((g) => (g.k === 'single' ? [g.row.ticket, g.row.title, g.row.kind, g.row.linear.k] : []))).toEqual([['THV-481', 'UI polish walkthrough', undefined, 'none']])
})

test('this-session row: main on cockpit/thv-1058 with no dispatch shows one row and no Linear column', async () => {
  const cwd = '/Users/andresmartinez/thoven/agent-skills-thv-1058'
  expect(headPathOf(cwd, DOT_GIT_WORKTREE)).toBe('/Users/andresmartinez/thoven/agent-skills/.git/worktrees/agent-skills-thv-1058/HEAD')
  expect(parseHead(HEAD_COCKPIT)).toBe('cockpit/thv-1058')
  const branches = new Map([[cwd, 'cockpit/thv-1058']])
  const board = project(worldOf(mainOf('w18', 'w18:p8W', cwd), snap(SNAPSHOT_LIVE), { branches: fresh(branches) }))
  expect(board.build).toEqual([
    {
      k: 'single',
      row: {
        ticket: 'THV-1058',
        title: 'Cockpit availability for main orchestrator',
        kind: undefined,
        origin: 'this-session',
        pane: { k: 'live', status: 'working', tool: 'C', pane: 'w18:p8W' },
        extraPanes: [],
        linear: { k: 'hidden' },
        ...NO_LATER_CELLS,
      },
    },
  ])
})

test('an unlabelled tab goes under Other as unlabelled', async () => {
  const board = project(worldOf(mainOf('w18', 'w18:p8W'), snap(SNAPSHOT_LIVE)))
  expect(board.build).toEqual([])
  expect(board.other).toEqual([
    { label: 'tab "Research"', kind: undefined, ticket: undefined, pane: { k: 'live', status: 'idle', tool: 'C', pane: 'w18:p8P' }, note: 'unlabelled' },
    { label: 'tab "Mods"', kind: undefined, ticket: undefined, pane: { k: 'live', status: 'idle', tool: 'C', pane: 'w18:p8V' }, note: 'unlabelled' },
  ])
})

test('a multi-ticket pane gives three Build rows that share the pane', async () => {
  const board = project(worldOf(mainOf('w18', 'w18:p8W'), snap(relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Book Lessons follow-ups (THV-843 847 851)'))))
  const p8V = { k: 'live', status: 'idle', tool: 'C', pane: 'w18:p8V' }
  const shared = { title: 'Book Lessons follow-ups', kind: undefined, origin: 'label', pane: p8V, extraPanes: [], linear: { k: 'hidden' }, ...NO_LATER_CELLS }
  expect(board.build).toEqual([
    { k: 'single', row: { ticket: 'THV-843', ...shared } },
    { k: 'single', row: { ticket: 'THV-847', ...shared } },
    { k: 'single', row: { ticket: 'THV-851', ...shared } },
  ])
})

test("Live spaces match the space's label in any case: Coppa is COPPA's Project", async () => {
  const board = project(worldOf(mainOf('w56', 'w18:p8W'), snap(SNAPSHOT_LIVE)))
  expect(board.space).toEqual({ space: 'w56', label: 'Coppa' })
  expect(board.project).toBe('COPPA and Data Compliance Audit')
  expect(board.build.map((g) => (g.k === 'single' ? [g.row.ticket, g.row.title, g.row.linear.k] : []))).toEqual([['THV-1004', "children's media URL expiry", 'none']])
})

test('two Build panes on one ticket give one row whose Pane cell lists both', async () => {
  // p8W loses its own label, so both panes of the THV-1045 tab read the tab's Build label.
  const json = relabelPane(SNAPSHOT_W18_BUILD, 'w18:p8W', undefined)
  const board = project(worldOf(mainOf('w18', 'w18:p8P'), snap(json)))
  expect(board.build.map((g) => (g.k === 'single' ? [g.row.ticket, g.row.pane, g.row.extraPanes] : []))).toEqual([
    ['THV-1045', { k: 'live', status: 'idle', tool: 'C', pane: 'w18:p8V' }, [{ k: 'live', status: 'working', tool: 'C', pane: 'w18:p8W' }]],
  ])
  const g = board.build[0]
  if (g?.k !== 'single') throw new Error('expected one row')
  expect(cellText(g.row).pane).toBe('○ C ◐ C')
})

test('a Review pane naming two tickets verifies the one with a Build row and gives the other its own row', async () => {
  const json = relabelPane(SNAPSHOT_W18_BUILD, 'w18:p8W', 'Review · Consent evidence hardening (THV-1045 1004)')
  const board = project(worldOf(mainOf('w18', 'w18:p8P'), snap(json)))
  const p8V = { k: 'live', status: 'idle', tool: 'C', pane: 'w18:p8V' }
  const p8W = { k: 'live', status: 'working', tool: 'C', pane: 'w18:p8W' }
  expect(board.build.map((g) => (g.k === 'single' ? [g.row.ticket, g.row.kind, g.row.title, g.row.pane, g.row.verifierPane] : []))).toEqual([
    ['THV-1045', 'Build', 'Consent evidence hardening', p8V, p8W],
    ['THV-1004', 'Review', 'Consent evidence hardening', p8W, p8W],
  ])
  expect(board.other).toEqual([])
})

// ── unit: view.ts glyphs and widths ──────────────────────────────────────────────────────────

test('cellText: an S1 row shows its Pane glyph and tool tag, and a dash in every later column', async () => {
  const board = project(worldOf(mainOf('w18', 'w18:p8W'), snap(SNAPSHOT_W18_BUILD)))
  const g = board.build[0]
  if (g?.k !== 'single') throw new Error('expected one row')
  expect(cellText(g.row)).toEqual({ pane: '○ C', report: '–', fix: '–', review: '– – – –', pr: '–', ci: '–', linear: '' })
  expect(cellText({ ...g.row, pane: { k: 'live', status: 'working', tool: 'X', pane: g.row.pane.k === 'live' ? g.row.pane.pane : ('' as PaneId) }, linear: { k: 'none' } })).toMatchObject({ pane: '◐ X', linear: '–' })
  expect(cellText({ ...g.row, pane: { k: 'gone' } }).pane).toBe('gone')
})

test('columnsFor: fixed cells, the Work column takes what is left, never under 10', async () => {
  expect(columnsFor(80, true)).toEqual([32, 5, 7, 5, 9, 9, 6, 7])
  expect(columnsFor(80, false)).toEqual([39, 5, 7, 5, 9, 9, 6])
  expect(columnsFor(30, true)).toEqual([10, 5, 7, 5, 9, 9, 6, 7])
})

// ── kit: roles, claim and timers ─────────────────────────────────────────────────────────────

test('an inert session (no HERDR_PANE_ID) registers /cockpit and reads nothing', async ($, on) => {
  const s = stage(on, { snapshot: SNAPSHOT_LIVE })
  await start($)
  await s.clock.advance(15_000)
  expect(s.registered).toEqual(['cockpit'])
  expect(s.storeCalls.n).toBe(0)
  expect(s.argvs).toEqual([])
})

test('only the session that ran /cockpit starts polling', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-a', snapshot: SNAPSHOT_LIVE })
  await start($)
  await s.clock.advance(15_000)
  expect(s.snapshots()).toBe(0)

  const answer = await cockpit($)
  expect(answer.text).toBe('Cockpit is main of Research.')
  expect(s.saved.get('cockpit:main:w18')).toEqual({ kind: 'main', space: 'w18', sid: 'sid-a', pane: 'w18:p8W', at: 15_000 })
  expect(s.opened).toEqual([{ id: 'cockpit', title: 'Cockpit', focus: true }])
  expect(s.snapshots()).toBe(1)

  await s.clock.advance(15_000)
  expect(s.snapshots()).toBe(4)
})

test('a session whose claim was taken by another session stops polling and closes its pane', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-a', snapshot: SNAPSHOT_LIVE })
  await start($)
  await cockpit($)
  s.saved.set('cockpit:main:w18', { kind: 'main', space: 'w18', sid: 'sid-b', pane: 'w18:p8V', at: 1 })
  await s.clock.advance(10_000)
  expect(s.snapshots()).toBe(1)
  expect(s.closed).toEqual(['cockpit'])
})

test('after /clear the same pane is main again under its new session id, and draws at once', async ($, on) => {
  const s = stage(on, {
    pane: 'w18:p8W',
    sid: 'sid-new',
    snapshot: SNAPSHOT_LIVE,
    store: { 'cockpit:main:w18': { kind: 'main', space: 'w18', sid: 'sid-old', pane: 'w18:p8W', at: 0 } },
  })
  await $.classic.SessionStart({ session_id: 'sid-new', cwd: MAIN_CWD, source: 'clear', hook_event_name: 'SessionStart', transcript_path: '' } as any)
  expect(s.saved.get('cockpit:main:w18')).toEqual({ kind: 'main', space: 'w18', sid: 'sid-new', pane: 'w18:p8W', at: 0 })
  await s.clock.settle()
  expect(s.snapshots()).toBe(1)
  await s.clock.advance(5_000)
  expect(s.snapshots()).toBe(2)
})

// ── kit: crash safety ────────────────────────────────────────────────────────────────────────

test('herdr exits 1: the pane says herdr unavailable, keeps the last rows, and nothing throws', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_W18_BUILD })
  await start($)
  await cockpit($)
  s.herdr.mode = 'fail'
  await s.clock.advance(5_000)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /^herdr unavailable since \d\d:\d\d$/ })).toBeDefined()
  expect((await ui.find({ key: 'row-THV-1045' }))?.props.label).toBe('Consent evidence hardening')
})

test('herdr down since a reload: the pane says herdr unavailable', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_LIVE, store: { 'cockpit:main:w18': { kind: 'main', space: 'w18', sid: 'sid-a', pane: 'w18:p8W', at: 0 } } })
  s.herdr.mode = 'fail'
  await start($)
  await s.clock.advance(5_000)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: 'herdr unavailable' })).toBeDefined()
})

test('herdr hangs: ticks never overlap, and the pane says herdr unavailable once it times out', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_W18_BUILD })
  await start($)
  await cockpit($)
  s.herdr.mode = 'hang'
  await s.clock.advance(15_000)
  expect(s.snapshots()).toBe(2)
  await s.clock.advance(30_000)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /^herdr unavailable since \d\d:\d\d$/ })).toBeDefined()
})

// ── kit: the Work tab ────────────────────────────────────────────────────────────────────────

test('the Work tab draws kind, title, Pane glyph and tool tag; 2 switches to PRs; f focuses the pane', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_W18_BUILD })
  await start($)
  await cockpit($)
  const ui = await $.ui.mount(PANE)

  expect(await ui.find({ type: 'Text', text: 'Research' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'no project' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'BUILD' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Pane' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Linear' })).toBeUndefined()
  expect((await ui.find({ key: 'row-THV-1045' }))?.props.label).toBe('Consent evidence hardening')
  expect(await ui.find({ type: 'Text', text: 'Build THV-1045' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '○ C' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'OTHER' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'tab "Research" (unlabelled)' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'idle C' })).toBeDefined()

  await ui.press({ key: 'tab-prs' })
  expect(await ui.find({ type: 'Text', text: 'PRs arrive in S2' })).toBeDefined()
  expect(await ui.find({ key: 'row-THV-1045' })).toBeUndefined()

  await ui.press({ key: 'tab-work' })
  await ui.press({ key: 'focus-row' })
  await s.clock.settle()
  expect(s.argvs.filter((a) => a[1] === 'agent')).toEqual([['herdr', 'agent', 'focus', 'w18:p8V']])
})

type Node = { type: string; props: Record<string, unknown>; children?: unknown[] }
const kids = (n: Node): Node[] => (n.children ?? []).filter((c): c is Node => typeof c === 'object' && c !== null)
function findNode(n: Node, match: (n: Node) => boolean): Node | undefined {
  if (match(n)) return n
  for (const c of kids(n)) {
    const hit = findNode(c, match)
    if (hit) return hit
  }
  return undefined
}

test('a drawn Build row and the heading row share the column widths for the pane width', async ($, on) => {
  stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_W18_BUILD })
  await start($)
  await cockpit($)
  const ui = await $.ui.mount(PANE)
  const root = (await ui.find({ type: 'Box' })) as Node
  const holds = (pred: (n: Node) => boolean) => (n: Node) => n.type === 'Box' && n.props.flexDirection === 'row' && kids(n).some((c) => findNode(c, pred) !== undefined)
  const row = findNode(root, holds((n) => n.props.key === 'row-THV-1045'))
  const heading = findNode(root, holds((n) => n.type === 'Text' && n.children?.[0] === 'Review'))
  expect(row && kids(row).map((c) => c.props.width)).toEqual([39, 5, 7, 5, 9, 9, 6])
  expect(heading && kids(heading).map((c) => c.props.width)).toEqual([39, 5, 7, 5, 9, 9, 6])
})

test('two sessions in one space: the pane that did not run /cockpit stays a pane and starts no timers', async ($, on) => {
  // The claim exactly as the session in w18:p8W wrote it when it ran /cockpit (see the test above).
  const claim = { kind: 'main', space: 'w18', sid: 'sid-a', pane: 'w18:p8W', at: 15_000 }
  const s = stage(on, { pane: 'w18:p8V', sid: 'sid-b', snapshot: SNAPSHOT_LIVE, store: { 'cockpit:main:w18': claim } })
  await start($)
  await s.clock.advance(15_000)
  expect(s.timers).toEqual([])
  expect(s.snapshots()).toBe(0)
  expect(s.saved.get('cockpit:main:w18')).toEqual(claim)
  expect(s.opened).toEqual([])
})
