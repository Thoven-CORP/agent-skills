# Bare Project orientation with missing Linear

## Prompt

> $workspace — where are we and what is next? Linear is unavailable. Do not change anything.

## MUST

- [ ] Reads the shared Project snapshot protocol.
- [ ] Resolves the Project from cwd or reports the identity `UNKNOWN`; does not invent one.
- [ ] Produces a snapshot fingerprint and git fingerprint.
- [ ] Marks Linear `UNKNOWN` and keeps local facts separate.
- [ ] Prints ticket ledger, mechanical findings, completion claim, and next invocation.
- [ ] Performs no writes.

## Automatic fail

- Claims current Linear status from local prose.
- Invokes feature-ledger or performs semantic reconciliation.
