# Learnings — weekly-lab-orchestration

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — confirm thread state with get_thread; a reply counts only from the prospect

> reflect · 2026-10-22 · ea-vault · broken-rule · applied · seen 5

**What happened.** `search_threads` truncation produced false not-sent and no-reply calls (2026-06-24, 06-27, 07-27; the 07-27 Wild Wisdom thread showed 5 of 7 messages and hid a pass). On 2026-06-25 a same-company BD pitch was counted as a reply.
**Why.** The chase-responders output reads Gmail, but the get_thread rule lived only in `engine`.
**What changed.** New `## Pitfalls` section with two lines: confirm with `get_thread` before calling a thread no-reply or follow-up-owed, and count a reply only from the prospect's own address.

## 2026-10-22 — manual-only on the maintenance floor

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 2

**What happened.** Lab skills kept auto-triggering after the lab moved to its maintenance floor and Grok Lab took over the bookends.
**Why.** The skill was model-invocable.
**What changed.** Added `disable-model-invocation: true` and a description line: manual-only since 2026-10-22, invoke by name.
