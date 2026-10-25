## Thoven law

These rules bind every agent in every Thoven repo. This block sits in the repo `CLAUDE.md` because
that is the one file Claude, Codex, Cursor, Devin and OpenCode all read. Its source is
`~/thoven/agent-skills/enforcement/rules/thoven-law.md`, and `enforcement/sync.sh --apply` writes it
here, so change the source and let sync carry it.

**Shared worktrees.** A worktree can hold several live sessions, and any dirty or untracked file
may belong to one you cannot see. Commit is the safe path: stage the exact paths you mean and
check `git diff --cached --name-only` before committing. Product files dirty on your branch are
your branch's work, so stage them too. To untrack or delete a file, run `git rm --cached`, check
the staged list, commit with no pathspec and confirm with `git ls-files --error-unmatch`, because a
pathspec commit takes the working-tree state and restores the file. Leave scratch, probes and
screenshots unstaged. Unpack probes under `tmp/<name>/` and delete them by exact path, since a glob
`rm` after a failed `cd` expands at the worktree root. To undo,
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
- Open a held PR into `main`, and merge it on Andres's "merge it", gated by the required `CI` check.
  `CI` runs only on PRs into `main`: a ticket PR into an integration branch merges on its
  test lines and the verifier's pass, and `CI` gates the integration branch when it lands.
  The method follows the PR's role:

  | PR | Merge |
  |---|---|
  | A ticket into `main` | `gh pr merge --auto --squash` |
  | A ticket into an integration branch | `gh pr merge --squash` on the verify block and verifier pass |
  | Docs only (no code, config or tests) | squash in the same pass, like an agent-skills PR |
  | A catch-up of `main` into an integration branch | `--merge`, so `main` stays an ancestor |
  | An integration branch landing in `main` | `--auto --merge`, so each ticket's commit and THV id survive for later conflict resolution |

  Every merge go names source, target and method: "scheduling/improvements → main, merge commit".
  (#256 and #318 squashed 282 and 403 commits into one each, and later Private Lessons conflicts
  traced to a 470-file commit with no ticket id.)
- When an integration branch lands in `main`, retire it: remove its `worktree-projects.tsv` row and
  its tree, and point follow-up tickets at `origin/main`. A Project that continues cuts a fresh
  `<project-slug>/integration` from `main`.
- An agent-skills PR is not held. It merges in the same pass, then `enforcement/sync.sh
  --apply` runs until `sync.sh` reports every harness copy matches. Commit and merge only on a
  branch in a tree, never in a `main` checkout: `co.thoven.sync` fast-forwards the clean `main` checkouts every 30 minutes.
- Production moves only through `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh`.

**Where records live.** Linear is the source of truth, and the tldraw board is the source of truth
for design. Decisions live in the Linear parent issue under "Decisions (canonical)", and each cites
the board frame it rests on. Repo `decisions/api.md` keeps payload fields. Local plans and evidence
folders are scratch, deleted at close.

**Spec parity.** A brief, a plan section or a review traces its work to parent decision ids and
their frames. The verifier's report opens with SPEC PARITY.

**Design parity.** A build that changes what a user sees captures every touched state, through `scripts/verify/parity-run.mjs` where the surface is mapped, at 1440 and
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

**Targeted tests.** The verify cadence lives in `skills/andres-mode/SKILL.md`, "Check your own work":
targeted checks while editing and at DONE, CI on every PR, the full `bin/verify --base <integration
branch>` only when Andres asks or once at the parent before the integration PR into `main`, nothing
reruns on push. Heavy work (e2e, builds, stacks, perf) runs through
`~/thoven/agent-skills/enforcement/bin/thoven-load-gate -- <cmd>`. `bin/verify` runs plain, never
through the gate: it holds its own machine lock. Stop the servers you started after each step, and
delete scratch you can regenerate.

**Local database.** `thoven-worktree create` sets `TEST_DATABASE_URL` to `neondb_test_<slug>`, drops
a `DATABASE_URL` that names the shared `thoven_development`, and creates `thoven_dev_<slug>` when the
branch adds a migration. Every backend command, `git commit` included, names the pane's own local
database: export `DATABASE_URL` and `TEST_DATABASE_URL` in the same line.

**Review order.** A builder's DONE is a claim. A fresh verifier pane reviews feature slices; a Sonnet
subagent of main reviews cleanup and hardening work. Both open with spec parity. Main reruns the
touched files and merges backend before the frontend that reads it. Backend-first holds only for a
backward-compatible change: a newly required request field stays optional until the frontend that
sends it is on staging. (Backend #278 made `source_timezone` required hours before the frontend
sent it, and staging refused every reschedule for six hours.) UI merges after Andres sees the
evidence. Procedure: `dispatch-work/references/review.md`.

**Scope.** Make the surgical edit the ticket asks for. Debt, bugs and smells in code the ticket or
feature owns are fixed on its branch in the same round. A problem outside it gets one line in an
existing grouped Linear issue, or a new issue only when none fits. A product call goes to Andres as
a question. Work bigger than the brief stops and reports back.
