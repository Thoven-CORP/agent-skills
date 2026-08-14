---
name: feature-plan
description: Use when starting a new feature, creating implementation plans, or scaffolding feature documentation. Breaks approved designs into executable task breakdowns with 5-layer documentation following STANDARD_FEATURE_DEVELOPMENT_PROCEDURE. Triggers on "new feature", "feature plan", "plan feature", "scaffold docs", "master plan", "implementation plan", "start building", "spec", "requirements".
---

# Feature Plan — Design to Executable Tasks

## Overview

Scaffold the 5-layer documentation structure and break designs into bite-sized implementation tasks.

**THIS IS A RIGID SKILL. EVERY STEP IS MANDATORY BEFORE WRITING FEATURE CODE.**

**Core Principle:** "Plan Comprehensively, Build Incrementally, Document Reality"

**Reference:** `docs/STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md` — full templates and methodology.

## MANDATORY First Action

Before ANY other action, create the gate checklist:

```
TaskCreate for each:
- [ ] Step 0: Context7 lookup + structured problem analysis
- [ ] Step 1: Gather feature requirements (or read approved design)
- [ ] Step 2: Scaffold folder structure
- [ ] Step 3: Draft master plan (00_MASTER_PLAN.md)
- [ ] Step 4: Architecture review (architecture-reviewer agent)
- [ ] Step 5: Database & API design (master-backend-ai-rails agent)
- [ ] Step 6: Security assessment (if auth/payments/student data involved)
- [ ] Step 7: Analytics planning (REQUIRED — what metrics track success?)
- [ ] Step 8: Task breakdown with dependency mapping
- [ ] GATE: Present plan to user for approval
- [ ] Step 9: Execute plan (dispatch to expert-team Execution mode or subagent-driven)
```

## Step 0: Context7 + Problem Analysis (MANDATORY)

**Before writing ANY plan documentation:**

1. **Context7 Lookup** — If the feature involves external libraries:
   ```
   mcp__context7__resolve-library-id("library name")
   mcp__context7__get-library-docs("/org/project", topic: "relevant topic")
   ```

2. **Structured Analysis** — Think through:
   - What are the core business requirements?
   - What data models are involved?
   - What edge cases must we handle?
   - What are the trade-offs between approaches?

## Step 1: Gather Requirements

If coming from `brainstorm`: Read the approved design doc.
If starting fresh: Gather requirements through clarifying questions.

Key questions:
- Who uses this? (parent, teacher, student, admin)
- What's the happy path?
- What error cases exist?
- What existing models/services are involved?

## Step 2: Scaffold Folder Structure

```bash
mkdir -p docs/[Feature_Name]/tasks
mkdir -p docs/[Feature_Name]/api
```

Create:
- `docs/[Feature_Name]/00_MASTER_PLAN.md`
- `docs/[Feature_Name]/01_IMPLEMENTATION_STATUS.md`
- `docs/[Feature_Name]/CURRENT_STATUS.md`

Use templates from `docs/STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md`.

## Step 3: Draft Master Plan

Write `00_MASTER_PLAN.md` following the template. MUST include:
1. Business Requirements (What + Why)
2. Architecture Overview (Design decisions with rationale)
3. Database Schema (Tables, indexes, constraints)
4. API Design (Endpoints, auth, authorization)
5. Business Logic (State machines, workflows, rules)
6. Analytics & Metrics (REQUIRED — what to track, why, how)
7. Implementation Tasks (phases + dependency order)
8. Success Criteria (definition of done)

## Step 4: Architecture Review

Dispatch architecture-reviewer agent:
```
Task tool:
  subagent_type: "architecture-reviewer"
  model: "opus"
  prompt: "Review the architecture in docs/[Feature]/00_MASTER_PLAN.md.
           Check: scalability, pattern adherence, security implications,
           data model correctness, API design quality.
           Score each area 1-5 (default 2). Flag any CRITICAL issues."
```

Address any CRITICAL issues before proceeding.

## Step 5: Database & API Design

Dispatch master-backend-ai-rails agent for detailed design:
```
Task tool:
  subagent_type: "master-backend-ai-rails"
  model: "opus"
  prompt: "Design the detailed database schema and API endpoints for [feature].
           Read docs/[Feature]/00_MASTER_PLAN.md for context.
           Follow project conventions: UUIDs, soft deletes, service layer pattern.
           Output: migration code, model validations, endpoint specs, API contract."
```

Write API contracts to `docs/[Feature]/api/`.

## Step 6: Security Assessment

**REQUIRED if feature involves:** auth, payments, student data (COPPA), file uploads, external APIs.

```
Task tool:
  subagent_type: "security-engineer"
  model: "opus"
  prompt: "Security review for [feature]. Read docs/[Feature]/00_MASTER_PLAN.md.
           Check: auth bypass, injection, COPPA compliance, Stripe patterns,
           OWASP top 10. Flag severity: CRITICAL/HIGH/MEDIUM/LOW."
```

## Step 7: Analytics Planning (REQUIRED)

Every feature MUST have an analytics section in the master plan:
- What events to track (name, trigger, data captured, purpose)
- What materialized views need creation/update
- What questions we should be able to answer post-launch
- Check existing views in `docs/STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md` appendix

## Step 8: Task Breakdown

Break the plan into tasks following these rules:

**Task Sizing:**
- Ideal: 30 minutes to 3 hours per task
- Warning: If > 3 hours, break it down further
- Too Small: If < 30 minutes, combine with related task

**Task Categories:** Migrations → Models → Services → Controllers → Jobs → Tests → Analytics

**Dependency Mapping:** Mark clear dependencies between tasks. Group into phases.

**Decision Locking (from GSD):**

For each architectural decision in the plan, classify as:

| Category | Meaning | Example |
|----------|---------|---------|
| **Locked** | Decided, do not revisit | "Use service layer, not fat controllers" |
| **Discretion** | Agent can decide during implementation | "Exact validation error messages" |
| **Deferred** | Decide later with more context | "Caching strategy for v2" |

Document these in the master plan under "Decision Log".

Write task files to `docs/[Feature]/tasks/TASK_01_[name].md` using the template from STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md.

## GATE: User Approval

Present the complete plan to the user:
- Master plan summary
- Task list with estimates
- Dependency diagram
- Decision log (Locked/Discretion/Deferred)

**NO implementation until user approves.**

## Step 9: Execution

After approval, offer execution choice:

**Option A: Expert Team Execution Mode**
Invoke `expert-team --mode execution` for wave-based parallel implementation.

**Option B: Subagent-Driven Development**
Dispatch one sub-agent per task sequentially, with review checkpoints between tasks.

**Checkpoints (from SADD `do-in-steps`):**
- After each task: run tests, verify changes, update status tracker
- After each phase: full test suite, review deviation log
- After completion: fresh verification of ALL requirements

## When NOT to Use
- Bug fix — use investigate, not feature-plan
- Design hasn't been approved yet — use brainstorm first
- Task is smaller than 2 hours — skip the 5-layer framework
- Existing plan already covers this work

## Common Mistakes
- Writing implementation code during planning — plan first, build later
- Skipping analytics planning — every feature needs success metrics
- Tasks sized over 3 hours — break them down further
- Not checking existing docs/ for related plans before creating new ones
- Skipping Context7 lookup for features involving external libraries

## Rules

- **Context7 before planning** — Look up docs for any libraries involved
- **5-layer documentation** — Master plan, tasks, API contracts, status tracker, frontend docs
- **Analytics is NOT optional** — Every feature needs metrics
- **Decision locking** — Classify all decisions, don't revisit Locked ones
- **Checkpoints are mandatory** — Verify between phases, not just at the end
- **Templates exist** — Use STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md templates, don't reinvent
