---
name: factory-rules
description: Enforce factory loop caps and the forbidden-area list before opening or pushing a batch PR. Use for /factory-rules, "can I open another loop PR", or when a factory fix is about to touch migrations, auth, billing, or mailers.
---

# Factory rules

Caps come from `origin/main:skills/factory/factory-rules/RULES.md` in the agent-skills repo. A checkout copy is not enough.

```bash
~/thoven/agent-skills/skills/factory/factory-rules/scripts/enforce.sh --repo <product-repo> --base origin/main --ci-failures <n>
```

Exit 0 only when every check passes. Print every violation. Do not auto-fix a forbidden path by reverting.

## What the script checks

- Open loop PR count vs `open_pr_cap`
- Loop PRs opened in the last 7 days vs `weekly_pr_cap`
- This batch PR's changed lines vs `max_lines`
- This batch PR's changed files vs `max_files`
- Diff paths against the forbidden-area list
- CI failure count on this PR vs `ci_failure_stop`
- `claim_lock_hours` (default 24) for factory-claim stale locks
- Loop-eval caps: `replay_min_tickets=10`, `live_score_pct=25`, plus **PENDING ANDRES** `station_fail_k`, `monthly_eval_budget`, and judge-family blindness

It does not check file overlap between open PRs. Merge conflicts are handled at merge time.

## Station output

Write the script stdout into the verify evidence dir, then run the thoven-verify doctor on the target the batch names. A rules fail is a failed station.

## Helpers

| Script | Job |
|---|---|
| `scripts/parse-caps.py` | Read the `caps` block from RULES.md. |
| `scripts/enforce.sh` | Apply caps and forbidden paths to a repo. |
| `scripts/test-enforce.sh` | Fixture checks for parser and forbidden paths. |
