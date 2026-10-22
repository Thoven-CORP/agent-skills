# Learnings — lab

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — vault refresh: maintenance floor, Mem0 optional, repo is canonical

> reflect · 2026-10-22 · vault-refresh · tooling · applied · seen 1

**What happened.** The vault moved to `Vaults/Executive-Assistant`, the local EA launchd automation was retired, Mem0 was retired from vault workflows (quota full, search unreliable), and microschool work moved to the GSD "ESA + Microschools" initiative. The skill still pointed at stale Naples sourcing as the next move and named `~/.claude/skills/lab` as its canonical path.
**Why.** Lab surfaces were written when the Outbound engine was the live front and launchd jobs kept them warm. Neither is true now, so a `/lab start` could confidently recommend work that is off the table.
**What changed.** Moved from `skills/dev` to `skills/exec`. Added a Current state section: maintenance floor, GSD hub and OKR Tracker IDs, never propose Naples or new-metro sourcing, launchd retired 2026-10-22. Mem0 is optional; memory pointers go to `Agent Knowledge/Memory/` or Claude auto-memory. Canonical path is now the repo.
