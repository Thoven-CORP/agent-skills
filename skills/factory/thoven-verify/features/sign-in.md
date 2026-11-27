# Sign in

Sign in sends a teacher, parent, or student to that audience's home from `/login`.

## Sub-features

- `sign-in-open` shows the login form at `/login`.
- `sign-in-teacher` reaches the teacher home.
- `sign-in-parent` reaches the parent home.
- `sign-in-student` reaches the student home.

## How to get to it (user POV)

- Open `/login` on the target host.
- Follow a magic-link or password form already seeded on staging.
- Use the audience switcher only when the page shows one.

## Driving it with the session browser

Preconditions:

- Doctor exited 0 on a staging or preview host.
- A seeded staging account exists for the audience. Do not register a new production user.
- `$THOVEN_VERIFY_EVIDENCE_DIR` is set.

- **Open login.** Go to `/login`. The page shows a sign-in form or magic-link prompt, not a 5xx.
- **Submit seeded credentials.** Fill the form the page actually shows. Home for that audience renders.
- **Proof.** Screenshot the form (`action.png`) and the audience home (`result.png`). Write both steps to `steps.jsonl`.
- **Wrong audience.** A teacher account must not land on `/parent` or `/student`.

## Gotchas

- Staging version JSON may say `env: "production"`. Refuse only when the host is `thoven.co` or `api.thoven.co`.
- Factory loop PRs must not change auth code. This feature is read-only for the loop.
- A `/dev` or lab login is not this feature.
