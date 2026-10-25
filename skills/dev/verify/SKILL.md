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

1. `pnpm run type-check` and oxlint on your changed files (`bin/verify` lints changed files only; whole-repo lint is CI's). Backend: `bin/rubocop -- <changed files>`.
2. The file's own test, red before the change and green after, on the behaviour the ticket names. Backend: the mapped spec file, plus the request spec of any controller touched.
3. A component, token module or `globals.css` touched: `pnpm exec vitest run __tests__/*-scan.test.ts __tests__/*-tokens.test.ts __tests__/ledge-sweep.test.ts __tests__/type-roles.test.ts __tests__/palette.test.ts` (9 s).

## Before DONE, once per ticket

Steps 4 and 6 are rows of `bin/verify` (`related`, `build`, `fast-ci`): know what they cover, and run them only through step 7, never by hand as well. The whole suite, e2e suites and repeat sweeps are CI's, never local.

4. Callers: tsc green project-wide, and the direct importers' test files once (`vitest related <changed files>` capped to direct importers, not transitive, not per hunk).
5. Pass `--mutation` on a logic hunk in `lib/`, a service or a model. On any other diff the `mutation` row reads SKIPPED "opt-in: --mutation".
6. Build only when it can break: `next build` when `app/**`, `next.config.*`, middleware or a server file changed. `bin/ci fast` when Gemfile, schema, routes or a controller changed.
7. Run `bin/verify --base <integration branch>` once, plain (never through thoven-load-gate; it holds its own lock), and paste its `THOVEN_VERIFY` block in the DONE report verbatim, `THOVEN_VERIFY_BEGIN` through `THOVEN_VERIFY_END`. A shortened or retyped block cannot be checked. `concurrency: 1` in the block means the machine was busy. A FAIL row is fixed or raised to the user by name, never described away.

On a mapped UI surface the `parity` row produces the grid: open `grid.html` in the DONE message. Parity compares built states with designed ones: each state in `scripts/verify/parity-surfaces.json` names the board frame file that depicts it, and the row FAILs naming any state without one. On an unmapped surface, add the both-width spec to `scripts/verify/parity-surfaces.json` before DONE, or say SKIPPED and why.

## Before merge

8. CI on the integration PR is the full run. Do not run bin/verify again: not on push, not after a fix round, not for the verifier. A fix round runs the test files covering what it changed.

## Keep it honest, once a sprint

Run `/maintain-verification-skill` against this file: time each check on this machine, list the defect classes that slipped since the last pass (review findings, Andres's corrections), and move checks between the while-editing and before-DONE tiers by those numbers. Under 10 s moves into editing; a check that caught nothing in a sprint moves out of before-DONE. Last measured 2026-10-20 (`audits/2026-10-18-skill-retro/before-after.html`).

## Shared with andres-mode ("Check your own work")

Spec line per behaviour, real route at 1440 and 390 beside the frame, shared components and tokens, show before asking. That list is the reviewer's first two sections too.
