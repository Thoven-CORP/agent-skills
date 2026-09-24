---
name: design-workflow-outline
description: Use when design work on a PRD or spec is about to start and has no agreed structure, or when a design sprint is running and nobody can say what level it is on.
---

# Design Workflow Outline

Draws the **skeleton** a design sprint gets walked through: one **track** per stakeholder, six fixed
**levels**, a gate at every crossing.

**You are drawing the map, not walking it.** Every conclusion drawn here is a conclusion taken from
the human and from the levels below. The output makes the shape of the work visible so anyone can
say where they are.

**Not for:** a Feature whose proto path is already enough · a single component — check it against `components/ui/` and the library tables via
`thoven-designer` instead, no sprint needed · polishing finished design (`impeccable`,
`better-ui`) · a sprint already walking an agreed skeleton.

Reach for this on a **greenfield** Feature that needs a long design walk and persistence. Skip it otherwise. The proto path on the DESIGN row is the default.

## The six levels

Fixed. What varies is who gets a track.

| | Level | Question it answers | What comes out |
|---|---|---|---|
| **L1** | Flow | What are they trying to do, and what are the steps? | The path, named. No screen names |
| **L2** | Surfaces | What exists today that those steps touch? | Real components, read from the codebase. And what's missing — **plus a verdict per surface: reuse / extend / centralize-new / library / one-off (with a reason), same check as `thoven-designer` runs standalone** |
| **L3** | Wireframe | What's on each screen, what's first? | Greyscale boxes. No colour, no components |
| **L4** | Key screens | What does it look like? | Real visual design on the tokens. Happy path only |
| **L5** | Components & motion | What are the reusable pieces, how do they behave? | Each component with every state. State machines. Motion — **and for anything new, checked against the library tables in `design-system-guide.md` before being hand-rolled** |
| **L6** | Edge cases | What else can happen? | Full list. Important ones drawn, rest written for build |

Each level is the input to the next: surfaces need the steps, wireframes need the surfaces,
components get pulled out of screens that exist. Dropping a level by feature "type" decides, from a
PRD alone, that work nobody has started won't matter.

**L2 is where someone opens the codebase.** Surfaces guessed from a PRD miss what's already built
and invent what isn't — so the skeleton names L2 as a level to walk and leaves it empty.

## Where each level lands

The whole skeleton runs inside the Feature's **`Design` milestone**, and the Issues inside it take
one of two unit shapes (WORKFLOW.md §1): a **sweep** — one level across screens, the default, one
Issue per track-level crossing carrying a `Writes to:` line with the path below — or a **screen** —
one surface walked across levels, as a parent Issue whose sub-issues carry the pieces. Name the
shape in the title either way. Milestones, lanes and gates: `~/.agents/skills/workspace/references/WORKFLOW.md` §3.

Paths are relative to the Project folder: `thoven2.0/<audience>/projects/<project>/` for 2.0 work,
`docs/<Surface>/` otherwise. An agent writes to the path its issue names and never invents one.

| | Level | Writes to |
|---|---|---|
| **L1** | Flow | `PRD.md`, as `E#` story rows |
| **L2** | Surfaces | `DESIGN_<PROJECT>.md`, one row per surface |
| **L3** | Wireframe | `design/drawings/`. Runnable, never markdown |
| **L4** | Key screens | `design/drawings/` and the route `app/dev/<feature>/page.tsx`. The surface's `DESIGN_<PROJECT>.md` row carries whichever path a builder builds from |
| **L5** | Components & motion | the component and its token test, plus a `DESIGN_<PROJECT>.md` row per surface |
| **L6** | Edge cases | `decisions/api.md` when it changes the payload, `decisions/database.md` when it changes the schema, otherwise `DESIGN_<PROJECT>.md` |

An L6 finding that changes `decisions/api.md` or `decisions/database.md` is a new Issue inside the
`Design` milestone, linked to the decision it changes. Earlier milestones stay closed.

A level's gate goes ✅ when the file at its path exists and every row in it resolves.

**L2's output IS the `DESIGN_<PROJECT>.md` surface table.** The verdict (reuse / extend /
centralize-new / library / one-off, with a reason) is a column of the surface's row, so a builder
reads one table in one place. L5 returns to the same row per surface once components and motion
resolve.

### Rule 12 — do not write down what the prototype already shows

**Could an agent deduce this by opening the proto? If yes, it does not get a row.** This skill
produces documents at every level, so it is where over-documentation starts.

| write it | do not write it |
|---|---|
| the axis a surface is organised on | the numbers |
| a rule: *"if a popup cannot finish it, it gets no button"* | spacing, radius, hex, type size |
| a threshold **and why that threshold** | which variant a component uses |
| behaviour over time, and data shape | copy, unless it was contested |
| what was REJECTED and why | anything the running route already enforces |

For anything visual **the proto IS the source**, and the row points at it. A row that describes a
look and cites no drawing, route or token is a finding, not a row.

**L4 and L5 are where this bites.** A key screen and a component state are almost entirely visual,
so their rows are short: the surface, the path to build from, the verdict, and what was rejected.
The screen carries everything else, and its token test holds it there.

*Written after one design session produced twenty rows before a line of feature code existed,
eleven of them restating a running route in prose.*

`D#` numbers belong to `DESIGN_<PROJECT>.md` and nowhere else, so a citation resolves without
context. `E#` belongs to `PRD.md`, `A#` to `decisions/api.md`, `DB#` to `decisions/database.md`.

## One track per stakeholder

Every person who sees or acts on the feature gets a track, walked top to bottom before the next
starts.

Teacher → student → teacher → parent means holding three mental models at once, and the human
reviewing it switches heads on every question. One track at a time keeps the reviewer in one
person's head. Where a track ends by handing work on, write down what the next person receives —
that contract is the only thing crossing tracks mid-sprint.

## The output

**Two files and a reference folder, beside the PRD.**

**`design-reference/`** — symlinked, never copied, so it cannot drift from what it points at:
the repo-root `DESIGN.md`, `docs/design/*.md`, `design-system/lexicon/LEXICON.md`, and (once
decided) the primitives-library ruling. Every track gets one. A sprint that quotes a colour or a
component name from memory instead of this folder is how the five-doc citation cycle happened the first
time — see `design-system-guide.md`.

**The skeleton:**

1. **The grid** — tracks × levels as a diagram. A reader locates themselves in three seconds.
2. **The gate ledger** — the same grid as status. `—` · `▶` in progress · `⏸` awaiting approval · `✅`
3. **Already settled** — what an earlier sprint locked, so no level redoes it.
4. **Open, carried in** — gaps from the PRD, each assigned to the level where it lands. Named, left open.
5. **Where we are** — one line.

**`DESIGN_SYSTEM_CONTRIB.md`** — what this sprint gives back to the design system. Headings
only; the levels fill it as they run.

```
## Component audit        ← points at the DESIGN_<PROJECT>.md surface rows L2 wrote, and names
                             what the design system inherits from them. One table, one home
## Typography
## Colour
## Motion                 ← L5 fills
## Layout & screens
## Learnings              ← why we chose what we chose
## Drafts & prototypes    ← links, and promoted or killed

## → Update log
Apply to the repo-root DESIGN.md + docs/design/ on merge (then `npm run docs:design` to re-render the HTML view):
- [ ]
```

L2 and L5 already produce this material — L2 reads real components off the codebase, L5 pins
every state and motion. Without this file it dies inside the sprint. **The update log is the
payload:** the checklist someone executes when the worktree merges.

### ⚠ The update log is a DRAFT, and it is not the return path

**Measured 2026-08-23: three `DESIGN_SYSTEM_CONTRIB.md` files exist across teacher, student and
parent, and not one of their update logs has ever been executed.** A checklist nobody runs records
that a sprint *meant* to give something back.

**So the trigger is not sprint-end. It is the moment the change lands.** A sprint-end sweep relies
on someone remembering, days later, that a value moved — and the person who moved it is the only one
who knows *why*. The reason is the payload; the value is already in the code.

```
you changed …                          → you owe a row in …
──────────────────────────────────────────────────────────────────────
a lib/*-tokens.ts module                 design-system/ELEVATION.md ·
  (new rung, role, constant)               MOTION.md · SURFACES.md

a component into components/ui/          design-system/STACK.md
  or a shared components/<x>/              + a name in lexicon/LEXICON.md

a dependency, or a copied-in source      design-system/STACK.md § Entries,
                                           under the rule that let it in (7 or 8)
```

**Exemption, and it is narrow:** a change inside one feature's own folder that no other feature
could reach owes nothing. `components/` is not a feature folder.

**The full procedure — what to write for each of the three kinds, what NOT to write, and the check
each one ends in — is `~/thoven/thoven2.0/design-system/CONTRIBUTING.md` — symlinked into every worktree as `docs/thoven2.0/design-system/CONTRIBUTING.md`.**
`STACK.md` decides what you may take; `CONTRIBUTING.md` decides what you owe back.

**Why this exists, in one measurement.** On 2026-08-23 the Teacher 2.0 Dashboard added
`elevation.overlay` — a second conditional rung with its own test — and landed four components in
`components/teacher/`. `ELEVATION.md` still read *"four rest rungs + one conditional"*, and a grep
across every file in `design-system/` returned **zero** hits for any of the four components.
**Nothing was skipped out of laziness. No rule fired, because there was no rule.**

Both files point at the PRD and the decision log rather than copying them, so the two can't
drift apart.

**Read [`design-system-guide.md`](design-system-guide.md) before any level that picks a
component, a colour, a type size, or a motion value.** It holds the system's goals, the
prototype method, the two tiers of **lock** (what must not be touched), which skill to route
to, which libraries to reach for before hand-rolling, and the checks every sprint runs.

## Centralization is the other judgment

Same rule as compression: never silent, always a checkable reason. L2 and L5 cannot close with a
surface or component left un-verdicted — "one-off" is a legitimate answer, but it needs the same
one-line reason compression needs. This is what stops a hand-rolled modal from being the 96th one
nobody decided to write.

## Compression is the one judgment

A level compresses — never disappears — and only on a reason a reader can go and check.

- ✅ "L4 compressed: the student visual language is locked by the student-redesign sprint. L4 applies
  it rather than choosing it."
- ❌ "L4 light: this is basically a settings screen."

The first names something verifiable. The second is a vibe.

**Declare the compressions at sprint open.** The skeleton header carries one depth line — which
tracks compress which levels, and the checkable reason each — and Andres confirms it once. Deciding
up front is what makes a sprint fast; re-litigating the same compression at every level is the slow
version of the same call. Mid-sprint compression stays legal for what the sprint could not have
known at open. What stays illegal is unchanged: a compression with no reason a reader can check.

## Common Mistakes

**An analysis instead of a skeleton.** The output classifies the feature — its shape, its
complexity, what it resembles — when the human wanted to know where they are and what happens next.
No grid, no skeleton.

**Collapsing L4 and L5.** "Screens with components" sounds efficient and yields screens with no
extracted pieces, no state coverage, and motion nobody decided on.

**Skipping the grid because the tracks feel obvious.** Obvious to whoever just read the PRD. The
grid is for the person three sessions later.

## Learning log

`LEARNINGS.md` sits beside this file — every observed failure and what changed because of it. **Read
it before editing this skill.**
