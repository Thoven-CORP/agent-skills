# Publish: production ("deploy to production", a hotfix, a rollback)

Production moves only through `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh`, called `promote.sh` below. It is not on `PATH`: type the full path every time, including for the commands it prints. Run it with no arguments for its usage. It needs `render login` done, and `vercel`, `neonctl`, `jq` and `ruby` installed. A refusal about `autoAssignCustomDomains` is Andres's to fix in Vercel. It moves thoven.co (Vercel `thoven`) and api.thoven.co (Render `thoven-api`, then `thoven-worker`) to SHAs already on `main`, and it holds the checks: the lock, the pinned SHAs, the migration policy, the Neon snapshot, the API health gate, and the build it promotes. Production shows exactly what staging already showed.

`plan` pins every SHA in a release file and prints a release ID. Every later step names that ID, so a go on a step binds exactly what `plan` printed. Only one release is open at a time.

Its progress and done lines start with `== ` and show SHAs as their first 9 characters. Any line starting `REFUSED:` or `FAILED at line` stops the path. Report it with its output. A refusal names its own undo when there is one. Nothing more runs until Andres decides, and `promote.sh abort <id>` (full path) closes the release without a tag when Andres drops it.

## Steps

1. **Show the changelog, then pick the SHAs.** List the range's PRs per repo with `git -C <repo> log --oneline --first-parent <last prod tag>..origin/main`. Read each PR's body and the Linear tickets its commits cite, never its title alone, and write the **changelog list**: a Frontend and a Backend heading, then one bullet per PR with its PR number and ticket ids and four parts: in plain English, what a teacher, parent or student will notice (a PR nobody would notice gets "no user-facing change"); its bucket from `~/.agents/skills/dogfood/references/changelog-buckets.md`; the migrations it adds (`gh pr view <number> --json files -q '.files[].path' | grep db/migrate`); and its proof, which is the PR's test evidence, a qa-flow verdict link, or "staging gates only". PRs write no release notes, so nothing is ever missing from the list; after the promote, step 11 publishes it as a GitHub Release on the `prod/` tag. Then pick the SHAs. A normal promote takes what staging runs now: `plan` with no `--be` or `--fe` reads it, so bring staging's frontend to the tip of `main` first (`references/staging.md` step 4). A hotfix merges its PR into `main` first (`references/staging.md` step 0, "Stop: merge the PR"), then pins only the half that changed: `--be <sha> --fe keep`, or `--fe <sha> --be keep`, where `<sha>` is the merge commit (`gh pr view <number> --json mergeCommit -q .mergeCommit.oid`). Pinning it also ships every unpromoted commit before it on `main`: list them in the plan with `git -C <repo> log --oneline <from>..<sha>`. Done when every PR in the range has its bullet in the changelog list and you hold the exact `plan` command.

2. **Plan the release.** Run step 7's accounts check first (`accounts-loaded`), so a missing-accounts gap is in the plan. Then:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh plan [--be <sha>|keep] [--fe <sha>|keep]
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh status
   ```

   `plan` prints the release ID, backend and frontend as `from -> to`, the migrations it will run, the frontend build it found or started, and under `next, one go each:` the remaining commands in order. `status` prints the release file, with the full SHAs in `.be.to` and `.fe.to`. Done when `plan` printed a release ID.

3. **Each SHA is staging-green.** Run steps 2 to 5 of `references/staging.md` on each SHA that changes, unless that report already exists for this exact SHA in this session. Done when each changed repo reports staging-green. A gate that could not run (missing accounts, a skipped test) is not green: carry it into the plan in step 4.

4. **Show the plan.** Show Andres one block: the changelog list from step 1 first, then the `plan` output, the staging proof from step 3, and every gate that did not run and why. A gap is also any bullet in the FE user-visible or FE×BE bucket, or one that touches money, an upload, a job or email, or a migration, whose proof is "staging gates only": the staging gates exercise none of them. Name each one and offer its qa-flow release pass on staging (qa-flow, "Release pass"). A go on the plan authorizes none of the commands after it, and accepts only the gaps it lists: name each gap again at each stop. Done when Andres has the block.

5. **Stop: take the snapshot.** Only when `plan` listed migrations. After Andres's go:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh snapshot <id>
   ```

   Done when it prints `snapshot <name> of <endpoint>`. `backend` refuses a snapshot older than two hours, so run it right before step 6. The snapshot deletes itself 30 days after creation, because `snapshot` sets the branch's `expires_at`.

6. **Stop: promote the backend.** After Andres's go, in the background, because it can wait 30 minutes:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh backend <id>
   ```

   It deploys `thoven-api`, waits for api.thoven.co to report the SHA healthy, then deploys `thoven-worker`. Done when it prints `backend on <sha9> (api healthy, worker live)`. An unchanged backend deploys nothing and only runs the health gate. It then refuses unless Daily's production webhook (`https://api.thoven.co/webhooks/daily`) is ACTIVE, and prints the reactivation command for Andres to run; the script never reactivates it.

7. **Backend smoke.** From a detached backend checkout of `<be-sha>` (`git -C ~/thoven/backend worktree add --detach ~/thoven/backend-publish-<be-sha7> <be-sha>`, then `bundle install` in it), with a dogfood teacher's JWT. The dogfood accounts are THV-707's, never a real teacher:

   ```bash
   set -a; . ~/thoven/.secrets/thoven-prod.env; set +a
   test -n "$GHOST_TEACHER_EMAIL" && test -n "$GHOST_TEACHER_PASSWORD" && echo accounts-loaded
   export SMOKE_TEACHER_TOKEN=$(jq -n --arg e "$GHOST_TEACHER_EMAIL" --arg p "$GHOST_TEACHER_PASSWORD" '{user:{email:$e,password:$p}}' \
     | curl -s -D - -o /dev/null -X POST https://api.thoven.co/api/v1/auth/login -H 'Content-Type: application/json' -d @- \
     | awk 'tolower($1)=="authorization:"{print $3}' | tr -d '\r')
   SMOKE_HOST=https://api.thoven.co bundle exec rake deploy:smoke
   ```

   Done when `accounts-loaded` printed and `deploy:smoke` exits 0.

   **Stop: release without smoke.** Only when the accounts were missing or the smoke failed. Tell Andres which, with the output. A failed smoke is also a rollback decision (section "Roll back"). Continue to step 8 only after Andres says "Go: release without smoke". This go does not cover step 8.

8. **Stop: promote the frontend.** After Andres's go, in the background:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh frontend <id>
   ```

   It promotes Vercel's staged production build of `<fe-sha>`. When `plan` started that build, it waits for it; if that build fails, it stops without promoting, and running `frontend` again builds a fresh one. It builds one first (about 5 minutes) when none is newer than the last production env change. Done when it prints `thoven.co serves <sha9>` or `thoven.co already serves <sha9>`. A `canceled` build means `vercel-ignore-build.sh` skipped a docs-only commit: tell Andres, and plan again with the last code commit.

9. **Production harness.** From a detached frontend checkout of `<fe-sha>` (`git -C ~/thoven/frontend worktree add --detach ~/thoven/frontend-publish-<fe-sha7> <fe-sha>`, then `pnpm install --frozen-lockfile` in it), with `thoven-prod.env` loaded as in step 7. Use the read-only `production` target (`e2e/ghost/target.ts`: thoven.co and api.thoven.co, `writes: false`, which no env var can change). The retired `ghost` target refuses to run.

   ```bash
   GHOST_TARGET=production pnpm run test:ghost
   ```

   Done when `.stats.unexpected` is `0`, the skip diff below prints nothing, and the database check after it exits 0. The expected skips are the staging browser path's two tests, the two retired record-write tests and the admin job probe (`production is read-only`):

   ```bash
   jq -r '.stats.unexpected' test-results/ghost.json
   diff <(jq -r '[.. | objects | select(has("specs")) | .specs[] | select(any(.tests[]; .status == "skipped")) | .title] | sort | .[]' test-results/ghost.json) - <<'SKIPS'
GCS round-trip: mint, PUT, download byte-identical, purge
a teacher signs in and the schedule loads upcoming lessons with zero CORS errors
intro call booking is created, then reversed
job: an admin probe is enqueued, then thoven-worker performs it
the frontend serves without a Vercel login wall
SKIPS
   ```

   Then check the production database, read-only, with `<deploy-utc>` the UTC time step 6 printed its done line:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/prod-db-check.sh <deploy-utc>
   ```

   It confirms every migration at the live backend SHA is applied, the email ledger has a row for each mail sent since the deploy, no job failed since the deploy, and the 15-minute `LessonReminderJob` ran. Exit 3 means the deploy is under 16 minutes old: rerun it after the time its `WAIT` line names. It fetches the connection string from `neonctl` on every run, as `promote.sh` does, so it needs no stored password. Exit 2 with `cannot fetch the production connection string` means `neonctl` is signed out: run `neonctl auth`, then rerun. When it still cannot connect, run the same four queries read-only through the Neon plugin (`run_sql` on project `dry-sound-31987419`), report them as the plugin's results rather than the script's, and wait for Andres before treating the check as green.

   **Stop: harness failed or skipped.** Only when a test failed, the skip diff printed a line, or the database check exited 1. Tell Andres, with each failure and each unexpected skip's reason. Production already runs the SHA, so this is a rollback decision for Andres (section "Roll back").

10. **Stop: tag the release.** After Andres's go:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh tag <id>
   ```

   It checks both services and thoven.co run the pinned SHAs, refuses unless Daily's production webhook is ACTIVE, then pushes `prod/YYYY-MM-DD-N` to both repos and closes the release. Done when it prints `tagged prod/<date>-<n>; release <id> closed`. A rollback can only return to a SHA with a `prod/*` tag, so an untagged release is not a rollback target.

11. **Report.** Publish the changelog list from step 1 as a GitHub Release on the new tag in each repo: `gh release create prod/<date>-<n> --repo Thoven-CORP/<backend-remote|frontend-remote> --title prod/<date>-<n> --notes "<that repo's part of the list>"`. A repo that did not move gets a one-line release saying so and naming the other repo's release. No PR is opened for release notes. Then report the changelog list, then per repo: the SHA, the `promote.sh` line that proved it, and the tag, then the Checks table (SKILL.md, "Rules on every path"), with the tick list's items ticked. Say "production runs `<sha>`" only for a repo whose step printed its done line. Done when Andres has the report.

## Roll back

Andres declares a rollback. An agent proposes one when production went live on a SHA and then misbehaved. A refused or failed step needs no rollback, because the previous deploy kept serving, unless its `REFUSED:` line names an undo: that undo is the rollback plan. The target is the SHA the bad release moved from, which its tag message names as `from -> to` (`git -C <repo> fetch origin --tags && git -C <repo> tag -n6 -l 'prod/*'`). Only a SHA with a `prod/*` tag qualifies.

1. **Stop: plan the rollback.** Show Andres the command with the target filled in, and wait for the go:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh plan --rollback --fe <sha>|keep --be <sha>|keep
   ```

   Done when it prints the release ID with `(ROLLBACK: frontend first)`. It refuses when the backend range holds migrations. `--schema-stays` overrides that only when the older code runs on the newer schema, which is Andres's call: show Andres the migration list and wait.

2. **Stop: roll back the frontend.** After Andres's go: `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh frontend <id>`. A build that served production before goes back through Vercel's rollback, because Vercel refuses to promote a deployment twice; a build that never served is promoted. Done when it prints `thoven.co serves <sha9>`, or `thoven.co already serves <sha9>` when the frontend did not move.

3. **Stop: roll back the backend.** After Andres's go: `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh backend <id>`. Done when it prints `backend on <sha9> (api healthy, worker live)`.

4. **Checks after the rollback.** Run the backend smoke of step 7 and the harness and database check of step 9 again, each on a checkout of the SHA it now serves. Done when all three pass.

5. **Stop: tag the rollback.** After Andres's go: `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh tag <id>`. Done when it prints `tagged prod/<date>-<n>; release <id> closed`.

The fix goes into `main` as a PR and reaches production through a normal promote.

## Changelog

Production stamps no version. Release notes live on GitHub Releases, one per `prod/` tag in each repo, written by step 11 with `gh release create`. Step 1 synthesises the list from the merged PRs and their Linear tickets. Neither repo keeps a `CHANGELOG.md`: when every PR edited its `[Unreleased]` block it was in 25 of 43 merge conflicts from 2026-10-08 to 2026-11-08, and once only `/publish` wrote it, each release still cost a docs-only PR and a merge-queue run (Andres, 2026-11-09). The retired files point at Releases; their history stays in git.

## Straight through

A hotfix, or any release Andres asks for with "skip the ceremony", "straight through" or "no go's", runs Steps 1 to 11 with no stop between them. Andres's request is the go for each Stop of this one release. It does not carry to the next release.

1. **Read the release against the last one.** Do step 1, changelog first. Run `plan` (step 2) and read its output against the last `prod/*` tag. Note which halves move, whether migrations are listed, and what the commits are (`git -C <repo> log --oneline --first-parent <last prod tag>..<sha>`). From that, name the steps this release needs:
   - Migrations listed: take the snapshot (step 5) right before the backend.
   - Backend unchanged: `backend` still runs, because it is the API health gate and the Daily webhook check.
   - The range's tickets owe a backfill or rake task (from the Pitfalls line on owed steps): run it as a numbered step before the harness.
2. **Staging-green, the short form.** Confirm staging serves each SHA that changes. Use the latest `thoven-staging` deployment's commit (`/vercel-cli`) and the staging Render deploy (`/render-monitor`), plus green required CI on the merge commit. A run of `staging.md` already done in this session for the same SHA also counts.
3. **Promote.** Run steps 5 to 10 in order, without waiting between them. Run the backend smoke (step 7) and the production harness (step 9) on this machine.
4. **Stop only for these.** Show Andres the output and wait:
   - a `REFUSED:` or `FAILED at line` line, including a refusal whose named fix writes outside this release (a Neon branch, a webhook, an env var);
   - a smoke or harness failure that repeats on one rerun (a single network timeout gets that one rerun);
   - an unexpected skip in the harness diff;
   - a Stop the release reached that the read in step 1 did not foresee.
5. **Report.** Do step 11 once, at the end, and list the bullets step 4 would have named as gaps. They never stop this path.
