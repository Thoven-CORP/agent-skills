# Framing — clarify, choose a strategy, plan the criteria

This is the reasoning half of the workflow: the questions to ask, the heuristics to pick data/scope/what-to-test, and the Thoven-native things to look for. Setup mechanics live in `prod-snapshot.md`; browser execution in `execute-and-evaluate.md`.

## Clarify first (AskUserQuestion)

Ask before acting. Guessing the intent is how you QA the wrong surface. Cover these, phrased Thoven-native:

- **What did you build or fix?** Get the actual feature/commit, not a paraphrase — you'll read the diff.
- **Bug fix or net-new feature?** Single-symptom fix vs. multi-part feature changes both the data strategy and what "done" means.
- **Where did it come from?** "A parent reported X" → real prod data reproduces the exact state and is worth pulling. "New idea, nothing shipped yet" → no prod signal, seed instead.
- **What's the one thing that must be true?** The symptom that must be dead (bug fix) or the happy paths that must all work (feature). This becomes Criterion #1.

If the answers are thin, keep asking — a wrong scope call wastes the whole run.

## Data strategy — prod snapshot vs. seed

| Situation | Strategy | Why |
|---|---|---|
| Bug fix, came from a real user report | **Prod snapshot** | Real rows reproduce the exact broken state with no fabrication. |
| Bug fix reproducing a specific state-combination | **Prod snapshot** | Backend validations/constraints often make the broken state *unreachable* by hand. Example: a `simple_booking_reschedule_requests` row that is `status: pending` yet already past its `expires_at` — the natural way to get one is real data where a background job hasn't flipped it yet; `check_proposed_date_not_past` and friends fight you if you try to hand-craft it. |
| Net-new feature, no prod signal | **Seed** (idempotent `find_or_create_by!` via rails-runner) | Nothing to reproduce; synthetic-but-realistic local rows are the honest source. |
| Pure UI/copy change | **Seed or existing dev data** | No data dependency; don't pull prod PII for a border-radius fix. |
| Snapshot lacks the exact edge row | **Snapshot + targeted nudge** | Pull the real graph for realism, then surgically age one *real* row in `thoven_qa` into the edge state (e.g. backdate `expires_at` on a genuine pending request past now) — don't fabricate the whole row, just push a real one over the boundary. Prod may not currently hold the exact state (a job may have already flipped it), so don't assume the snapshot has it — check, and nudge if not. |

State your pick and the reason, then confirm.

## Scope — BE / FE / BE+FE

Decide which layers the change **touches in the product**, which is not the same as which files the diff changed.

- **Read the diff**, but treat it as a starting point, not the boundary. A fix that only edits `components/parent/*` can still have a **teacher-side twin** that behaves the same way and was never in the diff — that's a real scope question, not a mechanical one. Surface it and get a human answer before calling the fix "verified."
- **BE-only** when the bug is pure data/logic: verify with rails/specs against the snapshot, no browser needed.
- **BE+FE** when it's a UI or contract bug: stand up the full harness and drive the real UI.
- **BE+FE paired change → confirm the BE half is live before trusting an FE pass.** When the fix spans both repos (e.g. a BE serializer/scope change *plus* an FE guard), an FE-only result is meaningless if the paired backend isn't deployed — the BE half changes which rows the API even returns. Thoven deploys **BE first**; confirm the paired BE commit is running in your harness (and is deployed to prod before any FE publish), or the "verified" verdict is hollow.
- Flag any layer the diff *didn't* touch but the symptom *could* live in, as an explicit gap in the final report.

## What to test

**Bug fix:** reproduce the bug condition on real/realistic data → confirm the symptom is gone → then push edge cases. Derive edge cases by reading the actual fixed predicate, not from a generic list:

- **Boundary** — value exactly at the threshold, and one step either side (e.g. `expires_at` == now vs. a few seconds out).
- **Race** — state valid at fetch time but invalid by click time (seed a near-expiry, deliberately delay the click); confirm the server re-validates with a clean 4xx, not a crash.
- **Already-flipped state** — the downstream job already ran (`status: 'expired'`), a distinct code path from "past expiry but still pending."
- **ID mismatch** — a newer request exists for the same slot; the stale notification must be non-actionable even though *a* pending request exists.
- **Fetch failure** — the refetch throws (500/network); must land in an error state, never silently fall back to the raw payload.

**Multi-part feature:** happy path through each part, plus the cross-part journeys (state that carries across logins).

## Plan the criteria (Phase 2 evidence sources)

Turn the diff + intent into **exact, falsifiable criteria** — each phrased as the customer's symptom. Pull supporting evidence before writing them:

- **mem0** — prior bugs, decisions, and gotchas in this area (search noun-phrase queries).
- **`investigate-thoven` common-errors** (`.claude/skills/investigate-thoven/references/common-errors.md`) — 60+ known error patterns; check if this bug matches one.
- **Issue tracker** (`docs/agents/issue-tracker.md`) — is this a tracked issue with acceptance criteria?
- **Gmail customer reports** — the real teacher/parent words that describe the symptom; Criterion #1 should sound like them.

Each criterion needs an exact expected value and a persona who can exercise it (see the who's-who roster in `prod-snapshot.md`).

## Thoven-native things to look for

- **Currency** renders `$200.00`, never `20000` cents.
- **Timezone** — `YYYY-MM-DD` parsed local (`new Date(y, m-1, d)`), never `parseISO` (day-shift in western tz).
- **Dual auth** — Parent/Teacher and Student are separate systems; test the right one.
- **Role-gated UI** — the right role sees it, the wrong role is blocked/redirected.
- **Design tokens** — `amber-500` not `orange-500`; `font-display` vs `font-sans`.
- **Zero feature-related console errors** (ad-blocker analytics warnings are acceptable).
