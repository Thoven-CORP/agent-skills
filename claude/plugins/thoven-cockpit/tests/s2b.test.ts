// S2b: PRs, CI and the PRs tab. The gh and git grammar on real text (no kit), the join that
// attaches PRs to rows, then main under kit stubs: gh polled per repo, a failed poll going stale on
// its own, a merged PR recorded once, and every argv still read-only.
//
// Derived inputs, each built where it is used: tabs and pane labels renamed with `relabelTab` and
// `relabelPane`; a checkout's branch set to `ui/thv-481` (HEAD_THV_481) or `sentry-error` where a
// test needs two panes on one branch; p8P moved into the backend checkout; and BE #145 retitled
// with the spec's `(THV-851, THV-847, THV-843)`, because no PR on file has a multi-ticket title group.

import { expect } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { COMMANDS } from '../hooks/commands.ts'
import { BACKEND, FRONTEND, configPathOf, parseOrigin, parsePrList } from '../hooks/github.ts'
import { isLinearEventId, isPaneId, type Board, type Fact, type Pr, type Sources } from '../hooks/model.ts'
import { SOURCES, headPathOf, parseHead, STAGES } from '../hooks/sources.ts'
import { cellText } from '../hooks/view.ts'
import { CONFIG_AGENT_SKILLS, CONFIG_BACKEND, CONFIG_FRONTEND, DOT_GIT_THV_481, DOT_GIT_WORKTREE, HEAD_THV_481 } from './fixtures/git.ts'
import { GH_AGENT_SKILLS, GH_BACKEND, GH_FRONTEND } from './fixtures/github.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { MAIN_CWD, PANE, cockpit, fakeAsk, fresh, idOf, mainOf, must, ranTimes, relabelPane, relabelTab, rowOf, stage, start, tk, worldOf, test, INBOX_DIR } from './stage.ts'

const AGENT_SKILLS = 'Thoven-CORP/agent-skills'
const THOVEN = '/Users/andresmartinez/thoven'
/** w4D:pH's real folder, a frontend worktree on ui/thv-481. */
const FE_481_CWD = '/Users/andresmartinez/thoven/frontend-thv-481'
const FE_481_HEAD = headPathOf(FE_481_CWD, DOT_GIT_THV_481)
const BRANCH_481 = parseHead(HEAD_THV_481) ?? ''

function prsOf(repo: string, json: string): Pr[] {
  const prs = parsePrList(repo, json)
  if (!prs) throw new Error(`${repo} fixture did not parse`)
  return prs
}

function prOf(repo: string, json: string, n: number): Pr {
  const pr = prsOf(repo, json).find((p) => p.number === n)
  if (!pr) throw new Error(`no ${repo} #${n}`)
  return pr
}

/** All three repos, in the order the cockpit asks them. */
const ALL_PRS = (): Pr[] => [...prsOf(FRONTEND, GH_FRONTEND), ...prsOf(BACKEND, GH_BACKEND), ...prsOf(AGENT_SKILLS, GH_AGENT_SKILLS)]

/** The git sources for folders on known branches: HEAD path, branch, and the origin of the repo's config. */
type Place = { cwd: string; head: string; branch: string; config: string | undefined }
function gitOf(places: Place[]): Partial<Sources> {
  return {
    heads: fresh(new Map(places.map((p) => [p.cwd, p.head]))),
    branches: fresh(new Map(places.map((p) => [p.cwd, p.branch]))),
    origins: fresh(new Map(places.map((p) => [configPathOf(p.head), p.config === undefined ? undefined : parseOrigin(p.config)]))),
  }
}

const prItems = (board: Board) => board.prs.flatMap((g) => g.items)

/** Derived: one pane's herdr status changed, as the next snapshot shows. */
function withStatus(snapshot: string, pane: string, status: string): string {
  const root = JSON.parse(snapshot)
  for (const p of root.result.snapshot.panes) if (p.pane_id === pane) p.agent_status = status
  return JSON.stringify(root)
}

/** Derived: one pane's folder changed, as when it `cd`s into another checkout. */
function withCwd(snapshot: string, pane: string, cwd: string): string {
  const root = JSON.parse(snapshot)
  for (const p of root.result.snapshot.panes) if (p.pane_id === pane) p.foreground_cwd = cwd
  return JSON.stringify(root)
}

function hhmm(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ── unit: the gh and git grammar ────────────────────────────────────────────────────────────

test('frontend #136 parses to its branch, THV-481, and 13 of 13 checks done with none failed', async () => {
  expect(prOf(FRONTEND, GH_FRONTEND, 136)).toEqual({
    repo: 'Thoven-CORP/frontend-remote',
    number: 136,
    title: 'Getting Started stepper: ThovenButton CTA, no hover tile pop',
    branch: 'ui/thv-481',
    state: 'OPEN',
    tickets: ['THV-481'],
    checks: { total: 13, done: 13, failed: [], running: [] },
    changedLines: 43,
    topDirs: 2,
    url: 'https://github.com/Thoven-CORP/frontend-remote/pull/136',
  })
  // Vercel's StatusContext entries count with the CheckRuns; #141's four red runs are its failures.
  expect(prOf(FRONTEND, GH_FRONTEND, 141).checks).toEqual({ total: 13, done: 13, failed: ['vitest shard 1/4', 'vitest shard 2/4', 'vitest shard 3/4', 'CI'], running: [] })
  expect([prOf(FRONTEND, GH_FRONTEND, 138).changedLines, prOf(FRONTEND, GH_FRONTEND, 140).changedLines]).toEqual([18094, 1789])
  expect(prsOf(BACKEND, GH_BACKEND).map((p) => p.number)).toEqual([149, 148, 147, 146, 145, 144, 143, 142, 141, 140])
  expect(parsePrList(FRONTEND, '{"message":"Bad credentials"}')).toBeUndefined()
})

test("frontend #139's title names THV-1003, THV-1041 and THV-1038 in prose; only its trailing THV-908 is a ticket", async () => {
  const pr = prOf(FRONTEND, GH_FRONTEND, 139)
  expect([pr.title, pr.branch, pr.tickets, pr.state]).toEqual(['Docs catch up with THV-1003, THV-1041 and THV-1038', 'docs/thv-908', ['THV-908'], 'MERGED'])
})

test("a checkout's origin comes from its repo's .git/config, a worktree's from the common one", async () => {
  expect(parseOrigin(CONFIG_FRONTEND)).toBe('Thoven-CORP/frontend-remote')
  // backend's second remote, `archive`, is an https URL and never the origin.
  expect(parseOrigin(CONFIG_BACKEND)).toBe('Thoven-CORP/backend-remote')
  expect(parseOrigin(CONFIG_AGENT_SKILLS)).toBe('Thoven-CORP/agent-skills')
  expect(parseOrigin('[core]\n\tbare = false\n')).toBeUndefined()
  expect(configPathOf(FE_481_HEAD)).toBe('/Users/andresmartinez/thoven/frontend/.git/config')
  expect(configPathOf(`${MAIN_CWD}/.git/HEAD`)).toBe('/Users/andresmartinez/thoven/frontend/.git/config')
})

test('repos are each space folder’s origin, read once, plus frontend and backend; one gh pr list per repo', async () => {
  const asCwd = '/Users/andresmartinez/thoven/agent-skills-thv-1058'
  const heads = new Map([
    [asCwd, headPathOf(asCwd, DOT_GIT_WORKTREE)],
    [THOVEN, `${THOVEN}/.git/HEAD`],
    [MAIN_CWD, `${MAIN_CWD}/.git/HEAD`],
  ])
  const w1 = worldOf(mainOf('w18', 'w18:p8W', asCwd), SNAPSHOT_LIVE, { sources: { heads: fresh(heads) } })
  const ask1 = fakeAsk({
    read: { '/Users/andresmartinez/thoven/agent-skills/.git/config': CONFIG_AGENT_SKILLS, '/Users/andresmartinez/thoven/frontend/.git/config': CONFIG_FRONTEND },
  })
  const read = must(await SOURCES.origins.run(w1, ask1))
  expect(ask1.asked).toEqual([
    'read /Users/andresmartinez/thoven/agent-skills/.git/config',
    'read /Users/andresmartinez/thoven/.git/config',
    'read /Users/andresmartinez/thoven/frontend/.git/config',
  ])
  expect([...read]).toEqual([
    ['/Users/andresmartinez/thoven/agent-skills/.git/config', AGENT_SKILLS],
    ['/Users/andresmartinez/thoven/.git/config', undefined],
    ['/Users/andresmartinez/thoven/frontend/.git/config', FRONTEND],
  ])
  const w2 = worldOf(mainOf('w18', 'w18:p8W', asCwd), SNAPSHOT_LIVE, { sources: { heads: fresh(heads), origins: fresh(read) } })
  const ask2 = fakeAsk({})
  expect([...must(await SOURCES.origins.run(w2, ask2))]).toEqual([...read])
  expect(ask2.asked).toEqual([])
  const argvOf = (repo: string) => COMMANDS['gh pr list'](repo).argv.join(' ')
  const ask3 = fakeAsk({ proc: { [argvOf(FRONTEND)]: GH_FRONTEND, [argvOf(BACKEND)]: GH_BACKEND, [argvOf(AGENT_SKILLS)]: GH_AGENT_SKILLS } })
  const view = await SOURCES.github.run(w2, ask3)
  expect(ask3.asked).toEqual([FRONTEND, BACKEND, AGENT_SKILLS].map(argvOf))
  expect(view?.prs.map((p) => `${p.repo}#${p.number}`).slice(9, 12)).toEqual(['Thoven-CORP/frontend-remote#133', 'Thoven-CORP/backend-remote#149', 'Thoven-CORP/backend-remote#148'])
  await expect(SOURCES.github.run(w2, fakeAsk({ proc: { [argvOf(FRONTEND)]: GH_FRONTEND, [argvOf(AGENT_SKILLS)]: GH_AGENT_SKILLS } }))).rejects.toThrow(`ENOENT: ${argvOf(BACKEND)}`)
})

// ── unit: PRs on the board ──────────────────────────────────────────────────────────────────

test('the pane on ui/thv-481 gives PR #136 and CI ✓ from its statusCheckRollup', async () => {
  // w4D:pH runs in frontend-thv-481, whose HEAD reads ui/thv-481.
  const world = worldOf(mainOf('w4D', 'w18:p8W'), SNAPSHOT_LIVE, {
    sources: {
      ...gitOf([{ cwd: FE_481_CWD, head: FE_481_HEAD, branch: BRANCH_481, config: CONFIG_FRONTEND }]),
      github: fresh({ prs: ALL_PRS() }),
    },
  })
  const row = rowOf(world, 'THV-481')
  expect(row.cells.pr).toEqual({ k: 'own', pr: prOf(FRONTEND, GH_FRONTEND, 136) })
  expect(row.cells.ci).toEqual({ k: 'pass' })
  expect([cellText(row, 'pr'), cellText(row, 'ci')]).toEqual(['#136', '✓'])
})

test('a THV-1045 Build tab with no branch read takes its open PR #141 by ticket, and CI shows its 4 failures', async () => {
  const world = worldOf(mainOf('w18', 'w18:p8W'), relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Consent evidence hardening (THV-1045)'), {
    sources: {
      github: fresh({ prs: ALL_PRS() }),
    },
  })
  const row = rowOf(world, 'THV-1045')
  expect(row.cells.pr).toEqual({ k: 'own', pr: prOf(FRONTEND, GH_FRONTEND, 141) })
  expect(row.cells.ci).toEqual({ k: 'fail', failed: 4 })
  expect([cellText(row, 'pr'), cellText(row, 'ci')]).toEqual(['#141', '✗ 4'])
})

test('two tickets whose panes share ui/thv-481 both show in #136, and #136 is listed once with both', async () => {
  // Derived: p8V and p8W both run in ~/thoven/frontend, here on ui/thv-481, each labelled for its own ticket.
  const json = relabelPane(relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Getting Started stepper (THV-481)'), 'w18:p8W', 'Build · Frontend guardrails (THV-1069)')
  const world = worldOf(mainOf('w18', 'w18:p8P', THOVEN), json, {
    sources: {
      ...gitOf([{ cwd: MAIN_CWD, head: headPathOf(MAIN_CWD, undefined), branch: BRANCH_481, config: CONFIG_FRONTEND }]),
      github: fresh({ prs: ALL_PRS() }),
    },
  })
  const pr136 = prOf(FRONTEND, GH_FRONTEND, 136)
  for (const t of ['THV-481', 'THV-1069']) {
    const row = rowOf(world, t)
    expect(row.cells.pr).toEqual({ k: 'shared', pr: pr136 })
    expect(cellText(row, 'pr')).toBe('in #136')
  }
  expect(project(world).prs).toEqual([{ repo: FRONTEND, items: [{ pr: pr136, tickets: ['THV-481', 'THV-1069'] }] }])
})

test('a PR whose title group lists three tickets attaches to each row and is listed once', async () => {
  const pr = prOf(BACKEND, GH_BACKEND, 145)
  const retitled = JSON.stringify(
    (JSON.parse(GH_BACKEND) as Array<{ number: number; title: string }>).map((p) => (p.number === 145 ? { ...p, title: 'Book Lessons follow-ups (THV-851, THV-847, THV-843)' } : p)),
  )
  const world = worldOf(mainOf('w18', 'w18:p8W'), relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Book Lessons follow-ups (THV-843 847 851)'), {
    sources: {
      github: fresh({ prs: prsOf(BACKEND, retitled) }),
    },
  })
  const attached = { ...pr, title: 'Book Lessons follow-ups', tickets: ['THV-851', 'THV-847', 'THV-843'] }
  for (const t of ['THV-843', 'THV-847', 'THV-851']) {
    const row = rowOf(world, t)
    expect(row.cells.pr).toEqual({ k: 'own', pr: attached })
    expect(cellText(row, 'pr')).toBe('#145')
  }
  expect(project(world).prs).toEqual([{ repo: BACKEND, items: [{ pr: attached, tickets: ['THV-843', 'THV-847', 'THV-851'] }] }])
})

test('frontend #139 attaches to THV-908 only, never to THV-1003, THV-1041 or THV-1038 named in its prose', async () => {
  const json = relabelTab(relabelTab(SNAPSHOT_LIVE, 'w18:t30', 'Build · Docs catch up (THV-908)'), 'w18:t45', 'Build · Consent and purge (THV-1003 1041 1038)')
  const world = worldOf(mainOf('w18', 'w18:p8W'), json, { sources: { github: fresh({ prs: ALL_PRS() }) } })
  const board = project(world)
  const pick = (t: string) => {
    const pr = rowOf(world, t).cells.pr
    return pr.k === 'own' || pr.k === 'shared' ? `${pr.pr.repo}#${pr.pr.number}` : pr.k
  }
  expect(['THV-908', 'THV-1003', 'THV-1041', 'THV-1038'].map(pick)).toEqual([
    'Thoven-CORP/frontend-remote#139',
    'Thoven-CORP/frontend-remote#137',
    'Thoven-CORP/backend-remote#143',
    'Thoven-CORP/frontend-remote#138',
  ])
  expect(prItems(board).filter((i) => i.pr.title.startsWith('Docs catch up with')).map((i) => [i.pr.repo, i.pr.number, i.tickets])).toEqual([
    [FRONTEND, 139, ['THV-908']],
    [BACKEND, 146, ['THV-908']],
  ])
})

test('the this-session row on ui/thv-481 shows PR #136 and CI ✓, and no Linear column', async () => {
  const world = worldOf(mainOf('w18', 'w18:p8W', FE_481_CWD), SNAPSHOT_LIVE, {
    sources: {
      ...gitOf([{ cwd: FE_481_CWD, head: FE_481_HEAD, branch: BRANCH_481, config: CONFIG_FRONTEND }]),
      github: fresh({ prs: ALL_PRS() }),
    },
  })
  const row = rowOf(world, 'THV-481')
  expect([row.origin, row.cells.pr, row.cells.ci, row.cells.linear]).toEqual(['this-session', { k: 'own', pr: prOf(FRONTEND, GH_FRONTEND, 136) }, { k: 'pass' }, { k: 'none' }])
  expect([cellText(row, 'pr'), cellText(row, 'ci'), cellText(row, 'linear')]).toEqual(['#136', '✓', '–'])
})

test('a PR with no ticket is listed only while a space pane has its branch checked out', async () => {
  const backendCwd = `${THOVEN}/backend`
  const away = worldOf(mainOf('w18', 'w18:p8W'), SNAPSHOT_LIVE, { sources: { github: fresh({ prs: ALL_PRS() }) } })
  expect(project(away).prs).toEqual([])
  // Derived: p8P moves into the backend checkout, on the branch BE #145 came from.
  const here = worldOf(mainOf('w18', 'w18:p8W'), withCwd(SNAPSHOT_LIVE, 'w18:p8P', backendCwd), {
    sources: {
      ...gitOf([{ cwd: backendCwd, head: headPathOf(backendCwd, undefined), branch: 'sentry-error', config: CONFIG_BACKEND }]),
      github: fresh({ prs: ALL_PRS() }),
    },
  })
  // Dependabot's #140 names no ticket and no pane is on its branch, so it stays out.
  expect(project(here).prs).toEqual([{ repo: BACKEND, items: [{ pr: prOf(BACKEND, GH_BACKEND, 145), tickets: [] }] }])
})

test('a merged PR on a row is a new merged-<repo>-<n> event until its happened fact exists', async () => {
  const json = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Design system and specs move out of thoven2.0 (THV-1038)')
  const sources = { github: fresh({ prs: [...prsOf(FRONTEND, GH_FRONTEND), ...prsOf(BACKEND, GH_BACKEND)] }) }
  const merged = (facts: Fact[]) => project(worldOf(mainOf('w18', 'w18:p8W'), json, { facts, sources })).newEvents.filter((e) => e.event.k === 'merged')
  expect(merged([])).toEqual([
    { ticket: 'THV-1038', event: { k: 'merged', number: 138 }, id: `merged-${FRONTEND}-138` },
    { ticket: 'THV-1038', event: { k: 'merged', number: 144 }, id: `merged-${BACKEND}-144` },
  ])
  const seen: Fact = { kind: 'happened', ticket: tk('THV-1038'), event: idOf(isLinearEventId, `merged-${FRONTEND}-138`), at: 0 }
  expect(merged([seen]).map((e) => e.id)).toEqual([`merged-${BACKEND}-144`])
})

// ── kit: main polls gh ───────────────────────────────────────────────────────────────────────

/** p8V's Mods tab labelled for THV-481; with the frontend checkout on ui/thv-481, its PR is #136. */
const SNAPSHOT_W18_481 = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Getting Started stepper (THV-481)')

test('a failed gh poll keeps the last PRs, says gh stale since hh:mm, and the Pane column keeps updating', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_W18_481 })
  // Derived: the frontend checkout both p8V and main run in is on ui/thv-481.
  s.files.set(`${MAIN_CWD}/.git/HEAD`, HEAD_THV_481)
  s.files.set(`${MAIN_CWD}/.git/config`, CONFIG_FRONTEND)
  s.gh.byRepo = { [FRONTEND]: GH_FRONTEND, [BACKEND]: GH_BACKEND }
  await start($)
  await cockpit($)
  const ui = await $.ui.mount(PANE)
  expect((await ui.find({ type: 'Text', text: '#136' }))?.props.dimColor).toBe(false)
  expect(await ui.find({ type: 'Text', text: '○ C' })).toBeDefined()

  s.gh.mode = 'fail'
  s.herdr.snapshot = withStatus(SNAPSHOT_W18_481, 'w18:p8V', 'working')
  await s.clock.advance(60_000)
  expect(await ui.find({ type: 'Text', text: `gh stale since ${hhmm(60_000)}` })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: '#136' }))?.props.dimColor).toBe(true)
  expect(await ui.find({ type: 'Text', text: '◐ C' })).toBeDefined()
  await ui.press({ key: 'tab-prs' })
  expect(await ui.find({ type: 'Button', key: `pr-${FRONTEND}#136` })).toBeDefined()
})

test('two sources of one stage both hang and neither waits on the other: herdr and the inbox are both asked on the first tick', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_LIVE, store: { 'cockpit:main:w18': { kind: 'main', space: 'w18', sid: 'sid-a', pane: 'w18:p8W', at: 0 } } })
  s.herdr.mode = 'hang'
  s.inboxHangs = true
  s.inbox.set('THV-1041.md', { text: 'DONE THV-1041', mtimeMs: 0 })
  await start($)
  await s.clock.advance(1_000)
  expect(['herdr', 'inbox'].every((id) => STAGES[0]?.some((s0) => s0 === id))).toBe(true)
  expect([s.snapshots(), s.fsCalls.filter((c) => c === `list ${INBOX_DIR}`).length]).toEqual([1, 1])
})

test('a hanging gh holds up no other source: the next tick draws the Pane column herdr just gave', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT_W18_481 })
  s.gh.mode = 'hang'
  await start($)
  await cockpit($)
  s.herdr.snapshot = withStatus(SNAPSHOT_W18_481, 'w18:p8V', 'working')
  await s.clock.advance(5_000)
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: '◐ C' })).toBeDefined()
  expect([FRONTEND, BACKEND].map((repo) => ranTimes(s, COMMANDS['gh pr list'](repo)))).toEqual([1, 1])
})

test('a merged PR writes happened merged-<repo>-<n> once, however many gh polls see it', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Design system and specs move out of thoven2.0 (THV-1038)') })
  s.gh.byRepo = { [FRONTEND]: GH_FRONTEND, [BACKEND]: GH_BACKEND }
  await start($)
  await cockpit($)
  await s.clock.advance(130_000)
  expect(ranTimes(s, COMMANDS['gh pr list'](FRONTEND))).toBe(3)
  expect(s.saved.get(`cockpit:happened:THV-1038:merged-${FRONTEND}-138`)).toEqual({ kind: 'happened', ticket: 'THV-1038', event: `merged-${FRONTEND}-138`, at: 0 })
  expect(s.saved.get(`cockpit:happened:THV-1038:merged-${BACKEND}-144`)).toEqual({ kind: 'happened', ticket: 'THV-1038', event: `merged-${BACKEND}-144`, at: 0 })
  expect(s.setKeys.filter((k) => k.startsWith('cockpit:happened:THV-1038:merged-'))).toEqual([`cockpit:happened:THV-1038:merged-${FRONTEND}-138`, `cockpit:happened:THV-1038:merged-${BACKEND}-144`])
})

test('the PRs tab groups by repo with state and CI, offers m and r only for an open PR; c lists the failing checks; no gh argv merges', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Consent evidence hardening (THV-1045)') })
  s.gh.byRepo = { [FRONTEND]: GH_FRONTEND, [BACKEND]: GH_BACKEND }
  await start($)
  await cockpit($)
  const ui = await $.ui.mount(PANE)
  await ui.press({ key: 'tab-prs' })
  for (const text of ['FE', 'BE', 'held', 'merged', '✗ 4', '✓']) expect(await ui.find({ type: 'Text', text })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'o open' })).toBeUndefined()
  expect((await ui.findAll({ type: 'Button' })).map((b) => b.key)).toEqual(['tab-work', 'tab-all', `pr-${FRONTEND}#141`, `pr-${BACKEND}#148`, 'checks', 'fill-merge', 'fill-review'])
  expect(await ui.find({ type: 'Text', text: 'vitest shard 1/4' })).toBeUndefined()
  await ui.press({ key: 'checks' })
  for (const text of ['vitest shard 1/4', 'vitest shard 2/4', 'vitest shard 3/4', 'CI']) expect(await ui.find({ type: 'Text', text })).toBeDefined()
  for (const key of [`pr-${FRONTEND}#141`, `pr-${BACKEND}#148`, 'checks', 'tab-work', 'row-THV-1045', 'focus-row']) await ui.press({ key })
  await s.clock.advance(70_000)

  const gh = s.argvs.filter((a) => a[0] === 'gh')
  expect(gh[0]).toEqual([...COMMANDS['gh pr list'](FRONTEND).argv])
  expect(gh.length).toBe(ranTimes(s, COMMANDS['gh pr list'](FRONTEND)) + ranTimes(s, COMMANDS['gh pr list'](BACKEND)))
  expect(gh.flat().some((a) => /^merge$/i.test(a) || /^--?(merge|squash|rebase|auto|admin)$/i.test(a))).toBe(false)
  expect(s.logs.filter((l) => /not implemented|failed/.test(l))).toEqual([])
})

test('m and r put a draft in the prompt box for the focused PR and send nothing', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Consent evidence hardening (THV-1045)') })
  s.gh.byRepo = { [FRONTEND]: GH_FRONTEND, [BACKEND]: GH_BACKEND }
  const fills: string[] = []
  on('prompt.fill', (_$: unknown, e: { text: string }) => (fills.push(e.text), { isFilled: true }))
  await start($)
  await cockpit($)
  const ui = await $.ui.mount(PANE)
  await ui.press({ key: 'tab-prs' })
  await ui.press({ key: 'fill-merge' })
  expect(fills).toEqual([])
  await s.clock.advance(0)
  await ui.press({ key: 'fill-review' })
  await s.clock.advance(0)
  expect(fills).toEqual([`merge it ${FRONTEND}#141`, '/code-review https://github.com/Thoven-CORP/frontend-remote/pull/141'])
  expect(s.logs.filter((l) => /not implemented|failed/.test(l))).toEqual([])
  expect(s.argvs.flat().some((a) => /^merge$/i.test(a))).toBe(false)

})

test('the All tab lists every space with its agent panes, this space first, and pressing one focuses it', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Consent evidence hardening (THV-1045)') })
  await start($)
  await cockpit($)
  const ui = await $.ui.mount(PANE)
  await ui.press({ key: 'tab-all' })
  for (const text of ['Research (this space)', 'UI Polishes', 'Coppa', 'thoven']) expect(await ui.find({ type: 'Text', text })).toBeDefined()
  expect((await ui.findAll({ type: 'Button' })).map((b) => b.key)).toEqual(['tab-work', 'tab-prs', 'all-w18:p8P', 'all-w18:p8V', 'all-w4D:pH', 'all-w54:p1', 'all-w56:p1', 'all-w57:p1'])
  expect((await ui.find({ type: 'Button', key: 'all-w56:p1' }))?.props.label).toBe("children's media URL expiry")
  expect(await ui.find({ type: 'Button', key: 'all-w18:p8W' })).toBeUndefined()
  await ui.press({ key: 'all-w56:p1' })
  await s.clock.advance(0)
  expect(s.argvs).toContainEqual([...COMMANDS['herdr agent focus'](idOf(isPaneId, 'w56:p1')).argv])
})
