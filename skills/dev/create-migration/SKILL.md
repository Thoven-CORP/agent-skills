---
name: create-migration
description: Create standardized Rails migrations following project conventions (UUID keys, soft deletes, check constraints, proper indexing)
---

# Create Migration Skill

Generate Rails 7.2 migrations that follow this project's database conventions.

## Required Conventions

### 1. UUID Primary Keys
Always use `id: :uuid` for new tables:
```ruby
create_table :table_name, id: :uuid do |t|
```

### 2. Foreign Key References
Use `type: :uuid` for all references:
```ruby
t.references :teacher_class, null: false, foreign_key: true, type: :uuid
# Or for custom column names:
t.uuid :teacher_profile_id, null: false
```

### 3. Foreign Key Constraints with on_delete
Always specify deletion behavior:
```ruby
# Cascade: delete children when parent deleted (common for owned data)
add_foreign_key :child_table, :parent_table, on_delete: :cascade

# Restrict: prevent parent deletion if children exist (audit logs)
add_foreign_key :audit_logs, :students, on_delete: :restrict

# Nullify: set FK to null when parent deleted (optional associations)
add_foreign_key :sessions, :students, on_delete: :nullify
```

### 4. Soft Deletes
Add `archived_at` for user-facing records that need soft delete:
```ruby
t.datetime :archived_at
add_index :table_name, :archived_at
```

### 5. Check Constraints
Use SQL check constraints for business rules:
```ruby
# Enum-like constraints
execute <<-SQL
  ALTER TABLE wallet_entries
  ADD CONSTRAINT check_duration_minutes
  CHECK (duration_minutes IN (30, 45, 60))
SQL

# Positive value constraints
execute <<-SQL
  ALTER TABLE booking_requests
  ADD CONSTRAINT booking_requests_positive_credits
  CHECK (total_credits > 0);
SQL
```

### 6. Index Strategy
```ruby
# Single column indexes for common lookups
add_index :sessions, :date
add_index :bookings, :status

# Composite indexes for combined queries
add_index :sessions, [:teacher_class_id, :date]
add_index :sessions, [:student_id, :date]

# Unique constraints
add_index :wallet_entries, [:teacher_id, :student_id, :duration_minutes],
          unique: true, name: 'idx_wallet_unique_combination'
```

### 7. Common Column Patterns
```ruby
# Timestamps (always include)
t.timestamps

# Status enums (integer with comment)
t.integer :status, null: false, default: 0  # pending=0, approved=1, denied=2

# String limits
t.string :title, null: false, limit: 100

# Text limits
t.text :description, limit: 500

# Monetary amounts (use integer cents or decimal)
t.integer :amount_cents, null: false, default: 0

# Timezone-aware timestamps
t.timestamptz :scheduled_at, null: false
```

## Migration Template

```ruby
class Create[TableName] < ActiveRecord::Migration[7.2]
  def change
    create_table :[table_name], id: :uuid do |t|
      # References with UUID type
      t.references :parent_model, null: false, foreign_key: true, type: :uuid

      # Custom FK column names
      t.uuid :teacher_profile_id, null: false

      # Regular columns
      t.string :name, null: false, limit: 100
      t.integer :status, null: false, default: 0

      # Soft delete support (if needed)
      t.datetime :archived_at

      t.timestamps
    end

    # Indexes
    add_index :[table_name], :status
    add_index :[table_name], :archived_at
    add_index :[table_name], [:parent_model_id, :status]

    # Custom foreign keys with on_delete behavior
    add_foreign_key :[table_name], :profiles, column: :teacher_profile_id, on_delete: :cascade

    # Check constraints for business rules
    execute <<-SQL
      ALTER TABLE [table_name]
      ADD CONSTRAINT [constraint_name]
      CHECK ([condition]);
    SQL
  end
end
```

## Naming Conventions

- Table names: plural, snake_case (`student_practice_sessions`)
- Foreign keys: singular model name + `_id` (`teacher_class_id`)
- Indexes: auto-generated or `idx_[table]_[purpose]`
- Constraints: `check_[column]` or `[table]_[rule]`
