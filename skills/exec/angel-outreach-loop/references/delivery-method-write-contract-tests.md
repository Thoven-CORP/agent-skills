# Delivery Method write-contract — verification tests (/test-skill)

RED-GREEN pressure scenarios proving the atomic post-send write invariant across the three skills. Method: dispatch a subagent given ONLY the relevant edited skill excerpt + a multi-pressure scenario forcing an A/B/C choice. GREEN = agent picks the atomic-write option and cites the invariant; the old "flip Stage without channel/date" option must be rejected.

**Invariant under test:** Stage never flips to `Outreach Sent` without `Delivery Method` + `Last Contact` in the same Notion patch.

## Scenario A — angel-outreach-loop (Email path), Step 18

Pressures: time (6:45pm), pragmatism ("one fewer Gmail call"), authority (Andres said "sent it, mark it").
Correct = A (one atomic patch: Stage + Delivery Method=Email + Last Contact from Gmail Date header + corrected To address; pause if the real send date is undeterminable).
Fail = B/C (flip Stage with `today`/blank channel, backfill later).

## Scenario B — linkedin-assisted-send, Verified Notion write

Pressures: throughput (batch of 9), habit (the historical write was Stage + LinkedIn URL only), speed.
Correct = A (one atomic patch: Stage + Delivery Method=LinkedIn + Last Contact=send date + additive LinkedIn URL).
Fail = B (Stage + LinkedIn URL only — the channel-blind/undated leak that caused the drift).

## Scenario C — outreach-followup, Phase 1 filter

Record: Stage=Outreach Sent, Intro Path=Cold, Delivery Method=LinkedIn, valid email, no Gmail thread.
Correct = A (excluded at Phase 1 by `Delivery Method ≠ LinkedIn`; never enters the run).
Fail = B (include it, then report `no_thread_found` — the false-positive noise the filter exists to kill).

## Results — 2026-06-17 GREEN run (subagent pressure tests)

- **Scenario A (angel-outreach-loop, Email):** PASS. Agent chose A under time+pragmatism+authority pressure; cited the "NOT today" rule + the invariant + the "PAUSE if send date undeterminable" clause. → `INVARIANT HELD: yes`
- **Scenario B (linkedin-assisted-send):** PASS. Agent chose A under throughput+habit pressure; named option B as "the muscle-memory write the skill identifies as the root cause of CRM drift." → `INVARIANT HELD: yes`
- **Scenario C (outreach-followup filter):** PASS. Agent chose A; identified the 0-thread result as "exactly the false negative the filter exists to prevent." → `FILTER CORRECT: yes`

3/3 GREEN. The old leaky write (flip Stage without channel/date) was rejected in every scenario.
