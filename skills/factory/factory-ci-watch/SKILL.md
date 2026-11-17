---
name: factory-ci-watch
description: Use at factory station 9 while a small-fix loop PR is open, to read its CI, classify each failure, decide whether one rerun of failed jobs is allowed, and know when to stop and report to Andres. Not for fixing code, reverting, or commenting on PRs.
---

# Factory CI watch

The full rules are in `references/ci-watch-rules.md`. Read them before acting. They follow the Open SWE baby-sit CI pattern summarized in the factory-research note (path outside this repo). For general PR babysitting, see the Babysit playbook in poteto-mode. This skill is the narrower loop version.

## Steps

1. Read the PR's current head SHA with cursor-github `get_pull_request`.
2. Read the check runs for exactly that SHA with `list_check_runs_for_ref`. Ignore results for older SHAs. If any required check is still running, wait and read again.
3. For each failed job, read its log with `get_job_logs` and give it one class from the rules table: deterministic, flaky, ambiguous or external. Write the log line that proves the class.
4. Apply the rerun rule. A rerun is allowed only for a flaky failure with written evidence, only for the failed jobs, and only once per head SHA. QA has no GitHub write access today, so QA asks Andres to press "Re-run failed jobs" and states the evidence.
5. Count real failures. After the second real failure on the PR, stop the loop for that ticket and report to Andres in the format in the rules. Never revert, close or force push.
6. Save the walk under `evidence/` with the PR number and date.
7. Confirm this run's CI-watch artifact with thoven-verify once CI is green, before the merge decision.

   ```bash
   ../thoven-verify/scripts/check-station-output.sh --kind ci-watch --file evidence/<pr-date>.md
   ../thoven-verify/scripts/doctor.sh --fe "$FE_URL" --be "$BE_URL" --out "$THOVEN_VERIFY_EVIDENCE_DIR"
   ```
