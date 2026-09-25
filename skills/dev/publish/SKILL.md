---
name: publish
description: Use when publishing, deploying, releasing, promoting to production, or checking what a site runs. Branches on app (1.0 or 2.0) and target (staging or production), in the frontend or backend repo. Triggers on publish, deploy, deploy to production, promote, release, go live, hotfix, staging, changelog.
---

# Publish

## Route

1. Pick the path from what Andres said, or from the branch the change is on:

   | Andres says, or the change is on | Path | Read |
   |---|---|---|
   | "hotfix", "fix the live site", "publish on Replit", or `release/1.0` | 1.0 hotfix | `references/hotfix-1.0-frontend.md` in the frontend repo, `references/hotfix-1.0-backend.md` in the backend repo |
   | "staging", "is it on staging", or merged into `feature/teacher-2.0` | 2.0 staging | `references/staging-2.0.md` |
   | "deploy to production", "promote", "ghost prod", or `release/2.0` | 2.0 production | `references/production-2.0.md` |
   | "roll back", "revert production", or a 2.0 production deploy misbehaves | 2.0 rollback | `references/production-2.0.md`, section "Roll back" |
   | "what is staging running", "which SHA is live" | site check | `references/site-sha.md` |

   A request that fits no row, or fits two, gets one question: "1.0 hotfix, 2.0 staging, 2.0 production, or rollback?" Done when exactly one row fits.
2. For the 1.0 hotfix, pick the repo. Backend if `Gemfile` is in cwd or a parent, or `git remote get-url origin` contains `backend-remote`. Frontend if `package.json` and `app/` exist, or origin contains `frontend-remote`. Done when you name one repo. The 2.0 paths cover both repos in one run.
3. Read only that one file, and follow it in order. Done when its last step reports.

## Rules on every path

- A label that starts with "Stop" waits. Show Andres the exact command, or the blocker, and wait for Andres's "go". A go covers only the command shown with it.
- Only Andres clicks Publish in Replit.
- Every check and every stop has one item, with the same name, in Andres's tick list: `docs/Platform/projects/platform-upgrade-and-hosting/PUBLISH_CHECKLIST.md` in the frontend repo. From the backend repo, read it with `git -C ~/thoven/frontend show origin/feature/teacher-2.0:docs/Platform/projects/platform-upgrade-and-hosting/PUBLISH_CHECKLIST.md`. Tick each item in your report as it passes.

## Which branch each site watches

| Branch | Frontend | Backend |
|---|---|---|
| `feature/teacher-2.0` | Vercel `thoven-staging` → staging.thoven.co, on every push | Render `thoven-api-staging` + `thoven-worker-staging`, on every push |
| `release/2.0` | Vercel `thoven` → thoven.vercel.app, on every push | Render `thoven-api` + `thoven-worker`, manual deploy only |
| `release/1.0` | Replit → thoven.co, on the Publish click | Replit → the 1.0 API, on the Publish click |
| `main` | nothing | nothing |

`main` holds 1.0 code until P9, about a week after launch, when 2.0 moves onto `main` and 1.0 retires. This skill is rewritten at P9.
