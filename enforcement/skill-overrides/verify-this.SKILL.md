---
name: verify-this
description: "Verify a claim with fresh local evidence: restate it falsifiably, capture baseline and treatment, compare artifacts, and return VERIFIED, NOT VERIFIED, or INCONCLUSIVE."
---

# Verify This

Verification is not a recap. It proves or disproves a specific claim with repeatable evidence.

## When to use

- The user asks "verify this", "prove it works", "did this fix it", or "show me the evidence".
- A bug fix needs a before/after repro.
- A UI, CLI, API, performance, or memory claim needs measurement.
- A test passes but the user-visible behavior still needs confirmation.

Ask for a measurable claim first when the claim is vague ("the code is cleaner").

## Workflow

1. Restate the claim in falsifiable form. Condition, metric, and threshold. Done when those three are written.

2. Classify the surface.

   ```bash
   classify ~/thoven/agent-skills/evals/schemas/evidence.json
   ```

   stdin is the falsifiable claim plus the files that changed. Done when a JSON record is in context.

   If `status` is `answered` and `answers.evidence.binding` is true, that value is the surface. Open it and skip the rest of this step.

   - `type_check` or `unit_test` → code behavior (type-check, a focused test, or a minimal repro)
   - `browser_screenshot` or `recording` → UI behavior (one frame, or a sequence)
   - `none` → no local surface. State what changed and why no check covers it. Skip to the verdict as `INCONCLUSIVE` only if a check was required.

   If `status` is `undecided` or binding is false, read [Fallback surfaces](#fallback-surfaces) and pick from that list.

3. Capture a baseline from the old state. Merge base, parent commit, failing branch, or current broken repro. Done when the baseline artifact exists.

4. Capture treatment from the changed state with the same command, data, warmup, and environment. Done when the treatment artifact exists.

5. Compare raw artifacts. Numbers, screenshots, terminal transcripts, HTTP responses, profiles, heap snapshots, or test output. Done when the delta is written.

6. Return exactly one verdict. `VERIFIED`, `NOT VERIFIED`, or `INCONCLUSIVE`. Done when the output block below is complete.

## Artifact layout

When safe to write artifacts:

```text
/tmp/verify-this/<claim-slug>/
├── claim.md
├── timeline.md
├── baseline/
├── treatment/
├── diff/
└── verdict.md
```

If artifacts may contain sensitive code, prompts, screenshots, HTTP bodies, or heap data, keep only the minimal inline evidence unless the user agrees to disk storage.

## Verdict rules

- `VERIFIED`. Baseline and treatment differ in the predicted direction, by the claimed threshold, with no obvious confound.
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

Do not soften a negative result. A clear `NOT VERIFIED` is useful.

## Fallback surfaces

Read this section only when step 2 returned `undecided` or a non-binding answer. Pick the smallest surface that can disprove the claim.

- Code behavior. Focused unit or integration tests, or a minimal repro script.
- CLI/TUI behavior. `control-cli`, a terminal transcript, or a demo recording.
- UI behavior. `control-ui`, screenshots, accessibility snapshots, or browser traces.
- API behavior. Local HTTP or RPC request and response diff.
- Performance. Same-machine baseline and treatment timings or CPU profiles.
- Memory. Heap snapshots before and after the suspected operation.
