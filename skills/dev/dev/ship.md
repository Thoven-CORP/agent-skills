---
name: dev-ship
description: Use when shipping a validated feature to production via the /publish workflow. Final phase of the /dev pipeline. Triggers on /dev:ship or pipeline advancement past VALIDATE or HANDOVER.
---

# /dev:ship — Publish to Production

## Purpose

Ship the validated feature to production. Invokes `/publish` skill for the full publish workflow. Updates MANIFEST to mark feature as complete.

## Phase Pattern: RESEARCH > EXECUTE > DOCUMENT > GATE

---

## RESEARCH

### 1. Read Context
```
Read: docs/[feature]/.dev/MANIFEST.md → verify all prior phases complete
Read: docs/[feature]/prompt-transitions/ship.md → context from VALIDATE/HANDOVER
Read: CHANGELOG.md → check unreleased section
```

### 2. Pre-Ship Verification

Confirm all prerequisites:
- [ ] VALIDATE phase gate approved
- [ ] HANDOVER phase gate approved (if applicable, skip if backend-only)
- [ ] All MANIFEST acceptance criteria met (BUILD, VALIDATE, HANDOVER)
- [ ] Tests passing (`bundle exec rspec`)
- [ ] No uncommitted changes related to the feature

### 3. Migration Sync Check

If feature included migrations:
```bash
# Verify both environments have the migration
bundle exec rails db:migrate:status
RAILS_ENV=production bundle exec rails db:migrate:status
```

**If migration not applied in both environments:** STOP. Run `/safe-migrate` first.

### 4. Schema Drift Check

Verify local schema matches production to prevent Replit from generating destructive DDL:
```bash
# Compare latest migration version between local and production
LOCAL_LATEST=$(psql "$DATABASE_URL" -t -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
PROD_LATEST=$(RAILS_ENV=production rails runner "puts ActiveRecord::Base.connection.execute('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1').first['version']" 2>/dev/null | grep -E '^[0-9]+$')

if [ "$LOCAL_LATEST" != "$PROD_LATEST" ]; then
  echo "SCHEMA DRIFT DETECTED — run rails db:migrate locally before shipping"
fi
```

**If drift detected:** STOP. Sync schemas before proceeding.

---

## EXECUTE

### Invoke /publish

Invoke the `/publish` skill, which handles:
1. Find last published commit
2. List all unpublished commits
3. Verify CHANGELOG completeness
4. **GATE:** User confirms changelog
5. Determine version bump (ask user: patch/minor/major)
6. Update CHANGELOG.md
7. Run test suite
8. Create publish commit
9. Remind to deploy via Replit UI

**Let /publish run its full workflow.** It has its own gates and checks.

---

## DOCUMENT

### 1. Final MANIFEST Update

```markdown
**Status:** Complete

## Phase Progress
| 7 | SHIP | ✅ | [started] | [now] | Approved |

## Ship Details
- Version: [X.Y.Z]
- Published: [YYYY-MM-DD HH:MM UTC]
- Changelog entry: [summary]
```

### 2. Update CURRENT_STATUS.md

```markdown
# [Feature Name] — COMPLETE

**Status:** Feature Complete — Shipped
**Version:** [X.Y.Z]
**Published:** [date]

All phases completed. See MANIFEST for full history.
```

### 3. Update 01_IMPLEMENTATION_STATUS.md

Mark all tasks as complete with final status.

---

## GATE

`/publish` has its own approval gate (changelog completeness). After publish commit is created:

```
PHASE GATE: SHIP

Feature: [name] — COMPLETE
Version: [X.Y.Z]
Publish Commit: [hash]

Pipeline Summary:
  INTAKE:    ✅ [date]
  DISCOVER:  ✅ [date]
  PLAN:      ✅ [date]
  DOCUMENT:  ✅ [date]
  BUILD:     ✅ [date]
  VALIDATE:  ✅ [date]
  HANDOVER:  ✅ [date] (or N/A)
  SHIP:      ✅ [now]

⚠️  NEXT STEP: Click "Publish" in the Replit UI to deploy.

Remember:
- git push does NOT deploy — it only backs up to GitHub
- The Replit UI "Publish" button builds a new container
- Verify at https://thoven.co/health after publishing
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Shipping without VALIDATE approved | ALL prior gates must be approved |
| Migrations not synced between environments | Check BOTH local and production before ship |
| Telling user "it's deployed" | Only Replit UI deploys. Git push = backup only. |
| Skipping /publish's own gates | Let /publish run completely — don't shortcut |
