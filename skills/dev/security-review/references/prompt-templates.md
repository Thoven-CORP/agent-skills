# Security Review — Sub-Agent Prompt Templates

This file contains the full prompt templates dispatched to sub-agents during the security review skill. Each section corresponds to a step in [../SKILL.md](../SKILL.md).

---

## Table of Contents

- [Security-Engineer Review](#security-engineer-review) (Step 2)
- [Code-Reviewer Review](#code-reviewer-review) (Step 3)
- [Rails Check Review](#rails-check-review) (Step 4)

---

## Security-Engineer Review

**Step:** 2
**Agent:** `security-engineer`
**Dispatch:** Always required

```
Task tool:
- subagent_type: "security-engineer"
- prompt: "Comprehensive security review of recent changes in this Rails 7.2 API backend.

  FILES CHANGED:
  [LIST FROM GIT DIFF]

  CRITICAL PROJECT CONTEXT:
  - Dual auth: Users (parents/teachers via Devise JWT) vs Students (separate Devise model)
  - COPPA compliance required for students (under-13)
  - Stripe payment processing with Connect
  - DO NOT TOUCH: teacher_account_creation_service.rb password flow

  REVIEW CHECKLIST:
  1. **Authentication:**
     - Is `authenticate_user!` or `authenticate_student!` used correctly?
     - Are user/student auth systems NEVER mixed?
     - JWT token handling secure?

  2. **Authorization:**
     - Can users only access their own data?
     - Profile type checks use `.teacher?` / `.parent?` (NOT string comparison)?
     - Parent can only see their students (via guardianships)?

  3. **COPPA Compliance:**
     - Student data minimized?
     - Parental consent flows intact?
     - No tracking/analytics on student PII?

  4. **Payment Security (Stripe):**
     - ALL webhook endpoints use `Stripe::Webhook.construct_event` with signature verification?
     - No raw `JSON.parse` of webhook payloads without signature check?
     - `STRIPE_WEBHOOK_SECRET` set in production environment?
     - Payment amounts validated server-side (never trust client-sent amounts)?
     - Credit/wallet balance operations use pessimistic locking (`with_lock`)?
     - Stripe API key restricted to minimum necessary permissions?
     - No Stripe secret keys in source code (only ENV vars)?
     - Idempotency keys used for payment operations?

  5. **Input Validation:**
     - All user inputs validated?
     - No raw SQL from user input?
     - File uploads sanitized?

  6. **OWASP Top 10:**
     - A01: Broken Access Control
     - A02: Cryptographic Failures
     - A03: Injection
     - A04: Insecure Design
     - A05: Security Misconfiguration
     - A06: Vulnerable Components
     - A07: Authentication Failures
     - A08: Data Integrity Failures
     - A09: Logging Failures
     - A10: Server-Side Request Forgery

  Output findings with severity: CRITICAL / HIGH / MEDIUM / LOW / INFO"
- description: "Security review of recent changes"
```

---

## Code-Reviewer Review

**Step:** 3
**Agent:** `code-reviewer`
**Dispatch:** Always required (launch in PARALLEL with Step 2)

```
Task tool:
- subagent_type: "code-reviewer"
- prompt: "Code quality and security review of recent changes:

  FILES CHANGED:
  [LIST FROM GIT DIFF]

  Focus on:
  1. Safe navigation for potentially nil associations
  2. N+1 query detection (missing includes/eager_load)
  3. Proper error handling (no bare rescue, no swallowed exceptions)
  4. Consistent use of soft deletes (archived_at) vs hard deletes
  5. UUID usage for all new primary keys
  6. Test coverage for new code

  Output issues with severity levels."
- description: "Code quality review"
```

---

## Rails Check Review

**Step:** 4
**Agent:** `general-purpose`, carrying [rails.md](rails.md)
**Dispatch:** Conditional — MANDATORY if recent changes touch controllers, Devise config, or models with authentication

```
Task tool:
- subagent_type: "general-purpose"
- prompt: "Rails-specific security review. Read ~/.claude/skills/security-review/references/rails.md
  first and run it whole; its steps and evidence standard are the bar for every finding.
  The checks below are extra context, not a replacement for it:

  FILES CHANGED:
  [LIST CONTROLLER/MODEL/CONFIG FILES]

  Check:
  1. Strong parameters — no `params.permit!`
  2. Before_action filters — auth callbacks present?
  3. Serializer exposure — sensitive fields excluded?
  4. CORS configuration — overly permissive?
  5. Rate limiting — verify rack-attack configuration:
     - `/api/v1/auth/login` throttled? (max 5 req/20s per IP)
     - `/api/v1/auth/signup` throttled? (max 3 req/min per IP)
     - `/api/v1/auth/students/login` throttled? (max 5 req/20s per IP — COPPA: stricter)
     - `/api/v1/auth/students/signup` throttled? (max 3 req/min per IP)
     - Password reset endpoints throttled?
     - Global API throttle exists? (max 300 req/5min per IP)
     - Stripe webhook endpoint whitelisted from throttling?
     - If ANY auth endpoint lacks throttling → HIGH severity
  6. Mass assignment — attr_accessible/strong params correct?

  Output findings with Rails-specific remediation."
- description: "Rails security patterns review"
```
