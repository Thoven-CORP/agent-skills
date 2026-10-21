# Launch

## Preferred target

Use an already-running factory target.

| Kind | Frontend | API |
|---|---|---|
| Staging | `https://staging.thoven.co` | `https://thoven-api-staging.onrender.com` |
| Vercel preview | The PR preview URL | Same origin `/api/*` when the preview proxies, else staging API |

Ready checks

1. `scripts/doctor.sh` exits 0.
2. The first paint is a Thoven shell (marketing, login, or an audience home). A blank 5xx is not ready.
3. Version JSON is written to the evidence dir.

## Local stack (only when staging and preview are unusable)

Work from the frontend and backend checkouts, not this skills repo.

1. Empty or disposable data. Never a production dump unless a human already authorized a neutralized QA snapshot (qa-flow owns that path).
2. Backend listen on `0.0.0.0:$PORT` as that repo documents.
3. Frontend against that API.
4. Record both base URLs in the evidence dir as `target.txt`.

If the checkout does not start, stop and say so. Do not generate a drive against a broken base.

## Isolation

Two factory runs may share staging. They must not share a local data dir. Set a unique `THOVEN_VERIFY_RUN_ID`. Refuse to drive a local instance you did not start.

## Teardown

`scripts/cleanup.sh` stops local processes this run spawned. It does not stop staging or Vercel.
