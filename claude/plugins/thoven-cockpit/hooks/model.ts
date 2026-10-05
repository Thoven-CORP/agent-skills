// model.ts: the cockpit's data shape. Types, and the fixed word lists two of them are read against.
//
// Three layers, read top to bottom:
//   1. Fact   what one session saw, stored at a key only that session writes (store.ts owns keys)
//   2. World  everything main knows at one instant: facts + the polled sources, each maybe stale
//   3. Board  the pure projection of a World (board.ts), which view.ts draws
//
// Invariants this file encodes:
//   - A Fact is a whole value with its writer in its key. No fact is ever read-modified-written.
//   - Nothing on the Board is stored. Every cell is recomputed from the World each tick, so a
//     reload, /clear, /resume or compaction loses only caches.
//   - Wire shapes (herdr JSON, gh JSON, GraphQL, rollout JSONL) never appear here. Parsers turn
//     them into these types at the boundary.
//   - Every cell type a later slice fills exists now; until its slice lands it is `{ k: 'none' }`.

import type { SOURCES, Source } from './sources.ts'

// ── Identity ────────────────────────────────────────────────────────────────────────────────

declare const brand: unique symbol
type Brand<T, B extends string> = T & { readonly [brand]: B }

/** `THV-1045`. Made only by `ticket()` in dispatch.ts, which normalises `thv-1045` and `1045`. */
export type Ticket = Brand<`THV-${number}`, 'Ticket'>
/** herdr pane id, `w18:p8W`. */
export type PaneId = Brand<string, 'PaneId'>
/** herdr tab id, `w18:t45`. */
export type TabId = Brand<string, 'TabId'>
/** herdr workspace id, `w18`. A herdr workspace is what the spec calls a space. */
export type SpaceId = Brand<string, 'SpaceId'>
/** Claude (or Codex) session id. herdr's `agent_session.value` carries the same value. */
export type SessionId = Brand<string, 'SessionId'>
/** Epoch milliseconds, always read from `$.clock.now()` so tests can drive it with mock.clock. */
export type Ms = number

// ── The dispatch-work vocabulary (dispatch.ts parses it) ───────────────────────────────────

// Each fixed word list is written once, below. Its type is derived from it, and `isOneOf(list)`
// is the one guard that reads outside text against it.

/** label.sh's KINDS. Anything else is not a Kind. */
export const KINDS = ['Meta', 'Plan', 'Design', 'Build', 'Review', 'Research', 'Audit', 'Fix'] as const
export type Kind = (typeof KINDS)[number]
/** The tool tag in the Pane cell: Claude, Codex, Devin, Cursor. */
export const TOOLS = ['C', 'X', 'D', 'R'] as const
export type Tool = (typeof TOOLS)[number]
/** herdr `agent_status`. `done` is idle with an unseen completion. */
export const PANE_STATUSES = ['idle', 'working', 'blocked', 'done', 'unknown'] as const
export type PaneStatus = (typeof PANE_STATUSES)[number]

/** brief.md REPORT words. DONE_WITH_CONCERNS is first, so a pattern built from the list tries it before DONE. */
export const REPORT_STATUSES = ['DONE_WITH_CONCERNS', 'DONE', 'NEEDS_CONTEXT', 'BLOCKED'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]
/** review.md reply words. */
export const VERDICTS = ['VERIFIED', 'FINDINGS'] as const
export type Verdict = (typeof VERDICTS)[number]
export const STATUS_WORDS = [...REPORT_STATUSES, ...VERDICTS] as const
export type StatusWord = (typeof STATUS_WORDS)[number]

export const ROLES = ['builder', 'verifier'] as const
export type Role = (typeof ROLES)[number]

export const PR_STATES = ['OPEN', 'MERGED', 'CLOSED'] as const
export type PrState = (typeof PR_STATES)[number]

/** A guard for one of the lists above: is this outside value one of its words? */
export function isOneOf<L extends readonly string[]>(list: L): (v: unknown) => v is L[number] {
  return (v): v is L[number] => list.some((word) => word === v)
}

/** A thrown value as one line of text. */
export function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** The one way outside text becomes an id: herdr, Claude Code and the store hand out non-empty strings. */
const isId = (v: unknown): v is string => typeof v === 'string' && v !== ''
/** A pane id is herdr's `w…:p…` shape, so a send.sh operand the shell never expanded (`$P`) is not one. */
export const isPaneId = (v: unknown): v is PaneId => typeof v === 'string' && /^w[0-9A-Za-z]+:p[0-9A-Za-z]+$/.test(v)
export const isTabId = (v: unknown): v is TabId => isId(v)
export const isSpaceId = (v: unknown): v is SpaceId => isId(v)
export const isSessionId = (v: unknown): v is SessionId => isId(v)
export const isLinearEventId = (v: unknown): v is LinearEventId => isId(v)

/** One line-anchored status line. */
export type StatusLine = { ticket: Ticket; word: StatusWord; line: string }

/**
 * What a prompt told a pane to do. A prompt that is a brief is never also a report: status lines
 * quoted inside it (the verifier brief pastes the builder's `DONE THV-n`) are its content.
 *   first  `/poteto-mode <playbook> THV-n "title"`, or `Verify THV-n`
 *   fix    `FIX ROUND <round>/<of> THV-n`, which goes to the builder
 */
export type Brief =
  | {
      k: 'first'
      ticket: Ticket
      role: Role
      /** The `/poteto-mode <playbook>` word as a label Kind (`Build`); absent when it is none (`Verify`, `Feature`). */
      labelKind?: Kind
      /** The quoted ticket title on the brief's first line, when it has one. */
      title?: string
    }
  | { k: 'fix'; ticket: Ticket; round: number; of: number }

/**
 * A session's brief for one ticket as it holds it. A fix round is written to the key of the brief
 * before it, so it keeps that brief's kind, and any brief without a title keeps the title before it.
 */
export type Engagement = Brief & Pick<Extract<Brief, { k: 'first' }>, 'labelKind' | 'title'>

/** One `send.sh <pane> …/<THV-n>[-fixN|-verify[N]].md` in a Bash command. */
export type SendCall = { pane: PaneId; ticket: Ticket; role: Role; round: number; file: string }

/** A pane or tab label as label.sh writes it, or an older form that still names a ticket. */
export type Label = { kind: Kind | undefined; title: string; tickets: Ticket[] }

// ── 1. Facts ───────────────────────────────────────────────────────────────────────────────
//
// Each variant names its writer. store.ts builds the key from the variant's subject and writer
// fields, so two sessions never write one key, except `main`, where last claim wins (ADR3).

export type Fact =
  /** `main:<space>`. Contested by design: the newest claim is the main. Matched on `pane`, because `/clear` changes `sid`. */
  | { kind: 'main'; space: SpaceId; sid: SessionId; pane: PaneId; at: Ms }
  /** `brief:<ticket>:<sid>`. The session that received the brief, and the brief as it holds it. */
  | ({ kind: 'brief' } & Engagement & { sid: SessionId; pane: PaneId; at: Ms })
  /** `report:<ticket>:<sid>`. A session that received a builder's status line. */
  | { kind: 'report'; ticket: Ticket; sid: SessionId; status: ReportStatus; text: string; concerns: number; at: Ms }
  /** `verdict:<ticket>:<sid>`. A session that received a verifier's reply. */
  | { kind: 'verdict'; ticket: Ticket; sid: SessionId; verdict: Verdict; text: string; at: Ms }
  /** `send:<ticket>:<pane>:<role>:<round>`. Main's own `send.sh <pane> …/THV-n[-fixN|-verify].md` call. */
  | ({ kind: 'send' } & SendCall & { at: Ms })
  /** `happened:<ticket>:<event>`. Set once, the first time main sees the event, so a ↻ cannot vanish when its evidence leaves a source. */
  | { kind: 'happened'; ticket: Ticket; event: LinearEventId; at: Ms }
  /** `status:<ticket>:<sid>`. A builder session's own answer: the last status line it sent main (S5). */
  | { kind: 'status'; ticket: Ticket; sid: SessionId; status: ReportStatus; text: string; at: Ms }
  /** `checkpoint:<sid>`. Main's state when it last compacted, handed back after the compaction (S5). */
  | ({ kind: 'checkpoint'; sid: SessionId; at: Ms } & Checkpoint)
  /** `review:<ticket>:<sid>:<skill>`. A Review skill a session ran itself while it held a verifier brief for the ticket, or a `ran` its verdict reply claimed. */
  | ({ kind: 'review' } & SkillRun)
  /** `self:<ticket>:<sid>:<skill>`. The same, under any other brief: the builder's own check (ADR12). */
  | ({ kind: 'self' } & SkillRun)
  /**
   * `ran:<sid>:<skill>`. A Review skill a pane ran holding no brief. The first verdict reply after it
   * names its ticket, makes it `review` and marks it claimed; a run older than a brief the pane holds
   * is never claimed.
   */
  | ({ kind: 'ran'; claimed?: true } & Omit<SkillRun, 'ticket' | 'round'>)
  /** `update:<ticket>:<event>`. Main handed the event to `/workspace update` at `at`; a second press replaces it. */
  | { kind: 'update'; ticket: Ticket; event: LinearEventId; at: Ms }
  /** `readback:<ticket>:<sid>`. The newest `THV-n <State>` or `THV-n ERROR <reason>` line main saw. */
  | { kind: 'readback'; ticket: Ticket; sid: SessionId; isError: boolean; text: string; at: Ms }

/** What main hands itself back after a compaction. Each row's state is already words, so the hand-back needs no board. */
export type Checkpoint = {
  /** The herdr space's label. */
  space: string
  /** One wave per board group: a parent and its children, or one row. */
  waves: Array<{ parent?: Ticket; title?: string; rows: Array<{ ticket: Ticket; title: string; state: string }> }>
  panes: Array<{ pane: PaneId; status: PaneStatus; tickets: Ticket[] }>
  /** The RULINGS field of each brief main sent for a ticket on the board. */
  rulings: Array<{ ticket: Ticket; file: string; text: string }>
  next: string[]
}

/** One Review skill run. `round` is the `at` of the brief the session held when it ran, or, for a `ran` a verdict reply claimed, of the brief that reply wrote: a new brief starts a new round. */
export type SkillRun = { ticket: Ticket; sid: SessionId; skill: ReviewSkill; round: Ms; at: Ms }

export type FactKind = Fact['kind']
export type FactOf<K extends FactKind> = Extract<Fact, { kind: K }>

// ── 2. The World: polled sources ───────────────────────────────────────────────────────────

/**
 * A polled source's last result.
 *   never  not polled yet
 *   fresh  the last poll answered
 *   stale  the last poll failed; `value` is the last good answer, so other columns keep drawing
 *   down   no poll has ever answered ("herdr unavailable")
 */
export type Polled<T> =
  | { k: 'never' }
  | { k: 'fresh'; value: T; at: Ms }
  | { k: 'stale'; value: T; at: Ms; since: Ms; error: string }
  | { k: 'down'; since: Ms; error: string }

/** One herdr pane, parsed from `herdr api snapshot` (herdr.ts). */
export type Pane = {
  pane: PaneId
  tab: TabId
  space: SpaceId
  /** `agent_session.value`. Undefined for a shell pane. */
  sid: SessionId | undefined
  /** herdr's `agent`, raw. `tool` is its tag; a shell pane has neither. */
  agent: string | undefined
  tool: Tool | undefined
  status: PaneStatus
  /** Where the pane's agent runs: herdr's `foreground_cwd`, else `cwd`. */
  cwd: string
  /** Label candidates in first-match-wins order (spec "Work title, kind"). */
  paneLabel: string | undefined
  tabLabel: string | undefined
  terminalTitle: string | undefined
}

export type Space = { space: SpaceId; label: string }

export type Snapshot = { spaces: Space[]; panes: Pane[] }

/**
 * Pane labels read with `herdr pane get` for panes the snapshot gave none (ADR4), one entry per
 * pane. `seen` is the tab label and title the pane showed when read; a pane is read again only
 * when they change.
 */
export type PaneLabels = {
  byPane: ReadonlyMap<PaneId, { seen: string; label: string | undefined }>
}

/** WORKFLOW.md §8 Live spaces: herdr space label to Linear Project. No row means no Project. */
export type SpaceMap = ReadonlyMap<string, string>

/** Where each cwd's HEAD file is: `<cwd>/.git/HEAD`, or the worktree gitdir's HEAD. */
export type HeadPaths = ReadonlyMap<string, string>
/** cwd → branch, from its HEAD file. A detached HEAD or a folder outside git has no entry. */
export type Branches = ReadonlyMap<string, string>
/**
 * A repo's `.git/config` path → its GitHub `owner/name` (`Thoven-CORP/frontend-remote`), read
 * once per path. Undefined when the file is unreadable or its origin is not on GitHub.
 */
export type Origins = ReadonlyMap<string, string | undefined>

/** One PR from `gh pr list`. */
export type Pr = {
  /** GitHub `owner/name`. */
  repo: string
  number: number
  /** The title without its trailing `(THV-n …)` group, which is in `tickets`. */
  title: string
  branch: string
  /** The branch the PR merges into, which a review diffs against. */
  base: string
  state: PrState
  /** Tickets named by the branch `thv-(\d+)`, then every ticket in the title's trailing `(…)`. Prose mentions are not tickets. */
  tickets: Ticket[]
  checks: Checks
  /** additions + deletions. With `topDirs`, S3's amber T reads it. */
  changedLines: number
  /** Top-level directories the changed files sit under; a file at the root is under none. */
  topDirs: number
  url: string
}
/** `statusCheckRollup`, CheckRuns and StatusContexts alike; none when every check ran no CI (github.ts). `failed` and `running` hold check names. */
export type Checks = { total: number; done: number; failed: string[]; running: string[] }

export type GithubView = { prs: Pr[] }

/** One `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`, as codex.ts reads it. `at` is the file's mtime; `review` is set only for a verifier's rollout. */
export type CodexRollout = { file: string; at: Ms; cwd: string; startedAt: Ms; review: CodexReview | undefined }
/** A Codex verifier's traces: the ticket its brief names, the `spawn_agent` task names, and the skills it only selected. */
export type CodexReview = { ticket: Ticket; spawned: string[]; selected: string[] }

/** A `THV-n.md` file in `$TMPDIR/dispatch/out/`, and what its first non-empty line makes it. */
export type InboxFile = { name: string; ticket: Ticket; at: Ms } & (
  | { k: 'report'; line: StatusLine & { word: ReportStatus } } // an undelivered report
  | { k: 'verdict'; line: StatusLine & { word: Verdict } } // an undelivered verdict
  | { k: 'escalation'; head: string } // herdr's verify plugin: a pane keeps reporting done with live processes
  | { k: 'note' } // anything else, such as a research deliverable
)

/** What each source yields when it answers, read off `SOURCES` in sources.ts: a source cannot be added without its value type. */
export type SourceValues = { [K in keyof typeof SOURCES]: (typeof SOURCES)[K] extends Source<infer T> ? T : never }
export type SourceId = keyof SourceValues
export type Sources = { [K in SourceId]: Polled<SourceValues[K]> }

/** Who this session is. Decided in session.start, refreshed by classic.SessionStart. */
export type Me =
  | { k: 'inert' } // no HERDR_PANE_ID: every hook passes through untouched
  | { k: 'pane'; pane: PaneId; sid: SessionId; engagements: Engagement[] }
  | { k: 'main'; pane: PaneId; sid: SessionId; space: SpaceId; cwd: string; home: string; tmp: string }

export type Main = Extract<Me, { k: 'main' }>

export type World = {
  now: Ms
  me: Main
  sources: Sources
  facts: Fact[]
}

// ── Linear events (derived; only `happened`, `update` and `readback` facts are stored) ──────

export type LinearEvent =
  | { k: 'started' }
  | { k: 'pr'; number: number }
  | { k: 'report'; status: ReportStatus }
  | { k: 'merged'; number: number }
/** `started`, `pr-<repo>-141`, `report-DONE`, `merged-<repo>-138`. The last segment of a `happened:` key. */
export type LinearEventId = Brand<string, 'LinearEventId'>

/** The one place an event id is made: `started`, `merged-Thoven-CORP/frontend-remote-138`, `report-DONE`. */
export const eventId = (k: LinearEvent['k'], v?: string | number): LinearEventId => (v === undefined ? k : `${k}-${v}`) as LinearEventId
export type Pending = { ticket: Ticket; event: LinearEvent; id: LinearEventId }

// ── 3. The Board (board.ts builds it, view.ts draws it) ────────────────────────────────────

export type LivePane = { status: PaneStatus; tool: Tool | undefined; pane: PaneId }
export type NonEmpty<T> = [T, ...T[]]

export type PaneCell =
  | ({ k: 'live' } & LivePane)
  | { k: 'gone' } // the row has facts but its pane left the snapshot
  | { k: 'none' }

/** A row's Build panes, in snapshot order: the first is the one `f` focuses. */
export type Panes = { k: 'live'; list: NonEmpty<LivePane> } | { k: 'gone' } | { k: 'none' }

export type ReportCell =
  | { k: 'none' }
  | { k: 'na'; tool: Tool }
  /** `concerns` counts the report's unmet Acceptance rows (`[~]`, `[ ]`, `✗`) and its concerns table's rows; 0 when it lists none. */
  | { k: 'in'; status: ReportStatus; at: Ms; concerns: number; selfChecked: boolean }
  | { k: 'undelivered'; status: ReportStatus; file: string; selfChecked: boolean }
  | { k: 'escalation'; head: string } // a non-report note herdr's tw_tell_main left in the inbox

export type FixCell = { k: 'none' } | { k: 'round'; round: number; of: number }

/** The Review column's letters, in order. */
export const LETTERS = ['V', 'C', 'T', 'D'] as const
export type Letter = (typeof LETTERS)[number]
/** The skill behind each letter, in LETTERS order (review.md steps 1 to 4). */
export const REVIEW_SKILLS = ['verify-this', 'code-review', 'thermo-nuclear-code-quality-review', 'deslop'] as const
export type ReviewSkill = (typeof REVIEW_SKILLS)[number]
/** One Review letter. `amber` exists only for T: thermo was due and did not run. `claimed`: a VERIFIED line claimed it and the verifier session never ran it. */
export type Light = 'lit' | 'dim' | 'off' | 'amber' | 'na' | 'claimed'
export type ReviewCell =
  | { k: 'none' }
  | { k: 'review'; lights: Record<Letter, Light>; round: number; tool: Tool | undefined }

export type PrCell = { k: 'none' } | { k: 'own'; pr: Pr } | { k: 'shared'; pr: Pr } // "in #N"
export type CiCell = { k: 'none' } | { k: 'pass' } | { k: 'fail'; failed: number } | { k: 'running'; done: number; total: number }

export type LinearCell =
  | { k: 'none' } // not read yet
  | { k: 'ok' }
  | { k: 'pending'; pending: Pending[]; isInFlight: boolean }
  | { k: 'error'; message: string; pending: Pending[] }

/** Who holds a ticket on the board, and so where its PRs are. */
export type RowIdentity = {
  ticket: Ticket
  title: string
  /** Undefined for an older label that names a ticket and no Kind (`UI polish walkthrough (THV-481)`). */
  kind: Kind | undefined
  /** `label`: a pane's label names the ticket; `branch`: its folder's branch; `dispatch`: what main sent it; `this-session`: main's own branch. */
  origin: 'label' | 'branch' | 'dispatch' | 'this-session'
  panes: Panes
  verifierPane: PaneCell
}

export type Cells = {
  report: ReportCell
  fix: FixCell
  review: ReviewCell
  pr: PrCell
  ci: CiCell
  linear: LinearCell
}

export type Row = RowIdentity & { cells: Cells }

/**
 * A parent and its on-screen children, or one parentless row. `done of total` counts the parent's
 * sub-issues as Linear lists them (`linear`), or, while Linear is stale, the rows on screen (`screen`).
 */
export type Group =
  | { k: 'single'; row: Row }
  | { k: 'parent'; parent: Ticket; title: string; done: number; total: number; counted: 'linear' | 'screen'; needsYou: number; children: Row[] }

/** A pane with no Build or Review row: by its label, or, with none, by its tab's name. */
export type OtherItem = { k: 'labelled'; title: string; kind: Kind | undefined; ticket: Ticket | undefined; pane: PaneCell } | { k: 'unlabelled'; tab: string; pane: PaneCell }

/** One PR in the PRs tab, with the on-screen tickets it attached to (none for a ticketless PR on a pane's branch). */
export type PrItem = { pr: Pr; tickets: Ticket[] }
/** One repo's PRs, newest first as gh lists them. Groups follow the repos' poll order: frontend, backend, then the rest. */
export type PrGroup = { repo: string; items: PrItem[] }

/** The Health entry a source reports under, read off its `shows` in SOURCES: heads, branches and origins all read git's own files, so they share `git`. */
type ShownAs<K extends SourceId> = (typeof SOURCES)[K] extends Source<unknown, string, infer H> ? ([H] extends [never] ? K : H) : K
export type HealthId = { [K in SourceId]: ShownAs<K> }[SourceId]
export type SourceHealth = { k: 'ok' } | { k: 'stale'; since: Ms } | { k: 'unavailable' }
export type Health = { [S in SourceId as ShownAs<S>]: SourceHealth }

export type Board = {
  space: Space
  /** The Linear Project of this space; undefined hides the Linear column. */
  project: string | undefined
  build: Group[]
  other: OtherItem[]
  /** Each PR once: attached to a row by branch or title group, or ticketless on a space folder's branch. */
  prs: PrGroup[]
  /** Every pending event on screen, for `u`. Parent rows contribute none. */
  pending: Pending[]
  health: Health
  /** Panes working in this space now, for the watcher warning. */
  working: PaneId[]
  /** Events on screen with no `happened` fact yet. Main writes each once (synthesis A1). */
  newEvents: Pending[]
  /** The All tab: every herdr space, this one first, each with its agent panes. */
  spaces: SpaceGroup[]
}

/** One space on the All tab. A pane's title is its label, else its tab's name. */
export type SpaceGroup = { space: Space; isThis: boolean; panes: Array<{ title: string; pane: LivePane }> }

// ── Intents: what a press asks for, as data (view.ts emits, main.ts performs) ──────────

export type TabName = 'work' | 'prs' | 'all'

export type Intent =
  | { k: 'tab'; tab: TabName }
  | { k: 'focus-pane'; pane: PaneId }
  | { k: 'select'; ticket: Ticket } // a Work row pressed: the box follows it, nothing else runs
  | { k: 'checks'; pr: string } // `c`, or a PR row pressed: show or hide that PR's unfinished and failed checks
  | { k: 'update'; pending: Pending[] } // ↻ on a row, or `u` for every row: hand the events to `/workspace update`
  | { k: 'help' } // `?`: show or hide what the columns and keys mean
  | { k: 'fill'; text: string } // `m` or `r` on the PRs tab: a draft in the prompt box, which Andres sends or not

/**
 * `selected` is the ticket of the Work row whose button holds the focus ring, `selectedPr` the
 * same for a PR row (`owner/name#n`). `checks` is the PR whose checks are listed.
 */
export type PaneUi = {
  tab: TabName
  selected: string | undefined
  selectedPr: string | undefined
  checks: string | undefined
  /** What the last press did, shown above the footer until the selection or tab changes. */
  notice?: string | undefined
  isHelpOpen?: boolean
}
