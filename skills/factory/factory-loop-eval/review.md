# Adversarial review: factory-loop-eval (DEP-11)

Method: one-reviewer pass against the DEP-11 acceptance criteria before commit. No second model family was available for the review itself.

## Intent

A replay eval that starts only after 10 real tickets, checks out the parent of each fix, passes only on the hidden test, scores 25% of live runs with a blinded other-family judge, stays under a monthly budget, and opens a draft improvement PR after K station failures.

## Act on (fixed)

1. `replay-case.sh` could run with zero tickets. It now requires `gate.sh` / `run-eval.sh` (`FACTORY_EVAL_GATED=1`) or an explicit `--allow-ungated` for fixtures.
2. Hidden-command exit 127/126 was treated as `hidden: fail` and could have counted toward K. It is now an invalid run (exit 2), not a scored miss.

## Consider (not changed)

`should-score.sh` is about 25% (23 of 100 in the fixture), not exactly 25. Good enough for a hash sample. Andres can change `live_score_pct`.

Judge family pairing is **PENDING ANDRES** (open decision 3). The script only enforces "different family" and "no config id".

## Noted

No live ledger of 10 real factory tickets exists in this repo yet. The gate will hold until that ledger exists. That is correct, not a skip.

`station_fail_k=3` and `monthly_eval_budget=20` are placeholders marked **PENDING ANDRES**.

## Dismissed

Building DEP-10 baseline metrics in this skill. QA / Deployment Guy owns DEP-10. Dropped.

Calling a real second-family judge from this repo. The harness records families and blinds the prompt. Invoking the judge is an agent step, not a script step.
