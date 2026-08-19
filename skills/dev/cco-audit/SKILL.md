---
name: cco-audit
description: |
  Chief Compliance Officer audit for Thoven EdTech platform (children under 13).
  7-phase audit: architecture mapping, regulatory research, dynamic checklist,
  domain-specific agent dispatch, LLM-as-judge quality review with gap relaunch,
  remediation routing, consolidated report with TODO.md integration.
  Covers COPPA, FERPA, GDPR, state privacy laws, security posture, PII handling.
  Use when: "compliance audit", "COPPA audit", "security audit", "CCO review",
  "privacy audit", "run the audit", "compliance check", "cco-audit".
---

# CCO Audit — Thoven Compliance & Security Audit

Repeatable 7-phase audit functioning as a virtual Chief Compliance Officer. Investigate and report only — no fixes implemented. Produces a prioritized findings report for founder triage.

## Critical Guidelines

- You MUST investigate and report only. NEVER implement fixes.
- You MUST cite file paths and line numbers for every finding. No guessing.
- You MUST use the severity framework exactly as defined.
- You MUST dispatch domain-specific agents, not generic ones.
- You MUST run the LLM-as-judge phase before producing the final report.
- You MUST add SHIP BLOCKERS to TODO.md.

## When to Use

- Every 2-4 weeks as a recurring compliance check
- Before partnerships, launches, or European expansion go live
- After shipping features that touch auth, student data, payments, or third-party integrations
- When regulatory deadlines approach (e.g., COPPA Final Rule deadline)

## When NOT to Use

- To fix compliance issues (use `grill-with-docs` + `to-spec` + `feature-ledger`, or targeted fixes instead)
- For Thovie AI compliance (handled separately in OVA branch)
- For one-off security questions (use `/security-review` instead)

## Severity Framework

| Severity | Definition | Timeline |
|----------|-----------|----------|
| **SHIP BLOCKER** | Legal liability if shipped. Active violation. Data breach risk. | Before next publish |
| **PRE-LAUNCH** | Must fix before partnerships, Thovie AI, or EU expansion | Before next milestone |
| **COMPLIANCE DEBT** | Risk over time. Not immediately dangerous. | 30-60 days |
| **NICE TO HAVE** | Best practice. Not legally required yet. | Backlog |

## Remediation Routes

Every FAIL/PARTIAL finding gets classified:

| Route | Criteria | Output |
|-------|----------|--------|
| **Targeted Fix** | Clear problem + clear fix. One file change. | Fix instruction with file:line |
| **Needs Deeper Investigation** | Surface-level finding, root cause unclear | What to investigate + where to look |
| **grill-with-docs + to-spec + feature-ledger** | Real feature work needing design-spec-ledger | Feature description for `grill-with-docs` then `to-spec` then `feature-ledger` |
| **Needs Legal Counsel** | Policy decision, regulatory interpretation, DPA negotiation | Question formatted for legal review |

## How to Use

### Step 0: Detect Environment

Determine which repo you are in:

```
If current directory contains Gemfile + app/models/ → BACKEND AUDIT
If current directory contains package.json + next.config.* → FRONTEND AUDIT
```

Load the appropriate checklist from `references/backend-checklist.md` or `references/frontend-checklist.md`.

### Step 1: Setup Audit Directory

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
mkdir -p docs/security/audits/$AUDIT_DATE
```

All audit artifacts go into `docs/security/audits/YYYY-MM-DD/`.

### Step 2: Run Phase 1 — Delta Check + Architecture Mapping

**Delta check**: Search for previous audit at `docs/security/audits/*/CCO_AUDIT_REPORT.md`. If found, read it and run `git log --since="<previous date>" --stat` to identify changes. Flag changed areas for deeper inspection.

**Secrets archaeology** (run immediately, both repos):
```bash
# Scan git history for accidentally committed secrets
git log -p --all -S 'STRIPE' --diff-filter=D -- '*.rb' '*.ts' '*.env' 2>/dev/null | head -50
git log -p --all -S 'sk_live' -- . 2>/dev/null | head -20
git log -p --all -S 'TWILIO' --diff-filter=D -- . 2>/dev/null | head -20
```
Search git history for patterns: API keys, secret tokens, passwords, connection strings for Stripe, Twilio, SendGrid, Daily.co, Sentry DSN, database URLs. Flag any secrets that were ever committed, even if later removed (they're still in history).

**Dependency supply chain audit**:
- Backend: Run `bundle audit check` (or `bundle exec bundler-audit check`) for known CVEs in gems
- Frontend: Run `npm audit` for known CVEs in npm packages
- Check for outdated dependencies with known security patches
- Flag any dependency that processes children's data (analytics, tracking, AI SDKs)

**Architecture mapping**: Produce `ARCHITECTURE_MAP.md` containing:

For **backend**: PII field inventory (all models), third-party data flow map, auth/access control map, data retention/deletion map, consent infrastructure map, attack surface census (count: unauthenticated endpoints, admin routes, webhook handlers, background jobs, WebSocket channels).

For **frontend**: client-side storage audit (localStorage, sessionStorage, cookies), third-party script inventory, PII exposure map (what's visible in browser), network request audit, consent UX map, auth session security, attack surface census (count: public pages, authenticated pages, student-facing pages, admin pages).

Save to: `docs/security/audits/$AUDIT_DATE/ARCHITECTURE_MAP.md`

### Step 3: Run Phase 2 — Regulatory Research

Use Tavily (`/research` or `/search` skill) for current regulatory requirements. Key queries:

1. COPPA Final Rule changes and deadlines (pro model)
2. FERPA EdTech requirements (pro model)
3. State children's privacy laws — California AADC, Connecticut (pro model)
4. GDPR Article 8 children's consent (pro model)
5. COPPA verifiable parental consent methods (mini model)
6. Recent COPPA enforcement actions and penalties (mini model)

Produce a Regulatory Requirements Matrix. Save to: `docs/security/audits/$AUDIT_DATE/REGULATORY_RESEARCH.md`

Also update the living doc at `docs/security/REGULATORY_LANDSCAPE_2026.md` if new information found.

### Step 4: Run Phase 3 — Dynamic Checklist Generation

Build the checklist from Phase 1 findings + Phase 2 research. The checklist MUST be specific to what was actually found in the codebase — not generic.

Load the reference checklist for your environment (backend or frontend) and adapt it based on:
- What PII fields were discovered
- What third-party services are integrated
- What regulatory requirements apply
- What changed since last audit (if delta exists)

Each check item format:
```
- [ ] CHECK-ID: Description
  Files: [specific files to examine]
  Pass criteria: [what PASS looks like]
  Severity if failing: [SHIP BLOCKER / PRE-LAUNCH / COMPLIANCE DEBT / NICE TO HAVE]
```

### Step 5: Run Phase 4 — Agent-Orchestrated Audit Execution

Dispatch domain-specific agents IN PARALLEL. Each agent receives their checklist section, the architecture map, and explicit file targets.

**Backend agent dispatch:**

| Domain | Agent (subagent_type) | Scope |
|--------|----------------------|-------|
| COPPA Compliance | `security-engineer` | Consent fields, VPC flow, data minimization, IP collection, third-party sharing, biometric disclosure |
| GDPR + State Laws + Data Lifecycle | `legal-compliance-checker` or `compliance-auditor` | Retention policy, deletion rights, consent tracking, DPAs, written security program |
| GDPR EU Readiness (Domain H) | `legal-compliance-checker` or `compliance-auditor` | ROPA, DPIA, cross-border transfers, DPO, breach notification, portability, privacy by design |
| Security Posture + Incident Response | `security-engineer` | Auth config, encryption, rate limiting, secrets, OWASP Top 10, incident plan |
| Access Control + FERPA | `code-reviewer` | Admin access to student data, RBAC, audit trail, authorization checks, guardianship boundary testing |
| Database PII + Schema | `postgres-pro` | PII fields, encryption at rest, unencrypted tokens, index exposure |
| Thoven Domain-Specific | `code-reviewer` | Guardianship boundaries, serializer data minimization, booking/payment data isolation, email content audit |

**Thoven-specific checks (backend Agent 6 must cover):**

- **Guardianship boundary testing**: Can Parent A see Parent B's students? Can a teacher see students from classes they don't teach? Trace authorization in all controllers that return student data.
- **Serializer data minimization**: Are ALL serializers touching student data returning minimum fields? Check every serializer that includes student name, email, DOB, or avatar. Teachers should only see first names.
- **Booking/payment data isolation**: Can student payment data leak through booking endpoints? Stripe data is split across tables (users vs profiles) — verify correct lookups per COMMON_ERRORS.md Bug 14.
- **Email content audit**: Scan all mailers for student PII. Verify COPPA data minimization comments are present AND enforced. Check for student last names, parent emails, or student emails in teacher-facing templates.

**GDPR EU Readiness checks (backend Agent 7 — Domain H, all PRE-LAUNCH severity):**

- **Records of Processing Activities (ROPA)**: Does an Article 30 record exist documenting every processing activity involving personal data? Must include: purposes, data categories, recipients, retention periods, transfer safeguards. Check for any ROPA document in `docs/compliance/` or `docs/security/`.
- **Data Protection Impact Assessment (DPIA)**: Has a DPIA been conducted for processing children's data? Required under Article 35 for high-risk processing (children's data at scale = high risk). Check for DPIA document.
- **Cross-border data transfer safeguards**: For every US-hosted service processing EU data (Neon PostgreSQL, Redis, Replit, Stripe, SendGrid, Twilio, Daily.co, Sentry), are Standard Contractual Clauses (SCCs) or equivalent safeguards in place? Check for DPA/SCC documentation with each vendor.
- **DPO designation**: If Thoven systematically processes EU children's data, a Data Protection Officer must be designated. Check if a DPO is named anywhere in docs or privacy policy.
- **72-hour breach notification**: Is there a documented procedure to notify the relevant supervisory authority within 72 hours of becoming aware of a data breach? Check for incident response plan with EU-specific timeline.
- **Right to data portability**: Can users export their data (and their children's data) in a machine-readable format (JSON, CSV)? Check for any data export endpoint or mechanism in controllers/services.
- **Consent withdrawal mechanism**: Can EU users withdraw consent, and does processing actually stop? Trace consent withdrawal through the codebase — check UserConsent model, any unsubscribe/revoke endpoints.
- **Privacy by design (Article 25)**: Is privacy by design documented as a development practice? Check CLAUDE.md, architecture docs, or any development guidelines for privacy-by-design references.
- **Variable age thresholds**: EU member states set different ages (13-16) for when parental consent is required. Does the platform handle variable age thresholds, or is it hardcoded to 13? Check `under_13?` method and whether it could be configurable by jurisdiction.
- **Lawful basis documentation**: For each category of personal data processed, is the lawful basis (consent, contract, legitimate interest) documented? This is separate from having a privacy policy — it's an internal record.

**Frontend agent dispatch:**

| Domain | Agent (subagent_type) | Scope |
|--------|----------------------|-------|
| Storage + Tracking | `security-engineer` | localStorage, cookies, third-party scripts, analytics, pixels |
| PII Exposure + Data Flow | `code-reviewer` | API responses, React state, component rendering, console logs, URLs |
| Auth + Session Security | `security-engineer` | JWT storage, token handling, auth guards, logout, route isolation |
| Consent UX + Age Design | Product Manager agent | Consent flows, dark patterns, age-appropriate design, privacy links |

**Aikido SAST Integration (optional, graceful degradation):**

Before dispatching agents, check if Aikido MCP is available by testing `aikido-mcp:aikido_full_scan` with a minimal payload. If available:

1. Run `aikido_full_scan` on security-critical files (auth controllers, webhook handlers, initializers, student-facing endpoints) — batch up to 50 files per call
2. Tag all Aikido findings with `[AIKIDO]` prefix
3. Merge Aikido findings into the Security Posture agent's output
4. In Phase 5 (judge), if the judge flags uncovered files, run targeted Aikido scans on those files

If Aikido is NOT configured, skip silently and proceed — the audit works without it.

Each agent outputs findings in this format:
```markdown
## [CHECK-ID]: [Check Name]
**Status**: PASS | FAIL | PARTIAL
**Severity**: [SHIP BLOCKER / PRE-LAUNCH / COMPLIANCE DEBT / NICE TO HAVE]
**Evidence**: [file:line — what was found]
**Gap**: [what's missing or wrong]
**Remediation**: [specific recommendation]
```

### Step 6: Run Phase 5 — LLM-as-Judge Quality Review

After all Phase 4 agents return, launch a **judge agent** (`architecture-reviewer`):

**Judge instructions:**
1. Read the architecture docs (`.claude/docs/ARCHITECTURE.md`, `API_ROUTES.md`, `BACKGROUND_JOBS.md` for backend; `.claude/docs/ARCHITECTURE.md`, `API_AND_AUTH.md` for frontend)
2. Read ALL Phase 4 findings
3. Cross-compare: identify gaps where architecture docs mention tables, routes, jobs, or integrations that NO agent examined
4. Score each finding 1-5 on:
   - **Depth** (1=checked file exists, 5=traced full code path end-to-end)
   - **Evidence** (1=speculative, 5=file:line with code snippet)
   - **Severity Accuracy** (1=mislabeled, 5=justified by evidence)
5. Flag findings scoring < 3 as "shallow — needs relaunch"
6. Identify architectural areas with ZERO coverage
7. List specific relaunch targets: "[Agent type] should examine [files] for [concern]"

**Relaunch**: Dispatch targeted agents for each gap/shallow finding. Merge results into Phase 4 findings.

Save to: `docs/security/audits/$AUDIT_DATE/JUDGE_REVIEW.md`

### Step 7: Run Phase 6 — Remediation Routing

Classify every FAIL/PARTIAL finding into a remediation route:

**Targeted Fix**: Clear problem, clear solution, cite exact file:line and fix instruction.

**Needs Deeper Investigation**: Finding is surface-level or root cause unclear. Specify what to investigate, what files to trace, what questions to answer.

**grill-with-docs + to-spec + feature-ledger**: Feature-level work. Write a brief feature description ready for `grill-with-docs` then `to-spec` then `feature-ledger` including: what it should do, why it's needed (regulatory requirement), acceptance criteria.

**Needs Legal Counsel**: Cannot be resolved by engineering. Format as a question with full context: what the regulation requires, what Thoven currently does, what the gap is, what decision is needed.

Sort findings by route, then by severity within each route.

Save to: `docs/security/audits/$AUDIT_DATE/REMEDIATION_PLAN.md`

### Step 8: Run Phase 7 — Consolidated Report + Integration

**Produce the final report** at `docs/security/audits/$AUDIT_DATE/CCO_AUDIT_REPORT.md`:

```
# Thoven CCO Audit Report — [DATE]
## Executive Summary
## Compliance Scorecard (RED/YELLOW/GREEN per framework)
## Regression Check (previous SHIP BLOCKERS: RESOLVED or STILL OPEN)
## SHIP BLOCKERS
## PRE-LAUNCH
## COMPLIANCE DEBT
## NICE TO HAVE
## Detailed Findings by Domain
## Remediation Plan Summary (by route)
## PII Inventory / Third-Party Data Flow Map
## Regulatory Changes Since Last Audit
## Judge Review Summary (gaps found, relaunches done)
## Trend Line (if previous audit exists — score comparison)
## Appendix: Files Examined
```

**TODO.md integration**: Add all SHIP BLOCKERS to TODO.md with `[CCO-AUDIT]` prefix:
```
- [ ] [CCO-AUDIT] COPPA-03: Encrypt Google Calendar OAuth tokens (SHIP BLOCKER)
```

**Audit history**: Append scorecard summary to `docs/security/audits/AUDIT_HISTORY.md`.

**Post-audit output**:
1. Print Executive Summary and Compliance Scorecard
2. Print all SHIP BLOCKERS with remediation routes
3. If both backend + frontend audits exist for same date, flag cross-stack findings
4. Ask: "Which findings do you want to discuss or prioritize first?"

## Cross-Audit Synthesis

When BOTH backend and frontend audits exist for the same date:

1. Read both `CCO_AUDIT_REPORT.md` files
2. Identify cross-stack findings (e.g., backend sends student last name AND frontend displays it)
3. Deduplicate findings appearing in both
4. Produce `CROSS_STACK_FINDINGS.md` in the backend audit folder

## File Storage Convention

```
docs/security/
  audits/
    YYYY-MM-DD/
      CCO_AUDIT_REPORT.md        # Final report
      ARCHITECTURE_MAP.md         # Phase 1 output
      REGULATORY_RESEARCH.md      # Phase 2 output
      JUDGE_REVIEW.md             # Phase 5 output
      REMEDIATION_PLAN.md         # Phase 6 output
      CROSS_STACK_FINDINGS.md     # If both audits ran
    AUDIT_HISTORY.md              # Running scorecard across audits
  REGULATORY_LANDSCAPE_2026.md    # Living regulatory doc
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Subagents return shallow findings | Judge phase catches this — it relaunches targeted agents |
| Too many findings to triage | Focus on SHIP BLOCKERS first. Remediation routing sorts the rest. |
| Regulatory research returns stale data | Check Tavily results for dates. Cross-reference with FTC.gov directly. |
| Previous audit not found | First run is a baseline. No delta check needed. |
| Agent denied file write permission | Use Bash heredoc to write files, or write from main session |

## Recommended Security Workflow

How `/cco-audit` fits with other security tools:

```
RECURRING (every 2-4 weeks):
  /cco-audit              → Compliance + security audit, produces report + remediation plan

WHEN IMPLEMENTING FIXES from the audit:
  grill-with-docs → to-spec → feature-ledger  → Spec and ledger the fix (for feature-level findings)
  /aikido:scan             → Verify fix doesn't introduce new SAST vulns
  /verify                  → Confirm fix resolves the audit finding

BEFORE EVERY PUBLISH:
  /aikido:scan             → Quick SAST check on changed files
  /security-review         → Manual review of auth/payment/student data changes

AD-HOC (when needed):
  /cso                     → Deep infrastructure security audit (OWASP, STRIDE, supply chain)
  /cso --comprehensive     → Monthly deep scan with lower confidence bar
```

**Relationship to `/cso`**: The CSO skill audits infrastructure-level security (secrets, supply chain, CI/CD, OWASP Top 10, STRIDE). The CCO audit focuses on regulatory compliance (COPPA, FERPA, GDPR) and children's data protection. They complement each other — run both for full coverage.

**Relationship to `/aikido:scan`**: Aikido provides automated SAST scanning. The CCO audit uses Aikido as one evidence source during Phase 4 (if configured), but also covers compliance, business logic, and privacy concerns that SAST can't detect.

## Resources

- `references/backend-checklist.md` — Backend audit domain checklist template
- `references/frontend-checklist.md` — Frontend audit domain checklist template
- Regulatory research: `docs/security/REGULATORY_LANDSCAPE_2026.md`
- Previous audits: `docs/security/audits/*/CCO_AUDIT_REPORT.md`
- Aikido plugin: `/aikido:scan` for SAST, `/aikido:setup` for configuration
