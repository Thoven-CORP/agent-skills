---
name: engine
description: Microschool Lab Outbound engine heartbeat — reconcile Gmail↔Notion, render the control tower, name the one next move. Run by hand.
disable-model-invocation: true
---

# Engine — Outbound Continuity Heartbeat

The Outbound engine is a **continuity state-machine, not a sourcing tool** — the work (find/draft/send) is trivial; staying current is the bottleneck. This skill is its **heartbeat: RECONCILE → RENDER → POINT.** Run it by hand at the start of any engine work session, as often as you want.

Full design + the grill rationale: `Research/Strategic/Active/2026-06-27 - Microschool Lab — Outbound Engine Continuity Layer (engine command) Design.md`.

## Source of truth (the rule everything rests on)

- **Gmail owns sent + replied** (the facts it witnesses). **The Notion Outreach Tracker owns judgment** (stage · track · hook · next action).
- **SENT is stamped at send-time** on the row (`Send Date`) — keyless, all channels, never **drifts**.
- **REPLIED is the only async event** → the only thing reconcile must hunt. The Live2Create miss was a *reply* miss.
- **Join key = the row's `Email` ↔ thread `To:`/`From:`.** Never match on school name or subject (both drift / collide).

### Write-owner / non-goals

`/engine` may write: **Outreach Tracker**, **Gmail** (labels / thread state used for reconcile), and the **geo Worked ledger only when a metro was actually worked this run**.

`/engine` must **NOT** write: Hub Stage Tracker · Hub Resume here · Hub Recent decisions · cadence STATUS BOARD · `current_focus` · vault session log. After a run that changed Tracker or geo, **remind to `/lab end`** so derived surfaces catch up.

## Manifest (read once; never hardcode)

Read `Agent Knowledge/Guides/lab-registry.md` → Microschool Lab. Surfaces this skill touches:
- **Outreach Tracker** (the only data store): `4b37775f-ea5b-4cc6-8a0b-92ea8985f999`
- **Geo-map Worked ledger** (current/next metro): `Strategy/GTM/Microschool Lab/Active/2026-06-23 - Microschool Lab — Geo Rotation Map (Outbound Engine).md`
  - **Current week pointer (WLO 2026-08-10):** sending fronts = **Naples, FL** + **Phoenix pocket expansion** (Mesa/Tempe/Peoria/Surprise/Queen Creek; dedupe vs Wk-1). Follow-up front = **Orlando** Touch-1 due **2026-08-16**. Jacksonville dated after Naples. Still pick **ONE metro per `/engine` session** (Step 0.5) — the week has two fronts, the session has one.
- **Gmail reader — use `mcp__gws__gmail` as PRIMARY.** It supports `page_all` for genuinely complete sweeps and does not truncate thread message lists, and it is the same API used to send. The `claude_ai_Gmail` connector is **fallback only**. The three silent-failure rules below apply to **both** readers.
- **Gmail label** (lab outreach only, never whole inbox): `Microschool Lab` — **query it as `label:microschool-lab`** (hyphenated, lowercase). `label:"Microschool Lab"` and `label:Label_12` both return **zero results instead of erroring**.
- **The four goal specs** (`/engine` routes to these; it never does their work itself). **STATUS CHECKED 2026-08-07: only the sourcing template actually exists on disk — the other three are cited here but were never created.** Same gap class as the `lab-roster-judge` agent file (cited everywhere, missing until 8/5). Until these exist, drafting/send/follow-up work has been done ad hoc in-session (e.g. the 2026-08-07 Orlando 13-row draft batch) rather than via a routed goal — that's a real gap, not a documentation lag; treat "route to the drafting template" as unavailable and fall back to doing the work directly until one of these gets built:
  - `goal-specs/_TEMPLATE-microschool-engine-metro-sourcing.md` — Backlog → In Review — **exists**
  - `goal-specs/_TEMPLATE-microschool-engine-metro-drafting.md` — In Review → Draft — **MISSING**
  - `goal-specs/_TEMPLATE-microschool-engine-metro-send.md` — Draft → Sent (write-at-send) — **MISSING**
  - `goal-specs/_TEMPLATE-microschool-engine-followup.md` — off Touch 1 / Touch 3 — **MISSING**
- **Stage contract** (what each `Stage` value means): `Strategy/GTM/Microschool Lab/Active/2026-07-28 - Microschool Lab — Outbound Kanban Stage Contract.md`

> 🔴 **Send write-back invariant (learned 2026-08-10):** Gmail Sent alone is **not** a completed send. The 8/10 Orlando autonomous routine delivered 13/13 emails but left Outreach Tracker at `Stage=Draft` with no Send Date / Touch timers / label. **A send is only Done when Tracker shows `Stage=Sent` + `Send Date` + Touch timers armed + `Microschool Lab` label applied** (or those writes are verified in the same session). Unattended/cloud sends must verify **both** Gmail and Tracker.

> 🔴 **Gmail read rules — these fail SILENTLY, so they are non-negotiable (learned 2026-07-06, again 2026-07-27):**
> 1. **`search_threads` TRUNCATES a thread's message list** and can hide the most recent messages, making an answered thread look unanswered. **Never conclude "no reply," "not sent," or "follow-up owed" from `search_threads` output — always confirm that thread with `get_thread` first.** On 2026-07-27 this produced a false "overdue, never sent" call on Wild Wisdom (search showed 5 of 7 messages, hiding both the follow-up AND the prospect's reply, which was a pass).
> 2. **The label under-covers warm threads.** Bulk cold sends get labeled at send; **replies and warm-thread messages usually do not.** A label-only reconcile is structurally blind to the warm pipeline — the rows that matter most. Cross-check every warm/Replied row by sender-domain search as well as by label, and treat a label miss as "unlabeled," never as "no activity."
> 3. **Searches EXCLUDE Trash by default.** If a Tracker row claims a thread and your search returns **zero results**, that is NOT evidence the send never happened — re-run with `includeTrash: true` (or `in:anywhere`) before concluding anything. On 2026-07-28 this hid the Acton Academy West End thread, whose last message was a **7/13 pass** ("We are not interested at this time") — the row sat mislabeled Replied/Interested for 15 days. **Zero results on a row that claims a thread = check Trash, then escalate to a human. Never record it as "no activity."**
- **Follow-up flags** live in the render's DUE TODAY / IMMINENT sections — derived from the Tracker's `Touch 1` / `Touch 3` date fields, NOT a separate task object

## Step -1 — READ THE BOARD (mandatory, before anything else)

Query the Lab Execution Board (`7c7fe301-6a62-45cf-83ca-1443e671fc12`) for rows with `This Week` and `Status` in (`Not started`, `In progress`). Print them.

> ⚠️ **`This Week` is a CHECKBOX, not text.** The SQL filter is `WHERE "This Week" = '__YES__'`. Writing `= 'YES'` returns **zero rows instead of erroring** — a silent failure that reads as "nothing queued this week." (Caught 2026-07-28.)

**The board owns scope.** If a row carries a stopping rule, that rule binds this session. If a row is marked GATED, the gate holds until Andres lifts it in-session.

This step exists because on 2026-07-28 a session ran six sourcing agents across five metros while the board's own row said *"stop at ~30-40 sourced across the three pockets."* The board was never read.

## Step 0.5 — METRO GATE (hard stop)

Name the ONE metro this session works. Take it from the geo-map Worked ledger or from Andres.

**If no metro can be named, STOP and ask.** Do not source, enrich, draft, or send without one. A run may never widen mid-flight — *"while we're at it, let's also do X"* is the exact failure this gate exists to prevent.

## Step 0 — SETUP (idempotent; makes reconcile possible)

Run every time; each is a no-op once true.
1. Ensure the `Microschool Lab` Gmail label exists — create it if missing (the registry claims it but it may not exist).
2. Ensure every `Stage=Sent` *emailed* row has a `Send Date`; backfill from the thread's send date where missing.
3. Identify the **manual-track** set: rows with no `Email` (Form-only / phone) — structurally invisible to reconcile.

**Done when:** label exists · no Sent emailed row is missing a `Send Date` · the manual-track set is listed.

## Step 1 — RECONCILE (writes)

Pull the labeled `Microschool Lab` threads (sent + inbound). For each thread, email-join `To:`/`From:` to a Tracker row and advance Stage from Gmail-truth: **Draft→Sent** (a send exists), **Sent→Replied** (an inbound reply exists). Reconcile replies *first*, before any downstream step — never flag a follow-up for a row that has replied.

**Done when:** EVERY labeled thread is either matched to a row (its Stage now reflecting the latest thread state) **or explicitly listed as unmatched-needs-human.** Not "a list of matches" — every thread accounted for.

## Step 2 — RENDER (derived)

Regenerate the **control tower**. Print all six sections with live numbers from the reconciled Tracker + geo-map. **Render, never dump** rows or prose.

```
╔══════════════════════════════════════════════════════════════╗
║  MICROSCHOOL OUTBOUND ENGINE        run <date> · manual       ║
╚══════════════════════════════════════════════════════════════╝

▸ WHERE WE ARE
   Sending front  : <metro> (Wk-N)   ▰▰▰▱▱  <sent>/<draft>
                    └─ <blocked-on note, if the front is blocked>
   Follow-up front: <earlier metros, all sent, in follow-up>
   Next metro     : <metro> (Wk-N+1)

▸ THE NUMBER  (n we're growing)
   Sent     <n>   │ T1 <n> │ T2 <n>
   Replied  <n>   │ T1 <n> │ T2 <n>     ◄ <one-line signal read>

▸ DUE TODAY  (flag = these render lines; you work them by hand)
   Touch-1 D+6    <n> schools → <names>
   Touch-3 D+12   <n> schools → <names>

▸ IMMINENT  (next 2 days — so nothing surprises you)
   <date>  <wave / bumps coming due>

▸ REPLY QUEUE         (reconciled from Gmail — act on these)
   ● <school>   <one-line status>   <track>

▸ MANUAL-TRACK        (no email — Gmail can't see, eyeball by age)
   ⧗ <school>   awaiting reply  <N>d

▸ NEXT ACTION
   → <single action>
```

**Done when:** all six sections printed with live numbers.

## Step 3 — POINT (route to exactly ONE goal)

Determine the metro's current kanban stage from the Tracker, then name the ONE goal spec to fire. Priority: **send > follow-up-due > draft > find.**

| Metro state | Fire |
|---|---|
| Rows `Draft` with Gmail drafts, reviewed by Andres | `goal-specs/_TEMPLATE-microschool-engine-metro-send.md` |
| `Touch 1` / `Touch 3` dates due on `Sent` rows | `goal-specs/_TEMPLATE-microschool-engine-followup.md` |
| Rows `In Review` (contact-ready, no drafts yet) | `goal-specs/_TEMPLATE-microschool-engine-metro-drafting.md` |
| No rows for this metro yet, or only bare `Backlog` | `goal-specs/_TEMPLATE-microschool-engine-metro-sourcing.md` |

Print the template path **and the filled parameters** so the goal can be fired without further lookup.

**Also attach the gotchas block.** Every fired goal carries Part 3 (paste-ready GUARDS) of `Strategy/GTM/Microschool Lab/Active/2026-07-30 - Microschool Lab — Engine Run Gotchas & Judge Pass (ATTACH TO EVERY RUN).md` — verbatim, not paraphrased. It mandates the **`lab-roster-judge`** pass: after enrichment/sourcing subagents return and before staging/drafting/sending, that agent reads ACROSS the roster and returns PROCEED / PROCEED-WITH-CUTS / **HALT**. A HALT stops the run; you do not proceed by dropping the bad rows. *(Added 2026-07-30 after a 22-school batch reached finished drafts to a private high school, a franchise campus, a 3-campus IB school, and an ABA therapy provider.)*

The pipeline runs **two fronts at once** (a sending metro + earlier metros in follow-up) — pick across both, but fire only one.

> **`/engine` orients; the goal executes. Do NOT perform the stage's work inline.** Sourcing, enriching, drafting, and sending inside an `/engine` run is the freelancing this router exists to stop.

**Done when:** exactly one goal-spec path is named, with its parameters filled.

## Reference — rules that bind the steps

- **`/engine` itself is flag-only.** Follow-ups surface in the render (DUE TODAY / IMMINENT); `/engine` never drafts them. The render line is the flag; no separate task object (the Tracker's Touch dates already hold the state). **Drafting them is meant to be the follow-up goal's job** (`_TEMPLATE-microschool-engine-followup.md`) — but per the 2026-08-07 status check above, that file does not exist. The Touch-1/Touch-3 body copy IS locked verbatim (in the template doc, `Strategy/GTM/Microschool Lab/Active/2026-06-10 - ... Outreach Email Template (locked).md`), it just isn't wired into a routable goal spec yet — draft follow-ups by hand against that doc until this spec is built.
- **Staleness guard.** Original send >90 days → no canned bump; surface for human re-intro.
- **Metro-by-metro.** Finish one metro (sent + followed-up) before opening the next; backlog promotion is manual/conditional (only when a metro underperforms).
- **Manual-track.** No-email rows can't be reconciled; the render flags them by elapsed time so they never silently rot.
- **Deferred — do NOT build into runs yet** (each gated on proven reliability + enough n): promote `/engine` to a daily cron · T1-vs-T2 rebalance · autonomous sending (the send goal's OVERRIDE mode requires spoken per-session authorization; a spec file is never authorization).
- **Derived-surface freelancing.** Do not "helpfully" update Hub Resume / Stage Tracker / cadence / `current_focus` / session log inside `/engine` — that is `/lab end`'s job.
