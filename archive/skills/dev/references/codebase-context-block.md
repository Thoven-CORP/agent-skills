# Thoven Codebase Context Block

Include this context in subagent prompts that need codebase awareness.

```
CODEBASE CONTEXT:
- Rails 7.2.2 API-only backend (Thoven — music education platform)
- Dual auth: Users (parents/teachers/admins via Devise JWT) vs Students (separate Devise model) — NEVER mix
- Profile types: integers (ADMIN=1, PARENT=2, TEACHER=3) — use .teacher? helpers, NOT string comparison
- Soft deletes via archived_at — filter with where(archived_at: nil) or .active scope
- UUIDs on all tables
- Service layer in app/services/ (65 service classes) — result pattern: { success: true/false, data/error: ... }
- Serializers: JSONAPI::Serializer
- Background jobs: Solid Queue (database-backed)
- Check .claude/docs/ARCHITECTURE.md for schema (101 tables, 6 extensions)
- Check .claude/docs/COMMON_ERRORS.md for known pitfalls
- Check .claude/docs/API_ROUTES.md for existing routes (~529 routes)
- Safe navigation required: always use &. and || default — production data has nils
```
