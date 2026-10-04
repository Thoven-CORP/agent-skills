// register.ts: the shell, and the only file that takes `$`. It wires every hook, and every effect
// is spelled here: store, processes, files, timers, the pane. main.ts runs main's heartbeat over
// closures this file builds (shellOf). What a hook or a poll saw means is decided elsewhere, in pure
// code: observe.ts, sources.ts, board.ts, view.ts.
//
// Validator rules this file is shaped by (docs/create.md "Check what Claude Code reads"):
//   - `$` is followed only into a function declared in this file, never across an import, so every
//     effect is a top-level `async function x($: Api, …)` here, and other modules get closures.
//   - every `on(...)` names its event as a string literal; one registration per event+matcher.
//
// Cost by role (the plugin loads in every session):
//   inert  (no HERDR_PANE_ID)  one regex per prompt and one substring test per Bash command; a
//                              store write only for a report or verdict. No timers, no processes
//   pane   (not main)          the same, and a brief, a send.sh call, a Review skill run (a `ran`
//                              while it holds no brief) and a verdict its own answer gave are
//                              written too; a send.sh in a space with no main makes it main (ADR3)
//   main   (claimed a space)   one 5 s heartbeat timer; all polling, projection, drawing
//
// Crash safety: every hook is one line over a shape below, and no try/catch wraps `next`:
//   observeThenPass   try { await observe() } catch (err) { debug(err) }  return next(e)
//   passThenObserve   const r = await next(e); try { await observe(r) } catch (err) { debug(err) }  return r
// Every registration also gets `.catch(passThrough)`. Each poll catches its own source's failure,
// so one failing or hung source never stops another.

import type { EngineInterface, Register, RenderElement } from 'claude-code'
import { CHECKPOINT_FRESH_MS, briefPath, briefsSent, builderTickets, checkpointOf, checkpointText, isWatching, rulingsFrom, sentLines, statusWarning, watcherWarning, type BackgroundTasks } from './background.ts'
import { readPrompt, sendCalls, statusLines } from './dispatch.ts'
import { answerSeen, bashSeen, promptSeen, readbackSeen, sendClaim, skillSeen, type Observer } from './observe.ts'
import { reviewSkill } from './review.ts'
import { LINEAR_URL, readbacks, type StateQuery } from './linear.ts'
import { claimHeldBy } from './facts.ts'
import { COMMANDS, type Req } from './commands.ts'
import { findMe, parseSnapshot, spaceOfPane } from './herdr.ts'
import { act, becomeMain, becomeOther, held, noteFocus, type Shell } from './main.ts'
import { isPaneId, isSessionId, messageOf, type Fact, type FactKind, type FactOf, type Main, type PaneId, type SessionId, type Snapshot } from './model.ts'
import { settle, type Ask, type Listing } from './sources.ts'
import { isCockpitKey, isFactKey, keyOf, parseFact } from './store.ts'
import { doctorText, drawCockpit } from './view.ts'
import { doctor } from './doctor.ts'
import type { Stored } from './expiry.ts'

type Api = EngineInterface

const PANE_ID = 'cockpit'
/** `/cockpit` answers within about this long, herdr up, down or hung. */
const CLAIM_SNAPSHOT_MS = 3_000

// ── Module state: caches only, like main.ts's `held`. ──
/** What main's `classic.Stop` saw, for the `turn.complete` that follows it about 200 ms later (spike check 4). */
let stopped: { watching: boolean } | undefined
/** Skills whose Skill tool call is open in this session's main loop, once per open call. */
const openSkillCalls: string[] = []

export const register: Register = (on) => {
  on('session.start', ($, e, next) => observeThenPass($, 'session.start', e, next, () => startSession($))).catch(passThrough)

  // Fires before session.start at startup (measured), and after /clear, /resume, /branch, compact.
  // After a compaction it hands main's checkpoint back as additionalContext (spike check 5).
  on('classic.SessionStart', ($, e, next) => sessionStarted($, e, next)).catch(passThrough)

  // Main writes its checkpoint before the summarizer runs; a subagent's compaction is not main's.
  on('session.compact', ($, e, next) => observeThenPass($, 'session.compact', e, next, () => (e.agentId === undefined ? writeCheckpoint($) : Promise.resolve()))).catch(passThrough)

  // Fires about 200 ms before turn.complete, and only it lists background tasks (spike check 4).
  on('classic.Stop', ($, e, next) => passThenObserve($, 'classic.Stop', e, next, async () => noteStop(e.background_tasks))).catch(passThrough)

  // A line under the answer, never a block (ADR8): the status-line warning in a builder pane, the watcher warning in main.
  on('turn.complete', ($, e, next) => endTurn($, e, next)).catch(passThrough)

  // A report, verdict or brief can reach any session: herdr's `agent prompt` arrives here (origin
  // composer, pastes expanded), and so does a typed paste.
  on('prompt.submit', ($, e, next) => observeThenPass($, 'prompt.submit', e, next, () => notePrompt($, e.text))).catch(passThrough)

  // A peer's or subagent's hand-back (synthesis A6). Writes are idempotent, so arriving here and in
  // prompt.submit as well costs one more set of the same key.
  on('session.receive', ($, e, next) => observeThenPass($, 'session.receive', e, next, () => notePrompt($, e.text))).catch(passThrough)

  // send.sh is how a brief or fix round reaches a pane. Observed after it ran: a refused or failed
  // call sent nothing.
  on('tool.call', { tool: 'Bash' }, ($, e, next) => passThenObserve($, 'tool.call', e, next, (r) => noteBash($, r, e.command))).catch(passThrough)

  // A Review skill this session runs (S3). A typed `/skill` fires skill.prompt alone. A model's
  // Skill call fires skill.prompt inside tool.call{Skill}, and only the call's result says whether
  // it ran read-only, so while the call is open skill.prompt leaves that skill to it.
  on('skill.prompt', ($, e, next) => observeThenPass($, 'skill.prompt', e, next, () => noteSkillPrompt($, e))).catch(passThrough)
  on('tool.call', { tool: 'Skill' }, ($, e, next) => passThenObserve($, 'tool.call', e, (ev) => holdSkill(e.skill, () => next(ev)), (r) => noteSkillCall($, r, e))).catch(passThrough)

  // `/cockpit doctor` reports; any other argument is ignored and opens the cockpit.
  on('command.run', { command: 'cockpit' }, ($, e) => runCockpit($, e.args)).catch(passThrough)

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

// ── Top-level effects. Each takes `$` and is the only code that performs its kind of effect. ──

/**
 * Pass on, then add one line under the answer when this turn needs it, and note the status lines
 * the answer gave. A line other than the answer is what Claude Code shows beneath it, so a hook
 * beneath that already added one keeps it.
 */
async function endTurn<E extends { answer: string; reason: string; agentId?: string }, R extends { text: string }>($: Api, e: E, next: (e: E) => Promise<R>): Promise<R> {
  const r = await next(e)
  if (e.agentId !== undefined) return r
  try {
    await noteReadbacks($, e.answer)
  } catch (err) {
    await debug($, 'turn.complete', err)
  }
  const stop = stopped
  stopped = undefined
  let warning: string | undefined
  try {
    if (e.reason === 'answer') warning = await noteAnswer($, e.answer, stop)
  } catch (err) {
    await debug($, 'turn.complete', err)
  }
  if (warning === undefined) return r
  return { ...r, text: r.text === e.answer ? warning : `${r.text}\n${warning}` }
}

/** Pass on, then decide `me`, and after a compaction add the checkpoint main wrote for it. */
async function sessionStarted<E extends { session_id: string; source: string }, R extends { additionalContext?: string[] }>($: Api, e: E, next: (e: E) => Promise<R>): Promise<R> {
  const r = await next(e)
  let back: string | undefined
  try {
    const sid = await sessionId($)
    await resolveMe($, sid)
    if (e.source === 'compact') back = await checkpointBack($, [sid, e.session_id])
  } catch (err) {
    await debug($, 'classic.SessionStart', err)
  }
  return back === undefined ? r : { ...r, additionalContext: [...(r.additionalContext ?? []), back] }
}

/** The `.catch` for every registration. `next` is replay-safe here, so a hook that already called it is not run twice. */
async function passThrough<E, R>(_$: Api, e: E, next: (e: E) => Promise<R>): Promise<R> {
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
  await resolveMe($, await sessionId($))
}

/** `/cockpit`. It has no `next`, so a failure is the answer. */
async function runCockpit($: Api, args: string): Promise<{ text: string }> {
  try {
    if (args.trim() === 'doctor') return { text: await doctorAnswer($) }
    return { text: await claimAndOpen($) }
  } catch (err) {
    await debug($, 'command.run', err)
    return { text: `Cockpit failed: ${messageOf(err)}` }
  }
}

/** The cockpit pane, or what is beneath when drawing it threw. */
async function drawOrPass<E extends Parameters<Api['ui']['resolve']>[0] & { props: { bodyColumns: number } }, R>($: Api, e: E, next: (e: E) => Promise<R>): Promise<RenderElement | R> {
  try {
    return drawCockpit($.ui.resolve(e), held.main?.board, held.ui, e.props.bodyColumns, (intent) => act(shellOf($), intent))
  } catch (err) {
    await debug($, 'ui.render', err)
  }
  return next(e)
}

/**
 * Decide `me`. No HERDR_PANE_ID → inert. A claim whose pane is ours makes us main (its sid is
 * refreshed when /clear changed it); otherwise we are a pane session.
 * Safe to repeat, because classic.SessionStart and session.start both run it at startup.
 */
async function resolveMe($: Api, sid: SessionId): Promise<void> {
  const pane = await envPane($)
  const claim = pane ? claimHeldBy(await loadFacts($, 'main'), pane) : undefined
  if (claim) {
    if (claim.sid !== sid) await writeFact($, { ...claim, sid })
    becomeMain(shellOf($), { ...claim, sid }, await placeOf($))
    return
  }
  await becomeOther(shellOf($), pane ? { k: 'pane', pane, sid, engagements: held.me.k === 'pane' ? held.me.engagements : [] } : { k: 'inert' })
}

/**
 * `/cockpit`: claim this session's space (last claim wins, ADR3) and open the pane. One snapshot,
 * bounded by CLAIM_SNAPSHOT_MS, is all it waits for: it doubles as the first herdr poll, and the
 * first tick runs after the answer. With herdr down, the space comes from HERDR_PANE_ID and the
 * pane opens saying "herdr unavailable".
 */
async function claimAndOpen($: Api): Promise<string> {
  const herePane = await envPane($)
  const sid = await sessionId($)
  let snap: Snapshot | undefined
  let error = 'the snapshot has a shape this cockpit does not know'
  try {
    snap = parseSnapshot(await runProc($, COMMANDS['herdr api snapshot'](CLAIM_SNAPSHOT_MS)))
  } catch (err) {
    error = messageOf(err)
  }
  const mine = snap ? findMe(snap, herePane, sid) : undefined
  const pane = mine?.pane ?? (snap ? undefined : herePane)
  const space = mine?.space ?? (snap ? undefined : spaceOfPane(herePane))
  if (!pane || !space) return 'Cockpit needs a herdr pane, and this session is not in one.'

  const now = await $.clock.now()
  const claim: FactOf<'main'> = { kind: 'main', space, sid, pane, at: now }
  await writeFact($, claim)
  becomeMain(shellOf($), claim, await placeOf($), settle({ k: 'never' }, snap, now, error))
  await $.ui.open({ id: PANE_ID, title: 'Cockpit', focus: true })
  if (!snap) return `Cockpit is main of ${space}, but herdr is unavailable.`
  return `Cockpit is main of ${snap.spaces.find((s) => s.space === space)?.label ?? space}.`
}

/** Main's state before a compaction, with the RULINGS of every brief it sent for a ticket on the board. A brief file gone is skipped. */
async function writeCheckpoint($: Api): Promise<void> {
  const m = held.main
  if (!m?.board) return
  const board = m.board
  const sent = briefsSent(await loadFacts($, 'send'), board)
  const texts = await Promise.all(sent.map((s) => readFile($, briefPath(m.who.tmp, s.file)).catch(() => undefined)))
  await writeFact($, checkpointOf(await sessionId($), board, rulingsFrom(sent, texts), await $.clock.now()))
}

/** The checkpoint written for this compaction, as text. One older than CHECKPOINT_FRESH_MS was written for another. */
async function checkpointBack($: Api, sids: readonly string[]): Promise<string | undefined> {
  const now = await $.clock.now()
  const mine = (await loadFacts($, 'checkpoint')).flatMap((f) => (f.kind === 'checkpoint' && sids.includes(f.sid) && now - f.at <= CHECKPOINT_FRESH_MS ? [f] : []))
  const c = mine.reduce<(typeof mine)[number] | undefined>((a, f) => (a === undefined || f.at > a.at ? f : a), undefined)
  if (!c) return undefined
  const d = new Date(c.at)
  return checkpointText(c, `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
}

/** Main's Stop: is a watcher armed? Only main warns, so a pane keeps nothing. */
function noteStop(tasks: BackgroundTasks): void {
  stopped = held.main ? { watching: isWatching(tasks) } : undefined
}

/**
 * The line this turn ends with, if any, after recording what a pane's answer gave (answerSeen).
 * Main: panes working and no watch.sh at its Stop. A pane holding a builder brief: no status line
 * for a ticket it holds. Inert pays nothing per answer.
 */
async function noteAnswer($: Api, answer: string, stop: { watching: boolean } | undefined): Promise<string | undefined> {
  if (held.main) return stop === undefined ? undefined : watcherWarning(held.main.board?.working ?? [], stop.watching)
  if (held.me.k !== 'pane') return undefined
  const sid = held.me.sid
  const lines = statusLines(answer)
  const briefs = await loadBriefs($)
  const tickets = builderTickets(briefs, sid)
  if (lines.length > 0) await record($, answerSeen, { lines, briefs, ran: tickets.length === 0 ? await loadRan($) : [] })
  return tickets.length > 0 && sentLines(tickets, lines).length === 0 ? statusWarning(tickets) : undefined
}

/** `/cockpit doctor`: read only, in any session. */
async function doctorAnswer($: Api): Promise<string> {
  const pane = await envPane($)
  const report = doctor({
    now: await $.clock.now(),
    stored: await loadStored($),
    space: held.main?.who.space ?? spaceOfPane(pane),
    pane: held.main?.who.pane ?? pane,
    board: held.main?.board,
    plugin: { root: $.plugin.root, env: await $.env.get('CLAUDE_CODE_PLUGIN_DIRS'), home: (await $.env.get('HOME')) ?? '' },
  })
  return doctorText(report)
}

/** Every `cockpit:` key and its raw value, parsed or not. */
async function loadStored($: Api): Promise<Stored[]> {
  const keys = (await $.store.keys()).filter(isCockpitKey)
  const values = await Promise.all(keys.map((key) => $.store.get(key)))
  return keys.map((key, i) => ({ key, value: values[i] }))
}

/** The reads one poll may make, over `$`. Each throws when its read fails. */
function askOf($: Api): Ask {
  return {
    proc: (req) => runProc($, req),
    read: (path) => readFile($, path),
    list: (path) => listDir($, path),
    linear: (body, key) => postLinear($, body, key),
  }
}

/** main.ts's effects, as closures over `$`, which crosses no import. */
function shellOf($: Api): Shell {
  return {
    ask: askOf($),
    proc: (req) => runProc($, req),
    now: () => $.clock.now(),
    loadFacts: (only) => loadFacts($, only),
    loadStored: () => loadStored($),
    writeFact: (fact) => writeFact($, fact),
    deleteKey: (key) => $.store.delete(key),
    every: (ms, run) => $.clock.every(ms, run),
    after: (ms, run) => {
      $.clock.after(ms, run)
    },
    redraw: () => $.ui.invalidate('ui.render'),
    closePane: () => $.ui.close({ id: PANE_ID }),
    workspace: async (args) => {
      await $.command.run({ command: 'workspace', args })
    },
    debug: (where, err) => debug($, where, err),
  }
}

/** Where main works and writes, read as it claims. */
async function placeOf($: Api): Promise<Pick<Main, 'cwd' | 'home' | 'tmp'>> {
  return { cwd: await $.session.cwd(), home: (await $.env.get('HOME')) ?? '', tmp: (await $.env.get('TMPDIR')) ?? '' }
}

/**
 * `$.http.fetch` appears only here, and only with the body linear.ts builds. The key rides the
 * header and nothing else: no error message, fact or log line carries it.
 */
async function postLinear($: Api, body: StateQuery, key: string): Promise<string> {
  let r: Awaited<ReturnType<Api['http']['fetch']>>
  try {
    r = await $.http.fetch(LINEAR_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: key }, body: JSON.stringify(body) })
  } catch (err) {
    throw new Error(`Linear unreachable: ${messageOf(err).split(key).join('[key]')}`)
  }
  if (!r.ok) throw new Error(`Linear API ${r.status}`)
  return r.text
}

/** `$.process.run` appears only here. A process that exits non-zero or truncates its output throws. */
async function runProc($: Api, req: Req): Promise<string> {
  const r = await $.process.run(req.argv, { timeoutMs: req.timeoutMs })
  const what = req.argv.slice(0, 3).join(' ')
  if (r.exitCode !== 0) throw new Error(`${what} exited ${r.exitCode}: ${r.stderr.split('\n')[0] ?? ''}`)
  if (r.isStdoutTruncated) throw new Error(`${what}: output truncated`)
  return r.stdout
}

/** `$.fs.read` appears only here. */
async function readFile($: Api, path: string): Promise<string> {
  return $.fs.read(path)
}

/** `$.fs.list` appears only here. No folder yet means nothing was ever left undelivered, not a failed source. */
async function listDir($: Api, path: string): Promise<Listing> {
  if (!(await $.fs.exists(path))) return []
  return (await $.fs.list(path)).map((e) => ({ name: e.name, kind: e.kind, mtimeMs: e.mtimeMs }))
}

/** The herdr pane this session runs in, branded once here. */
async function envPane($: Api): Promise<PaneId | undefined> {
  const pane = await $.env.get('HERDR_PANE_ID')
  return isPaneId(pane) ? pane : undefined
}

/** This session's id, branded once here. `/clear` changes it, so read it fresh each time. */
async function sessionId($: Api): Promise<SessionId> {
  const sid = await $.session.id()
  if (!isSessionId(sid)) throw new Error('this session has no id')
  return sid
}

/** Every `cockpit:` fact, or only one kind's. Values that do not validate are skipped, never thrown on. */
async function loadFacts($: Api, only?: FactKind): Promise<Fact[]> {
  const keys = (await $.store.keys()).filter((key) => isFactKey(key, only))
  const values = await Promise.all(keys.map((key) => $.store.get(key)))
  return keys.flatMap((key, i) => parseFact(key, values[i]) ?? [])
}

/** A prompt or hand-back any session received. The regex is all a session pays for a prompt that holds no status line and no brief. */
async function notePrompt($: Api, text: unknown): Promise<void> {
  const read = typeof text === 'string' ? readPrompt(text) : undefined
  if (read) await record($, promptSeen, read)
  await noteReadbacks($, text)
}

/** Read-back lines main saw. Only main hands events to `/workspace update`, so no other session reads for them. */
async function noteReadbacks($: Api, text: unknown): Promise<void> {
  if (held.me.k !== 'main' || typeof text !== 'string') return
  const lines = readbacks(text)
  if (lines.length > 0) await record($, readbackSeen, lines)
}

/** A Bash command this session ran. A refused or failed call sent nothing. */
async function noteBash($: Api, r: object, command: unknown): Promise<void> {
  if ('deny' in r && r.deny !== undefined) return
  // set-status.js prints its read-back and exits 1 on an ERROR line, so stdout is read before isError.
  if ('result' in r && typeof r.result === 'object' && r.result !== null && 'stdout' in r.result) await noteReadbacks($, r.result.stdout)
  if (('isError' in r && r.isError === true) || typeof command !== 'string') return
  const calls = sendCalls(command)
  if (calls.length === 0) return
  await record($, bashSeen, calls)
  if (held.me.k === 'pane') await claimBySend($)
}

/** The first send.sh in a space no session holds makes this session its main. It claims only: `/cockpit` opens the pane. */
async function claimBySend($: Api): Promise<void> {
  const claim = sendClaim(held.me, await loadFacts($, 'main'), await $.clock.now())
  if (!claim) return
  await writeFact($, claim)
  becomeMain(shellOf($), claim, await placeOf($))
}

/** A loop's event carries `agentId` only inside a subagent or teammate: their skills are not this session's. */
const isSubagent = (e: object): boolean => 'agentId' in e && e.agentId !== undefined

/** Mark a Skill call open while it runs. `finally`, not a try: the call's failure still reaches the caller. */
function holdSkill<R>(skill: unknown, run: () => Promise<R>): Promise<R> {
  const name = typeof skill === 'string' ? skill : ''
  openSkillCalls.push(name)
  return run().finally(() => {
    openSkillCalls.splice(openSkillCalls.indexOf(name), 1)
  })
}

async function noteSkillPrompt($: Api, e: { skill: string }): Promise<void> {
  if (isSubagent(e) || openSkillCalls.includes(e.skill)) return
  await noteSkill($, e.skill)
}

/** A Skill call that answered, ran in this loop, and did not run read-only (`isReadOnly`, or the Skill's own `readOnly`). */
async function noteSkillCall($: Api, r: object, e: object): Promise<void> {
  if (isSubagent(e) || !('skill' in e) || typeof e.skill !== 'string') return
  if (('deny' in r && r.deny !== undefined) || ('isError' in r && r.isError === true) || ('isReadOnly' in r && r.isReadOnly === true)) return
  const result = 'result' in r ? r.result : undefined
  if (typeof result === 'object' && result !== null && (('readOnly' in result && result.readOnly === true) || ('success' in result && result.success === false))) return
  await noteSkill($, e.skill)
}

/** A Review skill, recorded against the briefs this session holds. Any other skill costs one regex. */
async function noteSkill($: Api, name: string): Promise<void> {
  const skill = reviewSkill(name)
  if (skill === undefined || held.me.k === 'inert') return
  await record($, skillSeen, { skill, briefs: await loadBriefs($) })
}

async function loadBriefs($: Api): Promise<Array<FactOf<'brief'>>> {
  return (await loadFacts($, 'brief')).flatMap((f) => (f.kind === 'brief' ? [f] : []))
}

async function loadRan($: Api): Promise<Array<FactOf<'ran'>>> {
  return (await loadFacts($, 'ran')).flatMap((f) => (f.kind === 'ran' ? [f] : []))
}

/** Run a pure observer on what a hook saw, keep its `me`, and write its facts. */
async function record<I>($: Api, observer: Observer<I>, input: I): Promise<void> {
  const sid = held.me.k === 'inert' ? (await sessionId($)) : held.me.sid
  const at = await $.clock.now()
  // Read and replace `me` in one synchronous step, so a resolveMe between the awaits is not undone.
  const seen = observer(held.me, input, sid, at)
  held.me = seen.me
  for (const fact of seen.facts) await writeFact($, fact)
}

/** Whole value, writer-owned key: never get-then-set. */
async function writeFact($: Api, fact: Fact): Promise<void> {
  await $.store.set(keyOf(fact), fact)
}
