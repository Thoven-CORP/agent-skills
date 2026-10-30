# Database lookups

Production Neon project `dry-sound-31987419`, through the read-only `run_sql` tool. Each query
returns one row with one JSON value; write that value verbatim to the named file in the scratch
folder. Replace `:since` with the window start, as `'YYYY-MM-DD'`.

The database labels Twilio's transcript; it never replaces it. Twilio holds every text a person
saw, including replies the database never stored.

## 1. People → `db_people.json`

Who each thread is between, and whether it is a test or internal account. The internal list is
`Profile::INTERNAL_EMAILS` and `TEST_EMAIL_DOMAINS` in the backend's `app/models/profile.rb`;
check it there and update the `IN` list and domains below when it changed.

```sql
SELECT json_agg(json_build_object(
  'conversation_id', c.id,
  'teacher', t.first_name || ' ' || t.last_name, 'teacher_profile_id', t.id,
  'parent',  p.first_name || ' ' || p.last_name, 'parent_profile_id',  p.id,
  'teacher_test', coalesce(t.is_test_account, false)
                  OR lower(trim(t.email)) IN ('keri@thoven.co')
                  OR t.email ILIKE '%@test.thoven.co' OR t.email ILIKE '%@test.co',
  'parent_test',  coalesce(p.is_test_account, false)
                  OR lower(trim(p.email)) IN ('keri@thoven.co')
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

## Checks that need more than these

- Delivery attempts for one message: `message_delivery_attempts` (`state`, `provider_message_sid`,
  `provider_error_code`, `outcome_class`) by `message_id`.
- Held inbound texts: the Render logs for the Twilio webhook name the reason (for example
  `invalid_inbound_body` for a picture with no text).
