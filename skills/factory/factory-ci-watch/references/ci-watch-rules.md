# Station 9: CI watch rules (draft for DEP-5)

Status: draft. This file is meant to become the ci-watch playbook in the factory folder (DEP-2 chooses where that folder lives). Source: the DEP-5 acceptance criteria, factory map station 9, and the Open SWE baby-sit CI pattern in /workspace/ship-log/deployment-guy/factory-research.md.

## Scope

These rules apply to one loop PR at a time, from the moment its draft PR opens until CI is green or the loop stops. QA only reads CI. QA has no GitHub write access, so any rerun allowed under Rule 3 is a request to Andres to press "Re-run failed jobs", with the evidence attached. QA never pushes, reverts, comments on the PR, or edits code.

## Rule 1: Confirm the failure on the current head commit

1. Before acting on any failure, read the PR's current head SHA.
2. Act only on check runs whose head SHA equals that current head SHA.
3. A failure on an older commit is ignored, because a later push may already have fixed it.
4. If checks for the current head are still running, wait and read again. Do not act on a partial result.

## Rule 2: Classify every failure

Each failed job gets exactly one class, written down with the log line that proves it.

| Class | Definition | Evidence needed |
|---|---|---|
| Deterministic | The failure is caused by the change. It would fail again on rerun. | A failing assertion, type error, lint error or build error in code the PR touches, or a test the PR adds or changes. |
| Flaky | The failure is not caused by the change and passes on the same commit at other times. | The PR does not touch the failing test or the code it covers (list_pull_request_files), the same test passed on a main run from the same day (list_workflow_runs on main, then list_workflow_run_jobs), and the log shows a timing, ordering, retry or timeout symptom rather than a wrong value. All three are required. |
| Ambiguous | QA cannot tell from the logs whether the change caused it. | No clear evidence for either class above. |
| External | A service outside the repo failed. | The log shows a registry, network, GitHub Actions runner, rate limit or third party outage error before any test ran. |

## Rule 3: Rerun only failed jobs, once, and only with evidence of flakiness

1. Rerun only when the class is Flaky and the evidence is written down.
2. Rerun only the failed jobs, never the full workflow.
3. Rerun at most once per head commit.
4. Never rerun a Deterministic, Ambiguous or External failure. An External failure is reported to Andres with the outside error line, and Andres decides what happens next.
5. If the rerun fails again, the failure is treated as real.

## Rule 4: Stop after 2 real failures and never revert

1. A real failure is a Deterministic failure, an Ambiguous failure, or a Flaky failure whose rerun also failed.
2. After the first real failure, the cloud agent may push one fix to the same draft PR, and the watch starts again from Rule 1.
3. After the second real failure on the same PR, QA stops the loop for that ticket and reports to Andres with: the PR link, the head SHA, each failed job name, its class, and the log lines used as evidence.
4. QA never reverts a commit, closes the PR or force pushes. Any of those is Andres's call.

## Rule 5: Where these rules live

These rules live in the ci-watch playbook in the factory folder, read from the default branch so a loop PR cannot change its own CI rules (the RULES.md pattern from DEP-1). Until DEP-2 creates that folder, the rules live at /workspace/thoven/factory/skills/factory-ci-watch/references/ci-watch-rules.md.

## Report format to Andres

Each report states the PR, the head SHA, the result (green, stopped, or waiting), and for each failure its class and evidence. Each report also states what QA did and what QA did not do.
