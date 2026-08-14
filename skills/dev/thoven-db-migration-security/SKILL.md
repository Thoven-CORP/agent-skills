---
name: thoven-db-migration-security
description: Review Thoven Rails migrations and data backfills for production safety, Neon/Replit publish constraints, COPPA data safety, reversible operations, and schema drift risk. Use with Warden for backend DB changes.
---

# Thoven DB Migration Security

Review backend migrations and data backfills for safety under Thoven's Rails, PostgreSQL, Neon, and Replit deployment constraints.

## Required Checks

1. **Migration authoring rules**
   - Additive `add_column` and `add_index` operations should use `if_not_exists: true`.
   - Do not use `if_not_exists` to hide destructive changes such as `remove_column`, `drop_table`, `rename_column`, or `change_column`.
   - Flag migrations that assume production schema is exactly in sync without guards.

2. **Production execution safety**
   - Flag instructions to run `RAILS_ENV=production rails db:migrate` manually.
   - Verify Replit Publish/Neon constraints are respected.
   - Check long-running operations, full-table locks, and backfills on large tables are bounded or split.

3. **Backfill safety**
   - Require dry-run counts, threshold aborts, and explicit target scopes for backfills.
   - Verify COPPA-related backfills do not overwrite existing consent evidence without preserving history.
   - Flag broad `update_all` calls without a scoped predicate, expected count, and safety ceiling.

4. **Data integrity and rollback**
   - Check indexes, constraints, nullability, defaults, and model assumptions stay compatible during deploy.
   - Verify destructive changes have a staged rollout or are explicitly out of scope.
   - Flag irreversible migrations unless the irreversibility is justified and operationally safe.

5. **Test and verification coverage**
   - Require migration specs or model/request specs for security-relevant schema behavior.
   - Require console/dry-run verification steps for production-sensitive data changes.

## Evidence Standard

Every finding must include:

- Exact migration, model, or doc path.
- Production failure mode or compliance risk.
- Safer migration/backfill approach.
- Verification command or RSpec example that proves the risk is mitigated.

Do not report generic preferences when the migration is additive, bounded, idempotent, and verified.
