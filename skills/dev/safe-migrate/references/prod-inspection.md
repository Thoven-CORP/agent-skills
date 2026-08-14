# Production Reality — read-only Neon inspection

The **production reality** check answers one question a static read of a migration file cannot:
*does the data this migration touches actually exist, and how much of it?* Dropping a column
that holds data for 1,278 students is a different decision than dropping an always-NULL column.

This reference is loaded by the **Live production inspection** step of `safe-migrate`. It is
**read-only**. The skill is an **advisor** — it never changes production.

## The one hard rule

> **NEVER run INSERT / UPDATE / DELETE / DDL (or any write) against Neon. SELECT only.**

Replit Publish runs the Neon migration during its build step (see the runbook in `SKILL.md`).
This inspection exists to *describe* production, never to *change* it.

If you catch yourself about to run anything other than a `SELECT`, stop — that is the executor
behavior this skill was rewritten to remove.

## Access

```bash
# Load the prod connection string from .env (it is NOT exported by default), then open a session.
set -a && source .env && set +a && psql "$PROD_DATABASE_URL"
```

- `PROD_DATABASE_URL` lives in the repo `.env` (gitignored). `mcp__postgres` is **local-only** and
  cannot reach prod — use `psql` as above.
- Prefer one-shot `psql "$PROD_DATABASE_URL" -c "SELECT ..."` per query so each call is auditable.
- Open the session **read-only** when the shell supports it:
  `psql "$PROD_DATABASE_URL" -c "SET default_transaction_read_only = on;"` then run your SELECTs in
  the same session, so an accidental write is rejected by Postgres itself.

## Graceful degradation (mandatory)

The inspection is **mandatory but degrades**. If Neon is unreachable (no `PROD_DATABASE_URL`, network
failure, auth error):

- Do **not** silently skip it. Fall back to static-analysis-only.
- Emit a **loud warning** in the pre-flight report:
  `⚠️ PRODUCTION REALITY UNKNOWN — could not reach Neon; this report is static-analysis-only. The
  data-volume risk below is UNVERIFIED.`

A safety skill that *optionally* checks safety is not a safety skill. The warning is non-negotiable
when the live check did not run.

## What to inspect (lightweight — affected columns only)

Run counts and rates on the **specific table/column the migration touches**, never full scans.
Substitute the real table/column from the migration file (they come from your own analysis, not user
input — safe to interpolate).

**Row count + NULL rate on the target column** — the core "is there data here?" check:

```sql
SELECT count(*)                                                              AS rows,
       count(legacy_avatar_url)                                              AS non_null,
       round(100.0 * (count(*) - count(legacy_avatar_url)) / greatest(count(*),1), 1) AS null_pct
FROM students;
```

**Table size** — proxy for lock-duration / rewrite risk (a rewrite on a 5 GB table is a different
deploy than on a 5 MB one):

```sql
SELECT pg_size_pretty(pg_total_relation_size('students')) AS total_size;
```

**Existing indexes** — adding/removing an index that already exists, or locking a hot index:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'students';
```

**For a NOT NULL add** — how many rows would the new constraint reject right now:

```sql
SELECT count(*) AS would_violate FROM students WHERE <target_column> IS NULL;
```

### COPPA guard on `students` and other student tables

Counts, NULL rates, sizes, and index metadata are **aggregate and non-identifying** — safe to read.
Do **not** `SELECT` identifying student rows here. Pulling representative rows for a fixture is a
separate, opt-in step that **requires scrubbing** — see `references/migration-testing.md`.

## The "Production Reality" report block

The inspection produces one block in the pre-flight report. State it as a fact about production,
then the consequence, then the recommendation — in that order:

```markdown
### Production Reality (read-only Neon inspection)

`students.legacy_avatar_url`: 14,203 rows, 9% non-NULL.
→ DROP destroys data for 1,278 students.
Recommendation: export `id, legacy_avatar_url WHERE legacy_avatar_url IS NOT NULL` to an archive
table/CSV before the drop ships. (Or confirm the data is truly dead.)

`students` total size: 48 MB · indexes: 6.
→ Low lock-duration risk for a metadata-only column drop.
```

If the live check did not run, this block is replaced by the loud degradation warning above.
