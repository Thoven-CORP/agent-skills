# Branches, worktrees, PRs and merges

Thoven law (`thoven-law.md`) points here. Read this before you create a tree, push, open, review,
merge or watch a PR. A dispatched pane commits only; its main session pushes and opens the PR.

## Branches and PRs

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
- One ticket, one PR per repo, in any session: a Linear parent, a ticket worked directly, or a chain
  of same-area follow-ups that day gets one branch and one PR per repo, and every fix, follow-up and
  gap found in code it just changed is appended there. A new PR is for new work, never for the next
  fix. Each code PR into `main` pays a full merge-queue run whatever its size, so code PRs batch
  hardest; docs-only PRs cost attention, not CI minutes. Keep docs-only and code
  changes in separate PRs, since a code diff takes the docs-only PR off its fast path. (Andres,
  2026-11-08: one session opened 15 PRs, 4 of them needed.)
- Open a PR into `main` and push to it while the session still has known work for that ticket; arm
  auto-merge with `gh pr merge --auto` once its PR review passes. No PR waits for a go
  from Andres, UI included: he reviews screens on staging (Andres, 2026-11-05). `main` runs GitHub's
  merge queue (THV-1707): a push to the PR runs lint, types and the contract checks, plus on the
  backend the specs its changed files map to by path, and no other test (THV-1751), auto-merge
  queues the PR once that `CI` is green, and the queue's own `CI` run, on the commit that will
  land, runs the broad tests and merges it with a merge commit. Green PR checks are not a merge: a
  queue failure takes the PR out of the queue unmerged, and `main` does not move. A PR into an
  integration branch has no queue and starts no `CI` run: a ticket PR there merges
  on its targeted test lines and the verifier's pass (Andres, 2026-11-08). `CI` runs once, when the
  integration branch lands in `main`, through that PR's merge queue. A nightly or manual full run
  audits what selection skips.
  The method follows the PR's role:

  | PR | Merge |
  |---|---|
  | A ticket into `main` | `gh pr merge --auto`; the queue lands it as a merge commit |
  | A ticket into an integration branch | `gh pr merge --squash` on its targeted test lines and the verifier's pass; no CI run |
  | Docs only (no code, config or tests) | squash in the same pass |
  | A catch-up of `main` into an integration branch | `--merge`, so `main` stays an ancestor |
  | An integration branch landing in `main` | `gh pr merge --auto`; the queue's merge commit keeps each ticket's commit and THV id for later conflict resolution |

  Every merge line names source, target and method: "scheduling/improvements → main, merge commit".
  The queue has one method, and it is the merge commit, so an integration branch is never squashed.
  (#256 and #318 squashed 282 and 403 commits into one each, and later Private Lessons conflicts
  traced to a 470-file commit with no ticket id.)
- **Landing line.** The pull request that lands an integration branch in `main` lists every ticket
  the branch carries in its description, each with a closing word: `Closes THV-1, THV-2`. Take the
  list from the Project's tickets in Merged. Linear links a ticket by its id in the branch name, the
  pull request title or a closing word in the description, and the landing pull request's name
  carries no ticket ids, so it moves only the tickets the line names; without the line they stay
  Merged for ever. After the merge, read the Project's Merged tickets again: none is left.
- When an integration branch lands in `main`, retire it: remove its `worktree-projects.tsv` row and
  its tree, and point follow-up tickets at `origin/main`. A Project that continues cuts a fresh
  `<project-slug>/integration` from `main`.
- `~/thoven/agent-skills` takes no PRs: it is internal and runs no CI (Andres, 2026-11-09). Commit
  the exact paths in `git worktree add --detach <tmp> origin/main` and `git push origin HEAD:main`,
  then reinstall the touched skills (README) and run `enforcement/sync.sh --apply` until `sync.sh`
  reports every harness copy matches. The law block in each product repo's `CLAUDE.md` does go
  through a PR: it rides the next PR already going into that repo, or one docs-only sync PR a day,
  and gets a PR of its own only when the change alters a command agents run. Commit and merge only
  on a branch in a tree, never in a `main` checkout: `co.thoven.sync` fast-forwards the clean `main`
  checkouts every 30 minutes.
- Unattended PR work: `/full-stop` proves, files and babysits; the auto-merge armed after the PR
  review lands it on green `CI`. `/full-send`, on Andres's "full send", also merges a PR whose required check
  cannot run, in any repo. Its merge follows the method table above and the backend-first order below. Both call `/sol-loop`: with no GPT Sol
  route, run `dispatch-work/references/review.md` "Every PR" in its place and say so.
  `pr-wait` runs `--until green`, since Thoven has no Greptile or Macroscope. For a PR into `main`,
  green means queued, not merged: then wait with `enforcement/bin/pr-queue-wait <owner/repo> <n>`,
  which exits 0 when the PR merges and 1 when it leaves the queue unmerged. On 1, read the failed
  `merge_group` run, fix it, push and arm auto-merge again. GitHub turns auto-merge off while a PR
  waits in the queue, so auto-merge off alone is not a rejection.
- Keep branches and PRs when moving hosts; remote checks use dedicated disposable mirrors, and
  coding uses separate worktrees.
- To hold a PR on purpose, apply the `do-not-merge` label, so the `do-not-merge` check fails until it
  is removed; writing Hold in the body is not a gate. Create a worktree the week you start, not
  before. Every Monday, `/modernize` asks whether the branch still earns its place, then brings it up
  to `main` (a merge commit on a shared integration branch). Each live worktree carries a gitignored
  `2.0_NEXT.md` with rebase state and roadmap position.

## Review and merge order

A builder's DONE is a claim. A fresh verifier pane reviews feature slices; an Opus (high) subagent
of main reviews cleanup and hardening work. Both open with spec parity. Main reads the review and
the builder's proofs before it merges. Evidence goes on the work-session page (andres-mode,
Replies). Procedure: `dispatch-work/references/review.md`.

## Skills for PR work

Watch a PR unattended: `/babysit-pr`, with `pr-wait --until green`. A PR into `main` that is only
behind needs nothing, since the queue tests it on the latest `main`; `/modernize` is for a DIRTY PR
or a shared integration branch (its verdict only). Inherited work or a dead pane: `/takeover`.
Unattended ticket to ready-to-merge: `/full-stop`. Routing tables: each repo's
`.claude/docs/SKILL_AND_AGENT_ROUTING.md` and `orchestrate`.

## What a PR runs, and before a feature merges into main

- **Contract gate:** nothing runs on `git push` (THV-1433). CI's `checks` job runs `pnpm run contract-check` on every PR; locally only `bin/verify --full` runs it. `pnpm run contract-manifest:check` is a manual, non-blocking heads-up that `~/thoven/backend` has drifted from the committed manifest; `.github/workflows/contract-manifest-sync.yml` checks the same drift weekly. What the required `CI` check runs on a PR, and the independent audits, are in `TESTING.md` → "What blocks a merge".
- **Gate the ship:** before a feature merges into `main`, run `/qa-flow` and/or `/verify-this` (`/qa` is backup), and CI on the integration PR, then the feature's `WALKTHROUGH_V*.md`. Skip only for single-line typo or copy fixes. Staging-green and production proof live in `/publish`.
- **Ship order:** when a change touches both repos, merge the backend PR first. Backend-first holds only for a backward-compatible change: the law's required-field rule. `promote.sh` orders production itself.
