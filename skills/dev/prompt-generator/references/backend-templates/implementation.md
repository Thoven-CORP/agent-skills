# Implementation Prompt Template

Use for: "build", "implement", "add endpoint", "fix", "refactor"

## Template Structure

```
Goal: [What to build — one clear sentence]

Scope In:
- [Feature/endpoint 1]
- [Feature/endpoint 2]
- [...]

Scope Out:
- [Explicitly excluded concerns]

Technical Context:
- Framework: Rails 7.2 API-only, PostgreSQL with UUIDs
- Auth: Devise + JWT (authenticate_user! for Users, authenticate_student! for Students)
- Serializer: JSONAPI::Serializer pattern (see app/serializers/booking_serializer.rb)
- Services: Initialize with named params → call/create → { success: true/false, ... } (see app/services/booking_request_service.rb)
- Error format: render json: { error: "..." }, status: :unprocessable_entity

Pattern Files:
- Controller: app/controllers/api/v1/parents/bookings_controller.rb
- Service: app/services/booking_request_service.rb
- Serializer: app/serializers/booking_serializer.rb
- Model: app/models/booking.rb
- Spec: spec/requests/api/v1/esa_leads_spec.rb
- Factory: spec/factories/bookings.rb

Requirements:
1. [Step-by-step ordered requirements]
2. [Each step should be independently verifiable]
3. [Include authorization: who can call this?]
4. [Include which before_actions to use]

Database Considerations:
- Migration needed? [yes/no — if yes, separate migration task]
- New associations? [belongs_to, has_many, etc.]
- Indexes needed? [for query patterns]
- Soft delete? [add archived_at if applicable]

Edge Cases:
- [Null/missing data in production]
- [Concurrent request handling]
- [Authorization edge cases (wrong role, archived user)]
- [Empty collection responses]

Testing Requirements:
- Request spec for each endpoint (happy path + error cases)
- Service spec if new service created
- Model spec for new validations
- Factory traits for new states
- Use sign_in(user) helper for authenticated specs

Success Criteria:
- [ ] All new specs pass
- [ ] Full suite passes (bundle exec rspec)
- [ ] No N+1 queries (check includes/joins)
- [ ] Error responses match existing format
```

## Example: Add Booking Cancellation Endpoint

```
Goal: Implement booking cancellation endpoint for parents

Scope In:
- DELETE /api/v1/students/:student_id/bookings/:id/cancel
- Credit refund to parent's wallet
- Notification to teacher
- Google Calendar event removal

Scope Out:
- Batch cancellation
- Cancellation policies/penalties
- Refund to payment method (credits only)

Technical Context:
- Framework: Rails 7.2 API-only, PostgreSQL with UUIDs
- Auth: authenticate_user! + ensure_parent_profile (see parents/bookings_controller.rb)
- Service pattern: see app/services/booking_request_service.rb for result hash pattern
- Booking model: app/models/booking.rb — has status enum (pending/approved/declined/cancelled/completed)
- Serializer: app/serializers/booking_serializer.rb — already has can_be_cancelled attribute

Pattern Files:
- Controller: app/controllers/api/v1/parents/bookings_controller.rb
- Service: app/services/booking_request_service.rb (transaction + error handling pattern)
- Model: app/models/booking.rb (status enum, callbacks)
- Spec: spec/requests/api/v1/esa_leads_spec.rb (request spec pattern)

Requirements:
1. Create CancellationService in app/services/cancellation_service.rb
   - Accept booking_id, cancelled_by (user)
   - Wrap in ActiveRecord::Base.transaction
   - Update booking status to :cancelled
   - Refund credits via credit_account (if slot-based) or bundle_credit_balance (if legacy)
   - Queue GoogleCalendarRemovalJob if google_calendar_event_id present
   - Queue teacher notification email
2. Add cancel action to parents/bookings_controller.rb
   - before_action :set_booking, :ensure_booking_belongs_to_parent
   - Only allow cancellation of :pending or :approved bookings
   - Return serialized booking with updated status
3. Add route: post 'cancel', on: :member inside bookings resources

Edge Cases:
- Booking already cancelled (return 422 with clear message)
- Booking in the past (scheduled_at < Time.current)
- Concurrent cancellation (database lock on booking row)
- Teacher availability slot should be freed (update_availability_status callback exists)
- Production: some bookings have nil bundle_purchase — use safe navigation

Testing Requirements:
- Request spec: happy path cancel, already cancelled, wrong parent, past booking
- Service spec: credit refund, transaction rollback on failure
- Use :approved trait on booking factory for cancellable state
- Stub Google Calendar and mailer calls

Success Criteria:
- [ ] Cancel endpoint returns 200 with updated booking
- [ ] Credits refunded atomically within transaction
- [ ] Teacher notification queued (not sent inline)
- [ ] Full suite passes
- [ ] No N+1 queries
```
