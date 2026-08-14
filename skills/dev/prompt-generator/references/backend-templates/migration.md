# Migration Prompt Template

Use for: "migration", "schema change", "add column", "index", "create table"

## Template Structure

```
Migration Goal: [What schema change and why]

Current State:
- Table(s) affected: [table names]
- Current schema: [relevant columns from db/schema.rb or .claude/docs/ARCHITECTURE.md]
- Row count estimate: [small (<1K), medium (1K-100K), large (100K+)]

Schema Change:
- [ADD/REMOVE/MODIFY column/table/index/constraint]
- Type: [string, integer, uuid, jsonb, datetime, etc.]
- Nullable: [true/false]
- Default: [value or none]
- Index: [yes/no, unique?, composite?]
- Foreign key: [references table, type uuid]

Safety Checklist:
- [ ] Reversible? (change method or explicit up/down)
- [ ] Zero-downtime? (no column renames, no removing columns in use)
- [ ] Large table? (use algorithm: :concurrently for indexes)
- [ ] NOT NULL on existing column? (add nullable first → backfill → add constraint)
- [ ] Data migration needed? (separate migration from schema change)
- [ ] Foreign key references use UUID type?

Rollback Plan:
- [How to reverse this migration safely]
- [Data preservation during rollback]

Deployment:
- Run in BOTH environments:
  - rails db:migrate (local helium DB)
  - RAILS_ENV=production rails db:migrate (Neon production DB)

Pattern Files:
- Recent migration: db/migrate/20260310152511_create_esa_leads.rb
- Schema reference: .claude/docs/ARCHITECTURE.md
```

## Example: Add Practice Sessions Table

```
Migration Goal: Create practice_sessions table for student practice tracking

Current State:
- No existing practice tables
- Related: students table (UUID primary key), profiles table
- Students table row count: small (<1K)

Schema Change:
```ruby
# db/migrate/YYYYMMDDHHMMSS_create_practice_sessions.rb
class CreatePracticeSessions < ActiveRecord::Migration[7.2]
  def change
    create_table :practice_sessions, id: :uuid do |t|
      t.references :student, null: false, foreign_key: true, type: :uuid
      t.string :instrument, null: false
      t.integer :duration_minutes, null: false
      t.text :notes
      t.datetime :practiced_at, null: false
      t.datetime :archived_at  # soft delete

      t.timestamps
    end

    add_index :practice_sessions, :student_id
    add_index :practice_sessions, :practiced_at
    add_index :practice_sessions, [:student_id, :practiced_at]
    add_index :practice_sessions, :archived_at

    execute <<-SQL
      ALTER TABLE practice_sessions
      ADD CONSTRAINT check_duration_positive
      CHECK (duration_minutes > 0 AND duration_minutes <= 480);
    SQL
  end
end
```

Safety Checklist:
- [x] Reversible — create_table is auto-reversible (CHECK constraint needs explicit down)
- [x] Zero-downtime — new table, no impact on existing tables
- [x] Large table — N/A, new table
- [x] NOT NULL — all NOT NULL columns have values at creation time
- [x] Data migration — none needed, new table
- [x] Foreign keys use UUID — yes, type: :uuid

Rollback Plan:
- drop_table :practice_sessions (automatic via change method)
- CHECK constraint removal needs explicit: execute "ALTER TABLE practice_sessions DROP CONSTRAINT check_duration_positive"

Deployment:
- rails db:migrate
- RAILS_ENV=production rails db:migrate
- Verify: rails console → PracticeSession.columns.map(&:name)
```

## Example: Add Column to Existing Table

```
Migration Goal: Add time_zone column to practice_sessions

Current State:
- Table: practice_sessions (exists, <1K rows)
- Need: store practice timezone for display purposes

Schema Change:
```ruby
class AddTimeZoneToPracticeSessions < ActiveRecord::Migration[7.2]
  def change
    add_column :practice_sessions, :time_zone, :string, default: "America/New_York"
    # Safe: adding nullable column with default is instant on PostgreSQL 11+
  end
end
```

Safety Checklist:
- [x] Reversible — add_column auto-reverses
- [x] Zero-downtime — adding column with default is safe
- [x] Large table — N/A (<1K rows)
- [x] No NOT NULL constraint on existing data
- [x] No data migration needed (default covers existing rows)
- [x] No foreign key

Rollback Plan:
- remove_column :practice_sessions, :time_zone
```
