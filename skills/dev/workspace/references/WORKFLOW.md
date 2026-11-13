# WORKFLOW

How work is tracked at Thoven. Linear holds current requirements, accepted decisions, state and handoffs. Technical and design sources remain linked context.

**A ticket links the Spec and Architecture headings it builds. Do not create a second current copy of a decision.**

**Current records policy (2026-10-28, homes revised 2026-10-30).** `SKILL.md`, "Writing to Linear", names one home per kind of writing.
No project file is a universal prerequisite. Retain existing technical and history material.
Do not scaffold it to satisfy an example or require a bulk document sync.

The rules on pointing at sources and on where a fact lives are in `~/thoven/agent-skills/enforcement/rules/thoven-law.md`, "Records and sources", and in `$feature-ledger`.

```
  Initiative      Thoven 2.0                  the release arc
  └ Project       Teacher 2.0: Dashboard      one feature, audience in the name
    └ Milestone   3 to 5, then Follow-ups    a stage Andres can open on staging
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

**Feature.** A named body of work holding several shippable Issues, with an end. In Linear, a
**Project** inside an Initiative, named `<Audience>: <Feature>` — `Teacher 2.0: Dashboard`,
`Student 2.0: Up Next`.

**Standing project.** Ongoing work with no end date: `Tech debt`, `Small fixes`, `Operations`. A
ticket for no feature goes in one. **No ticket floats with no Project**: it is on no page Andres reads.

**Milestone.** A stage Andres can open on staging and judge: three to five per Project, then a last
one, **Follow-ups**. The status, not the milestone, says where a slice is in its lifecycle.

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
| **Triage** | The inbox: a report or a `Tech debt` ticket nobody has accepted yet. It cannot leave without a priority. |
| **Backlog** | Parked by Andres in words ("park it", "later", "not this month"). |
| **Todo** | The default. Every issue a session creates is born here. Any agent may claim it. |
| **In Progress** | A builder is building: a pane, or the main session with Andres. Protos and `app/dev/` are in scope on a document issue. Shipped product code waits for a Build issue. |
| **In Review** | Its pull request is open. |
| **Merged** | In the Project's integration branch, not yet in `main`. |
| **Done** | In `main`. |
| **Canceled** | Closed without shipping. Cancel rather than delete, so the id keeps resolving. |

Done is in `main`, where a user can reach the work. `Ready` ("come look") is now `In Review`.

Claim is `In Progress`. A `Writes to:` line names the Linear record or deliberately selected technical artifact. It does not pick a second lane.

**Linear moves a ticket with its pull request; an agent sets only `In Progress`, when it claims.**
A draft PR sets In Progress. An opened PR, a review request and ready-to-merge set In Review. A
merge into a Project's integration branch sets Merged, into `main` Done. This is the main team
(`THV`); Deployment and Lab keep their own rules. A ticket with no PR (a document, research) moves
by hand: In Review when the work is at its path, Done when every exit line is shown true (main's
reading; the rulings cover pull requests).

**Born in Todo.** Create an issue with `state` left out; the THV team default is Todo (read from
Linear 2026-11-05). Pass `In Progress` instead when this session starts the work in the same turn.
A follow-up, a deferral, a spec that is not fully specced, a sub-issue of a parent nobody is
working: all Todo. How ready it is lives in its Exit criteria and its cycle, never in the
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
| **Spec** | Current truth: what each surface shows and does. A native Linear document. |
| **Architecture** | How it is built: data, payload fields, modules by path. A native Linear document. |
| **Log** | Why the Spec or Architecture changed: the question, his words, options turned down, the chat it came from. A native Linear document. |
| **Plan** | The builder's scratch file for its own session. Never a Project document. |
| **Proto** | A runnable HTML or React drawing. The contract for look and behaviour. Never markdown. **It is deleted the day its component ships**, with the surface's row repointed at `<component>@<commit>` (`feature-ledger` `references/RECONCILIATION.md`). A surface with two live artifacts has no contract. |
| **Activity** | Issue comments and Project Updates: status events, progress, where work stopped. |
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

Milestones are not routed to. `$linear-project` chooses them (§3).

**Every Build Issue is vertical through both repos** — schema → API → contract → UI → test — and
demoable alone. Split an issue by repo and both suites can pass while the product is broken.

---

## 3. The lifecycle

`$linear-project` chooses each Project's three to five stages with Andres, and Follow-ups is always last. Issues are created one milestone ahead, because an issue's shape is not knowable until the milestone before it closes.

**The gate is native.** Linear counts issues, not points, toward milestone progress. An empty milestone reads 0% forever, and a canceled issue leaves the denominator (measured 2026-08-18). Trim a milestone by deleting it; drop scope by canceling the issue.

**A closed milestone stays closed.** When later work turns up a payload the contract missed, that is a new issue in the current milestone, linking the Spec or Architecture heading it changes.

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
    │  PR opened (Linear moves it from here down)
    ▼
  In Review
    │  merged into the Project's integration branch (a PR into `main` skips Merged)
    ▼
  Merged
    │  the integration branch lands in `main`
    ▼
  Done
```

The id in the branch name or PR title links the PR to its ticket. `THV-42` in a commit is a git
reference and moves nothing. A closing word (`Fixes`, `Closes`) belongs only in the landing PR's
description (`branches-and-prs.md`, "Landing line"), because Linear moves only the tickets that PR
names.

**Auto-close stays on** (Andres's pick, against main's recommendation, 2026-11-12): closing the last
child closes the parent, and closing a parent closes its remaining children. Read the children
first (Gotchas).

### Branching across both repos

Each issue gets one worktree per repo it touches, made by `thoven-worktree create`. How it names
and bases them is `~/thoven/agent-skills/enforcement/rules/branches-and-prs.md`.

A vertical issue touches both repos, so it gets **the same branch name in each**:

```
frontend    teacher/thv-42
backend     teacher/thv-42

"THV-42"  in both commits. No closing word outside the landing PR.
```

Both PRs link the issue by its id. Linear's documentation says a ticket waits until every linked PR
has merged (not yet seen on a Thoven ticket), so read the status after the second merge. Merge the backend first so the frontend never ships against a contract that
is not live yet.

### The ticket

The ticket is the builder's brief. A build ticket is written from the Build ticket template; research, design, plan, review and spec work from the Work item template. In order:

- `Writes to:` on its own line, first. A build ticket names `[frontend, backend or both] on [branch]`. Other work names the Linear document and heading it fills, or `this ticket`. The session gate reads this line.
- **Outcome.** One or two sentences: what a person can do when this ships, and why it matters to them. It links the Spec's "Done for the product" line it serves.
- **What to build.** The pieces, one line each, each linked to its row in the Architecture's Units table. The builder plans its own steps.
- **Build from.** Links only, each to its exact heading: the Spec rules, the screens, the Architecture units, and the existing modules to extend, by path.
- **Exit criteria.** Three to ten exit lines on a build ticket, one to five on other work.
- **Leave alone.** Optional. Neighbouring screens or code the builder must leave as they are.

The whole ticket is 400 words at most. More than ten exit lines means two tickets. Project, milestone, assignee and blocking are native fields and relations; the body leaves them out. A subissue links its parent and holds only its own part.

A Linear destination resolves with Linear access, not filesystem existence; a URL alone does not prove access. A technical artifact may name an existing repository path, and a required local path that does not resolve is an error. A new top-level folder is Andres's call. Do not rewrite an existing task's destination merely to orient a session.

### Exit criteria

Every ticket carries `## Exit criteria`: three to ten exit lines on a build ticket, one to five on
other work, the one target for the builder and the reviewer. An exit line is one outcome a person can see or a caller can observe,
then `Proof:` and the one check that cannot pass while the outcome is false. The outcome comes
first, so a green check alone never counts as done.

- **Write the outcome from the user's side:** who does what, where, and what happens. For a
  component or a button: what each action does, which states it shows, and what happens on a phone.
- **Pick the proof at the highest point a person or caller reaches:** the unit's "Smallest proof"
  in the architecture, a response body, a search that finds nothing, or the design capture beside
  its frame. "A named spec is green" with no outcome before it proves nothing.
- **Every behaviour the spec gives this ticket has a line,** linking its spec rule or frame. The
  behaviour with no line is the one that ships missing: the stamp pack shipped silent because no
  line said it plays the lab's sounds.
- **Main and Andres edit exit lines,** when the Spec line a line serves changes. The builder never
  edits them; a builder who thinks one is wrong asks main. A narrower build is fixed in the build,
  never in the line.
- **Done is every line shown true.** The builder runs each proof once and attaches it to its one
  report. An issue moves to Done only when every line has its proof. Until then its branch and
  worktree stay, and an unproven line is finished there, never split into a new issue or PR.
  (2026-11-08: the merge-queue ticket closed with its rejection proof still open, and the
  leftovers became new trees, two sync PRs and a probe PR.)

A screen with a design (ids are illustrative):

```
## Exit criteria
- A parent on the passport page taps Edit on the goal, the genres, the stage name or the logo,
  saves, and sees the new value on the passport and after a reload (S12). Proof: a Playwright
  test that edits, reloads and reads each field.
- The child redoes the logo from their own passport the same way (S14). Proof: the same test,
  signed in as the child.
- With the network off, Save shows the load-error card and keeps what was typed. Proof: a
  component test with Save failing.
- At each frame's width, desktop and phone, the passport shows what frames F3 and F3-phone show:
  the same elements, states and order. Proof: the design capture beside both frames.
```

An API change with no screen:

```
## Exit criteria
- POST /admin/credentials/:id/decide with outcome `rejected` and no note returns 422 naming
  `note`. Proof: a request spec on the 422 body.
- With a note, it saves both, and the credential GET returns `outcome` and `note` as keys (S7).
  Proof: a request spec that finds both keys in the GET body.
- A client still sending the old body gets 200 until the frontend that sends `note` is on
  staging. Proof: a request spec that posts the old body.
```

A refactor:

```
## Exit criteria
- Retry after an upload whose reply was lost reads the class list first, through one module that
  MaterialsWorkspace and the live-lesson stage both call. Proof: a unit test of that module that
  loses the reply and sees the list read first.
- No other copy of that rule is left in product code. Proof: `rg` for the old inline check finds
  nothing.
- Both screens behave and look as before. Proof: both screens' existing tests pass unchanged, and
  each screen's design capture matches its own baseline.
```

**Claim only from Todo.** Anything past it is owned by another session. `In Progress` + assignee
is the mutex across Cursor, Claude and Codex.

**An assignee must resolve to a real user.** So must a `blocked-by` link. An owner that cannot be linked does not exist.

---

## 5. Where things live

The homes, and how current truth reads, are in `SKILL.md`, "Writing to Linear". Before work, read the Project brief, the Spec and Architecture bodies, native issues and milestones, and the latest Project Update; a link alone is not a read.

A Project's Spec, Architecture and Log are native Linear documents in that Project, created from their templates. A Project whose work fits one ticket keeps its spec in the ticket (`Writes to: this ticket`) and needs none of the three. Technical detail that lives in code, such as a schema or a contract file, stays at the repo path the Architecture names.

An accepted design source binds the surface it shows. A shipped component is the current implementation, not a newer requirement. A design or document that does not exist yet is an open question in the Spec, never invented content.

### Project Update

Post an Update on every landing (a merge into `main`; main's reading) and every week, because Andres reads where a Project stands from
the newest one. It carries health (`onTrack`, `atRisk`, or `offTrack`), what changed, the Spec
headings it changed, the risks, and what is next, in 150 words at most. It links each heading and
does not restate the change.

Health (main's reading, 2026-11-12, not Andres's words): **off track** when open work has not moved
in 14 days or a blocker has no owner; **at risk** when something waits on Andres or a target date
has passed; otherwise **on track**.

**The front page.** The Project description opens with **Where we are**, 200 words at most, one
screen: **Built**, **Next**, **Blocked**, **Needs Andres**. Whoever posts an Update rewrites this
block in place in the same turn, so the state reads before any history. Purpose, scope and sources
follow it (`$linear-project`).

Keep the existing Git branches and PR route across hosts. Use a dedicated disposable test mirror
for remote checks and separate worktrees for remote coding. See
[handoff.md](handoff.md) and [remote-check](../../remote-check/SKILL.md).

### Pure skill boundary and synthesis

`workspace` and `feature-ledger` independently read the same disclosed Project snapshot protocol.
Neither invokes the other, synchronizes hidden state, or relies on a previous invocation. `workspace`
owns mechanical orientation, lifecycle, capture, close, Map, and log. `feature-ledger` adds semantic
reconciliation across the Spec, design, Architecture, API/database, implementation, mounts, and proof.

The main session owns synthesis. It personally reads the snapshot fingerprint, every blocker and
unknown, semantic forks, bounded-agent receipts, and the exact proposed write set. Subagents inspect
bounded evidence only; they do not mutate shared Project state or Linear.

### Plans

**Plan checkboxes are scratch.** How far this session got.
**Linear issue status is truth.** What is claimed, and what is done.

A plan is the builder's scratch file for its own session, never a Project document. Work that spans sessions is tickets, each with its own exit criteria.

### Continuation

Record task handoffs in the relevant Linear issue or Project Update. Existing `CONTINUE_HERE.md`
files remain readable history. They are not required startup inputs and are not automatically
trimmed, rewritten or synchronized. Use [handoff.md](handoff.md) for actual read content and host,
worktree, paired-repo and proof provenance.

---

## 6. The workspace

**One team, `THV`.**

**Projects are Features, never repos.** A Project spans frontend and backend. A standing Project
(`Tech debt`, `Small fixes`, `Operations`) has no end date.

**The workspace has two labels, `Follow-up` and `Tech debt`,** because "the labels need to be
actually something useful" (Andres, 2026-11-12); the ticket header already says its kind. `Bug`,
`Feature` and `Improvement` are retired: old tickets keep them, no new ticket gets one. Deployment's
own labels are untouched.

### Follow-ups

A problem found during a build goes by where it sits:

| Where it sits | Label | Goes to |
|---|---|---|
| In the feature's own code | `Follow-up` | The same Project, milestone **Follow-ups** (its last stage) |
| Outside the feature's code | `Tech debt` | The inbox (Triage). Andres accepts it into the `Tech debt` Project, declines it, or marks it a duplicate |

A builder or reviewer files each problem the round leaves (law, "Scope") as its own ticket with its
evidence, because a ticket shows in a view and a line inside another ticket does not.

### Priority

Set priority only where it changes the order: Projects, bug tickets, `Follow-up` and `Tech debt`.
A build ticket takes its parent's. **Urgent means production is broken**, so the word keeps its
alarm. A ticket cannot leave the inbox without a priority.

**The gate is a Status, not a label.** `Triage` means not yet agreed; `Todo` means an agent may
claim it. When `/to-tickets` or `triage` speak of `needs-triage` or `ready-for-agent`,
set that Status and leave the label off.

⚠ **Casing is exact.** Linear rejects case-variant duplicates and cannot rename, so `follow-up` would
create a second, unmergeable label. A new label is Andres's call, asked for before it is created.

The repo is not a label either. It belongs in the build ticket's `Writes to:` line, where a
cross-repo ticket names both.

**Blocking is a native relation, not a label.**

**Cycles: weekly, Monday start.** In the cycle is what you intend to touch this week. Review the
rollover rather than accepting it.

**WIP cap 3** on **Build** `In Progress` + `In Review`, one per agent. PRD and Design fat cards sit
outside that cap.

**Views.** Two over one dataset, and five that show where the Project is lost:

| View | Grouped by | Who |
|---|---|---|
| Shipping | Milestone | Andres, watching whether things ship |
| Work | Status | agents, moving issues |
| Building now · Merged, not in main · Project health · Follow-ups and tech debt · Tickets with no project | | Andres |

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
- Every ticket has a Project: a standing one (Tech debt, Small fixes, Operations) when it belongs
  to no feature. Labels are only `Follow-up` and `Tech debt`.

CLAIMING
- Claim only from Todo. Anything past it is owned by another session.
  One issue = one agent session.
- Claim is always In Progress. A "Writes to:" line names the Linear record or deliberately selected technical artifact.
- To claim: set In Progress, take the issue, comment which tool you are.
- Start once the issue has Exit criteria. If it has none, ask Andres in
  a comment.

DOCUMENTS
- Grill with /grill-with-docs, then /architect. Protos and app/dev/ routes are in scope.
  Shipped product code waits for a Build issue.
- Write to the record or technical path "Writes to:" names. Done when its exit criteria pass, not merely when it exists. Then set In Review (no pull request moves it).
- If the grill produces build work, run /to-tickets after Andres asks.
- New top-level docs/ folders are Andres's call. Ask in a comment.
- Current truth lives in the Project's Spec and Architecture; why it changed lives in the Log. A ticket links the headings it builds.

BUILDING
- Every issue is vertical through both repos, and demoable alone.
- Ship it into the worktree the moment it works. Visibly incomplete is fine.
- Built means mounted. A file with no call sites is not done.

BRANCHES AND PULL REQUESTS
- Branch, PR and worktree rules: `~/thoven/agent-skills/enforcement/rules/branches-and-prs.md`.
  `thoven-worktree create <fe|be> <area> <id>` gives `<area>/thv-<id>`, the same name in both repos.
- Open a PR, append the ticket's remaining known work to it, and arm auto-merge once its PR review passes, backend first, with no go from Andres, UI included (2026-11-05). The merge method follows the PR's role (`branches-and-prs.md`); name source, target and method in the report line.
- Put `THV-<id>` in the commit message with no closing word. Linear moves the ticket with its PR: In Review when the PR opens, Merged when it lands in an integration branch, Done in `main`. The PR that lands an integration branch in `main` lists every ticket it carries as `Closes THV-<id>` (`branches-and-prs.md`, "Landing line").
- A ticket that takes more than one PR: an id in the branch name or PR title links that PR as closing, so its first merge moves the ticket to Merged or Done. Keep the id out of both and write `Part of THV-<id>` in the PR body, which links without closing. (2026-10-25: the test-cadence ticket closed on its first of five PRs.)
- After the merge, read the status back (Linear set it) and run `dispatch-work`'s close step: panes closed, its tree removed, its merged branches gone. UI merges on green `CI` too; Andres reviews it on staging.
- Watch a PR unattended with `/babysit-pr`, then for a PR into `main` with `enforcement/bin/pr-queue-wait <owner/repo> <n>` (`branches-and-prs.md`).
- A PR or branch behind `main`: `/modernize` gives MODERNIZE, REWORK or CLOSE before any rebase. On a shared integration branch take the verdict only; the catch-up stays a merge commit.
- Another person's or agent's PR, branch or dead pane: `/takeover` re-proves it and keeps their credit.
- In the same comment, say what you did AND what you deliberately did not do.

DEFERRING
- A deferral is a Linear issue or it does not exist: `Follow-up` or `Tech debt` by where the problem sits (WORKFLOW, "Follow-ups"), with a priority.
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
| Issue, when one exists | **Pane**. Label = `<Kind> · <job> (THV-x)` | `Design · Messages panel (THV-149)`. Kind is the kind of job (`Plan` covers PRD and Architecture) and `Meta` is main. `dispatch-work/scripts/dispatch label --kinds` prints the list, and `dispatch label` refuses any other word. A pane can exist before a THV- does. Status words stay on Meta, not the pane name. |
| Dispatched issue (`dispatch-work`) | **Window / tab** = the issue, **blocks / panes** = its sub-issues | Main creates them when it dispatches. Sub-issue panes run in parallel only when their Paths share no file. Andres ruling 2026-09-27. |
| | Optional **Meta** tab in that space | An organizer for **this** Project when orchestration needs one. |

A space may carry one **`Meta · <Project>`** tab. Meta is a convenience, not a prerequisite for
Project work or a source of truth. When present, it consumes the same Project snapshot, reports to
Andres, and proposes bounded panes; the main session still owns synthesis and shared writes.

### Live spaces

Derived, never hand-kept: `rex ls` lists Rex sessions and `herdr workspace list` lists herdr
spaces. A session or space is named for its Linear Project, so the name is the mapping. One with no
matching Project is a hotfix, scratch or repo-home room.

### Two ladders, one board

Do not collapse these. They answer different questions.

| Ladder | Question | Lives |
|---|---|---|
| **Initiative → Project → Issue** | Which audience, which feature, which slice | Linear + the multiplexer (session or space = Project, pane = issue when one exists) |
| **Milestone** | Which stage of the feature, one Andres can open on staging, does this slice belong to | Linear field on the issue. The pane label carries the kind, never the milestone. No tab named Design. |
| **DESIGN_SKELETON L1–L6** | How far the **design walk** for a track has gone | Hash bars in the skeleton. Not a Linear milestone |

A Dashboard `Build` issue can sit under an L3 wireframe bar. That is consistent: this slice is being coded while another track is still drawing.

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
2. Work **pane** titles itself **kind + job**, then the id:
   `Design · Messages panel (THV-149)`. The **tab** stays the named room.
   After a recycle-and-Begin in the same pane, rename the pane **and** `/rename` the
   OpenCode session, or the next glance still says the old ticket.
3. When Meta is present, it proposes the relevant Linear handoff or Project Update from the
   current sources and snapshot. Main applies approved Project-scoped writes serially and reads
   them back. Do not maintain required local state copies.
4. A Work pane stays until Andres has seen the surface. Idle after work is a Meta
   recap + how-to-proceed, not an auto-Begin and not a recycle. Unsatisfied → he
   types in that pane, or Meta pastes his approved correction. Recycle only after
   he is satisfied, or he confirms a leftover. Linear In Review is not a visual pass.
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
- **A parent that closes closes its open sub-issues silently,** and auto-close stays on (Andres's
  pick, 2026-11-12; THV-848 to Done closed THV-850). Before a parent closes, in Linear or by merge,
  list its children (`list_issues` with `parentId=<id>`) with their state and cycle; move an unbuilt
  one out first. After the save, re-list and restore any child that moved: use `get_issue`
  `stateHistory` to find its state before the move, and restore both state and cycle (a Backlog
  child normally has cycle null). Adding a Backlog issue to the active cycle also moves it to Todo
  silently, so the same check applies there.
- **Confirm the live write tool with a read, then use it.** Issue text is `save_issue`. A comment is `save_comment`. A native document is `save_document`. The Project description is `save_project`. A Project Update is `save_status_update`, and it includes a health value (`onTrack`, `atRisk`, or `offTrack`). These names were read from the Linear connector on 2026-10-30. A client whose tool list differs uses the name that read returns. An unknown tool name reports as "failed to connect," not "unknown tool." If reads work and a write cannot connect, check the tool name before retrying.
- **Cancel an issue to close it,** so the id keeps resolving. Edit a Spec section in place when it changes; the option it replaced goes in the Log.
- **Read a merge before trusting it.** `.claude/launch.json` merges cleanly and wrong across
  worktrees, taking the other checkout's port.
- **Staging and publish are not on the board.** They live in the GitHub Releases on `prod/` tags.
