---
name: production-data-audit
description: Use when starting feature work that touches existing models, before writing feature code, when needing to understand production data completeness. Triggers on "audit", "data check", "production data", "before feature", "null check", "data completeness".
---

# Production Data Audit

## Overview

Audit production data completeness for models involved in upcoming feature work. Prevents production crashes from NULL fields, missing associations, and stale data.

**THIS IS A RIGID SKILL. YOU MUST COMPLETE THE AUDIT BEFORE WRITING FEATURE CODE.**

**Core Principle:** "Production Data is Messy" — NEVER assume required fields are populated, associations exist, or data follows current validations.

## MANDATORY First Action

Before ANY other action, you MUST create a todo checklist:

```
TaskCreate for each:
- [ ] Step 1: Identify models to audit
- [ ] Step 2: Invoke rails-expert agent for audit queries
- [ ] Step 3: Run audit queries in production
- [ ] Step 4: Generate completeness report
- [ ] Step 5: Generate defensive code suggestions
- [ ] Step 5.5: Soft delete awareness check
- [ ] GATE: User acknowledges audit before feature work
```

**YOU CANNOT SKIP THE CHECKLIST. CREATE IT NOW.**

---

## Step 1: Identify Models to Audit (MANDATORY)

Ask the user:

```
Which models are involved in the feature you're building?

Examples: Student, Enrollment, TeacherClass, SimpleBookingRequest

List all models that your feature will read from or write to.
```

If the user describes a feature instead of listing models, identify the models yourself from the description.

Mark task complete: `TaskUpdate: Step 1 → completed`

---

## Step 2: Invoke rails-expert Agent (REQUIRED)

**YOU MUST use the `rails-expert` agent to generate audit queries.**

The rails-expert understands ActiveRecord associations, validations, scopes, and the dual-auth system.

```
Task tool:
- subagent_type: "rails-expert"
- prompt: "Generate production audit Rails runner scripts for these models: [MODEL_LIST].

  For EACH model, generate a script that checks:
  1. Total record count (include archived_at nil vs not nil if applicable)
  2. Per-column NULL/blank/populated percentages
  3. Association presence percentages (e.g., 'Students with active_avatar', 'Enrollments with teacher_class')
  4. Recent records (last 30 days) vs older records — are newer records more complete?
  5. Any enum columns — distribution of values
  6. Orphaned record check — for each belongs_to association, count records
     where the foreign key is NOT NULL but the referenced record doesn't exist
     (hard-deleted or archived while child is still active). Example query pattern:
     orphaned = Model.where.not(fk_id: nil).where.not(fk_id: ParentModel.select(:id))
     archived_parent = Model.joins(:association).where.not(parent_table: { archived_at: nil }).where(child_table: { archived_at: nil })
  7. Schema constraint audit — for each model, compare database-level constraints
     (NOT NULL, foreign keys, check constraints) against what code assumes.
     Flag: columns that are NULLABLE in DB but code assumes present,
     belongs_to without foreign key constraint (orphans possible),
     boolean columns without NOT NULL + default (tri-state nil/true/false risk).

  Output as a single Rails runner script wrapped in:
  RAILS_ENV=production rails runner '...'

  Use safe queries — read-only, no writes. Handle errors gracefully.
  Format output as a clear report with sections per model."
- description: "Generate audit queries for [MODEL_LIST]"
```

**CONDITIONAL: If auditing analytics tables** (anything in `analytics.*` schema or `Analytics*` models), **YOU MUST ALSO invoke `master-backend-ai-rails`:**

```
Task tool:
- subagent_type: "master-backend-ai-rails"
- prompt: "Generate production audit queries for these analytics models/views: [ANALYTICS_LIST].
  Check materialized view freshness, row counts, and data recency."
- description: "Audit analytics tables"
```

Mark task complete: `TaskUpdate: Step 2 → completed`

---

## Step 3: Run Audit Queries in Production (MANDATORY)

Run the generated scripts:

```bash
RAILS_ENV=production rails runner "<script from rails-expert>"
```

Capture ALL output. If any query fails, note the error and continue with remaining queries.

Mark task complete: `TaskUpdate: Step 3 → completed`

---

## Step 4: Generate Completeness Report (MANDATORY)

**REQUIRED report format:**

```markdown
## Production Data Audit Report

**Date:** YYYY-MM-DD
**Models Audited:** [list]
**Feature Context:** [what the user is building]

---

### Model: [ModelName]

**Record Count:** X total (Y active, Z archived)

| Column | Type | % NULL | % Blank | % Populated | Risk |
|--------|------|--------|---------|-------------|------|
| `field_name` | string | 5% | 2% | 93% | ✅ Safe |
| `other_field` | uuid | 45% | 0% | 55% | ⚠️ WARNING |
| `missing_field` | string | 100% | 0% | 0% | 🔴 CRITICAL |

**Associations:**

| Association | % Present | Risk |
|-------------|-----------|------|
| `active_avatar` | 45% | ⚠️ WARNING — must use safe navigation |
| `enrollments` | 92% | ✅ Safe |
| `guardianship` | 100% | ✅ Safe |

**Risk Legend:**
- ✅ Safe: >80% populated — standard code OK
- ⚠️ WARNING: 50-80% populated — MUST use safe navigation (`&.`) and defaults
- 🔴 CRITICAL: <50% populated — MUST handle nil case explicitly with fallback
```

Mark task complete: `TaskUpdate: Step 4 → completed`

---

## Step 5: Generate Defensive Code Suggestions (MANDATORY)

For EVERY field or association marked ⚠️ WARNING or 🔴 CRITICAL, generate a defensive code pattern:

```ruby
# ⚠️ WARNING: student.active_avatar is NULL for 55% of students
# ❌ BAD — will crash for 55% of students
avatar_name = student.active_avatar.display_name

# ✅ GOOD — safe navigation with default
avatar_name = student.active_avatar&.display_name || "No avatar"
```

```ruby
# 🔴 CRITICAL: enrollment.cached_total_xp is NULL for 100% of new enrollments
# ❌ BAD — crashes on nil
xp = enrollment.cached_total_xp + bonus

# ✅ GOOD — explicit nil handling with default
xp = (enrollment.cached_total_xp || 0) + bonus
```

**MUST output these suggestions for ALL risky fields.** Do not skip any.

Mark task complete: `TaskUpdate: Step 5 → completed`

---

## Step 5.5: Soft Delete Awareness Check (MANDATORY)

For each model audited, check if it uses `archived_at` soft deletes:

```bash
RAILS_ENV=production rails runner "
  %w[MODEL_LIST].each do |model_name|
    klass = model_name.constantize
    if klass.column_names.include?('archived_at')
      total = klass.count
      active = klass.where(archived_at: nil).count
      archived = total - active
      pct = total > 0 ? (archived.to_f/total*100).round(1) : 0
      puts \"#{model_name}: #{total} total, #{active} active, #{archived} archived (#{pct}%)\"
    else
      puts \"#{model_name}: No soft deletes\"
    end
  end
"
```

**Flag in defensive code suggestions:**
```ruby
# ⚠️ Model uses soft deletes — X% of records are archived
# ❌ BAD — includes archived records
TeacherClass.where(teacher_profile_id: profile.id)

# ✅ GOOD — filter to active only
TeacherClass.where(teacher_profile_id: profile.id, archived_at: nil)
# Or use scope if available:
TeacherClass.active.where(teacher_profile_id: profile.id)
```

Mark task complete: `TaskUpdate: Step 5.5 → completed`

---

## APPROVAL GATE (MANDATORY STOP)

**⛔ STOP. DO NOT PROCEED TO FEATURE CODE.**

```
Production data audit is complete. Please review the report above.

**Summary:**
- ✅ Safe fields: X
- ⚠️ Warning fields: Y (require safe navigation)
- 🔴 Critical fields: Z (require explicit nil handling)

**Do you want to:**
1. **Proceed to feature work** — I'll apply defensive patterns from the audit
2. **Run additional audits** — Specify more models or deeper checks
3. **Backfill data first** — Create a script to populate missing fields before building the feature
```

**YOU CANNOT WRITE FEATURE CODE UNTIL USER ACKNOWLEDGES THE AUDIT.**

Mark gate complete after user responds: `TaskUpdate: GATE → completed`

---

## When NOT to Use
- Feature doesn't read from or write to existing models
- Working only with new tables that don't exist in production yet
- Pure refactoring with no behavioral changes

## Common Mistakes
- Running audit in development instead of production — data differs significantly
- Assuming >80% populated means safe — check WHICH records have nulls
- Forgetting soft delete awareness — archived records pollute queries
- Skipping the backfill option when critical fields are <50% populated
- Not checking for orphaned records (foreign key points to deleted parent)

---

## Quick Reference

| Risk Level | Threshold | Required Pattern |
|------------|-----------|-----------------|
| ✅ Safe | >80% populated | Standard code OK |
| ⚠️ Warning | 50-80% populated | `&.` safe navigation + defaults |
| 🔴 Critical | <50% populated | Explicit `nil?` check + fallback logic |

## Enforcement Summary

**YOU MUST:**
1. ✅ Create todo checklist at start
2. ✅ Use `rails-expert` agent to generate audit queries
3. ✅ Use `master-backend-ai-rails` for analytics tables
4. ✅ Run queries in production (not development)
5. ✅ Generate completeness report with risk levels
6. ✅ Provide defensive code for ALL ⚠️ and 🔴 fields
7. ✅ STOP at gate — wait for user acknowledgment

**YOU CANNOT:**
- ❌ Skip the audit and go straight to feature code
- ❌ Run audit in development (data differs from production)
- ❌ Ignore fields with <80% population
- ❌ Assume associations exist without checking
- ❌ Generate audit queries without rails-expert agent

---

## Appendix: Safe Backfill Script Template

If user chooses "Backfill data first" at the approval gate, generate a script following this pattern:

```ruby
# Safe Production Backfill Template
# Run with: RAILS_ENV=production rails runner "load 'scripts/backfill_X.rb'"

DRY_RUN = true  # Set to false after verifying output
BATCH_SIZE = 100

puts "=== Backfill [field_name] for [Model] ==="
puts "Mode: #{DRY_RUN ? 'DRY RUN' : '🔴 LIVE'}"

scope = Model.where(field_name: nil)
total = scope.count
puts "Records to update: #{total}"

updated = 0
scope.find_each(batch_size: BATCH_SIZE) do |record|
  new_value = # compute value
  if DRY_RUN
    puts "  Would update ##{record.id}: field_name = #{new_value}"
  else
    record.update_column(:field_name, new_value)  # skip validations for backfill
    updated += 1
  end
end

puts "#{DRY_RUN ? 'Would update' : 'Updated'}: #{updated}/#{total}"
```

**Backfill safety rules:**
- **ALWAYS** start with `DRY_RUN = true`
- Use `update_column` to skip validations (old records may fail current validations)
- Use `find_each` with batch_size to avoid memory issues
- Log progress for long-running backfills
- Test on 10 records first before running full backfill
