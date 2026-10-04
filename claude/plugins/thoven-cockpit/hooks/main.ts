// main.ts: what main does on its own. The heartbeat tick, each source's poll, the projection and
// draw, the label push, the expiry pass, and a press in the pane.
//
// The validator follows `$` only into a function declared in the file that holds it, never across
// an import, so nothing here takes `$`. register.ts hands each function a `Shell` instead (its
// `shellOf`), and every `$` call is still spelled there. What a poll or a draw means stays pure:
// sources.ts, board.ts, expiry.ts, background.ts.

import { labelRecords, recordKey } from './background.ts'
import { project } from './board.ts'
import { COMMANDS, type Req } from './commands.ts'
import { EXPIRY_PASS_MS, expired, keptBy, type Stored } from './expiry.ts'
import { claimOf } from './facts.ts'
import { linearEntries, updateArgs } from './linear.ts'
import { messageOf, type Board, type Fact, type FactKind, type FactOf, type Intent, type Main, type Me, type Ms, type PaneId, type PaneUi, type Pending, type SourceId, type Sources, type SourceValues, type World } from './model.ts'
import { BY_ID, HEARTBEAT_MS, STAGES, due, settle, unpolled, valueOf, type Ask, type Seen } from './sources.ts'

/** The effects main performs, each a closure over `$` that register.ts builds. */
export type Shell = {
  /** The reads a poll makes. */
  ask: Ask
  /** Run a process that changes herdr: the label push and the pane focus. */
  proc(req: Req): Promise<string>
  now(): Promise<Ms>
  loadFacts(only?: FactKind): Promise<Fact[]>
  loadStored(): Promise<Stored[]>
  writeFact(fact: Fact): Promise<void>
  deleteKey(key: string): Promise<void>
  every(ms: Ms, run: () => void): { cancel(): void }
  after(ms: Ms, run: () => void): void
  /** Draw the cockpit pane again. */
  redraw(): void
  closePane(): Promise<void>
  /** Hand these arguments to `/workspace update`. */
  workspace(args: string): Promise<void>
  debug(where: string, err: unknown): Promise<void>
}

/** What only main holds. becomeMain builds it fresh and becomeOther drops it, so a re-claim polls every source at once. */
type MainState = {
  who: Main
  sources: Sources
  lastRun: Partial<Record<SourceId, Ms>>
  /** Sources whose poll has not settled. A source never overlaps itself, and a hung one holds up no other. */
  polling: Set<SourceId>
  board: Board | undefined
  heartbeat: { cancel(): void }
  /** When the last expiry pass ran; undefined runs one on the first tick that drew. */
  expiredAt: Ms | undefined
  /** The label record last pushed to each pane, so a push happens only on change (ADR9). */
  pushed: Map<PaneId, string>
}

// ── Module state: caches only. Everything here can be lost on reload and rebuilt in one tick. ──
/**
 * Who this session is, main's state while it holds the claim, and the pane's selection. Every role
 * change is becomeMain or becomeOther; register.ts's `record` only keeps what an observer saw.
 */
export const held: { me: Me; main: MainState | undefined; ui: PaneUi } = {
  me: { k: 'inert' },
  main: undefined,
  ui: { tab: 'work', selected: undefined, selectedPr: undefined, checks: undefined },
}

/**
 * The one way into main: fresh state, a heartbeat, and the first tick started, never awaited.
 * `herdr` is a snapshot the caller already read at `claim.at`, so that tick does not read it again.
 */
export function becomeMain(sh: Shell, claim: FactOf<'main'>, place: Pick<Main, 'cwd' | 'home' | 'tmp'>, herdr?: Sources['herdr']): void {
  held.main?.heartbeat.cancel()
  // A re-resolve on the same pane (compaction, /clear) keeps what herdr was told, so nothing is re-pushed.
  const pushed = held.main?.who.pane === claim.pane ? held.main.pushed : new Map<PaneId, string>()
  const who: Main = { k: 'main', pane: claim.pane, sid: claim.sid, space: claim.space, ...place }
  const heartbeat = sh.every(HEARTBEAT_MS, () => {
    void tick(sh)
  })
  held.me = who
  const sources = herdr ? { ...unpolled(), herdr } : unpolled()
  held.main = { who, sources, lastRun: herdr ? { herdr: claim.at } : {}, polling: new Set(), board: undefined, heartbeat, expiredAt: undefined, pushed }
  void tick(sh)
}

/** The one way to any role but main. A session that held main stops its heartbeat and closes its pane. */
export async function becomeOther(sh: Shell, next: Exclude<Me, Main>): Promise<void> {
  const m = held.main
  held.me = next
  if (!m) return
  m.heartbeat.cancel()
  held.main = undefined
  await sh.closePane()
}

/**
 * The heartbeat body. Still main? → poll the due sources stage by stage → draw. Ticks may
 * overlap: a source still polling from an earlier tick is skipped, so a hung `gh` holds up only
 * the tick that started it, and the next tick polls and draws everything else.
 */
async function tick(sh: Shell): Promise<void> {
  const m = held.main
  if (!m) return
  try {
    if (claimOf(await sh.loadFacts('main'), m.who.space)?.pane !== m.who.pane) {
      if (held.main === m) await becomeOther(sh, { k: 'pane', pane: m.who.pane, sid: m.who.sid, engagements: [] })
      return
    }
    const now = await sh.now()
    for (const stage of STAGES) {
      const ids = due(m.lastRun, now, seenOf(m, now)).filter((id) => stage.includes(id) && !m.polling.has(id))
      await Promise.all(ids.map((id) => poll(sh, m, id, now)))
    }
    if (held.main === m) await draw(sh)
    if (m.board && held.main === m && (m.expiredAt === undefined || now - m.expiredAt >= EXPIRY_PASS_MS)) {
      m.expiredAt = now
      await expire(sh, m, now)
    }
    await pushLabels(sh, m)
  } catch (err) {
    await sh.debug('tick', err)
  }
}

/** ADR9: each Build or Review pane's whole record, sent only when it differs from the last one sent. A failed push is retried next tick. */
async function pushLabels(sh: Shell, m: MainState): Promise<void> {
  if (!m.board || held.main !== m) return
  for (const [pane, label] of labelRecords(m.board)) {
    const key = recordKey(label)
    if (m.pushed.get(pane) === key) continue
    m.pushed.set(pane, key)
    try {
      await sh.proc(COMMANDS['herdr pane report-metadata'](pane, label))
    } catch (err) {
      if (m.pushed.get(pane) === key) m.pushed.delete(pane)
      await sh.debug('label push', err)
    }
  }
}

/**
 * Delete what expiry.ts names. Only a delete: no value is written back, so no other session's key
 * is ever read and then rewritten.
 */
async function expire(sh: Shell, m: MainState, now: Ms): Promise<void> {
  const board = m.board
  if (!board) return
  const gone = expired(await sh.loadStored(), { now, prs: valueOf(m.sources.github)?.prs, linear: linearEntries(m.sources), ...keptBy(board) })
  for (const { key } of gone) await sh.deleteKey(key)
}

/**
 * One draw at a time in this session, not per MainState: after a re-claim the old main's draw and
 * the new one's never both write.
 */
const drawing = { isRunning: false, isAgain: false }

/**
 * Project and redraw the current main, from facts loaded now: two overlapping ticks never write one
 * `happened` twice, and a tick that waited on a hung source draws no stale facts. A draw asked for
 * while one runs is run once it ends, so a poll that settled meanwhile is drawn at once.
 */
async function draw(sh: Shell): Promise<void> {
  if (drawing.isRunning) {
    drawing.isAgain = true
    return
  }
  drawing.isRunning = true
  try {
    do {
      drawing.isAgain = false
      const m = held.main
      if (!m) return
      const facts = await sh.loadFacts()
      const now = await sh.now()
      const board = project(worldOf(m, now, facts))
      m.board = board
      // Set once: the board lists only events with no `happened` fact in what this draw loaded.
      for (const e of board.newEvents) await sh.writeFact({ kind: 'happened', ticket: e.ticket, event: e.id, at: now })
      sh.redraw()
    } while (drawing.isAgain)
  } finally {
    drawing.isRunning = false
  }
}

/** One source, one poll. A throw or an unusable answer marks this source stale and no other. */
async function poll<K extends SourceId>(sh: Shell, m: MainState, id: K, now: Ms): Promise<void> {
  const source = BY_ID[id]
  m.polling.add(id)
  let value: SourceValues[K] | undefined
  let error = 'unreadable answer'
  try {
    value = await source.run(seenOf(m, now), sh.ask)
  } catch (err) {
    error = messageOf(err)
  }
  m.sources = { ...m.sources, [id]: settle(m.sources[id], value, now, error) }
  m.lastRun[id] = now
  m.polling.delete(id)
}

/** The focused element's key: `row-THV-n` selects a row, `pr-owner/name#n` a PR. */
export function noteFocus(element: string): void {
  const ticket = /^row-(THV-\d+)$/.exec(element)?.[1]
  const pr = /^pr-(.+#\d+)$/.exec(element)?.[1]
  if (ticket) held.ui = { ...held.ui, selected: ticket }
  if (pr) held.ui = { ...held.ui, selectedPr: pr }
}

/** A press, as data. herdr focus runs from a timer, outside the press handler. */
export async function act(sh: Shell, intent: Intent): Promise<void> {
  try {
    switch (intent.k) {
      case 'tab':
        held.ui = { ...held.ui, tab: intent.tab }
        sh.redraw()
        return
      case 'focus-pane': {
        const req = COMMANDS['herdr agent focus'](intent.pane)
        sh.after(0, () => {
          void focusPane(sh, req)
        })
        return
      }
      case 'checks':
        held.ui = { ...held.ui, checks: held.ui.checks === intent.pr ? undefined : intent.pr }
        sh.redraw()
        return
      case 'update': {
        const args = updateArgs(intent.pending)
        if (args === undefined) return
        // ADR5: a press handler is inside a hook the turn may wait on, so the call runs from a timer.
        sh.after(0, () => {
          void sendUpdate(sh, args, intent.pending)
        })
        return
      }
      default:
        return intent satisfies never
    }
  } catch (err) {
    await sh.debug('act', err)
  }
}

/** Hand the events to `/workspace update`, then record each as sent. It queues while a turn runs and resolves once submitted. */
async function sendUpdate(sh: Shell, args: string, pending: readonly Pending[]): Promise<void> {
  try {
    await sh.workspace(args)
    const at = await sh.now()
    for (const p of pending) await sh.writeFact({ kind: 'update', ticket: p.ticket, event: p.id, at })
    await draw(sh)
  } catch (err) {
    await sh.debug('update', err)
  }
}

async function focusPane(sh: Shell, req: Req): Promise<void> {
  try {
    await sh.proc(req)
  } catch (err) {
    await sh.debug('focus', err)
  }
}

/** What a source reads: main, the sources, the time, and the board last drawn, which names the tickets on screen. */
function seenOf(m: MainState, now: Ms): Seen {
  return { now, me: m.who, sources: m.sources, board: m.board }
}

function worldOf(m: MainState, now: Ms, facts: Fact[]): World {
  return { now, me: m.who, sources: m.sources, facts }
}
