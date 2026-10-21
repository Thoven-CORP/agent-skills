# Verify eval

Measures the frontend `bin/verify` engine and the verify skills, old against new.

- `bench.py <old-tree> <new-tree> <out.json>` runs planted diffs through both engines and records verdicts and per-row seconds. Give each tree its own `pnpm install`; never symlink node_modules.
- `grade_workflow.py <dir>` grades agent runs from `arms.json`, `timing.json` and `hidden/*.test.ts`: hidden tests, diff scope, and process read from the transcripts.
- `report.py <dir> <out.html>` builds the report page from `engine/results.json`, `workflow/grading.json`, `workflow/judge.json`, `ci/baseline.json` and `extra.json`.
- `../ci-runner-trial/ci_compare.py <out.json> label=run ...` compares GitHub Actions runs for job time, queue time, runner label and test-by-test agreement.

Put candidate worktrees under `~/thoven`, not the macOS temp folder: knip hangs in a git worktree under `$TMPDIR`.

First run: 2026-10-21, data and report in `~/.thoven-artifacts/evals/2026-10-21/`.
