# Learnings — todo-manager

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — GSD is live: read Claude EA's rows first, write handoffs in the root format with approval

> reflect · 2026-10-22 · ea-vault · broken-rule · applied · seen 1

**What happened.** The skill said "Do NOT attempt to update Notion", but since 2026-10-22 the Notion GSD OKR Tracker is the live work queue, and Claude EA owns rows in it (`Agent Knowledge/Agents/README.md`).
**Why.** The rule dated from the retired two-way todo.md ↔ Notion sync and was never revisited when GSD went live.
**What changed.** "check todos" and "check notion tasks" read Claude EA's own GSD rows first. Completing a task can write a GSD handoff in the root format (a `YYYY-MM-DD ET:` prefix and an `OPEN QUESTIONS:` block, new entry on top), only with Andres's approval. Rows owned by Grok agents are never edited. todo.md is still never auto-synced from Notion.
