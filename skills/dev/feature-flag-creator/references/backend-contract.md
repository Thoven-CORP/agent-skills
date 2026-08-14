# Backend flag contract (Rails — thoven/backend)

The admin panel list is `FeatureFlag.order(:name)` — **data-driven, no registry**. Creating a `feature_flags` row is all that's needed for the flag to appear at `/admin/settings` with a toggle. Per-teacher overrides are then free via `TeacherFeatureFlagService` (Decision D15: global ON = everyone; global OFF = only teachers with a row in `teacher_feature_flags`). Single primary Postgres DB — do not target a secondary.

## 1. Idempotent data migration (required — this is what makes it appear in admin)

Model exactly after `db/migrate/20260506000000_enable_live_lessons_global_feature_flag.rb`. Use an inline migration-local model class and `find_or_create_by!` so it is safe to re-run and safe in production:

```ruby
class Add<Key>FeatureFlag < ActiveRecord::Migration[7.2]
  class MigrationFeatureFlag < ActiveRecord::Base
    self.table_name = "feature_flags"
  end

  def up
    flag = MigrationFeatureFlag.find_or_create_by!(key: "<key>") do |f|
      f.name = "<Name>"
      f.description = "<one-line description shown in admin>"
      f.enabled = false           # ships dark
    end
    Rails.logger.info("[Migration] <key> flag — id=#{flag.id} enabled=#{flag.enabled}")
  end

  def down
    MigrationFeatureFlag.find_by(key: "<key>")&.destroy
  end
end
```
`feature_flags` columns: `name` (NOT NULL), `key` (NOT NULL, unique), `description`, `enabled` (NOT NULL default false). UUID pk.

## 2. `db/seeds.rb` — matching entry (dev freshness, ~L538–576)
Same idempotent shape so fresh dev DBs have it:
```ruby
FeatureFlag.find_or_create_by!(key: "<key>") do |flag|
  flag.name = "<Name>"
  flag.description = "<one-line description>"
  flag.enabled = false
end
```

## 3. Server-side gating (only if the flag gates real backend behavior, not just UI)

Combine the flag with business logic, default-deny on exception, and expose it as a single-source method so the serializer and any guard agree. Model after `Announcement#in_audience?` + `User#community_eligible?`:

```ruby
# In the relevant model/service — single source of truth
def <feature>_enabled_for?(teacher_profile_id)
  TeacherFeatureFlagService.enabled?("<key>", teacher_profile_id) && <business_logic>
rescue => e
  Rails.logger.error("[<Feature>] teacher=#{teacher_profile_id} #{e.class}: #{e.message}")
  Sentry.capture_exception(e) if defined?(Sentry) && Sentry.initialized?
  false   # NEVER return true from the rescue
end
```
`TeacherFeatureFlagService.enabled?(key, teacher_profile_id)` returns `false` for a missing flag, so it fails closed.

## 4. Specs — cover the D15 matrix
In `spec/services/...` or the model spec:
- global ON → enabled for everyone (even with no override row)
- global OFF + `teacher_feature_flags` row for this teacher → enabled for that teacher
- global OFF + no override row → disabled
- flag key does not exist → `false`
If a gating method was added, also spec it with the flag both ON and OFF.

## Verify
- `bundle exec rspec <new specs>`
- Run the migration locally, then `GET /api/v1/admin/settings/feature_flags` and confirm `<key>` appears with a toggle.

## Then print the cross-repo reminder
> ⚠️ This backend row does nothing on its own. Run this skill in the Next.js repo (`thoven/frontend`) to wire `RemoteFlags` + `DEFAULT_FLAGS` + consumption. Frontend checklist: `references/frontend-contract.md`.
