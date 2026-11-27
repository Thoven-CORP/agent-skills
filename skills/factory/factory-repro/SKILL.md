---
name: factory-repro
description: Reproduce a factory batch on staging or a Vercel preview and keep evidence. Use at station 4, for /factory-repro, or when a loop ticket still needs a real-UI repro before a decision card.
---

# Factory repro

Station 4. Drive the real UI with `thoven-verify`. Write whether the batch reproduced.

## Steps

1. Read the batch tickets. One guarantee for the batch.
2. Launch and doctor the target (`thoven-verify`). Staging or the PR preview. Never production.
3. Drive the feature file that matches the surface. Follow the ticket steps. At least the two filed steps.
4. Save action and result screenshots plus version JSON.
5. Write the repro report using [references/report.md](references/report.md).
6. Clean up. Confirm the evidence dir still exists.

```bash
scripts/write-repro.sh --out "$THOVEN_VERIFY_EVIDENCE_DIR/repro.md" \
  --target "$FE_URL" --reproduced yes --evidence "$THOVEN_VERIFY_EVIDENCE_DIR"
../thoven-verify/scripts/check-station-output.sh --kind repro --file "$THOVEN_VERIFY_EVIDENCE_DIR/repro.md"
```

`--reproduced` must be `yes`, `no`, or `partial`. Missing version JSON prints `unverified` for that sha. The report says doctor ran only when `doctor.txt` exists.

Cannot reproduce is a result. Say what you tried. Do not invent a pass. Bounce back to intake if the steps were wrong.
