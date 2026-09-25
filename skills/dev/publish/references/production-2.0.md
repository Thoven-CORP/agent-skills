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

2. **Pick the SHAs.** For each repo, the SHA to promote is the one staging runs now. Read it from `render deploys list srv-dao470bm8hqs73d71sh0 -o json --confirm | jq -r '[.[] | select(.status=="live")][0].commit.id'` (backend) and `curl -s https://staging.thoven.co/api/version | jq -r .sha` (frontend). A repo with nothing new since the last promote (`git rev-parse origin/release/2.0` already equals the SHA) skips its half.

3. **Each SHA is staging-green.** Run steps 2 to 5 of `references/staging-2.0.md` on it, unless that report already exists for this exact SHA in this session. Done when both repos report staging-green. A gate that could not run (missing accounts, a skipped test) is not green: carry it into the plan in step 5.

4. **Each SHA fast-forwards.** In each repo:

   ```bash
   git fetch origin release/2.0 feature/teacher-2.0
   git merge-base --is-ancestor origin/release/2.0 <sha> && git merge-base --is-ancestor <sha> origin/feature/teacher-2.0 && echo fast-forward
   ```

   Done when it prints `fast-forward`. No output means `release/2.0` holds a commit that `feature/teacher-2.0` lacks: stop and tell Andres. Promotion never merges, cherry-picks, or force-pushes.

5. **Show the plan.** One block listing both SHAs, the proof from step 3, every gate that did not run and why, and the commands of steps 6, 7 and 9 with the SHAs and service IDs filled in. A go on a plan with a gate that did not run accepts that gap. Name the gap again at each stop.

6. **Stop: promote the backend.** After Andres's go, from the backend worktree of step 3 (`~/thoven/backend-publish-<be-sha7>`, a detached checkout of `<be-sha>`):

   ```bash
   git push origin <be-sha>:refs/heads/release/2.0
   ```

   Git refuses anything but a fast-forward. Nothing deploys yet: `thoven-api` and `thoven-worker` have auto-deploy off.

7. **Stop: deploy the backend.** After Andres's go, follow "Deploy a SHA" in the Render runbook: `thoven-api` first, and only after it is live, `thoven-worker`, both on `<be-sha>`. The runbook's checks end the step: both services `live` on `<be-sha>`, `https://api.thoven.co/health` reporting a `revision.sha` that is a prefix of it, and `https://api.thoven.co/up` answering `200`. A refused or failed web deploy ends the whole path here, with the worker untouched. Read "When the deploy is refused" in the runbook.

8. **Backend smoke.** From a backend checkout of `<be-sha>` (`git -C ~/thoven/backend worktree add --detach ~/thoven/backend-publish-<be-sha7> <be-sha>`, then `bundle install` in it), with a dogfood teacher's JWT. The dogfood accounts are THV-707's, never a real teacher. THV-707 creates them and names where they are stored. On 2026-09-24 no file in `~/thoven/.secrets/` held them. If `GHOST_TEACHER_EMAIL` is empty in your shell, the accounts are not loaded:

   ```bash
   export SMOKE_TEACHER_TOKEN=$(curl -s -D - -o /dev/null -X POST https://api.thoven.co/api/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d "{\"user\":{\"email\":\"$GHOST_TEACHER_EMAIL\",\"password\":\"$GHOST_TEACHER_PASSWORD\"}}" \
     | awk 'tolower($1)=="authorization:"{print $3}' | tr -d '\r')
   SMOKE_HOST=https://api.thoven.co bundle exec rake deploy:smoke
   ```

   Done when it exits 0. Without the accounts, the smoke did not run: name it at stop 9. A failure here is a rollback decision for Andres (section "Roll back").

9. **Stop: promote the frontend.** After Andres's go, from a detached checkout of `<fe-sha>`, so the pre-push check runs on the code being promoted:

   ```bash
   git -C ~/thoven/frontend worktree add --detach ~/thoven/frontend-publish-<fe-sha7> <fe-sha>
   cd ~/thoven/frontend-publish-<fe-sha7> && npm ci
   git push origin <fe-sha>:refs/heads/release/2.0
   ```

   The frontend's lefthook `pre-push` runs `npm run contract-check`. Never push with `--no-verify` on this path. If it blocks, stop and report its output: the SHA passed CI, so a block means the contract manifest drifted since. Vercel builds it for production, about 4 minutes. Staging's build is not reused, because the frontend bakes its API host and keys in at build time.

10. **Frontend runs the SHA.**

    ```bash
    curl -s https://thoven.vercel.app/api/version
    vercel ls thoven --prod
    ```

    Done when `sha` equals `<fe-sha>` and `ref` is `release/2.0`. Re-run the curl each minute while the newest `vercel ls` row reads `Building`. A row reading `Error`, or the old SHA after 15 minutes, stops the path: report it to Andres with the `vercel ls` output. A newest row reading `Ready` while `/api/version` still shows the old SHA means an earlier rollback holds the domain (section "Roll back"): run `vercel promote <newest-ready-deployment-url> --yes`, which go 3 covers, then re-run the curl.

11. **Ghost harness.** From the frontend worktree of step 9 (the harness tests the remote sites, so any checkout of `<fe-sha>` works), with the THV-707 dogfood accounts loaded as in step 8 (`GHOST_PARENT_EMAIL` and the rest, as `e2e/ghost/target.ts` lists):

    ```bash
    GHOST_TARGET=ghost npm run test:ghost
    ```

    Done when no test fails. Report every skip with the variable it names.

12. **Report.** Per repo: the SHA, the proof from steps 7 and 10, and each gate's result. Say "production runs `<sha>`" only for a repo whose proof passed.

## Roll back

Roll back a repo when its production deploy went live and then misbehaved. A refused or failed deploy needs no rollback: the previous deploy kept serving. Neither rollback moves `release/2.0`.

- **Backend.** Follow "Roll back" in the Render runbook. It stops for Andres's go before the redeploy.
- **Frontend.** Roll it back only when it misbehaves itself, or when it calls backend code the backend rollback removed. After Andres's go:

  ```bash
  vercel ls thoven --prod
  vercel rollback <previous-ready-deployment-url> --yes
  curl -s https://thoven.vercel.app/api/version
  ```

  Done when `sha` is the previous SHA. A rollback turns off Vercel's auto-assignment of the production domain, so later pushes to `release/2.0` build but do not go live. The next promote ends with `vercel promote <new-deployment-url> --yes`, which also turns auto-assignment back on.

After either rollback, run steps 8 and 11 again against the rolled-back SHAs and report them. The fix goes into `feature/teacher-2.0` as a PR and reaches production through a normal promote.

## Changelog

2.0 production stamps no version before launch. Each PR carries its own `[Unreleased]` entry.

## The Render runbook

From the frontend repo: `docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md`. From the backend repo:

```bash
git -C ~/thoven/frontend fetch origin feature/teacher-2.0
git -C ~/thoven/frontend show origin/feature/teacher-2.0:docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md
```
