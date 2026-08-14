# Audit Prompt Template

Use for: "audit", "review", "N+1", "security", "performance"

## Template Structure

```
Audit Goal: [What to audit and why — one sentence]

Scope:
- Files/directories: [specific paths to audit]
- Models/tables: [specific models if DB audit]
- Endpoints: [specific routes if API audit]

Audit Type: [N+1 | Security | Performance | Code Quality | Mixed]

Standards/Criteria:
- [Standard 1 — e.g. "No N+1 queries in controller actions"]
- [Standard 2 — e.g. "All endpoints require authentication"]
- [Standard 3 — e.g. "No raw SQL with string interpolation"]

Severity Levels:
- Critical: Blocks users, data loss, security breach
- High: Performance degradation, auth bypass potential
- Medium: Code smell, missing index, non-standard pattern
- Low: Style issue, minor optimization opportunity

Output Format:
| Severity | Location | Issue | Standard | Recommendation |
|----------|----------|-------|----------|----------------|
| Critical | file:line | Description | Which standard | How to fix |

Exclusions:
- [Files/patterns to skip]
- [Known issues already tracked in TECH_DEBT.md]

Context Files to Reference:
- .claude/docs/COMMON_ERRORS.md (known pitfalls)
- .claude/docs/ARCHITECTURE.md (schema constraints)
- TECH_DEBT.md (already-tracked issues)
```

## Example: N+1 Query Audit on Parent Dashboard Endpoints

```
Audit Goal: Identify and fix N+1 queries in parent-facing API endpoints

Scope:
- Controllers: app/controllers/api/v1/parents/ (all controllers)
- Serializers: app/serializers/ (all serializers used by parent endpoints)
- Models: Booking, Student, Profile, BundlePurchase, BundleCreditBalance

Audit Type: N+1 Performance

Standards:
- Every controller index action must use .includes() for serialized associations
- No database queries triggered inside serializer attribute blocks
- Collection endpoints must not exceed 5 SQL queries regardless of result count
- belongs_to associations in serializers must be eager-loaded

Severity Levels:
- Critical: N+1 on index endpoints (scales linearly with data)
- High: N+1 on show endpoints with nested includes
- Medium: Missing index on frequently-queried column
- Low: Unnecessary eager loading (includes on unused association)

Output Format:
| Severity | Location | Issue | Query Count | Recommendation |
|----------|----------|-------|-------------|----------------|
| Critical | parents/bookings_controller.rb:10 | index lacks .includes(:student) | N+1 per booking | Add .includes(:student, :teacher_profile) |

Exclusions:
- Admin controllers (low traffic, not user-facing)
- Single-record lookups (show actions with no nested serialization)

Context:
- BookingSerializer (app/serializers/booking_serializer.rb) accesses student.email, teacher_profile.email — these MUST be eager-loaded
- Existing includes pattern: see bookings_controller.rb:11 (.includes(:teacher_profile, :bundle_purchase))
- Check .claude/docs/COMMON_ERRORS.md for known N+1 issues
```

## Example: Security Audit on Authentication Endpoints

```
Audit Goal: Verify authentication and authorization security across all API endpoints

Scope:
- All controllers in app/controllers/api/v1/
- Auth config: config/initializers/devise.rb, app/models/user.rb, app/models/student.rb
- Route config: config/routes.rb

Audit Type: Security

Standards:
- Every non-public endpoint must have authenticate_user! or authenticate_student!
- Parent endpoints must have ensure_parent_profile + ensure_student_belongs_to_parent
- Teacher endpoints must verify profile.teacher?
- Admin endpoints must verify profile.admin?
- No mixing of User auth and Student auth in same controller
- JWT tokens must have expiry (7 days max)
- Password reset tokens must be single-use

Severity Levels:
- Critical: Missing authentication, cross-tenant data access, auth bypass
- High: Missing role check, JWT without expiry, IDOR vulnerability
- Medium: Overly permissive strong params, missing rate limiting
- Low: Inconsistent error messages leaking info

Output Format:
| Severity | Location | Issue | OWASP Category | Recommendation |
|----------|----------|-------|----------------|----------------|

Context:
- Dual auth: Users (Devise+JWT) vs Students (separate Devise) — NEVER mix
- Profile types: ADMIN=1, PARENT=2, TEACHER=3 — use helper methods, NOT string comparison
- See .claude/docs/COMMON_ERRORS.md for auth-related known bugs
- Rack::Attack configured for rate limiting (config/initializers/rack_attack.rb)
```
