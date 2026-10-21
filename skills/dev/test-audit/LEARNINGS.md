# Learnings — test-audit

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-01 — A test audit changes tests only

> reflect · 2026-10-01 · memory:feedback_test_audit_means_tests_only · correction · applied · seen 1

**What happened.** A test audit proposed deleting about 5,700 lines of unmounted components as "batch A". Andres: "I wanted tests audited not actual code audited."
**Why.** Dead production code found by an audit is a separate decision with its own risk.
**What changed.** Already performed by "Edit shape" ("Audits edit tests only", with dead production code listed as named follow-ups). No Pitfall line.

## 2026-08-28 — Playwright design gates run on a production build, thin

> reflect · 2026-08-28 · memory:feedback_playwright_prod_build_thin_e2e · correction · applied · seen 1

**What happened.** On the Schedule build Andres said: "make sure for our tests that Playwright is against production and what is live, not dev — we have had scenarios that run green because it is ran against dev … when needed avoid heavy Playwright e2e; run mocked-fetch DOM tests and curl-the-stylesheet." Seven design specs had been green for weeks against `/dev/*` routes while `/teacher` was broken.
**Why.** A dev-only route proves the harness, not the product, and a long-running dev server serves stale CSS, so a DOM assertion passes over a missing stylesheet.
**What changed.** Pitfall line: Playwright design gates run on the production route of a production build and are labelled prod-build proof; e2e covers only what jsdom cannot (no-scroll locks, geometry, real clicks), everything else is vitest with mocked fetch on the real component; a curl of the served stylesheet asserts the class or custom property exists.

## 2026-08-14 — An unconsumed mockRejectedValueOnce fails the next test

> reflect · 2026-08-14 · memory:feedback_unconsumed_mock_once_cascades · tooling · applied · seen 1

**What happened.** In the invite page test a test queued `mockRejectedValueOnce`, then failed before the call it armed. The next test's first call rejected, and its assertion failed for an unrelated-looking reason. It looked like two bugs, or flakiness.
**Why.** `vi.clearAllMocks()` in `beforeEach` resets `mock.calls`, not queued one-time implementations, and a surviving `...Once` value beats the default the `beforeEach` sets.
**What changed.** Pitfall line: fix the earliest failure first and recount; run the file alone before calling it pollution (this one failed standalone); `vi.resetAllMocks()` drains the queue. Fixing the first failure fixed both, 8 of 8.
