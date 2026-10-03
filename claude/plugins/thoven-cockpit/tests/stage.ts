// The kit stubs every S1 kit test shares: a herdr that answers from a real snapshot (or fails, or
// hangs), a Map for $.store, and recorders for what the mod opened, closed and ran.

import { mock } from 'claude-code/testing'
import type { Answer, Ask, Listing } from '../hooks/sources.ts'
import { PANE_GET_P8W } from './fixtures/herdr.ts'
import { WORKFLOW_LIVE_SPACES } from './fixtures/workflow.ts'

export const HOME = '/Users/andresmartinez'
export const MAIN_CWD = '/Users/andresmartinez/thoven/frontend'
/** macOS gives TMPDIR a trailing slash; the inbox path must not double it. */
export const TMPDIR = '/var/folders/15/408cjyln12l18dh26xh1gksh0000gn/T/'
export const INBOX_DIR = `${TMPDIR}dispatch/out`

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

/** The live snapshot with one pane gone, as when it closes. */
export function dropPane(snapshot: string, pane: string): string {
  const root = JSON.parse(snapshot)
  const snap = root.result.snapshot
  snap.panes = snap.panes.filter((p: { pane_id: string }) => p.pane_id !== pane)
  snap.agents = snap.agents.filter((p: { pane_id: string }) => p.pane_id !== pane)
  return JSON.stringify(root)
}

/** `herdr pane get <id>`: the real answer for w18:p8W, else that pane's own entry from the snapshot. */
function paneGetFrom(snapshot: string, pane: string): string {
  if (pane === 'w18:p8W') return PANE_GET_P8W
  const entry = JSON.parse(snapshot).result.snapshot.panes.find((p: { pane_id: string }) => p.pane_id === pane)
  return JSON.stringify({ id: 'cli:pane:get', result: { pane: entry, type: 'pane_info' } })
}

/**
 * What a fake `ask` answers: process stdout by its argv joined with spaces, file text and folder
 * entries by path. Anything not in the table fails, as a missing file does.
 */
export type AskTable = { proc?: Record<string, string>; read?: Record<string, string>; list?: Record<string, Listing> }

/** A source's `ask` with no kit under it. `asked` records each read in the order asked: `read <path>`, `list <path>`, or the argv. */
export function fakeAsk(table: AskTable): Ask & { asked: string[] } {
  const asked: string[] = []
  const answer = <T>(what: string, value: T | undefined): Promise<Answer<T>> => {
    asked.push(what)
    return Promise.resolve(value === undefined ? { k: 'fail', error: `ENOENT: ${what}` } : { k: 'ok', value })
  }
  return {
    asked,
    proc: (req) => answer(req.argv.join(' '), table.proc?.[req.argv.join(' ')]),
    read: (path) => answer(`read ${path}`, table.read?.[path]),
    list: (path) => answer(`list ${path}`, table.list?.[path]),
  }
}

const out = (stdout: string, exitCode = 0, stderr = '') => ({ value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } })

export type Stage = {
  clock: ReturnType<typeof mock.clock>
  argvs: string[][]
  saved: Map<string, unknown>
  opened: Array<Record<string, unknown>>
  closed: string[]
  registered: string[]
  /** What each `$.command.register` was called with. */
  registrations: Array<Record<string, unknown>>
  /** Set to make `$.command.register` refuse, as a re-registration can. */
  register: { deny: string | undefined }
  /** Every `$.ui.log` line. */
  logs: string[]
  /** Every `$.clock.every` and `$.clock.after` wait, with its period. The kit raises an `every` again each period. */
  timers: Array<['every' | 'after', number]>
  storeCalls: { n: number }
  /** `$TMPDIR/dispatch/out/`: file name → text and mtime. Empty means the folder does not exist. */
  inbox: Map<string, { text: string; mtimeMs: number }>
  /** What `herdr api snapshot` does now; a test changes `snapshot` to move the space on. */
  herdr: { mode: 'ok' | 'fail' | 'hang'; snapshot: string }
  /** What `gh pr list --repo <repo>` answers, by repo. A repo with no entry lists `[]`. */
  gh: { mode: 'ok' | 'fail'; byRepo: Record<string, string> }
  /** Any other file `$.fs.read` can see, by absolute path: `.git` files, HEADs, `.git/config`. */
  files: Map<string, string>
  /** Every key `$.store.set` wrote, in order, repeats included. */
  setKeys: string[]
  snapshots(): number
  paneGets(): string[]
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
  mock.env(on, o.pane ? { HERDR_PANE_ID: o.pane, HOME, TMPDIR } : { HOME, TMPDIR })
  const s: Stage = {
    clock,
    argvs: [],
    saved: new Map(Object.entries(o.store ?? {})),
    opened: [],
    closed: [],
    registered: [],
    registrations: [],
    register: { deny: undefined },
    logs: [],
    timers,
    storeCalls: { n: 0 },
    inbox: new Map(),
    herdr: { mode: 'ok', snapshot: o.snapshot },
    gh: { mode: 'ok', byRepo: {} },
    files: new Map(),
    setKeys: [],
    snapshots: () => s.argvs.filter((a) => a.join(' ') === 'herdr api snapshot').length,
    paneGets: () => s.argvs.filter((a) => a[1] === 'pane' && a[2] === 'get').map((a) => a[3] ?? ''),
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
      return out(s.herdr.snapshot)
    }
    if (argv[1] === 'pane' && argv[2] === 'get' && argv[3]) return out(paneGetFrom(s.herdr.snapshot, argv[3]))
    if (argv[0] === 'gh' && argv[1] === 'pr' && argv[2] === 'list') {
      if (s.gh.mode === 'fail') return out('', 1, 'HTTP 502: Server Error (https://api.github.com/graphql)')
      return out(s.gh.byRepo[argv[argv.indexOf('--repo') + 1] ?? ''] ?? '[]')
    }
    return out('')
  })
  on('store.get', (_$: unknown, e: { key: string }) => (s.storeCalls.n++, { value: s.saved.get(e.key) }))
  on('store.set', (_$: unknown, e: { key: string; value: unknown }) => (s.storeCalls.n++, s.setKeys.push(e.key), s.saved.set(e.key, e.value), { value: undefined }))
  on('store.delete', (_$: unknown, e: { key: string }) => (s.storeCalls.n++, s.saved.delete(e.key), { value: undefined }))
  on('store.keys', () => (s.storeCalls.n++, { value: [...s.saved.keys()] }))
  on('session.id', () => ({ value: o.sid ?? 'sid-a' }))
  on('command.register', (_$: unknown, e: { name: string }) => {
    s.registrations.push({ ...e })
    if (s.register.deny !== undefined) return { deny: s.register.deny }
    s.registered.push(e.name)
    return { value: undefined }
  })
  on('ui.open', (_$: unknown, e: Record<string, unknown>) => (s.opened.push(e), { value: { isPlaced: true } }))
  on('ui.close', (_$: unknown, e: { id: string }) => (s.closed.push(e.id), { value: undefined }))
  on('ui.log', (_$: unknown, e: { text: string }) => (s.logs.push(e.text), { value: undefined }))
  on('fs.read', (_$: unknown, e: { path: string }) => {
    if (e.path.endsWith('WORKFLOW.md')) return { value: WORKFLOW_LIVE_SPACES }
    const known = s.files.get(e.path)
    if (known !== undefined) return { value: known }
    const file = e.path.startsWith(`${INBOX_DIR}/`) ? s.inbox.get(e.path.slice(INBOX_DIR.length + 1)) : undefined
    return file ? { value: file.text } : { deny: `ENOENT: ${e.path}` }
  })
  on('fs.exists', (_$: unknown, e: { path: string }) => ({ value: e.path === INBOX_DIR && s.inbox.size > 0 }))
  on('fs.list', (_$: unknown, e: { path: string }) =>
    e.path === INBOX_DIR
      ? { value: [...s.inbox].map(([name, f]) => ({ name, kind: 'file', size: f.text.length, mtimeMs: f.mtimeMs, isLink: false })) }
      : { deny: `ENOENT: ${e.path}` },
  )
  on('prompt.submit', (_$: unknown, e: { text: string }) => ({ text: e.text }))
  on('session.receive', (_$: unknown, e: { text: string }) => ({ text: e.text }))
  on('tool.call', () => ({ result: { stdout: '', stderr: '', interrupted: false } }))
  on('session.start', () => ({ cwd: MAIN_CWD }))
  on('classic.SessionStart', () => ({}))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['drawn by Claude Code'] }))
  return s
}

export const start = ($: any) => $.session.start({ surface: 'terminal', isInteractive: true, cwd: MAIN_CWD })
/** `/cockpit`, typed at the prompt. */
export const cockpit = ($: any, args = ''): Promise<{ text?: string }> => $.command.run({ command: 'cockpit', args })

/** A prompt as herdr's `agent prompt` delivers it: typed origin, pastes expanded. */
export const submit = ($: any, text: string) => $.prompt.submit({ text, origin: { kind: 'composer' }, wait: false })
/** A subagent or peer hand-back. */
export const receive = ($: any, text: string) => $.session.receive({ origin: { kind: 'peer' }, text })
/** Claude running one Bash command. */
export const bash = ($: any, command: string) => $.tool.call({ tool: 'Bash', command, description: 'send', tool_use_id: 'toolu_s2' })
