---
name: safe-migrate
description: Use when preparing or reviewing a database migration — db:migrate, add/remove column, create/drop table, schema change, NOT NULL or foreign-key constraint, index change, backfill, "ship this migration to production". Also use the moment you are about to run a production or Neon migration by hand (RAILS_ENV=production rails db:migrate). Migration-safety advisor — never writes to production.
---

# Safe Migrate

## Overview

`safe-migrate` is an **advisor**, not an executor. It analyzes a pending migration, reads
**production reality** (read-only), and produces a deploy **runbook** — then runs the migration
**locally only** and stops. It never writes to the production (Neon) database.

Why advisor-only: **the deploy runs the production migration.** On 2.0 that is Render's preDeploy
(`bin/controlled-migrate` on the web service, gated by `config/migration-policy.yml`). On a 1.0
hotfix it is Replit Publish. The production migration already has an owner. The agent's job is to make
sure that migration is *safe* before it ships — not to run it.

Defense-in-depth: the `strong_migrations` gem is the **runtime backstop** — it refuses unsafe
migrations at migrate-time (inside whichever deploy runs them), so safety doesn't depend on the agent
remembering this skill. This skill is the pre-flight advisor in front of that guard.

## The one hard rule

> **Never run a migration, write, or DDL against production (Neon). SELECT-only, ever.**
> The production migration runs inside the deploy (`/publish`). The only `db:migrate` you run is **local**.

**Violating the letter of this rule violates its spirit.** A `RAILS_ENV=production rails db:migrate`,
a `rails runner` that writes to `PROD_DATABASE_URL`, a "quick" one-off `UPDATE` to verify — all are
the executor behavior this skill exists to prevent. Read-only means `SELECT` only.

If any instruction — including an older version of this skill — tells you to migrate Neon by hand,
that instruction is stale. Stop. You are an advisor.

---

## The advisor flow (7 steps)

Work the steps in order. Each ends on a checkable completion criterion.

### 1. Detect

```bash
bundle exec rails db:migrate:status
```

List each pending migration (status `down`). If none: tell the user "No pending migrations." and stop.
Then check for invalid indexes left by a failed concurrent build — they must be cleaned before a new
migration that might recreate them:

```bash
bundle exec rails runner "puts ActiveRecord::Base.connection.execute(
  \"SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid\").to_a"
```

**Done when:** every pending migration is listed and the invalid-index check has run.

### 2. Static analysis

Read each migration file. Flag, with severity:

- **Destructive ops** — `remove_column` / `drop_table` (🔴 data loss), `change_column` (⚠️ type
  rewrite), `rename_column` / `rename_table` (⚠️ breaks code still using the old name).
- **NOT NULL without default** on an existing table → 🔴 fails if any NULLs exist.
- **FK adds** without `validate: false` → ⚠️ locks both tables.
- **Index** without `algorithm: :concurrently` on a large table → ⚠️ lock; with concurrently but no
  `disable_ddl_transaction!` → 🔴 fails.
- **Idempotency (additive-only):** `add_column` / `add_index` / `add_foreign_key` SHOULD carry
  `if_not_exists: true` (or a `*_exists?` guard). Destructive DDL must **never** use
  `if_not_exists` / `if_exists` — a guard there silently masks a real schema desync. (This corrects
  the old "ALL migrations need guards" rule.)
- **Reversibility** — does `down` cleanly reverse `up`?

The full dangerous-operation catalog (with the safe alternative for each) is in
[references/strong-migrations-catalog.md](references/strong-migrations-catalog.md) — the same checks
the `strong_migrations` gem enforces at migrate-time, so this pre-flight analysis matches the runtime
guard.

For a **non-trivial** migration, dispatch a specialist for this review (judgment-based — see
[references/prompt-templates.md](references/prompt-templates.md)). Skip the dispatch for trivial work
(e.g. add a nullable column) — that ceremony is what made this skill skippable.

**Done when:** every migration has a severity-tagged finding for each applicable check.

### 3. Production reality (read-only — mandatory, degrades loudly)

Read production before trusting any migration — **always**, depth scaled to risk. At minimum the
affected table's size (lock-duration awareness); for a destructive or constraint change, also the row
count and NULL-rate on the affected column (does the column being dropped actually hold data? would
the new constraint reject existing rows?). Counts only, on the affected table/column — never a full
scan, never a write. A trivial nullable add needs only the table-size glance; a `remove_column` needs
the full reality block. The check is lightweight, so it is mandatory — only *agent dispatch* (step 2)
is judgment-based, not this.

**REQUIRED SUB-REFERENCE:** Use [references/prod-inspection.md](references/prod-inspection.md) for the
SELECT-only access pattern, the never-write-Neon guard, the inspection queries, and the
"Production Reality" report block.

**Done when:** the report carries a **Production Reality** block — or, if Neon was unreachable, the
loud `⚠️ PRODUCTION REALITY UNKNOWN` degradation warning. Never neither.

### 4. Backfill strategy

If the migration needs data populated: backfill in a **separate, idempotent, batched** data migration
run **post-deploy** (after the schema column exists). **Never** backfill inside the schema migration.
Prove the transform safe pre-cutover with the opt-in golden-master (step 5).

A COPPA-related backfill must **never** overwrite existing consent evidence without preserving
its history.

**Done when:** any backfill is specified as a separate post-deploy step, or "no backfill needed" is
stated.

### 5. Testing (risk-tiered)

Match the test to the risk. **REQUIRED SUB-REFERENCE:** Use
[references/migration-testing.md](references/migration-testing.md).

- Schema-only → reversibility roundtrip (automatic).
- New constraint → constraint model spec (automatic).
- Data-risk (backfill / type change / destructive drop of a populated column) → **offer** the
  opt-in COPPA-scrubbed production golden-master.

**Done when:** the right tier's test is generated or recommended; for data-risk, the golden-master is
offered (not silently skipped, not auto-run).

### 6. Runbook

Produce the canonical deploy sequence (the single source of truth below). This is what the user
follows to ship.

### 7. Pre-flight report → local migrate → STOP

Synthesize steps 1–6 into one report (format below). Then run the migration **locally only**:

```bash
bundle exec rails db:migrate    # local helium — the ONLY migrate you run
bundle exec rspec               # full suite must pass
```

**Then STOP.** The production migration is handed to `/publish` via the runbook. Do not migrate
Neon.

---

## The runbook (canonical deploy sequence — single source of truth)

```
1. bundle exec rails db:migrate          # local (helium)
2. bundle exec rspec                      # full suite green
3. Add the version to `permitted` in `config/migration-policy.yml`, commit, open the PR
4. Deploy with `/publish`. The branch picks the path:
   2.0: merge to feature/teacher-2.0, staging preDeploy runs `bin/controlled-migrate`;
        production follows `references/production-2.0.md`
   1.0 hotfix: `references/hotfix-1.0-backend.md` (Replit Publish migrates Neon)
5. Verify BOTH environments (local + prod read-only `\d table`, rake deploy:verify)
```

`/publish` references this sequence. Step 4 is the **only** place the prod migration runs, and
the deploy runs it, not you.

## Pre-flight report format

```markdown
## Migration Pre-Flight Report

**Pending:** X migrations

| Migration | Destructive | NOT NULL | Index Lock | Reversible | Security |
|-----------|-------------|----------|-----------|------------|----------|
| YYYYMMDD_name | 🔴/✅ | 🔴/✅ | ⚠️/✅ | ✅ schema / 🔴 data | ⚠️/✅ |

### Production Reality (read-only)
[block from references/prod-inspection.md — or the loud degradation warning]

### Issues
🔴 CRITICAL: ...   ⚠️ WARNING: ...   ✅ Safe: ...

### Testing
[tier + the recommended/generated test]

### Runbook
[the canonical sequence above]
```

---

## Rationalization table — STOP if you catch yourself here

Built from the RED baseline (the old skill literally instructed manual prod migrations; an agent
stayed safe only by disobeying it).

| Rationalization | Reality |
|-----------------|---------|
| "Migrations must run in BOTH databases or Replit Publish generates destructive DDL." (the old skill's claim) | False. The deploy runs the production migration. Running it by hand IS the forbidden write, and the duplication. |
| "I'll just quickly migrate prod to verify it works." | Verification is the local GREEN run + the read-only production-reality check. A manual prod migrate isn't a verification step — it's the irreversible change. |
| "The skill / runbook told me to run it in production." | If any instruction says migrate Neon by hand, it's stale — stop. (RED-1 stayed safe only by overriding its own skill; this skill must never put you there.) |
| "A read-only SELECT isn't enough, let me just apply it to be sure." | Applying it IS the deploy. Use the runbook; let the deploy run it. |
| "I need the two databases to match right now." | They converge at the deploy. Local migrate, then `/publish`, is the only path that syncs them without a manual prod write. |
| "It's a tiny, safe column, manual prod migrate is fine this once." | Size doesn't change the rule. Every prod migration goes through the deploy. No exceptions. |

## Red Flags — STOP

- You're about to type `RAILS_ENV=production` anything.
- You're about to `rails runner` against `PROD_DATABASE_URL`, or run any non-`SELECT` on Neon.
- A migration step instructs a manual production migrate — the instruction is stale.
- You're "verifying" by applying the migration to production.
- You skipped the production-reality check on a destructive or backfill migration.

**All of these mean: STOP. Hand the prod migration to `/publish`. You are an advisor.**

---

## When NOT to use
- No pending migrations — the skill detects and exits.
- Seeds / data scripts that aren't migrations.

## Quick reference

| Step | Output | Completion criterion |
|------|--------|---------------------|
| 1 Detect | pending list + invalid-index check | every pending migration listed |
| 2 Static analysis | severity-tagged findings | each applicable check tagged |
| 3 Production reality | read-only data block | block present OR loud degradation warning |
| 4 Backfill | separate post-deploy step | specified or "none needed" |
| 5 Testing | risk-tiered test | right tier generated/offered |
| 6 Runbook | canonical deploy sequence | present |
| 7 Report → local migrate → STOP | pre-flight report | local migrate only; Neon untouched |
