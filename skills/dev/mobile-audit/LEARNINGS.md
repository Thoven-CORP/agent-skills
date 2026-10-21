# Learnings — mobile-audit

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-09 — Phone layout questions go through this audit first

> reflect · 2026-10-09 · memory:feedback_mobile_decisions_use_mobile_audit · correction · applied · seen 1

**What happened.** After a single question about a compact card on phones (its title 0px wide at 390), Andres said: "For mobile decisions use emil kowalski's /mobile-audit". The audit found the tile fix alone left the title truncated (about 126px, measured), the card's only tap target was the title text, and the next slice's 196px action block could not fit on a phone. He then ruled icon-only compact attendance below 640px, a whole-card tap, and the action buttons on their own row on phones.
**Why.** A single-question mobile ask misses the neighbouring constraints: attendance width, tap targets, the next slice's buttons.
**What changed.** Pitfall line: run the audit with a width budget from the token module before asking, present the decision with the findings, and record the ruling in the parent and the owning ticket before dispatch.
