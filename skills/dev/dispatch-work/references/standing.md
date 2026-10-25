# Standing rules for every dispatched pane

Every brief points here. Machine and Database restate
`~/thoven/agent-skills/enforcement/rules/thoven-law.md` so they bind without a read; change both
together.

- The law is `~/thoven/agent-skills/enforcement/rules/thoven-law.md`. Read it there. `sync.sh`
  refreshes the law block only in the main checkouts, so a parked tree's CLAUDE.md copy can lag, and
  where the two differ the source file wins.
- You and main run side by side. Main owns Linear, product calls and your review. You own the code
  on this branch and your commits.
- Commit as you go, by exact path, message ending in THV-<id>. Commit only: main pushes the branch
  and opens the PR.
- Talk to main by peer message (SendMessage to the session your brief names) plus a board entry,
  as the brief's ASK and REPORT say. A message from main can arrive mid-turn. Read it at once: a
  correction overrides the brief from that point.
- Machine: run the touched test files, one file per run, one process at a time, no watch mode.
  Run e2e, build, stack and perf work through
  `/Users/andresmartinez/thoven/agent-skills/enforcement/bin/thoven-load-gate -- <cmd>`, which waits
  for free memory and a free slot. Exit 75 means the wait ran out: rerun once, then ask main.
  Run no full `bin/verify` unless the brief asks for it; when it does, run it plain, outside the
  gate: it holds its own machine lock. CI runs the full suite
  on the integration PR. Stop the servers you started after each step. Delete scratch you can regenerate. Route big logs and
  wide reads through a subagent and keep its summary.
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
- Parity, on a UI ticket, before DONE: `scripts/verify/parity-run.mjs` over designed states
  only, as the verify skill says, plus a short video of the flow and the list of differences from the board.
- Database (backend ticket): export the pane's own `DATABASE_URL` and `TEST_DATABASE_URL` in the
  same line as every backend command, `git commit` included.
- Debt, bugs and smells in code this ticket or feature owns are fixed on this branch in the same
  round. A problem outside it goes in Noticed as one line. A product call goes to main as a
  question.
- Decide what you can and write the ruling into your report. Stop only for: an irreversible or
  destructive step, prod or a secret value, a product call, or a ticket so wrong every path is a
  guess.
- Browser: drive agent-browser from this pane only, never from a subagent. Close it when you are
  done. Send Escape in-page (dispatchEvent of a keydown), never with agent-browser press Escape,
  which pins the renderer. A renderer near 100% CPU means start a fresh browser; it is not a
  product bug unless a normal browser reproduces it.
