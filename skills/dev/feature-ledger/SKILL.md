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

## open

1. Create the shape from `templates/`. Every file exists, even empty — an absent file reads as "not applicable" and that is how `api.md` went missing from the feature whose worst two defects were payload fields.
2. Fill `PRD.md` and `CONTINUE_HERE.md` from what the session already knows.
3. Seed `design/VERSIONS.md` with a row per proto, each naming a status and an **owning gate that resolves to a Linear issue — a pasted `THV-` URL**, never a prose name. That turns ghost-owner rule 4 from a rule into a check, which is rule 9 (*prefer a script to a rule*) doing its job: the 2026-08-14 audit found 4 ghost owners cited 13 times, one of which — *"Parent L3"* — was named in five files as a real design gate and had never been drawn.
4. Create the paired worktrees named for the feature.

**Done when** every path in the shape resolves, and every `VERSIONS.md` row's proto path and owning gate both open.

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

Then:

1. **Log every imbalance in plain English**, saying what the ledger claims and what the code does. *"`DD-73` says the format picker uses `ThovenTile`. `ThovenTile` has zero call sites outside `/dev`."*
2. **Cut superseded entries.** Delete the row; keep REJECTED blocks inside drawings, which are the record of what was tried.
3. **Bring the ledger current** — file decisions stated this session into their file, and append this session's commits to `STATE.md`'s ledger with what each did.
4. **Ask on every fork you find.** Competing docs for one surface, an entry whose layer you cannot verify, a deferral with no owner — surface it and let Andres rule. **Show the competing artifacts rather than summarising them**; the reason a fork exists is that prose could not distinguish them.

**Done when** every entry has been checked and each is either balanced or listed under Imbalances, and every fork found has been put to Andres.

## When another skill calls this

`/writing-plans`, `/to-prd` and `/handoff` reconcile first. A plan written against an unbalanced ledger inherits the imbalance and freezes it — which is how a plan carrying *"the route is the spec"* in its constraints also carried *"the write flow stays in the shipped component"* in its architecture, and shipped five designed screens as nothing.

Report imbalances to the calling skill before it writes.

## Templates

`templates/` holds a starter for each file in the shape, with its columns already set. See `templates/README.md` for what each column is for and why it exists.
