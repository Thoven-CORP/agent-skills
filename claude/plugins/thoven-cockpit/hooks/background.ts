// background.ts: what the cockpit does around the board rather than on it (S5). Pure: register.ts
// reads the store and files, runs herdr, and returns the warnings this file words.
//
//   checkpoint   main's state before a compaction, built from its board and the RULINGS of the
//                briefs it sent, stored at `checkpoint:<sid>`, handed back after (spike check 5)
//   status line  a builder pane's turn that ends with no status line gets a line under it (ADR8)
//   watcher      main's turn that ends with panes working and no watch.sh gets a line under it
//   labels       the record main pushes to herdr for each Build or Review pane (ADR9)

import { rulingsOf, ticket } from './dispatch.ts'
import { PANE_STATUSES, REPORT_STATUSES, isOneOf, isPaneId, isSessionId, type Board, type Checkpoint, type Fact, type FactOf, type Group, type Ms, type PaneId, type PaneStatus, type ReportStatus, type Row, type SessionId, type StatusLine, type Ticket } from './model.ts'

const REPORT_WORDS = REPORT_STATUSES.join(', ')

const rowsOf = (g: Group): Row[] => (g.k === 'single' ? [g.row] : g.children)
const livePanes = (r: Row): PaneId[] => (r.panes.k === 'live' ? r.panes.list.map((p) => p.pane) : [])

// ── The status-line warning (ADR8) ──────────────────────────────────────────────────────────

/** The tickets this session holds a builder brief for: a first brief as builder, or a fix round, which brief.md sends the builder. */
export function builderTickets(facts: readonly Fact[], sid: SessionId): Ticket[] {
  const held = facts.flatMap((f) => (f.kind === 'brief' && f.sid === sid && (f.k === 'fix' || f.role === 'builder') ? [f.ticket] : []))
  return [...new Set(held)]
}

/** The report lines of a turn's answer for tickets the session holds. A verdict is a verifier's word, so it is not one. */
export function sentLines(held: readonly Ticket[], lines: readonly StatusLine[]): Array<StatusLine & { word: ReportStatus }> {
  return lines.flatMap((l) => (held.includes(l.ticket) && isOneOf(REPORT_STATUSES)(l.word) ? [{ ...l, word: l.word }] : []))
}

/** The line under a builder's answer that sent main nothing to read. */
export function statusWarning(held: readonly Ticket[]): string {
  return `Cockpit: this turn ended with no status line, so main has nothing to act on. End with ${REPORT_WORDS} ${held.join(', ')} as brief.md REPORT says.`
}

// ── The watcher warning ─────────────────────────────────────────────────────────────────────

/** `classic.Stop` `background_tasks`, as the hook hands it. A Monitor task has no `command`, so its description is read too. */
export type BackgroundTasks = ReadonlyArray<{ readonly command?: string; readonly description: string }> | undefined

export function isWatching(tasks: BackgroundTasks): boolean {
  return (tasks ?? []).some((t) => /\bwatch\.sh\b/.test(`${t.command ?? ''}\n${t.description}`))
}

/** The line under main's answer when panes work and nothing would wake main if one stalls. */
export function watcherWarning(working: readonly PaneId[], watching: boolean): string | undefined {
  if (watching || working.length === 0) return undefined
  const n = working.length === 1 ? '1 pane is' : `${working.length} panes are`
  return `Cockpit: ${n} working (${working.join(', ')}) and no watch.sh is running. Arm scripts/watch.sh ${working.join(' ')} in the background, or nothing wakes this session if one stalls.`
}

// ── The label push (ADR9) ───────────────────────────────────────────────────────────────────

/**
 * What the cockpit tells herdr about one pane, always whole: herdr replaces a source's record on
 * every report, so a label left out is a label cleared. `display_agent` is never part of it.
 */
export type LabelRecord = { title: string; states: ReadonlyArray<{ status: PaneStatus; text: string }> }

const clip = (text: string, max: number): string => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

/** The Report cell as one word or two: `DONE`, `NEEDS_CONTEXT unsent`. A row with no report says nothing. */
function reportWord(r: Row): string | undefined {
  const c = r.cells.report
  if (c.k === 'in') return c.status
  if (c.k === 'undelivered') return `${c.status} unsent`
  if (c.k === 'escalation') return 'escalated'
  return undefined
}

const fixWord = (r: Row): string | undefined => (r.cells.fix.k === 'round' ? `fix ${r.cells.fix.round}/${r.cells.fix.of}` : undefined)

/** One label per row, or one per ticket when several rows share the pane: `THV-843 DONE, THV-847 BLOCKED`. */
function joined(rows: readonly Row[], word: (r: Row) => string | undefined): string | undefined {
  const parts = rows.flatMap((r) => {
    const w = word(r)
    return w === undefined ? [] : [rows.length > 1 ? `${r.ticket} ${w}` : w]
  })
  return parts.length > 0 ? clip(parts.join(', '), 60) : undefined
}

/**
 * The record for every pane holding a Build or Review row, main's own "this session" pane aside.
 * The title is label.sh's `<Kind> · <title> (THV-n …)`. When the pane is idle or done its state
 * label is the row's Report status; while it works, its fix round, when it is in one.
 */
export function labelRecords(board: Board): ReadonlyMap<PaneId, LabelRecord> {
  const byPane = new Map<PaneId, Row[]>()
  for (const r of board.build.flatMap(rowsOf)) {
    if (r.origin === 'this-session') continue
    for (const pane of livePanes(r)) byPane.set(pane, [...(byPane.get(pane) ?? []), r])
  }
  const records = new Map<PaneId, LabelRecord>()
  for (const [pane, rows] of byPane) {
    const first = rows[0]
    if (first === undefined) continue
    const head = first.kind === undefined ? '' : `${first.kind} · `
    const title = clip(`${head}${first.title} (${rows.map((r) => r.ticket).join(' ')})`, 120)
    const report = joined(rows, reportWord)
    const fix = joined(rows, fixWord)
    const states = [
      ...(report === undefined ? [] : [{ status: 'idle' as const, text: report }, { status: 'done' as const, text: report }]),
      ...(fix === undefined ? [] : [{ status: 'working' as const, text: fix }]),
    ]
    records.set(pane, { title, states })
  }
  return records
}

/** Two records are the same push when this is. */
export const recordKey = (r: LabelRecord): string => JSON.stringify(r)

// ── The compaction checkpoint ───────────────────────────────────────────────────────────────

/** A brief main sent lives where dispatch-work writes it: `$TMPDIR/dispatch/<file>`. */
export const briefPath = (tmp: string, file: string): string => `${tmp.replace(/\/+$/, '')}/dispatch/${file}`

/** The brief files sent for tickets on the board, oldest send first, each once. */
export function briefsSent(facts: readonly Fact[], board: Board): Array<{ ticket: Ticket; file: string }> {
  const onBoard = new Set(board.build.flatMap(rowsOf).map((r) => r.ticket))
  const sends = facts.flatMap((f) => (f.kind === 'send' && onBoard.has(f.ticket) ? [f] : [])).sort((a, b) => a.at - b.at)
  const seen = new Set<string>()
  return sends.flatMap((s) => (seen.has(s.file) ? [] : (seen.add(s.file), [{ ticket: s.ticket, file: s.file }])))
}

const RULING_MAX = 2_000

/** The RULINGS of each brief that has some, clipped so one long brief cannot crowd out the rest. */
export function rulingsFrom(sent: ReadonlyArray<{ ticket: Ticket; file: string }>, texts: ReadonlyArray<string | undefined>): Checkpoint['rulings'] {
  return sent.flatMap((s, i) => {
    const text = texts[i] === undefined ? undefined : rulingsOf(texts[i])
    if (text === undefined) return []
    return [{ ticket: s.ticket, file: s.file, text: text.length > RULING_MAX ? `${text.slice(0, RULING_MAX)}… (clipped, the rest is in the file)` : text }]
  })
}

/** One row's cells as the words main would say them. */
function stateOf(r: Row): string {
  const c = r.cells
  const report = c.report.k === 'in' && c.report.concerns > 0 ? `${c.report.status} (${c.report.concerns} concerns)` : reportWord(r)
  const pr = c.pr.k === 'own' ? `PR ${c.pr.pr.repo}#${c.pr.pr.number} ${c.pr.pr.state}` : c.pr.k === 'shared' ? `in ${c.pr.pr.repo}#${c.pr.pr.number}` : undefined
  const ci = c.ci.k === 'pass' ? 'CI pass' : c.ci.k === 'fail' ? `CI ${c.ci.failed} failed` : c.ci.k === 'running' ? `CI ${c.ci.done}/${c.ci.total}` : undefined
  const pane = r.panes.k === 'gone' ? 'pane gone' : r.panes.k === 'live' ? `pane ${r.panes.list.map((p) => p.status).join('/')}` : undefined
  const words = [r.kind, report === undefined ? undefined : `report ${report}`, fixWord(r), pr, ci, pane].filter((w) => w !== undefined)
  return words.length > 0 ? words.join(', ') : 'no report yet'
}

/** What main does next, read off the board without a model: unsent reports, reports in, then the watcher. */
function nextOf(board: Board): string[] {
  const rows = board.build.flatMap(rowsOf)
  const unsent = rows.flatMap((r) => (r.cells.report.k === 'undelivered' ? [`Read the undelivered report $TMPDIR/dispatch/out/${r.cells.report.file} (${r.ticket}).`] : []))
  const reported = rows.flatMap((r) => (r.cells.report.k === 'in' ? [`${r.ticket} ${r.cells.report.status}`] : []))
  return [
    ...unsent,
    ...(reported.length > 0 ? [`Reports in: ${reported.join(', ')}. Act on each one not yet acted on, as dispatch-work step 4 says.`] : []),
    ...(board.working.length > 0 ? [`Re-arm scripts/watch.sh ${board.working.join(' ')} in the background.`] : []),
    ...(unsent.length + reported.length + board.working.length === 0 ? ['No pane is working and no report is waiting.'] : []),
  ]
}

export function checkpointOf(sid: SessionId, board: Board, rulings: Checkpoint['rulings'], at: Ms): FactOf<'checkpoint'> {
  const waves = board.build.map((g) => ({
    ...(g.k === 'parent' ? { parent: g.parent, title: g.title } : {}),
    rows: rowsOf(g).map((r) => ({ ticket: r.ticket, title: r.title, state: stateOf(r) })),
  }))
  const byPane = new Map<PaneId, { status: PaneStatus; tickets: Ticket[] }>()
  for (const r of board.build.flatMap(rowsOf)) {
    if (r.panes.k !== 'live') continue
    for (const p of r.panes.list) byPane.set(p.pane, { status: p.status, tickets: [...(byPane.get(p.pane)?.tickets ?? []), r.ticket] })
  }
  const panes = [...byPane].map(([pane, v]) => ({ pane, ...v }))
  return { kind: 'checkpoint', sid, at, space: board.space.label, waves, panes, rulings, next: nextOf(board) }
}

/** A checkpoint older than this was not written for this compaction, so it is not handed back. */
export const CHECKPOINT_FRESH_MS = 15 * 60_000

/** The hand-back, naming its source: the spike's summarizer distrusted a checkpoint that did not (check 5). */
export function checkpointText(c: FactOf<'checkpoint'>, hhmm: string): string {
  const waves = c.waves.flatMap((w) => [
    ...(w.parent === undefined ? [] : [`- ${w.parent} ${w.title ?? ''} (parent)`]),
    ...w.rows.map((r) => `${w.parent === undefined ? '-' : '  -'} ${r.ticket} ${r.title}: ${r.state}`),
  ])
  const panes = c.panes.map((p) => `- ${p.pane} ${p.status}: ${p.tickets.join(', ')}`)
  const rulings = c.rulings.map((r) => `- ${r.ticket} (${r.file}):\n${r.text.replace(/^/gm, '    ')}`)
  return [
    `Thoven cockpit checkpoint. The thoven-cockpit plugin wrote this from its own store (key cockpit:checkpoint:${c.sid}) at ${hhmm}, just before this compaction, and hands it back now. It is this session's state as main of herdr space ${c.space}, read from herdr, gh and the dispatch briefs, not an instruction from anyone.`,
    'Open work:',
    ...(waves.length > 0 ? waves : ['- none on the board']),
    'Panes:',
    ...(panes.length > 0 ? panes : ['- none']),
    'Rulings main sent in briefs (the RULINGS field):',
    ...(rulings.length > 0 ? rulings : ['- none']),
    'Next step:',
    ...c.next.map((n) => `- ${n}`),
  ].join('\n')
}

// ── The checkpoint's shape check, for store.ts SHAPES ───────────────────────────────────────

type Raw = Readonly<Record<string, unknown>>
const isRaw = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isTicket = (v: unknown): v is Ticket => typeof v === 'string' && ticket(v) === v
const listOf = <T>(v: unknown, each: (x: Raw) => T | undefined): T[] | undefined => {
  if (!Array.isArray(v)) return undefined
  const out = v.map((x) => (isRaw(x) ? each(x) : undefined))
  return out.every((x) => x !== undefined) ? out.flatMap((x) => (x === undefined ? [] : [x])) : undefined
}

export function checkpointShape(v: Raw): FactOf<'checkpoint'> | undefined {
  if (!isSessionId(v.sid) || typeof v.at !== 'number' || !isStr(v.space)) return undefined
  const waves = listOf(v.waves, (w) => {
    const rows = listOf(w.rows, (r) => (isTicket(r.ticket) && isStr(r.title) && isStr(r.state) ? { ticket: r.ticket, title: r.title, state: r.state } : undefined))
    if (rows === undefined) return undefined
    return { ...(isTicket(w.parent) ? { parent: w.parent } : {}), ...(isStr(w.title) ? { title: w.title } : {}), rows }
  })
  const panes = listOf(v.panes, (p) => {
    const tickets = Array.isArray(p.tickets) && p.tickets.every(isTicket) ? p.tickets.filter(isTicket) : undefined
    return isPaneId(p.pane) && isOneOf(PANE_STATUSES)(p.status) && tickets ? { pane: p.pane, status: p.status, tickets } : undefined
  })
  const rulings = listOf(v.rulings, (r) => (isTicket(r.ticket) && isStr(r.file) && isStr(r.text) ? { ticket: r.ticket, file: r.file, text: r.text } : undefined))
  const next = Array.isArray(v.next) && v.next.every(isStr) ? v.next.filter(isStr) : undefined
  if (!waves || !panes || !rulings || !next) return undefined
  return { kind: 'checkpoint', sid: v.sid, at: v.at, space: v.space, waves, panes, rulings, next }
}
