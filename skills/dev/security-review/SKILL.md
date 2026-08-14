---
name: security-review
description: Use when reviewing code that touches authentication, authorization, payments, student data, or external APIs. Triggers on "security review", "security check", "audit security", "check auth", "OWASP", "vulnerability", "penetration test", "COPPA compliance". Also use after implementing auth/payment features.
---

# Security Review

## Overview

Run comprehensive security checks: static analysis (brakeman), dual-auth pattern verification, COPPA compliance, payment security, and OWASP top 10 review.

**THIS IS A RIGID SKILL. ALL MANDATORY STEPS MUST BE COMPLETED.**

**Critical Context:**
- **Dual Auth System:** Users (parents/teachers) vs Students — NEVER mix authentication systems
- **COPPA Compliance:** Students may be under 13 — strict data handling required
- **DO NOT TOUCH:** Teacher account creation password flow (`app/services/teacher_account_creation_service.rb`)

## MANDATORY First Action

Before ANY other action, you MUST create a todo checklist:

```
TaskCreate for each:
- [ ] Step 1: Run brakeman static analysis
- [ ] Step 2: Invoke security-engineer agent
- [ ] Step 3: Invoke code-reviewer agent (parallel with Step 2)
- [ ] Step 4: Rails-specific checks (if applicable)
- [ ] Step 5: Generate security report
- [ ] GATE: User reviews findings before marking complete
```

**YOU CANNOT SKIP THE CHECKLIST. CREATE IT NOW.**

---

## Step 1: Run Brakeman Static Analysis (MANDATORY)

```bash
bin/brakeman --no-pager --format json 2>/dev/null || bin/brakeman --no-pager
```

Parse output for:
- **High confidence** warnings → 🔴 CRITICAL
- **Medium confidence** warnings → ⚠️ WARNING
- **Weak confidence** warnings → Note for review

If brakeman is not installed:
```bash
bundle exec brakeman --no-pager
```

### Also Run bundler-audit (MANDATORY)

```bash
bundle-audit check --update 2>/dev/null || (gem install bundler-audit && bundle-audit check --update)
```

Parse output for:
- Any **advisory** found → 🔴 CRITICAL (known CVE in dependency)
- Insecure gem sources (http://) → ⚠️ WARNING
- **Remediation:** `bundle update <vulnerable_gem> --conservative`

### Secret Leak Scan (MANDATORY)

```bash
# Check for common secret patterns in tracked files
git grep -n -i "sk_live_\|sk_test_\|STRIPE_API_KEY\s*=" -- '*.rb' '*.yml' '*.env' 2>/dev/null
git grep -n -i "secret_key_base\s*[:=]\s*['\"]" -- '*.rb' '*.yml' 2>/dev/null
git grep -n -i "password\s*[:=]\s*['\"][^<]" -- '*.rb' '*.yml' ':!spec/' ':!test/' 2>/dev/null
git grep -n "BEGIN RSA PRIVATE KEY\|BEGIN EC PRIVATE KEY" -- '*.rb' '*.yml' '*.pem' 2>/dev/null
```

**Any match → 🔴 CRITICAL (hardcoded secret in source code)**

Also verify `.gitignore` includes: `.env`, `.env.*`, credential key files, `*.pem`/`*.key` files.

Mark task complete: `TaskUpdate: Step 1 → completed`

---

## Step 2: Invoke security-engineer Agent (REQUIRED)

**YOU MUST invoke the `security-engineer` agent.**

Determine scope — use git diff to find recent changes:

```bash
# Changes since last commit
git diff HEAD~1 --name-only

# Or changes since last publish
git log --grep="Publication Status: Published" -1 --format=%H | xargs -I{} git diff {}..HEAD --name-only
```

Dispatch the `security-engineer` agent for comprehensive vulnerability analysis covering authentication, authorization, COPPA, Stripe payments, input validation, and OWASP Top 10.
See [references/prompt-templates.md](references/prompt-templates.md#security-engineer-review) for the full prompt template.

Mark task complete: `TaskUpdate: Step 2 → completed`

---

## Step 3: Invoke code-reviewer Agent (REQUIRED — PARALLEL with Step 2)

**Launch in PARALLEL with Step 2 for efficiency.**

Dispatch the `code-reviewer` agent for code quality and security review focusing on nil safety, N+1 queries, error handling, soft deletes, UUIDs, and test coverage.
See [references/prompt-templates.md](references/prompt-templates.md#code-reviewer-review) for the full prompt template.

Mark task complete: `TaskUpdate: Step 3 → completed`

---

## Step 4: Rails-Specific Checks — CONDITIONAL (MANDATORY if triggered)

**IF recent changes touch controllers, Devise config, or models with authentication, YOU MUST invoke `rails-expert`:**

Dispatch the `rails-expert` agent for Rails-specific security review covering strong parameters, auth filters, serializer exposure, CORS, rate limiting (rack-attack), and mass assignment.
See [references/prompt-templates.md](references/prompt-templates.md#rails-expert-review) for the full prompt template.

**IF not triggered:** Mark as "N/A — no controller/auth changes".

Mark task complete: `TaskUpdate: Step 4 → completed`

---

## Step 5: Generate Security Report (MANDATORY)

**REQUIRED report format:**

```markdown
## Security Review Report

**Date:** YYYY-MM-DD
**Scope:** [Files reviewed / Feature name]
**Tools Used:** Brakeman, security-engineer, code-reviewer, [rails-expert if used]

---

### Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | X | Must fix before deploy |
| 🟠 HIGH | X | Should fix before deploy |
| ⚠️ MEDIUM | X | Fix in next sprint |
| ℹ️ LOW/INFO | X | Note for future |

---

### Findings

#### 🔴 CRITICAL — [Finding Title]
**File:** `path/to/file.rb:123`
**Issue:** [Description]
**OWASP Category:** [A01-A10]
**Impact:** [What could go wrong]
**Fix:**
```ruby
# Current (vulnerable)
...

# Fixed (secure)
...
```

#### 🟠 HIGH — [Finding Title]
[Same format]

---

### Dual Auth Verification
- [ ] User auth and student auth are not mixed
- [ ] `authenticate_user!` used in correct controllers
- [ ] `authenticate_student!` used in correct controllers
- [ ] Profile type checks use helper methods (`.teacher?`, `.parent?`)
- [ ] Parent-student access goes through guardianships

### COPPA Compliance
- [ ] Student PII minimized in API responses (serializers exclude unnecessary fields)
- [ ] Parental consent flows intact (guardianship model enforced)
- [ ] No new analytics/tracking on student data or persistent identifiers
- [ ] No third-party SDKs receiving student data without parental consent
- [ ] Student data retention policy enforced (data deleted when no longer needed)
- [ ] No behavioral profiling or cross-service tracking of students
- [ ] Student API responses do NOT include: device IDs, IP addresses, geolocation, biometric data
- [ ] Soft-deleted student records hard-deleted after retention period
- [ ] Any new student data collection has documented purpose and minimization justification

### Payment Security
- [ ] Stripe webhook signatures verified
- [ ] Server-side amount validation
- [ ] Database locking on credit operations

---

### Recommendation

**Deploy status:** [SAFE TO DEPLOY / FIX CRITICAL FIRST / NEEDS MAJOR REWORK]
```

Mark task complete: `TaskUpdate: Step 5 → completed`

---

## APPROVAL GATE (MANDATORY STOP)

**⛔ STOP.**

```
Security review complete. Please review the report above.

**Summary:**
- 🔴 Critical: [X] findings
- 🟠 High: [Y] findings
- ⚠️ Medium: [Z] findings

**Deploy status:** [SAFE TO DEPLOY / FIX CRITICAL FIRST]

Options:
1. **Fix critical issues now** — I'll implement the fixes
2. **Acknowledge and proceed** — Accept risks (document why)
3. **Request deeper review** — Focus on specific area
```

**IF any 🔴 CRITICAL findings exist, YOU CANNOT recommend "SAFE TO DEPLOY".**

Mark gate complete after user responds: `TaskUpdate: GATE → completed`

---

## When NOT to Use
- Pure UI/styling changes with no auth, data, or API changes
- Documentation-only changes
- Test file changes only (no production code)

## Common Mistakes
- Skipping brakeman because "it's a small change" — always run it
- Marking "SAFE TO DEPLOY" with unresolved CRITICAL findings
- Forgetting bundler-audit for dependency vulnerabilities
- Mixing user and student auth in suggested fixes
- Not checking COPPA implications when student data is involved

---

## Quick Reference: What to Check When

| Code Change | Required Checks |
|-------------|----------------|
| New controller | Auth filters, strong params, serializer exposure |
| New model | Validations, sensitive fields, soft delete |
| Payment logic | Stripe signatures, amounts, locking |
| Student data | COPPA, data minimization, consent |
| Auth changes | Dual-auth separation, JWT handling |
| External API | Input sanitization, error handling, timeouts |
| New endpoint | Rate limiting, auth, authorization |

## Enforcement Summary

**YOU MUST:**
1. ✅ Create todo checklist at start
2. ✅ Run brakeman as first action
3. ✅ Invoke `security-engineer` agent (always)
4. ✅ Invoke `code-reviewer` agent in parallel (always)
5. ✅ Invoke `rails-expert` if controllers/auth touched
6. ✅ Verify dual-auth patterns are not mixed
7. ✅ Check COPPA compliance for student data
8. ✅ Generate structured report with severity levels
9. ✅ STOP at gate — user must review findings
10. ✅ CANNOT mark "SAFE TO DEPLOY" with unresolved CRITICAL findings

**YOU CANNOT:**
- ❌ Skip brakeman
- ❌ Skip security-engineer agent
- ❌ Recommend deploy with unresolved CRITICAL issues
- ❌ Mix user and student auth in fixes
- ❌ Modify teacher_account_creation_service.rb password flow
- ❌ Skip COPPA checks when student data is involved
