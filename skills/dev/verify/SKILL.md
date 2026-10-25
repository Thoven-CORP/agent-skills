---
name: verify
description: Use while building and before claiming done. Verify the change you made, when you made it, with the smallest check that can fail it. Selects checks by what the diff touches; runs other people's tests once, not per hunk.
---

# Verify

Shape of the check follows the shape of the change. Lint on the changed files and a cached typecheck are seconds; other people's tests are not. The design scans are the check most often missed, so they run on any component diff.

## Pitfalls

- For a copy or small UI change, test only the changed components with DOM assertions, curl the local backend for any API-backed claim, and add a `/thoven-designer` sweep of the surface. (LEARNINGS 2026-09-23)
- Verify a fix justified by one browser's behaviour in that browser, or name in the commit which browser the proof ran in. (LEARNINGS 2026-08-08)
- Measure layout geometry from a headless Playwright script; when a visible browser is needed, restore its viewport in the same turn, and never report a measurement viewport as the user's screen. (LEARNINGS 2026-08-22)

## While editing

1. `pnpm run type-check` and oxlint on your changed files (whole-repo lint is CI's). Backend: `bin/rubocop -- <changed files>`.
2. The file's own test, red before the change and green after, on the behaviour the ticket names. Backend: the mapped spec file, plus the request spec of any controller touched.
3. A component, token module or `globals.css` touched: `pnpm exec vitest run __tests__/*-scan.test.ts __tests__/*-tokens.test.ts __tests__/ledge-sweep.test.ts __tests__/type-roles.test.ts __tests__/palette.test.ts` (9 s).

## Before DONE

4. Callers: `pnpm run type-check` green, and the direct importers' test files once, by path (`pnpm exec vitest run <files>`). Never `vitest related` on a source file: it follows every import, and a shared component pulls most of the suite. Backend: the mapped specs plus the request spec of any controller touched.
5. A UI ticket on a surface with a board frame: capture parity with `node scripts/verify/parity-run.mjs --map scripts/verify/parity-surfaces.json --out ~/.thoven-artifacts/<branch>/parity <route prefixes the diff touches>` and open `grid.html` in the DONE message. Parity compares built states with designed ones: each state in `scripts/verify/parity-surfaces.json` names the board frame file that depicts it. On an unmapped surface, add the both-width spec to `scripts/verify/parity-surfaces.json` before DONE, or say SKIPPED and why.
6. Paste each command you ran and its pass line in the DONE report. That is the evidence. A failure is fixed or raised to the user by name, never described away. Builds, the whole suite, e2e suites and repeat sweeps are CI's, never local.

## Full verify: on request or at the parent

7. `bin/verify --base <integration branch>` runs only when the user asks for it, or once at the parent, before the integration branch's PR into `main`, with `--mutation` when that diff changes logic in `lib/`, a service or a model. Run it plain (never through thoven-load-gate; it holds its own lock) and paste its `THOVEN_VERIFY` block verbatim, `THOVEN_VERIFY_BEGIN` through `THOVEN_VERIFY_END`. `concurrency: 1` in the block means the machine was busy. A FAIL row is fixed or raised to the user by name.

## Before merge

8. CI runs the affected tests on a PR into an integration branch and the full suite on a PR into `main`. Nothing reruns on push or after a fix round: a fix round runs the test files covering what it changed.

## Keep it honest, once a sprint

Run `/maintain-verification-skill` against this file: time each check on this machine, list the defect classes that slipped since the last pass (review findings, Andres's corrections), and move checks between the while-editing and before-DONE tiers by those numbers. Under 10 s moves into editing; a check that caught nothing in a sprint moves out of before-DONE. Last measured 2026-10-20 (`audits/2026-10-18-skill-retro/before-after.html`).

## Shared with andres-mode ("Check your own work")

Spec line per behaviour, real route at 1440 and 390 beside the frame, shared components and tokens, show before asking. That list is the reviewer's first two sections too.
