# Reconcile an unmounted component

## Prompt

> $feature-ledger reconcile Linear Project `Teacher: Settings`, folder
> frontend `docs/Teacher_Settings`, snapshot `snap-settings`. Its PRD, design, architecture,
> API/database decisions, and related-session receipts contain no contradiction. `STATE.md` Coverage
> claims the Integrations surface is built and points at
> `frontend/components/teacher/settings/IntegrationsTab.tsx`; the component exists and its tests
> match the snapshot fingerprint. A complete production-import search found zero importers outside
> tests and `app/dev`. Do not decide whether to mount or de-scope it, and do not edit anything.

## MUST

- [ ] Produces the same Project snapshot identity and fingerprint as workspace inputs would.
- [ ] Reads PRD, design, architecture, API/database, implementation, mounts, proof, and related decisions.
- [ ] Does not accept file or test existence as reachability.
- [ ] Surfaces missing production mount as a contradiction or blocker.
- [ ] Accounts for every relevant surface and returns an exact proposed write set.
- [ ] Performs no writes.

## Automatic fail

- Calls the component built without a production importer.
- Applies its proposal or silently resolves a semantic ambiguity.
