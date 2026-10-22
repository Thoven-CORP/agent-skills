# Learnings — prospect-scorer

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — High requires documented check-writing evidence

> reflect · 2026-10-22 · ea-vault · correction · applied · seen 2

**What happened.** On 2026-07-22 Andres found that only 3 of 15 graph-scout prospects were real check-writers, and 0 of 11 converted. On 2026-08-06 the rubric scored David Kopf 8 with no confirmed angel activity, and only a manual override held him at Medium.
**Why.** A strong A + B score (EdTech fit plus founder credential) reached the High band without any evidence the person writes angel checks.
**What changed.** Pre-Scoring Gate (a) and the Priority Bands: High needs C = 2 (documented check-writing). Founders or operators without it cap at Medium and get the Notes flag `ADVICE ASK — no check-writing evidence found`. The Gavin Schiffres calibration row is updated to match.

## 2026-10-22 — manual-only while angel work is dormant

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 2

**What happened.** Angel skills kept auto-triggering after Grok Angel took over fundraising work.
**Why.** The skill was model-invocable.
**What changed.** Added `disable-model-invocation: true` and a description line: manual-only since 2026-10-22, invoke by name.
