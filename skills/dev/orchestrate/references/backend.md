# Routing requests to skills, backend

Names a destination for a request. Every destination carries a leading slash so
`scripts/check-skill-routes.sh` can verify it resolves. A name without the slash
is prose, not a destination.

This file carries **when to reach for a skill**. The skill's own description
carries what it does, and restating that here is what drifted.

## Reading order

Take the first match going down, and prefer a domain row over a universal one.
When two rows match equally, ask one question.

## Routing

| The request | Destination |
|---|---|
| Build or change a feature, 3+ concerns, multi-file | `/grill-with-docs` |
| Shape types and module boundaries before code | `/architect` |
| Design a flow with three or more states, or one a job, webhook, timer or another person can move | `/state-brief` |
| Audit a built flow for flag soup, hidden transitions or missing recovery | `/state-audit` |
| Reconcile a large feature's PRD, contract and code | `/feature-ledger` |
| Write an implementation plan from requirements | `/superpowers:writing-plans` |
| Something is broken at runtime in Thoven | `/investigate-thoven` |
| A hard bug or perf regression anywhere | `/diagnosing-bugs` |
| Claiming done, pre-commit | `/verify` |
| Prove one specific claim with fresh evidence | `/verify-this` |
| This repo has no control skill or Feature Map | `/create-verification-skill` |
| An existing verify-app map is stale | `/maintain-verification-skill` |
| Commit, deploy, release | `/publish` |
| Watch a PR through CI and comments without me | `/babysit-pr` |
| Watch a PR until its checks pass, in the terminal | `/loop-on-ci` |
| CI is red on a PR | `/fix-ci` |
| An old PR or branch is behind `main`, "rebase this" | `/modernize` |
| Pick up another person's or agent's PR, branch or dead pane | `/takeover` |
| Take a ticket to ready-to-merge unattended | `/full-stop` |
| Take a PR that changes nothing a user sees to merged, on "full send" | `/full-send` |
| Run a heavy check on the mini against MacBook changes | `/remote-check` |
| Set up or reshape a Linear Project | `/linear-project` |
| What families are texting about, a feedback sweep | `/text-product-analysis` |
| Brainstorm or grill a feature, journey or flow; what matters most | `/product-fundamentals` |
| Where does this stand, log work, move a ticket | `/workspace` |

### Rails and data

| The request | Destination |
|---|---|
| Query plans, indexes, Postgres behaviour | `/postgres-pro` |
| A schema change or migration | `/safe-migrate` |
| Find the specs covering a change | `/rspec-map` |
| Smoke the running app | `/run-smoke-tests` |
| What is actually in production data | `/production-data-audit` |
| Delete a user and everything attached | `/delete-user-account` |

### Security and compliance

| The request | Destination |
|---|---|
| A general security or auth review | `/security-review` |
| Contracts the API must not break | `/thoven-security-contracts` |
| COPPA, verifiable parental consent | `/thoven-coppa-vpc-contracts` |
| Browser-side security | `/thoven-browser-security` |

### Domain

| The request | Destination |
|---|---|
| Mailers, templates, delivery | `/thoven-email-system` |
| Write or rewrite the copy in an email | `/email-writing` |
| A new endpoint or contract for the frontend | `/frontend-handover` |
| Defer an improvement rather than build it now | `/future-improvements` |
| Docs have drifted from the code | `/doc-freshness` |

### Before review

| The request | Destination |
|---|---|
| Strip AI slop from a diff | `/deslop` |
| Remove comments that restate the code | `/no-comments` |
| Review a branch against standards and spec | `/mattpocock-skills:code-review` |
| Write the test first | `/tdd` |

## Chains

| Pattern | Chain |
|---|---|
| Idea to shipped feature | `/grill-with-docs` → `/architect` → `/feature-ledger` |
| Bug report | `/investigate-thoven` → `/verify` |
| Schema change | `/safe-migrate` → `/verify` |
| Pre-commit | `/deslop` → `/no-comments` → `/mattpocock-skills:code-review` → `/verify` |
| Ship | `/verify` → `/publish` → `/babysit-pr` |

## Rules

- Name one destination. A second choice is a question, not a recommendation.
- Give one sentence of reason.
- A named skill routes to itself. Run what the human typed.
- Mid-workflow, continue the current skill.
- The routing is a suggestion the human may override.
