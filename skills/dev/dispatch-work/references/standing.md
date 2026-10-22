# Standing rules for every dispatched pane

Every brief points here. Machine and Database restate `enforcement/rules/thoven-law.md` for a pane
that never reads it; change both together.

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
  `bin/verify` never goes through the gate: run it plain, it holds its own machine lock, and a
  20-minute Playwright run must not queue it. CI runs the full suite on the integration PR. Stop
  the servers you started after each step. Delete scratch you can regenerate. Route big logs and
  wide reads through a subagent and keep its summary.
- Dev server: it runs for the parity capture and stops after it. Start it and `rails s` plain, or
  through the load gate with `--check-only`, because a gated server holds a slot for its whole life.
  Use your own port, delete your `.next-*` folder when you stop, and leave uncommitted the
  tsconfig.json include that `next dev` adds for a custom distDir.
- Evidence: one folder per ticket, `~/.thoven-artifacts/THV-<id>/evidence/`. Overwrite your own
  earlier run of the same check so only the last green log of each check stays. Point at a board
  frame or screenshot that already exists instead of saving a second copy. Write no test or
  verification file beyond the ticket's own red and green proof.
- Database (backend ticket): export the pane's own `DATABASE_URL` and `TEST_DATABASE_URL` in the
  same line as every backend command, `git commit` included.
- Debt, bugs and smells in code this ticket or feature owns are fixed on this branch in the same
  round. A problem outside it goes in Noticed as one line. A product call goes to main as a
  question.
- Decide what you can and write the ruling into your report. Stop only for: an irreversible or
  destructive step, prod or a secret value, a product call, or a ticket so wrong every path is a
  guess.
- Leave no files behind outside the repo. Parity captures land under
  `~/.thoven-artifacts/<branch>/parity/`, which main uploads to the Linear issue and the board
  and then deletes. Other evidence goes in your report.
- Parity, on a UI ticket, before DONE: the `parity` row of `bin/verify`, as the verify skill
  says, plus a short video of the flow and the list of differences from the board.
- Browser: drive agent-browser from this pane only, never from a subagent. Close it when you are
  done. Send Escape in-page (dispatchEvent of a keydown), never with agent-browser press Escape,
  which pins the renderer. A renderer near 100% CPU means start a fresh browser; it is not a
  product bug unless a normal browser reproduces it.
