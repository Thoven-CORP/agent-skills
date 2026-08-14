# PRD/Spec Prompt Template

Use for: "PRD", "spec", "requirements", "API contract"

## Template Structure

```
Feature Name: [Name]
Author: [who]
Date: [YYYY-MM-DD]

## Problem Statement
[What problem does this solve? Who has it? How do we know?]

## User Stories
- As a [parent/teacher/student/admin], I want to [action] so that [outcome]

## API Contract

### Endpoint: [METHOD] /api/v1/[path]

**Auth:** [authenticate_user! | authenticate_student! | public]
**Role:** [parent | teacher | admin | student | any]

**Request:**
```json
{
  "param": "value"
}
```

**Success Response (200/201):**
```json
{
  "data": {
    "id": "uuid",
    "type": "resource_type",
    "attributes": { ... }
  }
}
```

**Error Responses:**
- 401: `{ "error": "You need to sign in or sign up before continuing." }`
- 403: `{ "error": "Not authorized" }`
- 404: `{ "error": "Resource not found" }`
- 422: `{ "error": "Validation failed", "details": [...] }`

## Business Rules
1. [Rule 1 — when/then format]
2. [Rule 2]

## Data Model Changes
- [New table? New column? New index?]
- [Associations to existing models]

## Edge Cases
- [Edge case 1]
- [Edge case 2]

## Non-Functional Requirements
- Response time: < 200ms
- Rate limit: [if applicable]
- COPPA: [if student-facing]

## Out of Scope
- [What this does NOT include]

## Success Metrics
- [How to measure if this worked]
```

## Example: Student Practice Log API Spec

```
Feature Name: Student Practice Log
Author: Backend Team
Date: 2026-03-10

## Problem Statement
Parents and teachers have no visibility into student practice between lessons. Teachers can't tailor lessons to actual practice habits.

## User Stories
- As a parent, I want to see my child's practice history so I can encourage consistency
- As a teacher, I want to see student practice before lessons so I can prepare effectively
- As a student, I want to log my practice so my teacher knows what I worked on

## API Contract

### Endpoint: POST /api/v1/students/practice_sessions

**Auth:** authenticate_student!
**Role:** student (self only)

**Request:**
```json
{
  "practice_session": {
    "instrument": "piano",
    "duration_minutes": 30,
    "notes": "Worked on scales and Fur Elise",
    "practiced_at": "2026-03-10T15:00:00Z"
  }
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "practice_session",
    "attributes": {
      "instrument": "piano",
      "duration_minutes": 30,
      "notes": "Worked on scales and Fur Elise",
      "practiced_at": "2026-03-10T15:00:00Z",
      "created_at": "2026-03-10T15:30:00Z"
    }
  }
}
```

**Error Responses:**
- 401: `{ "error": "You need to sign in or sign up before continuing." }`
- 422: `{ "error": "Duration must be greater than 0" }`

### Endpoint: GET /api/v1/students/practice_sessions

**Auth:** authenticate_student! (own data) OR authenticate_user! + parent/teacher role (student's data)
**Params:** ?start_date=2026-03-01&end_date=2026-03-10&page=1

**Success Response (200):**
```json
{
  "data": [...],
  "meta": {
    "total_count": 15,
    "total_pages": 2,
    "current_page": 1,
    "total_minutes_in_range": 450
  }
}
```

## Business Rules
1. Students can only log practice for themselves (enforce via authenticate_student!)
2. Parents can view practice for their guardianship students only
3. Teachers can view practice for students they have active bookings with
4. Duration must be 1-480 minutes (8 hours max)
5. practiced_at cannot be in the future
6. practiced_at cannot be more than 30 days in the past

## Data Model Changes
- New table: practice_sessions (id: uuid, student_id: uuid FK, instrument: string, duration_minutes: integer, notes: text, practiced_at: datetime, archived_at: datetime, timestamps)
- Indexes: student_id, practiced_at, [student_id, practiced_at] composite
- Association: Student has_many :practice_sessions

## Edge Cases
- Student logs practice for instrument they don't play (allow — instruments change)
- Duplicate entries (same student, same practiced_at within 1 minute — reject)
- Timezone handling (store UTC, display in student's time_zone)

## Non-Functional Requirements
- Response time: < 200ms for list endpoint (paginated)
- Rate limit: 60 requests/minute per student
- COPPA: practice data is student PII — minimize, no sharing beyond parent+teacher

## Out of Scope
- Practice reminders/notifications
- Practice streaks/gamification
- Audio/video recording
- AI practice analysis

## Success Metrics
- Students log 3+ sessions/week within 30 days of launch
- Teachers view practice data before 50%+ of lessons
```
