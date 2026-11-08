---
name: publish
description: Use when Andres asks to publish, deploy, release, promote or hotfix Thoven's frontend or backend, to put a commit on staging, to roll production back, or to check which SHA staging or thoven.co runs. Also use for "go live", "ship this", and "is it on staging". Not for Render or Vercel config and env vars, or writing migrations.
---

# Publish

**A merge to `main` deploys nothing.** Staging and production each run the commit last put there on purpose, and this skill is what puts it there. After a merge Andres wants to see, staging still shows the older commit until someone moves it (route table, first row).

| Site | Runs | Moves when |
|---|---|---|
| Staging: staging.thoven.co (Vercel `thoven-staging`) and api `thoven-api-staging` (Render) | the commits last put there on purpose. The staging backend sleeps between timed sessions | the frontend: `staging-frontend.sh` (route table, first row). The backend: a `start-staging` session |
| Production: thoven.co (Vercel `thoven`) and api.thoven.co (Render `thoven-api` + `thoven-worker`) | the last promoted commits, tagged `prod/YYYY-MM-DD-N` in both repos | `scripts/promote.sh`, one Andres go per step. Nothing goes live by itself |

**Roll back** means moving production back to the commit the last release moved from: the frontend through Vercel's rollback, the backend by redeploying that tagged commit. `references/production.md`, section "Roll back", runs it.

## Pitfalls

- Describe production as "thoven.co runs `main` at <sha>, tagged prod/<date>-<n>; this merge reaches it at the next publish". A tag name alone reads as a branch. (LEARNINGS 2026-10-22)
- Open a hotfix PR as soon as the targeted tests are green; `bin/verify` and the reviews run beside PR CI, and gate repairs go on their own branch. (LEARNINGS 2026-10-22)
- Build the release plan's post-promote list from the range's merged tickets and a mem0 search, and run every backfill or rake task they owe as a numbered step before the production harness. (LEARNINGS 2026-10-22)
- Start every production release with the changelog list (`references/production.md` step 1), and add missing entries in one PR before `plan`, never after the promote. (LEARNINGS 2026-10-22, 2026-10-31)
- Hold any prod change that stops or resumes a service (API, worker, Redis) for a quiet window and Andres's go naming that change, then redeploy the pinned SHA explicitly, because a Render resume builds the newest commit. (LEARNINGS 2026-11-05)

## Route

1. Pick the path from what Andres said:

   | Andres says | Path | Do |
   |---|---|---|
   | "put it on staging", "deploy to staging", "I want to see it on staging" | staging deploy | Frontend only: run `~/thoven/agent-skills/skills/dev/publish/scripts/staging-frontend.sh <sha>` (default: the tip of `main`); done when it prints `staging serves <sha9>`. Backend, or both, or extend or stop a session: load the `start-staging` skill and follow it |
   | "is it staging-green", "prove staging" before a promote | staging proof | `references/staging.md` |
   | "ship this", "deploy to production", "promote", "go live" | production | `references/production.md` |
   | "hotfix", "fix the live site", "skip the ceremony", "straight through", "no go's" | production straight through | `references/production.md`, section "Straight through" |
   | "roll back", "revert production", or production misbehaves after a promote | rollback | `references/production.md`, section "Roll back" |
   | "what is staging running", "which SHA is live" | site check | `references/site-sha.md` |

   A request that fits no row, or fits two, gets one question: "staging deploy, staging proof, production, straight through, or rollback?" Done when exactly one row fits.
2. For the staging proof, production, straight-through and rollback paths, check that Andres's tick list matches the references:

   ```bash
   git -C ~/thoven/frontend fetch origin main
   python3 ~/thoven/agent-skills/scripts/check-publish-checklist.py ~/thoven/agent-skills/skills/dev/publish ~/thoven/frontend origin/main
   ```
   While a skill change's checklist PR is still open, run it against that PR's worktree instead of `origin/main`.

   Done when it prints `checklist matches sources`. Any other output is a drift: show Andres the diff and follow the reference file, which is the source.
3. Read only that one file, and follow it in order. Done when its last step reports.

## Rules on every path

- Production moves only through `scripts/promote.sh`.
- Every other look at a host goes through that host's skill, invoked before its first command:
  - **Vercel** (an env var's value or change time, a build's state or commit, a staged build's bundle, deployment logs): `/vercel-cli`. Target `--project thoven` or `thoven-staging` with `--scope andres-3203s-projects`. Read an env change from `vercel env ls <env> --json` `updatedAt`, since the table's "ago" column is the creation time. Read a protected build with `vercel curl --deployment <url>`.
  - **Render** (a service's deploy status, logs, health, metrics, a one-off job's output): `/render-monitor`.
- Every report ends with a **Checks** table, one row per check that ran or should have: the check, how it ran (the command, or the host skill that ran it), and its result (pass, fail, or not run and why). A check missing from the table did not happen.
- A label that starts with "Stop" waits. Show Andres the exact command, or the blocker, and wait for Andres's "go". A go covers only the command shown with it.
- A go given before the command was shown covers nothing: "you have my go, don't wait" still stops at the first Stop. The one exception is the straight-through path. There, Andres's request is the go for every Stop of that one release, and the section's own stop conditions still bind.
- An unreachable Andres gives no go. Keep the report current and wait.
- Every check and every stop has one item, with the same name, in Andres's tick list: `docs/Platform/projects/platform-upgrade-and-hosting/PUBLISH_CHECKLIST.md` in the frontend repo. From the backend repo, read it with `git -C ~/thoven/frontend show origin/main:docs/Platform/projects/platform-upgrade-and-hosting/PUBLISH_CHECKLIST.md`. Tick each item in your report as it passes.

Branch and worktree rules: `~/thoven/agent-skills/enforcement/rules/thoven-law.md`.
