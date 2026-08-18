---
name: feature-ledger
description: Open and reconcile a feature's ledger. Use when starting a large feature, when a decision or user story is stated mid-session, before writing an implementation plan or PRD, at a handoff, or when asked which of several docs is live. Other skills reach this before they write a plan.
---

# Feature Ledger

A large feature keeps a **ledger**: one folder where every decision is an entry, every entry points at its evidence, and the whole thing must **balance** — every user story reaches a layer, every deferral names an owner that exists, every "built" has a commit.

A ledger that does not balance is *visibly* broken. That is the entire point. Prose hides five missing screens; a column of empty cells does not.

Two branches:

- **open** — start the ledger for a new feature
- **reconcile** — check the ledger against the code, and against itself

Small work skips this. A bug fix is a commit.

## The shape

```
<feature>/
  CONTINUE_HERE.md    resume point, one screen
  STATE.md            slice board + commit ledger
  PRD.md              the problem and who has it

  decisions/          markdown tables, greppable
    product.md          user stories, E-numbers
    architecture.md     ADRs
    api.md              endpoints, payload fields
    database.md         schema, migrations, indexes, constraints
    design.md           DDs

  design/
    VERSIONS.md       the manifest: proto → status → owning gate
    drawings/         HTML + CSS. Runnable. A proto is never markdown.

  plans/              implementation plans, derived from the above
  archive/            versioned snapshot, cut before each plan
```

`api.md` and `database.md` are the FE↔BE seam. Payload fields and schema decisions live there and nowhere else.

**The L4 proto lives in the app repo, not this folder** — `app/dev/<feature>/page.tsx`, running React. `VERSIONS.md` is the only thing connecting the folder to it, so its rows carry the real path.

Governing rules: the **Feature Folders** section of `CLAUDE.md`. Read it rather than restating it here.

## ⛔ Before you write a decision row, apply rule 12

**Could an agent deduce this by opening the prototype? If yes, it does not get a row.**

Values, spacing, colour, radius and copy belong to the prototype and are enforced by its tests. A
row that repeats them is a second source of truth, it goes stale in silence, and it is what an agent
misreads. **Write down only what looking cannot tell you:**

| write it | do not write it |
|---|---|
| the axis a thing is organised on | the numbers |
| a rule — *"if a popup cannot finish it, it gets no button"* | spacing, radius, hex, type size |
| a threshold **and why that threshold** | which variant a component uses |
| behaviour over time, and data shape | copy, unless it was contested |
| what was REJECTED and why | anything the running route already enforces |

`reconcile` treats a row that describes a look and cites no drawing, route or token as a **finding**,
not a row — that is `E18` by construction, and rule 2 says a decision points at its source. **For
anything visual the prototype IS the source.**

*Written 2026-08-17: one design session produced twenty rows before a line of feature code existed,
eleven of them restating a running route in prose. Over-documentation does not prevent the failure
it fears — Class Materials was heavily documented and still shipped wrong.*

## ⛔ Rule 13 — every SURFACE has an authority, and a surface with none is a blocker

Rule 4 catches a **deferral pointing at an owner that does not exist**. This is its mirror: a
**surface that no authority points at**. Same disease, opposite direction, and only one direction
was ever checked.

**`design/VERSIONS.md` carries a row per SURFACE, not only a row per drawing.** Each names what a
builder must build from — a drawing, a proto route + screen, or a component and the commit it was
canon at. **An absent row does not mean "use your judgement". It means STOP and ask.**

**An authority rule states the surfaces it covers, and a citation resolves for the surface it is
cited on.** A rule scoped wider than its pointers is the failure mode by construction.

**"The built components ARE the design" is a status with a direction and an expiry**, never a
standing truth. It holds only while the code is the newest expression of the design. Write it as
*components are canon for `<surfaces>` as of `<commit>`; any DD dated after this supersedes it* —
otherwise, the day the design moves ahead of the code, the rule keeps pointing backwards and freezes
the stale build as canon.

*Written 2026-08-18, from the incident this rule exists to prevent. `VERSIONS.md` said "**For
Teacher**, the built components ARE the design… build from `L5_COMPONENTS.md` §B2 and route screen
7" — scope "for Teacher", pointers Class Materials only. Teacher Homework sat inside the scope and
outside the pointers, so it had no design authority at all, and "the components are the design"
resolved to the **pre-redesign** components. Prose filled the vacuum, a centered modal shipped over
a designed slide-over, and DD-12/12a/13 and DD-07a — locked, drawn, running in the proto — were
never built. Every gate passed. The rule read complete, which is why nobody saw the hole.*


## open

1. Create the shape from `templates/`. Every file exists, even empty — an absent file reads as "not applicable" and that is how `api.md` went missing from the feature whose worst two defects were payload fields.
2. Fill `PRD.md` and `CONTINUE_HERE.md` from what the session already knows.
3. Seed `design/VERSIONS.md` with a row per proto **and a row per surface** (rule 13 — a surface with no row is a blocker, not a default), each naming a status and an **owning gate that resolves to a Linear issue — a pasted `THV-` URL**, never a prose name. That turns ghost-owner rule 4 from a rule into a check, which is rule 9 (*prefer a script to a rule*) doing its job: the 2026-08-14 audit found 4 ghost owners cited 13 times, one of which — *"Parent L3"* — was named in five files as a real design gate and had never been drawn.
4. Create the paired worktrees named for the feature.

**Done when** every path in the shape resolves, every `VERSIONS.md` row's proto path and owning gate both open, and every surface the feature touches has a row.

## reconcile

Run over the whole ledger. Read `decisions/` and `STATE.md`, then check each entry against the code.

An entry **balances** when all of these hold:

| Check | Balanced when |
|---|---|
| **layer** | its stated layer matches reality — `built` has a commit, `shipped` has a mount a user reaches |
| **evidence** | it points at a drawing, commit, component or test, rather than describing one |
| **owner** | any deferral names a gate, ticket or row that opens |
| **uniqueness** | one entry claims this surface, not four |
| **coverage** | if a plan exists, every user story and architecture decision appears in its table |
| **authority** (rule 13) | every surface the feature touches has a `VERSIONS.md` row naming what to build from; no row = a finding, never a default |
| **downstream** | a `LOCKED` decision is cited by a plan, issue or commit — a decision nothing downstream mentions is an **orphan** |

Then:

1. **Log every imbalance in plain English**, saying what the ledger claims and what the code does. *"`DD-73` says the format picker uses `ThovenTile`. `ThovenTile` has zero call sites outside `/dev`."*
1a. **Grep the decisions for orphans, both directions.** A `LOCKED` row whose number appears in no
   plan, issue or commit is unbuilt and unowned no matter how well it is written — *"`DD-12` is
   ratified, drawn at `mh15-l4:883`, annotated 'L5 wires it', and cited by nothing. L5 never did."*
   A deferral naming a **level or phase** (*"L5 wires it"*, *"the next gate"*) is a rule-4 ghost
   owner wherever it lives — **including inside proto code comments**, which is where that one hid
   for three weeks.
2. **Cut superseded entries.** Delete the row; keep REJECTED blocks inside drawings, which are the record of what was tried.
3. **Bring the ledger current** — file decisions stated this session into their file, and append this session's commits to `STATE.md`'s ledger with what each did.
4. **Ask on every fork you find.** Competing docs for one surface, an entry whose layer you cannot verify, a deferral with no owner — surface it and let Andres rule. **Show the competing artifacts rather than summarising them**; the reason a fork exists is that prose could not distinguish them.

**Done when** every entry has been checked and each is either balanced or listed under Imbalances, and every fork found has been put to Andres.

## When another skill calls this

`/writing-plans`, `/to-prd` and `/handoff` reconcile first. A plan written against an unbalanced ledger inherits the imbalance and freezes it — which is how a plan carrying *"the route is the spec"* in its constraints also carried *"the write flow stays in the shipped component"* in its architecture, and shipped five designed screens as nothing.

Report imbalances to the calling skill before it writes.

## Templates

`templates/` holds a starter for each file in the shape, with its columns already set. See `templates/README.md` for what each column is for and why it exists.
