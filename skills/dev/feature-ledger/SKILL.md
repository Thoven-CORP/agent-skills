---
name: feature-ledger
description: Open and reconcile a feature's ledger. Use when starting a large feature, when a decision or user story is stated mid-session, before writing an implementation plan or PRD, at a handoff, or when asked which of several docs is live. Other skills reach this before they write a plan.
---

# Feature Ledger

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

## open

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
   status, and an **owning gate that resolves: a pasted `THV-` URL**, never a prose name. That turns
   ghost-owner rule 4 from a rule into a check, which is rule 9 doing its job.
6. **Create the Project's first Speccing issues**, one per document the first milestone owes. Each
   carries a literal `Writes to:` line naming exactly one path, and a `Done when` line checkable
   against that file. One path per issue; a folder has no done-ness.
7. **Create the paired worktrees**, `frontend-<feature>` and `backend-<feature>`.

**Done when** every path in the shape resolves, every `DESIGN_<PROJECT>.md` row's path and owning gate open,
every surface the feature touches has a row, and the Linear Project shows its chosen milestones with
at least one Speccing issue standing against the first.

## reconcile

Run over the whole ledger. Read the decision files and `STATE.md`, then check each entry against the
code and against Linear.

An entry **balances** when all of these hold:

| Check | Balanced when |
|---|---|
| **layer** | its stated layer matches reality: `built` has a commit, `shipped` has a mount a user reaches |
| **evidence** | it points at a drawing, commit, component or test, rather than describing one |
| **owner** | any deferral names a gate, issue or row that opens |
| **uniqueness** | one entry claims this surface, not four |
| **coverage** | if a plan exists, every user story and architecture decision appears in its table |
| **authority** (rule 13) | every surface the feature touches has a `DESIGN_<PROJECT>.md` row naming what to build from. No row is a finding, never a default |
| **downstream** | a `LOCKED` decision is cited by a plan, issue or commit. A decision nothing downstream mentions is an **orphan** |
| **scaffold** | `grep -rl "SCAFFOLD" <audience>/` returns nothing **and `open` has scaffolded this folder**. On a folder the templates were never applied to, an empty result proves nothing and is itself the finding |
| **container** | **no Linear PROJECT or Milestone description contradicts a live decision.** The decision file wins; the description is the finding. **Detect it, do not eyeball it:** pull every `D#`/`A#`/`ADR#`/`E#` cited in the Project description and each Milestone description, and check each id's status in the ledger. A cited id that is `SUPERSEDED`, `PARTLY SUPERSEDED`, or absent is drift. Also compare the *names* a description uses against the ledger's current ones — a renamed surface is the tell that fires first |
| **gate** | for every Milestone at 100%, each of its issues' `Writes to:` paths resolves on disk. A closed gate over a missing file is a finding |

Then:

1. **Log every imbalance in plain English**, saying what the ledger claims and what the code does.
   *"`D73` says the format picker uses `ThovenTile`. `ThovenTile` has zero call sites outside
   `/dev`."*
2. **Grep the decisions for orphans, both directions.** A `LOCKED` row whose id appears in no plan,
   issue or commit is unbuilt and unowned however well it is written. A deferral naming a **level or
   phase** (*"L5 wires it"*, *"the next gate"*) is a rule-4 ghost owner wherever it lives,
   **including inside proto code comments**, which is where one hid for three weeks.
3. **Cut superseded entries.** Delete the row; keep REJECTED blocks inside drawings, which are the
   record of what was tried.
4. **Bring the ledger current.** File decisions stated this session into their own file under that
   file's prefix, and append this session's commits to `STATE.md` with what each did.
5. **Ask on every fork you find.** Competing docs for one surface, an entry whose layer you cannot
   verify, a deferral with no owner: surface it and let Andres rule. **Show the competing artifacts
   rather than summarising them.** The reason a fork exists is that prose could not distinguish them.

**Done when** every entry is either balanced or listed under Imbalances, `grep -rl "SCAFFOLD"` comes
back empty or every remaining marker is named as a finding, and every fork found has been put to
Andres.

## When another skill calls this

`/writing-plans`, `/to-spec` and `/handoff` reconcile first. A plan written against an unbalanced
ledger inherits the imbalance and freezes it. Report imbalances to the calling skill before it
writes.

## Templates

`templates/` holds a starter for each file in the shape, with its columns already set, a scaffold
marker, and a `Done when` block stating that file's completion test. See `templates/README.md` for
what each column is for and why it exists.
