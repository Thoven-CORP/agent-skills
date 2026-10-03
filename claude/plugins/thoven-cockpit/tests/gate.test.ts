// The spec's static gate, as a run: record every process argv and HTTP body a simulated session
// produces (every source due, every button pressed) and fail on anything outside the read-only
// list. commands.ts makes the bad argv hard to write; this test proves none was run.

import { expect, test } from 'claude-code/testing'
import { COMMANDS, type CommandName, type Req } from '../hooks/commands.ts'
import { isPaneId } from '../hooks/model.ts'
import { SNAPSHOT_LIVE } from './fixtures/herdr.ts'
import { PANE, cockpit, idOf, relabelTab, stage, start } from './stage.ts'

const SNAPSHOT = relabelTab(SNAPSHOT_LIVE, 'w18:t45', 'Build · Consent evidence hardening (THV-1045)')

/** A merge verb, or a flag that merges or forces. `mergedAt` inside `--json` is neither. */
const isMerging = (a: string): boolean => /^merge$/i.test(a) || /^--?(merge|squash|rebase|auto|admin)$/i.test(a)

/** Each command built once with a real operand. The mapped type makes a new command name a compile error here. */
const BUILT: { [K in CommandName]: () => Req } = {
  'herdr api snapshot': () => COMMANDS['herdr api snapshot'](),
  'herdr pane get': () => COMMANDS['herdr pane get'](idOf(isPaneId, 'w18:p8V')),
  'herdr agent focus': () => COMMANDS['herdr agent focus'](idOf(isPaneId, 'w18:p8V')),
  'gh pr list': () => COMMANDS['gh pr list']('Thoven-CORP/frontend-remote'),
  'herdr pane report-metadata': () => COMMANDS['herdr pane report-metadata'](idOf(isPaneId, 'w18:p8V'), { title: 'Build · Consent evidence hardening (THV-1045)', states: [{ status: 'idle', text: 'DONE' }] }),
}

test('no process argv carries merge, and the cockpit runs only the three herdr reads, the label push and gh pr list', async ($, on) => {
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

  expect(s.argvs.flat().some(isMerging)).toBe(false)
  expect([...new Set(s.argvs.map((a) => a.slice(0, 3).join(' ')))].sort()).toEqual(['gh pr list', 'herdr agent focus', 'herdr api snapshot', 'herdr pane get', 'herdr pane report-metadata'])
  // ADR9: the cockpit reports under its own source and never sets the verifier's badge.
  expect(s.argvs.flat().filter((a) => a.includes('display-agent'))).toEqual([])
  expect(s.argvs.filter((a) => a[2] === 'report-metadata').every((a) => a[4] === '--source' && a[5] === 'cockpit')).toBe(true)
  // `mergedAt` is a field inside `--json`; no element is a merge verb or flag.
  expect(s.argvs.filter((a) => a[0] === 'gh').every((a) => a.includes('--json') && a.some((x) => x.includes('mergedAt')))).toBe(true)
  expect(bodies).toEqual([])
})

test('every command in commands.ts starts with its own name and holds no merge verb or flag', async () => {
  for (const [name, build] of Object.entries(BUILT)) {
    const { argv } = build()
    expect(argv.slice(0, 3).join(' ')).toBe(name)
    expect(argv.filter(isMerging)).toEqual([])
  }
})

test('commands.ts builds only read-only herdr and gh argvs, and the one herdr label push', async () => {
  expect([...BUILT['gh pr list']().argv]).toEqual([
    'gh', 'pr', 'list', '--repo', 'Thoven-CORP/frontend-remote', '--state', 'all',
    '--json', 'number,title,headRefName,state,statusCheckRollup,mergedAt,url,additions,deletions,files', '--limit', '50',
  ])
  expect(() => COMMANDS['gh pr list']('--admin/x')).toThrow()
  expect([...BUILT['herdr api snapshot']().argv]).toEqual(['herdr', 'api', 'snapshot'])
  expect([...BUILT['herdr pane get']().argv]).toEqual(['herdr', 'pane', 'get', 'w18:p8V'])
  expect([...BUILT['herdr agent focus']().argv]).toEqual(['herdr', 'agent', 'focus', 'w18:p8V'])
  expect([...BUILT['herdr pane report-metadata']().argv]).toEqual([
    'herdr', 'pane', 'report-metadata', 'w18:p8V', '--source', 'cockpit', '--title', 'Build · Consent evidence hardening (THV-1045)', '--state-label', 'idle=DONE',
  ])
  expect(() => COMMANDS['herdr pane report-metadata'](idOf(isPaneId, '--clear-title'), { title: 'x', states: [] })).toThrow()
  expect(Object.values(BUILT).map((build) => build().timeoutMs)).toEqual([10_000, 10_000, 10_000, 30_000, 10_000])
})
