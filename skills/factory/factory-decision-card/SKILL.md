---
name: factory-decision-card
description: Write the go / no-go card for a factory batch before a cloud-agent fix. Use at station 5, for /factory-decision-card, or when a reproduced batch still needs a dispatch decision.
---

# Factory decision card

Station 5. Decide whether station 6 may run. The card is the brief. No card, no dispatch.

## Steps

1. Read the batch tickets and the repro report.
2. Run `~/thoven/agent-skills/skills/factory/factory-rules/scripts/enforce.sh --ci-failures <n>` with current open and weekly counts.
3. Fill [references/card.md](references/card.md).
4. Decision is an explicit `Decision:` line: `go`, `bounce`, or `ask Andres`. The word go anywhere else does not count.
5. Verify the card.

```bash
scripts/check-card.sh --file "$THOVEN_VERIFY_EVIDENCE_DIR/card.md"
../thoven-verify/scripts/check-station-output.sh --kind card --file "$THOVEN_VERIFY_EVIDENCE_DIR/card.md"
```

`go` requires a reproduced path, a one-sentence guarantee, no forbidden area, and enforce.sh passing. `bounce` writes the reason back on every ticket in the batch. `ask Andres` is for S1 or a product call.
