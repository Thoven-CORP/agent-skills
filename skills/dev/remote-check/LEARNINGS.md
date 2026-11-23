# Learnings — remote-check

A running log of what went wrong in real use and what changed. **Read this before editing SKILL.md.**
New entries go on top. Keep each one to: what happened, why, what changed.

---

## 2026-11-23 — wait on a mini run with a background log and a Monitor loop

> reflect · 2026-11-23 · e2006d67 · skill-gap · applied · seen 25

**What happened.** Waits on mini runs hit "Blocked: sleep N" 26 times across about 25 sessions and subagents (e2006d67 and many `agent-*` subagents).
**Why.** No skill said how to wait on a remote job, so each session reached for `sleep`, and macOS has no `timeout` or `gtimeout` to bound one.
**What changed.** New "Wait for a mini run" section: run it as a background command whose laptop log ends in `RUN_END exit=<n>`, wait with one Monitor `until grep -q '^RUN_END' <log>` loop bounded by `timeout_ms`, then read the run's own `remote-verify: exit` or `remote-check: exit=` line. The law carries a one-line pointer here (Andres's ruling Q3, 2026-11-23).

## 2026-11-23 — free mini space is a step, not a hand request

> reflect · 2026-11-23 · d5c04bcd · 4530f269 · skill-gap · applied · seen 2

**What happened.** The mini kept falling near its 15 GiB floor. Andres asked by hand in d5c04bcd (11-15, "List the 12 stale worktrees on the mini") and 4530f269 (11-23, "free up space on the mini so it's back above the 15 GiB gate floor … tell me what you deleted").
**Why.** `disk-cleanup` covers only the laptop, and no skill named the mini's run folders, scratch, captures, mirrors and worktrees or how to tell owned from stale.
**What changed.** New "Free mini space" section, keyed to the host profile's `minDiskFreeGiB` (15): list those paths, keep anything a running process, Mutagen session, in-progress ticket, dirty or unpushed worktree or open PR owns, show the removal set, remove exactly it, report before and after. "Select the input" points at it, and `disk-cleanup` has a one-line pointer.

## 2026-10-31 — read the mini yourself

> reflect · 2026-10-31 · 01a17981 · tooling · applied · seen 1

**What happened.** A handover told Andres to paste the mini's output back.
**Why.** The MacBook session already had an ssh host for the mini.
**What changed.** Pitfall: read mini-side logs and screenshots over the ssh host in `host.json`.
