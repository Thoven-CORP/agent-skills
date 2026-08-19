---
name: dev-validate
description: Use when verifying a completed feature build before shipping — tests, security, QA, production data checks. Triggers on /dev:validate or pipeline advancement past BUILD.
---

# /dev:validate — Verify Everything Before Ship

## Purpose

Comprehensive verification of the completed build. Run tests, security review (conditional), stub check, production data re-audit, and QA checklist. BLOCKS advancement if critical issues found.

## Phase Pattern: RESEARCH > EXECUTE > DOCUMENT > GATE

---

## RESEARCH

### 1. Read Context
```
Read: docs/[feature]/.dev/MANIFEST.md → domains, acceptance criteria for VALIDATE
Read: docs/[feature]/prompt-transitions/validate.md → context from BUILD
Read: docs/[feature]/01_IMPLEMENTATION_STATUS.md → what was built
```

### 2. Identify What Changed
```bash
# Files changed since DOCUMENT phase
git diff --name-only [document-phase-commit]..HEAD
```

### 3. Review VALIDATE Acceptance Criteria
From MANIFEST, load the custom acceptance criteria defined during PLAN.

### 4. Check Domain Tags for Conditional Steps
- `auth` or `payments` or `students` or `external-api` → security review REQUIRED
- Any existing models touched → production data re-audit REQUIRED

**Defaults:**
- Security review: **RUN** unless MANIFEST domains contain NONE of: auth, payments, students, external-api
- Production data re-audit: **RUN** unless no existing models were touched
- QA checklist: **ALWAYS RUN** — never skip

---

## EXECUTE

Run these verification steps in order. Each step MUST complete before the next.

### Step 1: Test Suite — /verify (Standard Mode)

Invoke `/verify` with standard mode:
- Full `bundle exec rspec` — all tests must pass
- Documentation sync check — docs match implementation
- No skipped or pending tests in new code

**If tests fail:** STOP. Do not proceed. Fix failures first, then re-run.

### Step 2: Stub Check — /verify (Stub Check Mode)

Invoke `/verify` with stub check mode:
- Search for TODOs in new/modified files
- Search for placeholder implementations (`raise NotImplementedError`, `# TODO`, `"placeholder"`)
- Search for empty method bodies
- Search for hardcoded test values in non-test files

**If stubs found:** STOP. List them. Fix before proceeding.

### Step 3: Security Review — CONDITIONAL

**Skip if** no security-sensitive domains in MANIFEST.

**Required if** MANIFEST domains include: `auth`, `payments`, `students`, `external-api`

Invoke `/security-review`:
- Brakeman scan on changed files
- bundler-audit for dependency vulnerabilities
- COPPA compliance check (if `students` domain)
- Dual auth verification (if `auth` domain)
- Payment flow security (if `payments` domain)

Save findings to `docs/[feature]/.dev/reports/security-report.md`

**If CRITICAL findings:** BLOCK. Must fix before advancing.
**If WARNING findings:** Note in gate, user decides.

### Step 4: Production Data Re-Audit

Invoke `/production-data-audit` for all models touched by the feature:
- Verify new code handles NULL fields found in production
- Verify new queries filter archived_at correctly
- Verify new associations handle missing related records
- Compare against pre-BUILD audit (from PLAN phase) — any new risks?

Save findings to `docs/[feature]/.dev/reports/audit-report.md`

### Step 5: QA Checklist

Generate a feature-specific QA checklist based on what was built:

```markdown
## QA Checklist — [Feature Name]

### Happy Path
- [ ] [Primary use case works end-to-end]
- [ ] [Secondary use case works]

### Authorization
- [ ] [Correct role can access (e.g., teacher can create)]
- [ ] [Wrong role is denied (e.g., student cannot access)]
- [ ] [Unauthenticated user gets 401]

### Edge Cases
- [ ] [Empty/null input handled]
- [ ] [Duplicate request handled (idempotency)]
- [ ] [Large dataset handled]

### Error Handling
- [ ] [Invalid params return 422 with error message]
- [ ] [Missing record returns 404]
- [ ] [Proper error format per API_ERROR_RESPONSE_CONTRACT.md]

### Data Integrity
- [ ] [Soft-deleted records excluded]
- [ ] [Concurrent requests handled safely]
- [ ] [Production data edge cases handled]
```

Present checklist to user — they manually confirm each item or flag issues.

---

## DOCUMENT

### 1. Write Validation Report

Save to `docs/[feature]/.dev/reports/validation-report.md`:

```markdown
# Validation Report — [Feature Name]

## Test Results
- Total: [XXX] examples
- Passed: [XXX]
- Failed: [0]
- Pending: [0]

## Stub Check
- [Clean / X stubs found and fixed]

## Security Review
- [Passed / X findings (Y critical, Z warnings)]
- Report: docs/[feature]/.dev/reports/security-report.md

## Production Data Audit
- [Passed / X issues found]
- Report: docs/[feature]/.dev/reports/audit-report.md

## QA Checklist
- [X of Y items confirmed]
- [Any items flagged]

## VALIDATE Acceptance Criteria
- [✅/❌] [criterion 1]
- [✅/❌] [criterion 2]
```

### 2. Update MANIFEST

```
Phase Progress: VALIDATE → ✅ (pending gate)
Artifacts: Add report paths
```

---

## GATE

```
PHASE GATE: VALIDATE

Test Suite: [XXX examples, 0 failures] ✅
Stub Check: [Clean] ✅
Security Review: [Passed / Findings summary] [✅/⚠️]
Production Data: [Passed / Issues summary] [✅/⚠️]
QA Checklist: [X/Y confirmed] [✅/⚠️]

VALIDATE Acceptance Criteria:
  ✅ [criterion 1]
  ✅ [criterion 2]
  [or ❌ with explanation — BLOCKS if critical]

Validation Report: docs/[feature]/.dev/reports/validation-report.md

Next phase: [HANDOVER if frontend needed, otherwise SHIP]

Options:
  1. Approve → advance to [HANDOVER/SHIP]
  2. Revise → fix issues found
  3. Pause → /dev:pause
```

**BLOCKING conditions (cannot advance):**
- Tests failing
- Stubs found
- CRITICAL security findings
- Any VALIDATE acceptance criteria marked ❌

---

## TRANSITION

On approval:

### If Feature Has Frontend Component
1. Invoke `/prompt-generator` → create HANDOVER prompt
2. Save to `docs/[feature]/prompt-transitions/handover.md`

### If Backend-Only Feature
1. Invoke `/prompt-generator` → create SHIP prompt
2. Save to `docs/[feature]/prompt-transitions/ship.md`

Contents for either:
- Feature summary
- Validation results
- Changed files list
- HANDOVER or SHIP acceptance criteria from MANIFEST
- Any warnings or caveats from validation

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping security review for "non-sensitive" features | Check MANIFEST domains — domain triggers are authoritative |
| Approving with failing tests | Tests MUST pass — no exceptions |
| Ignoring stub check | Stubs in production code are bugs |
| Not re-running production data audit | Data shape may have changed since PLAN |
| Auto-confirming QA checklist | User must manually confirm each item |
| Advancing with CRITICAL security findings | CRITICAL = BLOCK. Fix first. |
