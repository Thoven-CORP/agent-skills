# Review quality

This skill scores the review, not the factory.

## Finding vs proof

| Reviewer said | Required proof |
|---|---|
| CRITICAL | Failing test or recorded UI repro on pre-fix. Same check green on fix. |
| IMPORTANT | Same as CRITICAL. |
| Suggestion or nit | No new test required. Must not block merge. |
| "Looks fine" | Still need the guarantee check red-then-green. |

A finding that does not mention a file, a user path, or a failing check is a note. Do not treat it as CRITICAL.

## Planted-bug sample

Once per batch of loop PRs, or after every tenth ticket (scorecard owns the cadence).

1. Copy the PR branch to a scratch worktree.
2. Insert one known bug the original review should have caught.
3. Hand that scratch to a fresh reviewer prompt.
4. Score hit (they named the planted bug) or miss.
5. Delete the scratch. Never push it.

[mutation-sample.sh](../scripts/mutation-sample.sh) starts step 1 and 2. It does not send the reviewer prompt.
