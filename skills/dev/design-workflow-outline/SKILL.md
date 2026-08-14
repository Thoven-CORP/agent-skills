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

**Not for:** a single component — check it against `components/ui/` and the library tables via
`thoven-designer` instead, no sprint needed · polishing finished design (`impeccable`,
`better-ui`) · a sprint already walking an agreed skeleton.

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
`DESIGN.md`, `docs/design/*.md`, `design-system/lexicon/LEXICON.md`, and (once decided) the
primitives-library ruling. Every track gets one. A sprint that quotes a colour or a component
name from memory instead of this folder is how the five-doc citation cycle happened the first
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
## Component audit        ← L2 fills: exists / drifted / missing / verdict (reuse, extend,
                             centralize-new, library, one-off + reason) — required per surface,
                             the gate does not go ✅ without it
## Typography
## Colour
## Motion                 ← L5 fills
## Layout & screens
## Learnings              ← why we chose what we chose
## Drafts & prototypes    ← links, and promoted or killed

## → Update log
Apply to DESIGN.md + docs/design/ on merge (then `npm run docs:design` to re-render the HTML view):
- [ ]
```

L2 and L5 already produce this material — L2 reads real components off the codebase, L5 pins
every state and motion. Without this file it dies inside the sprint. **The update log is the
payload:** the checklist someone executes when the worktree merges.

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
