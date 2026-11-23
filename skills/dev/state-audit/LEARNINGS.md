# Learnings — state-audit

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-23 — a lint candidate is a proposal, not a Linear line

> reflect · 2026-11-23 · e2ee8938 · broken-rule · applied · seen 1

**What happened.** On 2026-11-23 Andres ruled "Own what you find" (Spec S19, S31, S32): "things that are like fixes and things that are found during review need to be either added as a sub-issue and worked on or just fixed". A sweep found about twenty skill lines that still taught filing instead. Here: a pattern with three or more hits became "one Linear line proposing an oxlint rule".
**Why.** A Linear line nobody owns never ships.
**What changed.** The report now carries the rule as a proposal to Andres with the hits it would catch.

---
