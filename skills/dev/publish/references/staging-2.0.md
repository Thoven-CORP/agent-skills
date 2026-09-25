# Publish: 2.0 staging

Staging deploys itself. Merging a PR into `feature/teacher-2.0` rebuilds staging in both repos:

- frontend: Vercel project `thoven-staging` builds the new commit and serves staging.thoven.co,
- backend: Render `thoven-api-staging` and `thoven-worker-staging` deploy the new commit. The web service runs `bin/controlled-migrate` before it goes live.

On this path `/publish` pushes nothing and deploys nothing. It proves staging runs the SHA and runs the staging gates on it. A SHA that passes every step here is **staging-green**, the only kind `references/production-2.0.md` promotes.

## Steps

Run each step in the repo it names. Steps 1 to 4 check each repo that changed. Step 5 runs in full every time, because its gates exercise both halves. Stop at the first failure and report it with its output.

1. **Name the SHA.** In each repo that changed:

   ```bash
   git fetch origin feature/teacher-2.0
   git rev-parse origin/feature/teacher-2.0
   ```

   Done when you hold one full SHA per repo.

2. **CI is green on that SHA.**

   ```bash
   gh run list --workflow CI --branch feature/teacher-2.0 --commit <sha> --json status,conclusion,url
   ```

   Done when a run shows `completed` and `success`. `in_progress` means wait and re-run the command. `failure` stops the path.

3. **Backend: Render runs the SHA.** Service IDs: `thoven-api-staging` is `srv-dao470bm8hqs73d71sh0`, `thoven-worker-staging` is `srv-dao470bm8hqs73d71shg`.

   ```bash
   render deploys list srv-dao470bm8hqs73d71sh0 -o json --confirm | jq '.[0] | {status, commit: .commit.id}'
   render deploys list srv-dao470bm8hqs73d71shg -o json --confirm | jq '.[0] | {status, commit: .commit.id}'
   curl -s https://thoven-api-staging.onrender.com/health | jq '.revision'
   ```

   Done when both services show `status` `live` with `commit` equal to the SHA, and `revision.sha` is a prefix of it. A deploy still `build_in_progress`, `pre_deploy_in_progress`, or `update_in_progress` means wait and re-run; after 20 minutes, report it as stuck. A `pre_deploy_failed` status means `bin/controlled-migrate` refused: read the refusal section of the Render runbook (below).

4. **Frontend: Vercel runs the SHA.**

   ```bash
   curl -s https://staging.thoven.co/api/version
   ```

   Done when `sha` equals the SHA and `ref` is `feature/teacher-2.0`.

5. **Staging gates on the SHA.** From a backend checkout of the backend SHA (`git -C ~/thoven/backend worktree add --detach ~/thoven/backend-publish-<sha7> <sha>`, then `bundle install` in it). `bin/dogfood-staging` needs no environment. The smoke teacher's login lives in `~/thoven/.secrets/staging.env` as `STAGING_SMOKE_TEACHER_EMAIL` and `STAGING_SMOKE_TEACHER_PASSWORD`. Never print either value.

   ```bash
   set -a; . ~/thoven/.secrets/staging.env; set +a
   test -n "$STAGING_SMOKE_TEACHER_EMAIL" && echo smoke-teacher-loaded
   ```

   **Stop: smoke teacher missing.** Only when no `smoke-teacher-loaded` line printed: the file does not hold the smoke teacher yet. Tell Andres. The SHA is not staging-green until the smoke runs. With the teacher loaded:

   ```bash
   bin/dogfood-staging
   export SMOKE_TEACHER_TOKEN=$(jq -n --arg e "$STAGING_SMOKE_TEACHER_EMAIL" --arg p "$STAGING_SMOKE_TEACHER_PASSWORD" '{user:{email:$e,password:$p}}' \
     | curl -s -D - -o /dev/null -X POST https://thoven-api-staging.onrender.com/api/v1/auth/login -H 'Content-Type: application/json' -d @- \
     | awk 'tolower($1)=="authorization:"{print $3}' | tr -d '\r')
   SMOKE_HOST=https://thoven-api-staging.onrender.com bundle exec rake deploy:smoke
   ```

   From a frontend checkout of `origin/feature/teacher-2.0`, in the same shell so `staging.env` stays loaded. The harness tests the remote sites, so the local commit only supplies the tests:

   ```bash
   GHOST_TARGET=staging npm run test:ghost
   ```

   Done when `bin/dogfood-staging` exits 0, `deploy:smoke` exits 0, and the ghost harness reports no failed test. A skipped ghost test names the missing account variable. Report each skip; a skip is not a pass.

6. **Report.** One line per repo: SHA, CI run URL, the proof from steps 3 and 4, and each gate's result. Say "staging-green" only when every step passed.

## Changelog

Staging stamps no version. Each PR into `feature/teacher-2.0` carries its own `[Unreleased]` entry.

## The Render runbook

From the frontend repo: `docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md`. From the backend repo:

```bash
git -C ~/thoven/frontend fetch origin feature/teacher-2.0
git -C ~/thoven/frontend show origin/feature/teacher-2.0:docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md
```
