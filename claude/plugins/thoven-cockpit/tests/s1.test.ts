// S1: label grammar, the snapshot parse and the board join on real text (no kit), then the hooks
// under kit stubs: the claim, the heartbeat on mock.clock, and the Work tab drawing.
//
// Derived input: the wave THV-1094 replay runs main's real pane w5E:p1 over SNAPSHOT_LIVE, which
// predates space w5E. A send's claim reads no snapshot, so only the board it then draws is empty.

import { expect } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { branchTicket, parseLabel, pickLabel } from '../hooks/dispatch.ts'
import { parseSnapshot, spaceOfPane } from '../hooks/herdr.ts'
import { isPaneId, type Board } from '../hooks/model.ts'
import { COMMANDS } from '../hooks/commands.ts'
import { BACKEND, FRONTEND } from '../hooks/github.ts'
import { SOURCES } from '../hooks/sources.ts'
import { cellText, columnsFor } from '../hooks/view.ts'
import { DOT_GIT_THV_481, DOT_GIT_WORKTREE, HEAD_COCKPIT, HEAD_THV_481 } from './fixtures/git.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { MAIN_SID_THV_1094, SEND_1947_THV_1095_1097 } from './fixtures/wave.ts'
import { MAIN_CWD, PANE, bash, cockpit, dropPane, fakeAsk, fresh, idOf, mainOf, must, ranTimes, relabelPane, relabelTab, rowOf, rowsOf, stage, start, worldOf, test } from './stage.ts'

const CONSENT = 'Build · Consent evidence hardening (THV-1045)'
/** w18 with its `Mods` tab named the way label.sh names a build tab. p8V sits in it with no pane label. */
const SNAPSHOT_W18_BUILD = relabelTab(SNAPSHOT_LIVE, 'w18:t45', CONSENT)

// ── unit: dispatch.ts label grammar ──────────────────────────────────────────────────────────

test('a Build tab label with a null pane label gives a Build row titled from the tab', async () => {
  expect(parseLabel(CONSENT)).toEqual({ kind: 'Build', title: 'Consent evidence hardening', tickets: ['THV-1045'] })
  expect(pickLabel([undefined, CONSENT, 'Cockpit availability for main orchestrator'])).toEqual({
    kind: 'Build',
    title: 'Consent evidence hardening',
    tickets: ['THV-1045'],
  })
  expect(pickLabel([undefined, '1', undefined])).toBeUndefined()
  expect(branchTicket('legal/thv-1045')).toBe('THV-1045')
  expect(branchTicket('sentry-error')).toBeUndefined()
})

test('a space comes only from a pane id: w18:p8W is in w18, and $P or 18:8W is in none', async () => {
  expect([spaceOfPane('w18:p8W'), spaceOfPane('$P'), spaceOfPane('18:8W')]).toEqual(['w18', undefined, undefined])
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
  const s = must(parseSnapshot(SNAPSHOT_LIVE))
  expect(s.spaces.map((x) => `${x.space} ${x.label}`)).toEqual(['w18 Research', 'w4D UI Polishes', 'w54 frontend', 'w56 Coppa', 'w57 thoven'])
  expect(s.panes.map((p) => p.pane)).toEqual(['w18:p8P', 'w18:p8V', 'w18:p8W', 'w4D:pH', 'w54:p1', 'w56:p1', 'w57:p1'])
  expect(s.panes.filter((p) => p.paneLabel !== undefined).map((p) => p.paneLabel)).toEqual(['Plan · Cockpit spec (THV-1053)', 'UI polish walkthrough (THV-481)'])
  expect(s.panes.find((p) => p.pane === 'w18:p8P')).toMatchObject({ tab: 'w18:t30', tabLabel: 'Research', tool: 'C', status: 'idle', cwd: '/Users/andresmartinez/thoven' })
  expect(s.panes.find((p) => p.pane === 'w54:p1')).toMatchObject({ status: 'blocked', tabLabel: '1', terminalTitle: 'After-cutover cleanup audit' })
  expect(s.panes.filter((p) => p.tab === 'w18:t45').map((p) => p.tabLabel)).toEqual(['Mods', 'Mods'])
})

test('a snapshot of an unknown shape is undefined, not a throw', async () => {
  expect(parseSnapshot('{"result":{}}')).toBeUndefined()
  expect(parseSnapshot('not json')).toBeUndefined()
})

// ── unit: board.ts on the real snapshot ──────────────────────────────────────────────────────

test("w18 with a Build tab: p8V is the THV-1045 row, main's own labelled pane is not a row", async () => {
  const board = project(worldOf(mainOf('w18', 'w18:p8W'), SNAPSHOT_W18_BUILD))
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
        panes: { k: 'live', list: [{ status: 'idle', tool: 'C', pane: 'w18:p8V' }] },
        verifierPane: { k: 'none' },
        cells: {
          report: { k: 'none' },
          fix: { k: 'none' },
          review: { k: 'none' },
          pr: { k: 'none' },
          ci: { k: 'none' },
          linear: { k: 'none' },
        },
      },
    },
  ])
  expect(board.working).toEqual([])
})

test('UI Polishes: the THV-481 tab is a Build row with no Kind, and the space has its Project', async () => {
  const board = project(worldOf(mainOf('w4D', 'w18:p8W'), SNAPSHOT_LIVE))
  expect(board.project).toBe('Design System')
  expect(rowsOf(board).map((r) => [r.ticket, r.title, r.kind, r.cells.linear.k])).toEqual([['THV-481', 'UI polish walkthrough', undefined, 'none']])
})

test('this-session row: main on cockpit/thv-1058 with no dispatch shows one row and no Linear column', async () => {
  const cwd = '/Users/andresmartinez/thoven/agent-skills-thv-1058'
  const head = '/Users/andresmartinez/thoven/agent-skills/.git/worktrees/agent-skills-thv-1058/HEAD'
  const w0 = worldOf(mainOf('w18', 'w18:p8W', cwd), SNAPSHOT_LIVE)
  const ask = fakeAsk({ list: { [cwd]: [{ name: '.git', kind: 'file', mtimeMs: 0 }] }, read: { [`${cwd}/.git`]: DOT_GIT_WORKTREE, [head]: HEAD_COCKPIT } })
  const heads = must(await SOURCES.heads.run(w0, ask))
  expect(heads.get(cwd)).toBe(head)
  const branches = must(await SOURCES.branches.run(worldOf(w0.me, SNAPSHOT_LIVE, { sources: { heads: fresh(heads) } }), ask))
  expect(branches.get(cwd)).toBe('cockpit/thv-1058')
  const board = project(worldOf(w0.me, SNAPSHOT_LIVE, { sources: { branches: fresh(branches) } }))
  expect(board.build).toEqual([
    {
      k: 'single',
      row: {
        ticket: 'THV-1058',
        title: 'Cockpit availability for main orchestrator',
        kind: undefined,
        origin: 'this-session',
        panes: { k: 'live', list: [{ status: 'working', tool: 'C', pane: 'w18:p8W' }] },
        verifierPane: { k: 'none' },
        cells: {
          report: { k: 'none' },
          fix: { k: 'none' },
          review: { k: 'none' },
          pr: { k: 'none' },
          ci: { k: 'none' },
          linear: { k: 'none' },
        },
      },
    },
  ])
})

test('an unlabelled tab goes under Other as unlabelled', async () => {
  const board = project(worldOf(mainOf('w18', 'w18:p8W'), SNAPSHOT_LIVE))
  expect(board.build).toEqual([])
  expect(board.other).toEqual([
    { k: 'unlabelled', tab: 'Research', pane: { k: 'live', status: 'idle', tool: 'C', pane: 'w18:p8P' } },
    { k: 'unlabelled', tab: 'Mods', pane: { k: 'live', status: 'idle', tool: 'C', pane: 'w18:p8V' } },
  ])
})

test('a multi-ticket pane gives three Build rows that share the pane', async () => {
  const board = project(worldOf(mainOf('w18', 'w18:p8W'), relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Book Lessons follow-ups (THV-843 847 851)')))
  const p8V = { status: 'idle', tool: 'C', pane: 'w18:p8V' }
  const shared = { title: 'Book Lessons follow-ups', kind: undefined, origin: 'label', panes: { k: 'live', list: [p8V] }, verifierPane: { k: 'none' } }
  const cells = { report: { k: 'none' }, fix: { k: 'none' }, review: { k: 'none' }, pr: { k: 'none' }, ci: { k: 'none' }, linear: { k: 'none' } }
  expect(board.build).toEqual([
    { k: 'single', row: { ticket: 'THV-843', ...shared, cells } },
    { k: 'single', row: { ticket: 'THV-847', ...shared, cells } },
    { k: 'single', row: { ticket: 'THV-851', ...shared, cells } },
  ])
})

test("Live spaces match the space's label in any case: Coppa is COPPA's Project", async () => {
  const board = project(worldOf(mainOf('w56', 'w18:p8W'), SNAPSHOT_LIVE))
  expect(board.space).toEqual({ space: 'w56', label: 'Coppa' })
  expect(board.project).toBe('COPPA and Data Compliance Audit')
  expect(rowsOf(board).map((r) => [r.ticket, r.title, r.cells.linear.k])).toEqual([['THV-1004', "children's media URL expiry", 'none']])
})

test('two Build panes on one ticket give one row whose Pane cell lists both', async () => {
  // p8W loses its own label, so both panes of the THV-1045 tab read the tab's Build label.
  const json = relabelPane(SNAPSHOT_W18_BUILD, 'w18:p8W', undefined)
  const board = project(worldOf(mainOf('w18', 'w18:p8P'), json))
  expect(rowsOf(board).map((r) => [r.ticket, r.panes])).toEqual([
    ['THV-1045', { k: 'live', list: [{ status: 'idle', tool: 'C', pane: 'w18:p8V' }, { status: 'working', tool: 'C', pane: 'w18:p8W' }] }],
  ])
  expect(cellText(must(rowsOf(board)[0]), 'pane')).toBe('○ C ◐ C')
})

test('a Review pane naming two tickets verifies the one with a Build row and gives the other its own row', async () => {
  const json = relabelPane(SNAPSHOT_W18_BUILD, 'w18:p8W', 'Review · Consent evidence hardening (THV-1045 1004)')
  const board = project(worldOf(mainOf('w18', 'w18:p8P'), json))
  const p8V = { status: 'idle', tool: 'C', pane: 'w18:p8V' }
  const p8W = { status: 'working', tool: 'C', pane: 'w18:p8W' }
  expect(rowsOf(board).map((r) => [r.ticket, r.kind, r.title, r.panes, r.verifierPane])).toEqual([
    ['THV-1045', 'Build', 'Consent evidence hardening', { k: 'live', list: [p8V] }, { k: 'live', ...p8W }],
    ['THV-1004', 'Review', 'Consent evidence hardening', { k: 'live', list: [p8W] }, { k: 'live', ...p8W }],
  ])
  expect(board.other).toEqual([])
})

test("a pane known only by its folder's branch is a Build row for the branch's ticket", async () => {
  // pH loses its own label and its tab goes back to herdr's default `1`. Its title names no ticket.
  const json = relabelTab(relabelPane(SNAPSHOT_LIVE, 'w4D:pH', undefined), 'w4D:tB', '1')
  const cwd = '/Users/andresmartinez/thoven/frontend-thv-481'
  const w0 = worldOf(mainOf('w4D', 'w18:p8W'), json)
  const worktreeHead = '/Users/andresmartinez/thoven/frontend/.git/worktrees/frontend-thv-481/HEAD'
  const ask = fakeAsk({
    list: { [MAIN_CWD]: [{ name: '.git', kind: 'dir', mtimeMs: 0 }], [cwd]: [{ name: '.git', kind: 'file', mtimeMs: 0 }] },
    read: { [`${cwd}/.git`]: DOT_GIT_THV_481, [`${MAIN_CWD}/.git/HEAD`]: 'ref: refs/heads/main\n', [worktreeHead]: HEAD_THV_481 },
  })
  const heads = must(await SOURCES.heads.run(w0, ask))
  expect(ask.asked).toEqual([`list ${MAIN_CWD}`, `list ${cwd}`, `read ${cwd}/.git`])
  const w1 = worldOf(w0.me, json, { sources: { heads: fresh(heads) } })
  const branches = must(await SOURCES.branches.run(w1, ask))
  expect(ask.asked.slice(3)).toEqual([`read ${MAIN_CWD}/.git/HEAD`, `read ${worktreeHead}`])
  const board = project(worldOf(w0.me, json, { sources: { heads: fresh(heads), branches: fresh(branches) } }))
  expect(rowsOf(board).map((r) => [r.ticket, r.title, r.kind, r.origin, r.panes])).toEqual([
    ['THV-481', 'ui/thv-481', undefined, 'branch', { k: 'live', list: [{ status: 'idle', tool: 'C', pane: 'w4D:pH' }] }],
  ])
  expect(board.other).toEqual([])
})

test('the heads cache keeps only answers that succeeded, and only for folders still tracked', async () => {
  const json = relabelTab(relabelPane(SNAPSHOT_LIVE, 'w4D:pH', undefined), 'w4D:tB', '1')
  const cwd = '/Users/andresmartinez/thoven/frontend-thv-481'
  const w0 = worldOf(mainOf('w4D', 'w18:p8W'), json, { sources: { heads: fresh(new Map([['/Users/andresmartinez/gone', '/Users/andresmartinez/gone/.git/HEAD']])) } })
  const worktree = [{ name: '.git', kind: 'file', mtimeMs: 0 }]
  const listings = { [MAIN_CWD]: [{ name: '.git', kind: 'dir', mtimeMs: 0 }], [cwd]: worktree }
  // The worktree's `.git` lists as a file but will not read, and MAIN_CWD will not list.
  const failing = fakeAsk({ list: { [cwd]: worktree } })
  expect([...must(await SOURCES.heads.run(w0, failing))]).toEqual([])
  expect(failing.asked).toEqual([`list ${MAIN_CWD}`, `list ${cwd}`, `read ${cwd}/.git`])
  const answering = fakeAsk({ list: listings, read: { [`${cwd}/.git`]: DOT_GIT_THV_481 } })
  const heads = must(await SOURCES.heads.run(w0, answering))
  expect([...heads]).toEqual([[MAIN_CWD, `${MAIN_CWD}/.git/HEAD`], [cwd, '/Users/andresmartinez/thoven/frontend/.git/worktrees/frontend-thv-481/HEAD']])
  const cached = fakeAsk({})
  expect([...must(await SOURCES.heads.run(worldOf(w0.me, json, { sources: { heads: fresh(heads) } }), cached))]).toEqual([...heads])
  expect(cached.asked).toEqual([])
})

// ── unit: view.ts glyphs and widths ──────────────────────────────────────────────────────────

test('cellText: an S1 row shows its Pane glyph and tool tag, and a dash in every later column', async () => {
  const row = rowOf(worldOf(mainOf('w18', 'w18:p8W'), SNAPSHOT_W18_BUILD), 'THV-1045')
  expect((['pane', 'report', 'fix', 'review', 'pr', 'ci', 'linear'] as const).map((id) => cellText(row, id))).toEqual(['○ C', '–', '–', '– – – –', '–', '–', '–'])
  expect(cellText({ ...row, panes: { k: 'live', list: [{ status: 'working', tool: 'X', pane: idOf(isPaneId, 'w18:p8V') }] } }, 'pane')).toBe('◐ X')
  expect(cellText({ ...row, panes: { k: 'gone' } }, 'pane')).toBe('gone')
})

test('columnsFor: fixed cells, the Work column takes what is left, never under 10', async () => {
  const linear = project(worldOf(mainOf('w4D', 'w18:p8W'), SNAPSHOT_LIVE))
  const widths = (width: number, board: Board) => {
    const { work, shown } = columnsFor(width, board)
    return [work, ...shown.map((c) => c.width)]
  }
  expect(widths(80, linear)).toEqual([31, 5, 8, 5, 9, 9, 6, 7])
  expect(widths(80, project(worldOf(mainOf('w18', 'w18:p8W'), SNAPSHOT_LIVE)))).toEqual([38, 5, 8, 5, 9, 9, 6])
  expect(widths(30, linear)).toEqual([10, 5, 8, 5, 9, 9, 6, 7])
})

// ── kit: roles, claim and timers ─────────────────────────────────────────────────────────────

test('an inert session (no HERDR_PANE_ID) registers /cockpit and reads nothing', async ($, on) => {
  const s = stage(on, { snapshot: SNAPSHOT_LIVE })
  await start($)
  await s.clock.advance(15_000)
  expect(s.registrations.map((r) => r.name)).toEqual(['cockpit'])
  expect(s.storeCalls).toBe(0)
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

test("wave THV-1094 replayed: main's 19:47 send.sh makes it the space's main, with no /cockpit typed", async ($, on) => {
  const s = stage(on, { pane: 'w5E:p1', sid: MAIN_SID_THV_1094, snapshot: SNAPSHOT_LIVE })
  await start($)
  // Main's first prompt landed at 19:44:09 and its send at 19:47:15; /cockpit came at 19:49.
  await s.clock.advance(186_000)
  expect(s.snapshots()).toBe(0)

  await bash($, SEND_1947_THV_1095_1097)
  const claim = { kind: 'main', space: 'w5E', sid: MAIN_SID_THV_1094, pane: 'w5E:p1', at: 186_000 }
  expect(s.saved.get('cockpit:main:w5E')).toEqual(claim)
  expect([...s.saved.keys()].filter((k) => k.startsWith('cockpit:send:')).sort()).toEqual(['cockpit:send:THV-1095:w5E:p2:builder:0', 'cockpit:send:THV-1097:w5E:p3:builder:0'])
  // A send claims only: the pane opens when /cockpit asks for it.
  expect(s.opened).toEqual([])
  // Its first tick runs at the claim, then the 5 s heartbeat polls herdr.
  await s.clock.advance(15_000)
  expect(s.snapshots()).toBe(4)

  // Main's next send leaves its own claim as it is.
  await bash($, SEND_1947_THV_1095_1097)
  expect(s.saved.get('cockpit:main:w5E')).toEqual(claim)
  expect(s.opened).toEqual([])
})

test('a send.sh never takes main from the session that holds it (ADR3)', async ($, on) => {
  const held = { kind: 'main', space: 'w5E', sid: 'sid-b', pane: 'w5E:p9', at: 1_000 }
  const s = stage(on, { pane: 'w5E:p1', sid: MAIN_SID_THV_1094, snapshot: SNAPSHOT_LIVE, store: { 'cockpit:main:w5E': held } })
  await start($)
  await s.clock.advance(5_000)
  await bash($, SEND_1947_THV_1095_1097)
  expect(s.saved.get('cockpit:main:w5E')).toEqual(held)
  expect(s.saved.has('cockpit:send:THV-1095:w5E:p2:builder:0')).toBe(true)
  await s.clock.advance(15_000)
  expect(s.snapshots()).toBe(0)
  expect(s.opened).toEqual([])
})

test('/cockpit answers once its one snapshot does, before the first tick has run', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-a', snapshot: SNAPSHOT_LIVE })
  s.herdr.mode = 'slow'
  s.gh.mode = 'hang'
  await start($)
  let answer: string | undefined
  void cockpit($).then((r) => {
    answer = r.text
  })
  await s.clock.advance(2_000)
  expect(answer).toBe('Cockpit is main of Research.')
  expect(s.opened).toEqual([{ id: 'cockpit', title: 'Cockpit', focus: true }])
  expect([s.snapshots(), s.timeoutsMs[0]]).toEqual([1, 3_000])
  // The first tick is under way, asleep on gh, and the answer did not wait for it.
  expect([FRONTEND, BACKEND].map((repo) => ranTimes(s, COMMANDS['gh pr list'](repo)))).toEqual([1, 1])
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

test('a session that lost main and claims again polls every source on its first tick back', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-a', snapshot: SNAPSHOT_W18_BUILD })
  await start($)
  const firstTick = async (): Promise<string[]> => {
    const [argvs, fs] = [s.argvs.length, s.fsCalls.length]
    await cockpit($)
    await s.clock.settle()
    return [...s.argvs.slice(argvs).map((a) => a.join(' ')), ...s.fsCalls.slice(fs)].sort()
  }
  const first = await firstTick()
  // The slow sources (Live spaces 5 min, gh 60 s, inbox 10 s) are the ones a kept lastRun would skip.
  expect(first.filter((c) => c.endsWith('/WORKFLOW.md') || c.startsWith('gh pr list') || c.endsWith('/dispatch/out'))).toHaveLength(4)

  s.saved.set('cockpit:main:w18', { kind: 'main', space: 'w18', sid: 'sid-b', pane: 'w18:p8V', at: 1 })
  await s.clock.advance(5_000)
  expect(s.closed).toEqual(['cockpit'])
  expect(await firstTick()).toEqual(first)
})

test('after /clear the same pane is main again under its new session id, and draws at once', async ($, on) => {
  const s = stage(on, {
    pane: 'w18:p8W',
    sid: 'sid-new',
    snapshot: SNAPSHOT_LIVE,
    store: { 'cockpit:main:w18': { kind: 'main', space: 'w18', sid: 'sid-old', pane: 'w18:p8W', at: 0 } },
  })
  await $.classic.SessionStart({ session_id: 'sid-new', cwd: MAIN_CWD, source: 'clear', transcript_path: '' })
  expect(s.saved.get('cockpit:main:w18')).toEqual({ kind: 'main', space: 'w18', sid: 'sid-new', pane: 'w18:p8W', at: 0 })
  await s.clock.settle()
  expect(s.snapshots()).toBe(1)
  await s.clock.advance(5_000)
  expect(s.snapshots()).toBe(2)
})

test('a /cockpit re-registration that throws still leaves the claiming pane main', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_LIVE, store: { 'cockpit:main:w18': { kind: 'main', space: 'w18', sid: 'sid-a', pane: 'w18:p8W', at: 0 } } })
  s.registerDeny = 'command.register: cockpit is already registered'
  await start($)
  expect(s.registrations.map((r) => r.name)).toEqual(['cockpit'])
  await s.clock.advance(5_000)
  expect(s.snapshots()).toBe(2)
})

test('S1 reaches no stub: no [doctor] hint, /cockpit with an argument other than doctor opens the cockpit, and compaction logs nothing', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_LIVE })
  await start($)
  expect(s.registrations).toEqual([{ name: 'cockpit', description: 'Open the Thoven cockpit for this herdr space', immediate: true }])
  expect((await cockpit($, 'now')).text).toBe('Cockpit is main of Research.')
  await $.classic.SessionStart({ session_id: 'sid-a', cwd: MAIN_CWD, source: 'compact', transcript_path: '' })
  await s.clock.settle()
  expect(s.logs.filter((l) => /not implemented|failed/.test(l))).toEqual([])
})

// ── kit: pane labels (ADR4) ──────────────────────────────────────────────────────────────────

test("a label read with herdr pane get wins over the tab's label", async ($, on) => {
  // The snapshot leaves p8W's label out, as it does for most panes; `pane get` carries it.
  const s = stage(on, { pane: 'w18:p8P', snapshot: relabelPane(SNAPSHOT_W18_BUILD, 'w18:p8W', undefined) })
  await start($)
  await cockpit($)
  await s.clock.settle()
  expect(s.paneGets().sort()).toEqual(['w18:p8V', 'w18:p8W'])
  const ui = await $.ui.mount(PANE)
  expect((await ui.find({ key: 'row-THV-1045' }))?.props.label).toBe('Consent evidence hardening')
  expect(await ui.find({ type: 'Text', text: '○ C' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '○ C ◐ C' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'Plan' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Cockpit spec' })).toBeDefined()
})

test('pane labels are cached per pane: an unchanged pane is never re-read, a new or retitled one is read once', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: dropPane(SNAPSHOT_LIVE, 'w18:p8P') })
  await start($)
  await cockpit($)
  await s.clock.settle()
  expect(s.paneGets()).toEqual(['w18:p8V'])

  await s.clock.advance(5_000)
  expect(s.paneGets()).toEqual(['w18:p8V'])

  s.herdr.snapshot = SNAPSHOT_LIVE
  await s.clock.advance(5_000)
  expect(s.paneGets()).toEqual(['w18:p8V', 'w18:p8P'])

  s.herdr.snapshot = SNAPSHOT_W18_BUILD
  await s.clock.advance(5_000)
  expect(s.paneGets()).toEqual(['w18:p8V', 'w18:p8P', 'w18:p8V'])
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

test('herdr exits 1 at /cockpit: the pane still opens and says herdr unavailable', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_LIVE })
  s.herdr.mode = 'fail'
  await start($)
  const answer = await cockpit($)
  expect(answer.text).toBe('Cockpit is main of w18, but herdr is unavailable.')
  expect(s.saved.get('cockpit:main:w18')).toEqual({ kind: 'main', space: 'w18', sid: 'sid-a', pane: 'w18:p8W', at: 0 })
  expect(s.opened).toEqual([{ id: 'cockpit', title: 'Cockpit', focus: true }])
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: 'herdr unavailable' })).toBeDefined()

  await ui.unmount()
  s.herdr.mode = 'ok'
  await s.clock.advance(5_000)
  const back = await $.ui.mount(PANE)
  expect(await back.find({ type: 'Text', text: 'Research' })).toBeDefined()
  expect(await back.find({ type: 'Text', text: 'herdr unavailable' })).toBeUndefined()
})

test('herdr down since a reload: the pane says herdr unavailable', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_LIVE, store: { 'cockpit:main:w18': { kind: 'main', space: 'w18', sid: 'sid-a', pane: 'w18:p8W', at: 0 } } })
  s.herdr.mode = 'fail'
  await start($)
  await s.clock.advance(5_000)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: 'herdr unavailable' })).toBeDefined()
})

test('herdr hangs: its poll never overlaps itself, and the pane says herdr unavailable once it times out', async ($, on) => {
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
  expect(await ui.find({ type: 'Text', text: 'No PRs for this space.' })).toBeDefined()
  expect(await ui.find({ key: 'row-THV-1045' })).toBeUndefined()

  await ui.press({ key: 'tab-work' })
  await ui.press({ key: 'focus-row' })
  await s.clock.settle()
  expect(s.argvs.filter((a) => a[1] === 'agent')).toEqual([[...COMMANDS['herdr agent focus'](idOf(isPaneId, 'w18:p8V')).argv]])
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
  expect(row && kids(row).map((c) => c.props.width)).toEqual([38, 5, 8, 5, 9, 9, 6])
  expect(heading && kids(heading).map((c) => c.props.width)).toEqual([38, 5, 8, 5, 9, 9, 6])
})

test('two sessions in one space: the pane that did not run /cockpit stays a pane and starts no timers', async ($, on) => {
  // The claim exactly as the session in w18:p8W wrote it when it ran /cockpit (see the test above).
  const claim = { kind: 'main', space: 'w18', sid: 'sid-a', pane: 'w18:p8W', at: 15_000 }
  const s = stage(on, { pane: 'w18:p8V', sid: 'sid-b', snapshot: SNAPSHOT_LIVE, store: { 'cockpit:main:w18': claim } })
  await start($)
  await s.clock.advance(15_000)
  expect(s.snapshots()).toBe(0)
  expect(s.saved.get('cockpit:main:w18')).toEqual(claim)
  expect(s.opened).toEqual([])
})
