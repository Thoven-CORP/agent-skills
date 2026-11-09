# Standing rules for every dispatched pane

Every brief points here. Machine and Database restate
`~/thoven/agent-skills/enforcement/rules/thoven-law.md` so they bind without a read; change both
together.

- The law is `~/thoven/agent-skills/enforcement/rules/thoven-law.md`; where a tree's CLAUDE.md copy
  differs, that file wins.
- You and main run side by side. Main owns Linear, product calls and your review. You own the code
  on this branch and your commits.
- Commit as you go, by exact path, message ending in THV-<id>. Commit only: main pushes the branch
  and opens the PR.
- Before DONE, a backend change regenerates the contract manifest and the frontend OpenAPI types, and runs `bin/ci fast --only guards,contract,schema` plus `script/check_openapi_breaking` when the schema changes. A frontend change runs `api-types:check` and `contract-check`, and `pnpm run knip` when exports or files change. The authorization cop runs with the other guards. No PR writes release notes: `/publish` writes the GitHub Release from the merged PRs and their Linear tickets.
- Talk to main by peer message plus a board entry, as the brief's ASK and REPORT say. A message
  from main can arrive mid-turn. Read it at once: a correction overrides the brief from that point.
- Machine: run the touched test files, one file per run, one process at a time, no watch mode.
  Run e2e, build, stack and perf work through `~/thoven/agent-skills/enforcement/bin/thoven-load-gate
  -- <cmd>`, which waits for free memory and a free slot. Exit 75 means the wait ran out: rerun
  once, then ask main. Run no full `bin/verify` unless the brief asks for it. Heavy work runs on the
  host whose `~/.config/thoven/host.json` says `mini`, where `bin/verify` takes a gate slot itself;
  on a `laptop` host run `remote-verify` instead, and the `remote-check` skill for builds and e2e.
  CI runs the full suite on the integration PR. Stop the servers you started after each step.
  Delete scratch you can regenerate. Route big logs and wide reads through a subagent and keep its
  summary. Read by section: `rg -n` finds the spot, then Read or `sed -n` takes that line range. A
  file over ~300 lines is read whole only when the task is the whole file, and never through `cat`.
- Verification disk use: read [Verify: Verification disk budget](../../verify/SKILL.md#verification-disk-budget)
  before any capture, temporary checkout, install or build, in verifier briefs and `verify-this`
  runs too.
- When `bin/verify` comes back BLOCKED only because `origin/main` moved, merge main once and rerun
  once. If main moves again, do not merge again: report the block as it came back, with every row
  and the base SHA you merged. Further catch-up is main's call.
- Dev server: it runs for the parity capture and stops after it. Start it and `rails s` plain, or
  through the load gate with `--check-only`, because a gated server holds a slot for its whole life.
  Use your own port, delete your `.next-*` folder when you stop, and leave uncommitted the
  tsconfig.json include that `next dev` adds for a custom distDir.
- Evidence: outside the repo you write only two folders. Logs go in
  `~/.thoven-artifacts/THV-<id>/evidence/`; overwrite your own earlier run of a check so only its
  last green log stays. Parity captures go in `~/.thoven-artifacts/<branch>/parity/`, which main
  uploads to the Linear issue and the board and then deletes. Point at a board frame or screenshot
  that already exists instead of saving a second copy. Your only test or verification files are
  the ticket's own red and green proof.
- Capture: read [QA capture](../../qa-flow/references/flow-mapping-and-evidence.md#7-capture-screenshots-and-recorded-flows)
  before starting a recording or capture run. Carry its host, continuous-journey and evidence rules
  into the brief; main presents the result through the canonical visual artifact.
- Parity, on a UI ticket with a named design source, before DONE, is yours to capture. Run
  `scripts/verify/parity-run.mjs` behind `thoven-load-gate` as frontend `TESTING.md` shows (Mini
  parity pilot), with `--out` set to the parity folder above. Cover every surface the ticket names,
  sibling rows included, at each Paper frame's width, desktop and phone, and 390. A named surface
  that `parity-surfaces.json` does not map gets a 390 capture at the commit before your change,
  beside the after. Put the grid in your REPORT with a short video of the flow and the
  Discrepancies table (brief, REPORT, Parity). A capture is evidence of what you built, never of a
  match: the verifier writes the MATCH or NO.
- Database (backend ticket): export the pane's own `DATABASE_URL` and `TEST_DATABASE_URL` in the
  same line as every backend command, `git commit` included.
- Debt, bugs, smells and easy concerns in code this ticket or feature owns are fixed on this branch
  before you report. A problem outside it goes in Noticed as one line. A product call goes to main
  as a question.
- Decide what you can and write the ruling into your report. Stop only for: an irreversible or
  destructive step, prod or a secret value, a product call, or a ticket so wrong every path is a
  guess.
- Browser: agent-browser driving, screenshots and Paper drawing go to a Sonnet subagent with a
  narrow brief that returns paths and a verdict; you judge the shots. It closes the browser when
  done. Send Escape in-page (dispatchEvent of a keydown), never with agent-browser press Escape,
  which pins the renderer. A renderer near 100% CPU means start a fresh browser; it is not a
  product bug unless a normal browser reproduces it.
