# Testing Prompt Template

Use for: "write tests", "test strategy", "coverage", "specs"

## Template Structure

```
Testing Goal: [What to test and why]

Scope:
- Models: [list model files]
- Services: [list service files]
- Controllers/Endpoints: [list controller files and routes]
- Jobs: [list job files if applicable]

Test Distribution:
- Model specs: [count] — validations, associations, scopes, callbacks
- Service specs: [count] — business logic, edge cases, transaction behavior
- Request specs: [count] — endpoint behavior, auth, response shapes
- Job specs: [count] — enqueueing, execution, error handling

Coverage Target: [e.g. 90% line coverage for new code]

Existing Patterns to Follow:
- Request spec: spec/requests/api/v1/esa_leads_spec.rb
- Factory: spec/factories/bookings.rb (traits pattern)
- Auth helper: spec/support/auth_helpers.rb (sign_in method)
- Shoulda matchers: spec/support/shoulda_matchers.rb

Factories Needed:
- [factory :new_model, with traits]

Mocking Strategy:
- External APIs: stub (Google Calendar, Stripe, Twilio, SendGrid)
- Mailers: allow(Mailer).to receive_message_chain(:with, :method, :deliver_later)
- Time: travel_to / freeze_time for date-dependent tests
- Redis: allow caching in test or use null cache

Test Scenarios:
### Happy Path
- [Scenario 1]
- [Scenario 2]

### Error Cases
- [Scenario 1 — expected error]
- [Scenario 2 — validation failure]

### Edge Cases
- [Scenario 1 — boundary condition]
- [Scenario 2 — concurrent access]

### Authorization
- [Correct role succeeds]
- [Wrong role gets 403]
- [No auth gets 401]
- [Cross-tenant access blocked]
```

## Example: Test Strategy for Booking Cancellation

```
Testing Goal: Comprehensive test coverage for booking cancellation feature

Scope:
- Service: app/services/cancellation_service.rb
- Controller: app/controllers/api/v1/parents/bookings_controller.rb (cancel action)
- Model: app/models/booking.rb (status transitions)

Test Distribution:
- Model specs: 3 — cancel! method, status transition validations, scope updates
- Service specs: 8 — happy path, insufficient credits, already cancelled, transaction rollback
- Request specs: 6 — auth, happy path, error cases, response shape

Coverage Target: 95% line coverage on new code

Existing Patterns:
- Request spec pattern: spec/requests/api/v1/esa_leads_spec.rb
  - Uses let blocks for params, describe/context/it nesting
  - expect { post ... }.to change(Model, :count).by(n)
  - expect(response).to have_http_status(:created)
  - json = JSON.parse(response.body)
- Factory pattern: spec/factories/bookings.rb
  - Traits for states: :approved, :declined, :cancelled, :completed
  - after(:build) blocks for complex setup
- Auth: sign_in(user) returns JWT token, use in Authorization header

Factories Needed:
- Existing :booking factory with :approved trait (already exists)
- May need :booking_with_credit_account trait for slot-based bookings

Mocking Strategy:
- Google Calendar: stub GoogleCalendarService or allow(...).to receive(:delete_event)
- Mailer: allow(BookingMailer).to receive_message_chain(:with, :cancellation_notification, :deliver_later)
- No Redis mocking needed (cancellation doesn't use cache)

Test Scenarios:

### Happy Path (Request Spec)
- Parent cancels approved booking → 200, booking status=cancelled, credits refunded
- Parent cancels pending booking → 200, booking status=cancelled, no credit refund needed

### Error Cases (Request Spec)
- Cancel already cancelled booking → 422, { error: "Booking already cancelled" }
- Cancel completed booking → 422, { error: "Cannot cancel completed booking" }
- Cancel booking belonging to different parent → 404

### Authorization (Request Spec)
- No auth header → 401
- Teacher trying to cancel (wrong role) → 403
- Student auth (wrong auth system) → 401

### Service Specs
- Successful cancellation: booking updated, credits refunded, job queued
- Transaction rollback: credit refund fails → booking stays approved
- Concurrent cancellation: two requests at once → only one succeeds (db lock)
- Legacy booking: refund via bundle_credit_balance (not credit_account)
- Slot-based booking: refund via credit_account

### Model Specs
- booking.can_be_cancelled? returns true for pending/approved, false for others
- booking.cancel! transitions status correctly
```
