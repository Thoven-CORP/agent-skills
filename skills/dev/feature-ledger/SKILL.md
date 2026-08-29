---
name: feature-ledger
description: >-
  Open and reconcile a feature's ledger. Use when starting a large feature, when
  writing the ledger, when a decision or user story is stated mid-session, before
  a plan or PRD, at a handoff, or when asked which doc is live. First action is
  the session gate — do not file a row while the issue is Todo. Other skills
  reach this before they write.
---

# Feature Ledger

## Session gate

Name the `THV-` issue. Fetch it. Run:

```bash
node ~/.agents/skills/workspace/tools/session-preflight.js <<'JSON'
{ "identifier": "THV-63", "state": "Todo", "assignee": null, "milestone": null, "writesTo": "…", "writesToExists": true }
JSON
```

Exit 1 → `workspace` `start`. Re-run.
**Do not file a row, do not open `open` or `reconcile`, while it is red.**

`open` of a brand-new Feature has no issue yet — create the Project and its first fat card,
then run the script on that card. It must come back green.

A large feature keeps a **ledger**: one folder where every decision is an entry, every entry points at its evidence, and the whole thing must **balance**. Every user story reaches a layer, every deferral names an owner that exists, every "built" has a commit.

A ledger that does not balance is *visibly* broken. That is the entire point. Prose hides five missing screens; a column of empty cells does not.

Two branches:

- **open**: start the ledger for a new Feature, and the Linear Project that tracks it.
- **reconcile**: check the ledger against the code, against Linear, and against itself.

Small work skips this. A bug fix is a commit.

## Where this sits

Linear holds state. The folder holds the thinking. The containers and the lifecycle are law in
`~/thoven/.workspace/WORKFLOW.md`: a **Feature** is a Linear Project, a **Milestone** is one stage
of its lifecycle (`PRD + Architecture` · `Design` · `Build` · `Review`, §3), and an **Issue** is one
Slice through both repos, sized to one agent session. Read those definitions there. This skill never
restates them.

## The shape

`WORKFLOW.md` §5 is the source for this shape. **The workflow lives at the Project.** The audience
folder above it is a holding area, referenced by nothing.

```
<audience>/                   a HOLDING AREA, not the workflow
  CONTINUE_HERE.md            where we are. Records only; status lives in Linear
  STATE.md                    the commit ledger
  IDEAS.md                    raw prose, undigested
  drawings/                   sketches not yet assigned to a Project
  plans/                      thinking that has not become a Project
  archive/                    snapshots, and every superseded row

  projects/<project>/         the workflow
    PRD.md                    the problem, who has it, the stories       E#
    decisions/
      architecture.md         ADRs, frontend and backend               ADR#
      api.md                  endpoints and payload fields               A#
      database.md             schema, migrations, indexes               DB#
    DESIGN_<PROJECT>.md       one row per SURFACE: what to build from,    D#
                              status, owning gate, what was rejected
    drawings/                 this Project's protos. Never markdown
```

**The prefix names the kind, and a kind runs one series across the audience.** `A3` is an `api.md`
row; `D84` is a design row, in whichever Project owns that surface.

`api.md` and `database.md` are the frontend/backend seam: payload fields and schema decisions live
there and nowhere else. **The L4 proto lives in the app repo**, at `app/dev/<feature>/page.tsx`, and
the Project's `DESIGN_<PROJECT>.md` is what connects the folder to it, so its rows carry the real
path.

**There is no audience-level design doc.** A rule that spans Projects is a design-system rule and
belongs in the repo-root `DESIGN.md`.

## Rule 12: do not write down what the prototype already shows

**Could an agent deduce this by opening the prototype? If yes, it does not get a row.**

Values, spacing, colour, radius and copy belong to the prototype and are enforced by its tests. A
row that repeats them is a second source of truth, it goes stale in silence, and it is what an agent
misreads. **Write down only what looking cannot tell you:**

| write it | do not write it |
|---|---|
| the axis a thing is organised on | the numbers |
| a rule: *"if a popup cannot finish it, it gets no button"* | spacing, radius, hex, type size |
| a threshold **and why that threshold** | which variant a component uses |
| behaviour over time, and data shape | copy, unless it was contested |
| what was REJECTED and why | anything the running route already enforces |

`reconcile` treats a row that describes a look and cites no drawing, route or token as a **finding**,
not a row. Rule 2 says a decision points at its source, and **for anything visual the prototype IS
the source**.

*One design session produced twenty rows before a line of feature code existed, eleven of them
restating a running route in prose.*

## Rule 13: every SURFACE has an authority, and a surface with none is a blocker

Rule 4 catches a **deferral pointing at an owner that does not exist**. This is its mirror: a
**surface that no authority points at**. Same disease, opposite direction, and only one direction
was ever checked.

**`DESIGN_<PROJECT>.md` carries a row per SURFACE, not only a row per drawing.** Each names what a
builder must build from: a drawing, a proto route plus screen, or a component and the commit it was
canon at. **An absent row does not mean "use your judgement". It means STOP and ask.**

**An authority rule states the surfaces it covers, and a citation resolves for the surface it is
cited on.** A rule scoped wider than its pointers is the failure mode by construction.

**"The built components ARE the design" is a status with a direction and an expiry**, never a
standing truth. It holds only while the code is the newest expression of the design. Write it as
*components are canon for `<surfaces>` as of `<commit>`; any decision dated after this supersedes
it*, so the day the design moves ahead of the code the rule stops pointing backwards.

*A rule scoped "for Teacher" whose pointers covered Class Materials only left Teacher Homework with
no design authority at all, and four locked, drawn, running decisions were never built.*

## Rule 14: spec once at the milestone, ship many at the issue

**A Project holding several components is specced as ONE unit, because its layout is one decision.**
`/to-tickets` then emits one vertical Issue per component, and each ships as it finishes.

**Keep a multi-component Project whole.** Splitting it into several Projects forces a separate
speccing pass over a shared layout, and two passes over one layout produce two layouts.

The seam is the milestone, not the Project: `Design` resolves the layout once, `Build` cuts it into
as many shippable Issues as there are components.

## Rule 15: one live artifact per surface, and the proto retires when its component ships

Rule 13 gives every surface an authority. This is what happens when that authority **moves**: on the
day the component ships, the proto that specified it stops being the source and becomes a second one.

**Nothing retires an artifact by ageing.** A proto at `app/dev/<feature>/` outlives its own
implementation by default, so one surface accumulates a wireframe, a variant sheet, a `-v2` route and
a shipped component — all readable, none marked. An agent asked to change that surface reads whichever
it finds first, rebuilds from it, and ships a regression against work that was already finalised.

**Retirement is a ledger operation in three parts, all in the same commit:**

1. **Repoint the row.** The surface's `DESIGN_<PROJECT>.md` row now names the **component and the
   commit it was canon at** — rule 13's expiring form — instead of the proto.
2. **Delete the proto**: the route, the wireframe, the variant sheet. Extract its REJECTED block into
   the row first. Rule 8 keeps rejected alternatives; the row is where they now live.
3. **Record it in the row**: `<path> deleted <date>, superseded by <component>@<commit>`. The next
   agent to meet that path in an old plan then learns it is gone, rather than that the checkout is
   broken.

**Retirement is per SURFACE, not per file, and this is the part that is easy to get lethally wrong.**
One proto route usually hosts several surfaces at different stages — a shell that is locked, one
component that shipped last night, two still being designed. Deleting the route when the *first*
component ships destroys the design surface for the others.

So on a shared route, retiring a surface means **the route mounts the real component instead of its
own copy of it**. That is what actually ends the drift: there is now one implementation, seen in two
places, and a change to it is visible in both. **The route itself is deleted only when its last
surface has shipped**, and that deletion gets its own row.

A standalone artifact — a variant sheet, a one-off wireframe, a `-v2` exploration — has one surface,
so it is simply deleted.

**Two prohibitions, and these are the ones that get broken:**

- **Never delete a proto no row has retired.** Tidying is not retirement, and a drawing deleted with
  nothing ruling it dead is the same lost source as a stale one.
- **Never build from a proto a row has retired.** If the row names a component, the component is what
  you read. A retired path surviving in a plan, a handoff or a `/tmp` scratchpad does not revive it.

*Written 2026-08-22, verbatim: "you need to delete prototypes post-implementation. That is what
feature ledger is supposed to do. You should only have one source of truth… you're never taking what
we're working on and putting it onto a source of truth. You're constantly re-auditing and having to
rediscover what is the truth." The same sprint also produced "why was the wireframe deleted" — which
is why deletion is a recorded operation and never a reflex.*

## Rule 16: the named surface is the whole scope. Everything around it is locked

An issue names **one** surface. **Every other surface on that screen is LOCKED for the duration** —
whether or not a row says so, and whether or not it looks wrong.

**The component is fitted into its slot. The slot is never resized to fit the component.** A designed
component that genuinely does not fit is a **finding to raise**, not a licence to change the shell,
the grid, the gaps or the neighbouring cards. Fitting is the work. Rule 5 already says altering part
of a designed surface is a numbered decision needing Andres, never a sentence inside a build.

**Reaching a file is not owning it.** The component's own file is in scope. The shell it mounts into,
its sibling cards, the shared tokens and the routes around it are not — even when the change is one
line and obviously an improvement. Log it; do not bundle it.

**The check is a diff, not an intention.** Before reporting a surface done, read `git diff --stat` and
confirm every path in it is the named surface or a path the issue names. Anything else is a finding or
an unasked-for change, and you say which.

*Written 2026-08-22 from four instances in one sprint: a business-analytics proto that "redesigned the
full landing page"; an Upcoming Lessons card that "completely morphed the shape of everything"; a
sliding pill broken twice by work that "should have been untouched"; and, at the end, "The shell is
locked, everything is locked. You need to make the component fit into that spot. You don't build and
change the shit around it."*

## open

Session gate first — except a brand-new Feature has no issue yet. After step 6, run the script
on the fat card just created. Red means the fat card is missing `Writes to:`, a milestone,
or an assignee.

1. **Create the Linear Project.** One Feature, spanning frontend and backend, never one per repo.
   Set:
   - **the name**, `<Audience>: <Feature>` — `Teacher 2.0: Dashboard`. The audience goes in the
     name because Linear gates sub-initiatives behind the Enterprise plan, verified 2026-08-18. A
     Project genuinely serving two audiences is named `Shared: <Feature>`.
   - **the Initiative**, `Thoven 2.0` for 2.0 work.
   - **a link to the feature folder**, never a copy of its documents.

2. **Choose its milestones. That choice is the triage.** Every Feature draws from
   `PRD + Architecture` · `Design` · `Build` · `Review` (`WORKFLOW.md` §3). Create only the stages it
   needs, and **create nothing you are trimming**: an empty milestone reads 0% forever, so it is a
   gate that cannot open and a bar that drags the Project down. Measured 2026-08-18.
   **Trimming is a decision and the absence is the record**: a Feature with no `Design` milestone is
   one where design was considered and found unnecessary. Say in the Project description which stage
   was trimmed and why.

   ⚠ **Do not estimate for the gate's sake.** Milestone progress counts issues, not points. What
   makes the bar honest is issue granularity.
3. **Create the shape from `templates/`.** Every file exists, even scaffolded. An absent file reads
   as "not applicable", which is how `api.md` went missing from the feature whose worst two defects
   were payload fields.
4. **Fill `PRD.md` and `CONTINUE_HERE.md`** from what the session already knows, including the `E#`
   stories that can already be named.
5. **Seed each Project's `DESIGN_<PROJECT>.md` with a row per surface** (rule 13). Each names what to build from, a
   status, and **where the final prototype is going to be**: a path that opens
   (`app/dev/<feature>/page.tsx` or a drawing). That path is the owning gate. Not a `THV-` URL.
6. **Create the Project's first fat card**, one issue for the first milestone. It
   carries a literal `Writes to:` line naming the primary document, and a `Done when` line
   checkable against that file. Checklists for sibling docs live in that file.
7. **Create the paired worktrees**, `frontend-<feature>` and `backend-<feature>`.

**Done when** every path in the shape resolves, every `DESIGN_<PROJECT>.md` row names a proto path
that opens, every surface the feature touches has a row, and the Linear Project shows its chosen
milestones with one fat card standing against the first.

## reconcile

Session gate first — the heading at the top of this file. Red is a stop, not an Imbalances row.

Run over this Project's folder. Read the decision files and `STATE.md`, then check each entry against the
code and against Linear. Meta passes the folder from WORKFLOW §8 ledger bind.

An entry **balances** when all of these hold:

| Check | Balanced when |
|---|---|
| **layer** | its stated layer matches reality: `built` has a commit, `shipped` has a mount a user reaches |
| **evidence** | it points at a drawing, commit, component or test, rather than describing one |
| **owner** | any deferral names a gate, issue or row that opens |
| **uniqueness** | one entry claims this surface, not four |
| **coverage** | if a plan exists, every user story and architecture decision appears in its table |
| **authority** (rule 13) | every surface the feature touches has a `DESIGN_<PROJECT>.md` row naming what to build from. No row is a finding, never a default |
| **singleton** (rule 15) | exactly **one** live artifact claims this surface. A proto still on disk for a surface whose row names a component is a finding; so is a row still naming a proto whose component has shipped. Two live artifacts is the state that makes an agent rediscover the truth every session |
| **liveness** | a **call site** is a production mount or a production importer — never the module's own test, never a comment, never a ledger row. `IntegrationsTab` imported only by `IntegrationsTab.test.tsx` is dead, however green the suite. Fill `IN FLIGHT` and `KNOWN DEAD` (same fields as `prompts/ARCHITECTURE-AUDIT.md`) before any reconcile that would label a path T3/legacy: an in-session file called dead is a finding against the audit, not against the code. Knip/Stryker recipes do not belong here; Teacher Consolidation step 1 owns install |
| **downstream** | a `LOCKED` decision is cited by a plan, issue or commit. A decision nothing downstream mentions is an **orphan** |
| **scaffold** | `grep -rl "SCAFFOLD" <audience>/` returns nothing **and `open` has scaffolded this folder**. On a folder the templates were never applied to, an empty result proves nothing and is itself the finding |
| **container** | **no Linear PROJECT or Milestone description contradicts a live decision.** The decision file wins; the description is the finding. **Detect it, do not eyeball it:** pull every `D#`/`A#`/`ADR#`/`E#` cited in the Project description and each Milestone description, and check each id's status in the ledger. A cited id that is `SUPERSEDED`, `PARTLY SUPERSEDED`, or absent is drift. Also compare the *names* a description uses against the ledger's current ones — a renamed surface is the tell that fires first |
| **gate** | for every Milestone at 100%, each of its issues' `Writes to:` paths resolves on disk. A closed gate over a missing file is a finding |
| **session** | the issue this session writes against is claimed, assigned, has a lifecycle milestone, and its `Writes to:` resolves. **Red is a stop, not an Imbalances row.** Run `workspace/tools/session-preflight.js` |

Then:

1. **Log every imbalance in plain English**, saying what the ledger claims and what the code does.
   *"`D73` says the format picker uses `ThovenTile`. `ThovenTile` has zero call sites outside
   `/dev`."* A test file importing the module does not count. If you cannot fill `IN FLIGHT` /
   `KNOWN DEAD` for this Project, stop and ask — do not invent a dead-code list.
2. **Grep the decisions for orphans, both directions.** A `LOCKED` row whose id appears in no plan,
   issue or commit is unbuilt and unowned however well it is written. A deferral naming a **level or
   phase** (*"L5 wires it"*, *"the next gate"*) is a rule-4 ghost owner wherever it lives,
   **including inside proto code comments**, which is where one hid for three weeks.
3. **Cut superseded entries.** Delete the row; keep REJECTED blocks inside drawings, which are the
   record of what was tried.
4. **Retire what shipped** (rule 15). For every surface whose component now has a mount a user
   reaches: repoint the row at `<component>@<commit>`, extract the proto's REJECTED block into the
   row, and retire the artifact — **delete** a standalone one, or make a shared proto route **mount
   the real component** if other surfaces on it are still in flight. Note it in the row either way.
   **Do this as part of the reconcile, not as a later tidy-up** — a retirement deferred is a second
   source of truth left running.
5. **Bring the ledger current.** File decisions stated this session into their own file under that
   file's prefix, and append this session's commits to `STATE.md` with what each did.
6. **Ask on every fork you find.** Competing docs for one surface, an entry whose layer you cannot
   verify, a deferral with no owner: surface it and let Andres rule. **Show the competing artifacts
   rather than summarising them.** The reason a fork exists is that prose could not distinguish them.

**Done when** every entry is either balanced or listed under Imbalances, `grep -rl "SCAFFOLD"` comes
back empty or every remaining marker is named as a finding, and every fork found has been put to
Andres. **And every surface resolves to exactly one live artifact.**

## When another skill calls this

`/grill-with-docs`, `/writing-plans`, `/to-spec` and `/handoff` reconcile first. A plan written
against an unbalanced ledger inherits the imbalance and freezes it. A grill started against a
Todo issue inherits the board. Report imbalances to the calling skill before it writes. A red
session-preflight is not an imbalance — it is a stop.

## Templates

`templates/` holds a starter for each file in the shape, with its columns already set, a scaffold
marker, and a `Done when` block stating that file's completion test. See `templates/README.md` for
what each column is for and why it exists.
