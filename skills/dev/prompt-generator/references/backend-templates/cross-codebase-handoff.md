# Cross-Codebase Handoff Template (Backend → Frontend)

Use for: "handover to frontend", "frontend prompt", "API contract for frontend"

This template is for when the backend has built something and needs the frontend to consume it.
The backend specifies the contract; the frontend owns architecture and implementation decisions.

## Template Structure

```
## Backend → Frontend Handoff: [Feature Name]

### What We Built
[1-2 sentence summary of what the backend delivers]

### Endpoint Spec

**URL:** [METHOD] /api/v1/[path]
**Auth:** Bearer token (JWT) — [User auth | Student auth]
**Role Required:** [parent | teacher | student | admin]

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Params:**
```json
{
  "param_name": "type — required/optional — description"
}
```

**Query Params (for GET):**
```
?page=1&per_page=25&start_date=2026-03-01&end_date=2026-03-10
```

**Success Response ([status code]):**
```json
{
  "data": {
    "id": "uuid-here",
    "type": "resource_type",
    "attributes": {
      "field": "value"
    },
    "relationships": {
      "related": {
        "data": { "id": "uuid", "type": "type" }
      }
    }
  }
}
```

**Pagination (if list endpoint):**
```json
{
  "data": [...],
  "meta": {
    "total_count": 100,
    "total_pages": 4,
    "current_page": 1
  }
}
```

### Error Responses

| Status | When | Response Body |
|--------|------|---------------|
| 401 | No/expired JWT | `{ "error": "You need to sign in or sign up before continuing." }` |
| 403 | Wrong role | `{ "error": "Not authorized" }` |
| 404 | Resource not found | `{ "error": "Resource not found" }` |
| 422 | Validation failed | `{ "error": "Description of what failed" }` |
| 429 | Rate limited | `{ "error": "Too many requests" }` |

### Business Rules the Frontend Should Know
1. [Rule that affects UI state or flow]
2. [Rule about data freshness or caching]

### What We Don't Care About (Frontend Decides)
- Component structure and state management
- UI layout, animations, loading states
- Client-side caching strategy
- Form validation UX (we validate server-side too)
- Error message display format
```

## Example: Booking Cancellation Handoff

```
## Backend → Frontend Handoff: Booking Cancellation

### What We Built
Parents can cancel pending or approved bookings. Credits are refunded atomically. Teacher is notified.

### Endpoint Spec

**URL:** POST /api/v1/students/:student_id/bookings/:id/cancel
**Auth:** Bearer token (JWT) — User auth (parent)
**Role Required:** parent (must own the student via guardianship)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Params:**
```json
{
  "cancellation_reason": "string — optional — why the parent is cancelling"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "booking",
    "attributes": {
      "status": "cancelled",
      "scheduled_at": "2026-03-15T14:00:00.000Z",
      "duration_minutes": 60,
      "teacher_name": "Jane Smith",
      "student_name": "Alex Johnson",
      "can_be_cancelled": false,
      "credits_cost": 1,
      "has_calendar_event": false
    }
  },
  "meta": {
    "credits_refunded": 1,
    "message": "Booking cancelled. 1 credit has been refunded."
  }
}
```

### Error Responses

| Status | When | Response Body |
|--------|------|---------------|
| 401 | No/expired JWT | `{ "error": "You need to sign in or sign up before continuing." }` |
| 404 | Booking not found or wrong parent | `{ "error": "Booking not found" }` |
| 422 | Already cancelled | `{ "error": "Booking is already cancelled" }` |
| 422 | Completed booking | `{ "error": "Cannot cancel a completed booking" }` |
| 422 | Past booking | `{ "error": "Cannot cancel a past booking" }` |

### Business Rules the Frontend Should Know
1. Only bookings with `can_be_cancelled: true` should show a cancel button
2. The `can_be_cancelled` attribute is already in BookingSerializer — use it
3. After cancellation, credits are refunded instantly (no delay)
4. Teacher receives an email notification (no frontend action needed)
5. Google Calendar event is removed async (may take a few seconds)

### What We Don't Care About
- Confirmation modal design/copy
- Whether you show a "credits refunded" toast or inline message
- Optimistic UI updates vs waiting for response
- How cancelled bookings appear in the list (grayed out? hidden? filtered?)
- Client-side caching invalidation approach
```
