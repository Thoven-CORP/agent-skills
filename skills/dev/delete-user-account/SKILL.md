---
name: delete-user-account
description: Use when deleting user accounts, removing test accounts, cleaning up duplicates, or handling GDPR data deletion requests. Safely deletes accounts and all associated data across 40+ FK constraints with dry-run-first safety protocol.
---

# Delete User Account Skill

Safely delete user accounts with full dependency analysis and FK constraint handling.

## Quick Start

```bash
# Dry run (ALWAYS do this first)
rails runner scripts/delete_user_account.rb EMAIL

# Production dry run
RAILS_ENV=production rails runner scripts/delete_user_account.rb EMAIL

# Actual deletion (after reviewing dry run)
RAILS_ENV=production rails runner scripts/delete_user_account.rb EMAIL --confirm
```

## Safety Protocol

1. **ALWAYS dry-run first** - Review what will be deleted before confirming
2. **Verify account identity** - Confirm email matches intended user
3. **Check profile type** - Teacher accounts have more dependencies than parent accounts
4. **Review dependency counts** - Especially sessions, enrollments, and booking data
5. **Production requires explicit env** - Use `RAILS_ENV=production`
6. **ALWAYS verify after deletion** - Check DELETION SUMMARY and run verification query

## Architecture (read this first)

This script is a **thin wrapper** over `app/services/user_account_deletion_service.rb`
— the single, FK-safe deletion path also used by the self-serve teacher/parent
endpoints. The operator script runs the service with `force: true`, which bypasses
the self-serve obligation gate (see below).

- **All deletion logic + FK coverage lives in the service**, not here. The dry-run
  footprint this script prints is derived from `UserAccountDeletionService::COVERED_FKS`,
  the same map the service deletes by — so the report can't drift from reality.
- **Schema guard:** `spec/services/user_account_deletion_service_spec.rb` fails the
  build if a migration adds an FK to `users`/`profiles` that the service doesn't
  cover. That is the regression backstop — keep it green.

## What the service handles

Every foreign key referencing `users`/`profiles` (~67), each tagged in `COVERED_FKS`:

- **NULLIFY** (nullable columns — the row is preserved): `bug_reports.user_id`,
  `students.coppa_verifying_guardian_id`, and the "other user's action" refs
  (`processed_by_id`, `cancelled_by_id`, `refund_denied_by_id`).
- **DELETE** (owned data, plus NOT NULL columns that can't be nulled — most
  tables, including financial/review records on the operator/force path).
- **CASCADE** (auto-handled by the DB): analytics events, conversations,
  scheduling slots/notifications/holds, class invite links, etc.
- Ordering is resolved automatically by a savepoint retry loop, so adding a new
  covered FK rarely needs manual ordering.

## Obligation gate (self-serve only)

Self-serve deletion refuses an account that still has teaching/financial history
(active enrolled students, upcoming lessons, lesson purchases/credits, payout
history, wallet activity) and routes the user to support — so no financial or
review record is ever destroyed by a self-serve click. **Operators bypass this**
(`force: true`); the dry-run prints whether self-serve *would* have been blocked.

## Interpreting Output

### Dry Run Output
```
ACCOUNT FOUND:
  User ID: uuid
  Email: user@example.com
  Type: 2 (parent) or 3 (teacher)

DEPENDENCIES TO DELETE:
  [Lists all tables and counts]
```

### Successful Deletion Output
```
Phase 7: Deleting user-level data...
  Deleted 2 from guardianships
  Nullified 1 in students.coppa_verifying_guardian_id

Phase 8: Deleting profile and user...
  Deleted 1 from profiles
  Deleted 1 from users

ACCOUNT DELETED SUCCESSFULLY

DELETION SUMMARY:
  guardianships: 2 deleted
  profiles: 1 deleted
  users: 1 deleted
```

### Key Things to Check
- **Profile type** - Teacher (3) has more dependencies than parent (2)
- **Teacher classes count** - Will cascade delete all class data
- **Sessions/Enrollments** - Shows what will be NULLIFIED vs DELETED
- **Analytics counts** - Will auto-cascade, just informational
- **DELETION SUMMARY** - Must show `profiles: 1 deleted` and `users: 1 deleted`

## Post-Deletion Verification (REQUIRED)

Always verify the account was actually deleted:

```bash
RAILS_ENV=production rails runner "
  u = User.find_by(email: 'EMAIL_HERE')
  puts u.nil? ? 'VERIFIED: Account deleted' : 'WARNING: Account still exists'
"
```

## Error Handling

Script uses savepoints for optional tables - individual table failures won't abort the whole transaction.

### Critical vs Optional Operations
- **Critical (will abort on failure):** Profile and User deletion
- **Optional (silently skipped on failure):** All other tables - handles schema differences between environments

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Empty DELETION SUMMARY | Silent failures in transaction | Script now uses savepoints - update to latest version |
| FK constraint error | Missing table in deletion order | Report issue to add table handling |
| "Account still exists" after success message | Transaction rolled back | Check for errors in output, verify with query |
| Table doesn't exist error | Dev/prod schema mismatch | Automatically skipped via savepoint |

## Lessons Learned

### Transaction Gotcha (Jan 2026)
PostgreSQL aborts entire transaction when ANY SQL fails, even if caught in Ruby. Solution: Use `ActiveRecord::Base.transaction(requires_new: true)` (savepoints) for optional operations.

### Always Verify Deletion
The script may report "ACCOUNT DELETED SUCCESSFULLY" but if the DELETION SUMMARY is empty or doesn't show `profiles` and `users`, the deletion didn't actually happen. Always run verification query.

### Schema Differences
Development and production databases may have different schemas. Script handles this gracefully with savepoints - missing tables are skipped without aborting.

## When NOT to Use

- Do NOT delete accounts with active paid subscriptions without refunding first
- Do NOT delete teacher accounts mid-lesson-cycle without notifying students
- Consider archiving instead of deleting for audit trail requirements

## Finding Test Accounts

To find recent accounts for cleanup:

```bash
RAILS_ENV=production rails runner "
  User.where('created_at > ?', 7.days.ago)
      .order(created_at: :desc)
      .limit(20)
      .each do |u|
    type = u.profile&.teacher? ? 'teacher' : 'parent'
    puts \"#{u.created_at.strftime('%Y-%m-%d %H:%M')} | #{type.ljust(7)} | #{u.email}\"
  end
"
```
