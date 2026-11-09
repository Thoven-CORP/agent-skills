# Parent booking

Parent booking lets a signed-in parent see teachers or requests and start or inspect a lesson request.

## Sub-features

- `parent-home` renders the parent home after sign-in.
- `parent-browse` shows teachers or the current request list.
- `parent-request` opens an existing request or the request form.

## How to get to it (user POV)

- Sign in as a parent, then land on `/parent`.
- Open an existing request from the parent home.

## Driving it with the session browser

Preconditions:

- Sign-in for a seeded staging parent succeeded.
- You will not submit a request that emails a real teacher.

- **Open home.** Go to `/parent`. Parent chrome and a list or browse region render.
- **Inspect a request or teacher.** Open one existing request, or one teacher card. Detail for that row appears.
- **Do not complete a live book** unless the target is a disposable staging sandbox and outbound mail is confirmed off.
- **Proof.** Screenshot the list (`action.png`) and the detail (`result.png`).

## Gotchas

- Completing a request can email a teacher. Stay on inspect unless outbound contact is confirmed neutralized.
- Credits and wallet rows are read-only for factory loop PRs.
- Do not use admin impersonation on production.
