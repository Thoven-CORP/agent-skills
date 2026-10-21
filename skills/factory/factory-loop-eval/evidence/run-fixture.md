# factory-loop-eval fixture evidence

Date: 2026-10-21
Kind: fixture. Not a live 10-ticket ledger.

## Gate
9 real + 5 synthetic: held (need 10, have 9).
10 real: gate open.
`run-eval.sh --min 99`: held.

## Cases
Parent of fix checked out in a scratch worktree.
Hidden test without candidate patch: fail.
Hidden test after applying the fix patch: pass.
Product HEAD restored.
Replay without gate: refused.
Hidden exit 127: invalid, not a scored miss.

## Judge
Same family refused.
anthropic runner / openai judge accepted.
Config id in the prompt refused.
status: PENDING ANDRES open decision 3

## Live sample
pct: 25
scored: 23 / 100 ids in the fixture hash

## Budget
used 20 + 1 vs cap 20: fail closed.
used 19 + 1 vs cap 20: pass.
status: PENDING ANDRES open decision 6

## Improve
2 / 3 failures: no PR.
3 / 3 failures: draft PR for Andres, do not merge.
--merge yes: refused.
status: PENDING ANDRES open decision 4

## Verdict
held on live data (no 10-ticket ledger). Fixture scripts pass.
