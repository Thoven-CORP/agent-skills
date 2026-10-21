# Factory rules

Source of truth for loop limits. `scripts/enforce.sh` reads the fenced `caps` block from `origin/main`, not from the checkout. Change a number here on main. A loop PR cannot raise its own caps.

```caps
open_pr_cap=5
weekly_pr_cap=3
weekly_pr_cap_status=pending-andres
max_lines=400
max_files=15
pr_size_status=pending-andres
ci_failure_stop=2
claim_lock_hours=24
```

## Caps

| Key | Meaning |
|---|---|
| `open_pr_cap` | Max loop PRs open at once. |
| `weekly_pr_cap` | Max loop PRs opened in the last 7 days. **Pending Andres's decision.** |
| `max_lines` | Max changed lines on one **batch PR**. **Pending Andres's decision.** Placeholder 400. |
| `max_files` | Max changed files on one **batch PR**. **Pending Andres's decision.** Placeholder 15. |
| `ci_failure_stop` | Stop the loop after this many CI failures on the same batch PR. |
| `claim_lock_hours` | Hours before a `factory-claim-lock` goes stale and another bot may take it. Default 24. |

A batch PR may close several linked tickets. Size and open counts are per batch PR, not per ticket.

`weekly_pr_cap` stays at 3 until Andres sets it. Do not raise it in a loop run.

## Forbidden areas

A loop PR must not change these. The list is not configurable.

- Database migrations (db/migrate, db/schema.rb, db/structure.sql, Strong Migrations)
- db/seeds
- config/recurring.yml
- Billing, credits, wallets, Stripe charges, payment, invoice, subscription, checkout
- Authentication, password, oauth, login, token, JWT, Devise, student-auth
- session paths, except lesson-session files
- Privacy policy, terms/, legal wording
- Customer-facing email templates, mailers, frontend emails/ and templates/
- skills/factory/** and any RULES.md

## Loop conduct

- Never auto-revert a loop PR.
- After `ci_failure_stop` red CI runs on the same batch PR, stop and write the failures on the tickets. Do not push a third guess.
- If you just did the same steps by hand twice, propose an automation instead of a third pass.
- Merge conflicts wait for merge time. Overlapping files across open loop PRs are allowed.

## Labels

Loop PRs carry label `factory-loop` (or title prefix `factory:`). The enforce script counts those PRs.
