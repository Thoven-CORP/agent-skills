---
name: prove-claim
description: "Prove or disprove one claim with baseline and treatment evidence, returning VERIFIED, NOT VERIFIED or INCONCLUSIVE. Use when asked to verify, prove it works or show the evidence, when a fix needs a before-and-after repro, or when a UI, API, performance or memory claim needs measuring."
---

# Prove claim

`check-build` is the builder's loop on its own change. `prove-claim` falsifies one specific claim with baseline and treatment evidence and returns one verdict.

## Workflow

1. Restate the claim in falsifiable form: condition, metric and threshold. A vague claim ("the code is cleaner") goes back to the asker for a measurable one. Done when those three are written.

2. Classify the surface.

   ```bash
   classify ~/thoven/agent-skills/evals/schemas/evidence.json
   ```

   stdin is the falsifiable claim plus the files that changed. Done when a JSON record is in context.

   If `status` is `answered` and `answers.evidence.binding` is true, that value is the surface. Open it and skip the rest of this step.

   - `type_check` or `unit_test` → code behavior (type-check, a focused test, or a minimal repro)
   - `browser_screenshot` or `recording` → UI behavior (one frame, or a sequence)
   - `none` → no local surface. State what changed and why no check covers it. Skip to the verdict as `INCONCLUSIVE` only if a check was required.

   If `status` is `undecided` or binding is false, read [references/fallback-surfaces.md](references/fallback-surfaces.md) and pick from that list.

3. Read [references/artifacts.md](references/artifacts.md) for where evidence and scratch go. Capture a baseline from the old state. Merge base, parent commit, failing branch, or current broken repro. Take it from a detached copy (`git archive <base> | tar -x -C <scratch>/base-<sha>`), never by restoring tracked files in a tree that holds uncommitted work: a killed run would leave the only copy of the treatment in scratch, and sibling sessions would see the old code. Copy the spec files in, and export the pane's own database variables, since the archive has no `.env`. A spec for code that does not exist on the base aborts the whole run on load, so run it alone or drop it from the baseline set, and delete the copy by exact path afterwards. Done when the baseline artifact exists.

4. Capture treatment from the changed state with the same command, data, warmup, and environment. Done when the treatment artifact exists.

5. Compare raw artifacts. Numbers, screenshots, terminal transcripts, HTTP responses, profiles, heap snapshots, or test output. Done when the delta is written.

6. Return exactly one verdict. `VERIFIED`, `NOT VERIFIED`, or `INCONCLUSIVE`. Done when the output block below is complete.

## Verdict rules

- `VERIFIED`. Baseline and treatment differ in the predicted direction, by the claimed threshold, and nothing but the change differs between the runs (command, data, warmup, environment).
- `NOT VERIFIED`. The behavior is unchanged, moves the wrong way, or misses the threshold.
- `INCONCLUSIVE`. No valid baseline, noisy signal, failed measurement, or an environment difference invalidates the comparison.

## Output

```text
VERIFIED | NOT VERIFIED | INCONCLUSIVE
Claim: <falsifiable claim>

Evidence:
<metric/artifact>: baseline=<...>, treatment=<...>, delta=<...>, threshold=<...>

Reasoning:
<one tight paragraph naming the evidence and any confounds>
```

Report `NOT VERIFIED` plainly; it is a useful result.
