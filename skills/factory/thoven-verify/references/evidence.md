# Evidence

Proof lives in `$THOVEN_VERIFY_EVIDENCE_DIR`. Cleanup must not touch it.

## Required files

| File | Source |
|---|---|
| `target.txt` | FE URL, BE URL, run id |
| `fe-version.json` | `$FE_URL/api/version` |
| `be-health.json` | `$BE_URL/health` |
| `doctor.txt` | doctor stdout |
| `steps.jsonl` | one JSON object per observed step |
| `action.png` | screenshot of the user action |
| `result.png` | screenshot of the resulting state |

A document-only station may omit the PNGs and instead keep the artifact path in `steps.jsonl`.

## Version reads

Staging defaults

- `https://staging.thoven.co/api/version`
- `https://thoven-api-staging.onrender.com/health`

Observed shape (2026-10-21)

- Frontend. `{ "sha", "ref", "env" }`. Staging host returned `env: "production"`.
- Backend. `{ "status", "timestamp", "environment", "revision.sha", "checks" }`. Staging host returned `environment: "production"`.

Record the JSON as returned. Do not rewrite `env` to `staging`. Say in the report that host is the environment signal.

## steps.jsonl

One line per observation, written as you see it.

```json
{"ts":"2026-10-21T20:51:26Z","feature":"parent-booking","action":"open /parent","result":"heading Parents","ok":true}
```

## After cleanup

Confirm the evidence dir still exists and still holds `fe-version.json` and `be-health.json`. If cleanup ate the proof, the run failed.
