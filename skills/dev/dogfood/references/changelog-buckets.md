# Release-note buckets (weekly branch)

The weekly run is **release-driven**: read the GitHub Releases on every `prod/*` tag newer than `state.last_dogfooded` (`gh release list --repo Thoven-CORP/frontend-remote` / `backend-remote`, then `gh release view <tag>`), and sort each bullet into one bucket. Bucketing is the core value — it stops you writing fake UI steps for cron/email changes, and points effort at what actually breaks users.

Adapted from `qa-flow`.

## The buckets

| Bucket | Signal | Dogfood treatment |
|---|---|---|
| **FE user-visible** | a page/component/route changed | Click it as the relevant household member: loads, key element present, no console error, exact values |
| **FE×BE integration** | FE caller + paired BE endpoint both changed | Click **+ confirm the data**: the action persists (backend assertion for wallet/booking; UI confirmation otherwise) |
| **Contract removal** | BE `Removed` / FE "removed dead caller" / 410-stub deletion | **Regression sweep**: visit the affected surfaces as the household, assert **zero 410/5xx** |
| **BE-only, not clickable** | mailers, cron/recurring jobs, nurture/survey gating, analytics backfill | **Do NOT invent UI steps.** List as "verify out-of-band (logs / a real send / Mixpanel)" |
| **Dev-tooling / skip** | CI, contract manifests, lint, docs | Note as shipped; no step |

## Mine the BE `Verification:` lines

A BE release bullet that cites a PR was rspec-proven in that PR's CI. Don't re-prove backend units by hand; focus manual effort on **integration + user-visible + contract-removal**.

## One-sided pairings

If one repo's release asserts a FE×BE pairing the other doesn't document (a BE bullet names a clickable FE surface, but the FE release omits it), **trust the asserted pairing → bucket it FE×BE**. Don't down-bucket to BE-only just because the other half's release was thin.

## Edge cases

- **Published only.** Only `prod/*` releases count — dogfood runs against prod; an unshipped change can't pass a UI step. It's picked up next run once released.
- **Non-atomic entry.** One release bullet bundling several unrelated changes → split it and bucket each sub-change; don't collapse to the dominant one and lose the rest.
- **Observable migration.** A data-migration bullet (test-account flagging, review purge) is *BE-only* yet often *visible in the admin UI* as changed counts → bucket out-of-band **plus** an optional admin spot-check, not a hard UI step.
- **De-dup.** A bullet repeated across releases (or noting "actually ships in X") → test once, at its real ship release.
- **Admin-only entries → out-of-band.** Dogfood covers the *customer-facing* product only (parent / student / teacher); there is no admin household member, by design. Admin-side changes (admin dashboard, teacher CRM, applications, analytics tiles) are listed out-of-band — not exercised in the ritual.

## Output

A "what shipped" table — every entry · its bucket · which household member exercises it — followed by the scripted steps for the clickable buckets. The standing core (`standing-checklist.md`) is appended underneath, always.
