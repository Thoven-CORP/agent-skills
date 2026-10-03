// The spec's static gate, as a run: record every process argv and HTTP body a simulated session
// produces (every source due, every button pressed) and fail on anything outside the read-only
// list. commands.ts makes the bad argv hard to write; this test proves none was run.

import { expect, test } from 'claude-code/testing'
import { herdr } from '../hooks/commands.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { PANE, cockpit, relabelTab, stage, start } from './stage.ts'

const SNAPSHOT = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Consent evidence hardening (THV-1045)')

test('no process argv carries merge, and S1 runs only the three herdr reads', async ($, on) => {
  const s = stage(on, { pane: 'w18:p8W', snapshot: SNAPSHOT })
  const bodies: string[] = []
  on('http.fetch', (_$: unknown, e: { init?: { body?: unknown } }) => {
    bodies.push(String(e.init?.body ?? ''))
    return { deny: 'no http in S1' }
  })
  await start($)
  await cockpit($)
  await s.clock.advance(6 * 60_000)
  const ui = await $.ui.mount(PANE)
  for (const key of ['row-THV-1045', 'focus-row', 'tab-prs', 'tab-work']) await ui.press({ key })
  await s.clock.settle()

  expect(s.argvs.flat().some((a) => /^merge$/i.test(a) || /^--?(merge|squash|rebase|auto|admin)$/i.test(a))).toBe(false)
  expect([...new Set(s.argvs.map((a) => a.slice(0, 3).join(' ')))].sort()).toEqual(['herdr agent focus', 'herdr api snapshot', 'herdr pane get'])
  expect(bodies).toEqual([])
})

test('commands.ts builds only read-only herdr argvs', async () => {
  expect(Object.keys(herdr).sort()).toEqual(['agentFocus', 'paneGet', 'snapshot'])
  expect([...herdr.snapshot()]).toEqual(['herdr', 'api', 'snapshot'])
  expect([...herdr.paneGet('w18:p8V' as never)]).toEqual(['herdr', 'pane', 'get', 'w18:p8V'])
  expect([...herdr.agentFocus('w18:p8V' as never)]).toEqual(['herdr', 'agent', 'focus', 'w18:p8V'])
})
