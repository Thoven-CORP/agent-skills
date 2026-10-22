# Reconcile Mode — Deep Memory Audit

Deep, multi-file version of the EOD reconcile (Step 5.5 in SKILL.md). Run when triggered by "eod reconcile", "reconcile memory", "memory audit", or "deep eod". Purpose: the memory system logs but does not reconcile — this mode retires stale state instead of appending around it.

## Contents
- Checklist
- The 4 drift classes
- Procedure
- The no-invent guardrail
- Terminal-entry rule
- Cadence

## Checklist

Copy this into your response and check off each item as you complete it:

```
Reconcile Progress:
- [ ] 1. Establish ground truth (this session + last ~7 daily logs + user confirmations)
- [ ] 2. Cross-reference the canonical files
- [ ] 3. (Deep) Fan out 5 read-only sub-agents, one per focus group
- [ ] 4. Auto-fix what a source confirms; [VERIFY]-flag what only Andres knows
- [ ] 5. Add terminal entries for dead / dormant / done threads
- [ ] 6. Write dated report to Agent Knowledge/YYYY-MM-DD-memory-audit-report.md
- [ ] 7. Surface the "Needs Andres" queue (AskUserQuestion if <=4, else a list)
```

## The 4 drift classes to hunt

- **STALE** — old fact presented as current (a dead partnership framed as live; Feb metrics in a May file).
- **CONTRADICTION** — two files disagree (75 vs 80 teachers; $150k vs $300k raise).
- **DANGLING** — mentioned once as a next step, never resolved (a deal green-lit, then vanished from all memory).
- **DONE-VS-NOT-DONE** — a todo says done but a daily log says open, or the reverse.

## Procedure

**Step 1 — Establish ground truth.** Ground truth = this session's confirmed facts + the last ~7 days of `Daily Work/` + any in-session user confirmations. Recency and explicit user confirmation beat older files.

**Step 2 — Cross-reference the canonical files:** `Agent Knowledge/Memory/current_focus.md`, `business_context.md`, `major_memory.md`, `todo.md`, and the user-memory `MEMORY.md` index.

**Step 3 — Fan out 5 read-only sub-agents (deep audit only).** Dispatch general-purpose sub-agents in parallel, one per focus group. Tell each: read-only, do NOT edit; return findings as `[HIGH|MED|LOW] path — quote — type — suggested fix — Q for Andres`.
- (a) Core business memory — current_focus, business_context, major_memory, personal_preferences.
- (b) Fundraising memory + `Fundraising/investor-narrative.md` + the `MEMORY.md` metrics/round files.
- (c) Partnerships sweep — grep every partner name across vault + memory; flag any framed active that is dead.
- (d) Guides + custom agents (`.claude/agents/`) + `.agent-state/`.
- (e) `todo.md` vs `Daily Work/` reconciliation (done-vs-not-done, dangling tasks).

**Step 4 — Apply fixes (full auto-fix + the guardrail below).**

**Step 5 — Write the dated report** to `Agent Knowledge/YYYY-MM-DD-memory-audit-report.md`: findings by drift class, what was auto-fixed, and the "Needs Andres" queue at the top.

**Step 6 — Surface the "Needs Andres" queue** in chat: AskUserQuestion if there are 4 or fewer high-value items; otherwise a numbered list.

## The no-invent guardrail (what makes "full auto-fix" safe)

- **AUTO-FIX (no ask)** anything resolvable from a newer or authoritative source: retire stale lines; mark dead/dormant deals; drop completed or merged work from active focus; mark completed todos; fix dates; propagate a metric or decision an authoritative source confirms.
- **NEVER INVENT.** If the correct value is not in any source — a metric, or a dead/alive verdict only Andres knows — write `[VERIFY: ...]` inline and add it to the "Needs Andres" queue. Do not guess. (Root `CLAUDE.md`: no invented specifics.) This guardrail is the only thing that keeps "full auto-fix" from re-introducing the drift it is meant to remove.
- **GROUND BEFORE PROPAGATING.** Before writing a claimed decision or event into canonical memory (current_focus, business_context, major_memory), confirm it traces to a real source — an actual `Daily Work/YYYY-MM-DD.md` entry or an in-session user confirmation. If the event is only asserted and you cannot find its source on disk (e.g., the referenced daily log doesn't exist), do NOT propagate it as fact — flag it `[VERIFY]` instead. (A skill test once injected a fabricated "Vipul call killed parent-acquisition" decision into memory because the agent propagated an asserted-but-ungrounded event; this guard prevents that.)

## Terminal-entry rule

Whenever something transitions to dead / dormant / done, write the closing state explicitly. Add a terminal entry to `major_memory.md` (e.g., "ABANDONED — ...") so the timeline does not dead-end on "in progress" and read as live forever. A timeline that ends on "counter-proposal started" looks live to every future session.

## Cadence

- **Lightweight** (SKILL.md Step 5.5): every EOD.
- **Deep fan-out** (this file): weekly, or whenever stale items start resurfacing in conversation.
