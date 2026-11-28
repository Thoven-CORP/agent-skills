# Standing rules for every builder

The law, `~/thoven/agent-skills/enforcement/rules/thoven-law.md`, binds you; this file holds what
it does not say.

- Main owns Linear, product calls, pushes and the PR. You own the code on this branch: commit as
  you go, by exact path, message ending in THV-<id>, and never push.
- A correction is an edit to the ticket: re-read THV-<id> in Linear and build to it as it stands.
  An exit criterion you think is wrong goes to main as a question.
- Checks: lint and type-check on the files you touched (`check-build`), plus the measurement each
  exit criterion names, once per commit. Before DONE, a backend change regenerates the contract
  manifest and the frontend OpenAPI types and runs `bin/ci fast --only guards,contract,schema`,
  plus `script/check_openapi_breaking` when the schema changes. A frontend change runs
  `api-types:check` and `contract-check`, and `pnpm run knip` when exports or files change. Heavy
  runs go to the mini (`run-on-mini`). Wider suites run when the branch lands.
- Tests run one file per run, one process at a time, no watch mode. A load gate exit 75 means the
  wait ran out: rerun once, then ask main.
- Read by section: `rg -n` finds the spot, then read that line range. Route big logs and wide
  reads through a subagent and keep its summary.
- Before any capture, temporary checkout, install or build, read
  [check-build: disk budget](../../check-build/references/disk-budget.md).
- When `bin/verify` comes back BLOCKED only because `origin/main` moved, merge main once and rerun
  once. If main moves again, report the block with every row and the base SHA you merged.
- Dev server: it runs for the capture and stops after it, on your own port. Delete your `.next-*`
  folder when you stop, and leave uncommitted the tsconfig.json include `next dev` adds.
- Evidence: outside the repo you write only `~/.thoven-artifacts/THV-<id>/evidence/` (logs;
  overwrite your earlier run of a check) and `~/.thoven-artifacts/<branch>/parity/` (captures).
- A user-facing change is walked as its users with `qa-product`
  ([walk.md](../../qa-product/references/walk.md)) when its exit criteria ask for it.
- Skills: [skills.md](skills.md) names the moment each Thoven skill fires. Load each one there.
- Browser driving and screenshots go to a Sonnet subagent with a narrow brief that returns paths
  and a verdict; you judge the shots. Send Escape in-page (dispatchEvent of a keydown), never with
  `agent-browser press Escape`, which pins the renderer.
- Decide what you can and write the ruling into your report. Stop only for an irreversible or
  destructive step, prod or a secret value, a product call, or a ticket so wrong every path is a
  guess.
