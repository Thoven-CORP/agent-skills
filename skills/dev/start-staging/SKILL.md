---
name: start-staging
description: Start a deliberate, timed Thoven staging session with selected frontend and backend commits; also check, extend, or stop that session. Use for explicit staging availability requests, separate from merging code or publishing production.
---

# Start staging

Make `https://staging.thoven.co` usable for a bounded testing session. Merging to `main` neither starts staging nor updates an active session's selected versions. Discussing or editing this skill authorizes no provider changes.

## Sources and authority

Read `~/thoven/backend/docs/deployment/staging-lifecycle.md` before operating. The controller is `bin/staging-lifecycle` on backend `main`, and it runs on the laptop: the Mac mini is for heavy local test runs, never for starting or stopping staging (Andres, 2026-11-19). Run it from a backend tree at `main`, or from any branch with `git -C ~/thoven/backend fetch -q origin main && git -C ~/thoven/backend show origin/main:bin/staging-lifecycle | python3 - <command>`. It needs no key file: it uses the laptop's Render CLI login (run `render login` when it refuses) and signs in to staging as the admin saved in `~/thoven/.secrets/staging.env`. It owns fixed resource identities, leases, holds, locking, dependency order and safe shutdown. Reuse it. Read [the governing staging decision](https://linear.app/thoven/issue/DEP-52/reduce-render-costs-with-smaller-redis-and-on-demand-staging), D4, for current policy.

A request to start staging covers ordinary staging resume, deployment and readiness probes. Preserve independent gates for migrations, money, COPPA, sends and production. Inspect pending migrations before wake: Render resume can trigger a build and pre-deploy migrations. Keep credentials in the existing private environment; never print them.

Use installed Render/Vercel CLI help and skills for provider syntax. Older publish instructions saying frontend merges deploy staging describe the former setup, not proof of manual control.

## Tools

Each kind of work has one tool. The controller owns holds, leases and safe shutdown, so waking or sleeping staging through another tool skips them.

| Work | Tool |
| --- | --- |
| Read services, deploys, logs, metrics | `render` CLI after `render login`, or `/render-monitor` |
| Deploy a backend SHA | `render deploys create` (step 4) |
| Run Rails code on staging | a Render one-off job (`render jobs`), read with `render logs` |
| Wake, sleep, hold, release a hold, probe the job runner | the controller, `bin/staging-lifecycle` on the laptop |
| Deploy, inspect or promote the frontend | `vercel` CLI through `/vercel-cli` |

The staging resources, as the CLI sees them. `thoven-api-staging` is the combined web service, `thoven-keyvalue-staging` its Key Value, and `thoven-worker-staging` the legacy worker, which stays `suspended`:

```sh
render services -e evm-dao4703m8hqs73d71rfg -o json --confirm \
  | jq -c '.[] | (.service // .keyValue) | {name, suspended, status, autoDeployTrigger}'
```

## Start

1. **Pin the pair.** Fetch both repositories and resolve one full frontend SHA and one full backend SHA. Default to each `origin/main`; honor explicitly requested revisions. Require successful required CI for each selected source tree. For a merged SHA without its own run, verify tree identity against the final green PR head and record both SHAs; an older different tree is insufficient. Preserve dirty work and keep this pair fixed throughout startup. If staging is active, reuse an identical pair; confirm replacement with its current user when versions or active holds conflict. Done when you hold two full SHAs and their CI evidence.

2. **Prove manual control.** Inspect effective settings: Render staging auto-deploy off, Blueprint Auto Sync off, legacy worker suspended; Vercel Git deployments disabled specifically for project `thoven-staging`, scope `andres-3203s-projects`. Inspect project identity and confirm its backend configuration points to staging.

   Both Vercel projects consume the shared `vercel.json`; blanket changes can disable real production builds. The separate staging project uses Vercel's **Production environment**, so `--prod` alone identifies no project. Keep project `thoven` unchanged. If setup is incomplete, identify the exact gap and finish any separately authorized configuration first. Creating this skill does not authorize live setup. Done when the resource command above shows `autoDeployTrigger` `off` on `thoven-api-staging` and `thoven-worker-staging`, the legacy worker `suspended`, Blueprint Auto Sync is off, and `/vercel-cli` shows project `thoven-staging` with no Git deployments, pointed at the staging backend.

3. **Hold and wake.** On the laptop, inspect `status` and verify the expiry timer is loaded with `launchctl print "gui/$(id -u)/co.thoven.staging-expire"`. If absent, install it from the runbook's "Run expiry on a laptop timer", then require a successful expiry run before wake. Never bypass the host guard. Acquire a bounded deployment hold with a unique reason and save its token. Run `up --hours 4 --apply`, or the requested duration within the supported bounds.

   Resume can build the configured branch even with auto-deploy off; `up` does not pin a revision. If executing an unselected commit or its migrations exceeds authorization, resolve that before wake. Inspect any cold-resume deployment until terminal before explicitly deploying. When the build a resume starts fails on a stale build cache, `up` deploys the same commit with a cleared cache and waits for it. A health timeout while the build progresses calls for observation and a controller retry after completion, not competing deployments. Done when `up` prints `combined staging: ready` and you hold the hold token.

4. **Deploy the backend.** On the running combined service, deploy the pinned backend SHA unless the cold-resume deployment already reached `live` at that exact SHA; reuse that deployment instead of rebuilding identical source:

   ```sh
   render deploys create srv-dao470bm8hqs73d71sh0 --commit <backend-full-sha> --wait --confirm -o json
   ```

   Done when the provider status is `live` at that SHA, `/up` answers HTTP 200, `/health` `revision.sha` matches, and the controller's `probe --apply` prints `worker execution readiness: verified on thoven-api-staging`. The legacy worker stays suspended. Approved migrations run only through web pre-deploy.

5. **Deploy the frontend.** First record the deployment staging serves now: `vercel inspect staging.thoven.co --scope andres-3203s-projects` prints its `url`. That URL is step 6's rollback. Then use a clean checkout of the pinned frontend SHA under existing worktree rules. Vercel uploads local source; a SHA label cannot prove a dirty checkout. Explicitly target staging and withhold domain assignment:

   ```sh
   vercel deploy <clean-frontend-checkout> --project thoven-staging --scope andres-3203s-projects --prod --skip-domain
   ```

   Require `Ready`, correct project identity and source provenance. Check the deployment URL's `/api/version`. CLI uploads may omit Git metadata; use supported build metadata/environment configuration to supply the truthful checked-out SHA, and verify the response. Build remotely; any heavy local work runs on the designated mini. Access protected deployments through authenticated CLI access. Done when the candidate is `Ready`, belongs to `thoven-staging`, and serves the pinned SHA at its `/api/version`.

6. **Verify and expose.** Check the candidate version, its staging backend configuration, and an existing staging login plus harmless authenticated backend read. The temporary Vercel URL may be protected or absent from Rails CORS; do not widen CORS for a disposable URL. In that case validate the actual browser integration immediately after the staging-only domain switch. A frontend `/api/health` 200 does not check Rails. If the candidate URL is protected or outside the existing Rails CORS allowlist, verify its version through authenticated CLI access and check backend authentication directly before the staging-only domain switch; then require the real browser integration check on `staging.thoven.co`. Do not expand CORS just for this probe. Respect independent data/send gates. Verify the candidate belongs to `thoven-staging` and use a checkout whose resolved Vercel link is that same project for `vercel promote <candidate-url> --cwd <staging-linked-checkout> --scope andres-3203s-projects`. Recheck `staging.thoven.co/api/version` and prove authenticated API-dependent behavior in a browser after promotion; a direct backend read alone cannot establish frontend readiness. When a check fails after the switch, promote step 5's recorded URL back with `vercel promote <recorded-url> --cwd <staging-linked-checkout> --scope andres-3203s-projects` and report the failure.

   Once verified, release only this operation's deployment hold. Continuing QA/release work maintains its own bounded hold. Done when `staging.thoven.co/api/version` shows the frontend SHA, an existing staging account signs in in a browser, an API-backed screen loads, and you report the URL, both SHAs, actual expiry with timezone and remaining holds. Startup readiness is separate from full release QA and production publication.

## Check, extend, stop

- **Check:** inspect controller `status`, deployment records and public versions read-only. A status question never wakes staging.
- **Extend:** for a running session at the selected pair, renew with `up --hours N --apply`, verify versions remain unchanged, and report the new expiry. If suspended, follow the full start path. Renewal does not deploy newer `main` commits.
- **Stop:** coordinate active use, then use `down --apply`. Respect every hold and drain check; release only holds this operation owns.

The existing five-minute scheduler attempts shutdown after lease expiry, subject to holds and safe-drain checks. The timer runs on the laptop, so expiry waits while the laptop sleeps or is off: run `down --apply` when the work ends rather than leaving it to the timer. Vercel's frontend can remain reachable while backend features are unavailable; expiry does not delete its deployment.

## Stop conditions

Stop on failed CI, identity mismatch, refused controller checks, unexpected migrations, failed deployments or smoke checks. Inspect a timed-out mutation before retrying; observe startup for at most 20 minutes per provider before reporting the running operation and blocker. Keep the lease bounded and disclose remaining holds/expiries. Keep step 5's recorded deployment URL until step 6 passes; the protected/CORS exception above permits a staging-only switch with immediate rollback to it if browser integration fails. Report a partial startup accurately.

Call staging ready only with the selected pair, API-dependent smoke and recorded expiry. Missing manual controls mean **setup incomplete**. Production promotion commands are outside this workflow.
