# Prod snapshot — scoped extract → neutralize → thoven_qa → isolated harness

The Setup phase for a realistic bug reproduction. Produces a local `thoven_qa` database seeded with **neutralized real production rows** and a running backend the FE can talk to. Backend repo: `/Users/andresmartinez/thoven/backend`.

The pipeline: **build a scoped extractor → human runs the prod `pg_dump` into a local scratch DB → extract a neutralized scoped seed → load into `thoven_qa` → set uniform creds → start the isolated backend.** You do everything except the prod read.

## The two safety gates (non-negotiable)

1. **The live prod read is human-triggered.** The extractor refuses to run unless the resolved DB host is `localhost`/`127.0.0.1`/`::1` **and** doesn't match `PROD_DATABASE_URL`'s host — `QaSnapshot.assert_safe_database!`, no bypass flag. Reaching prod is a separate human-run `pg_dump` → local-restore step. You build and validate the extractor against local/scratch; a human authorizes the actual production read.
2. **Ambiguous data picks STOP and ask.** Real seed data collides on name in three distinct ways, all present live: **four parents share one display name**; **one name belongs to both a Teacher and a Parent**; and **one teacher's full name is a prefix of another's** (a "Kim Lee" / "Kimberly Lee" shape — a substring match silently picks the wrong human). Disambiguate by following actual rows (which account owns the reschedule/enrollment you care about), and when it's still ambiguous, surface the candidates and ask — never guess which real person.

## Step 1 — Scope the graph (what to pull)

Walk the seed users' relationship graph in dependency order. Two tiers:

- **Owner-scoped** (only the seed users' own rows): guardianships, teacher availabilities/templates/windows, time-off blocks, notifications, favorites, reviews.
- **Relationship-scoped** (seed user on either side; the counterparty gets a bare **stub** row for FK integrity, never their own sub-graph): teacher_classes, enrollments, invite links, materials, homework + submissions, sessions, wallet_entries, simple_booking_requests + slots + reschedule_requests, attendances, google_calendar_integrations + event mappings, live_lessons.

Deliberately exclude money-adjacent tables (credit_accounts, credit_transactions, bundle_purchases, payment_methods, Stripe fields) — **except** `wallet_entries`, which a check constraint (`check_intro_call_no_wallet` makes `wallet_entry_id` NOT NULL for intro-call bookings) forces you to include; it carries only credit counters, no PII.

## Step 2 — Neutralize outbound contact (at EXTRACT time, every row, every table)

So an automated run physically cannot reach a real user:

| Column(s) | Neutralized to |
|---|---|
| `users.email`, `profiles.email`, `students.email`, `google_calendar_integrations.google_email` | deterministic `qa+<hash>@qatest.thoven.test` alias |
| `profiles.phone_number`, `profiles.phone_e164` | fixed `+15555550100` |
| `users.encrypted_password`, `students.encrypted_password` | blanked to `""` (NOT null — `NOT NULL DEFAULT ''`; blank = "no password set" to Devise) |
| `*.reset_password_token`, `*.unlock_token` | nulled |
| `*.jti` | regenerated |
| gcal `google_access_token`/`refresh_token`/`webhook_*` | nulled, `is_active` forced `false` |

Belt-and-suspenders: the loader inserts via **raw SQL `INSERT ... ON CONFLICT (id) DO UPDATE`**, never `Model.create!`, so AR callbacks that send mail (homework-assignment notify, reschedule notification) have no object lifecycle to fire on. Idempotent — re-running `load` on the same file is a no-op re-apply.

## Step 3 — Human runs the prod pull into a local scratch DB

The human runs this (the only thing that touches `PROD_DATABASE_URL`, read-only):

```bash
createdb thoven_prod_snapshot
pg_dump "$PROD_DATABASE_URL" --no-owner --format=custom --file=/tmp/prod_snapshot.dump
pg_restore --no-owner -d thoven_prod_snapshot /tmp/prod_snapshot.dump
```

**Gotcha:** the restore can fail on check constraints over now-past data — real case: `check_proposed_date_not_past` on `simple_booking_reschedule_requests` (rows whose `proposed_date` is now in the past). **Drop that constraint in the scratch DB ONLY** and reload those rows — never touch prod, never touch dev.

## Step 4 — Extract the neutralized scoped seed

Point the extractor at the **local restored copy** (still passes the localhost guard — it's local Postgres, just seeded from a prod dump):

```bash
DATABASE_URL="postgresql://localhost/thoven_prod_snapshot" \
  bundle exec rake qa_snapshot:extract EMAILS="a@x,b@y,c@z"
```

Writes a gitignored neutralized JSON to `db/seeds/qa_snapshot/output/<ts>_qa_snapshot.json`. Assemble the EMAILS list from **SQL against the scratch DB** (e.g. all parents enrolled in the target teacher's classes), not by transcribing names — that's how you avoid the name-collision trap.

## Step 5 — Load into thoven_qa (not dev)

Clone dev as the base, then load the snapshot on top:

```bash
createdb thoven_qa
pg_dump --no-owner --no-privileges thoven_development | psql thoven_qa
# drop check_proposed_date_not_past in thoven_qa too, so past-date rows load
bundle exec rake qa_snapshot:load FILE=db/seeds/qa_snapshot/output/<ts>_qa_snapshot.json
```

**Gotcha:** `ON CONFLICT (id)` can't catch a *different-column* unique index. Real case: `idx_live_lessons_unique_open_slot` (partial unique on `simple_booking_slot_id WHERE status IN (0,1)`) — the dev-clone base data already held an open live_lesson on a slot the snapshot re-owns under a different id, so the whole txn rolled back. Fix: delete the conflicting stale base rows (+ their children) in `thoven_qa` only, keeping the index intact, then reload.

## Step 6 — Uniform creds (raw SQL, callback-free)

- **Parents + teachers:** shared password **`QAtestPass123!`** — `UPDATE users SET encrypted_password = '<bcrypt cost 12>' WHERE email LIKE 'qa+%@qatest.thoven.test';`
- **Students:** passcode **`123456`** — `UPDATE student_credentials SET passcode_digest = '<bcrypt>' WHERE student_id IN (...)`. Note only students with `allow_student_login=true` **and** a completed onboarding pass `can_access_student_portal?` — the passcode authenticates at the credential layer but the portal gate is upstream.

## Step 7 — Start the isolated harness (the CORS gotcha)

**The BE CORS allowlist is `:3000` / `:5173` / `:5000` only.** So the **FE must run on an allowed origin (`:3000`)** while the QA **BE stays isolated on `:3002`** (pointed at `thoven_qa`, away from your normal `:3001` dev backend). Point the FE at `:3002`.

Isolation needs **three** axes, not two — port, database, **and pidfile**. The Rails pidfile is a
per-directory singleton (`tmp/pids/server.pid`), *not* per-port, so `-p 3002` alone still collides
with the dev server running out of the same checkout and dies with `A server is already running
(pid: NNNNN)`. That error reads like a stale pidfile; it usually isn't. **Check whether the pid is
live (`ps -p NNNNN`) before killing anything** — it is very likely the dev backend on `:3001` that
you want to keep running.

Start the BE single-mode (dodges the macOS `objc fork()` crash and the stale-secret problem — no
forked worker to go stale):

```bash
OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES \
WEB_CONCURRENCY=0 \
RAILS_MAX_THREADS=5 \
DATABASE_URL="postgresql://localhost/thoven_qa" \
RAILS_ENV=development \
bin/rails s -b 0.0.0.0 -p 3002 --pid tmp/pids/server-qa.pid
```

Login sanity: `POST http://localhost:3002/api/v1/auth/login` `{email, password: "QAtestPass123!"}`; student `POST /api/v1/students/auth/login` `{username, passcode: "123456"}`.

## Step 8 — Destroy the full-PII scratch DB

Once the neutralized seed is in `thoven_qa`, minimize PII: `dropdb thoven_prod_snapshot` and `rm -f /tmp/prod_snapshot.dump`. Persisted artifacts should be only `thoven_qa` + the gitignored neutralized JSON. Leave `thoven_development` untouched.

---

## Worked example — the reschedule live-vs-expired A/B

**Bug:** an *expired* teacher-reschedule request still showed the parent actionable Approve/Decline buttons; it should be refresh-only.

**Why a snapshot, not a seed:** the broken state is a `simple_booking_reschedule_requests` row that is `status: pending` yet already past `expires_at` — reachable in real data (a background job hadn't flipped it yet) but awkward to fabricate against the model's validations. Real rows gave us both arms of the A/B for free.

**Setup:** pulled a scoped snapshot around three real teachers (**Teacher A**, **Teacher B**, **Teacher C**) plus the 11 parents enrolled in Teacher A's classes (14 neutralized seeds). Two reschedule rows carried the test:
- **LIVE-pending** — Parent A ↔ Teacher A, `expires_at` in the future.
- **EXPIRED** — Parent B ↔ Teacher B, `status: expired`, past expiry.

**Execute (A/B on the teacher Notifications surface, real UI login):**
- Teacher A (live reschedule from Parent A): Approve/Decline **present** → actionable ✓
- Teacher B (expired reschedule from Parent B): **no** Approve/Decline, only Delete → non-actionable ✓

Result: the fix confirmed dead on real data across both arms. The exact expected value was "no Approve/Decline button present," not "the buttons look disabled."
