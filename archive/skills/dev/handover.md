---
name: dev-handover
description: Use when a validated backend feature needs frontend implementation. Conditional phase — only runs if feature has frontend component. Triggers on /dev:handover or pipeline advancement past VALIDATE.
---

# /dev:handover — Frontend Design + Handover

## Purpose

Hand the completed, validated backend to the frontend for implementation. Optionally run frontend design phase if UI work is needed. Then invoke `/frontend-handover` to generate the full handover document.

**This phase is CONDITIONAL** — only runs if MANIFEST domains include `frontend` or the feature requires UI work.

**Default: SKIP.** Only runs if MANIFEST domains include `frontend` or the design doc specifies UI work needed.

## Phase Pattern: RESEARCH > EXECUTE > DOCUMENT > GATE

---

## RESEARCH

### 1. Read Context
```
Read: docs/[feature]/.dev/MANIFEST.md → domains, acceptance criteria for HANDOVER
Read: docs/[feature]/prompt-transitions/handover.md → context from VALIDATE
Read: docs/[feature]/api/[FEATURE]_API_CONTRACT.md → API contract
Read: docs/[feature]/.dev/reports/validation-report.md → what passed validation
```

### 2. Verify API Contract Matches Implementation

Cross-reference API contract (written during DOCUMENT) with actual implementation:
- Endpoints match routes (`rails routes | grep [feature]`)
- Request params match strong params
- Response shapes match serializer output
- Error responses match actual error handling
- Status codes match controller responses

**If mismatches found:** Fix API contract or implementation before proceeding.

### 3. Check Frontend Needs

From design doc and MANIFEST:
- Does this need new UI components?
- Does this need UI design work?
- Is it API-only (just needs endpoint documentation)?

---

## EXECUTE

### Step 1: Frontend Design (Conditional)

**If feature needs new UI work:**

Invoke `frontend-design:frontend-design` skill or `ui-designer` agent:
- Design UI components based on feature requirements
- Create mockups or design specifications
- Define component hierarchy and state management needs
- Document user interaction flows

**If API-only (no new UI):** Skip to Step 2.

### Step 2: Generate Handover Document

Invoke `/frontend-handover` skill, which orchestrates:
1. API contract review and formatting
2. Authentication requirements documentation
3. Error response documentation for all failure modes
4. Pagination details (if list endpoints)
5. WebSocket event documentation (if real-time features)
6. Complete workflow examples with curl/fetch snippets

Output: `docs/implementation/frontend/[feature]/FRONTEND_HANDOVER_PROMPT.md`

### Step 3: Verify Handover Completeness

Check handover document covers:
- [ ] All endpoints with URL, method, params, response
- [ ] Auth requirements (JWT Bearer token, which role)
- [ ] Error responses for each failure mode (with status codes + JSON body)
- [ ] Pagination format (if applicable)
- [ ] Rate limits (if applicable)
- [ ] "What we don't care about" section (frontend owns its own architecture)

---

## DOCUMENT

### 1. Update MANIFEST
```
Phase Progress: HANDOVER → ✅ (pending gate)
Artifacts: Add handover document path
```

### 2. Files Created
- Frontend handover prompt: `docs/implementation/frontend/[feature]/FRONTEND_HANDOVER_PROMPT.md`
- Frontend design specs (if applicable): `docs/implementation/frontend/[feature]/DESIGN.md`

---

## GATE

```
PHASE GATE: HANDOVER

Frontend Design: [Completed / Skipped (API-only)]
Handover Document: docs/implementation/frontend/[feature]/FRONTEND_HANDOVER_PROMPT.md

API Contract Verification:
  ✅ Endpoints match implementation
  ✅ Response shapes match serializers
  ✅ Error codes documented

HANDOVER Acceptance Criteria:
  ✅ [criterion 1]
  ✅ [criterion 2]

Handover covers:
  ✅ Endpoints with examples
  ✅ Auth requirements
  ✅ Error responses
  ✅ Workflow examples

Next phase: SHIP

Options:
  1. Approve → advance to SHIP
  2. Revise → update handover document
  3. Pause → /dev:pause
```

---

## TRANSITION

On approval:

1. Invoke `/prompt-generator` → create SHIP phase prompt
2. Save to `docs/[feature]/prompt-transitions/ship.md`
3. Contents: feature summary, validation status, handover status, changelog hints

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| API contract doesn't match implementation | ALWAYS verify contract against actual code before handover |
| Missing error response documentation | Frontend needs EVERY error code and response shape |
| Telling frontend how to build their side | Handover specifies WHAT (contract), not HOW (implementation) |
| Skipping handover for "simple" features | If it has frontend, it gets handover. Period. |
