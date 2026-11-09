# Tracing a bug report

One tracer per bug: a cluster of `bug report` signals and delivery anomalies about the same
behaviour. The tracer is read-only end to end. It returns a **verdict** with its evidence; it
never fixes anything.

## Brief the tracer with

- The signals, verbatim, with thread, timestamp and speaker.
- The window and the people's profile ids from `db_people.json`.
- The question in one line: "did the product do what the text says it did, and is it fixed now?"

## Before the sources

Three checks close a cluster without a trace:

1. **Already shipped.** Find the `prod/*` tag that changed this code path. A text from before
   that tag is `FIXED`. Name the tag. Do not re-diagnose it.
2. **Not a text.** A database row with no Twilio sid is a delivery bug only when
   `dispatch_intent` is true. `false` on an automation row is an in-app notice. Verdict
   `NOT A BUG`.
3. **Consent.** `failure_code` `consent_revoked` on a parent whose `sms_consent_at` is null
   means they never opted in. Say that. Do not call it a revocation or a delivery failure.

## Sources, in this order

1. **Production data** (Neon `dry-sound-31987419`, read-only): the actual records behind the text,
   such as the booking, the reschedule request, the wallet entry, the notification and its
   `read_at`, or the message and its delivery attempts. Name one real record (environment, id)
   that shows the defect. A quote alone is not evidence.
2. **Render logs** for `thoven-api` (`srv-dar05h3ncjis73bki8qg`) and `thoven-worker`
   (`srv-dar05h3ncjis73bki8s0`): the requests the person's client actually sent around the
   timestamp. Query one day at a time. A window-wide `--text` search returns empty. Filter by
   text and request id, because `--method` misses application log lines. Retry when the CLI
   says too many requests.
3. **Sentry** org `thoven-gy`: errors in the same minutes, for the same user or route. Split
   every issue by its `environment` tag. A staging event is not a production bug.
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
