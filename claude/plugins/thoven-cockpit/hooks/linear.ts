// linear.ts: the Linear cell. The one state read, what each ticket's Linear state already shows,
// the read-back lines `/workspace update` prints, the `/workspace update` arguments, and the
// parent groups.
//
// The cockpit never writes Linear. The only request body it can build is `StateQuery`, whose
// `query` is the literal type of STATE_QUERY and whose variables are numbers, so no value of the
// type can carry a mutation. tests/gate.test.ts checks the built body and every body a session sent.
//
// An event clears when either is true:
//   - the Linear state already shows it. `started` shows at In Progress, `pr N` at Ready, and
//     `merged N` at Done, each "or past", the same rule `/workspace update` skips a move by.
//     A `report` comment never shows in a state.
//   - main handed it to `/workspace update` (an `update` fact), and the newest read-back line for
//     its ticket since then is a state. A newer `THV-n ERROR …` keeps the ↻ and shows the reason.

import { ticket } from './dispatch.ts'
import { newest, type BoardFacts } from './facts.ts'
import { REPORT_STATUSES, isOneOf, type Board, type Group, type LinearCell, type LinearEvent, type LinearEventId, type Ms, type Pending, type Row, type Sources, type Ticket } from './model.ts'

export const LINEAR_URL = 'https://api.linear.app/graphql'
/** Where the key lives (spec "Linear" row). It is read for each request and never kept. */
export const keyPath = (home: string): string => `${home}/.linear-api-key`

// ── The state read (ADR10) ───────────────────────────────────────────────────────────────────

const STATE_QUERY =
  'query CockpitStates($numbers: [Float!]) { issues(first: 100, filter: { team: { key: { eq: "THV" } }, number: { in: $numbers } }) { nodes { identifier state { name type position } parent { identifier title } } } teams(filter: { key: { eq: "THV" } }) { nodes { states { nodes { name type position } } } } }'

/** The one Linear request body. `query` can only be STATE_QUERY, and the variables are numbers. */
export type StateQuery = { readonly query: typeof STATE_QUERY; readonly variables: { readonly numbers: readonly number[] } }

export function stateQuery(tickets: readonly Ticket[]): StateQuery {
  return { query: STATE_QUERY, variables: { numbers: tickets.map((t) => Number(t.slice('THV-'.length))) } }
}

/** Linear's workflow state types. Its order is the rank a state is compared by, before `position`. */
const STATE_TYPES = ['triage', 'backlog', 'unstarted', 'started', 'completed', 'canceled', 'duplicate'] as const
type StateType = (typeof STATE_TYPES)[number]
const RANK: Record<StateType, number> = { triage: 0, backlog: 0, unstarted: 1, started: 2, completed: 3, canceled: 3, duplicate: 3 }

export type LinearState = { name: string; type: StateType; position: number }
/** What the last read that asked about a ticket said of it, and when (`at`). */
export type LinearEntry = { state: LinearState; parent: { ticket: Ticket; title: string } | undefined; at: Ms }
/**
 * The Linear source's value. Each read asks only about the tickets on screen, and carries forward
 * every entry it did not re-read, so a ticket that left the board keeps the last state read for it
 * (S6's expiry reads that). `asked` is every ticket any read asked about; `states` the team's.
 */
export type LinearView = { asked: readonly Ticket[]; issues: ReadonlyMap<Ticket, LinearEntry>; states: readonly LinearState[] }

type Raw = Readonly<Record<string, unknown>>
const isRaw = (v: unknown): v is Raw => typeof v === 'object' && v !== null
const list = (v: unknown, ...path: string[]): unknown[] | undefined => {
  let at = v
  for (const k of path) at = isRaw(at) ? at[k] : undefined
  return Array.isArray(at) ? at : undefined
}

function stateOf(v: unknown): LinearState | undefined {
  if (!isRaw(v) || typeof v.name !== 'string' || !isOneOf(STATE_TYPES)(v.type) || typeof v.position !== 'number') return undefined
  return { name: v.name, type: v.type, position: v.position }
}

/** A GraphQL answer to STATE_QUERY, read at `at`. Undefined when its shape is not that; a GraphQL error throws its message. */
export function parseStates(text: string, asked: readonly Ticket[], at: Ms): LinearView | undefined {
  let root: unknown
  try {
    root = JSON.parse(text)
  } catch {
    return undefined
  }
  const errors = list(root, 'errors')
  if (errors && errors.length > 0) throw new Error(`Linear: ${String(isRaw(errors[0]) ? errors[0].message : 'error')}`)
  const nodes = list(root, 'data', 'issues', 'nodes')
  if (!nodes) return undefined
  const issues = new Map<Ticket, LinearEntry>()
  for (const n of nodes) {
    const t = isRaw(n) && typeof n.identifier === 'string' ? ticket(n.identifier) : undefined
    const state = isRaw(n) ? stateOf(n.state) : undefined
    // Only what was asked: an entry carried forward keeps its own read time.
    if (!t || !state || !isRaw(n) || !asked.includes(t)) continue
    const p = n.parent
    const parent = isRaw(p) && typeof p.identifier === 'string' ? ticket(p.identifier) : undefined
    issues.set(t, { state, parent: parent && isRaw(p) ? { ticket: parent, title: typeof p.title === 'string' ? p.title : parent } : undefined, at })
  }
  const states = (list(list(root, 'data', 'teams', 'nodes')?.[0], 'states', 'nodes') ?? []).flatMap((s) => stateOf(s) ?? [])
  return { asked, issues, states }
}

/** One read on top of the last value: what it asked about is replaced, everything else carried forward. */
export function carry(last: LinearView | undefined, read: LinearView): LinearView {
  const issues = new Map(last?.issues)
  for (const t of read.asked) issues.delete(t)
  for (const [t, e] of read.issues) issues.set(t, e)
  return { asked: [...new Set([...(last?.asked ?? []), ...read.asked])], issues, states: read.states.length > 0 ? read.states : (last?.states ?? []) }
}

/** S6's typed read of the Linear source: the last entry read for each ticket, on screen or not. Empty before the first answer. */
export function linearEntries(sources: Pick<Sources, 'linear'>): ReadonlyMap<Ticket, LinearEntry> {
  const p = sources.linear
  return p.k === 'fresh' || p.k === 'stale' ? p.value.issues : new Map()
}

/** Whether an entry reads Done: a completed state. */
export const isDone = (e: LinearEntry): boolean => e.state.type === 'completed'

/** Every ticket with a Work row on the board, children included. */
export function ticketsOn(board: Pick<Board, 'build'> | undefined): Ticket[] {
  return (board?.build ?? []).flatMap((g) => (g.k === 'single' ? [g.row.ticket] : g.children.map((r) => r.ticket)))
}

// ── What a state shows ───────────────────────────────────────────────────────────────────────

/** The state `/workspace update` moves each event to. A report is a comment, so it has none. */
const TARGET: Record<LinearEvent['k'], string | undefined> = { started: 'In Progress', pr: 'Ready', report: undefined, merged: 'Done' }

const atOrPast = (s: LinearState, target: LinearState): boolean => RANK[s.type] > RANK[target.type] || (RANK[s.type] === RANK[target.type] && s.position >= target.position)

/** Whether the state already shows the event: at or past its target, or closed when the team has no state by that name. */
function shows(s: LinearState, e: LinearEvent, states: readonly LinearState[]): boolean {
  const name = TARGET[e.k]?.toLowerCase()
  if (name === undefined) return false
  const target = states.find((x) => x.name.toLowerCase() === name)
  return target ? atOrPast(s, target) : RANK[s.type] === 3
}

// ── Events: ids, text, and the `/workspace update` arguments ─────────────────────────────────

/**
 * The event an id names. `merged-<repo>-<n>` and `pr-<repo>-<n>` carry the repo so FE #138 and
 * BE #138 stay two events (the THV-1061 ruling); the bare `merged-<n>` an earlier build wrote reads too.
 */
export function eventOf(id: string): LinearEvent | undefined {
  if (id === 'started') return { k: 'started' }
  const report = /^report-(.+)$/.exec(id)?.[1]
  if (report !== undefined) return isOneOf(REPORT_STATUSES)(report) ? { k: 'report', status: report } : undefined
  const m = /^(pr|merged)-(?:.+-)?(\d+)$/.exec(id)
  if (!m?.[2]) return undefined
  return m[1] === 'pr' ? { k: 'pr', number: Number(m[2]) } : { k: 'merged', number: Number(m[2]) }
}

/** The event as `/workspace update` reads it: `started`, `pr 141`, `report DONE`, `merged 138`. */
export function eventText(e: LinearEvent): string {
  switch (e.k) {
    case 'started':
      return 'started'
    case 'pr':
      return `pr ${e.number}`
    case 'report':
      return `report ${e.status}`
    case 'merged':
      return `merged ${e.number}`
  }
}

/** `update THV-1038 merged 138 THV-1045 pr 141`: workspace SKILL.md "Update from the cockpit". Undefined for nothing to send. */
export function updateArgs(pending: readonly Pending[]): string | undefined {
  if (pending.length === 0) return undefined
  return `update ${pending.map((p) => `${p.ticket} ${eventText(p.event)}`).join(' ')}`
}

const ORDER: Record<LinearEvent['k'], number> = { started: 0, pr: 1, report: 2, merged: 3 }

// ── Read-back lines ──────────────────────────────────────────────────────────────────────────

export type Readback = { ticket: Ticket; isError: boolean; text: string }

/**
 * set-status.js prints `THV-1 In Progress`, or `THV-1 ERROR <reason>`, one line per issue, and
 * the skill replies with the same lines. Line-anchored; a list marker or backticks may wrap it.
 * A state is one to three capitalised words, so a status line (`DONE THV-7`) never reads as one.
 */
const READBACK = /^[ \t]*(?:[-*][ \t]+)?`?(THV-\d+)[ \t]+(?:ERROR(?:[ \t]+([^\n`]*?))?|([A-Z][a-z]+(?:[ \t][A-Z][a-z]+){0,2}))`?[ \t]*$/gm

export function readbacks(text: string): Readback[] {
  return [...text.matchAll(READBACK)].flatMap((m) => {
    const t = m[1] ? ticket(m[1]) : undefined
    if (!t) return []
    return [m[3] === undefined ? { ticket: t, isError: true, text: m[2] || 'error' } : { ticket: t, isError: false, text: m[3] }]
  })
}

// ── The cell ─────────────────────────────────────────────────────────────────────────────────

/**
 * A row's Linear cell. `fresh` are this tick's events with no `happened` fact yet. Until a state
 * read has answered for the ticket the cell is `none`, so no ↻ flashes before Linear is known.
 */
export function linearOf(t: Ticket, about: BoardFacts, fresh: readonly Pending[], view: LinearView | undefined): LinearCell {
  if (!view?.asked.includes(t)) return { k: 'none' }
  const issue = view.issues.get(t)
  const all = new Map<LinearEventId, Pending>()
  for (const f of about.happened) {
    const event = eventOf(f.event)
    if (event) all.set(f.event, { ticket: t, event, id: f.event })
  }
  for (const p of fresh) all.set(p.id, p)
  const sent = new Map(about.update.map((u) => [u.event, u.at]))
  const back = newest(about.readback)
  let error: string | undefined
  let isInFlight = false
  const pending = [...all.values()]
    .filter((p) => {
      if (issue && shows(issue.state, p.event, view.states)) return false
      const at = sent.get(p.id)
      if (at === undefined) return true
      if (!back || back.at < at) {
        isInFlight = true
        return true
      }
      if (back.isError) error = back.text
      return back.isError
    })
    .sort((a, b) => ORDER[a.event.k] - ORDER[b.event.k] || a.id.localeCompare(b.id))
  if (pending.length === 0) return { k: 'ok' }
  return error === undefined ? { k: 'pending', pending, isInFlight } : { k: 'error', message: error, pending }
}

/** What a Linear cell asks `/workspace update` for. */
export const pendingOf = (c: LinearCell): Pending[] => (c.k === 'pending' || c.k === 'error' ? c.pending : [])

// ── Parent groups ────────────────────────────────────────────────────────────────────────────

/**
 * Rows nested under their Linear parent, at the place of the first row of the group. A row for
 * the parent ticket itself is replaced by the summary, which has no ↻. Without a state read every
 * row stands alone.
 */
export function groupRows(rows: readonly Row[], view: LinearView | undefined): Group[] {
  const parentOf = (t: Ticket) => view?.issues.get(t)?.parent
  const parents = new Set(rows.flatMap((r) => parentOf(r.ticket)?.ticket ?? []))
  const groups = new Map<Ticket, Extract<Group, { k: 'parent' }>>()
  const out: Group[] = []
  const groupFor = (parent: Ticket, title: string) => {
    let g = groups.get(parent)
    if (!g) {
      g = { k: 'parent', parent, title, done: 0, total: 0, needsYou: 0, children: [] }
      groups.set(parent, g)
      out.push(g)
    }
    return g
  }
  for (const row of rows) {
    const p = parentOf(row.ticket)
    if (p) {
      const g = groupFor(p.ticket, p.title)
      g.title = p.title
      g.children.push(row)
      g.total += 1
      if (RANK[view?.issues.get(row.ticket)?.state.type ?? 'triage'] === 3) g.done += 1
      if (needsYou(row)) g.needsYou += 1
    } else if (parents.has(row.ticket)) groupFor(row.ticket, row.title)
    else out.push({ k: 'single', row })
  }
  return out
}

/** A report that asks Andres for something: the red `ask` and `blocked`. */
const needsYou = (row: Row): boolean => {
  const r = row.cells.report
  return (r.k === 'in' || r.k === 'undelivered') && (r.status === 'NEEDS_CONTEXT' || r.status === 'BLOCKED')
}
