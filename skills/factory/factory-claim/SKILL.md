---
name: factory-claim
description: Claim or resolve a Sentry issue in org thoven-gy after a factory fix is verified. Use for /factory-claim, "claim this Sentry", or when a loop PR is ready and the originating issue is still unowned.
---

# Factory claim

Claim the Sentry issue that started the batch, after station 7 said `ready`. Org is `thoven-gy`.

## Steps

1. Confirm the review verdict is ready and thoven-verify evidence exists.
2. Resolve the issue id from the ticket's Evidence field.
3. In Sentry org `thoven-gy`, assign the issue to the factory owner and mark it resolved against the frontend and API shas in the evidence dir.
4. Write the claim record from [references/claim.md](references/claim.md).
5. Comment the Sentry link and shas on every ticket in the batch.

```bash
scripts/check-claim.sh --file "$THOVEN_VERIFY_EVIDENCE_DIR/claim.md"
../thoven-verify/scripts/check-station-output.sh --kind claim --file "$THOVEN_VERIFY_EVIDENCE_DIR/claim.md"
```

Do not create a Sentry issue. Do not resolve without a sha. Do not touch production to "confirm" the claim.
