---
name: engine
description: >-
  Microschool Lab Outbound engine heartbeat — reconcile Gmail↔Notion, render the control tower, name the one next move. Run by hand. Manual-only since 2026-10-22: the lab is on its maintenance floor; invoke by name.
disable-model-invocation: true
---

# Engine — Outbound Continuity Heartbeat

The Outbound engine is a **continuity state-machine, not a sourcing tool** — the work (find/draft/send) is trivial; staying current is the bottleneck. This skill is its **heartbeat: RECONCILE → RENDER → POINT.** Run it by hand at the start of any engine work session, as often as you want.

> **Status (2026-10-22): maintenance floor.** The Outbound engine is no longer an active growth front. Microschool work now runs as the **"ESA + Microschools" initiative in the Notion GSD hub** (`cbb6c461-0760-8325-bf6a-01344d41e228`; OKR Tracker `collection://2076c461-0760-8228-803f-07e52f6bfcd2`) and Linear. Run `/engine` only to keep the Tracker honest (reconcile replies, flag due follow-ups on rows already sent). **Do not open a new metro or fire sourcing (Naples or any other) as the next step** unless Andres lifts the floor in-session; route new microschool work to the GSD initiative instead.

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
  - **Current week pointer:** retired 2026-10-22 (maintenance floor; see Status above). The old 2026-08-10 WLO pointer (Naples sending front, Phoenix expansion, Orlando follow-ups) is history, not a queue. Still pick **ONE metro per `/engine` session** (Step 0.5), and only a metro that already has `Sent` rows to reconcile or follow up.
- **Gmail reader — use `mcp__gws__gmail` as PRIMARY.** It supports `page_all` for genuinely complete sweeps and does not truncate thread message lists, and it is the same API used to send. The `claude_ai_Gmail` connector is **fallback only**. The three silent-failure rules below apply to **both** readers.
- **Gmail label** (lab outreach only, never whole inbox): `Microschool Lab` — **query it as `label:microschool-lab`** (hyphenated, lowercase). `label:"Microschool Lab"` and `label:Label_12` both return **zero results instead of erroring**.
- **The four goal specs** (`/engine` routes to these; it never does their work itself). All four live in the vault's `goal-specs/`. The sourcing template has existed since 2026-08-05. The other three were stranded on a branch and are being restored on 2026-10-22; before firing one, confirm the file exists on disk. If it is still missing, do the stage's work by hand in-session and say so.
  - `goal-specs/_TEMPLATE-microschool-engine-metro-sourcing.md` — Backlog → In Review
  - `goal-specs/_TEMPLATE-microschool-engine-metro-drafting.md` — In Review → Draft
  - `goal-specs/_TEMPLATE-microschool-engine-metro-send.md` — Draft → Sent (write-at-send)
  - `goal-specs/_TEMPLATE-microschool-engine-followup.md` — off Touch 1 / Touch 3
  - **Until the restored drafting and follow-up specs are verified against the locked template,** any drafting or follow-up run (goal or by hand) must load `Strategy/GTM/Microschool Lab/Active/2026-06-10 - Microschool Lab T1 — Outreach Email Template (locked).md` § "Email link formatting" and stage links exactly as it says. The 2026-08-07 Orlando drafts shipped `google.com/url?q=` redirect links.
- **Stage contract** (what each `Stage` value means): `Strategy/GTM/Microschool Lab/Active/2026-07-28 - Microschool Lab — Outbound Kanban Stage Contract.md`

> 🔴 **Send write-back invariant (learned 2026-08-10):** Gmail Sent alone is **not** a completed send. The 8/10 Orlando autonomous routine delivered 13/13 emails but left Outreach Tracker at `Stage=Draft` with no Send Date / Touch timers / label. **A send is only Done when Tracker shows `Stage=Sent` + `Send Date` + Touch timers armed + `Microschool Lab` label applied** (or those writes are verified in the same session). Unattended/cloud sends must verify **both** Gmail and Tracker.

> 🔴 **Gmail read rules — these fail SILENTLY, so they are non-negotiable (learned 2026-07-06, again 2026-07-27):**
> 1. **`search_threads` TRUNCATES a thread's message list** and can hide the most recent messages, making an answered thread look unanswered. **Never conclude "no reply," "not sent," or "follow-up owed" from `search_threads` output — always confirm that thread with `get_thread` first.** On 2026-07-27 this produced a false "overdue, never sent" call on Wild Wisdom (search showed 5 of 7 messages, hiding both the follow-up AND the prospect's reply, which was a pass).
> 2. **The label under-covers warm threads.** Bulk cold sends get labeled at send; **replies and warm-thread messages usually do not.** A label-only reconcile is structurally blind to the warm pipeline — the rows that matter most. Cross-check every warm/Replied row by sender-domain search as well as by label, and treat a label miss as "unlabeled," never as "no activity."
> 3. **Searches EXCLUDE Trash by default.** If a Tracker row claims a thread and your search returns **zero results**, that is NOT evidence the send never happened — re-run with `includeTrash: true` (or `in:anywhere`) before concluding anything. On 2026-07-28 this hid the Acton Academy West End thread, whose last message was a **7/13 pass** ("We are not interested at this time") — the row sat mislabeled Replied/Interested for 15 days. **Zero results on a row that claims a thread = check Trash, then escalate to a human. Never record it as "no activity."**
- **Follow-up flags** live in the render's OVERDUE / DUE TODAY / IMMINENT sections — derived from the Tracker's `Touch 1` / `Touch 3` date fields, NOT a separate task object

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

Regenerate the **control tower**. Print all seven sections with live numbers from the reconciled Tracker + geo-map. **Render, never dump** rows or prose.

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

▸ OVERDUE  (Touch date already past and the touch not sent — work these first)
   Touch-1  <n> schools → <names> (<days late>)
   Touch-3  <n> schools → <names> (<days late>)

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

**OVERDUE is never empty by omission.** A `Sent` row whose `Touch 1` or `Touch 3` date is before today, with no matching follow-up in Gmail (confirmed with `get_thread`) and no reply, goes in OVERDUE with its days late. Print "OVERDUE: none" only after you checked every Sent row. (2026-07-31: Austin and about 55 rows missed Touch-1 / Touch-3. 2026-08-19: Orlando ran 3 days late.)

**Done when:** all seven sections printed with live numbers.

## Step 3 — POINT (route to exactly ONE goal)

Determine the metro's current kanban stage from the Tracker, then name the ONE goal spec to fire. Priority: **send > follow-up-due > draft > find.**

**Maintenance floor (2026-10-22):** only the send and follow-up rows below are live. If the only remaining move is drafting or sourcing a new metro, do not fire it; name "route to the GSD ESA + Microschools initiative" as the next action and stop.

| Metro state | Fire |
|---|---|
| Rows `Draft` with Gmail drafts, reviewed by Andres | `goal-specs/_TEMPLATE-microschool-engine-metro-send.md` |
| `Touch 1` / `Touch 3` dates due on `Sent` rows | `goal-specs/_TEMPLATE-microschool-engine-followup.md` |
| Rows `In Review` (contact-ready, no drafts yet) | `goal-specs/_TEMPLATE-microschool-engine-metro-drafting.md` |
| No rows for this metro yet, or only bare `Backlog` | `goal-specs/_TEMPLATE-microschool-engine-metro-sourcing.md` |

Print the template path **and the filled parameters** so the goal can be fired without further lookup.

**Before firing any enrichment or sourcing goal, probe the paid sources once.** Make one cheap call each to Exa and Context.dev. A 401 or 402 from either halts the run: tell Andres which source is out of credits and do not fire. If Andres chooses to run anyway on the remaining sources, the goal must tag every field filled from a fallback source as `degraded-source`, and the `lab-roster-judge` brief must say so: it scores those rows at lower trust and treats any refutation that rests on a degraded field as unverified, not as grounds to cut or HALT. (2026-06-23: all four enrichment agents hit 402/401. 2026-06-25: refutations from that run were wrong. 2026-08-05 Orlando was the fourth depleted run.)

**Also attach the gotchas block.** Every fired goal carries Part 3 (paste-ready GUARDS) of `Strategy/GTM/Microschool Lab/Active/2026-07-30 - Microschool Lab — Engine Run Gotchas & Judge Pass (ATTACH TO EVERY RUN).md` — verbatim, not paraphrased. It mandates the **`lab-roster-judge`** pass: after enrichment/sourcing subagents return and before staging/drafting/sending, that agent reads ACROSS the roster and returns PROCEED / PROCEED-WITH-CUTS / **HALT**. A HALT stops the run; you do not proceed by dropping the bad rows. *(Added 2026-07-30 after a 22-school batch reached finished drafts to a private high school, a franchise campus, a 3-campus IB school, and an ABA therapy provider.)*

The pipeline runs **two fronts at once** (a sending metro + earlier metros in follow-up) — pick across both, but fire only one.

> **`/engine` orients; the goal executes. Do NOT perform the stage's work inline.** Sourcing, enriching, drafting, and sending inside an `/engine` run is the freelancing this router exists to stop.

**Done when:** exactly one goal-spec path is named, with its parameters filled.

## Reference — rules that bind the steps

- **`/engine` itself is flag-only.** Follow-ups surface in the render (DUE TODAY / IMMINENT); `/engine` never drafts them. The render line is the flag; no separate task object (the Tracker's Touch dates already hold the state). **Drafting them is the follow-up goal's job** (`goal-specs/_TEMPLATE-microschool-engine-followup.md`, being restored 2026-10-22; confirm it exists before firing). The Touch-1/Touch-3 body copy is locked verbatim in `Strategy/GTM/Microschool Lab/Active/2026-06-10 - Microschool Lab T1 — Outreach Email Template (locked).md`. Load that doc's § "Email link formatting" for every follow-up draft, goal or by hand, until the restored spec is verified.
- **Staleness guard.** Original send >90 days → no canned bump; surface for human re-intro.
- **Autoresponder skip.** Skip a Touch only while a date-limited out-of-office is active (the auto-reply names a return date that is still in the future). After that date, the Touch is due again. A generic autoresponder ("we got your message"), or an OOO with no end date, does not skip the Touch. (2026-07-31: Lake Travis STEM was skipped on an autoresponder.)
- **Metro-by-metro.** Finish one metro (sent + followed-up) before opening the next; backlog promotion is manual/conditional (only when a metro underperforms).
- **Manual-track.** No-email rows can't be reconciled; the render flags them by elapsed time so they never silently rot.
- **Deferred — do NOT build into runs yet** (each gated on proven reliability + enough n): promote `/engine` to a daily cron · T1-vs-T2 rebalance · autonomous sending (the send goal's OVERRIDE mode requires spoken per-session authorization; a spec file is never authorization).
- **Derived-surface freelancing.** Do not "helpfully" update Hub Resume / Stage Tracker / cadence / `current_focus` / session log inside `/engine` — that is `/lab end`'s job.
