# Rails check reference

The Rails half of `/security-review`, for `~/thoven/backend`. Read it whole before Step 4, or hand it
whole to the `general-purpose` agent that runs Step 4.

The leading word is **reachable**. A finding is a path a real request, socket frame, webhook or
job run can take to break a security property. A code smell with no reachable path is not a finding.

The backend: Rails 7.2.3, API-only, schema in `db/structure.sql`. Devise 4.9.4 plus devise-jwt 0.12.1
with `JTIMatcher` on both Devise scopes, `User` (parents, teachers, admins through `Profile`) and
`Student`. Jobs run on solid_queue. rack-attack is the only abuse limiter; there is no pundit or
cancancan, so every authorization check is hand-written in the controller or its scope. Soft delete
comes in two forms: `deleted_at` with `not_deleted` (`TeacherClass`, `LessonPackage`) and
`archived_at` with `.active` or `archive!` (`Student`, `Enrollment`, `HomeworkSubmission`,
`TeacherReview`). A user-visible read honours whichever one the model carries.

Every step runs a command and ends on a **Done when**. Work from the backend repo root.

## 1. Map the diff

```bash
git diff --name-only <base>...HEAD -- app config/routes.rb config/initializers/rack_attack.rb
```

Put every changed file under a branch: **controller/route**, **serializer**, **channel**,
**webhook**, **job**, **auth**. A model, service or concern goes under the branch that reaches it:
find its callers with `rg -n '<ClassName>' app` and take their branches. A file reached from two
branches goes under both.

**Done when:** every changed file under `app/` sits under at least one branch.

## 2. Scanners

```bash
bin/brakeman -q --format json
bundle-audit check --update
```

Triage every Brakeman warning and every advisory: a finding with its reachable path, or a one-line
reason it is unreachable.

**Done when:** no warning or advisory is left without a verdict.

## 3. Allowlists

These greps run over all of `app/`, whatever the diff. Each list below is the state of
`origin/feature/teacher-2.0` on 2026-09-29, as `path:count` from `rg -c … | sort`. A new path, or a
count above the one listed, is a finding until the new site is reviewed and the list is updated in
the same commit.

**Hand-rolled JWT decode.** Devise decodes tokens for controllers; any other decode is a second auth
path that has to repeat the JTI check itself.

```bash
rg -c 'JWT\.decode' app | sort
```

```
app/channels/application_cable/connection.rb:1
app/controllers/api/v1/auth/sessions_controller.rb:2
app/controllers/api/v1/auth/teacher_registrations_controller.rb:1
app/controllers/api/v1/bug_reports_controller.rb:1
app/services/teacher_password_setup_token.rb:2
```

`app/services/teacher_password_setup_token.rb` holds two comments explaining why that token is not a JWT; it has
no call.

**Student auth definitions.** The canonical one is the concern; the second is a local override that
also requires `can_access_student_portal?`.

```bash
rg -c 'def authenticate_student!' app | sort
```

```
app/controllers/api/v1/students/settings_controller.rb:1
app/controllers/concerns/student_authenticatable.rb:1
```

**Mass assignment.**

```bash
rg -n 'permit!' app
```

Expected: no output.

**Interpolated SQL.** Each listed hit interpolates a constant, a literal column name, a model's
`table_name`, a `connection.quote`d value, or a string passed as a bind value after `?`. None
interpolates a request param into the SQL fragment.

```bash
rg -c '(where|order|execute|find_by_sql)\(.*#\{' app | sort
```

```
app/controllers/api/v1/admin/microschool_leads_controller.rb:1
app/controllers/api/v1/teacher_finder_controller.rb:2
app/controllers/concerns/cursor_pagination.rb:1
app/controllers/webhooks/daily_controller.rb:2
app/jobs/refresh_analytics_views_job.rb:3
app/jobs/teacher_onboarding_sequence_job.rb:1
app/models/profile.rb:1
app/services/admin/dashboard_metrics_query.rb:6
app/services/analytics/class_activity_query.rb:4
app/services/analytics/ops_strip_query.rb:1
app/services/analytics/weekly_usage_outlook_query.rb:1
app/services/launch_email/teacher_drop.rb:3
app/services/messaging/conversation_setup.rb:2
app/services/messaging/family.rb:1
app/services/messaging/keyword/approve.rb:1
app/services/purchase_requests/management_query.rb:2
app/services/teach_mode/prod_ui_cleanup_service.rb:1
app/services/teach_mode/prod_ui_prep_service.rb:1
app/services/teach_mode/prod_ui_verify_service.rb:1
```

For a new hit, trace the interpolated value to its source. If a caller can reach it from `params`,
it is a finding.

**Done when:** all four outputs match their lists, or every difference is a finding or a reviewed
site added to the list.

## 4. Branches

Run the checks for each branch the map in step 1 produced.

### Controller/route

1. For each changed controller:

   ```bash
   rg -n '\.find(_by)?\(params' <controller>
   ```

   Each hit is scoped through `current_user`, `current_student` or an ownership association
   (a parent reaches a student through guardianships), or carries a written reason it is safe.
   An unscoped lookup a caller can reach with another account's id is an IDOR finding. A body param
   that stands in for `current_user` or `current_student` is a finding.
2. For each route added in `config/routes.rb`, look for its path in
   `config/initializers/rack_attack.rb` and for `rate_limit` in its controller. The `global/ip`
   throttle does not count: it is off while `CACHE_QUOTA_MODE` is `free`, the default. A new route
   with neither is a finding. Rails 7.2 has `rate_limit`, so a controller-level limit is the smaller
   fix when rack-attack is a poor fit.

**Done when:** every `find` hit in a changed controller is scoped or justified, and every new route
has a throttle or `rate_limit`.

### Serializer

1. A changed serializer needs a spec asserting the exact key set of the real payload, for example
   `expect(payload.keys).to contain_exactly(...)` on the serializer's output. A hand-built fixture
   hash, or `not_to include`, passes while a new key leaks. Student-facing payloads carry no
   device ids, IP addresses, geolocation or guardian contact data.
2. Active Storage: production resolves blobs through `rails_storage_proxy`
   (`config/environments/production.rb`). A new URL is proxied, and states its expiry: a signed
   preview URL carries one (`FilePreviewUrlService` issues 30 minutes); a URL that deliberately never
   expires says so in the serializer, as `FileBlobSerializer` does.

   ```bash
   rg -n 'rails_blob_url|rails_representation_url|\.url\(|expires_in' <serializer and its callers>
   ```

**Done when:** every changed serializer has an exact-key-set spec and every URL it emits has a
stated expiry and goes through the proxy.

### Channel

`ApplicationCable::Connection` authenticates `?token=` (or the encrypted `jwt_token` cookie), decodes
it by hand, and rejects the socket unless the record's `jti` matches the token's. Archived students
are filtered out.

```bash
rg -n 'jti|reject_unauthorized_connection|archived_at' app/channels/application_cable/connection.rb
rg -n 'def subscribed' -A15 <changed channel>
```

A change that drops the JTI comparison lets a revoked token reconnect. A channel that streams
without checking the subscriber's ownership of the class, conversation or student is a finding.

**Done when:** the connection still compares `jti` for both scopes, and each changed channel checks
ownership before `stream_from` or `stream_for`.

### Webhook

The controllers in `app/controllers/webhooks/` are `daily`, `sendgrid`, `stripe`, `twilio` and
`twilio_conversations`. Each skips CSRF and must verify its vendor signature before any work: before
parsing the body into records, enqueueing a job, or writing.

```bash
rg -n 'before_action|construct_event|verify_\w+_signature|perform_later|JSON\.parse' app/controllers/webhooks/<changed>.rb
```

**Done when:** in each changed webhook controller the signature check runs on every action, ahead
of the first parse, write or `perform_later`.

### Job

solid_queue persists `perform_later` arguments in its database tables, so an argument is stored data.

```bash
rg -n 'perform_later\(' <changed files>
```

Pass ids and look the record up inside `perform`. A name, email, phone number, date of birth, token
or raw vendor payload carrying any of those, passed as an argument, is a finding.

**Done when:** every `perform_later` in the diff passes ids or non-personal values only.

### Auth

For a change to a Devise controller, a `JWT.decode` site, `StudentAuthenticatable`, or anything that
sets `current_user` or `current_student`:

- A token issued for one scope never authenticates the other: a `User` token never reaches a
  student endpoint and a `Student` token never reaches a user endpoint.
- Every decode site verifies `HS256` with the Devise secret and compares `jti`.
- Student endpoints use `authenticate_student!`. User endpoints use `authenticate_user!`.
- Sensitive fields added to a model are in `config/initializers/filter_parameter_logging.rb`.

**Done when:** each point is confirmed against the changed code.

## Evidence standard

Every finding carries:

- Exact file and line.
- The reachable path: the request, frame, webhook or job run, and who can send it.
- The security property violated.
- A concrete fix, and a deterministic spec that would close it.

## Completion

Done when every changed file under `app/` is mapped to a branch in step 1, and every branch that
mapping produced has reached its Done when.
