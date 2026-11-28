**Lens: escaped defects.** A bug a user hit carries a lesson no correction row holds. Trace each one to the skill or run that should have caught it.

1. List the bug tickets created in the window from Linear (`list_issues` on team THV, created since the window start): every issue labeled `Bug` or made from the Bug template, plus issues whose title says "bug" or "broken" (`query: "bug"`, `query: "broken"`). Page until `hasNextPage` is false.
2. Read each ticket and its comments (`get_issue`, `list_comments`): what broke, who found it and how (a user, Mixpanel, Sentry, a database read, a QA run).
3. Find the session that fixed it: `rg -l '<THV-id>' <OUT>/prompts.tsv`, then `rg -l --glob '*.jsonl' '<THV-id>' ~/.claude/projects ~/.codex/sessions`. Read where the cause was found.
4. Trace it upstream to the ticket, pull request or launch that shipped it, and to each run that should have caught it first: `qa-product` and the `journey-map` it runs first for a flow or seat nobody walked, `dogfood` for a release, `write-tests` for a test that could never fail, `state-audit` for a mishandled state, a review lens for a code defect. Check whether that run happened and what it covered (`<OUT>/skills.tsv`, the shipping ticket's comments, the transcripts).

Name the gap precisely: the run never happened, ran after the release, skipped this seat or state, or held a check that could not fail. For example, THV-2003 (an adult signing up as "Myself" got the kid flow) was found in production data; qa-product first ran after the fix and no run had walked the adult seat, so it is a qa-product and journey-map gap.

Done when every bug ticket in the window has a finding in the common format, Kind `skill-gap` or `broken-rule`, routed to the skill that should have caught it, or a one-line reason no skill could have (a third-party outage, bad data).
