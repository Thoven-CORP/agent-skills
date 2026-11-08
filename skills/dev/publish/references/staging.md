# Publish: staging proof

The Vercel `thoven-staging` project has no Git link, so merges do not deploy it; step 4 puts the frontend SHA there. Backend staging is one combined Render service, `thoven-api-staging`, with commit auto-deploy off. Blueprint Auto Sync must separately be set to No and verified before the combined-staging PR merges; otherwise a Blueprint change can still redeploy the service. Keep Auto Sync off and sync reviewed configuration explicitly under a deployment hold. Service auto-deploy off alone is not a no-deploy guarantee. See [Render Blueprint sync](https://render.com/docs/infrastructure-as-code#disabling-automatic-sync). The old `thoven-worker-staging` stays suspended and is never resumed by the lifecycle command; removing its Blueprint declaration does not suspend it.

Before these gates, explicitly deploy the reviewed backend `main` SHA using backend `docs/deployment/staging-lifecycle.md`: acquire a hold, resume/probe the currently deployed revision, deploy the pinned SHA to the running web service, then verify actual revision and a fresh execution probe. The legacy worker must stop before the first combined cutover. Render can overlap old/new combined instances temporarily during deploys and maintenance; Solid Queue database coordination supports that handoff. This is one async runner per instance, not a global singleton or an exactly-once side-effect guarantee. Controlled migrations remain web preDeploy only.

On this path `/publish` does not deploy staging. It proves the explicitly selected staging revision and gates. A SHA that passes every step here is **staging-green**, the only kind `references/production.md` promotes.

## Availability hold

Before QA, use the backend's `docs/deployment/staging-lifecycle.md` to acquire a hold on `thoven-mini-ssh`, run `up --apply`, and verify its combined web and async runner. Wake requires a private `STAGING_ADMIN_TOKEN` and a real job probe before it reports ready. A four-hour session expires automatically unless renewed; QA must maintain its own bounded hold throughout active work. Release the hold when the checks finish. QA holds and release holds are separate.

`promote.sh plan` acquires a shared staging hold before provider requests. Each subsequent release command renews it for 24 hours. Selecting staging during planning also requires the combined-service execution probe; an absent token, sleeping service, live legacy worker or failed probe blocks the plan and gives explicit deploy/wake/probe instructions. Production planning never silently deploys or wakes staging. The mini must have the matching backend lifecycle command at `~/thoven/backend/bin/staging-lifecycle`. Install that backend change before adopting this promotion change. An unreachable mini or a missing lifecycle command blocks release work. A release idle for more than 24 hours needs a new hold before further QA. Only enable staging shutdown after the companion integration and hold round trip have been verified as described in the backend runbook.

## Steps

0. **Stop: merge the PR.** Only when the PR is not merged yet. Its auto-merge, armed when it opened, lands it on green `CI` with no go from Andres; arm it with the thoven-law.md method if it is not armed. Done when `gh pr view <number> --json state -q .state` prints `MERGED`.

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
   # On the mini, with its private staging admin token:
   ~/thoven/backend/bin/staging-lifecycle probe --apply
   curl -s https://thoven-api-staging.onrender.com/health | jq '.revision'
   ```

   Done when the combined web service shows `status` `live` with `commit` equal to the SHA, `revision.sha` is a prefix of it, the legacy worker is suspended, and the actual probe succeeds on `thoven-api-staging` with process kind `Worker`. A merge alone is not deployment evidence. A deploy still `build_in_progress`, `pre_deploy_in_progress`, or `update_in_progress` means wait and re-run; after 20 minutes, report it as stuck. A `pre_deploy_failed` status means `bin/controlled-migrate` refused: read the refusal section of the Render runbook (below).

4. **Frontend: put the SHA on staging.** Run it under the same staging hold as the backend deploy:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/staging-frontend.sh <frontend sha from step 1>
   ```

   Step 1's SHA is the tip of `main` (the script's default when given no SHA), so every merged commit reaches staging and the release plan that reads it. It builds the commit from GitHub, never from a local tree, so untracked and ignored files stay out, and it waits until staging serves the commit. Done when it prints `staging serves <sha9>` or `staging already serves <sha9>`, and `curl -s https://staging.thoven.co/api/version` shows that `sha` with `ref` `main`.

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

6. **Report.** One line per repo: SHA, CI run URL, and the proof from steps 3 and 4, then the Checks table (SKILL.md, "Rules on every path"), with the tick list's items ticked. Say "staging-green" only when every step passed. Done when Andres has the report.

## Run code on staging

`render ssh` needs a TTY and a registered key, so it fails from an agent. Run Rails code on staging as a Render one-off job instead: base64 the script into `bin/rails runner`, start the job against `thoven-api-staging`, and read its output with `render logs -r <job id>`. Print no emails or secrets from the script.

## Changelog

Staging stamps no version. Each PR into `main` carries its own `[Unreleased]` entry.

## The Render runbook

From the frontend repo: `docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md`. From the backend repo:

```bash
git -C ~/thoven/frontend fetch origin main
git -C ~/thoven/frontend show origin/main:docs/Platform/projects/platform-upgrade-and-hosting/RUNBOOK_RENDER.md
```
