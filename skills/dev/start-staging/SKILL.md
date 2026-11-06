---
name: start-staging
description: Start a deliberate, timed Thoven staging session with selected frontend and backend commits; also check, extend, or stop that session. Use for explicit staging availability requests, separate from merging code or publishing production.
---

# Start staging

Make `https://staging.thoven.co` usable for a bounded testing session. Merging to `main` neither starts staging nor updates an active session's selected versions. Discussing or editing this skill authorizes no provider changes.

## Sources and authority

Read `~/thoven/backend/docs/deployment/staging-lifecycle.md` before operating. The installed controller on `thoven-mini-ssh` owns fixed resource identities, leases, holds, locking, dependency order and safe shutdown. Reuse it. Read [the governing staging decision](https://linear.app/thoven/issue/DEP-52/reduce-render-costs-with-smaller-redis-and-on-demand-staging), D4, for current policy.

A request to start staging covers ordinary staging resume, deployment and readiness probes. Preserve independent gates for migrations, money, COPPA, sends and production. Inspect pending migrations before wake: Render resume can trigger a build and pre-deploy migrations. Keep credentials in the existing private environment; never print them.

Use installed Render/Vercel CLI help and skills for provider syntax. Older publish instructions saying frontend merges deploy staging describe the former setup, not proof of manual control.

## Start

1. **Pin the pair.** Fetch both repositories and resolve one full frontend SHA and one full backend SHA. Default to each `origin/main`; honor explicitly requested revisions. Require successful required CI for each selected source tree. For a merged SHA without its own run, verify tree identity against the final green PR head and record both SHAs; an older different tree is insufficient. Preserve dirty work and keep this pair fixed throughout startup. If staging is active, reuse an identical pair; confirm replacement with its current user when versions or active holds conflict.

2. **Prove manual control.** Inspect effective settings: Render staging auto-deploy off, Blueprint Auto Sync off, legacy worker suspended; Vercel Git deployments disabled specifically for project `thoven-staging`, scope `andres-3203s-projects`. Inspect project identity and confirm its backend configuration points to staging.

   Both Vercel projects consume the shared `vercel.json`; blanket changes can disable real production builds. The separate staging project uses Vercel's **Production environment**, so `--prod` alone identifies no project. Keep project `thoven` unchanged. If setup is incomplete, identify the exact gap and finish any separately authorized configuration first. Creating this skill does not authorize live setup.

3. **Hold and wake.** On the canonical mini, load its private controller environment, inspect `status`, and verify the expiry scheduler is loaded with `launchctl print "user/$(id -u)/co.thoven.staging-expire"`. If absent after a headless reboot, bootstrap its existing reviewed plist, then require a successful expiry run before wake. Resolve hostname/profile refusals through the reviewed controller setup; never bypass its host guard. Acquire a bounded deployment hold with a unique reason and save its token. Run `up --hours 4 --apply`, or the requested duration within the supported bounds.

   Resume can build the configured branch even with auto-deploy off; `up` does not pin a revision. If executing an unselected commit or its migrations exceeds authorization, resolve that before wake. Inspect any cold-resume deployment until terminal before explicitly deploying. A health timeout while the build progresses calls for observation and a controller retry after completion, not competing deployments.

4. **Deploy the backend.** On the running combined service, deploy the pinned backend SHA unless the cold-resume deployment already reached `live` at that exact SHA. Reuse that proven deployment instead of rebuilding identical source:

   ```sh
   render deploys create srv-dao470bm8hqs73d71sh0 --commit <backend-full-sha> --wait --confirm -o json
   ```

   If cold resume already produced a live deployment at the selected SHA, reuse it rather than rebuilding identical source. Require provider status `live` at that SHA, `/up` HTTP 200, a matching `/health` `revision.sha`, and the mini controller's `probe --apply` completing a real background job. The legacy worker stays suspended. Approved migrations run only through web pre-deploy.

5. **Deploy the frontend.** Use a clean checkout of the pinned frontend SHA under existing worktree rules. Vercel uploads local source; a SHA label cannot prove a dirty checkout. Explicitly target staging and withhold domain assignment:

   ```sh
   vercel deploy <clean-frontend-checkout> --project thoven-staging --scope andres-3203s-projects --prod --skip-domain
   ```

   Require `Ready`, correct project identity and source provenance. Check the deployment URL's `/api/version`. CLI uploads may omit Git metadata; use supported build metadata/environment configuration to supply the truthful checked-out SHA, and verify the response. Build remotely; any heavy local work runs on the designated mini. Access protected deployments through authenticated CLI access.

6. **Verify and expose.** Check the candidate version, its staging backend configuration, and an existing staging login plus harmless authenticated backend read. The temporary Vercel URL may be protected or absent from Rails CORS; do not widen CORS for a disposable URL. In that case record the previous staging alias and validate the actual browser integration immediately after the staging-only domain switch, restoring the previous alias if it fails. A frontend `/api/health` 200 does not check Rails. If the candidate URL is protected or outside the existing Rails CORS allowlist, verify its version through authenticated CLI access and check backend authentication directly before the staging-only domain switch; then require the real browser integration check on `staging.thoven.co`. Record the previous staging deployment first and restore it if that check fails. Do not expand CORS just for this probe. Respect independent data/send gates. Verify the candidate belongs to `thoven-staging` and use a checkout whose resolved Vercel link is that same project for `vercel promote <candidate-url> --cwd <staging-linked-checkout> --scope andres-3203s-projects`. Recheck `staging.thoven.co/api/version` and prove authenticated API-dependent behavior in a browser after promotion; a direct backend read alone cannot establish frontend readiness.

   Once verified, release only this operation's deployment hold. Continuing QA/release work maintains its own bounded hold. Report the URL, both SHAs, actual expiry with timezone and remaining holds. Startup readiness is separate from full release QA and production publication.

## Check, extend, stop

- **Check:** inspect controller `status`, deployment records and public versions read-only. A status question never wakes staging.
- **Extend:** for a running session at the selected pair, renew with `up --hours N --apply`, verify versions remain unchanged, and report the new expiry. If suspended, follow the full start path. Renewal does not deploy newer `main` commits.
- **Stop:** coordinate active use, then use `down --apply`. Respect every hold and drain check; release only holds this operation owns.

The existing five-minute scheduler attempts shutdown after lease expiry, subject to holds and safe-drain checks. The scheduler depends on the mini remaining available and its user-domain task staying loaded; a host outage or reboot can delay expiry until it is restored. Vercel's frontend can remain reachable while backend features are unavailable; expiry does not delete its deployment.

## Stop conditions

Stop on failed CI, identity mismatch, refused controller checks, unexpected migrations, failed deployments or smoke checks. Inspect a timed-out mutation before retrying; observe startup for at most 20 minutes per provider before reporting the running operation and blocker. Keep the lease bounded and disclose remaining holds/expiries. Preserve the previous frontend domain assignment until candidate checks pass; the protected/CORS exception above permits a staging-only switch with immediate rollback if browser integration fails. Report a partial startup accurately.

Call staging ready only with the selected pair, API-dependent smoke and recorded expiry. Missing manual controls mean **setup incomplete**. Production promotion commands are outside this workflow.
