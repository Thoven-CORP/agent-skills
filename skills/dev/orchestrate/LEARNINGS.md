# Learnings — orchestrate

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-23 — future-improvements retired

> reflect · 2026-11-23 · e2ee8938 · skill-gap · applied · seen 1

**What happened.** The "Defer an improvement rather than build it now" route sent agents to `/future-improvements`, which logged found work to a file instead of fixing it.
**Why.** Spec S32 (2026-11-23) retires the skill under the law's "Own what you find".
**What changed.** The route row is gone from references/backend.md and evals/schemas/orchestrate-backend.json; the skill body is in archive/skills/future-improvements/.

---

## 2026-11-12 — Routing drops to-spec and the spec-stage plan

> instructions rewrite · 2026-11-12 · meta-analysis · ruling · applied · seen 1

**What changed.** Removed the `/to-spec` row; `/writing-plans` is a builder's scratch plan; the feature chain ends at `/to-tickets`.
**Why.** Both were a second spec shape and a hidden brief.
Pointer: `releases/2026-11-12-instructions-rewrite.md`.
