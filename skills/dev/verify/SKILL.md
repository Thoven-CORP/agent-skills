---
name: verify
description: Use while building and before claiming done. The builder's checks are each exit line's proof, run once, plus lint and type-check on the files it touched; wider suites run when the branch lands.
---

# Verify

Done is every exit line on the ticket shown true on the build (workspace `WORKFLOW.md`, "Exit criteria"). The builder shows it with each exit line's proof, run once, plus lint and type-check on the files it touched. Wider suites run when the branch lands, or when Andres dispatches them. This file is the one home of that cadence; every other file that names it points here.

## Pitfalls

- For a copy or small UI change, test only the changed components with DOM assertions, curl the local backend for any API-backed claim, and add a `/thoven-designer` sweep of the surface. (LEARNINGS 2026-09-23)
- Verify a fix justified by one browser's behaviour in that browser, or name in the commit which browser the proof ran in. (LEARNINGS 2026-08-08)
- Measure layout geometry from a headless Playwright script; when a visible browser is needed, restore its viewport in the same turn, and never report a measurement viewport as the user's screen. (LEARNINGS 2026-08-22)

## Verification disk budget

Apply before baseline/treatment captures, temporary checkouts, dependency installs or builds, including delegated checks.

- Pick the smallest check that answers the claim. Reuse revision-matched CI evidence when it proves the same claim. A generated plan does not authorize extra local production builds: those need an explicit user request or the parent-level full-verify allowance below. Repeat builds only when the measured claim requires repetition, with a stated sample count and reason.
- Before allocating, read free disk space on the execution host and estimate the additional peak from checkouts, dependencies, caches and captures together. State the temporary paths, estimated peak and per-run disk budget in the existing brief or reply. Leave at least 5 GB free after that estimate, or the host profile's `minDiskFreeGiB` when it is higher. If the estimate is unknown or does not fit, use CI or an already authorized remote host, or report the check blocked. On a host whose profile sets `minDiskFreeGiB` (the mini's is 15), the load gate also refuses below that free disk; that floor does not replace this estimate.
- Keep disposable runtime files in a separately named, task-owned scratch directory outside retained evidence. Prefer an existing safe checkout or read-only Git inspection; create a temporary worktree only when executing a separate revision is necessary. Compare revisions serially where possible. Recheck disk space and scratch size between phases and repeats; stop starting work that would exceed the budget or reserve.
- Retain revisions, commands, verdicts, relevant failure and success logs, and selected screenshots or recordings. Reuse captures. Save full traces, heap dumps and other large diagnostics only for a named unresolved claim, accounting for their size in the budget. Keep useful evidence until the user has seen it.
- On success, failure or cancellation, stop your own processes and remove owned temporary checkouts, dependencies and build caches, including ordinary `.next/cache`. Inspect dirty and untracked paths, preserve needed probes and evidence, then use normal `git worktree remove` for temporary worktrees. Never force removal or delete shared, unpushed or unowned work. After interruption, the resuming parent completes cleanup before allocating again. Report retained evidence size and any leftover scratch with its owner and reason. Scratch cleanup does not wait for feature merge or evidence review.

## The builder's checks

1. Lint and type-check on the files you touched: `pnpm run type-check` and oxlint on the changed files (whole-repo lint is CI's). Backend: `bin/rubocop -- <changed files>`.
2. Each exit line's proof, once: the check the line names after `Proof:`. A test proof is red before the change and green after.
3. Where a proof is the design capture, make it once, as frontend `TESTING.md` "Mini parity pilot" runs it, since CI has none (frontend #575). What it covers and how it is judged: the law's Design parity.
4. Paste each proof and check in the one report: the command, its host and its pass line. A failure is fixed or raised to the user by name, never described away.

A commit that stages a component, route, stylesheet, token module or scan baseline runs the design scans itself (frontend `lefthook.yml`, `design-rules`). A scan that refuses a value the Paper frame shows is handled as the law's Design parity says ("The design system is reference, not hard code").

## Wider runs: when the branch lands, or when Andres dispatches them

5. Callers: the direct importers' test files once, by path (`pnpm exec vitest run <files>`). Never `vitest related` on a source file: it follows every import, and a shared component pulls most of the suite. Backend: the mapped specs plus the request spec of any controller touched. When the diff changes copy a user reads, `rg` the old sentence across `spec/` and `__tests__/` in both repos and run every file it hits; a reworded email broke three specs the mapping did not select (2026-11-05).
6. **On an integration branch, try one case the ticket did not name.** Run it on the route a user reaches, or against the running API. Pick an empty state, a wrong id, an expired record, the other audience, or a refused action. The file's own test, typecheck, lint, a design scan, and a reading of the diff do not count. Use `qa-flow` when the case needs the whole path. The report names the case and what happened. If the run did not happen, the report says the behaviour check did not run.
7. `bin/verify --base <integration branch>` runs only when the user asks for it, or once at the parent, before the integration branch's PR into `main`. Mutation runs on GitHub, on PRs into `main` that change logic; locally `--mutation` runs only when the user asks for it. On the mini, `bin/verify` takes its own load-gate slot from `~/.config/thoven/host.json`, so run it as is and do not wrap it in `thoven-load-gate` yourself. From the MacBook, `remote-verify --base <integration branch>` (in `enforcement/bin`) is the only way to run `bin/verify`: it runs the same verify on the mini for HEAD plus your uncommitted and untracked files, and needs HEAD pushed. The Bash guard denies a local `bin/verify` on a host whose profile says `laptop`; when the mini is unreachable, report verify blocked. Paste its `THOVEN_VERIFY` block verbatim, `THOVEN_VERIFY_BEGIN` through `THOVEN_VERIFY_END`. `concurrency: 1` in the block means the machine was busy. A FAIL row is fixed or raised to the user by name.
8. Nothing reruns on push or after a fix round: a fix round runs the proofs of the findings it fixes. What CI runs, and when: `TESTING.md`, "What CI runs". The local checks before `gh pr merge --auto`: `enforcement/rules/branches-and-prs.md`.

## Keep it honest, once a sprint

Run `/maintain-verification-skill` against this file: time each check on this machine, list the defect classes that slipped since the last pass (review findings, Andres's corrections), and move checks between the builder's checks and the wider runs by those numbers. Under 10 s moves into the builder's checks; a check that caught nothing in a sprint moves out to the wider runs. Last measured 2026-10-20 (`audits/2026-10-18-skill-retro/before-after.html`).
