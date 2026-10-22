---
name: lab-task-writer
description: Deconstruct a fuzzy "big thing" (decision, goal, phase, or initiative) into granular, prioritized lab tasks, then propose-confirm-write them to the Microschool Lab Execution Board. Use when the user says "/lab-tasks", "break this down", "turn this into tasks", "what are the tasks for X", "deconstruct this", or when the Weekly Lab Orchestration skill hands off a greenlit big-rock. Applies the experiment-framework's 5 coverage questions, bounded/open-ended tagging, and gate-first prioritization, and attaches a Mode + working brief to every task so it's startable, not just a title. Callable standalone anytime.
---

# Lab Task-Writer

Turn a fuzzy big thing into a granular, prioritized, write-ready task list for the current lab. The reusable operationalization of "form granular tasks from a fuzzy big thing." Grounded in `Agent Knowledge/Guides/experiment-framework.md` (Phase Work Model + standing coverage questions).

**Single responsibility:** deconstruct + prioritize + write. This skill does NOT decide strategy, run outreach, or synthesize evidence — it converts an already-decided big thing into tasks. The Weekly Lab Orchestration skill calls this skill; it also runs standalone.

## Input

Accept ONE big thing per run. It can arrive as:
- A handoff from the orchestrator (a greenlit big-rock for the week), or
- A standalone ask ("break down the T3 pre-lab", "what are the tasks to finalize the 3 briefs").

Before deconstructing, establish three things (ask only if not supplied):
1. **The big thing** stated as a goal/decision/phase — not a vague topic.
2. **The current phase** (Pre-Lab / Lab / Post-Lab) and **track** (T1 — Cold independents (national) / T2 — Cold franchise affiliates (national) / T3 — Community & Ecosystem (warm/recon: operator communities + homeschool; pre-lab) / Shared) — these become Notion fields. The live track model is `Agent Knowledge/Guides/lab-registry.md`; T3 is Community & Ecosystem, NOT the old Corporate Networks.
3. **What's already done / in flight** — read the Lab Execution Board (data source `7c7fe301-6a62-45cf-83ca-1443e671fc12`) filtered to the track so you don't re-propose existing tasks. Treat `Superseded`-status rows as closed — don't revive or re-create them. When called from the Weekly Lab Orchestration skill you receive ONLY its **New** bucket (big-things with no existing row), because that skill re-sequences / rewrites / supersedes everything that already maps to a row before it ever calls you; the duplicate-check is still your guard on standalone runs.

If the input is genuinely a topic ("microschools") rather than a big thing ("finalize the 3 T3 outreach briefs"), narrow it with one question before proceeding — don't deconstruct a topic.

## Coverage-Question Deconstruction

The structure lives in the **questions**, not in a fixed task DAG (experiment-framework, Phase Work Model). Run the big thing through the **5 standing coverage questions** and let each generate bespoke tasks:

1. **Advance bar** — What must be true to be ready to leave this phase / call this big thing done?
2. **Next-phase pull** — What does the *next* phase need from this one to start clean? *(catches missing handoffs)*
3. **Riskiest unknown** — What's the one thing most likely to be wrong or missing? *(forces the adversarial check)*
4. **Unchecked assumptions** — What are we assuming that we haven't verified?
5. **Open loops → tasks** — What questions are still unanswered, and what task answers each?

Each answer that requires work becomes a task. This is the device that prevents "felt done, missed a part." Coverage > tidiness: it is better to surface a task you later cut than to miss one.

## Bounded vs Open-Ended Tagging

Tag **every** task (maps to the Lab Board `Type` column):

- **Bounded** — clear floor + ceiling, known done state (draft 3 emails; send the Day 0 wave). You know when it's complete.
- **Open-ended** — no natural floor (research a target; build the list). These sprawl or get cut short, so each MUST carry a **stopping rule tied to the question it feeds**: stop when you can *act* on the answer, not when the topic is exhausted. Re-opens only if a new blocking question appears.

For each open-ended task, write the stopping rule into Notes. *Example: "Build next week's T1 geo pocket — stop when: the affluent sub-pockets for the next metro are named + ~30-40 sourced independents across T1+T2 have deliverable emails. NOT 'map every microschool in the metro.'"*

## Gate-First Prioritization

Auto-order tasks by the **gate-first lab rubric** (highest first):

1. **Gate-unblockers** — work required to clear the current phase's definition of ready (blocking questions answered + required artifacts exist).
2. **Critical-path / dependencies** — tasks other tasks wait on.
3. **Time-forced** — follow-ups due, kill windows, scheduled waves.
4. **Leverage** — high-payoff but not blocking.

Map to the Lab Board `Priority` column: gate-unblockers + critical-path → **High**; time-forced → **High** if a date is imminent else **Medium**; leverage → **Medium/Low**.

**Then grill — but only on the judgment calls.** Do not grill on the auto-orderable majority. Reuse the **grill-me** skill ONLY for: (a) genuine ties in priority, and (b) "is this worth doing *this week*" calls. Keep the grill tight; the rubric does the bulk of the ordering.

## Task Brief — every task carries one

A task title says *what*; the brief says *how to engage it*. Without it you sit down to a task and don't know whether to research, brainstorm, draft, or just execute — and those need different working modes. So every task gets a short brief, written into the task's **Notion page-body** on commit. It is the standup hand-off: what a colleague would need to start clean.

**Mode** (new Lab Board `Mode` select field — add it if absent) drives the brief. One of:

| Mode | How we work it (default engagement protocol) |
|---|---|
| **Research** | Gather autonomously, surface findings, ask the user only at genuine forks. Done = enough-to-act, not exhausted. |
| **Brainstorm** | Conversational + diagnostic, strategic. Push back. **NO specs/tables until the diagnosis settles.** Strategic thinking, not product-style Q&A. |
| **Draft** | Interactive, voice-matched. Show drafts and iterate. |
| **Outreach-send** | Drafts only — user reviews before send, never auto-send. Light grill on the riskiest one. |
| **Build/Infra** | Execute; surface decisions only. |
| **Decision** | Lay out options + a recommendation; user picks. |

**Brief body** (≤10 sentences / 2 short paragraphs):
- **Kickoff** — where to start, what to read first.
- **How we work it** — the protocol from Mode (above), tuned to this task.
- **Done =** — the explicit definition of done (this task's slice of the advance bar).
- **Open Qs** — anything to surface at kickoff.

Generate the brief from the deconstruction you already did — Mode follows from the task's nature, Done = follows from the coverage question that spawned it. Keep it tight; it's a brief, not a spec.

**The no-file-sourced-specifics rule applies INSIDE the brief too.** Never bake a file-sourced name, number, date, contact, or schema field-name into a brief as if it's fact — reference it generically ("the named affluent zones", "the head-of-school contact") or flag it `[VERIFY: ...]`. A brief that hard-codes an unconfirmed specific is the same trust leak as a draft that does.

## Propose → Confirm → Write Mode

One approval gate per run, then batch-commit. Never write task-by-task.

1. **Propose** — present the full task list as a table for review: Task · **Mode** · Type (Bounded/Open-ended) · Phase · Track · Priority · Due (if time-forced) · Notes (stopping rule for open-ended). Group by priority tier. Show each task's **brief** (at minimum Kickoff + Done =) so the engagement is reviewable, not just the title. Flag any task that is really an atomic personal todo (belongs in the main Tasks DB `1ce6c461-0760-804d-81cf-000b3ee6a2e0`), not the Lab Board.
2. **Confirm** — wait for explicit approval. Accept edits (cut, merge, re-prioritize, re-tag, re-Mode, edit a brief) and re-present if the list changed materially.
3. **Write** — on approval, batch-create rows on the **Lab Execution Board** (`7c7fe301-6a62-45cf-83ca-1443e671fc12`) via `notion-create-pages`, one row per task, setting Task, **Mode**, Type, Phase, Track, Priority, Due, Notes — and write the **brief into each row's page-body** (`content`). Propose any atomics to the main Tasks DB separately. Re-read the board first to avoid duplicates. Report what was written with links.

Writes happen ONLY after explicit confirmation. If Notion write access is unavailable, output the table and stop at propose.

## Standalone Use

Fully usable outside the orchestrator: invoke directly on any current pre-lab or in-lab big thing ("deconstruct the T3 pre-lab", "tasks to finalize the briefs"). Standalone runs still do the live board read, the 5 coverage questions, bounded/open-ended tagging, gate-first ordering, the per-task Mode + brief, and the propose-confirm-write gate.

## The Metatask (recurring)

The task list is not written once — it **regenerates**. Answering one question spawns the next. At checkpoints, re-run this deconstruction on what the last pass surfaced. That recurring pass IS the engine, not overhead. Emergent inputs mid-flight go to the Capture-Inbox (`b1b61b8a-d196-4385-b6eb-a89d2a2341d1`) for triage — convert or park, don't auto-chase.

## Anti-Patterns

- Deconstructing a **topic** instead of a big thing — narrow first.
- Open-ended tasks with **no stopping rule** — they sprawl. Always tie to the question.
- Grilling the whole list — only ties + worth-it-this-week calls.
- Writing before confirmation, or writing task-by-task instead of one batch.
- Re-proposing tasks already on the board — always read live first.
- A task with **no brief or no Mode** — every task carries both. A bare title strands you at the starting line; the brief is the point.
- A brief that bloats into a spec — keep it to the standup hand-off (≤10 sentences). Strategy and stopping rules live in the task/Notes, not the brief.
