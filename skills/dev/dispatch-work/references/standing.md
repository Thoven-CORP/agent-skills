# Standing rules for every dispatched pane

Every brief points here. The law, `~/thoven/agent-skills/enforcement/rules/thoven-law.md`, binds
you; where a tree's CLAUDE.md copy differs, that file wins. Its Targeted tests, Local database,
Scope and Design parity paragraphs are the ones a pane reaches most. This file holds what the law
does not say.

- You and main run side by side. Main owns Linear, product calls and your review. You own the code
  on this branch and your commits.
- Commit as you go, by exact path, message ending in THV-<id>. Commit only: main pushes the branch
  and opens the PR.
- Before DONE, a backend change regenerates the contract manifest and the frontend OpenAPI types, and runs `bin/ci fast --only guards,contract,schema` plus `script/check_openapi_breaking` when the schema changes. A frontend change runs `api-types:check` and `contract-check`, and `pnpm run knip` when exports or files change. The authorization cop runs with the other guards. No PR writes release notes: `/publish` writes the GitHub Release from the merged PRs and their Linear tickets.
- Talk to main by peer message plus a board entry, only as the brief's ASK and REPORT say. A
  message from main can arrive mid-turn: read it at once. A correction is an edit to the ticket, so
  re-read THV-<id> in Linear and build to it as it stands. Main and Andres edit exit lines; one you
  think is wrong goes to main as a question.
- Tests run one file per run, one process at a time, no watch mode. A load gate exit 75 means the
  wait ran out: rerun once, then ask main.
- Read by section: `rg -n` finds the spot, then Read or `sed -n` takes that line range. A file
  over ~300 lines is read whole only when the task is the whole file, and never through `cat`.
  Route big logs and wide reads through a subagent and keep its summary.
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
- Capture and parity: before a recording or capture run, read [QA capture](../../qa-flow/references/flow-mapping-and-evidence.md#7-capture-screenshots-and-recorded-flows).
  The law's Design parity paragraph says what a UI ticket captures; frontend `TESTING.md`, "Mini
  parity pilot", says how (`scripts/verify/parity-run.mjs` behind `thoven-load-gate`, `--out` set
  to the parity folder above). Make each capture once; the reviewer judges it.
- Skills: [skills.md](skills.md) names the moment each Thoven skill fires. Load each one when you
  reach its moment.
- A prompt you write for a code-writing subagent names THV-<id> and the sections it reads, the
  files it owns, and for each concern the existing module it builds on, by path, found by reading
  the code. A successor's prompt names its predecessor's open items by the file that holds them.
- Decide what you can and write the ruling into your report. Stop only for: an irreversible or
  destructive step, prod or a secret value, a product call, or a ticket so wrong every path is a
  guess.
- Browser: agent-browser driving, screenshots and Paper drawing go to a Sonnet subagent with a
  narrow brief that returns paths and a verdict; you judge the shots. It closes the browser when
  done. Send Escape in-page (dispatchEvent of a keydown), never with agent-browser press Escape,
  which pins the renderer. A renderer near 100% CPU means start a fresh browser; it is not a
  product bug unless a normal browser reproduces it.
