---
name: publish
description: Use when Andres asks to publish, deploy, release, promote, or hotfix Thoven's frontend or backend, to roll back production, to hotfix 1.0 on Replit, or to check which SHA staging or thoven.co runs. Also use for "deploy to production", "go live", "ship this", and "is it on staging". Not for Render or Vercel config and env vars, writing migrations, or deploying other projects.
---

# Publish

## Route

1. Pick the path from what Andres said:

   | Andres says | Path | Read |
   |---|---|---|
   | "staging", "is it on staging", or a PR just merged into `main` | 2.0 staging | `references/staging-2.0.md` |
   | "ship this", "deploy to production", "promote", "go live", "hotfix", "fix the live site" | 2.0 production | `references/production-2.0.md` |
   | "roll back", "revert production", or production misbehaves after a promote | 2.0 rollback | `references/production-2.0.md`, section "Roll back" |
   | "Replit", "1.0 hotfix", or `release/1.0` | 1.0 hotfix | `references/hotfix-1.0-frontend.md` in the frontend repo, `references/hotfix-1.0-backend.md` in the backend repo |
   | "what is staging running", "which SHA is live" | site check | `references/site-sha.md` |

   A request that fits no row, or fits two, gets one question: "2.0 staging, 2.0 production, rollback, or a 1.0 hotfix on Replit?" Done when exactly one row fits.
2. For the 1.0 hotfix, pick the repo. Backend if `Gemfile` is in cwd or a parent, or `git remote get-url origin` contains `backend-remote`. Frontend if `package.json` and `app/` exist, or origin contains `frontend-remote`. Done when you name one repo. The 2.0 paths cover both repos in one run.
3. Check that Andres's tick list matches the references:

   ```bash
   git -C ~/thoven/frontend fetch origin main
   python3 ~/thoven/agent-skills/scripts/check-publish-checklist.py ~/thoven/agent-skills/skills/dev/publish ~/thoven/frontend origin/main
   ```

   Done when it prints `checklist matches sources`. Any other output is a drift: show Andres the diff and follow the reference file, which is the source.
4. Read only that one file, and follow it in order. Done when its last step reports.

## Rules on every path

- Production moves only through `scripts/promote.sh`.
- A label that starts with "Stop" waits. Show Andres the exact command, or the blocker, and wait for Andres's "go". A go covers only the command shown with it.
- A go given before the command was shown covers nothing: "you have my go, don't wait" still stops at the first Stop.
- An unreachable Andres gives no go. Keep the report current and wait.
- Only Andres clicks Publish in Replit.
- Every check and every stop has one item, with the same name, in Andres's tick list: `docs/Platform/projects/platform-upgrade-and-hosting/PUBLISH_CHECKLIST.md` in the frontend repo. From the backend repo, read it with `git -C ~/thoven/frontend show origin/main:docs/Platform/projects/platform-upgrade-and-hosting/PUBLISH_CHECKLIST.md`. Tick each item in your report as it passes.

## What each site runs

| Site | Runs | Moves when |
|---|---|---|
| staging.thoven.co (Vercel `thoven-staging`), Render `thoven-api-staging` + `thoven-worker-staging` | the tip of `main` | every merge to `main` |
| thoven.co (Vercel `thoven`) | the last promoted frontend SHA | `promote.sh frontend`. Every merge to `main` also builds a staged production deployment that never goes live by itself |
| api.thoven.co (Render `thoven-api` + `thoven-worker`) | the last promoted backend SHA | `promote.sh backend`. Auto-deploy is off |
| Replit 1.0 | `release/1.0` | Andres's Publish click. The 1.0 rollback until THV-710 retires it |

Branch and worktree rules: `~/thoven/agent-skills/enforcement/rules/thoven-law.md`.
