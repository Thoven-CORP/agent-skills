# Changelog buckets (weekly branch)

The weekly run is **changelog-driven**: read FE + BE `CHANGELOG.md` for every version above `state.last_dogfooded`, and sort each entry into one bucket. Bucketing is the core value — it stops you writing fake UI steps for cron/email changes, and points effort at what actually breaks users.

Adapted from `manual-qa` Release mode.

## The buckets

| Bucket | Signal | Dogfood treatment |
|---|---|---|
| **FE user-visible** | a page/component/route changed | Click it as the relevant household member: loads, key element present, no console error, exact values |
| **FE×BE integration** | FE caller + paired BE endpoint both changed | Click **+ confirm the data**: the action persists (backend assertion for wallet/booking; UI confirmation otherwise) |
| **Contract removal** | BE `Removed` / FE "removed dead caller" / 410-stub deletion | **Regression sweep**: visit the affected surfaces as the household, assert **zero 410/5xx** |
| **BE-only, not clickable** | mailers, cron/recurring jobs, nurture/survey gating, analytics backfill | **Do NOT invent UI steps.** List as "verify out-of-band (logs / a real send / Mixpanel)" |
| **Dev-tooling / skip** | CI, contract manifests, lint, docs | Note as shipped; no step |

## Mine the BE `Verification:` lines

Each BE changelog entry carries `Verification: N examples, 0 failures` — those paths are already rspec-proven. Don't re-prove backend units by hand; focus manual effort on **integration + user-visible + contract-removal**.

## One-sided pairings

If one repo's changelog asserts a FE×BE pairing the other doesn't document (a BE entry names a clickable FE surface, but the FE changelog omits it), **trust the asserted pairing → bucket it FE×BE**. Don't down-bucket to BE-only just because the other half's changelog was thin.

## Edge cases

- **Published only.** Skip `Unreleased`/Not-Published versions — dogfood runs against prod; an unshipped change can't pass a UI step. It's picked up next run once published.
- **Non-atomic entry.** One changelog entry bundling several unrelated changes → split it and bucket each sub-change; don't collapse to the dominant one and lose the rest.
- **Observable migration.** A data-migration entry (test-account flagging, review purge) is *BE-only* yet often *visible in the admin UI* as changed counts → bucket out-of-band **plus** an optional admin spot-check, not a hard UI step.
- **De-dup.** An entry repeated across versions (or noting "actually ships in X") → test once, at its real ship version.
- **Admin-only entries → out-of-band.** Dogfood covers the *customer-facing* product only (parent / student / teacher); there is no admin household member, by design. Admin-side changes (admin dashboard, teacher CRM, applications, analytics tiles) are listed out-of-band — not exercised in the ritual.

## Output

A "what shipped" table — every entry · its bucket · which household member exercises it — followed by the scripted steps for the clickable buckets. The standing core (`standing-checklist.md`) is appended underneath, always.
