---
name: factory-intake
description: File a Thoven factory bug ticket from a report and batch related tickets into one PR. Use at station 1, for /factory-intake, "file this bug", or when a Sentry, Linear, or user report needs the factory template. Bounce incomplete reports.
---

# Factory intake

Station 1. Turn a report into Linear tickets the loop can fix. Then group those tickets into a batch that becomes one PR.

## Required fields

Bounce the report if any field is missing. The template is [references/ticket-template.md](references/ticket-template.md).

| Field | Rule |
|---|---|
| Duplicate check | Search Linear for the same surface and symptom. Link the duplicate or say none. |
| Evidence link | URL or evidence dir. A screenshot, Sentry, or video. |
| What the user saw | One sentence, their words. |
| Expected | One sentence. |
| Steps | At least two. |
| Severity | A `Severity` field whose value is exactly one of S1, S2, S3. |
| Found by | Exactly one. |
| Repo | Exactly one (`frontend` or `backend`). |
| Project | Exactly one Linear project. |
| Forbidden | A `Forbidden` field (`none` or the rule that bounced). |

## Bounce

Read [references/bounce.md](references/bounce.md). Bounce when a required field is missing, the area is forbidden, or the report is a question. Do not invent evidence.

## Two repos

A bug that needs both frontend and backend becomes **two linked tickets**, one repo each. Same batch. Same guarantee. Do not file one ticket with two repos.

## Batch

Group tickets that share area, surface, or root cause into **one batch**. That batch becomes **one loop PR**.

- Avoid one-file micro tickets. If two reports touch the same surface, they are one batch.
- Link every ticket in the future PR body. Comment the sibling ids on each ticket now.
- Size caps in `factory-rules/RULES.md` apply to the batch PR, not to each ticket. Placeholders are 400 lines and 15 files (pending Andres).
- If the batch would blow the size cap, split by surface, not back into one-file tickets.

```bash
scripts/check-intake.sh --file <ticket.md>
```

Then verify the artifact.

```bash
../thoven-verify/scripts/check-station-output.sh --kind intake --file <ticket.md>
../thoven-verify/scripts/doctor.sh --fe "$FE_URL" --be "$BE_URL" --out "$THOVEN_VERIFY_EVIDENCE_DIR"
```
