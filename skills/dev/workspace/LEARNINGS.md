# Learnings — workspace

A running log of what went wrong in real use and what changed because of it. **Read this before
editing SKILL.md.** New entries go on top. Keep each one to: what happened, why, what changed.

---

## 2026-08-18 — the skill was never run on the Feature that needed it

**What happened.** `Teacher 2.0` went stale in Linear across a full design sprint: nine Milestones,
five Issues, seven Milestones empty, and `components/teacher/thoven-sidebar.tsx` with **zero**
production call sites after eleven commits. `Student 2.0` stayed current the whole time.

**Why.** The difference was not the skill. It was that sessions reached for `/feature-ledger
reconcile`, which owns the docs and has no Linear scope, and never reached for this one, which owns
Linear. Nothing in either skill handed off to the other.

**What changed.** `feature-ledger reconcile` gained `milestone` and `gate` rows that surface Linear
drift, and reports them here rather than writing Linear itself. One writer, no second
implementation to drift.

---

## 2026-08-18 — Milestone changed meaning underneath the skill

**What happened.** `Milestone` stopped meaning "a shippable slice" and became one stage of a
Feature's lifecycle. The skill carried the old meaning in fourteen places, including the `capture`
classification table that decides where new work lands.

**What changed.** Milestone is now derived from the **kind** of work: a document goes to
`PRD + Architecture` or `Design`, code to `Build`, QA to `Review`. Two Common Mistakes rows were
added, because the old reading is the intuitive one and will keep coming back.

---

## 2026-08-15 — two hardcoded strings, both silent

**What happened.** Two failures on the skill's first runs were hardcoded assumptions, not bad
judgment: a bare `--since` that assumed midnight, and a `## Log` anchor that assumed a blank line
after the heading. Both produced confident wrong answers.

**What changed.** The skill now says which of its instructions are exact and which are a reference
implementation, and reserves exactness for the places where being wrong is invisible.
