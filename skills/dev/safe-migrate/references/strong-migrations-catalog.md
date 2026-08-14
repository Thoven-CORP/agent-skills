# strong_migrations check catalog (mirrored)

This is the dangerous-operation catalog from the `strong_migrations` gem (v2.8, Postgres). The gem
**refuses** these at migrate-time; this skill's **static analysis** (SKILL.md step 2) flags the same
operations **pre-flight**. One catalog, two enforcement points — keep them in sync.

When the gem reports a check by name, it prints the safe alternative. The skill should surface the
same alternative so the advisor and the runtime guard never disagree.

## Adding columns

| Check | Why dangerous | Safe alternative |
|-------|---------------|------------------|
| `add_column_default` / `_callable` | A volatile/expression default rewrites the whole table while holding a lock (Postgres < 11, or non-constant defaults). | Constant default on PG 11+ is safe. Otherwise: add the column, set the default in a separate statement, backfill in batches post-deploy. |
| `add_column_auto_incrementing` | `serial`/`bigserial`/identity adds a sequence + rewrites. | Add as plain integer/bigint, attach the sequence separately. |
| `add_column_generated_stored` | A `STORED` generated column rewrites the table. | Add the column, backfill in batches, or use a virtual/computed read path. |
| `add_column_json` | `json` (not `jsonb`) has no equality operator → breaks `DISTINCT`, some queries. | Use `jsonb`. |

## NOT NULL & constraints

| Check | Why dangerous | Safe alternative |
|-------|---------------|------------------|
| `change_column_null` / `_postgresql` | Setting `NOT NULL` on an existing column scans the whole table under a lock. | Add a `CHECK (col IS NOT NULL) NOT VALID`, `validate_check_constraint` separately, then `change_column_null` (PG 12+ then drops the redundant check). |
| `change_column_with_not_null` | Adding `null: false` together with a type/other change combines two locking ops. | Split into separate migrations. |
| `add_check_constraint` | Validates every existing row while locking. | Add with `validate: false`, then `validate_check_constraint` in a separate migration. |
| `validate_check_constraint` | Validation step still scans; do it alone. | Keep it in its own migration, off the schema change. |
| `add_unique_constraint` | Takes a heavy lock to build the backing index. | Add a unique index `algorithm: :concurrently`, then back the constraint with it. |
| `add_exclusion_constraint` | Locks while building. | Review lock window; isolate the migration. |

## Indexes

| Check | Why dangerous | Safe alternative |
|-------|---------------|------------------|
| `add_index` | Non-concurrent index build blocks writes for the duration. | `add_index ..., algorithm: :concurrently` **with** `disable_ddl_transaction!` at the top. |
| `remove_index` | Non-concurrent drop blocks. | `remove_index ..., algorithm: :concurrently`. |
| `add_reference` | Adds a non-concurrent index implicitly. | `add_reference ..., index: { algorithm: :concurrently }` (in its own migration, `disable_ddl_transaction!`). |
| `add_index_corruption` | A concurrent build that fails leaves an INVALID index. | `DROP INDEX CONCURRENTLY IF EXISTS …` then retry. (Same invalid-index sweep as SKILL.md step 1.) |
| `add_index_columns` | Too many indexed columns → slow, fragile. | Reduce the column set. |

## Foreign keys

| Check | Why dangerous | Safe alternative |
|-------|---------------|------------------|
| `add_foreign_key` | Validating the FK locks **both** tables against writes. | `add_foreign_key ..., validate: false`, then `validate_foreign_key` in a separate migration. |
| `validate_foreign_key` | Validation still scans. | Keep it in its own migration. |

## Destructive / rename (code-coupling risk)

| Check | Why dangerous | Safe alternative |
|-------|---------------|------------------|
| `remove_column` | ActiveRecord **caches the column list at boot**; the old container issues `SELECT *` and hits `cached plan must not change result type` when the column vanishes mid-deploy. | Two-deploy drop: deploy `self.ignored_columns += %w[col]` first, ship, then drop in a later deploy. (This is exactly what the destructive-migration GREEN test surfaced.) |
| `rename_column` / `rename_table` | Running code still references the old name → errors the instant the rename lands. | Add new + backfill + dual-write + switch reads + drop old; or a view. Never a bare rename on a live table. |
| `change_column` | A type change can rewrite the whole table and/or lose precision. | Add a new column, backfill, swap; or confirm the type change is a safe subtype. |
| `create_table` (force) | `force: true` silently drops an existing table. | Never use `force` outside throwaway/test scaffolding. |

## Escape hatches (use deliberately, never reflexively)

| Check | Note |
|-------|------|
| `execute` | Arbitrary SQL can't be statically checked — the gem can't reason about it, and neither can the skill. Review by hand; treat as high-risk. |
| `lock_option` / `copy_algorithm` | MySQL-specific lock/algorithm hints — N/A on Postgres. |
| `change_table` (block form) | A block can hide an unsafe op from per-line analysis — expand it and check each operation. |

If a flagged migration is genuinely safe in context, `strong_migrations` supports `safety_assured do … end`. Use it only with a written justification in the migration — it is the gem's equivalent of overriding the advisor, and it disables the runtime guard for that block.
