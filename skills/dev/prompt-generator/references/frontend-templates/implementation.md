---
name: implementation
category: feature-execution
type: implementation
description: "Prompt template for feature implementation, bugfixes, and refactoring tasks"
triggers:
  - "implement", "build", "add feature", "bugfix", "refactor"
frameworks: [structured-step-by-step, constraints]
---

# Implementation Prompt Template

## Quality Checklist
- [ ] Clear goal statement
- [ ] Scope boundaries (in/out)
- [ ] Success criteria (testable)
- [ ] Output format specified
- [ ] Edge cases explicitly listed
- [ ] Acceptance criteria with testable conditions
- [ ] Pattern files to mimic (existing codebase examples)
- [ ] Testing requirements (unit, integration, coverage threshold)
- [ ] Error handling expectations
- [ ] Files/modules likely affected
- [ ] Dependencies and ordering constraints

## Recommended Sections
1. **Goal** — What to build/fix and why
2. **Scope** — What's included, what's explicitly excluded
3. **Technical Context** — Existing patterns, files to reference, architectural constraints
4. **Requirements** — Numbered list of specific behaviors
5. **Edge Cases** — Explicit list of boundary conditions to handle
6. **Acceptance Criteria** — Testable conditions for "done"
7. **Testing Requirements** — What tests to write, coverage expectations
8. **Pattern Files** — 2-3 existing files to mimic style/structure from

## Framework
**Structured step-by-step + constraints.** Implementation prompts benefit from explicit ordering and boundary conditions. Break the work into sequential steps with clear dependencies.

## Example

### Goal
Implement booking cancellation flow allowing teachers to cancel upcoming sessions with automatic credit refund.

### Scope
**In:** Cancel button on session card, confirmation modal, API call to cancel endpoint, credit refund logic, success/error states.
**Out:** Batch cancellation, cancellation policies, refund to payment method (credits only).

### Technical Context
- Follow pattern in `lib/booking-api.ts` for API calls
- Use `getAuthenticatedRailsHeaders()` for auth
- Component style follows `components/booking/SessionCard.tsx`
- State management via React Context (`BookingContext`)

### Requirements
1. Teacher sees "Cancel" button on future sessions only
2. Clicking shows confirmation modal with session details
3. On confirm, call `DELETE /api/v1/sessions/:id`
4. On success, refund credits to teacher balance
5. Show success toast, remove session from list
6. On error, show error toast, keep session unchanged

### Edge Cases
- Session less than 24 hours away: show warning but allow
- Session already started: disable cancel button
- Network failure during cancel: show retry option
- Concurrent cancel (another user cancels same session): handle 404 gracefully

### Acceptance Criteria
- [ ] Cancel button visible only on future sessions
- [ ] Confirmation modal shows correct session details
- [ ] Credits refunded on successful cancellation
- [ ] Error states handled with user feedback
- [ ] All new code has test coverage >= 80%

### Testing Requirements
- Unit tests for cancellation logic
- Component tests for modal interaction
- Integration test for API call + state update
- Test each edge case explicitly

### Pattern Files
- `lib/booking-api.ts` — API call structure
- `components/booking/SessionCard.tsx` — component pattern
- `lib/booking-api.test.ts` — test pattern
