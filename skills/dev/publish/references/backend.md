# Publish Workflow

## Overview

Automates the full publish workflow: find unpublished commits, verify changelog completeness, bump version, create publish commit, and remind to deploy via Replit UI.

**THIS IS A RIGID SKILL. FOLLOW EVERY STEP IN ORDER. NO SHORTCUTS.**

## MANDATORY First Action

Before ANY other action, you MUST create a todo checklist:

```
TaskCreate for each:
- [ ] PRE-CHECK 0: Verify Neon matches last "Published" marker (catch stale markers)
- [ ] PRE-CHECK 1: Replit-Shell migrate so Replit-local helium matches origin/main
- [ ] Step 1: Find last published commit
- [ ] Step 2: List all unpublished commits
- [ ] Step 3: Verify CHANGELOG completeness
- [ ] GATE: User confirms changelog is complete
- [ ] Step 4: Determine version bump
- [ ] Step 5: Update CHANGELOG.md
- [ ] Step 5.5: Run test suite
- [ ] Step 5.6: Verify contract-manifest freshness
- [ ] Step 6: Create publish commit
- [ ] Step 6.5: Linear ticket cross-check (release-cited THV IDs exist)
- [ ] Step 6.9: Pending post-publish actions (stage:awaiting-publish)
- [ ] Step 7: Replit deploy checklist
```

## Three-Environment Reference (CRITICAL — read once, then apply)

This workflow spans three environments. Confusing them is the #1 publish failure mode. Full architecture: `.claude/docs/DEPLOYMENT.md`.

| Environment | DB | Migrate command | Notes |
|---|---|---|---|
| LOCAL (Warp `~/thoven/backend`) | local PG (`thoven_development`) | `rails db:migrate` from Warp Shell | Where you wrote the migration |
| **REPLIT LOCAL** (Replit Shell) | **Replit's helium PG** (`$DATABASE_URL` on Replit) | `rails db:migrate` from **Replit Shell**, no `RAILS_ENV` | **What Replit Publish diffs against Neon** |
| PRODUCTION (Neon) | Neon | Replit Publish UI click runs `db:migrate` automatically | Never touch manually |

⚠️ When this skill says "LOCAL helium" it means BOTH Warp local AND Replit local. The Replit-local helium migrate is the load-bearing step — Replit Publish compares Replit-local-helium schema to Neon to build its deploy diff. If Replit-local helium is not migrated, Publish has nothing to ship.

⚠️ HARD CONSTRAINT (per CLAUDE.md + memory `feedback_never_manual_production_migrate`):
- ❌ NEVER `RAILS_ENV=production rails db:migrate`
- ❌ NEVER `RAILS_ENV=production rails runner` that mutates Neon
- ❌ NEVER manually `INSERT INTO schema_migrations` on Neon
- ❌ NEVER `db:structure:load` against Neon
- ✅ `rails db:migrate` (no `RAILS_ENV`) on Warp Shell = Warp helium
- ✅ `rails db:migrate` (no `RAILS_ENV`) on Replit Shell = Replit helium
- ✅ Replit Publish UI click = production Neon

---

## PRE-CHECK 0: Verify Neon Matches Last "Published" Marker (MANDATORY)

⚠️ The skill detects "unpublished commits" by grepping commit messages for `Publication Status: Published`. That marker is **a claim**, not proof — prior sessions can mark a commit Published and never actually click the Replit Publish UI (Step 7 reminder skipped, browser closed, etc). When that happens, this skill computes a phantom "incremental" delta on top of code that was never actually deployed.

**Verify the marker is true before building on it.**

From **Replit Shell** (READ-ONLY):

```bash
psql $DATABASE_URL -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

Compare top Neon version against the migrations introduced by the last `Publication Status: Published` commit (find via `git log --grep="Publication Status: Published" -1 --format="%H %s"` then `git show --stat <hash> -- db/migrate/`).

**If Neon's top version matches → previous Publish actually landed.** Proceed.

**If Neon is behind expected (missing one or more migrations from a "Published" commit) → the previous Publish was never clicked.** STOP. Do NOT treat the last "Published" commit as a baseline. Either:
- Recompute the unpublished range starting from the last commit whose migrations are actually on Neon, OR
- Treat this Publish as the first-ever deploy of all accumulated work since the actually-deployed baseline.

Either way, the incremental-delta mental model is wrong and the migrations on Neon will be applied in order during this Publish — design your changelog / verification accordingly.

Mark task complete: `TaskUpdate: PRE-CHECK 0 → completed`

---

## PRE-CHECK 1: Replit-Shell Migrate (MANDATORY when migrations exist)

⚠️ Code was written locally in Warp. Sync Replit Shell so Replit Publish has something meaningful to diff:

```
1. Replit Shell: git pull --ff-only          ⚠️ ALWAYS --ff-only (see below)
2. Replit Shell: git log --oneline -3        (must match origin/main)
3. Replit Shell: bundle install              ⚠️ REQUIRED EVERY PUBLISH (see below)
4. Replit Shell: rails db:migrate            (no RAILS_ENV — defaults to Replit's dev env, migrates Replit's local helium)
5. Replit Shell: rails db:migrate:status | tail -10   (verify your new migrations show `up`)
6. Local testing already done in Warp (rspec). Replit workspace rspec is optional.
```

⚠️ **`bundle install` is not optional and is not a one-off.** `git pull` carries
`Gemfile.lock` but never the installed gems, so any release whose lockfile moved
dead-ends step 4 with:

```
Could not find <gem>-<version> in locally installed gems
Run `bundle install --gemfile /home/runner/workspace/Gemfile` to install missing gems.
```

This recurs on every publish, not just lockfile-changing ones. Nothing has run at
that point — no partial migration state — so the fix is simply `bundle install`
then re-run step 4. Production is unaffected either way: `.replit`'s build command
runs its own `bundle install` before `db:migrate`. This is a Shell-only step.

Skipping it also silently skips the Strong Migrations pre-flight, since the gem
has to be installed to evaluate anything (`dd-bad40`).

⚠️ **ALWAYS use `git pull --ff-only` in Replit Shell.** Replit's deploy pipeline silently creates empty `"Published your App"` marker commits on its local `main`, and historic Replit Shell sessions may have left interactive `Merge branch 'main' ...` commits behind. A plain `git pull` against that state creates an auto-merge that:
- Garbles the merge commit message if the user's next keystrokes land in git's commit-message editor (`"git log --oneline -3Merge branch..."`)
- Leaves Replit `main` ahead of `origin/main` with junk commits in the lineage
- Causes Replit Publish to deploy from the divergent local HEAD instead of `origin/main`

`--ff-only` refuses to merge and fails loudly instead — surfacing the divergence so it can be cleaned up before publish. See memories `feedback_replit_published_marker` + `feedback_replit_branch_sync`.

**Recovery if a plain `git pull` already created the auto-merge:**
```bash
git log --oneline origin/main..HEAD
# If the only local-only commits are "Published your App" empty markers
# and "Merge branch 'main'..." auto-merges (no real code changes), reset:
git reset --hard origin/main
git log --oneline -3   # confirm HEAD matches origin/main
```
If `git log --oneline origin/main..HEAD` shows a real local commit (rare — only happens if you edited files in Replit Shell), STOP and preserve it via cherry-pick before resetting.

The Replit-local helium migrate at Step 3 is the load-bearing step. Without it, Publish ships nothing new.

**Do not proceed to Step 1 of the publish flow until Replit-local helium reflects origin/main.**

**YOU CANNOT SKIP THE CHECKLIST. CREATE IT NOW.**

---

## Step 1: Find Last Published Commit (MANDATORY)

```bash
git log --grep="Publication Status: Published" -1 --format="%H %s"
```

If no published commit found, use first commit as baseline:
```bash
git rev-list --max-parents=0 HEAD
```

Mark task complete: `TaskUpdate: Step 1 → completed`

---

## Step 2: List All Unpublished Commits (MANDATORY)

```bash
git log <last_published_hash>..HEAD --oneline --no-merges
```

Output each commit with its message. Count total unpublished commits.

**If zero unpublished commits exist:** STOP. Tell user "Nothing to publish." and exit.

Also check for pending migrations in unpublished commits:

```bash
git log <last_published_hash>..HEAD --oneline -- db/migrate/
```

If migrations exist, follow the Safe Migration Protocol before clicking Publish:

```
⚠️  PENDING MIGRATIONS DETECTED — Safe Migration Protocol

SAFE MIGRATION PROTOCOL (rewritten 2026-04-24 after 3 schema_migrations desync incidents in 90 days)
════════════════════════════════════════════════════════════════════════════════════════════════════

HARD RULES (see CLAUDE.md HARD CONSTRAINT + memory feedback_never_manual_production_migrate):
  ❌ NEVER run `RAILS_ENV=production rails db:migrate`
  ❌ NEVER run `RAILS_ENV=production rails runner` that mutates Neon (DML/DDL)
  ❌ NEVER manually `INSERT INTO schema_migrations` on Neon
  ❌ NEVER run `db:structure:load` against Neon
  ✅ `rails db:migrate` is for LOCAL helium only
  ✅ Replit Publish owns Neon migrations — it runs `rails db:migrate` on Neon as part of the pipeline

AUTHORING RULES (see CLAUDE.md "Migration authoring convention"):
  ✅ Additive DDL uses `if_not_exists: true` — survives Neon schema_migrations desync:
        add_column :table, :col, :string, if_not_exists: true
        add_index  :table, :col, if_not_exists: true
  ❌ Destructive DDL (remove_column / drop_table / rename_column / change_column) stays LOUD —
     do NOT apply `if_exists:` to these. Unexpected state should fail fast.

STEPS (covers all three environments per the table above):

1. WARP-LOCAL MIGRATE (Warp Shell → local helium PG):
     rails db:migrate
     bundle exec rspec
     git diff db/structure.sql   # inspect — should match intent

2. COMMIT + PUSH to GitHub (Warp Shell).

3. REPLIT-LOCAL MIGRATE (Replit Shell → Replit's helium PG via $DATABASE_URL):
     git pull --ff-only                        # ALWAYS --ff-only — see PRE-CHECK 1 for why
     rails db:migrate                          # NO RAILS_ENV (banned per HARD CONSTRAINT)
     rails db:migrate:status | tail -10        # verify all new migrations show `up`

   This step is load-bearing. Replit Publish compares Replit-local-helium schema
   against Neon to compute the deploy diff. Skipping this = Publish ships nothing.

4. PRE-FLIGHT — Data conflict check for UNIQUE constraints (READ-ONLY on Neon):
   If your migration adds a UNIQUE constraint/index, check Neon for duplicates BEFORE Publish.
   From Replit Shell (read-only SELECT — do NOT issue DML/DDL):

     psql $DATABASE_URL -c "SELECT col1, col2, COUNT(*) FROM the_table GROUP BY col1, col2 HAVING COUNT(*) > 1 LIMIT 20;"

   If duplicates found → write a data-cleanup migration that runs BEFORE the unique-constraint
   migration. Never hand-edit Neon.

   Note: on Replit Shell, $DATABASE_URL points to Replit-local helium (NOT Neon).
   To query Neon directly use the production DATABASE_URL exposed via Replit secrets
   (variable name may differ — check `env | grep -i db` if unsure).

5. CLICK PUBLISH in Replit UI. Replit's publish pipeline:
   - Diffs Replit-local-helium schema vs Neon
   - Runs `RAILS_ENV=production rails db:migrate` against Neon during the build step
   - Boots new puma container with Solid Queue plugin

6. POST-DEPLOY VERIFY (READ-ONLY against Neon, from Replit Shell using the production DB URL):

     psql $PROD_DATABASE_URL -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 5;"
     psql $PROD_DATABASE_URL -c "SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'YOUR_TABLE';"

RECOVERY — If Replit Publish fails with PG::DuplicateColumn / PG::DuplicateTable / "relation already exists":

This is schema_migrations desync — Neon's ledger is out of sync with Neon's physical schema.
Common vectors: Neon branch/restore loss, Replit auto-migrator crash mid-DDL, past
`db:structure:load`. See .claude/docs/COMMON_ERRORS.md Bug 9 + Bug 16 +
docs/bugfixes/2026-04-24-schema-migrations-desync-esa-leads.md.

FIX (does NOT hand-patch schema_migrations):

  1. Rewrite the failing migration to use `if_not_exists: true` per the AUTHORING RULES above.
  2. `bundle exec rspec` locally.
  3. Commit, push, click Publish again.

On the retry, Neon sees DDL IF NOT EXISTS → no-op (column/index already there), the migration
transaction commits cleanly, Rails records the `schema_migrations` row via the normal migrator
flow. The ledger self-heals.

DO NOT (banned):
  ❌ `RAILS_ENV=production rails db:migrate`
  ❌ `RAILS_ENV=production rails runner "...INSERT INTO schema_migrations..."`
  ❌ Patch `schema_migrations` manually via psql
  ❌ `db:structure:load` against Neon

ESCALATION — If the same symptom recurs on a different migration in the next Publish, DO NOT
keep shipping the same symptom fix. Pattern is recurring → see TECH_DEBT.md TD-040 for the
distal root-cause investigation scope (Neon branch audit, Replit auto-migrator review, /publish
skill drift check).
```

**Do NOT proceed with Publish until the local helium migrate is clean and — for any unique-constraint migration — the PRE-FLIGHT duplicate check on Neon comes back empty. If Replit Publish shows "Generated migrations" with DROP statements → REJECT and investigate: local helium schema may be ahead of Neon (worktree DB pollution is a known vector — see memory `feedback_worktree_db_pollution`).**

**If Replit publish shows "Generated migrations" with DROP statements → REJECT and sync local DB first.**

Mark task complete: `TaskUpdate: Step 2 → completed`

---

## Step 3: Verify CHANGELOG Completeness (MANDATORY)

Read `CHANGELOG.md`. Check the `[Unreleased]` section.

For EACH unpublished commit:
- [ ] Is it represented in the changelog? (Match by description, not exact wording)
- [ ] Is it categorized correctly? (Added / Fixed / Changed / Removed)

**Generate a completeness report:**

```markdown
## Changelog Verification Report

**Unpublished commits:** X
**Covered in changelog:** Y
**MISSING from changelog:** Z

### Missing Entries:
- `abc1234` - "commit message" → Suggested category: [Added/Fixed/Changed]
- `def5678` - "commit message" → Suggested category: [Added/Fixed/Changed]

### Already Covered:
- `ghi9012` - "commit message" ✅
```

**OPTIONAL: Invoke `code-reviewer` agent** if there are 10+ unpublished commits to help categorize changes:

```
Task tool:
- subagent_type: "code-reviewer"
- prompt: "Review these commits and categorize each as Added/Fixed/Changed/Removed for a Keep a Changelog format: [list commits]"
- description: "Categorize commits for changelog"
```

Mark task complete: `TaskUpdate: Step 3 → completed`

---

## APPROVAL GATE (MANDATORY STOP)

**⛔ STOP. DO NOT PROCEED.**

Present the completeness report and ask:

```
I've verified the changelog against unpublished commits.

**Missing entries found: [X]**
[List missing entries with suggested text]

Options:
1. **Add missing entries** — I'll update CHANGELOG.md with the suggested entries
2. **Skip missing entries** — They're intentionally excluded (minor/internal changes)
3. **Let me edit manually** — I'll pause while you update CHANGELOG.md

Which option?
```

**YOU CANNOT PROCEED UNTIL USER RESPONDS.**

Mark gate complete after user responds: `TaskUpdate: GATE → completed`

---

## Step 4: Determine Version Bump (MANDATORY)

Read current version from CHANGELOG.md (latest versioned section header).

Ask user:

```
Current version: X.Y.Z

What type of release?
- **Patch** (X.Y.Z+1) — Bug fixes, small improvements (Recommended)
- **Minor** (X.Y+1.0) — New features, non-breaking changes
- **Major** (X+1.0.0) — Breaking changes
```

Mark task complete: `TaskUpdate: Step 4 → completed`

---

## Step 5: Update CHANGELOG.md (MANDATORY)

1. If user chose "Add missing entries" in gate, add them to `[Unreleased]` first
2. Replace `## [Unreleased]` section header, moving its content to new version:

```markdown
## [Unreleased]

## [X.Y.Z] - YYYY-MM-DD - Published YYYY-MM-DD
```

3. Keep the empty `[Unreleased]` header at top for future changes
4. Verify the edit looks correct

Mark task complete: `TaskUpdate: Step 5 → completed`

---

## Step 5.5: Run Test Suite (MANDATORY)

**CLAUDE.md requires tests before ALL commits. A publish commit is no exception.**

```bash
bundle exec rspec
```

**If tests fail:** STOP. Do NOT create the publish commit. Fix failing tests first, then resume from this step.

**If tests pass:** Record the result (e.g., "247 examples, 0 failures") for inclusion in the commit message.

Mark task complete: `TaskUpdate: Step 5.5 → completed`

---

## Step 5.6: Verify Contract-Manifest Freshness (MANDATORY)

The FE↔BE contract gate requires the committed manifest to match the current
routes/controllers. Regenerate and confirm no drift:

```bash
bundle exec rake contract:manifest && git diff --exit-code contract/contract-manifest.json
```

**If it shows a diff:** STOP. A controller/route change altered the contract but the
manifest wasn't committed. Commit the regenerated `contract/contract-manifest.json`
(and notify the FE — its committed copy must be re-synced via `npm run sync-manifest`)
before creating the publish commit.

Mark task complete: `TaskUpdate: Step 5.6 → completed`

---

## Step 5.7: Verify Slot Time-Rendering (run when a slot controller/serializer/model changed)

`SimpleBookingSlot` columns store UTC; human-facing time MUST go through
`slot_datetime_in_timezone`, never raw `start_time.strftime` (COMMON_ERRORS Bug 8/11/11b —
the admin intro-call view once showed 8 PM for a 1 PM PT call). If this publish touches
any `app/controllers/**`, `app/serializers/**`, or `app/models/simple_booking_slot.rb`,
confirm the rendering invariant still holds:

```bash
bundle exec rspec \
  spec/requests/api/v1/admin/intro_call_bookings_spec.rb \
  spec/requests/api/v1/teachers/intro_calls_spec.rb \
  spec/requests/api/v1/parents/simple_booking_slots_spec.rb \
  spec/serializers/simple_booking_slot_serializer_spec.rb \
  spec/models/simple_booking_slot_spec.rb \
  spec/models/simple_booking_slot_timezone_matrix_spec.rb
```

**If any fail:** STOP — a slot surface is rendering raw UTC. Fix before the publish commit.
(Step 5.5's full `bundle exec rspec` already covers these; this is the targeted gate to run
when iterating on a slot surface without the full suite.)

Mark task complete: `TaskUpdate: Step 5.7 → completed`

---

## Step 6: Create Publish Commit (MANDATORY)

**MUST use `git add -A`** (solo developer project — stage everything).

⚠️ This is safe only because junk directories are gitignored — not because
the working tree is assumed clean. `.scratch/` was added to `.gitignore` on
2026-07-27 after `-A` swept 102 in-flight planning files and 11,830 lines
into the v2.33.0 release commit (`346b2e54`). **If a new directory starts
accumulating untracked scratch/agent/notes output, add it to `.gitignore` —
do not leave it for `-A` to find.** Keeping the ignore list current is what
makes this step correct.

```bash
git add -A
git commit -m "$(cat <<'EOF'
docs: update changelog for vX.Y.Z publish

- Moved [Unreleased] entries to [X.Y.Z]
- Published YYYY-MM-DD

Publication Status: Published - YYYY-MM-DD HH:MM UTC

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

After commit succeeds, push to GitHub for backup:

```bash
git push origin main
```

**This does NOT deploy** — it only backs up the commit to GitHub. Deployment happens via Replit UI.

Mark task complete: `TaskUpdate: Step 6 → completed`

---

## Step 6.5: Linear Ticket Cross-Check (MANDATORY)

Linear (workspace `thoven`, team `THV`) is the board — Notion is no longer a source of truth for features or code state. Before the publish commit, confirm every ticket ID this release cites actually exists in Linear, so the changelog never points at a ticket that doesn't exist.

### Process

1. **Collect ticket IDs** — grep this release's changelog section and the unpublished commit messages for `THV-\d+` references:
```bash
git log <last_published_hash>..HEAD --format="%s %b" | grep -oE 'THV-[0-9]+' | sort -u
```

2. **Verify each ID exists in Linear** via the Linear MCP (`mcp__linear` tools) or `linear` CLI — read-only. Report each as exists ✅ / not found ⚠️.

3. **Warn, don't block.** A missing or misspelled ID doesn't stop the publish — surface it so the changelog entry can be corrected or the bogus reference removed.

**Never write to Linear here.** Issue state, comments, and Done/Ready belong to the session that owns each ticket — the publish commits code, it does not move the board. If an issue should reflect that its work shipped, say so in the Step 7 reminder and let the owner (or Andres) move it.

Mark task complete: `TaskUpdate: Step 6.5 → completed`

---

## Step 6.9: Pending Post-Publish Actions (MANDATORY)

Some work is finished in code but needs a manual step the moment it goes live —
rotating a secret, re-running a vendor API call that probes our endpoint,
flipping a provider setting. Those live in `docs/deployment/PUBLISH_REMINDERS.md`
— a scratch checklist, NOT tech debt, NOT the workspace TODO store. It exists
so parallel agents across worktrees have one place to drop a transient
post-publish step without polluting a long-lived tracker or this skill file
with items that go stale the moment they're done.

Read `docs/deployment/PUBLISH_REMINDERS.md`. For each item under `## Open`,
surface its numbered steps verbatim in the Step 7 reminder, in order. Do NOT
perform them yourself — they run AFTER Andres clicks Publish, and several need
Replit secrets you cannot reach. If `## Open` is empty, say so in one line and
move on.

After Andres confirms an item's steps are done (in a later message or session
— not this run), delete that item from the doc. Don't let confirmed-done items
linger; the doc's value depends on staying short and current.

Mark task complete: `TaskUpdate: Step 6.9 → completed`

---

## Step 7: Remind to Deploy (MANDATORY)

Output this reminder:

```
✅ Publish commit created: vX.Y.Z

⚠️  NEXT STEP: Click "Publish" in the Replit UI to deploy.

Remember:
- git push does NOT deploy — it only backs up to GitHub
- The Replit UI "Publish" button snapshots current files and builds a new container
- Production will run: db:migrate → puma start (with Solid Queue plugin)
- Verify at https://thoven.co/health after publishing
```

Mark task complete: `TaskUpdate: Step 7 → completed`

---

## When NOT to Use
- No unpublished commits exist — skill auto-detects and exits
- Still actively developing — publish when a logical batch is ready
- Need to deploy a hotfix — consider committing + publishing in one step

## Common Mistakes
- Forgetting to run test suite before creating publish commit
- Telling user "it's deployed" — only Replit UI deploys, not git push
- Auto-determining version bump without asking the user
- Missing changelog entries for commits since last publish
- Using selective git staging instead of `git add -A`
- Letting a new scratch/notes directory accumulate untracked instead of gitignoring it — `git add -A` will sweep it into the release

---

## Quick Reference

| Step | Action | Blocking? |
|------|--------|-----------|
| PRE-CHECK 0 | Verify Neon matches last "Published" marker (read-only psql) | Yes — catches stale markers |
| PRE-CHECK 1 | Replit-Shell `rails db:migrate` if migrations exist | Yes — makes Publish diff non-empty |
| 1 | Find last published commit | Yes |
| 2 | List unpublished commits | Yes |
| 3 | Verify changelog completeness | Yes |
| GATE | User confirms changelog | **MANDATORY STOP** |
| 4 | Determine version bump | Yes |
| 5 | Update CHANGELOG.md | Yes |
| 5.6 | Verify contract-manifest freshness | Yes |
| 6 | Create publish commit | Yes |
| 6.5 | Linear ticket cross-check — every cited THV ID exists (read-only) | Yes |
| 6.9 | Pending post-publish actions (`docs/deployment/PUBLISH_REMINDERS.md`) | Reminder — surface steps verbatim |
| 7 | Remind to deploy | Yes |

## Enforcement Summary

**YOU MUST:**
1. ✅ Create todo checklist at start (now includes PRE-CHECK 0 + PRE-CHECK 1)
2. ✅ Verify last "Published" marker actually deployed on Neon (PRE-CHECK 0)
3. ✅ Confirm Replit-local helium is migrated (PRE-CHECK 1) before clicking Publish
4. ✅ Find last published commit before anything else
5. ✅ Show completeness report with missing entries
6. ✅ STOP at approval gate — wait for user
7. ✅ Ask user for version bump type
8. ✅ Use `git add -A` (never selective staging) — and keep `.gitignore` current so it stays safe
9. ✅ Verify contract-manifest freshness before the publish commit (Step 5.6)
10. ✅ Include "Publication Status: Published" in commit
11. ✅ Cross-check release-cited THV ticket IDs exist in Linear (read-only — never write board state from a publish)
12. ✅ Remind about Replit UI deployment

**YOU CANNOT:**
- ❌ Trust "Publication Status: Published" markers without verifying against Neon
- ❌ Skip the Replit-Shell `rails db:migrate` step when migrations exist
- ❌ Confuse Warp-local helium with Replit-local helium (different DBs, both called "local")
- ❌ Run `RAILS_ENV=production rails db:migrate` (HARD CONSTRAINT)
- ❌ Skip changelog verification
- ❌ Auto-determine version bump without asking
- ❌ Create commit without user confirming changelog
- ❌ Use selective git staging
- ❌ Tell user "it's deployed" — only Replit UI deploys
