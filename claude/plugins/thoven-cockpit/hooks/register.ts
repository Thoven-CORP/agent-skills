// register.ts: the shell. The only file that touches `$`.
//
// Validator rules this file is shaped by (docs/create.md "Check what Claude Code reads"):
//   - `$` may be passed only to functions declared at the top level of THIS file, so every effect
//     is a top-level `async function x($: Api, …)` here, and every other module is pure.
//   - every `on(...)` names its event as a string literal; one registration per event+matcher.
//
// Cost by role (the plugin loads in every session):
//   inert  (no HERDR_PANE_ID)  every hook returns next(e) after one comparison
//   pane   (briefed or not)    a regex over prompt / tool input / answer; a store.set only when
//                              something matched. No timers, no processes.
//   main   (claimed a space)   one 5 s heartbeat timer; all polling, projection, drawing
//
// Crash safety: every hook is one of two shapes, and the try/catch never wraps `next`:
//   observe-then-pass   try { await observe… } catch (err) { debug(err) }  return next(e)
//   pass-then-observe   const r = await next(e); try { … } catch (err) { debug(err) }  return r
// Every registration also gets `.catch(passThrough)` as the last line of defence. The heartbeat
// body catches per source, so gh failing never stops herdr. No loop runs without an await.

import type { EngineInterface, Register, RenderElement } from 'claude-code'
import type { Fact, Intent, Me, Ms, PaneUi, Pending, SessionId, SourceId, Sources, StatusLine, World, Board } from './model.ts'
import type { Req, Resp } from './sources.ts'

type Api = EngineInterface

const PANE_ID = 'cockpit'

// ── Module state: caches only. Everything here can be lost on reload and rebuilt in one tick. ──
let me = { k: 'inert' } as Me // widened: assigned only in resolveMe()
let sources: Sources = { herdr: { k: 'never' }, spaces: { k: 'never' }, github: { k: 'never' }, linear: { k: 'never' }, inbox: { k: 'never' }, codex: { k: 'never' } }
let lastRun: Partial<Record<SourceId, Ms>> = {}
let board: Board | undefined
let heartbeat: { cancel(): void } | undefined
let isTicking = false
let ui: PaneUi = { tab: 'work', selected: undefined }
/** Pane sessions: status lines seen in this turn's tool inputs, for the status-line warning. */
let turnLines: StatusLine[] = []
/** Pane sessions: skills run before any engagement, flushed to `ran:` facts when one starts. */
let unflushedSkills: Array<{ skill: string; at: Ms }> = []
/** Main: classic.Stop's background task commands, read by the turn.complete that follows. */
let lastBackground: string[] = []
/** Main: the /workspace update the current turn is running, from turn.start. */
let updateTurn: { turnId: string; pending: Pending[] } | undefined
let inFlight = new Set<string>()
let readbacks: World['readbacks'] = new Map()
let mainSkill: string | undefined
/** Main: ADR9 "only on change". Lost on reload, so a reload re-pushes once (idempotent). */
let pushedLabels = new Map<string, string>()

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    try {
      // TODO $.command.register({ name: 'cockpit', description: 'Open the cockpit; /cockpit doctor', argumentHint: '[doctor]', immediate: true })
      // TODO await resolveMe($, await $.session.id())
    } catch (err) { await debug($, 'session.start', err) }
    return next(e)
  }).catch(passThrough)

  // Fires before session.start at startup (measured), and after /clear, /resume, /branch, compact.
  on('classic.SessionStart', async ($, e, next) => {
    const r = await next(e)
    try {
      // TODO await resolveMe($, e.session_id)   // /clear changes the sid; the pane does not change
      // TODO if (e.source === 'compact' && me.k === 'main') return { ...r, additionalContext: [...(r.additionalContext ?? []), await checkpointFor($)] }
    } catch (err) { await debug($, 'classic.SessionStart', err) }
    return r
  }).catch(passThrough)

  on('command.run', { command: 'cockpit' }, async ($, e) => {
    try {
      // TODO e.args === 'doctor' → return { text: await doctor($) }
      // TODO return { text: await claimAndOpen($, 'explicit') }   // ADR3: /cockpit takes the space
    } catch (err) { await debug($, 'command.run', err) }
    return { text: 'cockpit: could not open (see debug log)' }
  }).catch(passThrough)

  // Reports, briefs, fix rounds: whichever session receives one records it.
  on('prompt.submit', async ($, e, next) => {
    try { if (me.k !== 'inert') await observePrompt($, e.text) } catch (err) { await debug($, 'prompt.submit', err) }
    return next(e)
  }).catch(passThrough)

  // Peer and subagent hand-backs may arrive here rather than as a prompt; same grammar.
  on('session.receive', async ($, e, next) => {
    try { if (me.k !== 'inert') await observePrompt($, e.text) } catch (err) { await debug($, 'session.receive', err) }
    return next(e)
  }).catch(passThrough)

  on('tool.call', { tool: ['Bash', 'Write'] }, async ($, e, next) => {
    const r = await next(e)
    try {
      // TODO if (me.k === 'inert' || e.agentId) return r
      // TODO Bash: dispatch.sendCalls(e.command) → if any: claim-if-vacant, write `send:` facts (main only)
      // TODO pane: turnLines.push(...dispatch.statusLines(Bash command or Write content))
    } catch (err) { await debug($, 'tool.call', err) }
    return r
  }).catch(passThrough)

  // A model-invoked skill: skill.prompt already wrote `ran:`; mark it read-only if the result says so.
  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    const r = await next(e)
    try { /* TODO if (r.isReadOnly && me.k === 'pane') rewrite ran:<sid>:<skill> with isReadOnly: true */ } catch (err) { await debug($, 'tool.call Skill', err) }
    return r
  }).catch(passThrough)

  on('skill.prompt', async ($, e, next) => {
    try {
      // TODO if (me.k === 'main') mainSkill = e.skill
      // TODO if (me.k === 'pane' && !('agentId' in e)) engaged ? write ran fact : unflushedSkills.push(...)
    } catch (err) { await debug($, 'skill.prompt', err) }
    return next(e)
  }).catch(passThrough)

  // Main: learn which /workspace update this turn runs (typed by Andres or sent by ↻).
  on('turn.start', async ($, e, next) => {
    try { /* TODO if (me.k === 'main') updateTurn = linear.parseUpdateCommand(e.text) → { turnId, pending } */ } catch (err) { await debug($, 'turn.start', err) }
    return next(e)
  }).catch(passThrough)

  on('classic.Stop', async ($, e, next) => {
    try { if (me.k === 'main') lastBackground = [] /* TODO e.background_tasks.map(t => t.command) */ } catch (err) { await debug($, 'classic.Stop', err) }
    return next(e)
  }).catch(passThrough)

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    try {
      // TODO if (e.agentId) return r
      // TODO main: if updateTurn?.turnId === e.turnId → acks + readbacks from linear.parseReadback(e.answer); clear inFlight
      // TODO main: text = notes.watcherWarning(board.working, lastBackground)
      // TODO pane: lines = statusLines(e.answer) ∪ turnLines → `sent:` facts; text = notes.statusLineWarning(...)
      // TODO return text ? { ...r, text: join(r.text, text) } : r     // ADR8: never { block }
    } catch (err) { await debug($, 'turn.complete', err) }
    return r
  }).catch(passThrough)

  on('session.compact', async ($, e, next) => {
    try { /* TODO if (me.k === 'main' && !e.agentId) await writeFact($, checkpoint fact) */ } catch (err) { await debug($, 'session.compact', err) }
    return next(e)
  }).catch(passThrough)

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== PANE_ID) return next(e)
    try {
      // TODO const el = $.ui.resolve(e); return view.drawCockpit(el, board, ui, e.props.bodyColumns, (i) => { void act($, i) })
    } catch (err) { await debug($, 'ui.render', err) }
    return next(e)
  }).catch(passThrough)

  // `f` and `o` act on the row whose button has focus.
  on('ui.focus', async ($, e, next) => {
    try { /* TODO if the focused key is `row-THV-n`, ui.selected = THV-n */ } catch (err) { await debug($, 'ui.focus', err) }
    return next(e)
  }).catch(passThrough)
}

// ── Top-level effects. Each takes `$` and is the only code that performs its kind of effect. ──

/** The `.catch` for every registration: give the event back untouched. */
async function passThrough($: Api, e: any, next: any): Promise<any> {
  throw new Error('not implemented') // TODO return next.called ? undefined : next(e)
}

/** `$.ui.log(…, { to: 'debug' })`. Never the transcript, never throws. */
async function debug($: Api, where: string, err: unknown): Promise<void> {
  throw new Error('not implemented')
}

/**
 * Decide `me`. No HERDR_PANE_ID → inert. Otherwise read `main:*` keys: a claim whose pane is
 * ours makes us main (refresh its sid if /clear changed it) and starts the heartbeat; else pane,
 * rehydrating engagements from our own `brief:*:<sid>` keys. Idempotent: running it twice is free.
 */
async function resolveMe($: Api, sid: SessionId): Promise<void> {
  throw new Error('not implemented')
}

/**
 * Claim this session's space and open the pane.
 *   explicit (/cockpit): always claims (last claim wins, ADR3).
 *   vacant (first send.sh): claims only if no claim exists or the claimant's pane left the snapshot.
 * One `herdr api snapshot` finds our space. Starts the heartbeat, runs one tick, opens the pane
 * (`focus: true` only for explicit).
 */
async function claimAndOpen($: Api, how: 'explicit' | 'vacant'): Promise<string> {
  throw new Error('not implemented')
}

/**
 * The heartbeat body (every HEARTBEAT_MS, main only). Skips if the previous tick is still running.
 *   1. still main? (re-read main:<space>; if another session claimed, stop and close the pane)
 *   2. for each due source in SOURCES order: plan → perform each Req → read → fresh | stale
 *   3. facts = loadFacts (keys → parseKey → isRelevant → get → parseFact)
 *   4. board = project(world); $.ui.invalidate('ui.render')
 *   5. label push for changed records (ADR9); 5-minute sweep (store.sweep)
 */
async function tick($: Api): Promise<void> {
  throw new Error('not implemented')
}

/** The single executor. `$.process.run`, `$.http.fetch`, `$.fs.read`, `$.fs.list` appear only here. */
async function perform($: Api, req: Req): Promise<Resp> {
  throw new Error('not implemented')
}

async function loadFacts($: Api, world: World): Promise<Array<{ key: string; fact: Fact }>> {
  throw new Error('not implemented')
}

/** `$.store.set(keyOf(fact), fact)`. Whole value, writer-owned key: never get-then-set. */
async function writeFact($: Api, fact: Fact): Promise<void> {
  throw new Error('not implemented')
}

/**
 * Whichever session receives a prompt: readPrompt(text) →
 *   briefs → `brief:` facts, engagements += briefs, flush unflushedSkills as `ran:` facts
 *   lines  → `report:` / `verdict:` facts (this session is the receiver)
 */
async function observePrompt($: Api, text: string): Promise<void> {
  throw new Error('not implemented')
}

/**
 * Perform an Intent from a press. `update` is the only one that starts a turn, and
 * `$.command.run` is refused inside a hook the turn waits on (THV-1057 check 1), so it goes
 * through `$.clock.after(0, …)`: `$.command.run({ command: 'workspace', args: updateArgs(p) })`.
 * The call queues until idle; pressing twice queues twice and /workspace update skips moves made.
 * `fill` uses `$.prompt.fill({ text, mode: 'replace' })`: Andres reads it and presses Enter.
 */
async function act($: Api, intent: Intent): Promise<void> {
  throw new Error('not implemented')
}

async function checkpointFor($: Api): Promise<string> {
  throw new Error('not implemented')
}

async function doctor($: Api): Promise<string> {
  throw new Error('not implemented')
}
