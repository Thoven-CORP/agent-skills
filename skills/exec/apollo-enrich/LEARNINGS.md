# Learnings — apollo-enrich

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — resolve Company from a signature or LinkedIn before writing it; flag name collisions

> reflect · 2026-10-22 · ea-vault · correction · applied · seen 3

**What happened.** The CRM `Company` field was saved wrong for Gutkovich (twice, 2026-06-24), Feuer (06-19) and Mark Go (08-05).
**Why.** Company was taken from an enrichment match or an email domain, and same-name people were not told apart.
**What changed.** Step 3 has a Company resolve rule: take the company from the person's email signature or current LinkedIn role, never from the Apollo org match or domain alone. A name collision is flagged, and neither Company nor Email is written until Andres picks. The date-stamp guardrail now lists Company as a field this skill may write, under that rule.

## 2026-10-22 — manual-only while angel work is dormant

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 2

**What happened.** Angel skills kept auto-triggering after Grok Angel took over fundraising work.
**Why.** The skill was model-invocable.
**What changed.** Added `disable-model-invocation: true` and a description line: manual-only since 2026-10-22, invoke by name.
