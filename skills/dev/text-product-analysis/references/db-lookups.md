# Database lookups

Production Neon project `dry-sound-31987419`, through the read-only `run_sql` tool. Each query
returns one row with one JSON value; write that value verbatim to the named file in the scratch
folder. Replace `:since` with the window start, as `'YYYY-MM-DD'`.

The database labels Twilio's transcript; it never replaces it. Twilio holds every text a person
saw, including replies the database never stored.

## 1. People → `db_people.json`

Who each thread is between, and whether it is a test account. Test is `is_test_account` or
`Profile::TEST_EMAIL_DOMAINS` (`test.thoven.co`, `test.co`). `Profile::INTERNAL_EMAILS`
(`keri@thoven.co`) is a real teacher: leave her out of the test predicate. A thread drops only
when the parent is test, or the teacher is on a test domain. Check `app/models/profile.rb`
and update the domains below when that list changes.

```sql
SELECT json_agg(json_build_object(
  'conversation_id', c.id,
  'teacher', t.first_name || ' ' || t.last_name, 'teacher_profile_id', t.id,
  'parent',  p.first_name || ' ' || p.last_name, 'parent_profile_id',  p.id,
  'teacher_test', coalesce(t.is_test_account, false)
                  OR t.email ILIKE '%@test.thoven.co' OR t.email ILIKE '%@test.co',
  'parent_test',  coalesce(p.is_test_account, false)
                  OR p.email ILIKE '%@test.thoven.co' OR p.email ILIKE '%@test.co',
  'children', (SELECT string_agg(s.first_name || ' ' || s.last_name, '; ')
               FROM students s
               WHERE s.profile_id = p.id AND s.archived_at IS NULL AND s.erased_at IS NULL)))
FROM conversations c
JOIN profiles t ON t.id = c.teacher_profile_id
JOIN profiles p ON p.id = c.parent_profile_id
WHERE c.last_message_at >= :since;
```

## 2. Messages → `db_messages.json`

One compact row per message in the window, with no bodies, so the value stays small enough to
write out whole.

```sql
SELECT json_agg(json_build_object(
  'id', m.id, 'conversation_id', m.conversation_id,
  'source_kind', m.source_kind, 'sender_type', m.sender_type,
  'status', m.status, 'failure_code', m.failure_code,
  'dispatch_intent', m.dispatch_intent,
  'twilio_sid', m.twilio_message_sid,
  'created_at', to_char(m.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
  ORDER BY m.created_at)
FROM messages m
WHERE m.created_at >= :since AND m.archived_at IS NULL;
```

## 3. Bodies of DB-only rows → `db_bodies.json`

`build_threads.py` prints the ids of rows Thoven wrote but never handed to Twilio. Fetch only
those bodies:

```sql
SELECT json_object_agg(m.id, m.body)
FROM messages m
WHERE m.id IN (<the ids build_threads.py printed>);
```

## Every run

Write each value to the named file. Both numbers go on the page even when no one texted about
them. `simple_booking_requests.teacher_id` is a user id. An approved slot has `status` 1.

Families with a lesson in the last 30 days and nothing booked ahead → `db_churn.json`:

```sql
WITH fam AS (
  SELECT DISTINCT s.student_id, tp.user_id AS teacher_user_id,
         tp.first_name || ' ' || tp.last_name AS teacher,
         pp.first_name || ' ' || pp.last_name AS parent
  FROM sessions s
  JOIN teacher_classes tc ON tc.id = s.teacher_class_id
  JOIN profiles tp ON tp.id = tc.teacher_profile_id
  JOIN users tu ON tu.id = tp.user_id
  JOIN guardianships g ON g.student_id = s.student_id
  JOIN profiles pp ON pp.user_id = g.user_id AND pp.profile_type = 2
  JOIN users pu ON pu.id = pp.user_id
  WHERE s.first_sent_at >= now() - interval '30 days'
    AND coalesce(pp.is_test_account, false) = false
    AND pu.email NOT ILIKE '%@test.thoven.co' AND pu.email NOT ILIKE '%@test.co'
    AND coalesce(tp.is_test_account, false) = false
    AND tu.email NOT ILIKE '%@test.thoven.co' AND tu.email NOT ILIKE '%@test.co'
), ahead AS (
  SELECT f.teacher, f.parent,
         (SELECT min(sl.slot_at) FROM simple_booking_slots sl
          JOIN simple_booking_requests r ON r.id = sl.simple_booking_request_id
          WHERE r.student_id = f.student_id AND r.teacher_id = f.teacher_user_id
            AND sl.status = 1 AND sl.cancelled_at IS NULL AND sl.slot_at > now()) AS next_lesson
  FROM fam f
)
SELECT json_build_object(
  'families_with_a_recent_lesson', count(*),
  'nothing_booked', count(*) FILTER (WHERE next_lesson IS NULL),
  'unbooked', coalesce(json_agg(json_build_object('teacher', teacher, 'parent', parent))
                       FILTER (WHERE next_lesson IS NULL), '[]'::json))
FROM ahead;
```

Parent texts in the window still unread → `db_unread.json`. `older_than_48h` is the quality
number. A teacher who has not opened a parent's reply is the quality signal the texts miss
when the parent never complains.

```sql
SELECT json_build_object(
  'unread_parent_texts', count(*),
  'older_than_48h', count(*) FILTER (WHERE m.created_at < now() - interval '48 hours'),
  'examples', coalesce(json_agg(json_build_object(
                'message_id', m.id, 'conversation_id', m.conversation_id,
                'at', to_char(m.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
                ORDER BY m.created_at)
              FILTER (WHERE m.created_at < now() - interval '48 hours'), '[]'::json))
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
JOIN profiles pp ON pp.id = c.parent_profile_id
JOIN users pu ON pu.id = pp.user_id
WHERE m.sender_type = 'parent' AND NOT m.read_by_teacher AND m.archived_at IS NULL
  AND m.created_at >= :since
  AND coalesce(pp.is_test_account, false) = false
  AND pu.email NOT ILIKE '%@test.thoven.co' AND pu.email NOT ILIKE '%@test.co';
```

## Checks that need more than these

- Delivery attempts for one message: `message_delivery_attempts` (`state`, `provider_message_sid`,
  `provider_error_code`, `outcome_class`) by `message_id`.
- Held inbound texts: the Render logs for the Twilio webhook name the reason (for example
  `invalid_inbound_body` for a picture with no text).
