// main.ts's draw over a Shell of stubs, no kit beneath it: the full fact load each draw makes is
// held open, so a test decides when a draw ends and sees whether another started meanwhile.

import { expect } from 'claude-code/testing'
import type { Fact, FactKind, FactOf } from '../hooks/model.ts'
import { isPaneId, isSessionId, isSpaceId } from '../hooks/model.ts'
import { becomeMain, type Shell } from '../hooks/main.ts'
import { HOME, MAIN_CWD, TMPDIR, idOf, test } from './stage.ts'

const claimAs = (sid: string): FactOf<'main'> => ({ kind: 'main', space: idOf(isSpaceId, 'w18'), sid: idOf(isSessionId, sid), pane: idOf(isPaneId, 'w18:p8W'), at: 0 })
const PLACE = { cwd: MAIN_CWD, home: HOME, tmp: TMPDIR }

/** Each draw's `loadFacts()` waits here until the test ends it. */
type Load = { end(): void }

function shellOf(claim: () => FactOf<'main'>) {
  const loads: Load[] = []
  const beats: Array<() => void> = []
  let redraws = 0
  const fail = () => Promise.reject(new Error('not in this test'))
  const sh: Shell = {
    ask: { proc: fail, read: fail, list: fail, linear: fail },
    proc: fail,
    now: async () => 0,
    loadFacts: (only?: FactKind): Promise<Fact[]> => {
      if (only === 'main') return Promise.resolve([claim()])
      if (only !== undefined) return Promise.resolve([])
      return new Promise((resolve) => loads.push({ end: () => resolve([]) }))
    },
    loadStored: async () => [],
    writeFact: async () => undefined,
    deleteKey: async () => undefined,
    every: (_ms, run) => (beats.push(run), { cancel: () => undefined }),
    after: () => undefined,
    redraw: () => {
      redraws += 1
    },
    closePane: async () => undefined,
    workspace: async () => undefined,
    debug: async () => undefined,
  }
  return { sh, loads, beats, redraws: () => redraws }
}

/** Let every microtask the tick queued run. */
async function settle(): Promise<void> {
  for (let i = 0; i < 500; i++) await Promise.resolve()
}

test('a draw asked for while another runs is run once that one ends, not dropped', async () => {
  const t = shellOf(() => claimAs('sid-a'))
  becomeMain(t.sh, claimAs('sid-a'), PLACE)
  await settle()
  expect(t.loads.length).toBe(1)
  for (const beat of t.beats) beat()
  await settle()
  expect(t.loads.length).toBe(1)
  t.loads[0]?.end()
  await settle()
  expect(t.loads.length).toBe(2)
  t.loads[1]?.end()
  await settle()
  expect(t.redraws()).toBe(2)
})

test("after a re-claim the old main's draw and the new main's never run at once", async () => {
  let current = claimAs('sid-b')
  const t = shellOf(() => current)
  becomeMain(t.sh, current, PLACE)
  await settle()
  expect(t.loads.length).toBe(1)
  current = claimAs('sid-c')
  becomeMain(t.sh, current, PLACE)
  await settle()
  expect(t.loads.length).toBe(1)
  t.loads[0]?.end()
  await settle()
  expect(t.loads.length).toBe(2)
  t.loads[1]?.end()
  await settle()
})
