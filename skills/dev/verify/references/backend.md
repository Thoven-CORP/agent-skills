# Verify — Evidence Before Claims

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in THIS message, you cannot claim it passes. No exceptions. No rationalizations. Period.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Red Flags — STOP Immediately

If you catch yourself thinking any of these, STOP:
- "Should work now" → RUN the verification
- "I'm confident" → Confidence ≠ evidence
- "Just this once" → No exceptions
- "Linter passed" → Linter ≠ tests
- "Agent said success" → Verify independently
- "I already checked" → Check again, FRESH
- "Partial check is enough" → Partial proves nothing
- Using "should", "probably", "seems to" → These are NOT evidence

## Modes

| Mode | When | What It Does |
|------|------|--------------|
| **Quick** | Single verification pass | Run tests, read output, report with evidence |
| **Docs** | After code changes, before commit | Scan git diff, find stale docs/comments/API refs |
| **Standard** | DEFAULT — implementation verification | Quick + Docs |
| **Stub Check** | After generating code, before claiming complete | Run stub detection patterns |

### Quick Mode

Run the relevant verification command and report with evidence:

```bash
# For tests:
bundle exec rspec [relevant spec files]

# For linting:
bundle exec rubocop [relevant files]

# For migrations:
RAILS_ENV=test rails db:migrate:status

# For FE↔BE contract freshness (run when controllers/routes changed):
bundle exec rake contract:manifest && git diff --exit-code contract/contract-manifest.json
```

**Report format:**
```
VERIFICATION: [PASS/FAIL]
COMMAND: [exact command run]
EVIDENCE: [key output — test count, failure count, exit code]
```

### Docs Sync Mode

Detects stale documentation, outdated comments, and API contract drift after code changes. Runs automatically as part of Standard mode, or standalone with `verify docs`.

**Phase 1: Identify What Changed**

```bash
# Get changed files (staged + unstaged vs HEAD)
git diff --name-only HEAD

# Get changed function/method/class names from the diff
git diff HEAD -U0 | grep -E '^\+.*def |^\+.*class |^\-.*def |^\-.*class '

# Get changed route definitions
git diff HEAD -- config/routes.rb
```

From the diff output, extract:
- **Changed symbols**: method names, class names, module names that were added/removed/renamed
- **Changed endpoints**: route paths, HTTP verbs, controller actions
- **Changed files**: which files were modified (to check nearby comments)

**Phase 2: Run the Four Drift Checks**

#### Check 1: Comment Drift
Comments in or near changed code that describe the OLD behavior.

```bash
# For each changed file, extract comments within 5 lines of changes
git diff HEAD -U5 [changed_files] | grep -E '^\s*#|^\s*//|^\s*\*|^\s*<!--'
```

Look for:
- Comments above changed methods that describe what the method USED to do
- Inline comments referencing old variable names, old logic, old return values
- Block comments describing old workflows that no longer apply
- `@param` / `@return` annotations that don't match the new signature

#### Check 2: Doc Drift
Markdown/doc files referencing changed functions, endpoints, or flows.

```bash
# Search docs for references to changed symbols
grep -rn "[changed_method_name]\|[changed_class_name]" \
  docs/ CLAUDE.md CHANGELOG.md README.md \
  docs/plans/ docs/reference/

# Search for changed route paths in docs
grep -rn "[changed_route_path]" \
  docs/ CLAUDE.md README.md
```

Look for:
- `CLAUDE.md` sections describing old behavior, old file locations, or old method names
- Feature plan docs (`docs/plans/`) referencing code that changed
- API contract docs (`docs/**/api/`, `docs/**/*API*`) with outdated request/response formats
- `CHANGELOG.md` entries for unreleased changes that don't reflect the actual implementation
- `FRONTEND_API_CONTRACT.md` files with stale endpoint signatures

#### Check 3: API Contract Drift
Type definitions, serializers, or API docs that don't match changed controller/service signatures.

```bash
# If controllers changed, check their serializers still match
grep -rn "[changed_controller_action]" app/serializers/

# If model attributes changed, check serializers expose correct fields
grep -rn "[changed_attribute]" app/serializers/ app/controllers/

# If routes changed, check route documentation
grep -rn "[old_route_path]" docs/ CLAUDE.md
```

Look for:
- Serializer attributes that reference removed/renamed model fields
- Controller actions returning fields that no longer exist
- Route documentation listing endpoints that were moved or removed
- Request/response examples in docs using old field names

#### Check 4: Cross-File Reference Drift
Other source files' comments pointing to renamed/removed code.

```bash
# Search all source files for references to changed symbols (excluding the changed files themselves)
grep -rn "[changed_symbol]" app/ lib/ spec/ \
  --include="*.rb" --include="*.yml" \
  | grep -v "[changed_file_itself]" \
  | grep -E '#|//|/\*'  # Only comments
```

Look for:
- `# See MyClass#old_method` references to renamed/removed methods
- `# Calls OldService` references to renamed/removed services
- Spec descriptions referencing old behavior: `it "returns old_field"` when field was renamed
- Factory definitions using attributes that were removed/renamed

**Phase 3: Report**

```
DOCS SYNC: [CLEAN/DRIFT_FOUND]
FILES_CHANGED: [count]
SYMBOLS_CHANGED: [list of key method/class names]
DRIFT_FOUND: [count]
DETAILS:
  COMMENT DRIFT:
    - [file:line] Comment says "[old description]" but code now does [new behavior]
  DOC DRIFT:
    - [file:line] References [old_method/old_route] which was [renamed/removed/changed]
  API CONTRACT DRIFT:
    - [file:line] Documents [old_signature] but implementation is now [new_signature]
  CROSS-FILE DRIFT:
    - [file:line] Comment references [old_symbol] which was [renamed/removed]
```

**Severity Levels:**
- **BLOCKING**: API contract docs or CLAUDE.md describe wrong behavior — MUST fix before commit
- **WARNING**: Inline comments describe old logic — SHOULD fix before commit
- **INFO**: Cross-file comment references to changed code — fix when convenient

**Phase 4: Auto-Suggest Fixes**

For each drift item found, suggest the specific fix:
```
SUGGESTED FIXES:
  1. [file:line] Update comment from "[old text]" to "[suggested new text]"
  2. [file:line] Update doc section to reflect [new behavior]
  3. [file:line] Remove reference to [deleted_method]
```

### Standard Mode (DEFAULT)

Run Quick + Docs Sync together. This is what happens when you just say "verify":

1. **Run Quick Mode** — execute test/lint commands, collect evidence
2. **Run Docs Sync** — check for stale docs/comments
3. **Report both results together**

```
VERIFICATION: [PASS/FAIL]
COMMAND: [exact command run]
EVIDENCE: [key output — test count, failure count, exit code]

DOCS SYNC: [CLEAN/DRIFT_FOUND]
[drift details if any]
```

If tests fail or BLOCKING drift is found, report the issues clearly. Do not retry automatically — present findings to the user and let them decide next steps.

### Stub Check Mode

Run these patterns against generated/modified code to detect incomplete implementations:

**Pattern Categories:**

1. **Comment-based stubs:**
   ```bash
   grep -rn "TODO\|FIXME\|HACK\|PLACEHOLDER\|STUB\|XXX\|TEMP" [files]
   ```

2. **Placeholder text:**
   ```bash
   grep -rn "lorem ipsum\|placeholder\|sample text\|example.com" [files]
   ```

3. **Empty implementations:**
   ```bash
   grep -rn "raise NotImplementedError\|pass$\|return nil$\|return None$" [files]
   ```

4. **Hardcoded values that should be configurable:**
   ```bash
   grep -rn "hardcoded\|magic number\|CHANGEME\|REPLACE_ME" [files]
   ```

5. **Existence vs Implementation check:**
   - File exists ≠ file has real content
   - Method exists ≠ method does real work
   - Test exists ≠ test asserts meaningful things
   - Route exists ≠ controller handles the request

**Report format:**
```
STUB CHECK: [CLEAN/STUBS_FOUND]
FILES_CHECKED: [count]
STUBS_FOUND: [count]
DETAILS:
  - [file:line] [pattern matched] [context]
```

## Common Verification Commands

| Claim | Command | Evidence |
|-------|---------|----------|
| Tests pass | `bundle exec rspec` | "X examples, 0 failures" |
| Specific test passes | `bundle exec rspec spec/path:line` | Test name + PASS |
| No linting errors | `bundle exec rubocop [files]` | "no offenses detected" |
| Migration works | `rails db:migrate && rails db:migrate:status` | All "up" |
| Migration sync | `RAILS_ENV=production rails runner "..."` (see publish skill Step 2) | "schema_migrations: IN SYNC" |
| Server starts | `rails s -b 0.0.0.0 -p 3001` | "Listening on" |
| Bug is fixed | Reproduce original symptom | Symptom no longer occurs |
| Docs in sync | `verify docs` | "DOCS SYNC: CLEAN" |
| Contract manifest fresh | `bundle exec rake contract:manifest && git diff --exit-code contract/contract-manifest.json` | "no diff" / exit 0 (else commit the regenerated manifest) |
| Slot times render in local tz (not raw UTC) | `bundle exec rspec spec/requests/api/v1/admin/intro_call_bookings_spec.rb spec/requests/api/v1/teachers/intro_calls_spec.rb spec/requests/api/v1/parents/simple_booking_slots_spec.rb spec/serializers/simple_booking_slot_serializer_spec.rb spec/models/simple_booking_slot_spec.rb spec/models/simple_booking_slot_timezone_matrix_spec.rb` | "0 failures" (run when a slot controller/serializer/model changed; COMMON_ERRORS Bug 8/11/11b) |

## When NOT to Use
- Still actively implementing — verify AFTER implementation, not during
- Want a code review — use security-review or expert-team Audit mode
- Need to debug a failure — use investigate first, then verify the fix

## Common Mistakes
- Claiming "tests pass" without running them in THIS message — Iron Law violation
- Using partial test runs as evidence ("ran 3 of 50 tests") — run the full suite
- Trusting sub-agent self-assessment — verify independently
- Skipping Stub Check mode after generating new code
- Committing with stale docs/comments — run Docs Sync before every commit

## Rules

- **Iron Law is absolute** — No claims without fresh evidence
- **Fresh means THIS message** — Not "I checked earlier"
- **Full output** — Don't just check exit code, read the output
- **Docs drift is a blocker** — BLOCKING drift items prevent commit, just like failing tests
- **Don't over-automate** — Present findings to user, let them decide
