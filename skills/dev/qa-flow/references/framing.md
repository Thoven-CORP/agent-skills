# Framing — clarify, choose a strategy, plan the criteria

This is the reasoning half of the workflow: the questions to ask, the heuristics to pick data/scope/what-to-test, and the Thoven-native things to look for. Setup mechanics live in `prod-snapshot.md`; browser execution in `execute-and-evaluate.md`.

## The questions

SKILL.md Step 1 decides when to ask. On a dispatched or release run, answer these from the changelog bullet, the PR body and the Linear ticket instead of asking. Phrased Thoven-native:

- **What did you build or fix?** Get the actual feature/commit, not a paraphrase — you'll read the diff.
- **Bug fix or net-new feature?** Single-symptom fix vs. multi-part feature changes both the data strategy and what "done" means.
- **Where did it come from?** "A parent reported X" → real prod data reproduces the exact state and is worth pulling. "New idea, nothing shipped yet" → no prod signal, seed instead.
- **What's the one thing that must be true?** The symptom that must be dead (bug fix) or the happy paths that must all work (feature). This becomes Criterion #1.

## Modes

**In development** (a branch, local, or staging before promote): diff-aware and wide. Map the diff to the pages it reaches (a route or controller to its paths, a component to the pages that render it, a model, service, job or mailer to the pages and emails that show its result), then hunt there and on the neighbouring pages: happy paths, the real-user take, the literal-user take, the dependency checks, and UI polish filed as `design`. A backend-only diff gets the browser on the pages that show its result.

**Production** (after a promote, or a live report): a quick read-only smoke per user type. Their home, the top navigation targets and the changed pages, each checked for console errors, failed calls and broken links. Reads only, on accounts publish's gates leave alone.

**Regression** (after a fix): rerun the same flows and compare with the last run's `steps.jsonl`: fixed, new, still failing.

**Release pass.** For a release's larger feature (a money, upload, job or email, migration or new-surface change), a tester pane separate from the builder runs the development hunt on staging, on the mini, with writes and Stripe test cards, before publish shows `plan`. After the promote, the production smoke runs per user type. The pass delivers videos and the reader page, and its verdict link goes on the feature's changelog bullet (`~/.agents/skills/publish/references/production.md` step 1).

## Data strategy — prod snapshot vs. seed

| Situation | Strategy | Why |
|---|---|---|
| Bug fix, came from a real user report | **Prod snapshot** | Real rows reproduce the exact broken state with no fabrication. |
| Bug fix reproducing a specific state-combination | **Prod snapshot** | Backend validations/constraints often make the broken state *unreachable* by hand. Example: a `simple_booking_reschedule_requests` row that is `status: pending` yet already past its `expires_at` — the natural way to get one is real data where a background job hasn't flipped it yet; `check_proposed_date_not_past` and friends fight you if you try to hand-craft it. |
| Net-new feature, no prod signal | **Seed** (idempotent `find_or_create_by!` via rails-runner) | Nothing to reproduce; synthetic-but-realistic local rows are the honest source. |
| Pure UI/copy change | **Seed or existing dev data** | No data dependency; don't pull prod PII for a border-radius fix. |
| Snapshot lacks the exact edge row | **Snapshot + targeted nudge** | Pull the real graph for realism, then surgically age one *real* row in `thoven_qa` into the edge state (e.g. backdate `expires_at` on a genuine pending request past now) — don't fabricate the whole row, just push a real one over the boundary. Prod may not currently hold the exact state (a job may have already flipped it), so don't assume the snapshot has it — check, and nudge if not. |

State your pick and the reason.

## Scope — BE / FE / BE+FE

Decide which layers the change **touches in the product**, which is not the same as which files the diff changed.

- **Read the diff**, but treat it as a starting point, not the boundary. A fix that only edits `components/parent/*` can still have a **teacher-side twin** that behaves the same way and was never in the diff — that's a real scope question, not a mechanical one. Surface it and get a human answer before calling the fix "verified."
- **BE-only** when the bug is pure data/logic: verify with rails/specs against the snapshot, no browser needed. A spec that stubs a provider (Stripe, mail, Mixpanel) proves nothing about that provider; the dependency checks below do.
- **BE+FE** when it's a UI or contract bug: stand up the full harness and drive the real UI.
- **BE+FE paired change → confirm the BE half is live before trusting an FE pass.** When the fix spans both repos (e.g. a BE serializer/scope change *plus* an FE guard), an FE-only result is meaningless if the paired backend isn't deployed — the BE half changes which rows the API even returns. Thoven deploys **BE first**; confirm the paired BE commit is running in your harness (and is deployed to prod before any FE publish), or the "verified" verdict is hollow.
- Flag any layer the diff *didn't* touch but the symptom *could* live in, as an explicit gap in the final report.

## What to test

**Bug fix:** reproduce the bug condition on real/realistic data → confirm the symptom is gone → then push edge cases. Derive edge cases by reading the actual fixed predicate, not from a generic list:

- **Boundary** — value exactly at the threshold, and one step either side (e.g. `expires_at` == now vs. a few seconds out).
- **Race and duplicate intent** — state valid at fetch time but invalid by click time (seed a near-expiry, deliberately delay the click); confirm the server re-validates with a clean 4xx, not a crash. Then one user intent, sent more than once: a double-click, a same-key replay, a retry after a lost response. Assert one POST in the network log, one row, one wallet credit, and on a money path one Stripe PaymentIntent with one capture (read through the Stripe plugin, test mode). A spec that stubs Stripe never excuses this check on a money path.
- **Already-flipped state** — the downstream job already ran (`status: 'expired'`), a distinct code path from "past expiry but still pending."
- **ID mismatch** — a newer request exists for the same slot; the stale notification must be non-actionable even though *a* pending request exists.
- **Fetch failure** — the refetch throws (500/network); must land in an error state, never silently fall back to the raw payload.

**Feature:** happy path through each part, plus the cross-part journeys (state that carries across logins). Then the takes and checks below. Depth follows what the change can break: a money, upload, job or email, migration or new-surface change gets all of them on staging; a UI or copy change or a hotfix gets one targeted take.

**Real-user take.** Act like a person. Each product flow is one recorded take, and the reversible moves below happen inside it, the way people navigate; a destructive action or a different persona starts the next take. After each move, check what persisted:

- back and forward, and refresh mid-flow;
- leave the page and come back; open the same flow in a second tab (`agent-browser tab new`);
- double-click and double-submit every write (the duplicate-intent assertions above);
- upload, refresh, then upload again: is the first file saved once, and does the second land;
- slow or failed network: `agent-browser set offline on`, or `network route <url> --abort` on one call;
- two actors on one resource at once (a teacher declines while the parent pays); this and any multi-persona or stress take run on the mini behind `thoven-load-gate -- <cmd>`, and an unavailable mini defers it.

The impatient user, the confused one who clicks what the UI signals against, and the breaker who pastes junk are examples of the mindset, not a script. Record these steps as `ru-` flows in `steps.jsonl`.

**Literal-user take.** A tester who has read the code knows the length rules and the right input, and tests like a perfect user. This take gets a separate tester holding only the URL, the persona and the goal in a user's words. It works from what the screen shows (`agent-browser screenshot` and `snapshot`) and takes every label, hint and button literally: it does the obvious thing, types the shortest answer that seems to fit (two words in a text box), skips anything marked optional, and taps what a label says even when the code means something else. Each place the literal reading fails is a finding: a hidden minimum the screen never states, an "optional" field that blocks, a button that does something other than its label, an error that does not say how to fix it. Record these as `lu-` flows.

**Dependency checks.** List each off-screen effect the diff adds and check each one on staging after the take, quoting counts or ids: the Solid Queue job ran without a failed execution, the `email_deliveries` row exists, the Stripe object exists once, the Mixpanel event arrived (Mixpanel MCP), the migration or backfill ran. Read rows with `~/.agents/skills/publish/references/staging.md` "Run code on staging", using the same queries as `~/.agents/skills/publish/scripts/prod-db-check.sh`. For a large feature, first list where its tests stub a real service; that list is the plan. QA writes nothing to production.

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
