---
name: thoven-factory-formal
description: Verify the quality of a factory REVIEW on one loop PR. Use at station 7, for /thoven-factory-formal, or when a reviewer finding needs a red-then-green proof. Does not judge the factory loop itself.
---

# Thoven factory formal

Station 7 companion. This skill asks whether the **review** earned its findings. It does not ask whether the factory process is healthy. That is the scorecard.

Write the report for Andres. He should trust the result without learning TLA+ or the test runner.

## When to run

- After `factory-review` finishes a loop PR.
- When a reviewer claims CRITICAL or IMPORTANT.
- When sampling whether reviewers catch planted bugs.

## Per loop PR

1. **State the guarantee** in one plain sentence. What the user can still do, or can no longer hit, after the fix.
2. **Show the check fails on pre-fix code.** Revert the fix on a scratch copy, or check out the merge-base, and run the same check. Paste the failure.
3. **Show the check passes on the fixed code.** Same command, same bound, current HEAD.
4. **Check each reviewer finding against that proof.** A finding that the proof does not speak to is a guess. Drop it or write a new check.
5. **CRITICAL and IMPORTANT require a failing test or a recorded repro.** No exception for "obvious" bugs.
6. **Honest scope.** Fill [references/scope.md](references/scope.md). A pass covers the model or the bound, not the whole product.

Tool choice lives in [references/property-tests.md](references/property-tests.md) and [references/tla.md](references/tla.md). TLA+ only when the property is about event orderings. Everything else is a property test or a bounded test on the real code. Finding grades live in [references/review-quality.md](references/review-quality.md).

```bash
scripts/run-check.sh --pre-fix <rev> --fix <rev> --cmd "<check>"
```

## Reviewer sample

On a sample of loop PRs, plant a known bug in a scratch copy and measure whether the reviewer names it.

```bash
scripts/mutation-sample.sh --pr <url> --bug-file <path> --note "<what the reviewer must catch>"
```

Record hit or miss in the evidence dir. Do not merge the planted bug.

## Output

Write `formal.md` in the run's evidence dir, then

```bash
../thoven-verify/scripts/check-station-output.sh --kind formal --file "$THOVEN_VERIFY_EVIDENCE_DIR/formal.md"
```

Required headings. Guarantee. Fails on pre-fix. Passes on fix. Findings. Scope.

## Helpers

| Script | Job |
|---|---|
| `scripts/run-check.sh` | Run one check on pre-fix and fix refs. |
| `scripts/mutation-sample.sh` | Plant a known bug on a scratch copy. |
