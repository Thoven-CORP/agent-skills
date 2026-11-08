---
name: start-staging
description: Start a deliberate, timed Thoven staging session with selected frontend and backend commits; also check, extend, or stop that session. Use for explicit staging availability requests, separate from merging code or publishing production.
---

# Start staging

Make `https://staging.thoven.co` usable for a bounded testing session. Merging to `main` neither starts staging nor changes the commits a running session serves. Discussing or editing this skill authorizes no provider changes.

Read `~/thoven/backend/docs/deployment/staging-lifecycle.md` before operating, and [the governing staging decision](https://linear.app/thoven/issue/DEP-52/reduce-render-costs-with-smaller-redis-and-on-demand-staging), D4, for current policy. A request to start staging covers ordinary resume, deployment and readiness probes. Migrations, money, COPPA, sends and production keep their own gates.

## Tools

The staging backend sleeps between sessions to save money. Waking it and putting it back to sleep is the only work that needs a Render API key, because Render's CLI and plugin cannot suspend or resume a web service. That work belongs to the **controller**, `~/thoven/backend/bin/staging-lifecycle` on `thoven-mini-ssh`, the one program that reads `RENDER_API_KEY` from the mini's `~/.config/thoven/staging-lifecycle.env`. Everything else runs under the account logins of the CLIs and plugins.

| Work | Tool |
|---|---|
| Read services, deploys, logs, metrics | `render` CLI under `render login`, or `/render-monitor` |
| Deploy a backend SHA | `render deploys create` |
| Run Rails code on staging | a Render one-off job (`render jobs`), read with `render logs` |
| Deploy, inspect or promote the frontend | `vercel` CLI through `/vercel-cli` |
| Wake, sleep, hold, and the job probe | the controller over ssh |

Run controller commands as `ssh thoven-mini-ssh 'set -a; . ~/.config/thoven/staging-lifecycle.env; set +a; ~/thoven/backend/bin/staging-lifecycle <command>'`, so its secrets load on the mini and never pass through your shell. Its tokens stay in that file; print none of them.

The staging resources, as the CLI sees them:

```sh
render services -e evm-dao4703m8hqs73d71rfg -o json --confirm \
  | jq -c '.[] | (.service // .keyValue) | {name, suspended, status, autoDeployTrigger}'
```

`thoven-api-staging` is the combined web service, `thoven-keyvalue-staging` its Key Value, and `thoven-worker-staging` the legacy worker, which stays `suspended`.

**A dead key.** When the controller refuses with `Render rejected RENDER_API_KEY`, the key is revoked or expired. Stop and ask Andres for a new key from Render's Account settings > API keys, placed in that file. `check-key` confirms the replacement with `Render API key: accepted`. While the key is dead the scheduler cannot put staging to sleep, so report whether `thoven-api-staging` is still `not_suspended`.

## Start

1. **Pin the pair.** Fetch both repositories and resolve one full frontend SHA and one full backend SHA, by default each `origin/main`, or the revisions Andres named. Each needs green required CI. A merged SHA without its own run counts when its tree matches the final green PR head; record both SHAs. Keep the pair fixed through startup. If staging is already running the same pair, reuse it; when versions or active holds conflict, confirm the replacement with the session's current user. Done when you hold two full SHAs and their CI evidence.

2. **Prove manual control.** Through the CLI command above: `autoDeployTrigger` is `off` on both services and the legacy worker is `suspended`. Blueprint Auto Sync is off (dashboard only). Through `/vercel-cli`: project `thoven-staging`, scope `andres-3203s-projects`, has no Git deployments, and its backend configuration points at staging. Both Vercel projects share one `vercel.json`, so leave project `thoven` and that file alone. The staging project uses Vercel's Production environment, so `--prod` alone names no project. Any gap is **setup incomplete**: name it and stop, since this skill authorizes no setup. Done when every control is confirmed.

3. **Check migrations.** List the migrations the backend SHA adds over what staging last ran. A resume can build the configured branch and run its pre-deploy migrations even with auto-deploy off. Done when each pending migration is within this request's authorization, or you have stopped on it.

4. **Hold and wake.** On the mini, confirm the expiry scheduler is loaded: `launchctl print "user/$(id -u)/co.thoven.staging-expire"`. After a headless reboot it can be missing: bootstrap its existing reviewed plist and require one successful expiry run before waking. Then through the controller: acquire a hold with a unique `--reason` and save its token, and run `up --hours 4 --apply`, or the requested duration within 1 to 24 hours. A host-guard refusal is resolved through the controller's reviewed setup, never around it. `up` pins no revision: watch any cold-resume deploy with `render deploys list srv-dao470bm8hqs73d71sh0 -o json --confirm` until it ends, and on a health timeout during a build, wait for the build and retry `up` instead of starting a second deploy. Done when `up` prints `combined staging: ready` and you hold the hold token.

5. **Deploy the backend.** Skip this when the cold-resume deploy is already `live` at the pinned SHA. Otherwise:

   ```sh
   render deploys create srv-dao470bm8hqs73d71sh0 --commit <backend-full-sha> --wait --confirm -o json
   ```

   Done when the deploy is `live` at that SHA, `https://thoven-api-staging.onrender.com/up` answers 200, `/health` `revision.sha` matches, and the controller's `probe --apply` prints `worker execution readiness: verified on thoven-api-staging`. Migrations run only in the web pre-deploy step.

6. **Deploy the frontend.** `~/thoven/agent-skills/skills/dev/publish/scripts/staging-frontend.sh <frontend-full-sha>` builds the commit from GitHub, puts it on staging and waits for `staging.thoven.co/api/version` to serve it. Done when it prints `staging serves <sha9>` or `staging already serves <sha9>`.

   When the session needs a candidate checked before the domain moves, deploy a clean checkout of the SHA with `vercel deploy <checkout> --project thoven-staging --scope andres-3203s-projects --prod --skip-domain`, check it through `/vercel-cli`, then `vercel promote <candidate-url> --cwd <staging-linked-checkout> --scope andres-3203s-projects`. Record the previous staging deployment first and promote it back if the browser check in step 7 fails. A protected candidate URL, or one outside Rails CORS, is checked through authenticated CLI access, never by widening CORS.

7. **Verify and hand over.** On `staging.thoven.co`: `/api/version` shows the frontend SHA, an existing staging account signs in in a browser, and an API-backed screen loads. A frontend `/api/health` 200 does not reach Rails. Then release this operation's hold through the controller (`release-hold --token <token> --apply`). QA or release work keeps its own hold. Done when you report the URL, both SHAs, the session expiry with timezone, and any holds still open.

## Check, extend, stop

- **Check:** read-only, so it works even with a dead key. Run the CLI resource command above, `curl -s https://staging.thoven.co/api/version` and `curl -s https://thoven-api-staging.onrender.com/health | jq .revision`, and read the session and holds on the mini: `cat ~/.local/state/thoven/staging-lifecycle/session.json; ls ~/.local/state/thoven/staging-lifecycle/holds`. A status question never wakes staging.
- **Extend:** for a running session on the selected pair, run the controller's `up --hours N --apply`, confirm both versions are unchanged, and report the new expiry. A suspended staging takes the full start path. Extending deploys nothing newer.
- **Stop:** coordinate with anyone using staging, then the controller's `down --apply`. It honours every hold and drain check; release only holds this operation owns.

The scheduler on the mini tries `expire --apply` every five minutes and puts staging to sleep once the session ends, unless a hold, a running deploy or claimed jobs block it. It needs the mini up, its task loaded and a live key; while any of them is missing, staging keeps running and billing. Sleep leaves the Vercel frontend reachable with its backend features down.

## Stop conditions

Stop on failed CI, an identity mismatch, a controller refusal, an unexpected migration, a failed deploy or a failed smoke check. Inspect a timed-out mutation before retrying it. Watch startup for at most 20 minutes per provider, then report what is running and what blocks it. Keep the previous frontend deployment until the candidate passes. Call staging ready only with the selected pair, the API-backed browser check and a recorded expiry; otherwise report a partial startup as partial. Production commands are outside this skill.
