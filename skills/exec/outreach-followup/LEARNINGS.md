# Learnings — outreach-followup

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — confirm thread state with get_thread; a reply counts only from the prospect

> reflect · 2026-10-22 · ea-vault · broken-rule · applied · seen 5

**What happened.** `search_threads` truncation produced false not-sent and no-reply calls on 2026-06-24, 06-27 and 07-27. On 2026-06-25 a sales / BD pitch from someone else at the prospect's company was counted as the prospect's reply.
**Why.** The rule to confirm with `get_thread` lived in the `engine` skill only. Phase 3c here counted any non-Andres sender as a reply.
**What changed.** New `## Pitfalls` section with two lines: confirm thread state with a full-thread fetch before calling it no-reply or follow-up-owed, and count a reply only from the prospect's own address. Phase 3c now matches: a same-company pitch goes to Andres via the run report, with no Stage change and no bump.

## 2026-10-22 — manual-only while angel work is dormant; dead memory pointers removed

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 2

**What happened.** Angel skills kept auto-triggering after Grok Angel took over fundraising work. The skill also pointed at `feedback_competitor_risk_flag.md`, `feedback_followup_staleness_cap.md`, `feedback_cold_outreach_followup_voice.md` and `feedback_no_chat_use_connect.md`. None of them exist.
**Why.** The skill was model-invocable, and the memory files were cleared.
**What changed.** Added `disable-model-invocation: true` and a description line: manual-only since 2026-10-22. The pointers are gone. `[COMPETITOR]` is defined inline in Phase 3a, and the frozen bodies in `references/templates.md` stand as the voice rule. The text of the old follow-up voice memory was not found, so nothing was copied for it.
