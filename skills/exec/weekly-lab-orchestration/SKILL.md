---
name: weekly-lab-orchestration
description: >-
  Use when the user says "/lab-week", "run the lab week", "weekly lab", "orchestrate the lab", or sits down for the weekly lab session — runs the weekly Microschool Lab sync: reads live state, convenes the persistent exec cabinet (Chief of Staff + COO + Partnerships/Growth + Analyst), grills priorities, RECONCILES the week's big rocks against the existing Lab Board backlog (reprioritize / rewrite / supersede existing rows; create only the genuine-new delta), and proposes big rocks + reconcile change-set + dated orientation write-up + Capture-Inbox triage. Brownfield, not greenfield: the board is a standing backlog. Hands only net-new big-things to lab-task-writer. ONE lab only. Manual-only since 2026-10-22: the lab is on its maintenance floor; invoke by name.
disable-model-invocation: true
---

# Weekly Lab Orchestration

A conductor for running ONE current lab week-to-week. It answers "what's going on + what matters this week," **reconciles that against the work already on the board**, and routes the deciding and the net-new task-writing to the right places. Grounded in `Agent Knowledge/Guides/experiment-framework.md` and the Microschool Lab hub.

**Mental model: a weekly team sync over a standing backlog — not a greenfield planning run.** A real GTM/BizDev/product sync starts from a backlog and log that were scoped when the project began execution. So does this. By the time you sit down, most of the work already exists as rows on the Lab Execution Board. The sync's main job is to **reprioritize and rewrite what's already there**, and create only the genuine delta. Default to brownfield; greenfield is the exception.

**Weekly Heartbeat — the engine's standing outputs.** For a continuous-engine lab (the live T1+T2 cold-email tracks), this run IS the engine's heartbeat. Beyond the backlog reconcile, every run produces four standing engine outputs: **read the funnel** (per-track research → classify → send → log → iterate → track → follow-up state) → **iterate the copy** (what the responses say to change) → **set the next geo pocket** (the rolling national geo-rotation: the affluent sub-pocket set to source next week) → **chase responders** (flag who's owed a follow-up). These are in addition to — not instead of — the brownfield reconcile below; the reconcile keeps the board honest, the heartbeat keeps the engine moving.

**What this skill is NOT:** it does not deconstruct *new* big-things into tasks (that's `lab-task-writer`), does not decide strategy (the grill + Andres do), does not draft or send outreach (the `microschool-outreach-loop` skill will, once built — run-then-codify; the engine currently runs via a /goal), and does not touch fundraising or the inbox at large. Lab-oriented only. It DOES reprioritize, rewrite, and supersede existing board rows in place — that's the reconcile, and it's core.

## Pitfalls

- Confirm a lab thread's state with `get_thread` before you report it no-reply or follow-up-owed; `search_threads` truncates message lists and hides the latest messages. (LEARNINGS 2026-10-22)
- Count a reply only when it comes from the prospect's own address; route a same-company sales or BD pitch to Andres instead of counting it as a responder. (LEARNINGS 2026-10-22)

## Trigger

Manual weekly slash-command — one interactive session you run when you sit down for the lab. An optional scheduled *reminder* may nudge you, but the run itself is interactive and human-gated. Not autonomous.

## Read surface (source of truth, every run)

Read these fresh at the start of every run — never trust cached findings or memory snapshots:
- **Hub DBs:** Lab Execution Board `7c7fe301-6a62-45cf-83ca-1443e671fc12` · Outreach Tracker `4b37775f-ea5b-4cc6-8a0b-92ea8985f999` · Capture-Inbox `b1b61b8a-d196-4385-b6eb-a89d2a2341d1` · Weekly Input Log `c9ec943b-1fa8-4733-8933-25f7285c2ff8` · Experiments DB `2ff03209-8778-401b-a62c-9cecb7ad9635`.
- **Lab strategy docs** in `Research/Strategic/Active/`.
- **Main Tasks DB** `1ce6c461-0760-804d-81cf-000b3ee6a2e0` filtered to `Microschool Lab`.
- **Gmail** lab-outreach threads ONLY (via the `Microschool Lab` label / Outreach Tracker cross-ref). Never the whole inbox.

## Team — the exec cabinet (composed at runtime via TeamCreate)

The cabinet is a **persistent team**, modeled as a lab-matched exec cabinet. Persistence carries the roster + standing orientation across weeks; it NEVER carries cached findings — every persona re-grounds in the live read surface each run (anti-staleness).

**Compose the team at runtime:**
1. Call **TeamCreate** (e.g. `team_name: "microschool-lab-cabinet"`) to create the team + its shared task list.
2. Spawn the four persona seats as teammates via the **Agent tool** with `team_name` set and `subagent_type` matching the project agents in `.claude/agents/`:
   - `lab-chief-of-staff` — **the lead** (synthesis, prioritization, continuity, inbox-triage lens).
   - `lab-coo` — execution: task-flow + coverage-gap lenses. **This seat's live row-by-row board read is the raw material for the reconcile — have it enumerate existing rows, not just summarize flow.**
   - `lab-partnerships-growth` — pipeline: follow-ups lens (PPC/media-buyer seat in an ads-lab).
   - `lab-analyst-strategist` — evidence: evidence/kill + KPI lenses. **Report the reach signal DIAGNOSTICALLY, not as a binary reach-kill: understand the low rate → what to iterate (copy / geo pocket) vs. where to double down. A single-location/single-copy silence is iterate-signal, not a kill; a true kill is only after copy-iters × multiple geo locations → zero, and reach-kill is currently posture-suspended (no summer kills — fall read). See the kill-logic amendment in `experiment-framework.md`.**
3. Each persona returns its fixed structured-output contract. The **Chief of Staff leads**: it ingests the other three reports and synthesizes ranked big rocks. The 5 lenses (follow-ups, task-flow, inbox-triage, coverage-gap, evidence/kill) map onto these four seats.
4. Shut the team down gracefully at the end of the run (SendMessage `shutdown_request`).

The lab is RUNNING (T1+T2 cold-email engine live on independent per-track clocks — there is no shared Day-0). Expect real funnel/evidence/follow-up data on the live tracks; report it, including the heartbeat outputs. Only a genuinely pre-lab track (e.g. T3 Community & Ecosystem) will have thin follow-ups/evidence/kill lenses — say so for that track, don't manufacture activity, and don't apply pre-launch thinness to the running tracks.

## Backlog Reconcile (the brownfield step — between synthesis and the Task-Writer)

By the time the cabinet hands up ranked big rocks, the COO has already read the live board. **Before creating anything, reconcile the rocks against that board.** This is the step that makes the run a *sync* instead of a greenfield plan, and it's where most weeks' real work lives.

**Sweep scope = the WHOLE active backlog, every run.** Reconcile all rows with Status = `Not started` or `In progress` — not just rows a big rock points at. This catches stale `This Week` flags from last week, mislabeled "blocked" rows whose blocker has cleared, and orphans, independent of the rocks. (This is exactly how a mislabeled-blocked row gets caught even when no rock references it.)

Sort every active row — and every big rock — into one bucket:

| Bucket | When | Action on commit |
|---|---|---|
| **Re-sequence** | Row is fine; only its priority / timing / blocked-state is wrong | Edit `Priority` / `This Week` / `Status` / clear a stale blocked-note — `notion-update-page` |
| **Rewrite** | Row exists but its framing or page-body brief went stale | Edit `Task` title / `Notes` / page-body brief — `notion-update-page` |
| **Keep/park** | Correctly parked, still valid | No change. Do not churn parked rows to look busy. |
| **Supersede** | This week's decisions made the row obsolete | `Status` → `Superseded` + prepend `Notes` with `⛔ Superseded YYYY-MM-DD: <reason>` + `This Week` = NO. **Propose-only, never delete.** |
| **New** | No existing row covers this work | The ONLY bucket handed to `lab-task-writer` for deconstruction. |

**Supersede rules (teeth — handle carefully):**
- **Never delete a row.** Other lab skills and the cabinet personas read the board; a silently-vanished row blinds the next read. Supersede = a *visible closed state*, not a deletion.
- `Superseded` is a **distinct Status value**, NOT `Done`. Readers must be able to tell "we chose to stop this" from "we finished this."
- Every supersede passes through the approval gate with a one-line reason. Never silent.

**Schema dependency:** the Lab Execution Board `Status` field needs a `Superseded` option (closed group, alongside `Done`). If it is absent on a run, add it once via `notion-update-data-source` before writing any supersede, and note it in `Agent Knowledge/Guides/lab-registry.md`. Persona `Status` filters treat `Superseded` as closed-but-visible.

## GrillMe reuse

Do NOT re-implement a grill. Reuse the **grill-me** skill to stress-test the Chief of Staff's proposed big rocks **and the non-obvious reconcile calls** before they're greenlit — resolve each branch (is this really #1? worth it this week? what does it block? is this row truly obsolete, or just deprioritized?). Grill every **Supersede** call and any reprioritization that isn't self-evident. Keep the grill on the priorities and judgment calls, not on settled work or the auto-orderable majority.

## Output — propose → confirm → batch-write (one gate)

One approval gate for the whole run, then commit. **Run the confirm through the `AskUserQuestion` tool** (an explicit choice), not a free-text "does this look ok?". Present all FOUR outputs together for review:

1. **Prioritized big rocks** — the grilled, greenlit short list for the week, each with its likely Mode.
2. **Backlog reconcile change-set** — per affected row: current state → bucket → exact edit → one-line reason. Supersedes called out explicitly. This is the heart of the brownfield run.
3. **Weekly orientation write-up** — big rocks / moved / blocked / owed / kill-status / **superseded-this-week**. **Write to vault** `Strategy/GTM/Microschool Lab/Active/Weekly Orientation — YYYY-MM-DD.md` (NOT a permanent Hub child page — Hub children blow the <40 lean limit). Hub Resume may **link** to that vault file after `/lab end`.
4. **Capture-Inbox triage** — proposed disposition per inbox item (New target / New blocking question / Noise / Parked / Converted) + atomics proposed for the main Tasks DB.

### Write-owner (derived surfaces)

WLO owns **board edits only** (+ New → `lab-task-writer` + vault orientation file). It does **NOT** mid-flight rewrite Hub Stage Tracker / Resume / Recent decisions, cadence STATUS BOARD, `current_focus`, or the session log.

On confirmation, batch-write in this order: (a) **apply the reconcile edits to existing rows directly** (`notion-update-page`, including `Status` → `Superseded`); (b) write the **vault** orientation file; (c) apply the triage dispositions + propose atomics; (d) hand ONLY the **New** bucket to `lab-task-writer`. Re-read the board immediately before writing to avoid races/duplicates. If Notion write access is unavailable, present all four outputs and stop at propose.

**Then close with `/lab end`** (or invoke the lab-end fan-out checklist once in the same session — same one-gate contract) so Hub / cadence / `current_focus` / session log stay honest. Do not skip this — board-only WLO leaves derived surfaces stale by design until lab-end runs.

## Calls Task-Writer (the New bucket only)

Hand the **`lab-task-writer`** skill ONLY the **New** bucket from the reconcile — big-things with no existing row. Everything that maps to an existing row is re-sequenced / rewritten / superseded in place by the orchestrator, NOT re-created. This makes the Task-Writer's standing "don't re-propose existing tasks" guard explicit at the source: the orchestrator never even sends it work that already exists.

The Task-Writer applies the 5 coverage questions, bounded/open-ended tagging, gate-first prioritization, a per-task **Mode + brief**, and its own propose-confirm-write gate to the Lab Execution Board. The orchestrator decides *what matters*; the Task-Writer turns the net-new slice into tasks. Each task it produces carries a Mode (`Research / Brainstorm / Draft / Outreach-send / Build/Infra / Decision`) + a short brief in the row's page-body — that brief is what makes a big-rock actually *startable*, not just a fuzzy title. When framing New-bucket rocks, make each rock's likely Mode obvious so the hand-off lands clean.

## Run sequence (summary)

1. Read the full live surface.
2. TeamCreate the cabinet + spawn the 4 personas; collect their structured reports (COO enumerates live rows).
3. Chief of Staff synthesizes ranked big rocks.
4. **Backlog Reconcile** — sweep the whole active board; bucket every active row + every rock (Re-sequence / Rewrite / Keep / Supersede / New).
5. grill-me on the big rocks + judgment calls (incl. every Supersede + non-obvious reprioritization).
6. Propose (big rocks + reconcile change-set + vault orientation write-up + inbox triage) via `AskUserQuestion` → confirm → batch-write **board + vault orientation only**.
7. Hand ONLY the New bucket to `lab-task-writer`.
8. **Close with `/lab end`** (or the lab-end fan-out checklist once) for Hub / cadence / `current_focus` / session log.
9. Shut down the team.

## Constraints / anti-patterns

- **Treating the run as greenfield.** Most weeks the work already exists — reconcile the standing backlog FIRST, create last. If you're about to hand the Task-Writer a rock that already has a row, stop and re-sequence instead.
- **Re-creating an existing row via the Task-Writer** instead of re-sequencing it in place. Only the New bucket is created.
- **Superseding silently, or deleting a row.** Supersede is propose-only, labeled `⛔ Superseded`, set to the `Superseded` Status — never a deletion. Other skills read the board.
- **Churning correctly-parked rows** to manufacture visible activity. Keep/park means leave it alone.
- Lab-scoped only — never widen to fundraising, the whole inbox, or the whole week.
- Persistence = roster + orientation, never findings. Re-ground every run.
- Don't reuse investor `outreach-followup` (different domain); lab follow-ups are flagged here and drafted later by `microschool-outreach-loop` (to be built — run-then-codify; the engine currently runs via a /goal).
- One approval gate; never silent writes; never task-by-task writes.
- Don't deconstruct *new* big-things inline — that's the Task-Writer's job.
- **Mid-session Hub / cadence / `current_focus` / session-log writes** — those belong to `/lab end`. Board-only here.
- **Permanent Hub orientation children** — use the vault orientation file; Hub lean limit is <40.
