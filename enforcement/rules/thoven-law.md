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
`git clean`, `git reset --hard`) and a forced `git worktree remove` or `git branch -D` of work not
on origin, and says why when it fires. It allows a path-scoped undo only for files it saw this
session edit. A stash whose message is not yours
belongs to another session: leave it and name it in your hand-off. (2026-08-23: a stash before
a rebase ate a day of the onboarding prototype.)

**Branches and PRs.**
- `main` is the only 2.0 branch.
- The unit of work is the Linear Project's integration branch. Match the ticket's Project, Kind and
  files to one row:

| # | Ticket | Where it runs |
|---|---|---|
| 1 | Review, Audit, Research, Verify | No tree. Read the Project's integration tree, or `git show`. |
| 2 | Design or Plan, docs only | No tree. Write at the issue's `Writes to:` path. |
| 3 | Build or Fix, Project has an integration tree | Work in that tree on the integration branch. Every commit ends with the ticket id. |
| 4 | First Build ticket of a Project | Cut the Project's canonical tree and remote branch `<project-slug>/integration`. |
| 5 | Build or Fix, no Project (hotfix, scratch) | Own tree on `<area>/thv-<n>` cut from `origin/main` with `--no-track`. |

- Create a tree with `~/thoven/agent-skills/enforcement/bin/thoven-worktree create <fe|be> <area> <n>
  --project <slug> --kind <kind>`. The script refuses read-only kinds, reuses a Project's tree, and
  copies the env file and installs dependencies. Add `--new "<reason>"` for a fresh tree when your
  files overlap another live tree's dirty files, or the work is risky and long. From Claude,
  `claude --worktree <area>-thv-<n>` runs the same script.
- Open a held PR into `main`. Merging is `gh pr merge --auto --squash`, gated by the required `CI`
  check. Commit and merge only on a branch in a tree, never in a `main` checkout: `co.thoven.sync`
  fast-forwards the clean `main` checkouts every 30 minutes.
- Production moves only through `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh`.

**Where records live.** Linear is the source of truth, and the tldraw board is the source of truth
for design. Decisions live in the Linear parent issue under "Decisions (canonical)", and each cites
the board frame it rests on. Repo `decisions/api.md` keeps payload fields. Local plans and evidence
folders are scratch, deleted at close.

**Spec parity.** A brief, a plan section or a review traces its work to parent decision ids and
their frames. The verifier's report opens with SPEC PARITY.

**Design parity.** A build that changes what a user sees captures every touched state at 1440 and
390 beside its board frame, plus a short video. The images go to the Linear issue as a comment (the
parent when the work has no issue) and onto the board beside their frames. A difference from a
confirmed frame that Andres did not approve is a defect. A frame binds what shows (elements,
states, order, hierarchy, tokens), not sizing behaviour (fill or hug, stretch, reflow), which
follows component best practice and matches the frame at its own width. Parity means design-system tokens and
shared components; a missing component is built with `/building-components`. Procedure:
`~/thoven/agent-skills/skills/dev/dispatch-work/references/brief.md`.

**Hardening keeps the design.** Refactor, performance and robustness work changes what a user sees
only to fix an issue it found at another viewport, in motion or in performance. The commit or report
names that issue beside the change.

**Targeted tests.** A slice runs its touched test files, one file per run, plus lint on those files.
CI runs the full suite on the integration PR. `bin/verify` runs once per feature, before it merges
to `main`. Heavy work (e2e, builds, stacks, perf) runs through `~/thoven/agent-skills/enforcement/bin/thoven-load-gate -- <cmd>`. Stop
the servers you started after each step, and delete scratch you can regenerate.

**Local database.** `thoven-worktree create` sets `TEST_DATABASE_URL` to `neondb_test_<slug>`, drops
a `DATABASE_URL` that names the shared `thoven_development`, and creates `thoven_dev_<slug>` when the
branch adds a migration. Every backend command, `git commit` included, names the pane's own local
database: export `DATABASE_URL` and `TEST_DATABASE_URL` in the same line.

**Review order.** A builder's DONE is a claim. A fresh verifier pane reviews feature slices; a Sonnet
subagent of main reviews cleanup and hardening work. Both open with spec parity. Main reruns the
touched files and merges backend before the frontend that reads it. UI merges after Andres sees the
evidence. Procedure: `dispatch-work/references/review.md`.

**Scope.** Make the surgical edit the ticket asks for. Neighbouring problems go into a new Linear
issue, and work bigger than the brief stops and reports back.
