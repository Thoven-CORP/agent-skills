# Adversarial review: factory-ci-watch

Method: I ran the interrogate skill's steps myself as the single reviewer. This run has no Task tool, so the two-model reviewer panel (Reviewer A and Reviewer B) could not be spawned. Treat these findings as one reviewer's view, not a cross-model agreement.

## Intent

Exact rules for station 9 so QA confirms failures on the current head, classifies each one, reruns only proven flaky failed jobs once, and stops after 2 real failures without reverting.

## Act on (fixed)

1. The draft said QA "may rerun failed jobs." A rerun is a GitHub write, and QA's profile forbids GitHub writes. Fixed. A rerun is now a request to Andres with the evidence attached.
2. The draft let an External failure be rerun once. DEP-5 says to rerun only with evidence a failure is flaky. Fixed. External failures are reported, never rerun by the loop.
3. The flaky evidence rule was loose ("passed on main or on this PR at an earlier run"). The real walk on PR #323 showed why that matters, because a timeout in an untouched file looked flaky with no passing run to compare. Fixed. Flaky now needs three things: the PR does not touch the test, the test passed on a same-day main run, and the log shows a timing symptom. The walk classes that case as ambiguous.

## Consider (not changed)

Reading every job log is slow on large runs (each vitest log was about 410 KB). A later version could pull only the lines after the first FAIL.

## Noted

The PR #323 walk is a replay of a merged PR, not a live watch. The first live loop PR will be the real test.

## Dismissed

Letting the cloud agent push one fix after the first real failure. That matches the loop rule "if CI fails twice, I stop", so it stays.
