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
// Crash safety: every hook is one line over a shape below, and no try/catch wraps `next`:
//   observeThenPass   try { await observe() } catch (err) { debug(err) }  return next(e)
//   passThenObserve   const r = await next(e); try { await observe(r) } catch (err) { debug(err) }  return r
//   passThenExtend    the same, returning what `extend(r)` gave (S5)
// Every registration also gets `.catch(passThrough)`. The heartbeat catches per source, so one
// failing source never stops another.

import type { EngineInterface, Register, RenderElement } from 'claude-code'
import { project } from './board.ts'
import { readPrompt, sendCalls } from './dispatch.ts'
import { claimHeldBy, claimOf } from './facts.ts'
import { COMMANDS, type Req } from './commands.ts'
import { findMe, parseSnapshot, spaceOfPane } from './herdr.ts'
import { VERDICTS, isOneOf, type Board, type Engagement, type Fact, type FactKind, type FactOf, type Intent, type Main, type Me, type Ms, type PaneId, type PaneUi, type Polled, type SessionId, type SourceId, type Sources, type SourceValues, type World } from './model.ts'
import { HEARTBEAT_MS, SOURCES, due, settle, unpolled, type Answer, type Ask, type Listing, type Source } from './sources.ts'
import { isFactKey, keyOf, parseFact } from './store.ts'
import { drawCockpit } from './view.ts'

type Api = EngineInterface

const PANE_ID = 'cockpit'
/** `/cockpit` answers within about this long, herdr up, down or hung. */
const CLAIM_SNAPSHOT_MS = 3_000
/** Synthesis A2: above this, facts move to per-session logs. Logged so the debug log shows it. */
const STORE_SLOW_MS = 50

/** What only main holds. becomeMain builds it fresh and loseClaim drops it, so a re-claim polls every source at once. */
type MainState = {
  who: Main
  sources: Sources
  lastRun: Partial<Record<SourceId, Ms>>
  board: Board | undefined
  heartbeat: { cancel(): void }
  isTicking: boolean
  isStoreTimed: boolean
}

// ── Module state: caches only. Everything here can be lost on reload and rebuilt in one tick. ──
let me: Me = { k: 'inert' }
let main: MainState | undefined
let ui: PaneUi = { tab: 'work', selected: undefined, selectedPr: undefined, checks: undefined }

export const register: Register = (on) => {
  on('session.start', ($, e, next) => observeThenPass($, 'session.start', e, next, () => startSession($))).catch(passThrough)

  // Fires before session.start at startup (measured), and after /clear, /resume, /branch, compact.
  // The compaction checkpoint arrives in S5.
  on('classic.SessionStart', ($, e, next) => passThenObserve($, 'classic.SessionStart', e, next, () => resolveMe($, e.session_id as SessionId))).catch(passThrough)

  // A report, verdict or brief can reach any session: herdr's `agent prompt` arrives here (origin
  // composer, pastes expanded), and so does a typed paste.
  on('prompt.submit', ($, e, next) => observeThenPass($, 'prompt.submit', e, next, () => observePrompt($, e.text))).catch(passThrough)

  // A peer's or subagent's hand-back (synthesis A6). Writes are idempotent, so arriving here and in
  // prompt.submit as well costs one more set of the same key.
  on('session.receive', ($, e, next) => observeThenPass($, 'session.receive', e, next, () => observePrompt($, e.text))).catch(passThrough)

  // send.sh is how a brief or fix round reaches a pane. Observed after it ran: a refused or failed
  // call sent nothing.
  on('tool.call', { tool: 'Bash' }, ($, e, next) => passThenObserve($, 'tool.call', e, next, (r) => observeBash($, r, (e as { command?: unknown }).command))).catch(passThrough)

  // `/cockpit doctor` arrives in S6; until then every argument is ignored.
  on('command.run', { command: 'cockpit' }, ($) => runCockpit($)).catch(passThrough)

  on('ui.render', { component: 'Pane' }, ($, e, next) => (e.requestId === PANE_ID ? drawOrPass($, e, next) : next(e))).catch(passThrough)

  // `f` acts on the row whose button holds the focus ring, and `c` on the PR whose button does.
  on('ui.focus', ($, e, next) => observeThenPass($, 'ui.focus', e, next, async () => noteFocus(e.requestId === PANE_ID ? (e.element ?? '') : ''))).catch(passThrough)
}

// ── The hook shapes. `next` is never inside a try, so the cockpit never hides a failure beneath it. ──

/** Observe, then pass on. A failing observer is logged and the event goes on untouched. */
async function observeThenPass<E, R>($: Api, where: string, e: E, next: (e: E) => Promise<R>, observe: () => Promise<void>): Promise<R> {
  try {
    await observe()
  } catch (err) {
    await debug($, where, err)
  }
  return next(e)
}

/** Pass on, then observe what came back. A failing observer is logged and the result returned untouched. */
async function passThenObserve<E, R>($: Api, where: string, e: E, next: (e: E) => Promise<R>, observe: (r: R) => Promise<void>): Promise<R> {
  const r = await next(e)
  try {
    await observe(r)
  } catch (err) {
    await debug($, where, err)
  }
  return r
}

/** Pass on, then add to what came back (S5's compaction checkpoint). A failing `extend` returns the result untouched. */
async function passThenExtend<E, R>($: Api, where: string, e: E, next: (e: E) => Promise<R>, extend: (r: R) => Promise<R>): Promise<R> {
  const r = await next(e)
  try {
    return await extend(r)
  } catch (err) {
    await debug($, where, err)
  }
  return r
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

/** Register `/cockpit`, then decide `me`. Its own try: a register that throws (as a re-registration can) must not keep main dark. */
async function startSession($: Api): Promise<void> {
  try {
    await $.command.register({ name: 'cockpit', description: 'Open the Thoven cockpit for this herdr space', immediate: true })
  } catch (err) {
    await debug($, 'command.register', err)
  }
  await resolveMe($, (await $.session.id()) as SessionId)
}

/** `/cockpit`. It has no `next`, so a failure is the answer. */
async function runCockpit($: Api): Promise<{ text: string }> {
  try {
    return { text: await claimAndOpen($) }
  } catch (err) {
    await debug($, 'command.run', err)
    return { text: `Cockpit failed: ${messageOf(err)}` }
  }
}

/** The cockpit pane, or what is beneath when drawing it threw. */
async function drawOrPass<E extends Parameters<Api['ui']['resolve']>[0] & { props: { bodyColumns: number } }, R>($: Api, e: E, next: (e: E) => Promise<R>): Promise<RenderElement | R> {
  try {
    return drawCockpit($.ui.resolve(e), main?.board, ui, e.props.bodyColumns, (intent) => act($, intent))
  } catch (err) {
    await debug($, 'ui.render', err)
  }
  return next(e)
}

/** The focused element's key: `row-THV-n` selects a row, `pr-owner/name#n` a PR. */
function noteFocus(element: string): void {
  const ticket = /^row-(THV-\d+)$/.exec(element)?.[1]
  const pr = /^pr-(.+#\d+)$/.exec(element)?.[1]
  if (ticket) ui = { ...ui, selected: ticket }
  if (pr) ui = { ...ui, selectedPr: pr }
}

/**
 * Decide `me`. No HERDR_PANE_ID → inert. A claim whose pane is ours makes us main (its sid is
 * refreshed when /clear changed it); otherwise we are a pane session.
 * Safe to repeat, because classic.SessionStart and session.start both run it at startup.
 */
async function resolveMe($: Api, sid: SessionId): Promise<void> {
  const pane = (await $.env.get('HERDR_PANE_ID')) as PaneId | undefined
  const claim = pane ? claimHeldBy((await loadFacts($, 'main')).facts, pane) : undefined
  if (claim) {
    if (claim.sid !== sid) await writeFact($, { ...claim, sid })
    await becomeMain($, { ...claim, sid }, await $.session.cwd())
    return
  }
  await loseClaim($)
  me = pane ? { k: 'pane', pane, sid, engagements: me.k === 'pane' ? me.engagements : [] } : { k: 'inert' }
}

/**
 * The one way into main: fresh state, a heartbeat, and the first tick started, never awaited.
 * `herdr` is a snapshot the caller already read at `claim.at`, so that tick does not read it again.
 */
async function becomeMain($: Api, claim: FactOf<'main'>, cwd: string, herdr?: Sources['herdr']): Promise<void> {
  main?.heartbeat.cancel()
  const who: Main = { k: 'main', pane: claim.pane, sid: claim.sid, space: claim.space, cwd, home: (await $.env.get('HOME')) ?? '', tmp: (await $.env.get('TMPDIR')) ?? '' }
  const heartbeat = $.clock.every(HEARTBEAT_MS, () => {
    void tick($)
  })
  me = who
  const sources = herdr ? { ...unpolled(), herdr } : unpolled()
  main = { who, sources, lastRun: herdr ? { herdr: claim.at } : {}, board: undefined, heartbeat, isTicking: false, isStoreTimed: false }
  void tick($)
}

/**
 * `/cockpit`: claim this session's space (last claim wins, ADR3) and open the pane. One snapshot,
 * bounded by CLAIM_SNAPSHOT_MS, is all it waits for: it doubles as the first herdr poll, and the
 * first tick runs after the answer. With herdr down, the space comes from HERDR_PANE_ID and the
 * pane opens saying "herdr unavailable".
 */
async function claimAndOpen($: Api): Promise<string> {
  const envPane = await $.env.get('HERDR_PANE_ID')
  const sid = (await $.session.id()) as SessionId
  const resp = await runProc($, COMMANDS['herdr api snapshot'](CLAIM_SNAPSHOT_MS))
  const snap = resp.k === 'ok' ? parseSnapshot(resp.value) : undefined
  const mine = snap ? findMe(snap, envPane, sid) : undefined
  const pane = mine?.pane ?? (snap ? undefined : (envPane as PaneId | undefined))
  const space = mine?.space ?? (snap ? undefined : spaceOfPane(envPane))
  if (!pane || !space) return 'Cockpit needs a herdr pane, and this session is not in one.'

  const now = await $.clock.now()
  const claim: FactOf<'main'> = { kind: 'main', space, sid, pane, at: now }
  await writeFact($, claim)
  const error = resp.k === 'fail' ? resp.error : 'the snapshot has a shape this cockpit does not know'
  await becomeMain($, claim, await $.session.cwd(), settle({ k: 'never' }, snap, now, error))
  await $.ui.open({ id: PANE_ID, title: 'Cockpit', focus: true })
  if (!snap) return `Cockpit is main of ${space}, but herdr is unavailable.`
  return `Cockpit is main of ${snap.spaces.find((s) => s.space === space)?.label ?? space}.`
}

/**
 * The heartbeat body. Skips while the previous tick still runs, so a hung source never stacks
 * ticks. Still main? → poll each due source → project → redraw.
 */
async function tick($: Api): Promise<void> {
  const m = main
  if (!m || m.isTicking) return
  m.isTicking = true
  try {
    const t0 = await $.clock.now()
    const { facts, reads } = await loadFacts($)
    const readMs = (await $.clock.now()) - t0
    if (!m.isStoreTimed || readMs > STORE_SLOW_MS) {
      m.isStoreTimed = true
      $.ui.log(`cockpit store: keys() and ${reads} gets in ${readMs} ms`, { to: 'debug' })
    }

    if (claimOf(facts, m.who.space)?.pane !== m.who.pane) {
      if (main === m) await loseClaim($)
      return
    }
    const now = await $.clock.now()
    for (const id of due(m.lastRun, now)) await poll($, m, id, worldOf(m, now, facts))
    const board = project(worldOf(m, now, facts))
    m.board = board
    // Set once: the board lists only events with no `happened` fact in what this tick loaded.
    for (const e of board.newEvents) await writeFact($, { kind: 'happened', ticket: e.ticket, event: e.id, at: now })
    $.ui.invalidate('ui.render')
  } catch (err) {
    await debug($, 'tick', err)
  } finally {
    m.isTicking = false
  }
}

/** The one way out of main. A session that is not main does nothing. */
async function loseClaim($: Api): Promise<void> {
  if (!main) return
  main.heartbeat.cancel()
  me = { k: 'pane', pane: main.who.pane, sid: main.who.sid, engagements: [] }
  main = undefined
  await $.ui.close({ id: PANE_ID })
}

/** One source, one poll. A throw or an unusable answer marks this source stale and no other. */
async function poll<K extends SourceId>($: Api, m: MainState, id: K, world: World): Promise<void> {
  const source = SOURCES[id] as Source<SourceValues[K]>
  const answers: Array<Promise<Answer<unknown>>> = []
  let value: SourceValues[K] | undefined
  let error = 'unreadable answer'
  try {
    value = await source.run(world, askOf($, answers))
    const failed = (await Promise.all(answers)).find((a) => a.k === 'fail')
    if (failed?.k === 'fail') error = failed.error
  } catch (err) {
    error = messageOf(err)
  }
  m.sources = { ...m.sources, [id]: settle(m.sources[id] as Polled<SourceValues[K]>, value, world.now, error) }
  m.lastRun[id] = world.now
}

/** The reads one poll may make, over `$`. Each answer is kept in `answers`, in the order asked, so the poll can name the first failure. */
function askOf($: Api, answers: Array<Promise<Answer<unknown>>>): Ask {
  const kept = <T>(answer: Promise<Answer<T>>): Promise<Answer<T>> => {
    answers.push(answer)
    return answer
  }
  return {
    proc: (req) => kept(runProc($, req)),
    read: (path) => kept(readFile($, path)),
    list: (path) => kept(listDir($, path)),
  }
}

/** `$.process.run` appears only here. */
async function runProc($: Api, req: Req): Promise<Answer<string>> {
  try {
    const r = await $.process.run(req.argv, { timeoutMs: req.timeoutMs })
    const what = req.argv.slice(0, 3).join(' ')
    if (r.exitCode !== 0) return { k: 'fail', error: `${what} exited ${r.exitCode}: ${r.stderr.split('\n')[0] ?? ''}` }
    if (r.isStdoutTruncated) return { k: 'fail', error: `${what}: output truncated` }
    return { k: 'ok', value: r.stdout }
  } catch (err) {
    return { k: 'fail', error: messageOf(err) }
  }
}

/** `$.fs.read` appears only here. */
async function readFile($: Api, path: string): Promise<Answer<string>> {
  try {
    return { k: 'ok', value: await $.fs.read(path) }
  } catch (err) {
    return { k: 'fail', error: messageOf(err) }
  }
}

/** `$.fs.list` appears only here. No folder yet means nothing was ever left undelivered, not a failed source. */
async function listDir($: Api, path: string): Promise<Answer<Listing>> {
  try {
    if (!(await $.fs.exists(path))) return { k: 'ok', value: [] }
    return { k: 'ok', value: (await $.fs.list(path)).map((e) => ({ name: e.name, kind: e.kind, mtimeMs: e.mtimeMs })) }
  } catch (err) {
    return { k: 'fail', error: messageOf(err) }
  }
}

/** Every `cockpit:` fact, or only one kind's. Values that do not validate are skipped, never thrown on. */
async function loadFacts($: Api, only?: FactKind): Promise<{ facts: Fact[]; reads: number }> {
  const keys = (await $.store.keys()).filter((key) => isFactKey(key, only))
  const values = await Promise.all(keys.map((key) => $.store.get(key)))
  return { facts: keys.flatMap((key, i) => parseFact(key, values[i]) ?? []), reads: keys.length }
}

/**
 * A prompt or hand-back any session received. The regex is all a session pays for a prompt that
 * holds no status line and no brief. A brief ties this pane to its ticket and engages it; an inert
 * session (outside herdr) has no pane to tie, so it records only reports and verdicts (synthesis B2).
 */
async function observePrompt($: Api, text: unknown): Promise<void> {
  if (typeof text !== 'string') return
  const read = readPrompt(text)
  if (read === undefined || (read.k === 'brief' && me.k === 'inert')) return
  const sid = me.k === 'inert' ? ((await $.session.id()) as SessionId) : me.sid
  const at = await $.clock.now()
  if (read.k === 'brief') {
    if (me.k === 'inert') return
    const b = read.brief
    const before = me.k === 'pane' ? me.engagements.find((x) => x.ticket === b.ticket) : undefined
    const labelKind = b.k === 'first' ? b.labelKind : before?.labelKind
    const title = (b.k === 'first' ? b.title : undefined) ?? before?.title
    const held: Engagement = { ...b, ...(labelKind === undefined ? {} : { labelKind }), ...(title === undefined ? {} : { title }) }
    await writeFact($, { kind: 'brief', ...held, sid, pane: me.pane, at })
    if (me.k === 'pane') me = { ...me, engagements: [...me.engagements.filter((x) => x.ticket !== b.ticket), held] }
    return
  }
  for (const l of read.lines) {
    await writeFact(
      $,
      isOneOf(VERDICTS)(l.word)
        ? { kind: 'verdict', ticket: l.ticket, sid, verdict: l.word, text: l.line, at }
        : { kind: 'report', ticket: l.ticket, sid, status: l.word, text: l.line, concerns: l.concerns, at },
    )
  }
}

/** A Bash command this session ran, with its result. Only a send.sh call that ran matters; send.sh itself needs HERDR_PANE_ID. */
async function observeBash($: Api, r: object, command: unknown): Promise<void> {
  if (('deny' in r && r.deny !== undefined) || ('isError' in r && r.isError === true)) return
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
        const req = COMMANDS['herdr agent focus'](intent.pane)
        $.clock.after(0, () => {
          void focusPane($, req)
        })
        return
      }
      case 'checks':
        ui = { ...ui, checks: ui.checks === intent.pr ? undefined : intent.pr }
        $.ui.invalidate('ui.render')
        return
      case 'open-report':
        throw new Error('not implemented (S2): open-report')
      case 'open-url':
      case 'fill':
        throw new Error(`not implemented (S4): ${intent.k}`)
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
  const r = await runProc($, req)
  if (r.k === 'fail') await debug($, 'focus', r.error)
}

function worldOf(m: MainState, now: Ms, facts: Fact[]): World {
  return { now, me: m.who, sources: m.sources, facts, readbacks: new Map(), inFlight: new Set(), mainSkill: undefined }
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
