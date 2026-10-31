# Publish: 2.0 production ("deploy to production", a 2.0 hotfix, a rollback)

Production moves only through `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh`, called `promote.sh` below. It is not on `PATH`: type the full path every time, including for the commands it prints. Run it with no arguments for its usage. It needs `render login` done, and `vercel`, `neonctl`, `jq` and `ruby` installed. A refusal about `autoAssignCustomDomains` is Andres's to fix in Vercel. It moves thoven.co (Vercel `thoven`) and api.thoven.co (Render `thoven-api`, then `thoven-worker`) to SHAs already on `main`, and it holds the checks: the lock, the pinned SHAs, the migration policy, the Neon snapshot, the API health gate, and the build it promotes. Production shows exactly what staging already showed.

`plan` pins every SHA in a release file and prints a release ID. Every later step names that ID, so a go on a step binds exactly what `plan` printed. Only one release is open at a time.

Its progress and done lines start with `== ` and show SHAs as their first 9 characters. Any line starting `REFUSED:` or `FAILED at line` stops the path. Report it with its output. A refusal names its own undo when there is one. Nothing more runs until Andres decides, and `promote.sh abort <id>` (full path) closes the release without a tag when Andres drops it.

## Steps

1. **Pick the SHAs.** Start with the changelog. List the range's PRs per repo with `git -C <repo> log --oneline --first-parent <last prod tag>..origin/main`, and check that each one wrote its `[Unreleased]` entry in `CHANGELOG.md`. A PR labelled `skip-changelog` needs none. Add the missing entries in one PR into `main` and pin that merge, so the release ships its own notes. Then pick the SHAs. A normal promote takes what staging runs now: `plan` with no `--be` or `--fe` reads it. A hotfix merges its PR into `main` first (`references/staging-2.0.md` step 0, "Stop: merge the PR"), then pins only the half that changed: `--be <sha> --fe keep`, or `--fe <sha> --be keep`, where `<sha>` is the merge commit (`gh pr view <number> --json mergeCommit -q .mergeCommit.oid`). Pinning it also ships every unpromoted commit before it on `main`: list them in the plan with `git -C <repo> log --oneline <from>..<sha>`. Done when every PR in the range has its changelog entry and you hold the exact `plan` command.

2. **Plan the release.** Run step 7's accounts check first (`accounts-loaded`), so a missing-accounts gap is in the plan. Then:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh plan [--be <sha>|keep] [--fe <sha>|keep]
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh status
   ```

   `plan` prints the release ID, backend and frontend as `from -> to`, the migrations it will run, the frontend build it found, and under `next, one go each:` the remaining commands in order. `status` prints the release file, with the full SHAs in `.be.to` and `.fe.to`. Done when `plan` printed a release ID.

3. **Each SHA is staging-green.** Run steps 2 to 5 of `references/staging-2.0.md` on each SHA that changes, unless that report already exists for this exact SHA in this session. Done when each changed repo reports staging-green. A gate that could not run (missing accounts, a skipped test) is not green: carry it into the plan in step 4.

4. **Show the plan.** Show Andres one block: the `plan` output, the staging proof from step 3, and every gate that did not run and why. A go on the plan authorizes none of the commands after it, and accepts only the gaps it lists: name each gap again at each stop. Done when Andres has the block.

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

   It promotes Vercel's staged production build of `<fe-sha>`, or builds one first (about 4 minutes) when none is newer than the last production env change. Done when it prints `thoven.co serves <sha9>` or `thoven.co already serves <sha9>`. A `canceled` build means `vercel-ignore-build.sh` skipped a docs-only commit: tell Andres, and plan again with the last code commit.

9. **Production harness.** From a detached frontend checkout of `<fe-sha>` (`git -C ~/thoven/frontend worktree add --detach ~/thoven/frontend-publish-<fe-sha7> <fe-sha>`, then `pnpm install --frozen-lockfile` in it), with `thoven-prod.env` loaded as in step 7. Use the read-only `production` target (`e2e/ghost/target.ts`: thoven.co and api.thoven.co, `writes: false`, which no env var can change). The retired `ghost` target refuses to run.

   ```bash
   GHOST_TARGET=production pnpm run test:ghost
   ```

   Done when `.stats.unexpected` is `0` and the skip diff below prints nothing. The expected skips are the staging browser path's two tests, the two retired record-write tests and the admin job probe (`production is read-only`):

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

   **Stop: harness failed or skipped.** Only when a test failed, or the skip diff printed a line. Tell Andres, with each failure and each unexpected skip's reason. Production already runs the SHA, so this is a rollback decision for Andres (section "Roll back").

10. **Stop: tag the release.** After Andres's go:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh tag <id>
   ```

   It checks both services and thoven.co run the pinned SHAs, refuses unless Daily's production webhook is ACTIVE, then pushes `prod/YYYY-MM-DD-N` to both repos and closes the release. Done when it prints `tagged prod/<date>-<n>; release <id> closed`. A rollback can only return to a SHA with a `prod/*` tag, so an untagged release is not a rollback target.

11. **Report.** Per repo: the SHA, the `promote.sh` line that proved it, the tag, and each gate's result, with the tick list's items ticked. Say "production runs `<sha>`" only for a repo whose step printed its done line. Done when Andres has the report.

## Roll back

Andres declares a rollback. An agent proposes one when production went live on a SHA and then misbehaved. A refused or failed step needs no rollback, because the previous deploy kept serving, unless its `REFUSED:` line names an undo: that undo is the rollback plan. The target is the SHA the bad release moved from, which its tag message names as `from -> to` (`git -C <repo> fetch origin --tags && git -C <repo> tag -n6 -l 'prod/*'`). Only a SHA with a `prod/*` tag qualifies.

1. **Stop: plan the rollback.** Show Andres the command with the target filled in, and wait for the go:

   ```bash
   ~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh plan --rollback --fe <sha>|keep --be <sha>|keep
   ```

   Done when it prints the release ID with `(ROLLBACK: frontend first)`. It refuses when the backend range holds migrations. `--schema-stays` overrides that only when the older code runs on the newer schema, which is Andres's call: show Andres the migration list and wait.

2. **Stop: roll back the frontend.** After Andres's go: `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh frontend <id>`. Done when it prints `thoven.co serves <sha9>`, or `thoven.co already serves <sha9>` when the frontend did not move.

3. **Stop: roll back the backend.** After Andres's go: `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh backend <id>`. Done when it prints `backend on <sha9> (api healthy, worker live)`.

4. **Checks after the rollback.** Run the backend smoke of step 7 and the harness of step 9 again, each on a checkout of the SHA it now serves. Done when both pass.

5. **Stop: tag the rollback.** After Andres's go: `~/thoven/agent-skills/skills/dev/publish/scripts/promote.sh tag <id>`. Done when it prints `tagged prod/<date>-<n>; release <id> closed`.

The fix goes into `main` as a PR and reaches production through a normal promote.

## Changelog

2.0 production stamps no version. Each PR carries its own `[Unreleased]` entry.

## Straight through

A hotfix, or any release Andres asks for with "skip the ceremony", "straight through" or "no go's", runs Steps 1 to 11 with no stop between them. Andres's request is the go for each Stop of this one release. It does not carry to the next release.

1. **Read the release against the last one.** Do step 1, changelog first. Run `plan` (step 2) and read its output against the last `prod/*` tag. Note which halves move, whether migrations are listed, and what the commits are (`git -C <repo> log --oneline --first-parent <last prod tag>..<sha>`). From that, name the steps this release needs:
   - Migrations listed: take the snapshot (step 5) right before the backend.
   - Backend unchanged: `backend` still runs, because it is the API health gate and the Daily webhook check.
   - The range's tickets owe a backfill or rake task (from the Pitfalls line on owed steps): run it as a numbered step before the harness.
2. **Staging-green, the short form.** Confirm staging serves each SHA that changes. Use the latest `thoven-staging` deployment's commit (`/vercel-cli`) and the staging Render deploy (`/render-monitor`), plus green required CI on the merge commit. A run of `staging-2.0.md` already done in this session for the same SHA also counts.
3. **Promote.** Run steps 5 to 10 in order, without waiting between them. Run the backend smoke (step 7) and the production harness (step 9) on this machine.
4. **Stop only for these.** Show Andres the output and wait:
   - a `REFUSED:` or `FAILED at line` line, including a refusal whose named fix writes outside this release (a Neon branch, a webhook, an env var);
   - a smoke or harness failure that repeats on one rerun (a single network timeout gets that one rerun);
   - an unexpected skip in the harness diff;
   - a Stop the release reached that the read in step 1 did not foresee.
5. **Report.** Do step 11 once, at the end.
