---
name: factory-loop-eval
description: Replay past fixed factory bugs to see if a loop change helped. Use after 10 real tickets, for /factory-loop-eval, DEP-11, or when the Friday scorecard says a replay is due. Does not merge improvement PRs.
---

# Factory loop eval

DEP-11. Replay past fixed Thoven bugs and score whether the current factory config still finds them. Starts only after 10 real loop tickets. The hidden repro or test is the pass. A judge from a different model family may score a sample, blinded to which config ran.

Open decisions stay in `factory-rules/RULES.md` and are **PENDING ANDRES**: judge family (decision 3), K station failures (decision 4), monthly eval budget (decision 6).

## When to run

- After the closed-loop ledger has at least `replay_min_tickets` (10) **real** tickets.
- When Friday scorecard Replay says due.
- After a factory-rules or station skill change that claims the loop got better.

Do not run on planted or synthetic tickets. Do not replay production data.

## Steps

1. Load caps from `origin/main` RULES.md (`replay_min_tickets`, `live_score_pct`, `station_fail_k`, `monthly_eval_budget`). Honor PENDING ANDRES. Do not raise them.
2. Count real tickets in the ledger. If below the gate, write `held` and stop.

   ```bash
   scripts/gate.sh --ledger <tickets.jsonl>
   ```

3. Check the monthly budget before each case. Stop when the cap is reached.

   ```bash
   scripts/budget.sh --spend <spend.json> --cap <monthly_eval_budget>
   ```

4. For each replay case, check out the **parent of the fix** in a scratch worktree. Use the ticket text as the prompt. Apply only what the fresh agent produced. Pass if the hidden repro or test exits 0.

   ```bash
   scripts/run-eval.sh --ledger <tickets.jsonl> --repo <product> --fix-ref <sha> --ticket <ticket.md> --hidden-cmd '<test>' --spend <spend.json>
   ```

   `replay-case.sh` is the primitive. Do not call it on a live ledger without `run-eval.sh` or `gate.sh` first.

5. Score `live_score_pct` (25) of live runs with [references/rubric.md](references/rubric.md). The judge model must be a different family from the runner and must not see the config id.

   ```bash
   scripts/should-score.sh --id <ticket-id> --pct 25
   scripts/judge-blind.sh --runner-family <fam> --judge-family <fam> --prompt <file>
   ```

6. If one station has `station_fail_k` scored failures, open a **draft** factory improvement PR for Andres. Do not mark ready. Do not merge.

   ```bash
   scripts/improve-pr.sh --station <name> --failures <n> --k <station_fail_k>
   ```

7. Write the eval record from [references/eval.md](references/eval.md) and check it.

   ```bash
   scripts/check-eval.sh --file "$THOVEN_VERIFY_EVIDENCE_DIR/loop-eval.md"
   ../thoven-verify/scripts/check-station-output.sh --kind loop-eval --file "$THOVEN_VERIFY_EVIDENCE_DIR/loop-eval.md"
   ```

## Helpers

| Script | Job |
|---|---|
| `scripts/gate.sh` | Refuse unless enough real tickets. |
| `scripts/replay-case.sh` | Parent-of-fix scratch replay. Hidden test is the pass. |
| `scripts/should-score.sh` | Pick the 25% live sample. |
| `scripts/judge-blind.sh` | Different family, no config id in the prompt. |
| `scripts/budget.sh` | Monthly run cap, fail closed. |
| `scripts/improve-pr.sh` | K failures means draft PR only. |
| `scripts/check-eval.sh` | Artifact headings and gates. |
