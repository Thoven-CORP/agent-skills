# Learnings — angel-graph-scout

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — manual-only while angel work is dormant

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 2

**What happened.** Angel skills kept auto-triggering after Grok Angel took over fundraising work.
**Why.** The skill was model-invocable, and its description fires on common prospecting phrases.
**What changed.** Added `disable-model-invocation: true` and a description line: manual-only since 2026-10-22, invoke by name. Not retired.
