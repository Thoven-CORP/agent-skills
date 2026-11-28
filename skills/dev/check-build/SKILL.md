---
name: check-build
description: The builder's check loop. Use while building and before saying work is done, to pick the narrowest check, run lint and type-check on touched files, and run the tests a commit reaches once.
---

# Check build

The builder proves its change with the narrowest check that goes red when the change is wrong, plus lint and type-check on the files it touched (law, "Check once"). Wider suites run once, when the branch lands. The repo's `TESTING.md` owns the commands; this file owns the order.

## Pitfalls

- Save the `Randomized with seed` line and the failure message from a spec's first failing run, and rerun that seed before calling it a flake. Keep batch output whole, since a filter that drops the seed loses the repro. (2026-11-18)
- Prove a failure was already on `main` without touching the shared tree: `git show origin/main:<file> | bin/rubocop --stdin <file>` for lint, a detached worktree for specs, because overwriting a file to see the base can eat another session's edit. (2026-11-18)
- A fix justified by one browser's behaviour is proven in that browser, or the commit names the browser the proof ran in. (LEARNINGS 2026-08-08)
- Measure layout with `agent-browser` at the persona's viewport, and name that viewport in the report. (LEARNINGS 2026-08-22)

## 1. Build the loop first

Before the edit, name the one command that goes red when the work is wrong: a test at the seam the change touches, a curl against the local backend, a script. Run it once and see it red (or see it pass on the base, for a refactor).

**Done when:** the command and its first output are in your notes.

## 2. Lint and type-check the touched files

Run the changed-file lint and type-check rows of the repo's `TESTING.md`. Whole-repo lint is CI's.

**Done when:** both pass, or each offense is fixed.

## 3. Prove it, red then green

Run the loop from step 1 after the change. A test proof was red before the change and is green after; a test that never went red proves the mock, not the fix. Writing that test follows `write-tests`.

**Done when:** the loop is green and you have its red run.

## 4. Run what the commit reaches, once

Commit, then run `scripts/thoven-check` (in this skill's folder) from the repo root. It picks the tests the commit's diff reaches (frontend `vitest related`, backend `bin/verify --print-draft-specs`), runs them once, and saves the result under the commit's SHA. Run again on the same SHA, it prints the saved result instead of rerunning. It runs only what the diff reaches, so it runs where you are; when the diff touches a shared module and the run pulls most of the suite, stop it and run it on the mini (`run-on-mini`).

The first failure is a finding: fix its cause or raise it by name (law, "Check once").

**Done when:** `thoven-check` printed `THOVEN_CHECK pass` for HEAD, or each failure is fixed or raised.

## 5. Report

Paste each command, its host and its result line, and name what you did not run.

**Done when:** every command has its host and result line, and every check you skipped is named. Then stop.

## When the branch lands

Once per branch, before its PR into `main`, follow [references/branch-lands.md](references/branch-lands.md).

## Disk

Before a temporary checkout, dependency install, build or capture, read [references/disk-budget.md](references/disk-budget.md).
