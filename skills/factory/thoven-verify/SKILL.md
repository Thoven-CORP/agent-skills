---
name: thoven-verify
description: Drive Thoven on staging or a Vercel preview the way a user does, then keep screenshots and version reads as proof. Use for factory output checks, /thoven-verify, "drive staging", "preview QA", or before claiming a factory fix works. Never against production data.
---

# Thoven verify

Product control surface for the factory. Launch the target, doctor it, drive one mapped feature (or the station's own path), save evidence, then clean up. Later agents read this file cold.

Every factory station skill ends by running this skill against **its own output**. A ticket, card, or review with no evidence dir is not done.

## Targets

Prefer an already-running target.

1. The PR's Vercel preview, when the change is frontend.
2. `https://staging.thoven.co` plus `https://thoven-api-staging.onrender.com` otherwise.

Never open `https://thoven.co` or `https://api.thoven.co` as a drive target. Never create production rows, bookings, messages, or users.

JSON `env` / `environment` on staging currently says `production`. Host decides the environment. JSON does not.

## Launch

Read [references/launch.md](references/launch.md). Ready means the version and health endpoints return JSON and the UI renders a signed-out or seeded signed-in shell. A process that answers TCP is not ready.

Default evidence dir

```bash
scripts/evidence-init.sh
```

It prints `THOVEN_VERIFY_EVIDENCE_DIR`. Export that for the rest of the run.

## Doctor

Run first whenever anything looks off.

```bash
scripts/doctor.sh --fe "$FE_URL" --be "$BE_URL" --out "$THOVEN_VERIFY_EVIDENCE_DIR"
```

Worth driving only when all of these hold.

- Host is staging, `*.vercel.app`, or another named preview. Not `thoven.co` / `api.thoven.co`.
- GET on the frontend version endpoint returns JSON with a sha.
- GET on the API health endpoint returns JSON with a status (staging default is healthy).
- You started this drive, or the URL is the agreed factory target. Do not attach to someone else's local session.

## Drive

Read [references/drive.md](references/drive.md) and the matching file under [features/](features/README.md). Prefer ARIA roles and visible names. Exercise the real user path. Do not call internal setters or test-only endpoints and call that a proof.

A station that is not a UI change still runs a doctor plus [references/evidence.md](references/evidence.md) against the artifact it produced (ticket body, card, review). Use `scripts/check-station-output.sh`.

## Evidence

Save under `$THOVEN_VERIFY_EVIDENCE_DIR` (survives cleanup).

- frontend version JSON from https://staging.thoven.co/api/version or the preview version endpoint
- API health JSON from https://thoven-api-staging.onrender.com/health
- One screenshot of the action and one of the resulting state
- steps.jsonl with one line per observed step

```bash
scripts/version.sh --fe "$FE_URL" --be "$BE_URL" --out "$THOVEN_VERIFY_EVIDENCE_DIR"
```

## Cleanup

```bash
scripts/cleanup.sh
```

Kill only what this run started. Keep the evidence dir. Never delete proof to make cleanup look tidy.

## Helpers

| Script | Job |
|---|---|
| `scripts/evidence-init.sh` | Create the evidence dir and print it. |
| `scripts/doctor.sh` | Read-only "worth driving?" check. |
| `scripts/version.sh` | Write version and health JSON. |
| `scripts/check-station-output.sh` | Check a station artifact against required keys. |
| `scripts/cleanup.sh` | Tear down run-owned scratch. |

Keep the feature map honest with `/maintain-verification-skill` when the product changes.
