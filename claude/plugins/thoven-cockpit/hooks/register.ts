// register.ts: the shell. The only file that touches `$`.
//
// Validator rules this file is shaped by (docs/create.md "Check what Claude Code reads"):
//   - `$` may be passed only to functions declared at the top level of THIS file, so every effect
//     is a top-level `async function x($: Api, …)` here, and every other module is pure.
//   - every `on(...)` names its event as a string literal; one registration per event+matcher.
//
// Cost by role (the plugin loads in every session):
//   inert  (no HERDR_PANE_ID)  every hook returns next(e) after one comparison
//   inert, pane (not engaged)  one regex per prompt, one substring test per Bash command; a store
//                              write only on a match. No timers, no processes
//   pane (engaged)             the same today; S3 and S5 add their observers here
//   main   (claimed a space)   one 5 s heartbeat timer; all polling, projection, drawing
//
// Crash safety: every hook is one of two shapes, and the try/catch never wraps `next`:
//   observe-then-pass   try { await observe… } catch (err) { debug(err) }  return next(e)
//   pass-then-observe   const r = await next(e); try { … } catch (err) { debug(err) }  return r
// Every registration also gets `.catch(passThrough)`. The heartbeat catches per source, so one
// failing source never stops another.

import type { EngineInterface, Register } from 'claude-code'
import { project } from './board.ts'
import { isVerdict, isWorthReading, readPrompt, sendCalls } from './dispatch.ts'
import { findMe, focusReq, parseSnapshot, snapshotReq, spaceOfPane } from './herdr.ts'
import type { Board, Fact, FactKind, Intent, Main, Me, Ms, PaneId, PaneUi, Polled, SessionId, SourceId, Sources, SourceValues, World } from './model.ts'
import { HEARTBEAT_MS, SOURCES, due, settle, type Listing, type PolledId, type Req, type Resp, type Source } from './sources.ts'
import { claimHeldBy, claimOf, keyOf, parseFact, parseKey } from './store.ts'
import { drawCockpit } from './view.ts'

type Api = EngineInterface

const PANE_ID = 'cockpit'
/** Synthesis A2: above this, facts move to per-session logs. Logged so the debug log shows it. */
const STORE_SLOW_MS = 50

// ── Module state: caches only. Everything here can be lost on reload and rebuilt in one tick. ──
let me: Me = { k: 'inert' }
let sources: Sources = {
  herdr: { k: 'never' },
  labels: { k: 'never' },
  spaces: { k: 'never' },
  heads: { k: 'never' },
  branches: { k: 'never' },
  origins: { k: 'never' },
  github: { k: 'never' },
  linear: { k: 'never' },
  inbox: { k: 'never' },
  codex: { k: 'never' },
}
let lastRun: Partial<Record<SourceId, Ms>> = {}
let board: Board | undefined
let heartbeat: { cancel(): void } | undefined
let isTicking = false
let isStoreTimed = false
let ui: PaneUi = { tab: 'work', selected: undefined }
let sessionCwd = ''

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    // Its own try: a register that throws (as a re-registration can) must not keep main dark.
    try {
      await $.command.register({ name: 'cockpit', description: 'Open the Thoven cockpit for this herdr space', immediate: true })
    } catch (err) {
      await debug($, 'command.register', err)
    }
    try {
      sessionCwd = e.cwd
      await resolveMe($, (await $.session.id()) as SessionId)
    } catch (err) {
      await debug($, 'session.start', err)
    }
    return next(e)
  }).catch(passThrough)

  // Fires before session.start at startup (measured), and after /clear, /resume, /branch, compact.
  // The compaction checkpoint arrives in S5.
  on('classic.SessionStart', async ($, e, next) => {
    const r = await next(e)
    try {
      if (e.cwd) sessionCwd = e.cwd
      await resolveMe($, e.session_id as SessionId)
    } catch (err) {
      await debug($, 'classic.SessionStart', err)
    }
    return r
  }).catch(passThrough)

  // A report, verdict or brief can reach any session: herdr's `agent prompt` arrives here (origin
  // composer, pastes expanded), and so does a typed paste.
  on('prompt.submit', async ($, e, next) => {
    try {
      await observePrompt($, e.text)
    } catch (err) {
      await debug($, 'prompt.submit', err)
    }
    return next(e)
  }).catch(passThrough)

  // A peer's or subagent's hand-back (synthesis A6). Writes are idempotent, so arriving here and in
  // prompt.submit as well costs one more set of the same key.
  on('session.receive', async ($, e, next) => {
    try {
      await observePrompt($, e.text)
    } catch (err) {
      await debug($, 'session.receive', err)
    }
    return next(e)
  }).catch(passThrough)

  // send.sh is how a brief or fix round reaches a pane. Observed after it ran: a refused or failed
  // call sent nothing.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const r = await next(e)
    try {
      if (!('deny' in r && r.deny !== undefined) && r.isError !== true) await observeBash($, (e as { command?: unknown }).command)
    } catch (err) {
      await debug($, 'tool.call', err)
    }
    return r
  }).catch(passThrough)

  // `/cockpit doctor` arrives in S6; until then every argument is ignored.
  on('command.run', { command: 'cockpit' }, async ($) => {
    try {
      return { text: await claimAndOpen($) }
    } catch (err) {
      await debug($, 'command.run', err)
      return { text: `Cockpit failed: ${messageOf(err)}` }
    }
  }).catch(passThrough)

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== PANE_ID) return next(e)
    try {
      return drawCockpit($.ui.resolve(e), board, ui, e.props.bodyColumns, (intent) => act($, intent))
    } catch (err) {
      await debug($, 'ui.render', err)
    }
    return next(e)
  }).catch(passThrough)

  // `f` acts on the row whose button holds the focus ring.
  on('ui.focus', async ($, e, next) => {
    try {
      const ticket = e.requestId === PANE_ID ? /^row-(THV-\d+)$/.exec(e.element ?? '')?.[1] : undefined
      if (ticket) ui = { ...ui, selected: ticket }
    } catch (err) {
      await debug($, 'ui.focus', err)
    }
    return next(e)
  }).catch(passThrough)
}

// ── Top-level effects. Each takes `$` and is the only code that performs its kind of effect. ──

/** The `.catch` for every registration. `next` is replay-safe here, so a hook that already called it is not run twice. */
async function passThrough(_$: Api, e: any, next: any): Promise<any> {
  return next(e)
}

async function debug($: Api, where: string, err: unknown): Promise<void> {
  try {
    $.ui.log(`cockpit ${where}: ${messageOf(err)}`, { to: 'debug' })
  } catch {
    // The debug log is the last resort; nothing is left to report a failure to.
  }
}

/**
 * Decide `me`. No HERDR_PANE_ID → inert. A claim whose pane is ours makes us main (its sid is
 * refreshed when /clear changed it) and starts the heartbeat; otherwise we are a pane session.
 * Idempotent, because classic.SessionStart and session.start both run it at startup.
 */
async function resolveMe($: Api, sid: SessionId): Promise<void> {
  const pane = (await $.env.get('HERDR_PANE_ID')) as PaneId | undefined
  if (!pane) {
    stopHeartbeat()
    me = { k: 'inert' }
    return
  }
  const claim = claimHeldBy((await loadFacts($, 'main')).facts, pane)
  if (!claim) {
    stopHeartbeat()
    me = { k: 'pane', pane, sid, engagements: me.k === 'pane' ? me.engagements : [] }
    return
  }
  if (claim.sid !== sid) await writeFact($, { ...claim, sid })
  me = { k: 'main', pane, sid, space: claim.space, cwd: sessionCwd, home: (await $.env.get('HOME')) ?? '', tmp: (await $.env.get('TMPDIR')) ?? '' }
  startHeartbeat($)
  $.clock.after(0, () => {
    void tick($)
  })
}

/**
 * `/cockpit`: claim this session's space (last claim wins, ADR3) and open the pane. The claim's
 * snapshot doubles as the first herdr poll, so the first tick does not read herdr again. With
 * herdr down, the space comes from HERDR_PANE_ID and the pane opens saying "herdr unavailable".
 */
async function claimAndOpen($: Api): Promise<string> {
  const envPane = await $.env.get('HERDR_PANE_ID')
  const sid = (await $.session.id()) as SessionId
  const resp = await perform($, snapshotReq())
  const snap = resp.k === 'ok' ? parseSnapshot(resp.text) : undefined
  const mine = snap ? findMe(snap, envPane, sid) : undefined
  const pane = mine?.pane ?? (snap ? undefined : (envPane as PaneId | undefined))
  const space = mine?.space ?? (snap ? undefined : spaceOfPane(envPane))
  if (!pane || !space) return 'Cockpit needs a herdr pane, and this session is not in one.'

  const now = await $.clock.now()
  await writeFact($, { kind: 'main', space, sid, pane, at: now })
  me = { k: 'main', pane, sid, space, cwd: sessionCwd || (mine?.cwd ?? ''), home: (await $.env.get('HOME')) ?? '', tmp: (await $.env.get('TMPDIR')) ?? '' }
  const error = resp.k === 'fail' ? resp.error : 'the snapshot has a shape this cockpit does not know'
  sources = { ...sources, herdr: settle(sources.herdr, snap, now, error) }
  lastRun = { ...lastRun, herdr: now }
  isStoreTimed = false
  startHeartbeat($)
  await tick($)
  await $.ui.open({ id: PANE_ID, title: 'Cockpit', focus: true })
  if (!snap) return `Cockpit is main of ${space}, but herdr is unavailable.`
  return `Cockpit is main of ${snap.spaces.find((s) => s.space === space)?.label ?? space}.`
}

function startHeartbeat($: Api): void {
  heartbeat ??= $.clock.every(HEARTBEAT_MS, () => {
    void tick($)
  })
}

function stopHeartbeat(): void {
  heartbeat?.cancel()
  heartbeat = undefined
}

/**
 * The heartbeat body. Skips while the previous tick still runs, so a hung source never stacks
 * ticks. Still main? → poll each due source → project → redraw.
 */
async function tick($: Api): Promise<void> {
  if (isTicking || me.k !== 'main') return
  isTicking = true
  try {
    const main: Main = me
    const t0 = await $.clock.now()
    const { facts, reads } = await loadFacts($)
    const readMs = (await $.clock.now()) - t0
    if (!isStoreTimed || readMs > STORE_SLOW_MS) {
      isStoreTimed = true
      $.ui.log(`cockpit store: keys() and ${reads} gets in ${readMs} ms`, { to: 'debug' })
    }

    if (claimOf(facts, main.space)?.pane !== main.pane) {
      await loseClaim($, main)
      return
    }
    const now = await $.clock.now()
    for (const id of due(lastRun, now)) await poll($, id, worldOf(main, now, facts))
    board = project(worldOf(main, now, facts))
    // Set once: the board lists only events with no `happened` fact in what this tick loaded.
    for (const e of board.newEvents) await writeFact($, { kind: 'happened', ticket: e.ticket, event: e.id, at: now })
    $.ui.invalidate('ui.render')
  } catch (err) {
    await debug($, 'tick', err)
  } finally {
    isTicking = false
  }
}

async function loseClaim($: Api, main: Main): Promise<void> {
  stopHeartbeat()
  me = { k: 'pane', pane: main.pane, sid: main.sid, engagements: [] }
  board = undefined
  await $.ui.close({ id: PANE_ID })
}

/** One source, one poll. A throw or an unusable answer marks this source stale and no other. */
async function poll<K extends PolledId>($: Api, id: K, world: World): Promise<void> {
  const source = SOURCES[id] as Source<SourceValues[K]>
  let value: SourceValues[K] | undefined
  let error = 'unreadable answer'
  try {
    const resps: Resp[] = []
    for (const req of source.plan(world)) resps.push(await perform($, req))
    for (const req of source.follow?.(world, resps) ?? []) resps.push(await perform($, req))
    value = source.read(world, resps)
    const failed = resps.find((r) => r.k === 'fail')
    if (failed?.k === 'fail') error = failed.error
  } catch (err) {
    error = messageOf(err)
  }
  sources = { ...sources, [id]: settle(sources[id] as Polled<SourceValues[K]>, value, world.now, error) }
  lastRun = { ...lastRun, [id]: world.now }
}

/** The single executor. `$.process.run`, `$.fs.read` and `$.fs.list` appear only here. */
async function perform($: Api, req: Req): Promise<Resp> {
  try {
    if (req.k === 'read') return { k: 'ok', text: await $.fs.read(req.path) }
    if (req.k === 'list') {
      // No folder yet means nothing was ever left undelivered, not a failed source.
      if (!(await $.fs.exists(req.path))) return { k: 'ok', text: '[]' }
      const listing: Listing = (await $.fs.list(req.path)).map((e) => ({ name: e.name, kind: e.kind, mtimeMs: e.mtimeMs }))
      return { k: 'ok', text: JSON.stringify(listing) }
    }
    const r = await $.process.run(req.argv, { timeoutMs: req.timeoutMs })
    const what = req.argv.slice(0, 3).join(' ')
    if (r.exitCode !== 0) return { k: 'fail', error: `${what} exited ${r.exitCode}: ${r.stderr.split('\n')[0] ?? ''}` }
    if (r.isStdoutTruncated) return { k: 'fail', error: `${what}: output truncated` }
    return { k: 'ok', text: r.stdout }
  } catch (err) {
    return { k: 'fail', error: messageOf(err) }
  }
}

/** Every `cockpit:` fact, or only one kind's. Values that do not validate are skipped, never thrown on. */
async function loadFacts($: Api, only?: FactKind): Promise<{ facts: Fact[]; reads: number }> {
  const infos = (await $.store.keys()).flatMap((key) => {
    const info = parseKey(key)
    return info && (only === undefined || info.kind === only) ? [{ key, info }] : []
  })
  const values = await Promise.all(infos.map(({ key }) => $.store.get(key)))
  return { facts: infos.flatMap(({ info }, i) => parseFact(info, values[i]) ?? []), reads: infos.length }
}

/**
 * A prompt or hand-back any session received. The regex is all a session pays for a prompt that
 * holds no status line and no brief. A brief ties this pane to its ticket and engages it; an inert
 * session (outside herdr) has no pane to tie, so it records only reports and verdicts (synthesis B2).
 */
async function observePrompt($: Api, text: unknown): Promise<void> {
  if (typeof text !== 'string' || !isWorthReading(text)) return
  const { briefs, lines, concerns } = readPrompt(text)
  if (briefs.length === 0 && lines.length === 0) return
  const sid = me.k === 'inert' ? ((await $.session.id()) as SessionId) : me.sid
  const at = await $.clock.now()
  for (const b of briefs) {
    if (me.k === 'inert') continue
    // A fix round lands on the same key as the first brief, so it carries that brief's playbook and title.
    const first = me.k === 'pane' ? me.engagements.find((x) => x.ticket === b.ticket) : undefined
    const playbook = b.playbook ?? first?.playbook
    const title = b.title ?? first?.title
    await writeFact($, {
      kind: 'brief',
      ticket: b.ticket,
      sid,
      pane: me.pane,
      role: b.role,
      round: b.round,
      ...(playbook === undefined ? {} : { playbook }),
      ...(title === undefined ? {} : { title }),
      at,
    })
    if (me.k === 'pane') me = { ...me, engagements: [...me.engagements.filter((x) => x.ticket !== b.ticket), { ...b, playbook, title }] }
  }
  for (const l of lines) {
    await writeFact(
      $,
      isVerdict(l.word)
        ? { kind: 'verdict', ticket: l.ticket, sid, verdict: l.word, text: l.line, at }
        : { kind: 'report', ticket: l.ticket, sid, status: l.word, text: l.line, concerns, at },
    )
  }
}

/** A Bash command this session ran. Only send.sh calls matter; send.sh itself needs HERDR_PANE_ID. */
async function observeBash($: Api, command: unknown): Promise<void> {
  if (me.k === 'inert' || typeof command !== 'string' || !command.includes('send.sh')) return
  const calls = sendCalls(command)
  if (calls.length === 0) return
  const at = await $.clock.now()
  for (const c of calls) await writeFact($, { kind: 'send', ...c, at })
}

/** Whole value, writer-owned key: never get-then-set. */
async function writeFact($: Api, fact: Fact): Promise<void> {
  await $.store.set(keyOf(fact), fact)
}

/** A press, as data. herdr focus runs from `$.clock.after(0)`, outside the press handler. */
async function act($: Api, intent: Intent): Promise<void> {
  try {
    switch (intent.k) {
      case 'tab':
        ui = { ...ui, tab: intent.tab }
        $.ui.invalidate('ui.render')
        return
      case 'focus-pane': {
        const req = focusReq(intent.pane)
        $.clock.after(0, () => {
          void focusPane($, req)
        })
        return
      }
      case 'open-report':
      case 'open-url':
      case 'fill':
        throw new Error(`not implemented (S2): ${intent.k}`)
      case 'update':
        throw new Error('not implemented (S4): update')
      default:
        return intent satisfies never
    }
  } catch (err) {
    await debug($, 'act', err)
  }
}

async function focusPane($: Api, req: Req): Promise<void> {
  const r = await perform($, req)
  if (r.k === 'fail') await debug($, 'focus', r.error)
}

function worldOf(main: Main, now: Ms, facts: Fact[]): World {
  return { now, me: main, sources, facts, readbacks: new Map(), inFlight: new Set(), mainSkill: undefined }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
