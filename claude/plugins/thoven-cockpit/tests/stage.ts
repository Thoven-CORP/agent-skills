// What every suite shares. The worlds board tests project, built from a real snapshot; and the kit
// stubs: a herdr that answers from a real snapshot (or fails, or hangs), a Map for $.store, and
// recorders for what the mod opened, closed and ran.

import { mock } from 'claude-code/testing'
import { project } from '../hooks/board.ts'
import { COMMANDS, type Req } from '../hooks/commands.ts'
import { ticket } from '../hooks/dispatch.ts'
import { parseSnapshot } from '../hooks/herdr.ts'
import { isPaneId, isSessionId, isSpaceId, type Board, type Fact, type Main, type Polled, type Row, type Sources, type Ticket, type World } from '../hooks/model.ts'
import { parseLiveSpaces, unpolled, type Ask, type Listing } from '../hooks/sources.ts'
import { PANE_GET_P8W } from './fixtures/herdr.ts'
import { WORKFLOW_LIVE_SPACES } from './fixtures/workflow.ts'

export const HOME = '/Users/andresmartinez'
export const MAIN_CWD = '/Users/andresmartinez/thoven/frontend'
/** macOS gives TMPDIR a trailing slash; the inbox path must not double it. */
export const TMPDIR = '/var/folders/15/408cjyln12l18dh26xh1gksh0000gn/T/'
export const INBOX_DIR = `${TMPDIR}dispatch/out`

// ── worlds ───────────────────────────────────────────────────────────────────────────────────

export const fresh = <T>(value: T): Polled<T> => ({ k: 'fresh', value, at: 0 })

export function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('expected a value')
  return value
}

/** A literal as an id, minted through model.ts's guard as the hooks mint outside text. */
export function idOf<T>(isT: (v: unknown) => v is T, text: string): T {
  if (isT(text)) return text
  throw new Error(`not an id: ${text}`)
}

/** A literal as a ticket, through dispatch.ts's `ticket()`, the one place tickets are made. */
export const tk = (text: string): Ticket => must(ticket(text))

export function mainOf(space: string, pane: string, cwd = MAIN_CWD): Main {
  return { k: 'main', space: idOf(isSpaceId, space), pane: idOf(isPaneId, pane), sid: idOf(isSessionId, 'sid-main'), cwd, home: HOME, tmp: TMPDIR }
}

/** What main knows at 10 s: herdr's snapshot and the Live spaces table fresh, every other source of SOURCES unpolled unless `sources` says. */
export function worldOf(me: Main, snapshot: string, o: { facts?: Fact[]; sources?: Partial<Sources> } = {}): World {
  return {
    now: 10_000,
    me,
    sources: { ...unpolled(), herdr: fresh(must(parseSnapshot(snapshot))), spaces: fresh(parseLiveSpaces(WORKFLOW_LIVE_SPACES)), ...o.sources },
    facts: o.facts ?? [],
  }
}

/** Every Work row on the board, parents' children in place. */
export const rowsOf = (board: Board): Row[] => board.build.flatMap((g) => (g.k === 'single' ? [g.row] : g.children))

export function rowOf(world: World, ticket: string): Row {
  const row = rowsOf(project(world)).find((r) => r.ticket === ticket)
  if (!row) throw new Error(`no row for ${ticket}`)
  return row
}

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
 * entries by path. Anything not in the table throws, as a missing file does.
 */
export type AskTable = { proc?: Record<string, string>; read?: Record<string, string>; list?: Record<string, Listing>; linear?: string }

/** A source's `ask` with no kit under it. `asked` records each read in the order asked: `read <path>`, `list <path>`, the argv, or `linear <body JSON>`. */
export function fakeAsk(table: AskTable): Ask & { asked: string[] } {
  const asked: string[] = []
  const answer = <T>(what: string, value: T | undefined): Promise<T> => {
    asked.push(what)
    return value === undefined ? Promise.reject(new Error(`ENOENT: ${what}`)) : Promise.resolve(value)
  }
  return {
    asked,
    proc: (req) => answer(req.argv.join(' '), table.proc?.[req.argv.join(' ')]),
    read: (path) => answer(`read ${path}`, table.read?.[path]),
    list: (path) => answer(`list ${path}`, table.list?.[path]),
    linear: (body) => answer(`linear ${JSON.stringify(body)}`, table.linear),
  }
}

const out = (stdout: string, exitCode = 0, stderr = '') => ({ value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } })

export type Stage = {
  clock: ReturnType<typeof mock.clock>
  argvs: string[][]
  /** Each process's timeout, in the order of `argvs`. */
  timeoutsMs: Array<number | undefined>
  saved: Map<string, unknown>
  opened: Array<Record<string, unknown>>
  closed: string[]
  /** What each `$.command.register` was called with, refused or not. */
  registrations: Array<Record<string, unknown>>
  /** Set to make `$.command.register` refuse, as a re-registration can. */
  registerDeny: string | undefined
  /** Every `$.ui.log` line. */
  logs: string[]
  storeCalls: number
  /** `$TMPDIR/dispatch/out/`: file name → text and mtime. Empty means the folder does not exist. */
  inbox: Map<string, { text: string; mtimeMs: number }>
  /** What `herdr api snapshot` does now (`slow` answers after 2 s); a test changes `snapshot` to move the space on. */
  herdr: { mode: 'ok' | 'fail' | 'hang' | 'slow'; snapshot: string }
  /** What `gh pr list --repo <repo>` answers, by repo. A repo with no entry lists `[]`. */
  gh: { mode: 'ok' | 'fail' | 'hang'; byRepo: Record<string, string> }
  /** Any other file `$.fs.read` can see, by absolute path: `.git` files, HEADs, `.git/config`. */
  files: Map<string, string>
  /** Every key `$.store.set` wrote, in order, repeats included. */
  setKeys: string[]
  /** Set to make the Bash tool beneath the cockpit throw, as a crashed tool does. */
  bashThrows: string | undefined
  /** What the Bash tool beneath the cockpit prints, such as a set-status.js read-back. */
  bashStdout: string
  /** Every `$.fs` call, in order: `read <path>`, `list <path>` or `exists <path>`. */
  fsCalls: string[]
  /** What the Skill tool answers (S3): core's `{ result, text }`, with `isReadOnly` when a test sets it. */
  skillResult: Record<string, unknown>
  /** What fires inside the Skill call before it answers, as skill.prompt does in a real one. */
  skillInside: (() => Promise<unknown>) | undefined
  snapshots(): number
  paneGets(): string[]
}

export function stage(on: any, o: { pane?: string; sid?: string; snapshot: string; store?: Record<string, unknown> }): Stage {
  const clock = mock.clock(on)
  mock.env(on, o.pane ? { HERDR_PANE_ID: o.pane, HOME, TMPDIR } : { HOME, TMPDIR })
  const s: Stage = {
    clock,
    argvs: [],
    timeoutsMs: [],
    saved: new Map(Object.entries(o.store ?? {})),
    opened: [],
    closed: [],
    registrations: [],
    registerDeny: undefined,
    logs: [],
    storeCalls: 0,
    inbox: new Map(),
    herdr: { mode: 'ok', snapshot: o.snapshot },
    gh: { mode: 'ok', byRepo: {} },
    files: new Map(),
    setKeys: [],
    fsCalls: [],
    bashThrows: undefined,
    skillInside: undefined,
    skillResult: { result: { success: true, commandName: 'verify-this' }, text: 'Launching skill: verify-this' },
    bashStdout: '',
    snapshots: () => ranTimes(s, COMMANDS['herdr api snapshot']()),
    paneGets: () => s.argvs.filter((a) => a[1] === 'pane' && a[2] === 'get').map((a) => a[3] ?? ''),
  }

  on('process.run', async (_$: unknown, e: { argv: readonly string[]; init?: { timeoutMs?: number } }) => {
    const argv = [...e.argv]
    s.argvs.push(argv)
    s.timeoutsMs.push(e.init?.timeoutMs)
    if (argv.join(' ') === 'herdr api snapshot') {
      if (s.herdr.mode === 'fail') return out('', 1, 'herdr: server not running')
      if (s.herdr.mode === 'hang') {
        await clock.sleep(40_000)
        return { deny: 'process.run: timed out after 10000 ms' }
      }
      if (s.herdr.mode === 'slow') await clock.sleep(2_000)
      return out(s.herdr.snapshot)
    }
    if (argv[1] === 'pane' && argv[2] === 'get' && argv[3]) return out(paneGetFrom(s.herdr.snapshot, argv[3]))
    if (argv[0] === 'gh' && argv[1] === 'pr' && argv[2] === 'list') {
      if (s.gh.mode === 'fail') return out('', 1, 'HTTP 502: Server Error (https://api.github.com/graphql)')
      if (s.gh.mode === 'hang') {
        await clock.sleep(40_000)
        return { deny: 'process.run: timed out after 30000 ms' }
      }
      return out(s.gh.byRepo[argv[argv.indexOf('--repo') + 1] ?? ''] ?? '[]')
    }
    return out('')
  })
  on('store.get', (_$: unknown, e: { key: string }) => (s.storeCalls++, { value: s.saved.get(e.key) }))
  on('store.set', (_$: unknown, e: { key: string; value: unknown }) => (s.storeCalls++, s.setKeys.push(e.key), s.saved.set(e.key, e.value), { value: undefined }))
  on('store.delete', (_$: unknown, e: { key: string }) => (s.storeCalls++, s.saved.delete(e.key), { value: undefined }))
  on('store.keys', () => (s.storeCalls++, { value: [...s.saved.keys()] }))
  on('session.id', () => ({ value: o.sid ?? 'sid-a' }))
  on('session.cwd', () => ({ value: MAIN_CWD }))
  on('command.register', (_$: unknown, e: { name: string }) => {
    s.registrations.push({ ...e })
    if (s.registerDeny !== undefined) return { deny: s.registerDeny }
    return { value: undefined }
  })
  on('ui.open', (_$: unknown, e: Record<string, unknown>) => (s.opened.push(e), { value: { isPlaced: true } }))
  on('ui.close', (_$: unknown, e: { id: string }) => (s.closed.push(e.id), { value: undefined }))
  on('ui.log', (_$: unknown, e: { text: string }) => (s.logs.push(e.text), { value: undefined }))
  on('fs.read', (_$: unknown, e: { path: string }) => {
    s.fsCalls.push(`read ${e.path}`)
    if (e.path.endsWith('WORKFLOW.md')) return { value: WORKFLOW_LIVE_SPACES }
    const known = s.files.get(e.path)
    if (known !== undefined) return { value: known }
    const file = e.path.startsWith(`${INBOX_DIR}/`) ? s.inbox.get(e.path.slice(INBOX_DIR.length + 1)) : undefined
    return file ? { value: file.text } : { deny: `ENOENT: ${e.path}` }
  })
  // A folder exists when `files` holds something under it, so `<cwd>/.git/HEAD` makes `.git` a folder.
  const under = (dir: string): string[] => [...s.files.keys()].filter((k) => k.startsWith(`${dir}/`)).map((k) => k.slice(dir.length + 1))
  on('fs.exists', (_$: unknown, e: { path: string }) => (s.fsCalls.push(`exists ${e.path}`), { value: e.path === INBOX_DIR ? s.inbox.size > 0 : s.files.has(e.path) || under(e.path).length > 0 }))
  on('fs.list', (_$: unknown, e: { path: string }) => {
    s.fsCalls.push(`list ${e.path}`)
    if (e.path === INBOX_DIR) return { value: [...s.inbox].map(([name, f]) => ({ name, kind: 'file', size: f.text.length, mtimeMs: f.mtimeMs, isLink: false })) }
    const kinds = new Map(under(e.path).map((rest) => [rest.split('/')[0] ?? '', rest.includes('/') ? 'dir' : 'file']))
    return kinds.size > 0 ? { value: [...kinds].map(([name, kind]) => ({ name, kind, size: 0, mtimeMs: 0, isLink: false })) } : { deny: `ENOENT: ${e.path}` }
  })
  on('prompt.submit', (_$: unknown, e: { text: string }) => ({ text: e.text }))
  on('session.receive', (_$: unknown, e: { text: string }) => ({ text: e.text }))
  on('skill.prompt', (_$: unknown, e: { text: string }) => ({ text: e.text }))
  on('tool.call', async (_$: unknown, e: { tool?: string }) => {
    if (e.tool === 'Skill') {
      await s.skillInside?.()
      return s.skillResult
    }
    if (s.bashThrows !== undefined) throw new Error(s.bashThrows)
    return { result: { stdout: s.bashStdout, stderr: '', interrupted: false } }
  })
  on('session.start', () => ({ cwd: MAIN_CWD }))
  on('classic.SessionStart', () => ({}))
  on('session.compact', (_$: unknown, e: { messages: unknown[] }) => ({ messages: e.messages, tokensBefore: 0, tokensAfter: 0 }))
  on('classic.Stop', () => ({}))
  on('turn.complete', (_$: unknown, e: { answer: string }) => ({ text: e.answer }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['drawn by Claude Code'] }))
  return s
}

/** How many times the stage ran exactly the argv a commands.ts builder makes. */
export const ranTimes = (s: Stage, req: Req): number => s.argvs.filter((a) => a.join('\n') === req.argv.join('\n')).length

export const start = ($: any) => $.session.start({ surface: 'terminal', isInteractive: true, cwd: MAIN_CWD })
/** `/cockpit`, typed at the prompt. */
export const cockpit = ($: any, args = ''): Promise<{ text?: string }> => $.command.run({ command: 'cockpit', args })

/** A prompt as herdr's `agent prompt` delivers it: typed origin, pastes expanded. */
export const submit = ($: any, text: string) => $.prompt.submit({ text, origin: { kind: 'composer' }, wait: false })
/** A subagent or peer hand-back. */
export const receive = ($: any, text: string) => $.session.receive({ origin: { kind: 'peer' }, text })
/** Claude running one Bash command. */
export const bash = ($: any, command: string) => $.tool.call({ tool: 'Bash', command, description: 'send', tool_use_id: 'toolu_s2' })
/** A main-loop turn ending with this answer, as Claude Code raises it. */
export const turnEnd = ($: any, answer: string, reason: 'answer' | 'aborted' = 'answer'): Promise<{ text: string; block?: string }> =>
  $.turn.complete({ answer, reason, durationMs: 1_000, isAborted: reason === 'aborted', turnId: 'turn-s5' })
