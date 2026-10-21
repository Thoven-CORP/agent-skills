---
name: factory-claim
description: Claim or resolve a Sentry issue in org thoven-gy after a factory fix is verified live in prod. Use for /factory-claim, "claim this Sentry", or when a loop PR is ready and the originating issue is still unowned.
---

# Factory claim

Claim the Sentry issue that started the batch, after station 7 said `ready` and a prod version-read proves the fix is live. Org is `thoven-gy`. Resolve needs Andres's approval.

## Steps

1. Confirm the review verdict is ready and thoven-verify evidence exists.
2. Resolve the issue id from the ticket's Evidence field.
3. Run `factory-version-read` against **prod**. Do not resolve on a staging-only read. The claim record's Prod version field must contain `RESULT: PASS`.
4. Get Andres's approval to resolve. Write it in the Approval field. Do not resolve without it.
5. Take the claim lock so two bots cannot grab the same alert:

   ```bash
   scripts/claim-lock.sh --issue <id> --actor <bot-or-owner>
   ```

   The lock is assign-if-unassigned plus a `factory-claim-lock:<actor>` comment. Fail if the issue is already assigned or already locked by someone else.
6. Only after prod PASS, Andres approval, and the lock, assign (if the lock did not) and mark the issue resolved against the frontend and API shas.
7. Write the claim record from [references/claim.md](references/claim.md).
8. Comment the Sentry link and shas on every ticket in the batch.

```bash
scripts/check-claim.sh --file "$THOVEN_VERIFY_EVIDENCE_DIR/claim.md"
../thoven-verify/scripts/check-station-output.sh --kind claim --file "$THOVEN_VERIFY_EVIDENCE_DIR/claim.md"
```

Do not create a Sentry issue. Do not resolve without a sha. Do not resolve without a prod version-read PASS. Do not resolve without Andres's approval. Do not touch production to "confirm" the claim.

## Helpers

| Script | Job |
|---|---|
| `scripts/claim-lock.sh` | assign-if-unassigned plus `factory-claim-lock` comment. |
| `scripts/check-claim.sh` | Require prod PASS, Andres approval, and the lock. |
