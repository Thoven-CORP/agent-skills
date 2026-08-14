# Standing checklist — the dogfood run (user-action testing, two-student, two-arc)

Golden rules: `SKILL.md` + `conventions.md`. **No marketplace** (teacher private/unpublished — fine).

## Framing (set 2026-06-23 via /brainstorm — READ FIRST)
**Test user actions and what the user SEES — not DB writes.** The observable outcome is the verdict; the psql monitor is the **lie-detector** behind it (catches "UI said it worked but no row written"). BOOK+APPROVE are **one flow** ("request → approve → the scheduled lesson now appears"), not two checks.

**Execution model:** Claude opens **kimi-webbridge**; **Andres drives** the UI; **Claude runs the monitors** (re-pulls a psql snapshot of `enrollments · wallet_entries · simple_booking_slots · live_lessons · google_calendar_event_mappings` after each click). **One scenario at a time**, Andres gives ✅/⚠️/❌, deep per feature (multiple scenarios), not a single happy-path sweep.

**Two students = two archetypes:** Student 1 (existing `29e3b82b…`, "Andres Martinez") = free **Odyssey** user; Student 2 (created during run) = paying **Stripe** user.

## TWO ARCS (sequencing)
- **Arc 1 — testable NOW, no Stripe Connect needed.** Booking/teach/cancel run on wallet credits; Odyssey is a free admin grant. Covers: foundation (class·availability·GCal·enroll both·Odyssey-load S1) + Student-1 full journey (book/approve/teach/reschedule/cancel).
- **Arc 2 — GATED on teacher Stripe Connect onboarding (gate A4).** Only the **purchase** path needs `transfer_data:{destination: teacher.stripe_account_id}`. Covers: Student-2 **purchase + Summer Academy discount + teacher subsidy**.
- **Plan:** run Arc 1 first; schedule Arc 2 after A4 onboarding is done. Don't let the KYC gate stall the whole dogfood.

## Household (logins + IDs)
| Actor | Login | DB id |
|---|---|---|
| Teacher | `dogfood-teacher@test.thoven.co` / `@June282002` | profile `bb8bbaa2-4ea7-45f8-a517-cbef9523505b` · user `4f8e9626-a847-48d3-ae5a-d48baaca306a` |
| Parent | `dogfood-parent@test.thoven.co` / `@Password123` | profile `12605868-4213-461c-bdb4-21d5c2657a70` · user `9ba5e255-426b-46bc-95b1-e7c1b766306a` |
| Student 1 | nav → Student → username+PIN *(capture)* | `29e3b82b-d0ad-4d19-8d60-ff234d7a5bb8` |
| Student 2 | *(create in flow 2; capture id+username+PIN)* | — |
| Packages (teacher) | Beginner $25 / Intermediate $50 — both 10×**30-min**, active, not marketplace-visible |
Monitor harness: `set -a && source ~/thoven/backend/.env && set +a && psql "$PROD_DATABASE_URL" -X -c "…"` (SELECT only). **30-min throughout** (credits are duration-keyed).

## GATES (foundation)
- **A1** Teacher creates class → shareable **code** + invite link.
- **A2** Teacher sets **30-min** availability (a slot ≥12h out for booking, one ≥24h out for cancel-refund); `discovery`=available.
- **A3** Teacher connects **Google Calendar** (OAuth) ⟵ **ANDRES HANDS**. *(If skipped → calendar asserts N/A, don't block.)*
- **A4** Teacher connects **Stripe (Connect onboarding)** ⟵ **ANDRES HANDS, FINANCIAL/KYC.** Predicate `stripe_connected?` = `stripe_onboarding_complete && stripe_charges_enabled && stripe_payouts_enabled` (`profile.rb:880`). **Gates Arc 2 (purchase) ONLY.**
- **A5** **Wallet at baseline.** `available_credits` (= `lessons_remaining - credits_reserved`) must cover every approval the run will make. `SimpleBookingRequest after_create :reserve_credits` reserves on create and only approve/decline release, so aborted runs orphan reservations. Run `bundle exec rake dogfood:reset_household` (gate `DOGFOOD_RESET_CONFIRM=1`; preview with `DOGFOOD_RESET_DRYRUN=1`) to restore `10/0` non-destructively. **30-day cadence, and before any run needing >3 approvals.**
- **A6** **Contract-removal sweep** *(part of the Go/No-Go gate, not optional)*. BE v2.26.0 deleted the dead `students/wallet` controller + routes (`dd-k7903`, `dd-jium2`). Visit the student dashboard surfaces as S1 and assert **zero 410/5xx**, reported as an exact integer count — never "no errors seen."

---

## THE 6 USER-ACTION FLOWS (PASS = what the user sees · Corroborate = psql)

### 1 · Create a class  *(teacher · Arc 1)*
- **Does:** creates a class → gets join code + invite link. **Sees(PASS):** class in their list with a shareable code/link.
- **Corroborate:** `teacher_classes` row, non-blank `code`, `deleted_at` null.

### 2 · Enroll a student  *(parent · Arc 1)* — classes are **1:1**, each student = its OWN class
- **Does:** Student 1 via **code** (class A), Student 2 via **invite link** (create a 2nd class B) → pick/create student → accept SMS disclosure. **Sees(PASS):** student shows enrolled in parent dashboard **and** teacher roster.
- **Branch (free):** the two enroll paths = code (S1) + invite-link (S2). `enrolled_via` enum: **code=0, invite_link=1, intro_call_followup=2**.
- **Corroborate:** `enrollments.enrollment_status=1 (active)` + `enrolled_via` 0/1; parent `sms_consent_enabled=t` (auto, since `phone_e164` set — NO phone gate); `teacher_classes.student_id` bound (1:1).

### 2.5 · Create the student dashboard (login)  *(parent · Arc 1)* — ⚠️ REQUIRED before Teach Mode + HW, EASILY FORGOTTEN
- **Does:** parent provisions each student's **login/dashboard** (username + passcode). This is the step a real parent (and this dogfood) silently skips; it **gates Teach Mode student login (Flow 5) and HW submission.** Being addressed by the parent-onboarding sprint `td-2o3q0` (enforceable mandatory student-dashboard gate) — **tag learnings there.**
- **Sees(PASS):** student can log in; dashboard renders.
- **Corroborate:** `student_credentials` row (`username`, `is_active=t`) + `students.can_login=t` per student. **Pre-creation tell: `can_login=f` + no `student_credentials` row → the student CANNOT join a live lesson.**

### 3 · Get lessons  *(two paths)*
- **3a Odyssey (free · S1 · Arc 1):** admin `/admin/odyssey-tools` grants Beginner pkg → **Sees(PASS):** parent balance shows 10 lessons for that teacher. **Corroborate:** `wallet_entries.lessons_remaining=10, credits_reserved=0`. ⚠️ **There is no `available` column** — `available_credits` (= `lessons_remaining - credits_reserved`) is a model method (`wallet_entry.rb:111`). A monitor query selecting `available` throws, and the run's async tri-state would misread the error as "no row written."
- **3b Purchase + Summer Academy $25-off (paid · S2 · Arc 2, needs A4):** NO coupon, NO `/summer-academy` page — the $25 auto-created at registration & **auto-applies to the parent's FIRST package purchase** (dogfood parent verified eligible: signup `33ecd237…`, $25 fixed, `discount_used=f`). **BUY THE $50 INTERMEDIATE PACKAGE, NOT $25 BEGINNER** — $25−$25=$0 short-circuits & **skips Stripe entirely** (`purchase_request.rb:150-153`, no PaymentIntent); $50−$25=**$25 real charge**. **Does:** parent → `/parent/purchasing` → teacher/S2/**$50** pkg → confirmation **shows FULL $50, no discount line** (in-app discount UI flag-OFF in prod, `isLeadMagnetAbTestUiEnabled()` hardcoded false — **⚠️ UNCONFIRMED — FE investigation `td-3r6t0`: a backend-side read suggested the parent sees full price while the card is charged $25 less, but this is UNVERIFIED by FE and disputed; dogfood gathers first-hand evidence (compare displayed Total vs actual Stripe charge)**) → Send Purchase Request → teacher approves. **Sees(PASS) — discount is INVISIBLE in-app, verify in STRIPE:** parent's actual charge/hold = **$25 not $50** (also `create_request` response `payment_hold_amount_cents=2500`); teacher receives **$50 total** = $25 captured + **$25 subsidy Transfer** (Connect→Transfers, not Payments); S2 credits land. **Corroborate:** `purchase_requests.lead_magnet_discount_applied=t`, `lead_magnet_discount_amount=25`, `final_price_cents=2500`; `lead_magnet_signups.discount_used` flips `t` (**single-use** — `dogfood:reset_household` must reset it). Platform fee 0% (waiver→Apr 2027), so platform absorbs exactly $25.

### 4 · Book a lesson  *(parent→teacher, ONE flow · Arc 1)*
- **Does:** parent requests a lesson at a time → teacher reviews & approves. **Sees(PASS):** pending → parent "pending", teacher "request to review"; after approve **the scheduled lesson now appears** on parent upcoming + teacher schedule + student dashboard + teacher Google Calendar; parent available balance −1.
- **Branch ① insufficient lessons (FREE — test in the gap before 3a):** parent tries to request with 0 lessons → blocked "need lessons", no request.
- **Branch ② too soon (<12h):** parent tries a time <12h out → blocked with the 12-hour message, no request.
- **⏰ Timezone display (dd-bwgw1 regression guard · standing as of FE v2.15.1 / BE v2.25.0):** the booked **wall-clock** time must render **as-booked in the viewer's device zone**, never −4h. Book a known ET time (e.g. **9:00 AM**) → assert it shows **9:00 AM EDT (not 5:00 AM)** on: parent upcoming-lesson card, teacher upcoming card, and the **teacher "Manage Lesson Location" modal** time line. Root cause was BE storing paid-slot naive wall-clock as UTC (fixed by `slot_at`/`SlotTimeFrame` in BE v2.25.0 + `slot_tz:backfill`); FE v2.15.1 renders the corrected instant via `formatLessonDay`/`formatLessonTime`. **Verified 2026-06-29:** parent card showed `Jun 29, 2026 - 9:00 AM EDT` for the 09:00 slot ✅ (teacher-side modal/card deferred to e2e that run — past lesson).
- **Corroborate:** slot 0(pending)→1(approved); wallet `credits_reserved+1` then `lessons_remaining−1 & credits_reserved−1`; `location_url` non-null + `live_lessons`(scheduled) + calendar mapping (all async ~60-90s).

### 5 · Teach the lesson  *(teacher+student · S1 · Arc 1)* ⟵ **ANDRES HANDS**
- **Does:** teacher Start → student logs in (username+PIN) & joins → video both ways + whiteboard syncs → teacher End. **Sees(PASS):** both connect & see each other; a stroke **crosses**; lesson ends, shows **completed**.
- **Branch:** student refreshes/drops mid-lesson → **rejoins** same live lesson.
- **Corroborate:** `live_lessons` scheduled→in_progress(`started_at`)→completed(`ended_at`,`duration_seconds`). No start-time gate.

### 6 · Reschedule / cancel  *(parent+teacher · Arc 1)*
- **Does:** parent reschedules (teacher approves); then cancels a ≥24h lesson. **Sees(PASS):** reschedule → both see **new time** (⏰ in viewer device zone via the `*_datetime_iso` fields — same dd-bwgw1 guard as Flow 4; reschedule cards `RescheduleRequestCard` / `TeacherRescheduleRequestCard` must show the proposed time as-booked, not −4h); cancel → lesson **disappears** from schedules + Google Calendar, lesson returns to balance.
- **Branch:** **<24h cancel → teacher approves override** → no auto-refund, teacher gets refund decision → approves → balance restored.
- **Corroborate:** reschedule = two-step (`SimpleBookingRescheduleRequest`→approve!, status stays 1); cancel = status 3 + `cancelled_at` + `credit_refunded=t` + `lessons_remaining+1` (wallet restore, no Stripe money-back) + mapping deleted (async). <24h = teacher override approve/deny.

### 7 · Homework  *(teacher → student → parent · Arc 1)*
- **Does:** teacher assigns homework in Dogfood Piano; S1 uploads a **~50 MB** video; teacher reviews it; parent approves; S1 reviews their own submission; S1 uploads a small PNG.
- **Sees(PASS):** the video plays on all three surfaces, no 500. The recorder's own review shows the recording, **not** a black frame. The PNG still opens in a new tab.
- **Why 50 MB, and why not a mock:** BE v2.29.1 fixed `file_previews` OOM-500ing on 40–55 MB blobs by streaming instead of buffering into RAM. The FE render path is already covered four ways (`e2e/homework-review-streaming.spec.ts`, `e2e/homework-recorder-playback.spec.ts`, the structural CI guard `components/shared/homework/no-raw-media-elements.test.ts`, and `resolvePlaybackSrc`). The bug was never rendering — **size is the test.** A small mock exercises the path that never broke. `app/dev/recorder-harness/page.tsx` is `notFound()` in production, so it cannot help here either.
- **⚠️ NEVER open submissions `2a533f3f…` (54.7 MB) or `f4cae41e…` (40.8 MB).** They are the only large videos on prod and both belong to student **Duru** (`917efe31`), guardian `efsunatmaca@yahoo.com`, `is_test_account=f` — **a real family's child.** Use only the household's own submission under student `29e3b82b`. Generate the fixture with `ffmpeg` (`video/webm` is allowed, `lib/upload-utils.ts:47`; cap is 100 MiB, `:33`).
- **Corroborate:** the media request URL resolves to `download_url`/`url` and **never** `preview_url`; status `200`/`206`, never `500`. `homework_submissions` row exists with `active_storage_blobs.byte_size` between 40–55 MB. Uploads go via `DirectUpload` to a presigned URL, so only the **download** traverses Rails — which is the OOM path under test.

---

## OPEN QUESTIONS (block Arc 2 design only — Arc 1 can start anytime)
1. ~~Summer Academy mechanics~~ **RESOLVED 2026-06-23 (3 parallel agents):** auto-applied $25 to parent's first purchase, no coupon/no page; in-app shows full price (discount UI flag-off in prod) — verify in Stripe (charge=$25 on the $50 pkg). Parent verified eligible & unused.
2. **Stripe Connect onboarding** — can Andres complete real Connect onboarding for `dogfood-teacher` on live Stripe (bank/KYC)? Now or defer Arc 2? **← the only remaining Arc 2 blocker.**

## RESUME POINT
Open kimi-webbridge → run **Arc 1**, flow 1 (teacher creates class). Andres drives, Claude monitors. Arc 2 waits on A4 + the two open questions. Baseline to record: FE v2.14.2 / BE 2.24.1.

## Verified state-machine (corroboration reference, source-cited)
Slot status `0 pending·1 approved·2 declined·3 cancelled` (`simple_booking_slot.rb:54`). Book: `credits_reserved+=N` (`booking_request_service.rb:92`). Approve: `BookingApprovalService.approve_all`; `lessons_remaining−=approved, credits_reserved−=total` (`simple_booking_request.rb:197`); async `DailyRoomProvisionJob`(location_url + LiveLesson) + `GoogleCalendarProjectionSyncJob`. LiveLesson `0 scheduled·1 in_progress·2 completed·3 abandoned` (`live_lesson.rb:9`); no start-time gate. Cancel refund-eligible ≥24h (`simple_booking_slot.rb:482`); restores wallet credit, no Stripe refund; calendar mapping deleted via sync path when not `projectable?`. Odyssey requires active enrollment + teacher-owned package (`odyssey_wallet_load_service.rb:94`). Purchase needs `stripe_connected?` + saved card; routes destination charge to teacher.
