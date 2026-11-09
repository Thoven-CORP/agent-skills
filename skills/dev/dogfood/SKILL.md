---
name: dogfood
description: Use when running the weekly Thoven dogfood ritual, when Andres wants to manually test a shipped feature against production ("test scheduling", "is the wallet loader working in prod", "dogfood the new X"), or when smoke-checking a release end-to-end as the parent / student / teacher household.
---

# dogfood

Eat your own dog food. Run Thoven's real product on production against a **persistent test household** — one parent, their student(s), and a dedicated teacher — to catch regressions and feel the friction a real family feels. The virtue is predictability: same household, same gates, every run logged.

**Scope: the customer-facing product only** (parent / student / teacher). Admin surfaces are out of scope — verify those separately.

## Invocation → branch

| You say | Branch | Runs |
|---|---|---|
| `/dogfood` | **weekly** | Smoke every release shipped since the last run + the standing core |
| `/dogfood <feature>` | **ad-hoc** | Targeted run on one feature, right now |
| `/dogfood status` | **status** | Dry read: what *would* run + days since reset. No login, no log. |

## Non-negotiables (every branch)

- **Full-UI login, never token injection.** Log in as the household through the real email+password screen — never inject `localStorage.token`/`student_token`. The auth + onboarding friction is part of what you are dogfooding. → `references/conventions.md`
- **Household-scoped only.** Real bookings, SMS, wallet moves, and emails are fine *because* they fire between your own test accounts. Never act on a real user's data.
- **Exact expected values.** `wallet debited 1 credit`, `$200.00`, `no 410/5xx` — never "looks right."
- **One check at a time.** State account + URL + what to look for + what NOT to see; wait for Andres's ✅ / ⚠️ / ❌ before the next. Group by login account. Never batch.

## The household

Identities + current state live in `state.json` — sibling of this file: `~/.claude/skills/dogfood/state.json`. Passwords + resolved DB IDs live in the gitignored `household.local.json` beside it, which **overrides** `state.json`.

**The household is *ready* only when `filled: true` AND `parent.email` is set AND `students` is non-empty.** If it is not ready, **STOP** — tell Andres to finish the household standup first (the P0 `[Andres-action]`: create the parent on +17049930943, add student(s), confirm the dogfood teacher exists in prod). There is nothing to dogfood until then.

**Calibration — the first *ready* run** (when `last_dogfooded` is empty): resolve the household's DB IDs (look up `teacher_id` / `student_id` / parent `profile_id` by email, store in `household.local.json`), pin the standing-checklist URLs/selectors against the live app, run the **standing core only** (skip changelog bucketing), and record the newest `prod/*` release tag in each repo as the baseline. Bucketing begins the run *after* calibration.

Read the `last_known_state` snapshot aloud at the start so any failure carries its repro context.

## Steps

### 1. Load state & frame the run
Read `state.json` (+ `household.local.json` override): household identities, `last_dogfooded` version per repo, `last_reset_date`. If `last_reset_date` is set and `today − last_reset_date ≥ 30`, open with a reset reminder; if it's null, skip the reset check. **Always** check the wallet before a run that needs approvals: `available_credits` = `lessons_remaining − credits_reserved`, and orphaned reservations starve it while `lessons_remaining` still looks healthy. `bundle exec rake dogfood:reset_household` (gate `DOGFOOD_RESET_CONFIRM=1`; preview with `DOGFOOD_RESET_DRYRUN=1`) restores `10/0` **non-destructively** — zero `DELETE`s, and it never fires a notification.
**Done when:** household readiness is confirmed, identities + the entering-state snapshot are stated, and the branch is chosen.

### 2. Build the run sheet
- **weekly:** read the GitHub Releases on every `prod/*` tag newer than `last_dogfooded` (`gh release list --repo Thoven-CORP/frontend-remote` and `--repo Thoven-CORP/backend-remote`, then `gh release view <tag>`); a release is live on prod by definition, and anything unreleased is picked up next run. Bucket each bullet → `references/changelog-buckets.md`. Script the user-visible + integration + contract-removal buckets; list BE-only-not-clickable out-of-band. Append the standing core → `references/standing-checklist.md`.
- **ad-hoc:** resolve `<feature>` to its standing-checklist domain(s); if none match, search the code for the feature and synthesize steps in the same shape (UI check + exact value + backend assertion where state-critical).
- **status:** print the run sheet and **STOP** — no login, no log.
**Done when:** every release bullet since `last_dogfooded` is bucketed and either scripted into a step or explicitly listed out-of-band; the standing core is appended.

### 3. Run it (guided-manual)
Walk the sheet one check at a time (see non-negotiables). The scripted core yields an unambiguous ✅/❌; the **grill** tail is open exploration — capture "what felt bad." For money/state-critical steps (wallet, booking), confirm the backend truth with a read-only prod assertion, not just the UI. → `references/standing-checklist.md`
**Done when:** every standing domain and every scripted step has a ✅/⚠️/❌, and the grill note is captured.

### 4. Route findings
A real bug (something broken) → mint it into the bug tracker and link it. Soft friction (confusing copy, slow screen, awkward flow) → note it in the run page body. → `references/logging.md`
**Done when:** every ❌/⚠️ is either a linked bug or a recorded friction note.

### 5. Log the run & advance state
Create the Notion **Dogfood Runs** row (versions, buckets, Result = Go/No-Go, entering-state, linked bugs; detail in the page body) → `references/logging.md`. Then update `state.json`: bump `last_dogfooded` to the `prod/*` tags just tested, set `last_run_date`, refresh `last_known_state`.
**Done when:** the run row exists and `state.json` reflects this run.

## Go/No-Go gate

**GO** if the always-on critical core (home · login · marketplace · a real `/teacher/[id]` load) and the contract-removal sweep pass with no Criticals. A cosmetic miss elsewhere is a follow-up, not a NO-GO. → `references/standing-checklist.md`
