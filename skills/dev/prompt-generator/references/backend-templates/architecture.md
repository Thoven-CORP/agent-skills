# Architecture Prompt Template

Use for: "design", "architect", "schema", "system design"

## Template Structure

```
Goal: [System/feature to design — one sentence]

Context:
- Existing stack: Rails 7.2 API-only, PostgreSQL (UUIDs), Redis caching, Solid Queue
- Current schema: [relevant existing tables from .claude/docs/ARCHITECTURE.md]
- Related code: [existing services/models that interact with this]

Constraints:
- All tables use UUIDs (id: :uuid)
- Soft deletes via archived_at where applicable
- Sub-200ms API response time target
- COPPA compliant for student-facing features
- Dual auth system (Users vs Students — never cross)
- Must work with existing JSONAPI::Serializer pattern

Design Options:
A) [Approach A — brief description]
B) [Approach B — brief description]
C) [Approach C — brief description]

Evaluate Each On:
- Query performance at scale (1000+ records)
- Migration complexity and reversibility
- Impact on existing models/associations
- Cache invalidation complexity
- Background job requirements
- API response shape compatibility

Non-Goals:
- [What this design explicitly does NOT cover]

Output Expected:
- Schema design (tables, columns, indexes, constraints)
- Service layer design (which services, what each does)
- API endpoint design (routes, request/response shapes)
- Migration plan (order of operations, backfill strategy)
- Testing strategy (what to test at each layer)
```

## Example: Design Student Practice Tracking System

```
Goal: Design data architecture for tracking student practice sessions

Context:
- Existing stack: Rails 7.2 API-only, PostgreSQL (UUIDs), Redis, Solid Queue
- Related models: Student (app/models/student.rb), Booking (app/models/booking.rb), Profile (teacher)
- Student auth: separate Devise model (authenticate_student!)
- Existing patterns: see booking.rb for enum, scopes, callbacks pattern

Constraints:
- All tables use UUIDs
- COPPA compliant — practice data is student PII, minimize collection
- Must support offline-first (frontend posts batch data)
- Sub-200ms for practice summary endpoints
- Soft deletes on practice sessions (archived_at)

Design Options:
A) Normalized relational — practice_sessions table + practice_metrics table (one row per session)
B) Event-sourced — practice_events table (one row per event: start, pause, resume, stop)
C) Hybrid — practice_sessions table with JSONB metadata column for flexible event data

Evaluate Each On:
- Query performance for "total practice this week" aggregations
- Migration complexity (new tables vs JSONB flexibility)
- Impact on Student model (new associations)
- Cache invalidation (Redis summary cache keyed by student_id + date range)
- Background job needs (daily/weekly summary rollups via Solid Queue)
- API shape for batch upload from offline-first frontend

Non-Goals:
- Real-time multiplayer practice
- Audio/video storage
- ML-based practice quality analysis
- Gamification (separate feature)

Output Expected:
- Schema: tables with columns, types, indexes, CHECK constraints
- Models: associations, validations, scopes, enums
- Services: PracticeSessionService (create/batch_create), PracticeSummaryService (aggregations)
- Endpoints: POST /api/v1/students/practice_sessions (batch), GET /api/v1/students/practice_sessions/summary
- Migration plan: create tables → add indexes → backfill if needed
- Caching: Redis keys, TTL, invalidation triggers
- Testing: model specs, service specs, request specs with time-travel for date ranges
```
