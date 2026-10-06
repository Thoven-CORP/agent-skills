# Verify Skill

Evidence-based completion verification. 5 modes scaled to the stakes.

## The Iron Law

**You CANNOT claim tests pass, code works, or a feature is complete without running verification commands in THIS message and showing output.**

Red flags — if you catch yourself thinking any of these, STOP:
- "Should work now" — PROVE IT
- "I'm confident this is correct" — RUN THE CHECK
- "I already verified earlier" — DOESN'T COUNT. Fresh evidence only.
- "Just this one time" — NO EXCEPTIONS

---

## Modes

| Mode | When | What | Invoke |
|------|------|------|--------|
| **Quick** | Small change, sanity check | type-check + lint + contract-check | `verify` or `verify quick` |
| **Docs** | Changed logic, APIs, or flows | Detect drift in docs, comments, API references | `verify docs` |
| **Standard** | Normal feature completion | Quick + Docs + judge scoring | `verify standard` |
| **Debate** | Critical feature, high stakes | Quick + Docs + 3 independent judges | `verify debate` |
| **Stub-check** | Before commit, catch incomplete code | Pattern detection for stubs/placeholders | `verify stub-check` |

**Default:** bare `verify` invocation = Quick mode (backward compatible).

### Picking a Mode (Decision Rubric)

Use this concrete trigger map when the user says "verify" without specifying:

| You see | Pick |
|---------|------|
| 1-3 line CSS/copy/typo fix | **Quick** |
| New component, no API/contract change | **Quick** then **Stub-check** |
| API contract changed (`lib/*-api.ts`, types/, route handler) | **Docs** (mandatory) + **Quick** (Quick now runs contract-check) |
| Renamed function/component referenced elsewhere | **Docs** (mandatory) |
| Feature complete, ready to commit | **Standard** |
| About to commit (any feature, last gate) | **Stub-check** |
| Auth, payment, COPPA, or production-incident fix | **Debate** |
| User says "ready to ship" / "ready to publish" | **Standard** minimum, **Debate** if critical |

**When in doubt, run more than one.** Modes are cheap to combine; missed bugs are not. `verify docs` after any `lib/*-api.ts` change is non-negotiable — it's the primary defense against the "frontend types lie" failure mode (see memory: feedback_verify_serializer_not_types).

---

## Quick Mode

Run the type, lint, and contract checks defined by the checkout's `TESTING.md`.
Read that page first: it owns the current commands and required CI jobs.
On the THV-1126/1127/1130 stack, generated OpenAPI response types must be current before
type-check, whole-repository type-aware Oxlint complements changed-file ESLint, and the
Chromium component suite is required CI. For a compiled-style or browser-component claim,
run the affected browser test and capture its rendered/computed result.
Local targeted proof covers only the named paths and revision; required hosted `CI` still
owns merge acceptance. Diff-driven `bin/verify` and Stop-hook orchestration belong to
THV-1131; check that implementation exists before invoking it.

### Steps

1. **Types**: Where `api-types:check` exists, run it with the paired backend schema (or explicit `BACKEND_OPENAPI_PATH`), then run `pnpm run type-check`. Capture both outputs.
2. **Lint**: Run `pnpm exec eslint <changed JS/TS paths>` and, where `lint:oxlint` exists, `CI=true pnpm run --silent lint:oxlint`. Capture both outputs.
3. **Contract Check**: Run `pnpm run contract-check` and capture output (FE↔BE contract parity — fast, static; blocks if an API caller drifts from the committed manifest)
4. **Report**: Summarize results

### Output Format

```
## Verification Results (Quick)

### TypeScript Type Check
Pass/Fail
[errors if any]

### ESLint
Pass/Fail
[errors if any]

### Contract Check
Pass/Fail
[errors if any]

### Summary
[X/3 checks passed]
```

### Rules
- Run every selected check even if an earlier one fails; report each result separately
- Show only the actual errors, not the full output
- Report the exact paths, revision and passing checks; name required checks still pending
- If any check fails, list the specific files and errors that need fixing

---

## Docs Mode

Detect drift between code changes and documentation, comments, and API references.

### Steps

1. **Get changed files and diff content**:
   - Run `git diff --name-only` (staged + unstaged) to list changed files
   - Run `git diff` to get the full diff content

2. **Extract changed symbols** from the diff:
   - Function/method names that were renamed, removed, or had signatures changed
   - Type/interface names that were modified
   - API endpoint paths that changed
   - Constants or config keys that were renamed
   - Component names that were renamed or removed

3. **Scan for documentation drift** — search these locations for references to changed symbols:

   | Target | What to check |
   |--------|---------------|
   | `CLAUDE.md` | References to changed functions, endpoints, file paths, or flows |
   | `docs/**/*.md` | Feature docs referencing changed logic or APIs |
   | `CHANGELOG.md` | Only the `[Unreleased]` section — does it mention the change? |
   | `README.md` | Setup or usage instructions referencing changed code |
   | `types/*.ts` | Type definitions that should match changed API responses |

4. **Scan for comment drift** — check for stale comments in code:

   | Check | How |
   |-------|-----|
   | **Inline comments near changes** | Read 5 lines above/below each changed hunk — do comments describe old behavior? |
   | **JSDoc/TSDoc on changed functions** | Do `@param`, `@returns`, `@example` blocks match the new signature? |
   | **Cross-file references** | Grep for changed function/type names in comments across the codebase |
   | **TODO/FIXME referencing completed work** | TODOs that reference work this diff completes |

5. **Scan for API contract drift** (only when `lib/*-api.ts` files changed):

   | Check | How |
   |-------|-----|
   | **Endpoint path changes** | Search components for old endpoint paths |
   | **Request/response shape changes** | Check if TypeScript types in `types/` match new API shapes |
   | **Header or auth changes** | Verify callers use the correct headers function |

### Output Format

```
## Verification Results (Docs)

### Changed Symbols
- [list of functions, types, endpoints that changed]

### Documentation Drift
#### Errors (must fix)
- `CLAUDE.md:142` — References `fetchTeacherProfile()` but function renamed to `getTeacherProfile()`
- `docs/booking-flow.md:58` — Describes 3-step flow but code now has 4 steps

#### Warnings (review)
- `CHANGELOG.md` — No unreleased entry for this change
- `lib/teacher-api.ts:23` — JSDoc says "@returns TeacherProfile" but now returns TeacherProfileV2

### Comment Drift
#### Errors (must fix)
- `components/booking/BookingCard.tsx:45` — Comment says "// Uses credit system" but credit logic removed in this diff

#### Warnings (review)
- `lib/auth-api.ts:12` — TODO "refactor to use new auth" — this diff implements new auth, remove TODO?

### Summary
[X errors, Y warnings across Z files]
```

### Verdict
- 0 errors → PASS (warnings are informational)
- Any errors → FAIL. Fix drift errors before committing.

---

## Standard Mode

Quick mode + Docs mode + judge agent scoring against rubric.

### Steps

1. **Run Quick mode** (type-check + lint + contract-check). If any fails, fix before proceeding.
2. **Run Docs mode** (drift scan). If errors found, fix before proceeding.
3. **Dispatch judge agent** to evaluate the changes:

```
Task tool:
  subagent_type: "general-purpose"
  model: "sonnet"
  prompt: |
    You are a code quality judge. Evaluate the recent changes in this codebase.

    Run these commands first:
    - git diff --stat (to see what changed)
    - Read the changed files

    Score each criterion on 1-5 scale.
    DEFAULT SCORE IS 2. You must justify ANY score above 2.
    Score of 5 should be given in <5% of evaluations.

    | Criterion | Weight | Score | Evidence |
    |-----------|--------|-------|----------|
    | Correctness | 30% | ?/5 | [Does it do what it claims?] |
    | Code Quality | 20% | ?/5 | [Clean, readable, follows patterns?] |
    | Completeness | 20% | ?/5 | [All cases handled? No stubs?] |
    | Pattern Adherence | 15% | ?/5 | [Matches existing codebase conventions?] |
    | Documentation Accuracy | 15% | ?/5 | [Do comments, docs, types match the code changes?] |

    Weighted total: [calculate]

    If weighted total < 4.0: List specific issues to fix.
    If weighted total >= 4.0: Approve with any minor notes.

    IMPORTANT: Be critical. Default is 2. Justify every point above that.
```

4. **Evaluate judge results:**
   - Score >= 4.0 → PASS. Report results, ready to commit.
   - Score < 4.0 → FAIL. List specific issues. Fix and re-run.
   - After 2 failed retries → Escalate to user with findings.

### Output Format

```
## Verification Results (Standard)

### Automated Checks
- TypeScript: Pass/Fail
- ESLint: Pass/Fail
- Docs Drift: Pass/Fail (X errors, Y warnings)

### Judge Evaluation
| Criterion | Weight | Score | Evidence |
|-----------|--------|-------|----------|
| Correctness | 30% | X/5 | [evidence] |
| Code Quality | 20% | X/5 | [evidence] |
| Completeness | 20% | X/5 | [evidence] |
| Pattern Adherence | 15% | X/5 | [evidence] |
| Documentation Accuracy | 15% | X/5 | [evidence] |

**Weighted Total: X.X/5.0**

### Verdict
[PASS (>= 4.0) / FAIL (< 4.0) — specific issues if fail]
```

---

## Debate Mode

For critical features. 3 independent judges evaluate, then debate disagreements.

### Steps

1. **Run Quick mode** first. Fix any failures.
2. **Run Docs mode**. Fix any errors.
3. **Dispatch 3 judge agents in parallel** (single message, 3 Task calls):

Each judge gets the same rubric as Standard mode (including Documentation Accuracy criterion) but evaluates independently. Use **specialized agents** for each judge:

```
Judge 1 (subagent_type: code-reviewer): Focus on CORRECTNESS, security, and edge cases
Judge 2 (subagent_type: typescript-pro): Focus on TYPE SAFETY, code patterns, and strict mode compliance
Judge 3 (subagent_type: react-specialist OR next-js-developer): Focus on FRAMEWORK PATTERNS, performance, and completeness
```

Choose Judge 3's agent based on the feature: use `next-js-developer` if the feature involves routing/SSR/RSC, otherwise `react-specialist`. Add to each prompt:
```
You are Judge [1/2/3]. Evaluate independently — do not defer to consensus.
```

4. **Compare scores:**
   - **Unanimous (all >= 4.0)** → PASS. Polish any minor notes.
   - **All below 3.0** → FAIL. Redesign needed. List all issues.
   - **Split (disagreement > 1.5 points on any criterion)** → Round 2.

5. **Round 2 (if split):**
   - Share all 3 evaluations with each judge
   - Each judge revises their score with reasoning
   - **Majority rules** (2 of 3 agree → that's the verdict)

6. **Report synthesized results** to user.

---

## Stub-Check Mode

Pattern-based detection of incomplete code before committing.

### Steps

1. **Get changed files**: `git diff --name-only` (staged + unstaged)
2. **Scan each file** for these patterns:

| Pattern | Regex/Search | Severity |
|---------|-------------|----------|
| TODO/FIXME comments | `TODO\|FIXME\|HACK\|XXX` | Warning |
| Placeholder text | `lorem ipsum\|placeholder\|TBD\|TBC` | Error |
| Empty implementations | `\{\s*\}\|=> \{\}\|return null.*//` | Error |
| Hardcoded test values | `localhost\|127\.0\.0\.1\|test@\|password123` | Error |
| Console statements | `console\.\(log\|debug\|warn\|error\)` | Warning |
| Commented-out code | blocks of `//` spanning 3+ lines | Warning |
| Incomplete error handling | `catch\s*\(\w*\)\s*\{\s*\}` | Error |
| Magic numbers | standalone numbers not in constants | Warning |

3. **Report findings:**

```
## Stub-Check Results

### Errors (must fix before commit)
- `path/file.tsx:42` — Empty catch block
- `path/file.tsx:87` — Placeholder text "TBD"

### Warnings (review before commit)
- `path/file.tsx:15` — console.log statement
- `path/file.tsx:99` — TODO comment

### Summary
[X errors, Y warnings across Z files]
[Errors must be resolved. Warnings are at your discretion.]
```

4. **Verdict:**
   - 0 errors → PASS (warnings are informational)
   - Any errors → FAIL. Fix errors before committing.

---

## Retry Protocol

For Standard and Debate modes:

1. **First failure**: Fix the specific issues identified. Re-run same mode.
2. **Second failure**: Fix issues. Re-run.
3. **Third failure**: STOP. Present all findings to user:
   - "Verification has failed 3 times. Here are the recurring issues: [list]"
   - "This may indicate an architectural problem. Would you like to proceed anyway, or investigate further?"

---

## When NOT to Use

- Exploring code or researching → use Explore agent
- Debugging a bug → use `investigate-thoven`
- Just reading files → use Read tool directly

## Common Mistakes

- Running verify but not reading the output (blind "it passed")
- Using Quick mode for critical features (use Standard or Debate)
- Skipping stub-check before commit (stubs ship to production)
- Claiming "I already checked" without fresh evidence in current message
- Changing API logic without running Docs mode (drift ships to production)

---

## Rules

- THE IRON LAW: No claims without evidence in THIS message
- Default mode is Quick (backward compatible)
- Always run all Quick-mode checks (type-check, lint, contract-check), even if one fails
- Quick mode runs contract-check (FE↔BE parity) in addition to type-check + lint
- Standard and Debate modes always include Docs checks before judge scoring
- Standard/Debate judge scoring: default 2, justify >3, pass at 4+, score 5 < 5% of evaluations
- After 3 failures: escalate to user, do not loop forever
- Stub-check errors are blocking; warnings are informational
- Docs drift errors are blocking; warnings are informational
