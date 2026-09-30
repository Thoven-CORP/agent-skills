## Thoven law

These rules bind every agent in every Thoven repo. This block sits in the repo `CLAUDE.md` because
that is the one file Claude, Codex, Cursor, Devin and OpenCode all read. Its source is
`~/thoven/agent-skills/enforcement/rules/thoven-law.md`, and `enforcement/sync.sh --apply` writes it
here, so change the source and let sync carry it.

**Shared worktrees.** A worktree can hold several live sessions, and any dirty or untracked file
may belong to one you cannot see. Commit is the safe path: stage the exact paths you mean and
check `git diff --cached --name-only` before committing. Product files dirty on your branch are
your branch's work, so stage them too. Leave scratch, probes and screenshots unstaged. To undo,
name your own paths: `git restore <your paths>`, `git stash push -- <your paths>`. The
`thoven-guard-bash` hook refuses the whole-tree forms (`git stash push` with no paths,
`git clean`, `git reset --hard`) and says why when it fires. It allows a path-scoped undo only for
files it saw this session edit, and only Claude and Codex record edits, so in Cursor, Devin and
OpenCode commit instead. A stash whose message is not yours
belongs to another session: leave it and name it in your hand-off. (2026-08-23: a stash before
a rebase ate a day of the onboarding prototype.)

**Branches and PRs.**
- `main` is the only 2.0 branch.
- One worktree per ticket, on branch `<area>/thv-<n>` cut from `origin/main` with `--no-track`.
  Create it with `~/thoven/agent-skills/enforcement/bin/thoven-worktree create <fe|be> <area> <n>`,
  which also copies the env file and installs dependencies. From Claude, `claude --worktree
  <area>-thv-<n>` runs the same script.
- Open a held PR into `main`. Merging is `gh pr merge --auto --squash`, gated by the required `CI`
  check. Commit and merge only on a ticket branch: `co.thoven.sync` fast-forwards the clean `main`
  checkouts every 30 minutes.
- Production moves only through `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh`.

**Scope.** Make the surgical edit the ticket asks for. Neighbouring problems go into a new Linear
issue, and work bigger than the brief stops and reports back.
