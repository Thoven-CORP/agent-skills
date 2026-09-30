# Publish: 2.0 staging

Staging deploys itself. Merging a PR into `main` rebuilds staging in both repos:

- frontend: Vercel project `thoven-staging` builds the new commit and serves staging.thoven.co,
- backend: Render `thoven-api-staging` and `thoven-worker-staging` deploy the new commit. The web service runs `bin/controlled-migrate` before it goes live.

On this path `/publish` pushes nothing and deploys nothing. It proves staging runs the SHA and runs the staging gates on it. A SHA that passes every step here is **staging-green**, the only kind `references/production-2.0.md` promotes.

## Steps

0. **Stop: merge the PR.** Only when the PR is not merged yet. Merging needs Andres's "merge it" for that PR (see "Who does what" in the Render runbook). Done when `gh pr view <number> --json state -q .state` prints `MERGED`.

Run each step in the repo it names. Steps 1 to 4 check each repo that changed. Step 5 runs in full every time, because its gates exercise both halves. Stop at the first failure and report it with its output.

1. **Name the SHA.** In each repo that changed, with `<repo>` set to `~/thoven/backend` or `~/thoven/frontend`:

   ```bash
   git -C <repo> fetch origin main
   git -C <repo> rev-parse origin/main
   ```

   Done when both commands exit 0 and you hold one full SHA per repo.

2. **CI is green on that SHA.**

   ```bash
   gh run list --workflow CI --branch main --commit <sha> --json status,conclusion,url
   ```

   Done when a run shows `completed` and `success`. An empty list means CI has not started yet: wait 30 seconds and re-run, for up to 15 minutes. An empty list is never a failure and never green. `in_progress` means wait and re-run the command. `failure` stops the path.

   **Stop: CI never started.** Only when the list is still empty after 15 minutes, for example on a `[skip ci]` commit. Tell Andres. The SHA is not staging-green without CI.

3. **Backend: Render runs the SHA.** Service IDs: the Render runbook's services table.

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

   Done when `sha` equals the SHA and `ref` is `main`.

5. **Staging gates on the SHA.** From a backend checkout of the backend SHA (`git -C ~/thoven/backend worktree add --detach ~/thoven/backend-publish-<sha7> <sha>`, then `bundle install` in it). `bin/dogfood-staging` needs no environment. The smoke teacher's login lives in `~/thoven/.secrets/staging.env` as `STAGING_SMOKE_TEACHER_EMAIL` and `STAGING_SMOKE_TEACHER_PASSWORD`. Never print either value.

   ```bash
   set -a; . ~/thoven/.secrets/staging.env; set +a
   test -n "$STAGING_SMOKE_TEACHER_EMAIL" && test -n "$STAGING_SMOKE_TEACHER_PASSWORD" && echo smoke-teacher-loaded
   ```

   **Stop: smoke teacher missing.** Only when no `smoke-teacher-loaded` line printed: the file does not hold the smoke teacher yet. Tell Andres. The SHA is not staging-green until the smoke runs. With the teacher loaded:

   ```bash
   bin/dogfood-staging
   export SMOKE_TEACHER_TOKEN=$(jq -n --arg e "$STAGING_SMOKE_TEACHER_EMAIL" --arg p "$STAGING_SMOKE_TEACHER_PASSWORD" '{user:{email:$e,password:$p}}' \
     | curl -s -D - -o /dev/null -X POST https://thoven-api-staging.onrender.com/api/v1/auth/login -H 'Content-Type: application/json' -d @- \
     | awk 'tolower($1)=="authorization:"{print $3}' | tr -d '\r')
   SMOKE_HOST=https://thoven-api-staging.onrender.com bundle exec rake deploy:smoke
   ```

   From a frontend checkout of `origin/main`, in the same shell so `staging.env` stays loaded. The harness tests the remote sites, so the local commit only supplies the tests:

   ```bash
   GHOST_TARGET=staging pnpm run test:ghost
   ```

   Done when `bin/dogfood-staging` exits 0, `deploy:smoke` exits 0, `.stats.unexpected` is `0`, and the skip diff below prints nothing. Staging has no `GHOST_*` dogfood accounts (they live only in `thoven-prod.env`, THV-707), so the six dogfood flows are the expected staging skips. Two of them are also the retired record-write tests:

   ```bash
   jq -r '.stats.unexpected' test-results/ghost.json
   diff <(jq -r '[.. | objects | select(has("specs")) | .specs[] | select(any(.tests[]; .status == "skipped")) | .title] | sort | .[]' test-results/ghost.json) - <<'SKIPS'
GCS round-trip: mint, PUT, download byte-identical, purge
intro call booking is created, then reversed
parent login returns a JWT and a parent profile
parent socket is welcomed and subscribed to ParentBookingRequestsChannel
student login returns a JWT
teacher login returns a JWT and a teacher profile
SKIPS
   ```

   **Stop: harness skipped a test.** Only when the diff prints a line, such as a skipped job round trip (missing `GHOST_ADMIN_*`) or any skip not in the list. Report each skip with its reason. A skipped test is not a pass.

6. **Report.** One line per repo: SHA, CI run URL, the proof from steps 3 and 4, and each gate's result, with the tick list's items ticked. Say "staging-green" only when every step passed. Done when Andres has the report.

## Changelog

Staging stamps no version. Each PR into `main` carries its own `[Unreleased]` entry.

## The Render runbook

From the frontend repo: `docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md`. From the backend repo:

```bash
git -C ~/thoven/frontend fetch origin main
git -C ~/thoven/frontend show origin/main:docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md
```
