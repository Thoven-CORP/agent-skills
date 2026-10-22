---
name: lab
description: Use when starting or ending a work session on a strategy lab (Microschool Lab, an ads lab, any future lab) and state lives across many surfaces that drift — Notion hub, task board, vault docs, memory. Triggers on "start lab session", "/lab start", "lab end day", "/lab end", "end lab", "lab check", "is the lab stale". On start it reports where-we-are + drift, then offers to begin the next task and reads that task's attached brief to launch the right working mode (the bridge to lab-task-writer's output); if there's no clear starting point it asks. On end it reconciles ALL surfaces (Notion hub first) in one gated fan-out write. Lab-agnostic. NOT weekly strategy (weekly-lab-orchestration) and NOT task deconstruction (lab-task-writer).
---

# Lab Session

Per-session bookends for any strategy lab: **`start`** (orient + detect drift), **`end`** (reconcile every surface), **`check`** (drift scan only). Single responsibility: **state integrity + continuity across sessions.** The recurring fix for "multiple surfaces, things go stale, hard to know where to begin."

**This skill is NOT:** weekly strategy/prioritization (that's `weekly-lab-orchestration` — cabinet + grill + big rocks), and NOT deconstructing a big thing into tasks (that's `lab-task-writer`). If `start` surfaces "we need to decide what matters this week," hand to `weekly-lab-orchestration`. If it surfaces "this big thing needs tasks," hand to `lab-task-writer`. Stay in your lane: orient and keep surfaces honest.

## Lean architecture principle

**The agent's context window is the constraint.** Every surface the skill reads at session start consumes context that could be used for actual work. The Hub page is the primary read surface — it must stay lean (<40 objects) so `/lab start` loads fast and leaves room for the task brief. History grows forever but is never fully loaded at session start — only the HEAD (the TOP entry) is read.

| Surface | Target size | Read at `/lab start`? | Update at `/lab end`? |
|---|---|---|---|
| **Hub — body** (lab description + links) | ~15 lines | Yes (lean) | Only on strategy shift |
| **Hub — Stage Tracker** | ~8 rows table | Yes | **Regenerated** from board |
| **Hub — Resume here** | 3-5 lines | Yes | **Replaced** (never appended) |
| **Hub — Recent decisions** | Last 2-3, ~6 lines | Yes | **Replaced** (never appended) |
| **Session log** (vault) | Rolled over ~monthly | **HEAD only** (~20 lines, the TOP entry) | **Prepended** |
| **Board** (Notion) | Grows with tasks | Yes (task rows) | Yes (status changes) |

**The key rule:** Hub sections are **replaced**, never appended. Session history lives in the vault session log only. The Hub is a dashboard, not a changelog.

## Source-of-truth model (why drift stops)

| Surface role | What holds it | Rule |
|---|---|---|
| **Authoritative task state** | the lab's Execution Board (Notion) | the work IS the state; never "stale" |
| **Primary read surface (LEAN)** | the lab's Notion hub (dashboard) | <40 objects. Stage Tracker regenerated from board. Resume here + Recent decisions **replaced** each session (never appended). Body is static reference. |
| **Narrative history** | the lab's vault session log | **prepend / newest-on-top**; one entry per session. **Only HEAD (TOP entry) read at session start.** |
| **Derived summaries** | cadence STATUS BOARD, `current_focus` paragraph, geo Worked ledger (when metro changed), registry Status one-liner | regenerated from the board, never hand-kept |
| **Pointers** | memory files | one-liner + link, never duplicated prose |

### Write-owner contract (stops three-writer chaos)

| Who | May write | Must NOT write |
|---|---|---|
| **`/lab end`** | Session log · Hub Stage Tracker / Resume / Recent decisions · cadence STATUS BOARD table · `current_focus` lab paragraph · memory pointer · registry Status one-liner · geo Worked ledger (if metro state changed this session) · board hygiene (TW clears, approved Status flips) | Outreach sends, Gmail |
| **`weekly-lab-orchestration`** | Lab Execution Board (re-sequence / rewrite / supersede) · New rows via `lab-task-writer` · **vault** weekly orientation file | Hub derived blocks · cadence · `current_focus` · session log mid-flight — **hand those to `/lab end` (or invoke the lab-end fan-out checklist once at the close of the WLO run, same one-gate contract)** |
| **`/engine`** | Outreach Tracker · Gmail labels/threads · geo Worked ledger **only when a metro was actually worked this run** | Hub Stage Tracker / Resume / Recent decisions · cadence · `current_focus` · session log. After Tracker/geo changes: remind to `/lab end`. |
| **`lab-task-writer`** | New board rows + page-body briefs | Derived Hub / vault summaries |

Drift is structurally impossible when every summary is *derived from the board* instead of *hand-maintained alongside it*, and **only `/lab end` fans out those summaries**. The **manifest enumerates every surface**, so the skill can never silently skip one.

**Canonical skill path:** `~/thoven/agent-skills/skills/exec/lab/SKILL.md` (the repo). Edit there, push to `main`, then reinstall per the repo README. `~/.agents/skills/lab` and `~/.claude/skills/lab` are installed copies; never hand-edit them.

## Current state (2026-10-22)

- **Microschool Lab is on the maintenance floor.** The Outbound engine is not an active front. Microschool work now runs as the **"ESA + Microschools" initiative** in the Notion GSD hub (`cbb6c461-0760-8325-bf6a-01344d41e228`; OKR Tracker `collection://2076c461-0760-8228-803f-07e52f6bfcd2`) and Linear.
- **Never name "fire Naples sourcing" (or any new-metro sourcing) as the next step.** If the board or an old Resume-here line still says so, flag it as stale in the drift report and point the next action at the GSD initiative instead.
- The local EA launchd automation (fleet, sensor and scheduled jobs) was **retired 2026-10-22**. Nothing refreshes lab surfaces in the background; a surface is only as current as the last `/lab end`.

## Step 1 — Load the manifest (always first)

Read `Agent Knowledge/Guides/lab-registry.md`. Resolve the active lab from the user's words; if ambiguous and >1 lab exists, ask which. The manifest gives every surface ID/path for that lab. **Never hardcode IDs in this skill** — they live in the manifest.

## `start` — orient + drift scan

**Goal: load the minimum context needed to know where we are and what's next. Target: <100 lines total read.**

1. Read the **Notion Hub** (lean — body + Stage Tracker + Resume here + Recent decisions). This is the primary read surface. If it's bloated (>40 objects), flag it and offer to rebuild.
2. Read the **session log HEAD** only — the **TOP** entry, right under the frontmatter (~20 lines). Do NOT read the full log, and **never `tail` it** — the bottom is the OLDEST entry. (Reading the tail once reported the log 13 days stale when the real HEAD was 3 days old.)
3. Read the **authoritative board** fresh (task rows + Status + Track + This-Week).
4. **Derive truth** from the board per track: design state · pre-lab progress (done/total) · the next gate-unblocker (highest-priority Not-started, honoring locked sequencing). **For a RUNNING engine track (e.g. the live T1+T2 cold-email tracks), also derive the engine signals: per-track funnel state (research → classify → send → log → iterate → track → follow-up), the next geo pocket queued, follow-ups due, and the responder queue.** Pre-lab tracks (e.g. T3 Community & Ecosystem) keep the pre-lab framing (design state + done/total + next gate-unblocker).
5. **Staleness diff:** compare each *derived* surface in the manifest (hub Stage Tracker, cadence STATUS BOARD, `current_focus` paragraph) against the board-derived truth. List every mismatch as `SURFACE: says X → should be Y`.
6. **Report:** Where we are (derived) · Staleness flags. For running engine tracks, include the engine signals alongside the pre-lab framing — per-track funnel state, next geo pocket, follow-ups due, responder queue. If anything is stale, offer to run the reconcile write now (same fan-out as `end`).
7. **Offer to begin (the bridge to the other lab skills):**
   - **Clear single next action** — one gate-unblocker stands out (highest-priority Not-started, honoring locked sequencing): name it and ask *"Next is **[task]** — want to begin?"* On **yes**, fetch that task's **page-body brief** from the board (the Mode + Kickoff/How-we-work-it/Done/Open-Qs that `lab-task-writer` attached) and launch in its **Mode** — *Brainstorm* = conversational/diagnostic, no specs until the frame settles · *Draft* = interactive, voice-matched · *Research/Build-Infra* = execute + surface decisions · *Decision* = options + a rec · *Outreach-send* = drafts only. If the brief's real shape is "this big thing needs tasks" → hand to **lab-task-writer**; if "decide what matters this week" → hand to **weekly-lab-orchestration**.
   - **No clear starting point** — ties between candidates, the top item is blocked, or nothing is queued: **ask** the user which to start (present the top 2-3 candidates with their Mode), don't guess. If nothing is queued at all, suggest `weekly-lab-orchestration` or `lab-task-writer` to generate the next work.

   The brief is what makes the hand-off startable — reading it IS how `/lab start` connects the task-writer's output to actually doing the work. Never start a task without loading its brief first.

## `end` — reconcile every surface (one gate)

**Goal: bring all surfaces current, Hub stays lean, session log is correct. Never grow the Hub — only replace sections. One session = one log entry.**

### A — Intake (ask, don't invent)

Before composing anything, confirm with Andres (skip only what the conversation already answered explicitly):

1. **Completed this session?** (shipped / reconciled / decided)
2. **Decisions to lock?**
3. **Blockers / `[VERIFY]` still open?**
4. **Single next action** (becomes Resume here)?
5. **Board status flips** he hasn't confirmed?

Apply the no-file-sourced-specifics rule: unconfirmed names/numbers/dates stay `[VERIFY]`.

### B — Board hygiene pass (before derived writes)

Re-query the Lab Execution Board live:

1. **Clear `This Week` on every `Done` / `Superseded` row** (stale TW on closed rows is a recurring bug).
2. **List active TW** (`Not started` / `In progress` + TW=Y). If **>5** OR umbrella+atomic double-count (e.g. `Outbound engine` TW=Y *and* Naples/Phoenix atomics TW=Y), propose demotions in the approval gate: **umbrellas → TW=N** unless the umbrella is the only active container. Prefer atomic rocks on TW.
3. **Propose any Status flips** from this session (Done / Superseded / In progress) — never silent.
4. Do **not** treat Notes-prepend archaeology as truth; board fields + user confirmation win.

### C — Compose the session log entry (fixed template)

**Prepend** under the frontmatter (newest-on-top). **One entry per calendar session.** If WLO + reconcile + work landed the same day, **merge into one HEAD** — do not stack three same-day HEADs.

```markdown
## YYYY-MM-DD — <one-line title>

**What changed**
- …

**Decisions**
- …

**Board deltas**
- <Task>: <old Status/TW> → <new> (or "none")

**Engine** (if running)
- Funnel: …
- Geo: …
- Follow-ups due: …
- Responders: …

**Blockers / VERIFY**
- …

**Resume here**
→ <single next action>
```

Roll entries older than ~30 days into `Archive/… Session Log ARCHIVE (YYYY-MM).md` when the Active file gets heavy.

### D — Propose the fan-out write set (show before writing)

Checklist from the manifest — tick every applicable row:

- [ ] **Session log** — prepend the entry above (only append-point is wrong; this file is **prepend**)
- [ ] **Hub lean** — if Hub objects ≥40: archive orientation `child_page`s off the Hub (or point Resume at a **vault** `Weekly Orientation — YYYY-MM-DD.md`) **before** other Hub writes. Target ≤38 after cleanup. Prefer vault orientations; Hub children are ephemeral.
- [ ] **Hub Stage Tracker** — regenerate from the board (replace table row bodies; never append rows)
- [ ] **Hub Resume here** — full replace (3–5 lines)
- [ ] **Hub Recent decisions** — full replace (last 2–3 only)
- [ ] **Hub body** — only if strategy shifted
- [ ] **Cadence `## STATUS BOARD`** — regenerate the **track table** (+ optional short "as of DATE" blurb). **Stop appending to the monolith callout.**
- [ ] **`current_focus` Lab Engine paragraph** — regenerate from board
- [ ] **Geo map Worked ledger** — only if metro state changed this session
- [ ] **Memory pointer** — one-liner + link (not prose), in the vault's `Agent Knowledge/Memory/` files or Claude auto-memory (Mem0 only if connected)
- [ ] **`lab-registry` Status one-liner** — only on a real engine/week shift

### E — One approval gate → batch-write → verify matrix

1. Show the full proposal (intake answers · board hygiene edits · session entry · fan-out checklist).
2. On approval, batch-write. Re-read each target before writing (Notion inline edits flake — prefer targeted block/property replaces).
3. **Verify after:**
   - Session log HEAD date = today; template sections present; no duplicate same-day HEADs left unmerged
   - Hub Resume matches the entry's Resume here; no stale "verify Monday send"-class residue
   - Active TW matches the approved hygiene list
   - Hub object count ≤38 if lean cleanup ran
   - Cadence table + `current_focus` match board-derived truth
4. Report what was written, with links + remaining `[VERIFY]`.

## `check` — quick drift scan

Just `start` steps 1, 3, 5 (skip the session log HEAD + next-action report). Use mid-session or when "is the lab stale?" Returns only the mismatch list + an offer to fix.

## Evidence rules (silent-failure traps)

These tools return **wrong-looking-but-plausible** results instead of errors. Violating these has twice produced a confidently wrong staleness call:

- **Gmail `search_threads` truncates threads.** Never conclude "no reply" / "not sent" / "follow-up owed" from it — **always confirm with `get_thread`** before writing thread state to any surface. (2026-07-06; 2026-07-27 Wild Wisdom, where search hid both the follow-up and the prospect's reply.)
- **Gmail label queries** need the hyphenated lowercase form (`label:microschool-lab`); other forms return zero results silently. A label miss means "unlabeled," never "no activity."
- **Gmail searches exclude Trash by default.** Zero results on a row that claims a thread means *check Trash* (`includeTrash: true` / `in:anywhere`), not "never sent." (Acton West End, 2026-07-28: a 7/13 pass hidden in Trash kept the row reading Replied/Interested for 15 days.)
- **Mem0 is retired from vault workflows (2026-10-22: quota full, search unreliable).** Use it only if it is connected, and never treat an empty Mem0 result as evidence of nothing. Durable notes go to the vault's `Agent Knowledge/Memory/` files or Claude auto-memory.
- **When the user contradicts a derived finding, re-verify with the authoritative tool before defending it.** The surfaces are the thing being audited — they are not the evidence.
- **Send write-back:** Gmail Sent alone ≠ done. Tracker must show `Stage=Sent` + `Send Date` + Touch timers (+ label). (2026-08-10 Orlando autonomous send.)

## Anti-patterns

- **Appending to the Hub** — that's the original bug. Hub sections are replaced, not appended. History grows in the vault session log only.
- **Reading the full session log at start, or `tail`-ing it** — read the HEAD only (~20 lines), which is the TOP entry. The bottom of the file is the oldest history.
- **Hub exceeding 40 objects** — if it does, something got appended instead of replaced, or orientation children piled up. Flag it, archive orientations, rebuild.
- Hand-editing a derived summary instead of regenerating it from the board — that's a drift bug.
- Skipping the Notion hub on `end` — it's the user's primary read surface; it's always in the write set.
- Inventing a status the user didn't confirm — ask or `[VERIFY]`.
- Widening into weekly strategy or task-writing — hand off, don't absorb.
- Writing before the single approval gate, or surface-by-surface instead of one batch.
- Trusting cached findings — every run re-reads the board and the manifest live.
- **Mid-session fan-out** of Hub / cadence / `current_focus` / session log from WLO or `/engine` — derived surfaces go through `/lab end` (or the same fan-out checklist once at WLO close).
- **Multiple same-day session-log HEADs** without merging.
- **Umbrella rows TW=Y alongside atomic children** — demote umbrellas.
- **Creating Hub orientation children** without archiving the previous one / preferring vault orientation files.
- **Trusting Notes-prepend archaeology** as source of truth.
