# Safe Migrate — sub-agent prompt templates

Dispatch is **judgment-based**, not automatic. Dispatching a specialist to review
`add_column :foo, :string, null: true` is the per-migration ceremony that made the old skill
skippable. Match the dispatch to the risk.

| Migration shape | Dispatch |
|-----------------|----------|
| Trivial: add nullable column, add index on small table | **None** — analyze inline, skip the agent |
| Non-trivial: destructive op, type change, FK, backfill, large table | **`rails-expert`** (correctness) |
| Performance: large table, lock-duration risk, backfill volume | **`postgres-pro`** (lock/rewrite analysis) |
| Touches a sensitive table (`users`, `students`, `profiles`, `guardianships`, `payment_methods`, `simple_booking_requests`, `simple_booking_slots`) | **`security-engineer`** (in addition) |

All dispatches are **advisory** — the agent reviews and reports. No agent runs a migration. The skill
is an advisor; production migrations run only inside the deploy (`/publish`).

---

## Rails Expert Migration Review

**Sub-agent:** `rails-expert` · **When:** non-trivial migration (see table above).

```
Task tool:
- subagent_type: "rails-expert"
- prompt: "Review these pending migration files for safety. ADVISORY ONLY — do not run any
  migration or database command; report findings.

  [LIST MIGRATION FILE PATHS]

  For EACH migration, check and report with severity:

  1. **Idempotency (additive DDL only):**
     - `add_column` / `add_index` / `add_foreign_key` SHOULD use `if_not_exists: true`
       (or a `column_exists?` / `index_exists?` / `foreign_key_exists?` guard).
     - Destructive DDL (`remove_column`, `drop_table`, `rename_column`, `change_column`) must
       NEVER use `if_not_exists`/`if_exists` to mask intent — flag it if it does. The fix for a
       risky destructive op is analysis + a runbook, not an idempotency guard.

  2. **Destructive operations → data-loss risk:**
     - `remove_column` / `drop_table` → 🔴 DATA LOSS — requires a production-data check + export plan
     - `change_column` → ⚠️ TYPE CHANGE — may rewrite the table / lose precision
     - `rename_column` / `rename_table` → ⚠️ REFERENCE BREAK — code still referencing the old name

  3. **NOT NULL constraints:**
     - `null: false` on an existing table with no `default:` → 🔴 WILL FAIL if any NULLs exist
     - `null: false` WITH `default:` → ✅ safe

  4. **Index safety:**
     - `add_index` without `algorithm: :concurrently` on a large existing table → ⚠️ TABLE LOCK
     - `algorithm: :concurrently` WITHOUT `disable_ddl_transaction!` → 🔴 WILL FAIL
     - After a failed concurrent index build, Postgres leaves an INVALID index. Check:
       `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;`
       Fix: `DROP INDEX CONCURRENTLY IF EXISTS index_name;`

  5. **Check constraints:** any `ADD CONSTRAINT CHECK` existing data might violate → 🔴 WILL FAIL.

  6. **Foreign keys:** `add_foreign_key` without `validate: false` → ⚠️ BLOCKS WRITES on both tables.
     Safe pattern: add with `validate: false`, then `validate_foreign_key` in a separate migration.

  Output a structured per-migration report with severity levels. Do NOT execute anything."
- description: "Advisory migration safety review"
```

---

## Postgres Pro Performance Review

**Sub-agent:** `postgres-pro` · **When:** large table, lock-duration risk, or high-volume backfill.

```
Task tool:
- subagent_type: "postgres-pro"
- prompt: "Assess the lock and performance profile of these migrations. ADVISORY ONLY — read-only
  analysis, do not run any migration.

  [MIGRATION FILE PATHS] + table sizes / index list from the production-reality inspection.

  Report:
  1. Will any operation take an ACCESS EXCLUSIVE lock, and for how long given the table size?
  2. Does any operation rewrite the whole table (e.g. some `change_column` type changes)?
  3. For a backfill: recommended batch size + throttle so it doesn't saturate the primary.
  4. Safer alternative phrasing (concurrent index, validate-in-two-steps, batched update).

  Output recommendations with expected lock duration. Do NOT execute anything."
- description: "Migration lock/performance review"
```

---

## Security Engineer Migration Review

**Sub-agent:** `security-engineer` · **When:** migration touches a sensitive table (see table above).

```
Task tool:
- subagent_type: "security-engineer"
- prompt: "Review these migrations for security implications. ADVISORY ONLY.

  [MIGRATION FILE CONTENTS] · Tables affected: [LIST]

  Check:
  1. New columns exposing sensitive data without encryption?
  2. Foreign key constraints / ON DELETE behavior correct?
  3. Could this break the dual-auth system (users vs students)?
  4. COPPA implications for student-table changes?
  5. Any authorization-bypass risk introduced?

  Report findings with severity levels. Do NOT execute anything."
- description: "Security review migrations"
```
