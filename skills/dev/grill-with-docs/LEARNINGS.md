# Learnings — grill-with-docs

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-08 — Grill scope is the Project plus his paste

> reflect · 2026-10-08 · memory:feedback_brainstorm_scope_is_project_plus_paste · correction · applied · seen 1

**What happened.** In the Live Lesson Portal brainstorm the agent put "audio modes" on the list from an old Notion signal, grilled Andres on it and proposed a retest. He had already resolved it: "this is not the item we are brainstorming".
**Why.** The agent's own research list leaked into a scope he had set as "the scope is in the project and in the things I pasted".
**What changed.** Pitfall line: re-derive the item list from the Project description and his paste before each round. When his numbering seems to point outside that scope, map it to the in-scope item.

## 2026-09-14 — Read prior rulings before asking

> reflect · 2026-09-14 · memory:feedback_read_prior_rulings_before_grilling · correction · applied · seen 2

**What happened.** The THV-502 grill re-asked the Library "copy vs one shared file" fork as if open. Andres had weighed both options in a 2026-09-10 Codex session, ruled ("I think A is best and we can work on getting to the first principles build after"), and the ruling sat in the Linear Project description. He pointed it out twice. On 2026-10-11 it repeated: three rounds on a notes reminder that P5 and P18 in THV-1161 had settled. "We have already spec'd this out before... This was already decided."
**Why.** Ledger files often record only the conclusion, so the fork looks open when the weighing already happened.
**What changed.** Pitfall line: read the Project description and parent decisions, grep transcripts (`~/.codex/sessions/`, `~/.claude/projects/`) and Mem0 for the option names, quote the ruling with its date, and ask only what sits inside or downstream of it.
