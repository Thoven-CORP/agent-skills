# Learnings — design-workflow-outline

A running log of what went wrong in real use and what changed because of it. **Read this before
editing SKILL.md.** New entries go on top. Keep each one to: what happened, why, what changed.

---

## 2026-07-26 — v2. It deduced instead of setting up

**What happened.** Run on the Materials & Homework 1.5 PRD. It produced a classification of the
feature — "shape: multi-stakeholder flow" — with a table of which stages were load-bearing and which
compressed. Andres, on reading it: *"I don't understand what the shape means… this is not what I
meant by the design workflow."* He'd been unable to say where the sprint was for the previous hour.

**Why it failed.** The skill's job was to produce the setup. It produced conclusions about the work
instead, and got them wrong:

- **Wrong axis.** v1 varied by feature "shape" (marketing page / settings / dashboard /
  multi-stakeholder) and decided which stages to skip. The real axis is **stakeholder**. The levels
  don't vary.
- **No tracks.** Stakeholder count was an input to a lookup table, never structure. So the output
  gave no way to design one person at a time.
- **The levels were never named.** v1's output table was generic — "stage / applies / produces". The
  actual levels (Flow, Surfaces, Wireframe, Key screens, Components & motion, Edge cases) weren't in
  the skill at all; they got borrowed from a sprint README.
- **Surfaces came out wrong** because they were inferred from the PRD rather than read from the
  code. Andres: *"its output did not write the surfaces correctly, it deduced the wrong things."*
- **Its own red flags caused the failure.** "Don't name a surface, a screen or a component" and
  "don't contain a flow list" forced the output to stay abstract, which is exactly what made it
  useless.
- **Prose, not a grid.** Nothing visual. No gate ledger. No "where we are."

**What changed in v2.**
- Six fixed levels, named in the skill, with the reason each depends on the one before.
- One track per stakeholder, walked top to bottom, with handoff contracts between tracks.
- Output is a grid + gate ledger + settled + open + where-we-are.
- "Never infer the surfaces" is now the first Never, with the reason.
- Skipping is gone. Only **compressed**, and only with a named checkable reason — with a good and a
  bad example so the difference is legible.
- L4 and L5 split, because v1's bundled "screens, components, motion" hid three different pieces of
  work behind one gate.

**Not yet done.** v2 has not been run against a fresh agent. Two tests owed:
1. **GREEN** — a cold agent reads the M&H PRD with v2 and produces the tracks × levels grid.
2. **Discrimination** — a one-person feature (marketing page, settings screen) must not come back
   with three stakeholder tracks.

---

## 2026-07-25 — v1. Rebuilt from scaffolder to outline generator

**What happened.** The first version created a sprint folder with files in it. Rejected: *"scaffolding
means an outline, not created files."*

**What changed.** Rewritten to emit one file and name deliverables rather than create them.

**What this fix got wrong.** It over-corrected. Removing file creation was right; removing all
concreteness was not. The v2 failure above is the direct consequence — the skill became so afraid of
producing anything that it produced nothing usable.
