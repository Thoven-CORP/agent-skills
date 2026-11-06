---
name: verify
description: Use while building and before claiming done. Verify the change you made, when you made it, with the smallest check that can fail it. Selects checks by what the diff touches; runs other people's tests once, not per hunk.
---

# Verify

Shape of the check follows the shape of the change. Lint on the changed files and a cached typecheck are seconds; other people's tests are not. The design scans are the check most often missed, so they run on any component diff.

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

## While editing

1. `pnpm run type-check` and oxlint on your changed files (whole-repo lint is CI's). Backend: `bin/rubocop -- <changed files>`.
2. The file's own test, red before the change and green after, on the behaviour the ticket names. Backend: the mapped spec file, plus the request spec of any controller touched.
3. A component, token module or `globals.css` touched: `pnpm exec vitest run __tests__/*-scan.test.ts __tests__/*-tokens.test.ts __tests__/ledge-sweep.test.ts __tests__/type-roles.test.ts __tests__/palette.test.ts` (9 s).

## Before DONE

4. Callers: `pnpm run type-check` green, and the direct importers' test files once, by path (`pnpm exec vitest run <files>`). Never `vitest related` on a source file: it follows every import, and a shared component pulls most of the suite. Backend: the mapped specs plus the request spec of any controller touched. When the diff changes copy a user reads, `rg` the old sentence across `spec/` and `__tests__/` in both repos and run every file it hits; a reworded email broke three specs the mapping did not select (2026-11-05).
5. A UI ticket on a surface with a board frame: run the parity capture yourself before DONE, since CI has had no Parity check since frontend #575. Follow frontend `TESTING.md`, "Verification gates", **Mini parity pilot**: `parity-run.mjs --print-prefixes --base <PR base>` lists the touched prefixes, then the capture runs behind `thoven-load-gate`. Cover every surface the ticket names, sibling rows included, and add a named prefix the diff did not touch. The runner shoots each state at its board frame's width and at 390. Open `grid.html`, fix each difference, and put the grid in the DONE report. Each state in `scripts/verify/parity-surfaces.json` names its board frame `file` and that frame's desktop `width`; a state with no frame or no width is refused. 390 is shot for every state whether or not the board has a phone frame, since it checks mobile compatibility on surfaces never designed for phones, parent screens most of all. An unmapped surface gets a 390 capture of the commit before your change, kept beside the after capture; then add the spec and its frames with their widths before DONE, or say SKIPPED and why. `bin/verify --full` runs the same capture, only when the user asks.
6. Paste each command you ran and its pass line in the DONE report. That is the evidence. A failure is fixed or raised to the user by name, never described away. Builds, the whole suite, e2e suites and repeat sweeps belong in CI; the explicit local exceptions above and below must also satisfy the verification disk budget.

## Full verify: on request or at the parent

7. `bin/verify --base <integration branch>` runs only when the user asks for it, or once at the parent, before the integration branch's PR into `main`. Mutation runs on GitHub, on PRs into `main` that change logic; locally `--mutation` runs only when the user asks for it. On the mini, `bin/verify` takes its own load-gate slot from `~/.config/thoven/host.json`, so run it as is and do not wrap it in `thoven-load-gate` yourself. From the MacBook, `remote-verify --base <integration branch>` (in `enforcement/bin`) is the only way to run `bin/verify`: it runs the same verify on the mini for HEAD plus your uncommitted and untracked files, and needs HEAD pushed. The Bash guard denies a local `bin/verify` on a host whose profile says `laptop`; when the mini is unreachable, report verify blocked. Paste its `THOVEN_VERIFY` block verbatim, `THOVEN_VERIFY_BEGIN` through `THOVEN_VERIFY_END`. `concurrency: 1` in the block means the machine was busy. A FAIL row is fixed or raised to the user by name.

## Before merge

8. CI runs the affected tests on a PR into an integration branch and the full suite on a PR into `main`. Nothing reruns on push or after a fix round: a fix round runs the test files covering what it changed.

## Keep it honest, once a sprint

Run `/maintain-verification-skill` against this file: time each check on this machine, list the defect classes that slipped since the last pass (review findings, Andres's corrections), and move checks between the while-editing and before-DONE tiers by those numbers. Under 10 s moves into editing; a check that caught nothing in a sprint moves out of before-DONE. Last measured 2026-10-20 (`audits/2026-10-18-skill-retro/before-after.html`).

## Shared with andres-mode ("Check your own work")

Spec line per behaviour, real route at the frame's width and 390 beside the frame, shared components and tokens, show before asking. That list is the reviewer's first two sections too.
