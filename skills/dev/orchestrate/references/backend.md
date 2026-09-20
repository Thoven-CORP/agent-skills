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
| Reconcile a large feature's PRD, contract and code | `/feature-ledger` |
| Write an implementation plan from requirements | `/superpowers:writing-plans` |
| Something is broken at runtime in Thoven | `/investigate-thoven` |
| A hard bug or perf regression anywhere | `/diagnosing-bugs` |
| Claiming done, pre-commit | `/verify` |
| Prove one specific claim with fresh evidence | `/verify-this` |
| This repo has no control skill or Feature Map | `/create-verification-skill` |
| An existing verify-app map is stale | `/maintain-verification-skill` |
| Commit, deploy, release | `/publish` |
| CI is red on a PR | `/fix-ci` |
| Watch a PR until its checks pass | `/loop-on-ci` |
| Where does this stand, log work, move a ticket | `/workspace` |

### Rails and data

| The request | Destination |
|---|---|
| Rails patterns, ActiveRecord, controllers, jobs | `/rails-expert` |
| Query plans, indexes, Postgres behaviour | `/postgres-pro` |
| A schema change or migration | `/safe-migrate` |
| Whether a migration is safe for live data | `/thoven-db-migration-security` |
| Find the specs covering a change | `/rspec-map` |
| Smoke the running app | `/run-smoke-tests` |
| What is actually in production data | `/production-data-audit` |
| Delete a user and everything attached | `/delete-user-account` |

### Security and compliance

| The request | Destination |
|---|---|
| A general security or auth review | `/security-review` |
| Rails-specific security review | `/thoven-rails-security` |
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
| Review a branch against standards and spec | `/code-review` |
| Write the test first | `/tdd` |

## Chains

| Pattern | Chain |
|---|---|
| Idea to shipped feature | `/grill-with-docs` → `/architect` → `/feature-ledger` |
| Bug report | `/investigate-thoven` → `/verify` |
| Schema change | `/safe-migrate` → `/thoven-db-migration-security` → `/verify` |
| Pre-commit | `/deslop` → `/no-comments` → `/code-review` → `/verify` |
| Ship | `/verify` → `/publish` → `/loop-on-ci` |

## Rules

- Name one destination. A second choice is a question, not a recommendation.
- Give one sentence of reason.
- A named skill routes to itself. Run what the human typed.
- Mid-workflow, continue the current skill.
- The routing is a suggestion the human may override.
