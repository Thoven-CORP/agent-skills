# Merge risk

Named review pass for station 7. Run it even though no standalone merge-risk skill exists.

Answer these from the diff and the batch tickets.

- What lands if this PR merges now? One sentence.
- What sibling factory PRs are open? File overlap is allowed. Call out a semantic clash (two fixes for the same symptom).
- Does the PR link every ticket in the batch? Does each ticket link the PR?
- Would a revert be safe? Factory never auto-reverts. A human still needs a revert plan.
- Any migration, recurring.yml, billing, auth, legal copy, or mailer hunk that sneak-landed? That is a bounce, not a nit.

Write the answers under a Merge risk heading in the review report.
