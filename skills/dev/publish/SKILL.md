---
name: publish
description: Use when publishing, deploying, releasing, promoting to production, or checking what a site runs. Branches on app (1.0 or 2.0) and target (staging or production), in the frontend or backend repo. Triggers on publish, deploy, deploy to production, promote, release, go live, hotfix, staging, changelog.
---

# Publish

Each website watches exactly one branch. To change a website, move its branch.

| Branch | Frontend | Backend |
|---|---|---|
| `feature/teacher-2.0` | Vercel `thoven-staging` → staging.thoven.co (auto) | Render `thoven-api-staging` + `thoven-worker-staging` (auto) |
| `release/2.0` | Vercel `thoven` → thoven.vercel.app (auto on push) | Render `thoven-api` + `thoven-worker` (manual deploy only) |
| `release/1.0` | Replit → thoven.co (Publish click) | Replit → thoven.co's API (Publish click) |
| `main` | nothing deploys | nothing deploys |

`main` holds 1.0 code until P9, about a week after launch, when 2.0 moves onto `main` and 1.0 retires. After P9 this skill is rewritten. Until then, use the table above.

## Steps

1. **Pick the repo.** Backend if `Gemfile` is in cwd or a parent, or `git remote get-url origin` contains `backend-remote`. Frontend if `package.json` and `app/` exist, or origin contains `frontend-remote`.
2. **Pick the path** from what Andres said and the branch the change is on:

   | Andres says / the change is on | Path | Read |
   |---|---|---|
   | "hotfix", "fix the live site", "publish on Replit", or the change is on `release/1.0` | 1.0 hotfix | frontend: `references/hotfix-1.0-frontend.md` · backend: `references/hotfix-1.0-backend.md` |
   | "staging", "is it on staging", or the change is merged into `feature/teacher-2.0` | 2.0 staging | `references/staging-2.0.md` |
   | "deploy to production", "promote", "ghost prod", "release/2.0" | 2.0 production | `references/production-2.0.md` |
   | "roll back", "revert production", a 2.0 production deploy misbehaves | 2.0 rollback | `references/production-2.0.md`, section "Roll back" |

   A request that fits no row, or fits two, gets one question: "1.0 hotfix, 2.0 staging, or 2.0 production?"
3. **Read only that one file and follow it in order.** The 2.0 production path covers both repos in one run. The other paths cover the repo from step 1.

## Proof a site runs a SHA

Every path ends here. A push, a green CI run, or a finished deploy is not proof. The site answering with the SHA is.

| Site | Check | Passes when |
|---|---|---|
| 2.0 frontend | `curl -s https://staging.thoven.co/api/version` (ghost prod: `https://thoven.vercel.app/api/version`) | `sha` equals the full SHA and `ref` is the branch that site watches. `env` reads `production` on both Vercel projects, so `ref` is what tells staging from ghost prod. |
| 2.0 backend web | `curl -s https://thoven-api-staging.onrender.com/health` (ghost prod: `https://api.thoven.co/health`) | `revision.sha` is a prefix of the SHA |
| 2.0 backend, both services | `render deploys list <service-id> -o json --confirm` | the first entry has `status` `live` and `commit.id` equal to the SHA |
| 2.0 backend liveness | `curl -s -o /dev/null -w '%{http_code}' https://api.thoven.co/up` (or the staging API host) | `200` |
| 1.0 frontend | `npm run verify:prod` | exit 0 |
| 1.0 backend | `curl -s https://thovenbackend-am-andres234.replit.app/health` | `revision.sha` is a prefix of the release SHA |

## Stops

These steps cannot be undone by the next push. Show Andres the exact command, then wait for Andres's "go" before each one:

- pushing `release/2.0` in either repo (one go per repo),
- deploying the production backend (one go covers `thoven-api` then `thoven-worker`),
- rolling back 2.0 production (one go per repo),
- clicking Publish in Replit (only Andres clicks it).

Everything else in these files runs without asking.
