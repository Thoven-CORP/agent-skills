# Publish: 2.0 production ("deploy to production")

Production shows exactly what staging already showed. Each repo's `release/2.0` fast-forwards to a SHA that is staging-green, then:

- backend: Render `thoven-api` and `thoven-worker` deploy that SHA by hand, web first,
- frontend: Vercel project `thoven` sees the push to `release/2.0` and rebuilds that SHA with production settings for thoven.vercel.app.

Until THV-767 step 8, 2.0 production is ghost prod: thoven.vercel.app and api.thoven.co, dogfood accounts only. thoven.co stays on Replit 1.0.

This path covers both repos in one run. The backend goes first. The frontend only moves after the backend is live on its SHA.

## Steps

Stop at the first failure and report it with its output. Three steps are **stops**: show Andres the exact command and wait for Andres's "go".

1. **Production exists.**

   ```bash
   render services -o json --confirm | jq -r '.[] | .service? // empty | select(.name=="thoven-api" or .name=="thoven-worker") | "\(.name) \(.id) \(.branch)"'
   ```

   Done when both names print with branch `release/2.0`. Hold their IDs for later steps. No output means the production services do not exist yet (THV-703): stop and tell Andres there is no 2.0 production to deploy to.

2. **Pick the SHAs.** For each repo, the SHA to promote is the one staging runs now. Read it from `render deploys list srv-dao470bm8hqs73d71sh0 -o json --confirm | jq -r '.[0].commit.id'` (backend) and `curl -s https://staging.thoven.co/api/version | jq -r .sha` (frontend). A repo with nothing new since the last promote (`git rev-parse origin/release/2.0` already equals the SHA) skips its half.

3. **Each SHA is staging-green.** Run steps 2 to 5 of `references/staging-2.0.md` on it, unless that report already exists for this exact SHA in this session. Done when both repos report staging-green.

4. **Each SHA fast-forwards.** In each repo:

   ```bash
   git fetch origin release/2.0 feature/teacher-2.0
   git merge-base --is-ancestor origin/release/2.0 <sha> && git merge-base --is-ancestor <sha> origin/feature/teacher-2.0 && echo fast-forward
   ```

   Done when it prints `fast-forward`. No output means `release/2.0` holds a commit that `feature/teacher-2.0` lacks: stop and tell Andres. Promotion never merges, cherry-picks, or force-pushes.

5. **Show the plan.** One block listing both SHAs, the proof from step 3, and the commands of steps 6, 7 and 9 with the SHAs and service IDs filled in.

6. **Stop: promote the backend.** After Andres's go, in the backend repo:

   ```bash
   git push origin <be-sha>:refs/heads/release/2.0
   ```

   Git refuses anything but a fast-forward. Nothing deploys yet: `thoven-api` and `thoven-worker` have auto-deploy off.

7. **Stop: deploy the backend.** After Andres's go, follow "Deploy a SHA" in the Render runbook: `thoven-api` first, and only after it is live, `thoven-worker`, both on `<be-sha>`. The runbook's checks end the step: both services `live` on `<be-sha>`, `https://api.thoven.co/health` reporting a `revision.sha` that is a prefix of it, and `https://api.thoven.co/up` answering `200`. A refused or failed web deploy ends the whole path here, with the worker untouched. Read "When the deploy is refused" in the runbook.

8. **Backend smoke.** From a backend checkout of `<be-sha>`, with a dogfood teacher's JWT (THV-707 accounts, never a real teacher):

   ```bash
   export SMOKE_TEACHER_TOKEN=$(curl -s -D - -o /dev/null -X POST https://api.thoven.co/api/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d "{\"user\":{\"email\":\"$GHOST_TEACHER_EMAIL\",\"password\":\"$GHOST_TEACHER_PASSWORD\"}}" \
     | awk 'tolower($1)=="authorization:"{print $3}' | tr -d '\r')
   SMOKE_HOST=https://api.thoven.co bundle exec rake deploy:smoke
   ```

   Done when it exits 0. If the dogfood accounts are not loaded, report the smoke as not run and why. A failure here is a rollback decision for Andres (runbook, "Roll back").

9. **Stop: promote the frontend.** After Andres's go, in the frontend repo:

   ```bash
   git push origin <fe-sha>:refs/heads/release/2.0
   ```

   Vercel builds it for production, about 4 minutes. Staging's build is not reused, because the frontend bakes its API host and keys in at build time.

10. **Frontend runs the SHA.**

    ```bash
    curl -s https://thoven.vercel.app/api/version
    vercel ls thoven --prod
    ```

    Done when `sha` equals `<fe-sha>` and `ref` is `release/2.0`. Re-run the curl each minute while the newest `vercel ls` row reads `Building`. A row reading `Error`, or the old SHA after 15 minutes, stops the path: report it to Andres with the `vercel ls` output.

11. **Ghost harness.** From the frontend repo, with the THV-707 dogfood accounts in the environment (`GHOST_PARENT_EMAIL` and the rest, as `e2e/ghost/target.ts` lists):

    ```bash
    GHOST_TARGET=ghost npm run test:ghost
    ```

    Done when no test fails. Report every skip with the variable it names.

12. **Report.** Per repo: the SHA, the proof from steps 7 and 10, and each gate's result. Say "production runs `<sha>`" only for a repo whose proof passed.

## Changelog

2.0 production stamps no version before launch. Each PR carries its own `[Unreleased]` entry.

## The Render runbook

From the frontend repo: `docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md`. From the backend repo:

```bash
git -C ~/thoven/frontend fetch origin feature/teacher-2.0
git -C ~/thoven/frontend show origin/feature/teacher-2.0:docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md
```
