# Tracing a bug report

One tracer per bug: a cluster of `bug report` signals and delivery anomalies about the same
behaviour. The tracer is read-only end to end. It returns a **verdict** with its evidence; it
never fixes anything.

## Brief the tracer with

- The signals, verbatim, with thread, timestamp and speaker.
- The window and the people's profile ids from `db_people.json`.
- The question in one line: "did the product do what the text says it did, and is it fixed now?"

## Sources, in this order

1. **Production data** (Neon `dry-sound-31987419`, read-only): the actual records behind the text,
   such as the booking, the reschedule request, the wallet entry, the notification and its
   `read_at`, or the message and its delivery attempts. Name one real record (environment, id)
   that shows the defect. A quote alone is not evidence.
2. **Render logs** for `thoven-api` (`srv-dar05h3ncjis73bki8qg`): the requests the person's
   client actually sent around the timestamp. Filter by text and request id, because
   `--method` misses application log lines. Retry on TLS timeouts.
3. **Sentry** org `thoven-gy`: errors in the same minutes, for the same user or route.
4. **What shipped since**: `git log` on both repos' `main` and the `prod/*` tags after the
   incident, plus Linear tickets that name the behaviour. A fix counts only when it changes the
   code path the record went through and reached production after the incident.

## Verdicts

| Verdict | Evidence it needs |
|---|---|
| `FIXED` | the commit or PR, the `prod/*` tag that carried it, and why it covers this record's path |
| `NOT FIXED` | the record, the code path on today's `main` that still produces it |
| `NOT A BUG` | the record showing the product did what it should, and what the person misread |
| `UNKNOWN` | what was checked, and what access or data would settle it |

Before calling a report misattributed, check who actually sent it: in the 2026-10-29 run a
"purchased but didn't see the lessons" text was first pinned on the wrong family, and a 422 was
first pinned on the parent when the teacher had sent it.

## After the verdict

`NOT FIXED` and `UNKNOWN` bugs go to main. Main runs `/diagnosing-bugs` on each one it can build
a loop for, read-only, and stops at the diagnosis: backend rules require Andres's approval before
any fix.
