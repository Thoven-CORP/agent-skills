---
name: factory-classify
description: Use at factory station 2 when a new issue lands in DEP or THV Triage, to give it exactly one verdict (bug, Sentry noise, tracking gap or idea) or stop with a note. Not for fixing, reproducing or prioritizing the issue.
---

# Factory classify

The verdicts, examples and stop rule are in `references/classify-rubric.md`. Read it before classifying. It follows the benny triage rule from pstack: one verdict or stop, never a guess.

## Steps

1. Read the issue in full with Linear `get_issue`, including its evidence link.
2. Check each verdict's definition in the rubric against what the issue shows. Use only what the issue and its evidence show. Do not infer facts that are not written down.
3. If exactly one verdict fits, record it with a one-sentence reason that quotes the issue.
4. If none fits, or two fit equally, stop. Record which verdicts were considered and what evidence is missing.
5. Act on the verdict only when Andres has approved Linear writes for this run. A bug moves from Triage to Backlog with the Fix loop label. Other verdicts are closed or routed as the rubric says. A stop leaves the issue in Triage with the note. Without approval, write the proposed move to evidence and change nothing.
6. Log the verdict and date in `evidence/` so classify accuracy can be scored against Andres's decision card (station 5).
7. Confirm this run's classify artifact with thoven-verify. For a bug verdict, also doctor staging before the issue enters the loop.

   ```bash
   ../thoven-verify/scripts/check-station-output.sh --kind classify --file evidence/<run>.md
   ../thoven-verify/scripts/doctor.sh --fe https://staging.thoven.co --be https://thoven-api-staging.onrender.com --out "$THOVEN_VERIFY_EVIDENCE_DIR"
   ```
