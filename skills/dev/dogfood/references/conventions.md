# Conventions

Adapted from the frontend `manual-qa` skill (`references/no-token-injection.md`, `execute-mode.md`). These are the rules every dogfood run inherits.

## Full-UI login — never token injection

Log in as each household member through the **real email+password screen**. Never inject `localStorage.token` / `localStorage.student_token` to skip auth.

The auth + onboarding path is itself under test — it has shipped real bugs: broken submit handlers, wrong redirect targets, role-based routing regressions, first-paint flicker, hydration mismatches, profile-completeness gates. Skipping it with a token blinds you to all of them.

If a page bounces to login mid-run, **pause and log in manually** — never fall back to `localStorage.setItem`.

## Two layers — both mandatory

| Layer | Catches | How |
|---|---|---|
| **Browser (you, clicking)** | rendering, styling, interactions, the *feel* | drive the real UI on `thoven.co`, visually confirm |
| **Backend assertion** | did the data actually change | read-only prod query (`PROD_DATABASE_URL`) for money/state-critical steps only |

The browser can lie ("Booked!" toast with no row written). For wallet + booking, confirm the backend truth. For everything else, UI is enough.

**Run facts:**
- **Prod base URL:** `https://thoven.co` — all routes, marketing and app (marketplace, `/teacher/[id]`, dashboards). Confirm any subdomain nuance on calibration.
- **Backend assertion query (read-only):** `set -a && source ~/thoven/backend/.env && set +a && psql "$PROD_DATABASE_URL" -c "SELECT …"`. `SELECT` only — never write. Resolve household IDs (`teacher_id` / `student_id` / parent `profile_id`) once on calibration by email lookup; store them in `household.local.json` so assertions don't re-resolve every run.

## Exact expected values

`$200.00` not "correct amount". `wallet debited 1 credit` not "balance changed". `no 410/5xx` not "page works". `1 upcoming lesson Tue 4pm` not "shows lessons". A check you can't pass or fail unambiguously isn't a check.

## One at a time

State the **account · URL · what to look for · what NOT to see**, then wait for Andres's ✅/⚠️/❌. Document a failure before moving on. Group checks by login account to minimize switching. Never batch a list of steps and ask "all good?".

## Destructive actions — allowed, household-scoped

Unlike `manual-qa` (read-only on prod), dogfood **does** book, approve, pay, and text — that is the point. The safety comes from *scope*: every action is between the household accounts (parent ↔ dogfood-teacher ↔ student). Never approve/refund/delete against a real user's record.

## Post-publish transient rule

Right after a Replit publish, dynamic routes can briefly `404` (Replit warm-up / RSC version skew). **Re-probe a few times** before labeling a post-deploy 404 a real bug — a self-resolving warm-up blip is Low/transient, not a Critical.
