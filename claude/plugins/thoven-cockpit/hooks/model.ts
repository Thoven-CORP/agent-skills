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

/** A guard for one of the lists above: is this outside value one of its words? */
export function isOneOf<L extends readonly string[]>(list: L): (v: unknown) => v is L[number] {
  return (v): v is L[number] => list.some((word) => word === v)
}

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
export type Engagement = Brief & { labelKind?: Kind; title?: string }

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
  /** `sent:<ticket>:<sid>`. A briefed session's own outbound status line. */
  | { kind: 'sent'; ticket: Ticket; sid: SessionId; word: StatusWord; at: Ms }
  /** `send:<ticket>:<pane>`. Main's own `send.sh <pane> …/THV-n[-fixN|-verify].md` call. */
  | ({ kind: 'send' } & SendCall & { at: Ms })
  /** `ran:<sid>:<skill>`. A skill the main loop of an engaged session ran (not a subagent). */
  | { kind: 'ran'; sid: SessionId; skill: string; isReadOnly: boolean; at: Ms }
  /** `happened:<ticket>:<event>`. Set once, the first time main sees the event, so a ↻ cannot vanish when its evidence leaves a source. */
  | { kind: 'happened'; ticket: Ticket; event: LinearEventId; at: Ms }
  /** `ack:<ticket>:<event>`. Main saw `/workspace update` read back this event without ERROR. */
  | { kind: 'ack'; ticket: Ticket; event: LinearEventId; state: string; at: Ms }
  /** `checkpoint:<sid>`. Main's compaction checkpoint, handed back by SessionStart(compact). */
  | { kind: 'checkpoint'; sid: SessionId; text: string; at: Ms }

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
  state: 'OPEN' | 'MERGED' | 'CLOSED'
  /** Tickets named by the branch `thv-(\d+)`, then every ticket in the title's trailing `(…)`. Prose mentions are not tickets. */
  tickets: Ticket[]
  checks: Checks
  /** additions + deletions. With `topDirs`, S3's amber T reads it. */
  changedLines: number
  /** Top-level directories the changed files sit under; a file at the root is under none. */
  topDirs: number
  url: string
}
/** `statusCheckRollup`, CheckRuns and StatusContexts alike. `failed` and `running` hold check names. */
export type Checks = { total: number; done: number; failed: string[]; running: string[] }

export type GithubView = { prs: Pr[] }

/** Linear, as the 5-minute read or a `/workspace update` read-back last saw one issue. */
export type LinearIssue = {
  ticket: Ticket
  state: string
  stateType: 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled'
  parent: Ticket | undefined
  project: string | undefined
}
export type LinearView = ReadonlyMap<Ticket, LinearIssue>

/** A `THV-n.md` file in `$TMPDIR/dispatch/out/`, and what its first non-empty line makes it. */
export type InboxFile = { name: string; ticket: Ticket; at: Ms } & (
  | { k: 'report'; line: StatusLine & { word: ReportStatus } } // an undelivered report
  | { k: 'verdict'; line: StatusLine & { word: Verdict } } // an undelivered verdict
  | { k: 'escalation'; head: string } // herdr's verify plugin: a pane keeps reporting done with live processes
  | { k: 'note' } // anything else, such as a research deliverable
)

/** Best-effort read of one Codex verifier rollout. */
export type CodexReview = {
  sid: SessionId
  ticket: Ticket | undefined
  /** `spawn_agent` task names: proof a reviewer started. */
  spawned: string[]
  /** `skills.selected_skill_instructions`: injected, not proof of a run. */
  selected: string[]
}

/** What each source yields when it answers. `SOURCES` in sources.ts implements each, in poll order; a source with no code yet has no entry. */
export type SourceValues = {
  herdr: Snapshot
  labels: PaneLabels
  spaces: SpaceMap
  heads: HeadPaths
  branches: Branches
  origins: Origins
  github: GithubView
  inbox: InboxFile[]
}
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
  /** Read-backs newer than the last Linear read, folded over `sources.linear` by board.ts. */
  readbacks: ReadonlyMap<Ticket, LinearIssue | { error: string }>
  /** Update events main has handed to `$.command.run` and not yet seen read back. */
  inFlight: ReadonlySet<string>
  /** The skill main itself ran last, for "You are here". */
  mainSkill: string | undefined
}

// ── Linear events (derived; only `happened` and `ack` facts are stored) ─────────────────────

export type LinearEvent =
  | { k: 'started' }
  | { k: 'pr'; number: number }
  | { k: 'report'; status: ReportStatus }
  | { k: 'merged'; number: number }
/** `started`, `pr-141`, `report-DONE`, `merged-138`. The last segment of `happened:` and `ack:` keys. */
export type LinearEventId = Brand<string, 'LinearEventId'>
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
  /** `concerns` counts the report's unmet Acceptance rows (`[~]`, `[ ]`, `✗`); 0 when it lists none. */
  | { k: 'in'; status: ReportStatus; at: Ms; concerns: number; selfChecked: boolean }
  | { k: 'undelivered'; status: ReportStatus; file: string; selfChecked: boolean }
  | { k: 'escalation'; head: string } // a non-report note herdr's tw_tell_main left in the inbox

export type FixCell = { k: 'none' } | { k: 'round'; round: number; of: number }

/** The Review column's letters, in order. */
export const LETTERS = ['V', 'C', 'T', 'D'] as const
export type Letter = (typeof LETTERS)[number]
/** One Review letter. `amber` exists only for T: thermo was due and did not run. `claimed`: a VERIFIED line claimed it and the verifier session never ran it. */
export type Light = 'lit' | 'dim' | 'off' | 'amber' | 'na' | 'claimed'
export type ReviewCell =
  | { k: 'none' }
  | { k: 'offer'; skill: 'code-review' } // hotfix space: `c` fills /code-review
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

/** A parent and its on-screen children, or one parentless row. */
export type Group =
  | { k: 'single'; row: Row }
  | { k: 'parent'; parent: Ticket; title: string; done: number; total: number; needsYou: number; children: Row[] }

/** A pane with no Build or Review row: by its label, or, with none, by its tab's name. */
export type OtherItem = { k: 'labelled'; title: string; kind: Kind | undefined; ticket: Ticket | undefined; pane: PaneCell } | { k: 'unlabelled'; tab: string; pane: PaneCell }

/** One PR in the PRs tab, with the on-screen tickets it attached to (none for a ticketless PR on a pane's branch). */
export type PrItem = { pr: Pr; tickets: Ticket[] }
/** One repo's PRs, newest first as gh lists them. Groups follow the repos' poll order: frontend, backend, then the rest. */
export type PrGroup = { repo: string; items: PrItem[] }

/** heads, branches and origins all read git's own files, so their health is one git entry. */
export type GitSourceId = 'heads' | 'branches' | 'origins'
export type SourceHealth = { k: 'ok' } | { k: 'stale'; since: Ms } | { k: 'unavailable' }
export type Health = { [S in SourceId as S extends GitSourceId ? 'git' : S]: SourceHealth }

export type Board = {
  space: Space
  /** The Linear Project of this space; undefined hides the Linear column. */
  project: string | undefined
  /** The skill main itself ran last. Undefined until it runs one. */
  here: { skill: string } | undefined
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
}

// ── Intents: what a press asks for, as data (view.ts emits, register.ts performs) ──────────

export type Intent =
  | { k: 'tab'; tab: 'work' | 'prs' }
  | { k: 'focus-pane'; pane: PaneId }
  | { k: 'open-report'; ticket: Ticket }
  | { k: 'update'; pending: Pending[] } // ↻ or `u`: one /workspace update call
  | { k: 'fill'; text: string } // `c` /code-review, `m` "merge it #N": Andres presses Enter
  | { k: 'open-url'; url: string }
  | { k: 'checks'; pr: string } // `c`, or a PR row pressed: show or hide that PR's unfinished and failed checks

/**
 * `selected` is the ticket of the Work row whose button holds the focus ring, `selectedPr` the
 * same for a PR row (`owner/name#n`). `checks` is the PR whose checks are listed.
 */
export type PaneUi = { tab: 'work' | 'prs'; selected: string | undefined; selectedPr: string | undefined; checks: string | undefined }
