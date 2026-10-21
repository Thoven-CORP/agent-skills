---
name: factory-review
description: Review a factory loop PR for proof quality, merge risk, blast radius, security, and code quality. Use at station 7, for /factory-review, or when a factory batch PR is up and must not merge on vibe.
---

# Factory review

Station 7. Reviews the **PR**, then asks `thoven-factory-formal` whether those findings are proven. Does not merge.

## Invoke, in order

1. `skills/factory/thoven-factory-formal/SKILL.md` (guarantee, red-then-green, scope)
2. [references/merge-risk.md](references/merge-risk.md) (this folder. There is no standalone merge-risk skill.)
3. blast-radius (pstack)
4. `skills/dev/security-review/SKILL.md`
5. thermo-nuclear-code-quality-review (team-kit)
6. `thoven-verify` on staging or the preview for the user path the guarantee names

## Steps

1. Read the batch tickets, the decision card, and the diff.
2. Run each review above. Keep their reports in the evidence dir.
3. Check every CRITICAL or IMPORTANT finding against the formal proof. No failing test or repro means the finding is not done.
4. Write the review report from [references/report.md](references/report.md).
5. Verify the artifact.

```bash
scripts/check-review.sh --file "$THOVEN_VERIFY_EVIDENCE_DIR/review.md"
../thoven-verify/scripts/check-station-output.sh --kind review --file "$THOVEN_VERIFY_EVIDENCE_DIR/review.md"
```

Verdict is `ready`, `fix`, or `bounce`. Never auto-revert.
