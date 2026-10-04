// S5b: background.ts and the RULINGS grammar on real text, with no kit: the label record a
// multi-ticket pane gets, what the checkpoint says main does next, the watcher test on every task
// shape, and the checkpoint's shape check at the store boundary.
//
// Derived inputs: the spec's multi-ticket pane label set on p8V with `relabelPane`; report facts
// built in the shape observe.ts writes; a Monitor task in the shape the 2.1.288 types give
// BackgroundTaskSummary (no `command`), because no Stop log on file holds one.

import { expect, test } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { builderTickets, checkpointOf, isWatching, labelRecords, rulingsFrom, sentLines, watcherWarning } from '../hooks/background.ts'
import { rulingsOf, statusLines } from '../hooks/dispatch.ts'
import { isPaneId, isSessionId, type Fact } from '../hooks/model.ts'
import { keyOf, parseFact } from '../hooks/store.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { ANSWER_DONE_THV_978, ANSWER_NO_STATUS_THV_1082, BRIEF_FILE_THV_978, STOP_TASKS_SLEEP, WATCH_BASH_INPUT } from './fixtures/turns.ts'
import { idOf, mainOf, relabelPane, relabelTab, tk, worldOf } from './stage.ts'

const ME = mainOf('w18', 'w18:p8W')
const SID = idOf(isSessionId, 'sid-b')
const P8V = idOf(isPaneId, 'w18:p8V')
const MULTI = relabelPane(SNAPSHOT_LIVE, 'w18:p8V', 'Book Lessons follow-ups (THV-843 847 851)')
const report = (t: string, status: 'DONE' | 'BLOCKED', at: number): Fact => ({ kind: 'report', ticket: tk(t), sid: SID, status, text: `${status} ${t}`, concerns: 0, at })

test('rulingsOf reads the RULINGS field and its indented lines, and stops at the next field', async () => {
  expect(rulingsOf(BRIEF_FILE_THV_978)).toBe(
    "Main holds the merge until ade157a5f is live on prod (tonight's promote). Build and commit now.\nIf signalLessonStarted has no other caller after this, delete it and its tests in the same change.",
  )
  expect(rulingsOf(ANSWER_DONE_THV_978)).toBeUndefined()
  expect(rulingsOf(BRIEF_FILE_THV_978.replace(/^RULINGS[^\n]*\n[^\n]*\n/m, 'RULINGS    none\n'))).toBeUndefined()
})

test('a pane holding three tickets gets one record naming all three, its state label per ticket', async () => {
  const board = project(worldOf(ME, MULTI, { facts: [report('THV-847', 'BLOCKED', 2)] }))
  expect(labelRecords(board).get(P8V)).toEqual({
    title: 'Book Lessons follow-ups (THV-843 THV-847 THV-851)',
    states: [
      { status: 'idle', text: 'THV-847 BLOCKED' },
      { status: 'done', text: 'THV-847 BLOCKED' },
    ],
  })
  // Main's own pane is never pushed, nor a pane with no Build or Review row.
  expect([...labelRecords(board).keys()]).toEqual([P8V])
})

test('the checkpoint names each row, its pane, and the next step read off the board', async () => {
  const working = JSON.parse(relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Consent evidence hardening (THV-1045)'))
  for (const p of working.result.snapshot.panes) if (p.pane_id === 'w18:p8V') p.agent_status = 'working'
  const board = project(worldOf(ME, JSON.stringify(working), { facts: [report('THV-1045', 'DONE', 3)] }))
  const c = checkpointOf(ME.sid, board, [], 10_000)
  expect(c.waves).toEqual([{ rows: [{ ticket: 'THV-1045', title: 'Consent evidence hardening', state: 'Build, report DONE, pane working' }] }])
  expect(c.panes).toEqual([{ pane: 'w18:p8V', status: 'working', tickets: ['THV-1045'] }])
  expect(c.next).toEqual(['Reports in: THV-1045 DONE. Act on each one not yet acted on, as dispatch-work step 4 says.', 'Re-arm scripts/watch.sh w18:p8V in the background.'])
})

test('a checkpoint survives the store whole, and one at another session key or with a bad row is refused', async () => {
  const board = project(worldOf(ME, MULTI))
  const c = checkpointOf(ME.sid, board, rulingsFrom([{ ticket: tk('THV-978'), file: 'THV-978.md' }], [BRIEF_FILE_THV_978]), 10_000)
  const stored = JSON.parse(JSON.stringify(c))
  expect(parseFact(keyOf(c), stored)).toEqual(c)
  expect(parseFact('cockpit:checkpoint:sid-other', stored)).toBeUndefined()
  expect(parseFact(keyOf(c), { ...stored, panes: [{ pane: 'w18:p8V', status: 'busy', tickets: [] }] })).toBeUndefined()
  expect(parseFact(keyOf(c), { ...stored, waves: [{ rows: [{ ticket: 'thv-843', title: 'x', state: 'y' }] }] })).toBeUndefined()
})

test('watch.sh counts as a watcher by its command or, for a Monitor task, its description; a sleep does not', async () => {
  const watch = { id: 'b1', type: 'shell', status: 'running', description: WATCH_BASH_INPUT.description, command: WATCH_BASH_INPUT.command }
  const monitor = { id: 'm1', type: 'monitor', status: 'running', description: '~/.claude/skills/dispatch-work/scripts/watch.sh w18:p8V' }
  expect([isWatching(STOP_TASKS_SLEEP), isWatching([...STOP_TASKS_SLEEP, watch]), isWatching([monitor]), isWatching(undefined)]).toEqual([false, true, true, false])
  expect(watcherWarning([], false)).toBeUndefined()
  expect(watcherWarning([P8V], true)).toBeUndefined()
  expect(watcherWarning([P8V, idOf(isPaneId, 'w18:p8P')], false)).toContain('2 panes are working (w18:p8V, w18:p8P)')
})

test('only a builder brief or a fix round makes a session hold a ticket, and only its report words count', async () => {
  const brief = (k: 'first' | 'fix', role: 'builder' | 'verifier', t: string): Fact =>
    k === 'first' ? { kind: 'brief', k, role, ticket: tk(t), sid: SID, pane: P8V, at: 1 } : { kind: 'brief', k, round: 1, of: 5, ticket: tk(t), sid: SID, pane: P8V, at: 1 }
  const facts = [brief('first', 'verifier', 'THV-1016'), brief('fix', 'builder', 'THV-711'), brief('first', 'builder', 'THV-978')]
  expect(builderTickets(facts, SID)).toEqual(['THV-711', 'THV-978'])
  expect(builderTickets(facts, idOf(isSessionId, 'sid-after-clear'))).toEqual([])
  expect(sentLines([tk('THV-978')], statusLines(ANSWER_DONE_THV_978)).map((l) => [l.ticket, l.word])).toEqual([['THV-978', 'DONE']])
  expect(sentLines([tk('THV-711')], statusLines(ANSWER_DONE_THV_978))).toEqual([])
  expect(sentLines([tk('THV-978')], statusLines(ANSWER_NO_STATUS_THV_1082))).toEqual([])
})
