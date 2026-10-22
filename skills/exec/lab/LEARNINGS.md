# Learnings — lab

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — write-owner contract names Grok Lab; /lab end merges instead of clobbering

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 1

**What happened.** The write-owner contract listed `/lab end`, `weekly-lab-orchestration`, `/engine` and `lab-task-writer`, but not Grok Lab. Per `Agent Knowledge/Agents/README.md`, Grok Lab owns the lab bookends and the engine reconcile.
**Why.** The contract was written before the Grok bots took over, so a Claude `/lab end` would treat its own view as the only writer and replace Grok Lab's Hub sections.
**What changed.** Grok Lab has its own row in the contract, listing the surfaces it writes (Hub derived sections, board hygiene, Outreach Tracker reconcile and Gmail label, GSD rows under "ESA + Microschools"). A new rule says `/lab end` reads current content first, merges any Grok Lab write newer than the session start, and never edits Grok-owned GSD rows.

## 2026-10-22 — after a gap of more than 7 days, sweep Gmail and Drive before trusting the board

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 1

**What happened.** On 2026-08-19, after a 9-day gap, the board looked quiet while Drive showed the Path of Life pilot live with 19 students.
**Why.** `/lab start` reads only the Hub, the log HEAD and the board, and none of those had caught up with the live pilot.
**What changed.** New `## Pitfalls` line: when the session-log HEAD is more than 7 days old, sweep Gmail and Drive for active partners and live pilots before trusting the board.

## 2026-10-22 — vault refresh: maintenance floor, Mem0 optional, repo is canonical

> reflect · 2026-10-22 · vault-refresh · tooling · applied · seen 1

**What happened.** The vault moved to `Vaults/Executive-Assistant`, the local EA launchd automation was retired, Mem0 was retired from vault workflows (quota full, search unreliable), and microschool work moved to the GSD "ESA + Microschools" initiative. The skill still pointed at stale Naples sourcing as the next move and named `~/.claude/skills/lab` as its canonical path.
**Why.** Lab surfaces were written when the Outbound engine was the live front and launchd jobs kept them warm. Neither is true now, so a `/lab start` could confidently recommend work that is off the table.
**What changed.** Moved from `skills/dev` to `skills/exec`. Added a Current state section: maintenance floor, GSD hub and OKR Tracker IDs, never propose Naples or new-metro sourcing, launchd retired 2026-10-22. Mem0 is optional; memory pointers go to `Agent Knowledge/Memory/` or Claude auto-memory. Canonical path is now the repo.
