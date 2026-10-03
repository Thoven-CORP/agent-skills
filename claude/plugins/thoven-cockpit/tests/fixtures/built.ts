// Reports built by hand where no log holds the shape a test needs. Each constant says why it is
// built and what it is shaped on. pin.test.ts reads only the captured fixtures, so none of these is pinned.

// Built, not captured. No transcript under ~/.claude/projects held a DONE_WITH_CONCERNS whose
// concerns are a markdown table (searched 2026-10-03). Shaped on the REPORT section of
// skills/dev/dispatch-work/references/brief.md: the status line, then the block. Its Acceptance
// table is all ✓, as real reports' are (THV-768, THV-860), so only the Concerns table counts.
export const BUILT_CONCERNS_TABLE_THV_1045 = "DONE_WITH_CONCERNS THV-1045 consent evidence holds; two concerns need main.\n\nConcerns   [measured]\n| # | Concern | Evidence |\n|---|---|---|\n| 1 | The Terms version is read at signup, not at consent | app/models/consent.rb:41 |\n| 2 | The backfill skips parents with no signup row | rails runner script/backfill.rb → 3 skipped |\n\nAcceptance   [measured]\n| Line | Result | Evidence |\n|---|---|---|\n| Consent stores the Terms version | ✓ | spec/models/consent_spec.rb:12 → 4 examples, 0 failures |\n| Parents see the version they agreed to | ✓ | e2e/consent.spec.ts:30 → pass |\n\nCommits   1a2b3c4 (backend)\n\nresult: done with 2 concerns\n"
