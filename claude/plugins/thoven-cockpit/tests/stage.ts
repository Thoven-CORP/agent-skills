// The kit stubs every S1 kit test shares: a herdr that answers from a real snapshot (or fails, or
// hangs), a Map for $.store, and recorders for what the mod opened, closed and ran.

import { mock } from 'claude-code/testing'
import { WORKFLOW_LIVE_SPACES } from './fixtures/workflow.ts'

export const HOME = '/Users/andresmartinez'
export const MAIN_CWD = '/Users/andresmartinez/thoven/frontend'

export const PANE = {
  plugin: 'thoven-cockpit',
  component: 'Pane',
  requestId: 'cockpit',
  surface: 'terminal',
  viewport: { columns: 160, rows: 40 },
  props: { title: 'Cockpit', isFocused: true, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

/** The live snapshot with one tab renamed, so a real pane carries a label dispatch-work writes. */
export function relabelTab(snapshot: string, tab: string, label: string): string {
  const root = JSON.parse(snapshot)
  for (const t of root.result.snapshot.tabs) if (t.tab_id === tab) t.label = label
  return JSON.stringify(root)
}

/** The live snapshot with one pane's own label set, or removed (undefined): herdr carries it only sometimes. */
export function relabelPane(snapshot: string, pane: string, label: string | undefined): string {
  const root = JSON.parse(snapshot)
  for (const p of root.result.snapshot.panes) if (p.pane_id === pane) p.label = label
  return JSON.stringify(root)
}

/** `herdr pane get <id>`, answered with that pane's own entry from the snapshot. */
function paneGetFrom(snapshot: string, pane: string): string {
  const entry = JSON.parse(snapshot).result.snapshot.panes.find((p: { pane_id: string }) => p.pane_id === pane)
  return JSON.stringify({ id: 'cli:pane:get', result: { pane: entry, type: 'pane_info' } })
}

const out = (stdout: string, exitCode = 0, stderr = '') => ({ value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } })

export type Stage = {
  clock: ReturnType<typeof mock.clock>
  argvs: string[][]
  saved: Map<string, unknown>
  opened: Array<Record<string, unknown>>
  closed: string[]
  registered: string[]
  /** Every `$.clock.every` and `$.clock.after` the mod started, with its period. */
  timers: Array<['every' | 'after', number]>
  storeCalls: { n: number }
  herdr: { mode: 'ok' | 'fail' | 'hang' }
  snapshots(): number
}

export function stage(on: any, o: { pane?: string; sid?: string; snapshot: string; store?: Record<string, unknown> }): Stage {
  const timers: Stage['timers'] = []
  // An event takes one hook per test, so the recorder rides inside mock.clock's own hooks.
  const recording = (pattern: string, ...rest: any[]) => {
    const hook = rest.pop()
    const kind = pattern === 'clock.every' ? 'every' : pattern === 'clock.after' ? 'after' : undefined
    const wrapped = kind ? (...args: any[]) => (timers.push([kind, args[1].ms]), hook(...args)) : hook
    return on(pattern, ...rest, wrapped)
  }
  const clock = mock.clock(recording as typeof on)
  mock.env(on, o.pane ? { HERDR_PANE_ID: o.pane, HOME } : { HOME })
  const s: Stage = {
    clock,
    argvs: [],
    saved: new Map(Object.entries(o.store ?? {})),
    opened: [],
    closed: [],
    registered: [],
    timers,
    storeCalls: { n: 0 },
    herdr: { mode: 'ok' },
    snapshots: () => s.argvs.filter((a) => a.join(' ') === 'herdr api snapshot').length,
  }

  on('process.run', async (_$: unknown, e: { argv: readonly string[] }) => {
    const argv = [...e.argv]
    s.argvs.push(argv)
    if (argv.join(' ') === 'herdr api snapshot') {
      if (s.herdr.mode === 'fail') return out('', 1, 'herdr: server not running')
      if (s.herdr.mode === 'hang') {
        await clock.sleep(40_000)
        return { deny: 'process.run: timed out after 10000 ms' }
      }
      return out(o.snapshot)
    }
    if (argv[1] === 'pane' && argv[2] === 'get' && argv[3]) return out(paneGetFrom(o.snapshot, argv[3]))
    return out('')
  })
  on('store.get', (_$: unknown, e: { key: string }) => (s.storeCalls.n++, { value: s.saved.get(e.key) }))
  on('store.set', (_$: unknown, e: { key: string; value: unknown }) => (s.storeCalls.n++, s.saved.set(e.key, e.value), { value: undefined }))
  on('store.delete', (_$: unknown, e: { key: string }) => (s.storeCalls.n++, s.saved.delete(e.key), { value: undefined }))
  on('store.keys', () => (s.storeCalls.n++, { value: [...s.saved.keys()] }))
  on('session.id', () => ({ value: o.sid ?? 'sid-a' }))
  on('command.register', (_$: unknown, e: { name: string }) => (s.registered.push(e.name), { value: undefined }))
  on('ui.open', (_$: unknown, e: Record<string, unknown>) => (s.opened.push(e), { value: { isPlaced: true } }))
  on('ui.close', (_$: unknown, e: { id: string }) => (s.closed.push(e.id), { value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('fs.read', (_$: unknown, e: { path: string }) => (e.path.endsWith('WORKFLOW.md') ? { value: WORKFLOW_LIVE_SPACES } : { deny: `ENOENT: ${e.path}` }))
  on('session.start', () => ({ cwd: MAIN_CWD }))
  on('classic.SessionStart', () => ({}))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['drawn by Claude Code'] }))
  return s
}

export const start = ($: any) => $.session.start({ surface: 'terminal', isInteractive: true, cwd: MAIN_CWD })
/** `/cockpit`, typed at the prompt. */
export const cockpit = ($: any): Promise<{ text?: string }> => $.command.run({ command: 'cockpit', args: '' })
