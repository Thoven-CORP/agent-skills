# WORKFLOW

How work is tracked at Thoven. Linear holds current requirements, accepted decisions, state and handoffs. Technical and design sources remain linked context.

**Project setup precedence (approved September 30, 2026).** For new Project setup or a scoped
proposal to change an existing Project, use `$linear-project` and read the live
[Project setup standard](https://linear.app/thoven/document/project-setup-standard-62e01c7c4f53).
It supersedes this reference's fixed milestone lifecycle, `feature-ledger open` setup routing and
repo-only document rule for those choices. Choose project-specific phases and link the actual
authoritative artifacts, including native Linear documents when appropriate. Existing sources and
tickets stay in place unless a scoped change is approved. Workspace owns ongoing native context
and Project Updates; feature-ledger retains its artifact and reconciliation responsibilities.

**A Linear issue links to its governing decision. Do not create a second current decision copy.**

**Current records policy (2026-10-28, homes revised 2026-10-30).** §5 names one owner per fact.
No project file is a universal prerequisite. Retain existing technical and history material.
Do not scaffold it to satisfy an example or require a bulk document sync.

The numbered ledger rules that skills cite (rule 2 points at its source, rule 4 owners must exist,
rule 9 prefer a script, rule 12 do not restate the prototype, rule 13 every surface has an authority)
live in the **Feature Folders** section of `~/thoven/CLAUDE.md`.

```
  Initiative      Thoven 2.0                  the release arc
  └ Project       Teacher 2.0: Dashboard      one feature, audience in the name
    └ Milestone   PRD + Architecture          the lifecycle, in order
                  Design
                  Build
                  Review
      └ Issue     wire notifications          one session · one Slice
        └ Sub     write the failing test      a step
```

⚠ **The audience goes in the Project's NAME**, as `<Audience>: <Feature>`. Linear gates
sub-initiatives behind the Enterprise plan, verified 2026-08-18. A prefix groups the board by sort
order, shows on every issue card without configuring a view, and needs no setup. A Project genuinely
serving two audiences is named `Shared: <Feature>`.

---

## 1. The words

Every piece of work sits in exactly one container.

**Surface.** A permanent area that never finishes: teacher dashboard, marketplace, classroom,
booking. A label, never a container.

**Initiative.** A release arc with an end. `Thoven 2.0`.

**Feature.** A named body of work holding several shippable Issues. In Linear, a **Project**, named
`<Audience>: <Feature>` — `Teacher 2.0: Dashboard`, `Student 2.0: Up Next`.

**Milestone.** One stage of a Feature's lifecycle: `PRD + Architecture` · `Design` · `Build` ·
`Review`. §3.

**Issue.** One unit of work a single agent session can finish, and **one Slice**: the decision says
it, the backend emits it, the contract pins it, the frontend renders it, a user reaches it on a
screen. The unit of claiming and the unit of shipping.

**Sub-issue.** A step inside an Issue, too small to claim alone.

**Unit shape by phase.** A Build-phase Issue is a vertical slice cut from a finished spec.

PRD and Design work is one **fat card** per stage. Surfaces and sweeps are ledger checkboxes
or Work-tab names, not Issues.

### States

| State | Means |
|---|---|
| **Triage** | A report nobody has accepted yet. The Bug template and integrations put it here. |
| **Backlog** | Parked by Andres in words ("park it", "later", "not this month"). |
| **Todo** | The default. Every issue a session creates is born here. Any agent may claim it. |
| **In Progress** | Someone is working on it now: a pane, or the main session with Andres. Protos and `app/dev/` are in scope on a document issue. Shipped product code waits for a Build issue. |
| **Ready** | Come look. The work is executed. A surface still needs his eyes. Not a merge queue. |
| **Done** | The issue's job is finished. Code executed. Design or PRD task complete. Merge is git and does not move this. |
| **Canceled** | Closed without shipping. Cancel rather than delete, so the id keeps resolving. |

Claim is `In Progress`. A `Writes to:` line names the Linear record or deliberately selected technical artifact. It does not pick a second lane.

**Born in Todo.** Create an issue with `state` left out; the THV team default is Todo (read from
Linear 2026-11-05). Pass `In Progress` instead when this session starts the work in the same turn.
A follow-up, a deferral, a spec that is not fully specced, a sub-issue of a parent nobody is
working: all Todo. How ready it is lives in its `Done when` line and its cycle, never in the
status. Linear's Active view hides Backlog, so an issue there drops out of sight; 92 agent-created
issues landed there before this rule.

**Backlog takes Andres's words.** An issue moves to Backlog only when Andres parks it in this
session, and the move's comment quotes his line. A reconcile, a cleanup, or a pane leaves Todo as
Todo.

**Work moves the status the turn it starts.** Any session that starts work on an issue sets
`In Progress` in that turn, the main session included: a design or spec session with Andres counts
the same as a dispatched pane. When a sub-issue goes `In Progress`, its parent goes `In Progress` in
the same write if the parent reads Todo or Backlog.

### Artifacts

| | |
|---|---|
| **PRD** | The problem and who has it. Attaches to a Feature. |
| **Spec** | What gets built, before how. |
| **Plan** | The task breakdown. Produces Issues. |
| **Ledger** | The Project's current accepted decision rows in Linear, with pointers to relevant technical and design sources. §5. |
| **Decision** | One resolved choice, carrying an id, **pointing at its source**. |
| **Proto** | A runnable HTML or React drawing. The contract for look and behaviour. Never markdown. **It is deleted the day its component ships**, with the surface's row repointed at `<component>@<commit>` — `feature-ledger` rule 15. A surface with two live artifacts has no contract. |
| **Log** | Issue comments and Project Updates in Linear: why, resolutions and where work stopped. |
| **Map** | The rendered view of the current Project snapshot. Derived per invocation, never hand-edited or synchronized between skills. |

### Reserved words

**Board** is a view of Issues, never a file. **Project** is the Linear container, never a git repo.
**Todo** is the tracker column, never an item type.

---

## 2. Routing

First yes wins.

```
1  Does it finish?                          No  →  Surface (a label)
2  Can one agent finish it in one session?  Yes →  ISSUE
3  Holds several Issues, one feature?       Yes →  PROJECT
                                                   named <Audience>: <Feature>
4  A release arc across features?           Yes →  INITIATIVE
```

Milestones are not routed to. Every Project has the same lifecycle (§3).

**Every Build Issue is vertical through both repos** — schema → API → contract → UI → test — and
demoable alone. Split an issue by repo and both suites can pass while the product is broken.

---

## 3. The lifecycle

### Starting a Feature

`linear-project` proposes or updates the native Project brief, relevant documents and milestones.
Local project folders and templates are optional. **Choosing which milestones this Project gets is the triage step**, and it is the only
planning done up front: the milestone set says what this Feature needs, and its absence says what it
does not.

Issues are created one milestone ahead. An issue's shape is not knowable until the milestone before
it closes.

### Which skills run which milestone

| Milestone | Skills |
|---|---|
| **PRD + Architecture** | `/grill-with-docs` · `/architect` · `/to-spec` · `/writing-plans` |
| **Design** | Proto at the path the fat card names. `thoven-designer` for a single component. |
| **Build** | `/to-tickets` cut the plan into vertical issues · `/verify` before Ready · `/blast-radius` when a small diff might break the other repo |
| **Review** | `/qa-flow` · the feature's `WALKTHROUGH_V*.md` |

```
┌─ 1 · PRD + ARCHITECTURE ──────────────────────── lane: In Progress ───┐
│   Every issue carries "Writes to:". Both repos' requirements land here.│
│     problem, who has it, stories → Project brief (§5)                  │
│     a decision                   → governing document (§5)             │
│     a technical artifact         → a repo path only when §5 selects it │
│   GATE  accepted outputs meet their criteria                        │
└────────────────────────────────────────────────────────────────────────┘
                                  ▼
┌─ 2 · DESIGN ──────────────────────────────────── lane: In Progress ───┐
│     proto                        → the design source the issue names   │
│     accepted choice              → governing document (§5)             │
│     component                    → the component + its token test      │
│   GATE  every DESIGN_<PROJECT>.md surface row resolves                 │
└────────────────────────────────────────────────────────────────────────┘
                                  ▼
┌─ 3 · BUILD ───────────────────────────────────── lane: In Progress ────┐
│   No "Writes to:". Each issue vertical through both repos.             │
│   Lands in the worktree the moment it works. Incomplete is fine.       │
│   GATE  mounted. A user reaches it.                                    │
└────────────────────────────────────────────────────────────────────────┘
                                  ▼
┌─ 4 · REVIEW ──────────────────────────────────── lane: In Progress ────┐
│     QA · walkthrough · merged                                          │
│   GATE  all milestones 100% → the Project is done                      │
└────────────────────────────────────────────────────────────────────────┘
```

**Trim any milestone that does not apply.** The absence is the decision: a Feature with no `Design`
milestone is one where design was considered and found unnecessary.

**The gate is native.** Linear computes milestone progress from its issues. Measured 2026-08-18:

```
progress counts ISSUES, not points     1 of 3 done = 33.33%, and the one
                                       closed was the 8-pointer
an EMPTY milestone reads 0%            never 100%
a CANCELED issue leaves the denominator  1 done of 2 remaining = 50%
```

Three consequences:

- **Trim means delete the milestone, never leave it empty.** An empty one reads 0% forever, so it is
  a gate that cannot open and it drags the Project's progress down with it.
- **Estimates do not move the bar, so do not estimate for the gate's sake.** What makes the bar
  honest is issue granularity: one enormous issue beside one tiny one reads 50% when the tiny one
  closes.
- **Cancel is how you drop scope after the fact,** and the gate can still reach 100% afterwards.

**A closed milestone stays closed.** When Design turns up a payload the contract missed, that is a
new issue in the milestone you are standing in, carrying a link to the decision it changes. Reopening
an earlier milestone makes its progress bar describe a past that did not happen.

**Backend and frontend requirements both live in `PRD + Architecture`.** There is no `Backend`
milestone; backend work is half of a vertical Build issue.

### What it looks like in flight

Milestones are created with the Project, so the whole feature is visible on day one. Issues are
created one milestone ahead, because an issue's shape is not knowable until the milestone before it
closes.

```
Teacher 2.0 ── the name prefix
│
├─ Shell ─────────────── Project
│    PRD+Arch  ████████  100%     GATE OPEN
│    Design    ████████  100%     GATE OPEN
│    Build     ██░░░░░░   33%  ◄── THV-59  mount the shell        In Progress
│    Review    ░░░░░░░░    0%
│
├─ Dashboard ─────────── Project
│    PRD+Arch  ██████░░   75%  ◄── THV-61  payload contract    In Progress
│    Design    ███░░░░░   40%
│    Build     ░░░░░░░░    0%     no issues yet, and that is correct
│    Review    ░░░░░░░░    0%
│
└─ Schedule · Business · Library · Onboarding · Settings
     every milestone at 0%, no issues. Also correct.
```

A Project is done when every one of its milestones reads 100%. The product appears before that: each
Build issue lands in the worktree the moment it works.

When the Project is done, its integration branch goes. GitHub deletes it on origin when it lands in
`main`. Remove each of its trees with `thoven-worktree remove`, which deletes the local branch once no
tree holds it and no open PR targets it.

---

## 4. The loop

```
  Triage
    │  Andres accepts: writes the brief, sets Project + Milestone, adds the cycle
    ▼
  Todo
    │  agent claims: In Progress, assigns itself, comments which tool it is
    ▼
  In Progress                                the lock. One issue, one session.
    │
    │  doc lands at the named path, or the code is executed
    ▼
  Ready          optional. A surface still needs his eyes.
    ▼
  Done           the job is finished. Merge is git. It does not move Linear.
```

```
  The milestone says WHICH STAGE.  The status says WHERE IT IS NOW.

  Triage ──► Backlog ──► Todo ──► In Progress ──► Ready ──► Done

  M1 PRD+Arch  issues carry "Writes to:"  ──►  In Progress
  M2 Design    issues carry "Writes to:"  ──►  In Progress
  M3 Build     issues do not              ──►  In Progress
  M4 Review    issues do not              ──►  In Progress
```

**A merged PR does not move Linear.** `Done` is finished work. `Ready` is come-look.
`THV-42` in a commit is a git reference. Do not write `Fixes`. That word auto-closes Linear.

### Branching across both repos

Each issue gets one worktree per repo it touches, made by `thoven-worktree create`. How it names
and bases them is the law: `~/thoven/agent-skills/enforcement/rules/thoven-law.md`.

A vertical issue touches both repos, so it gets **the same branch name in each**:

```
frontend    teacher/thv-42
backend     teacher/thv-42

"THV-42"  in both commits. No `Fixes`. That word auto-closes Linear.
```

One magic word per issue, or Linear closes it on whichever repo merges first while the other half is
still unmerged. Merge the backend first so the frontend never ships against a contract that is not
live yet.

### Done when

Every issue carries one, and it names something a person can check:

```
Done when: a teacher on /teacher/dashboard sees notification rows grouped by
section; the payload returns read state per thread; `grep -r thoven-sidebar
components app --include=*.tsx` returns a call site outside app/dev/.
```

A spec issue's is shorter, because `Writes to:` already names the artifact:

```
Writes to: https://linear.app/thoven/document/<document-id>
Done when: that document names every field this Feature reads, and each row says
whether the backend emits it today.
```

**Claim only from Todo.** Anything past it is owned by another session. `In Progress` + assignee
is the mutex across Cursor, Claude and Codex.

**An assignee must resolve to a real user.** So must a `blocked-by` link and a `DESIGN_<PROJECT>.md`
owning gate. An owner that cannot be linked does not exist.

---

## 5. Where things live

**Linear holds the current project record.** Read the current Project brief, parent decisions,
relevant linked document bodies, native issues/milestones and latest Project Update. Links alone
are not read evidence. Use the live Project setup standard through `linear-project` when changing
setup. Missing local files do not imply that setup is missing.

| Fact | Owner | Other records |
|---|---|---|
| Decision | The Project's governing decision document. One entry per choice. | The parent and the issue link the id. |
| Status | The issue state and the Project status field. | A Project Update names the state. |
| Brief and scope | The Project description. | |
| Handoff, progress, and risk | The latest Project Update, with a health value. | An issue comment links that Update. |
| Design and brainstorming | tldraw or Paper. | The accepted choice is a decision entry. |
| Technical detail, plans, and code | The owning repository, when a decision entry selects that path. | |
| Existing PRDs, `STATE.md`, `CONTINUE_HERE.md`, archives | Optional history. | No required copy. |

### Decision entry

One entry per choice, in the governing document.

- id
- ruling, one sentence
- reason
- rejected alternatives
- the source it points at
- what it supersedes
- status, from the vocabulary in `~/thoven/CLAUDE.md`

Amend that entry when the user rules. Preserve historical records and rejected alternatives. An accepted design source binds the surface it shows. A code component establishes current implementation, not a superseding product requirement. A missing required design or document is a named context gap, not permission to invent it.

### Project Update

One Update carries health (`onTrack`, `atRisk`, or `offTrack`), what changed, the decision ids, the risks, and what is next. It links each decision id. It does not restate the ruling.

Keep the existing Git branches and PR route across hosts. Use a dedicated disposable test mirror
for remote checks and separate worktrees for remote coding. See
[handoff.md](handoff.md) and [remote-check](../../remote-check/SKILL.md).

### Pure skill boundary and synthesis

`workspace` and `feature-ledger` independently read the same disclosed Project snapshot protocol.
Neither invokes the other, synchronizes hidden state, or relies on a previous invocation. `workspace`
owns mechanical orientation, lifecycle, capture, close, Map, and log. `feature-ledger` adds semantic
reconciliation across PRD, design, architecture, API/database, implementation, mounts, and proof.

The main session owns synthesis. It personally reads the snapshot fingerprint, every blocker and
unknown, semantic forks, bounded-agent receipts, and the exact proposed write set. Subagents inspect
bounded evidence only; they do not mutate shared Project state or Linear.

### The issue names where it sits, then the output path

The body stamp is §8 Location stamp (`Sits in:` · `Ledger:` · `Room:` · `Writes to:` · `Done when:`). This section is only the `Writes to:` routing rule.

An issue whose output is a document names its destination explicitly:

```text
Writes to: this ticket
Writes to: https://linear.app/thoven/document/<document-id>
```

A deliberately selected technical artifact may instead name an existing repository path. Resolve
Linear destinations with Linear access, not filesystem existence. A URL alone does not prove access.
A genuinely required local path that is invalid remains an error. The output must satisfy its
acceptance criteria; an empty file or document is not completion. New top-level folders remain
Andres's call. Do not rewrite an existing task's destination merely to orient a session.

### Plans

**Plan checkboxes are scratch.** How far this session got.
**Linear issue status is truth.** What is claimed, and what is done.

One agent, one session: the plan stays a file and Linear sees one Issue. Multiple sessions:
`/to-tickets` breaks it up and the plan keeps only the reasoning.

### Continuation

Record task handoffs in the relevant Linear issue or Project Update. Existing `CONTINUE_HERE.md`
files remain readable history. They are not required startup inputs and are not automatically
trimmed, rewritten or synchronized. Use [handoff.md](handoff.md) for actual read content and host,
worktree, paired-repo and proof provenance.

---

## 6. The workspace

**One team, `THV`.**

**Projects are Features, never repos.** A Project spans frontend and backend.

**Labels name the kind, and `THV` has exactly three:** `Bug` (something is broken),
`Improvement` (an existing thing made better) and `Feature` (a new capability). Give an issue one
when its kind is known. Checked against Linear 2026-10-08.

**The gate is a Status, not a label.** `Triage` means not yet agreed; `Todo` means an agent may
claim it. When `/to-spec`, `/to-tickets` or `triage` speak of `needs-triage` or `ready-for-agent`,
set that Status and leave the label off.

⚠ **Casing is exact.** Linear rejects case-variant duplicates and cannot rename, so `bug` would
create a second, unmergeable label. A new label is Andres's call, asked for before it is created.

The repo is not a label either. It belongs in the issue's *Done when*, where a
cross-repo issue names both.

**Blocking is a native relation, not a label.**

**Cycles: weekly, Monday start.** In the cycle is what you intend to touch this week. Review the
rollover rather than accepting it.

**WIP cap 3** on **Build** `In Progress` + `Ready`, one per agent. PRD and Design fat cards sit
outside that cap.

**Two views over one dataset.**

| View | Grouped by | Who |
|---|---|---|
| Shipping | Milestone | Andres, watching whether things ship |
| Work | Status | agents, moving issues |

**Linear is engineering work only.** The test: would an agent claim this and open a branch? Dogfood
observations, session synthesis, marketing copy, personal todos, CFO and fundraising stay in Notion.
A dogfood observation stays there; the bug it turns into is born in Linear.

---

## 7. Agent guidance

*Paste into Linear → Settings → Agents → Additional guidance.*

```
CREATING
- Leave the status out when you create an issue; it is born in Todo.
  Use In Progress if you start it now. Backlog only when Andres parks it.

CLAIMING
- Claim only from Todo. Anything past it is owned by another session.
  One issue = one agent session.
- Claim is always In Progress. A "Writes to:" line names the Linear record or deliberately selected technical artifact.
- To claim: set In Progress, take the issue, comment which tool you are.
- Start once the issue has a "Done when" line. If it has none, ask Andres in
  a comment.

DOCUMENTS
- Grill with /grill-with-docs, then /architect. Protos and app/dev/ routes are in scope.
  Shipped product code waits for a Build issue.
- Write to the record or technical path "Writes to:" names. Done when its acceptance criteria pass, not merely when it exists. Then set Ready.
- If the grill produces build work, run /to-tickets after Andres asks. /writing-plans still exists for a session plan.
- New top-level docs/ folders are Andres's call. Ask in a comment.
- Decisions live in the governing document named in §5. The parent issue links that document by id.

BUILDING
- Every issue is vertical through both repos, and demoable alone.
- Ship it into the worktree the moment it works. Visibly incomplete is fine.
- Built means mounted. A file with no call sites is not done.

BRANCHES AND PULL REQUESTS
- Branch, PR and worktree rules: `~/thoven/agent-skills/enforcement/rules/thoven-law.md`.
  `thoven-worktree create <fe|be> <area> <id>` gives `<area>/thv-<id>`, the same name in both repos.
- Open a PR into `main` and arm auto-merge as it opens; GitHub merges it on green `CI`, backend first, with no go from Andres, UI included (2026-11-05). The method follows the PR's role (thoven-law.md "Branches and PRs"): a ticket squashes (`gh pr merge --auto --squash` into `main`; into an integration branch, `--squash` on green targeted CI and the verifier's pass), a docs-only PR merges in the same pass, and an integration branch landing in `main` or a catch-up of `main` merges with `--merge`. Name source, target and method in the report line.
- Put `THV-<id>` in the commit message with no magic word. `Fixes` auto-closes Linear. Merge does not own Done.
- A ticket that takes more than one PR: an id in the branch name or PR title links that PR as closing, so its first merge moves the ticket to Done. Keep the id out of both and write `Part of THV-<id>` in the PR body, which links without closing. (2026-10-25: the test-cadence ticket closed on its first of five PRs.)
- Write Ready if a surface still needs his eyes. Write Done when the job is finished, and only after
  `dispatch-work`'s close step has run for it: panes closed, its tree removed, its merged branches gone. UI merges on green `CI` too; Andres reviews it on staging.
- `--auto` merges once the `CI` check passes. Watch a PR unattended with `/babysit-pr` (`pr-wait --until green`), or with `/loop-on-ci` when you watch CI in the terminal.
- A PR or branch behind `main`: `/modernize` gives MODERNIZE, REWORK or CLOSE before any rebase. On a shared integration branch take the verdict only; the catch-up stays a merge commit.
- Another person's or agent's PR, branch or dead pane: `/takeover` re-proves it and keeps their credit.
- In the same comment, say what you did AND what you deliberately did not do.

DEFERRING
- A deferral is a Linear issue or it does not exist.
- Name an owner that resolves and link blocked-by.
```

---

## 8. Rex and herdr — the physical layout of sessions

*Added 2026-08-24, from the Parent 2.0 Lane B/C/D orchestration. Linear stays the source of
truth; the multiplexer makes parallelism visible. New Projects open in Rex (2026-10-22); Projects
already in herdr finish there. The same names apply in both: a Rex **session** is a herdr
**space**, a Rex **window** is a herdr **tab**, a Rex **block** is a herdr **pane**.*

### The mapping

| Linear | Rex / herdr | Rule |
|---|---|---|
| Feature / Linear **Project** | Rex **session** / herdr **space** (see Live spaces below) | One Project and one ledger. Meta is optional. An audience is several spaces, not one. |
| (none required) | **Work tab** | A prose unit Meta or Andres named (`notifications`, `upcoming`, `payments`). Independent items get their own tab. A checkbox on the fat card does not. |
| Issue, when one exists | **Pane**. Label = `<Kind> · <job> (THV-x)` | `Design · Messages panel (THV-149)`. Kind is the milestone word for milestone work (`Plan` covers PRD and Architecture), `Research`, `Audit` or `Fix` for work outside a milestone, and `Meta` for main. `dispatch-work/scripts/dispatch label --kinds` prints the full list, and `dispatch label` refuses any other word. A pane can exist before a THV- does. Status words stay on Meta, not the pane name. |
| Dispatched issue (`dispatch-work`) | **Window / tab** = the issue, **blocks / panes** = its sub-issues | Main creates them when it dispatches. Sub-issue panes run in parallel only when their Paths share no file. Andres ruling 2026-09-27. |
| | Optional **Meta** tab in that space | An organizer for **this** Project when orchestration needs one. |

A space may carry one **`Meta · <Project>`** tab. Meta is a convenience, not a prerequisite for
Project work or a source of truth. When present, it consumes the same Project snapshot, reports to
Andres, and proposes bounded panes; the main session still owns synthesis and shared writes.

### Live spaces

Derived, never hand-kept: `rex ls` lists Rex sessions and `herdr workspace list` lists herdr
spaces. A session or space is named for its Linear Project, so the name is the mapping. One with no
matching Project is a hotfix, scratch or repo-home room.

### Ledger bind

Retired by THV-1038 (2026-10-03), with the Teacher 2.0 and Parent 2.0 Project folders it bound.
No space binds a folder now. Meta writes only for the Project it was opened for, and Project state
is Linear's.

### Two ladders, one board

Do not collapse these. They answer different questions.

| Ladder | Question | Lives |
|---|---|---|
| **Initiative → Project → Issue** | Which audience, which feature, which slice | Linear + the multiplexer (session or space = Project, pane = issue when one exists) |
| **Milestone** | Which **lifecycle** is this slice in (spec, draw, code, review) | Linear field on the issue. **Tag on the pane label.** No tab named Design. |
| **DESIGN_SKELETON L1–L6** | How far the **design walk** for a track has gone | Hash bars in the skeleton. Not a Linear milestone |

A Dashboard issue in `Build` can sit under an L3 wireframe bar. That is consistent: this slice is being coded while another track is still drawing.

### Location stamp (on every issue)

The issue **points**. It does not retell the spec. One block at the top of the body, always:

```
Sits in: <Initiative> · <Audience>: <Feature> · <Milestone>
Ledger: <decision id in the §5 document>
Room: ~<Project session or space> / <tab>
Writes to: this ticket, or a Linear document URL. Omit on Build/Review.
Done when: <checkable outcome>
```

`Sits in:` is how the workflow shows up **on the ticket**. Workspace writes this at create and at claim. Meta's pane label is milestone + job, then the id.

**Trust the multiplexer, not OpenCode chrome.** The pane label and the tab label are the room. OpenCode's session title (`OC | THV-178 Business Shell…`) is a leftover from whichever chat was last `/rename`d inside that process. If it disagrees with the pane, it is wrong. Fix it with `/rename` in that chat to the **same sentence as the pane label**. Route work by the pane label.

### Meta vs Work panes — the scoping rule

- **Meta, when used, organizes one Project.** It reads this space, the shared Project snapshot, this fat card, and this ledger. It writes only approved orchestration surfaces — this Project's Linear records and prompts into panes. It never writes feature code or another Project's folder.
- **Work panes are narrow**: one room, one job, a ticket when one exists. They
  do not run workspace or feature-ledger. They do not read each other or the plan
  doc beyond their brief. Andres owns those chats. Meta pastes into them only after
  explicit go.
- Model tiering follows the tiers in `dispatch-work/references/agents.md`.

### Lifecycle

This lifecycle is for Work panes Andres drives. A dispatched issue follows the `dispatch-work`
skill from spawn to close.

1. Launch = paste-ready initiator from Meta (`Begin <id>` when an issue exists),
   staggered ~5 min apart, and only after Andres says go. Spinning a room does
   not mint a ticket. The Begin does not tell the pane to run workspace or
   feature-ledger.
2. Work **pane** titles itself **milestone + job**, then the id:
   `Design · Messages panel (THV-149)`. The **tab** stays the named room.
   After a recycle-and-Begin in the same pane, rename the pane **and** `/rename` the
   OpenCode session, or the next glance still says the old ticket.
3. When Meta is present, it proposes the relevant Linear handoff or Project Update from the
   current sources and snapshot. Main applies approved Project-scoped writes serially and reads
   them back. Do not maintain required local state copies.
4. A Work pane stays until Andres has seen the surface. Idle after work is a Meta
   recap + how-to-proceed, not an auto-Begin and not a recycle. Unsatisfied → he
   types in that pane, or Meta pastes his approved correction. Recycle only after
   he is satisfied, or he confirms a leftover. Linear Ready is not a visual pass.
5. The human owns the issue; agents receive bounded work units and exact path sets. Record starting
   HEAD plus staged, unstaged, and untracked paths. Disjoint work units may proceed and commit
   independently on one issue. Same-file work blocks until a named integration session serializes
   it. Commit every coherent green unit by exact path even when unrelated files are dirty. Leave red
   or incomplete work uncommitted only with an evidence receipt naming its paths and blocker. Never
   use `-A`, stash, `checkout -f`, `reset --hard`, or `clean` on shared work.

## 9. Gotchas

- **Count a branch's own commits with `main..HEAD`.** A bare `--since` counts commits the branch
  inherited and reports dormant branches as busy.
- **Take the log watermark from `git log -1 --format=%aI`,** not the date written inside an entry.
- **Use whichever Linear MCP is actually loaded.** In Claude Code that is the plugin connector
  (`mcp__plugin_linear_linear__*`); other clients may only load the UUID one
  (`mcp__claude_ai_Linear__*`). Before declaring either dead, call a read (`list_issues`) and
  check the exact tool name that responds.
- **Moving a parent issue to Done can auto-close its sub-issues silently.** A Linear automation
  closes open children when the parent goes Done (THV-848 to Done closed THV-850). Before moving a
  parent to Done, list its children first (`list_issues` with `parentId=<id>`) with their state
  and cycle. After the save, re-list and restore any child that moved: use `get_issue`
  `stateHistory` to find its state before the move, and restore both state and cycle (a Backlog
  child normally has cycle null). Adding a Backlog issue to the active cycle also moves it to Todo
  silently, so the same check applies there.
- **Confirm the live write tool with a read, then use it.** Issue text is `save_issue`. A comment is `save_comment`. A native document is `save_document`. The Project description is `save_project`. A Project Update is `save_status_update`, and it includes a health value (`onTrack`, `atRisk`, or `offTrack`). These names were read from the Linear connector on 2026-10-30. A client whose tool list differs uses the name that read returns. An unknown tool name reports as "failed to connect," not "unknown tool." If reads work and a write cannot connect, check the tool name before retrying.
- **Cancel an issue to close it,** so the id keeps resolving. Delete a *decision* row once it is
  superseded; keep a *rejected alternative* inside the drawing.
- **Read a merge before trusting it.** `.claude/launch.json` merges cleanly and wrong across
  worktrees, taking the other checkout's port.
- **Staging and publish are not on the board.** They live in the CHANGELOG.
- **OpenCode's session title is not the pane.** `herdr pane list` / `herdr tab list` are. A dashboard
  pane showing `OC | THV-178…` is a stale inner title, not proof that Business is in that tab.
