---
name: testing
category: quality
type: testing
description: "Prompt template for test creation, test strategy, and QA planning"
triggers:
  - "write tests", "test strategy", "QA plan", "test coverage", "testing"
frameworks: [least-to-most, structured-constraints]
---

# Testing Prompt Template

## Quality Checklist
- [ ] Clear goal statement
- [ ] Scope boundaries (in/out)
- [ ] Success criteria
- [ ] Output format specified
- [ ] Test types required (unit, integration, e2e)
- [ ] Coverage targets
- [ ] Edge cases and boundary conditions
- [ ] Mock/stub requirements
- [ ] Test data setup

## Recommended Sections
1. **Testing Goal** — What to test and why
2. **Scope** — Which files/features/flows
3. **Test Types** — Unit, integration, e2e, and their distribution
4. **Coverage Target** — Minimum threshold
5. **Key Scenarios** — Happy path + edge cases
6. **Mocking Strategy** — What to mock, what to test real
7. **Test Data** — Setup requirements

## Framework
**Least-to-Most + structured constraints.** Test cases build sequentially — start with simple happy path, layer on edge cases, build to integration scenarios.

## Example

### Testing Goal
Comprehensive test coverage for the booking cancellation flow (BookingContext + booking-api + CancelModal component).

### Scope
- `lib/booking-api.ts` — cancelSession function
- `contexts/BookingContext.tsx` — state updates on cancellation
- `components/booking/CancelModal.tsx` — UI interaction

### Coverage Target
80% line coverage minimum across all three files.

### Key Scenarios
**Happy path:**
1. Teacher clicks cancel on future session
2. Confirmation modal appears with correct details
3. API call succeeds, session removed, credits refunded

**Edge cases:**
4. Session < 24 hours away — warning shown but cancel allowed
5. Session already started — cancel button disabled
6. Network failure — retry option shown
7. 404 response (already cancelled) — graceful handling
8. Concurrent state update — optimistic UI rollback

### Mocking Strategy
- Mock `fetch` for API calls (use msw or vi.mock)
- Real BookingContext (test actual state transitions)
- Mock toast notifications (verify called with correct message)

### Test Data
```typescript
const mockSession = {
  id: 1,
  teacher_id: 42,
  scheduled_at: '2026-03-15T10:00:00Z',
  status: 'confirmed',
  credits_cost: 2,
}
```
