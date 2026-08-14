# Migration testing — risk-tiered

Match the test to the **risk tier** of the migration. Cheap migrations get a cheap automatic test;
only data-risk migrations get the heavy, opt-in golden-master. Generating a golden-master for an
`add_column :foo, :string` is the ceremony that made the old skill skippable — don't.

| Tier | Migration shape | Test | Mode |
|------|-----------------|------|------|
| **Schema-only** | add nullable column, add index, drop empty/dead column | **Reversibility roundtrip** | automatic |
| **New constraint** | `null: false`, `add_foreign_key`, `CHECK` | **Constraint model spec** (rejects bad, accepts good) | automatic |
| **Data-risk** | backfill, `change_column` type, destructive drop of a column that holds data | **Production golden-master fixture** | **opt-in** (skill detects, flags, offers) |

A migration can hit more than one tier (a backfill that also adds a constraint) — run each applicable
test.

## Tier 1 — reversibility roundtrip (automatic)

Proves the migration's `down` actually reverses its `up`, and that re-applying is clean. This is the
default test for any schema-only change.

```bash
bin/rails db:migrate && bin/rails db:rollback STEP=1 && bin/rails db:migrate
# Then assert the schema artifact is byte-identical to before the roundtrip:
git diff --exit-code db/structure.sql
```

- A non-empty `git diff` on `db/structure.sql` after the roundtrip means the migration is **not
  cleanly reversible** (or leaks state) — flag it 🔴 and show the diff.
- If `down` raises `ActiveRecord::IrreversibleMigration`, the roundtrip can't run — flag the migration
  as IRREVERSIBLE in the report and note that rollback is a restore-from-snapshot, not a `db:rollback`.

## Tier 2 — constraint model spec (automatic)

When the migration adds a constraint, the constraint is the behavior — test it at the model layer:
the model rejects data that violates it and accepts data that satisfies it.

```ruby
# spec/models/..._constraint_spec.rb
it "rejects a row that violates the new NOT NULL constraint" do
  expect {
    Student.connection.execute("INSERT INTO students (id) VALUES (gen_random_uuid())")
  }.to raise_error(ActiveRecord::NotNullViolation)
end

it "accepts a row that satisfies it" do
  expect(build(:student, target_column: "ok")).to be_valid
end
```

For `add_foreign_key validate: false` + later `validate_foreign_key`, test that the orphan it would
reject is rejected once validation lands.

## Tier 3 — production golden-master fixture (OPT-IN)

For data-risk migrations (backfills, type changes, destructive ops on populated columns), prove the
transform is correct **against real-shaped production data, before cutover** — the slot-tz pattern
(`a336ef61` / `b3c86b3c`), but generated, not hand-built.

The skill **detects the data risk, flags it, and offers** to generate this. It does not run
automatically — it samples production and is heavier than the other tiers.

### Recipe

1. **Sample representative rows read-only** from Neon (see `references/prod-inspection.md` for access).
   Pull a bounded, representative set — e.g. rows spanning the NULL/non-NULL split and edge values —
   not the whole table.

   ```sql
   SELECT id, legacy_avatar_url
   FROM students
   WHERE legacy_avatar_url IS NOT NULL
   ORDER BY random() LIMIT 200;
   ```

2. **COPPA scrub — HARD GATE.** Before the sampled rows touch a committed fixture, scrub or anonymize
   every student-identifying field (names, emails, avatars, free text, external IDs), or restrict the
   sample to non-identifying columns only. **No raw student PII may be committed, ever.** If you can't
   prove a column is non-identifying, scrub it.

3. **Write the fixture** (seed the scrubbed rows into the test DB or a fixture file).

4. **Run the migration / backfill against the fixture**, then **assert the post-state** — the backfill
   produced the right values, the type change preserved every value, the drop removed only what was
   intended. This is the proof that the transform is safe pre-cutover.

```ruby
it "backfills timezone for every legacy row without dropping data" do
  load_scrubbed_golden_master            # step 3
  run_migration                          # step 4: the up + backfill
  expect(Student.where(timezone: nil)).to be_empty
  expect(Student.count).to eq(golden_master_row_count)   # nothing lost
end
```

A green golden-master is the evidence that lets a destructive or backfill migration ship with
confidence. A red one is the cheapest place to discover the transform is wrong.
