---
name: verify
description: Use while building and before claiming done. Verify the change you made, when you made it, with the smallest check that can fail it. Selects checks by what the diff touches; runs other people's tests once, not per hunk.
---

# Verify

Shape of the check follows the shape of the change. Whole-repo lint and types are cheap (17 s); other people's tests are not. The design scans are the check most often missed, so they run on any component diff.

## While editing

1. `pnpm run lint:oxlint` and `pnpm run type-check` (whole repo, 17 s). Backend: `bin/rubocop -- <changed files>`.
2. The file's own test, red before the change and green after, on the behaviour the ticket names. Backend: the mapped spec file, plus the request spec of any controller touched.
3. A component, token module or `globals.css` touched: `pnpm exec vitest run __tests__/*-scan.test.ts __tests__/*-tokens.test.ts __tests__/ledge-sweep.test.ts __tests__/type-roles.test.ts __tests__/palette.test.ts` (9 s).

## Before DONE, once per ticket

4. Callers: tsc green project-wide, and the direct importers' test files once (`vitest related <changed files>` capped to direct importers, not transitive, not per hunk).
5. Mutation only where it pays: a logic hunk in `lib/`, a service or a model, reversed once against its one mapped test file, red then restored green. Never on components, new files, comment or type hunks.
6. Build only when it can break: `next build` when `app/**`, `next.config.*`, middleware or a server file changed. `bin/ci fast` when Gemfile, schema, routes or a controller changed.
7. Run `bin/verify --base <integration branch>` once, plain (never through thoven-load-gate; it holds its own lock), and paste its `THOVEN_VERIFY` block in the DONE report. A FAIL row is fixed or raised to the user by name, never described away.

## Before merge

8. CI on the integration PR is the full run. Do not run bin/verify again on push.

## Keep it honest, once a sprint

Run `/maintain-verification-skill` against this file: time each check on this machine, list the defect classes that slipped since the last pass (review findings, Andres's corrections), and move checks between the while-editing and before-DONE tiers by those numbers. Under 10 s moves into editing; a check that caught nothing in a sprint moves out of before-DONE. Last measured 2026-10-20 (`audits/2026-10-18-skill-retro/before-after.html`).

## Shared with andres-mode ("Check your own work")

Spec line per behaviour, real route at 1440 and 390 beside the frame, shared components and tokens, show before asking. That list is the reviewer's first two sections too.
