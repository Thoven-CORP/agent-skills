// register.ts: the shell. The only file that touches `$`.
//
// Validator rules this file is shaped by (docs/create.md "Check what Claude Code reads"):
//   - `$` may be passed only to functions declared at the top level of THIS file, so every effect
//     is a top-level `async function x($: Api, …)` here, and every other module is pure.
//   - every `on(...)` names its event as a string literal; one registration per event+matcher.
//
// Cost by role (the plugin loads in every session):
//   inert  (no HERDR_PANE_ID)  every hook returns next(e) after one comparison
//   pane                       S2 adds its regex over prompts; no timers, no processes
//   main   (claimed a space)   one 5 s heartbeat timer; all polling, projection, drawing
//
// Crash safety: every hook is one of two shapes, and the try/catch never wraps `next`:
//   observe-then-pass   try { await observe… } catch (err) { debug(err) }  return next(e)
//   pass-then-observe   const r = await next(e); try { … } catch (err) { debug(err) }  return r
// Every registration also gets `.catch(passThrough)`. The heartbeat catches per source, so one
// failing source never stops another.

import type { EngineInterface, Register } from 'claude-code'
import { project } from './board.ts'
import { findMe, focusReq, parseSnapshot, snapshotReq } from './herdr.ts'
import type { Board, Fact, FactKind, Intent, Main, Me, Ms, PaneId, PaneUi, Polled, SessionId, SourceId, Sources, SourceValues, World } from './model.ts'
import { HEARTBEAT_MS, SOURCES, due, settle, type PolledId, type Req, type Resp, type Source } from './sources.ts'
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
    try {
      await $.command.register({ name: 'cockpit', description: 'Open the Thoven cockpit for this herdr space', argumentHint: '[doctor]', immediate: true })
      sessionCwd = e.cwd
      await resolveMe($, (await $.session.id()) as SessionId)
    } catch (err) {
      await debug($, 'session.start', err)
    }
    return next(e)
  }).catch(passThrough)

  // Fires before session.start at startup (measured), and after /clear, /resume, /branch, compact.
  on('classic.SessionStart', async ($, e, next) => {
    const r = await next(e)
    try {
      if (e.cwd) sessionCwd = e.cwd
      await resolveMe($, e.session_id as SessionId)
      if (e.source === 'compact' && me.k === 'main') return { ...r, additionalContext: [...(r.additionalContext ?? []), await checkpointFor($)] }
    } catch (err) {
      await debug($, 'classic.SessionStart', err)
    }
    return r
  }).catch(passThrough)

  on('command.run', { command: 'cockpit' }, async ($, e) => {
    try {
      if (e.args.trim() === 'doctor') return { text: await doctor($) }
      return { text: await claimAndOpen($) }
    } catch (err) {
      await debug($, 'command.run', err)
      return { text: `Cockpit failed: ${messageOf(err)}` }
    }
  }).catch(passThrough)

  on('prompt.submit', async ($, e, next) => {
    try {
      if (me.k !== 'inert') await observePrompt($, e.text)
    } catch (err) {
      await debug($, 'prompt.submit', err)
    }
    return next(e)
  }).catch(passThrough)

  on('session.receive', async ($, e, next) => {
    try {
      if (me.k !== 'inert') await observePrompt($, e.text)
    } catch (err) {
      await debug($, 'session.receive', err)
    }
    return next(e)
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
  const claim = claimHeldBy(await loadFacts($, 'main'), pane)
  if (!claim) {
    stopHeartbeat()
    me = { k: 'pane', pane, sid, engagements: me.k === 'pane' ? me.engagements : [] }
    return
  }
  if (claim.sid !== sid) await writeFact($, { ...claim, sid })
  me = { k: 'main', pane, sid, space: claim.space, cwd: sessionCwd, home: (await $.env.get('HOME')) ?? '' }
  startHeartbeat($)
  $.clock.after(0, () => {
    void tick($)
  })
}

/**
 * `/cockpit`: claim this session's space (last claim wins, ADR3) and open the pane. The claim's
 * snapshot doubles as the first herdr poll, so the first tick does not read herdr again.
 */
async function claimAndOpen($: Api): Promise<string> {
  const envPane = await $.env.get('HERDR_PANE_ID')
  const sid = (await $.session.id()) as SessionId
  const resp = await perform($, snapshotReq())
  const snap = resp.k === 'ok' ? parseSnapshot(resp.text) : undefined
  if (!snap) return `Cockpit could not read herdr: ${resp.k === 'fail' ? resp.error : 'the snapshot has a shape this cockpit does not know'}.`
  const mine = findMe(snap, envPane, sid)
  if (!mine) return 'Cockpit needs a herdr pane, and this session is not in one.'

  const now = await $.clock.now()
  await writeFact($, { kind: 'main', space: mine.space, sid, pane: mine.pane, at: now })
  me = { k: 'main', pane: mine.pane, sid, space: mine.space, cwd: sessionCwd || mine.cwd, home: (await $.env.get('HOME')) ?? '' }
  sources = { ...sources, herdr: settle(sources.herdr, snap, now, '') }
  lastRun = { ...lastRun, herdr: now }
  isStoreTimed = false
  startHeartbeat($)
  await tick($)
  await $.ui.open({ id: PANE_ID, title: 'Cockpit', focus: true })
  return `Cockpit is main of ${snap.spaces.find((s) => s.space === mine.space)?.label ?? mine.space}.`
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
    const facts = await loadFacts($)
    const readMs = (await $.clock.now()) - t0
    if (!isStoreTimed || readMs > STORE_SLOW_MS) {
      isStoreTimed = true
      $.ui.log(`cockpit store: keys() and ${facts.length} facts read in ${readMs} ms`, { to: 'debug' })
    }

    if (claimOf(facts, main.space)?.pane !== main.pane) {
      await loseClaim($, main)
      return
    }
    const now = await $.clock.now()
    for (const id of due(lastRun, now)) await poll($, id, worldOf(main, now, facts))
    board = project(worldOf(main, now, facts))
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
    value = source.read(world, resps)
    const failed = resps.find((r) => r.k === 'fail')
    if (failed?.k === 'fail') error = failed.error
  } catch (err) {
    error = messageOf(err)
  }
  sources = { ...sources, [id]: settle(sources[id] as Polled<SourceValues[K]>, value, world.now, error) }
  lastRun = { ...lastRun, [id]: world.now }
}

/** The single executor. `$.process.run` and `$.fs.read` appear only here. */
async function perform($: Api, req: Req): Promise<Resp> {
  try {
    if (req.k === 'read') return { k: 'ok', text: await $.fs.read(req.path) }
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
async function loadFacts($: Api, only?: FactKind): Promise<Fact[]> {
  const infos = (await $.store.keys()).flatMap((key) => {
    const info = parseKey(key)
    return info && (only === undefined || info.kind === only) ? [{ key, info }] : []
  })
  const values = await Promise.all(infos.map(({ key }) => $.store.get(key)))
  return infos.flatMap(({ info }, i) => parseFact(info, values[i]) ?? [])
}

/** Whole value, writer-owned key: never get-then-set. */
async function writeFact($: Api, fact: Fact): Promise<void> {
  await $.store.set(keyOf(fact), fact)
}

async function observePrompt(_$: Api, _text: string): Promise<void> {
  throw new Error('not implemented (S2): reports, briefs and fix rounds')
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

async function checkpointFor(_$: Api): Promise<string> {
  throw new Error('not implemented (S5): compaction checkpoint')
}

async function doctor(_$: Api): Promise<string> {
  throw new Error('not implemented (S6): /cockpit doctor')
}

function worldOf(main: Main, now: Ms, facts: Fact[]): World {
  return { now, me: main, sources, facts, readbacks: new Map(), inFlight: new Set(), mainSkill: undefined }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
