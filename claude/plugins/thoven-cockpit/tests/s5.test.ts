// S5: background behaviour under kit stubs, through the real hooks. The status-line warning in a
// builder pane, the watcher warning in main, the label push to herdr, and the compaction
// checkpoint written on session.compact and handed back on classic.SessionStart{compact}.
//
// Derived inputs, each said where it is built: tabs renamed with `relabelTab`; p8V set working,
// because the live snapshot holds no working pane in w18 other than main's; main's send.sh call
// for THV-978, which is SEND_4's form with THV-978's pane and file, because no send of that brief
// is on file; and the watch.sh background task, built from WATCH_BASH_INPUT in the shape
// STOP_TASKS_SLEEP shows.

import { expect } from 'claude-code/testing'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { PASTED_CONCERNS_THV_1041, VERIFY_BRIEF_THV_1016 } from './fixtures/reports.ts'
import { ANSWER_DONE_THV_978, ANSWER_NO_STATUS_THV_1082, BRIEF_FILE_THV_978, STOP_TASKS_SLEEP, WATCH_BASH_INPUT } from './fixtures/turns.ts'
import { MAIN_CWD, TMPDIR, bash, cockpit, relabelTab, stage, start, submit, turnEnd, test } from './stage.ts'

const TITLE_978 = "The teacher's Daily join starts the Session record"
const SNAPSHOT_978 = relabelTab(SNAPSHOT_LIVE, 'w18:t45', `Build · ${TITLE_978} (THV-978)`)
const SNAPSHOT_1041 = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Learner erasure purge (THV-1041)')
const SEND_978 = '~/.claude/skills/dispatch-work/scripts/send.sh w18:p8V $TMPDIR/dispatch/THV-978.md 2>&1 | tail -1'
const WATCH_TASK = { id: 'bwatch01', type: 'shell', status: 'running', description: WATCH_BASH_INPUT.description, command: WATCH_BASH_INPUT.command }
/** The spike's Stop answer, the turn the background sleep ran under. */
const MAIN_ANSWER = "I'll wait for that background sleep to finish before replying."

/** Derived: one pane's herdr status changed, as the next snapshot shows. */
function withStatus(snapshot: string, pane: string, status: string): string {
  const root = JSON.parse(snapshot)
  for (const p of root.result.snapshot.panes) if (p.pane_id === pane) p.agent_status = status
  return JSON.stringify(root)
}

const stop = ($: any, background_tasks: unknown[]) =>
  $.classic.Stop({ hook_event_name: 'Stop', session_id: 'sid-a', transcript_path: '', cwd: MAIN_CWD, stop_hook_active: false, last_assistant_message: MAIN_ANSWER, background_tasks, session_crons: [] })
const sessionStart = ($: any, source: string): Promise<{ additionalContext?: string[] }> =>
  $.classic.SessionStart({ hook_event_name: 'SessionStart', session_id: 'sid-a', transcript_path: '', cwd: MAIN_CWD, source })
const compact = ($: any) => $.session.compact({ trigger: 'manual', messages: [{ role: 'assistant', text: MAIN_ANSWER, toolUses: [] }] })
const pushes = (argvs: string[][]) => argvs.filter((a) => a[2] === 'report-metadata')

// ── The status-line warning (ADR8) ──────────────────────────────────────────────────────────

test('a builder pane whose turn ends with no status line gets a {text} warning under its answer, never a block', async ($, on) => {
  stage(on, { pane: 'w18:p8V', sid: 'sid-b', snapshot: SNAPSHOT_LIVE })
  await start($)
  await submit($, BRIEF_FILE_THV_978)
  const r = await turnEnd($, ANSWER_NO_STATUS_THV_1082)
  expect(r.block).toBeUndefined()
  expect(r.text).not.toBe(ANSWER_NO_STATUS_THV_1082)
  expect(r.text).toContain('no status line')
  expect(r.text).toContain('THV-978')
})

test('a builder answer that ends with its status line gets no warning, and its session writes status:THV-978', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: 'sid-b', snapshot: SNAPSHOT_LIVE })
  await start($)
  await submit($, BRIEF_FILE_THV_978)
  expect(await turnEnd($, ANSWER_DONE_THV_978)).toEqual({ text: ANSWER_DONE_THV_978 })
  expect(s.saved.get('cockpit:status:THV-978:sid-b')).toMatchObject({ kind: 'status', ticket: 'THV-978', sid: 'sid-b', status: 'DONE' })
})

test('a verifier pane and an interrupted builder turn get no warning', async ($, on) => {
  stage(on, { pane: 'w18:p8V', sid: 'sid-b', snapshot: SNAPSHOT_LIVE })
  await start($)
  await submit($, VERIFY_BRIEF_THV_1016)
  expect(await turnEnd($, ANSWER_NO_STATUS_THV_1082)).toEqual({ text: ANSWER_NO_STATUS_THV_1082 })
  await submit($, BRIEF_FILE_THV_978)
  expect(await turnEnd($, ANSWER_NO_STATUS_THV_1082, 'aborted')).toEqual({ text: ANSWER_NO_STATUS_THV_1082 })
  expect((await turnEnd($, ANSWER_NO_STATUS_THV_1082)).text).toContain('THV-978')
})

test('an inert session reads nothing at the end of a turn and warns of nothing', async ($, on) => {
  const s = stage(on, { snapshot: SNAPSHOT_LIVE })
  await start($)
  await submit($, BRIEF_FILE_THV_978)
  expect(await turnEnd($, ANSWER_NO_STATUS_THV_1082)).toEqual({ text: ANSWER_NO_STATUS_THV_1082 })
  expect(s.storeCalls).toBe(0)
})

// ── The watcher warning ─────────────────────────────────────────────────────────────────────

test('main ending a turn with a pane working and no watch.sh gets a {text} warning; armed, it gets none', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-a', snapshot: withStatus(SNAPSHOT_978, 'w18:p8V', 'working') })
  await start($)
  await cockpit($)
  await s.clock.settle()

  await stop($, STOP_TASKS_SLEEP)
  const r = await turnEnd($, MAIN_ANSWER)
  expect(r.block).toBeUndefined()
  expect(r.text).toContain('1 pane is working (w18:p8V) and no watch.sh is running')

  await stop($, [...STOP_TASKS_SLEEP, WATCH_TASK])
  expect(await turnEnd($, MAIN_ANSWER)).toEqual({ text: MAIN_ANSWER })
  // No Stop before it (a subagent's or an interrupted turn): nothing to say.
  expect(await turnEnd($, MAIN_ANSWER)).toEqual({ text: MAIN_ANSWER })
})

test('main with no pane working gets no watcher warning', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-a', snapshot: SNAPSHOT_978 })
  await start($)
  await cockpit($)
  await s.clock.settle()
  await stop($, STOP_TASKS_SLEEP)
  expect(await turnEnd($, MAIN_ANSWER)).toEqual({ text: MAIN_ANSWER })
})

// ── The label push (ADR9) ───────────────────────────────────────────────────────────────────

test('main pushes each Build pane its whole cockpit record, again only when the record changes', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-a', snapshot: SNAPSHOT_1041 })
  await start($)
  await cockpit($)
  await s.clock.settle()
  const head = ['herdr', 'pane', 'report-metadata', 'w18:p8V', '--source', 'cockpit', '--title', 'Build · Learner erasure purge (THV-1041)']
  expect(pushes(s.argvs)).toEqual([head])

  await s.clock.advance(15_000)
  expect(pushes(s.argvs)).toHaveLength(1)

  await submit($, PASTED_CONCERNS_THV_1041)
  await s.clock.advance(5_000)
  expect(pushes(s.argvs)).toEqual([head, [...head, '--state-label', 'idle=DONE_WITH_CONCERNS', '--state-label', 'done=DONE_WITH_CONCERNS']])
  expect(s.argvs.flat().some((a) => a.includes('display-agent'))).toBe(false)

  // A compaction re-resolves main on the same pane; herdr already holds the record.
  await sessionStart($, 'compact')
  await s.clock.advance(5_000)
  expect(pushes(s.argvs)).toHaveLength(2)
})

// ── The compaction checkpoint ───────────────────────────────────────────────────────────────

test('main writes checkpoint:<sid> on session.compact with the board and the RULINGS of the brief it sent, and SessionStart{compact} hands it back', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-a', snapshot: SNAPSHOT_978 })
  s.files.set(`${TMPDIR}dispatch/THV-978.md`, BRIEF_FILE_THV_978)
  await start($)
  await cockpit($)
  await bash($, SEND_978)
  await s.clock.advance(5_000)
  await compact($)

  const ruling = "Main holds the merge until ade157a5f is live on prod (tonight's promote). Build and commit now.\nIf signalLessonStarted has no other caller after this, delete it and its tests in the same change."
  expect(s.saved.get('cockpit:checkpoint:sid-a')).toMatchObject({
    kind: 'checkpoint',
    sid: 'sid-a',
    waves: [{ rows: [{ ticket: 'THV-978', title: TITLE_978, state: 'Build, pane idle' }] }],
    panes: [{ pane: 'w18:p8V', status: 'idle', tickets: ['THV-978'] }],
    rulings: [{ ticket: 'THV-978', file: 'THV-978.md', text: ruling }],
    next: ['No pane is working and no report is waiting.'],
  })

  const back = await sessionStart($, 'compact')
  expect(back.additionalContext).toHaveLength(1)
  const text = back.additionalContext?.[0] ?? ''
  expect(text).toContain('key cockpit:checkpoint:sid-a')
  expect(text).toContain(`- THV-978 ${TITLE_978}: Build, pane idle`)
  expect(text).toContain('- w18:p8V idle: THV-978')
  expect(text).toContain('    If signalLessonStarted has no other caller after this')
})

test('no checkpoint comes back on startup, nor one older than this compaction, nor from a pane session', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', sid: 'sid-a', snapshot: SNAPSHOT_978 })
  await start($)
  await cockpit($)
  await s.clock.advance(5_000)
  await compact($)
  expect(s.saved.has('cockpit:checkpoint:sid-a')).toBe(true)
  expect((await sessionStart($, 'startup')).additionalContext).toBeUndefined()
  await s.clock.advance(16 * 60_000)
  expect((await sessionStart($, 'compact')).additionalContext).toBeUndefined()
})

test('a pane session that compacts writes no checkpoint', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8V', sid: 'sid-b', snapshot: SNAPSHOT_978 })
  await start($)
  await submit($, BRIEF_FILE_THV_978)
  await compact($)
  expect([...s.saved.keys()].filter((k) => k.startsWith('cockpit:checkpoint:'))).toEqual([])
  expect((await sessionStart($, 'compact')).additionalContext).toBeUndefined()
})
