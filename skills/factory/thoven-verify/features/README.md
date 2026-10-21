# Thoven verification map

Maintained source for user-facing factory drives. Read this index, then the feature file.

## Baseline preconditions

- Target is staging or a Vercel preview. Doctor exited 0.
- Evidence dir is set (`scripts/evidence-init.sh`).
- Version JSON is already written.
- You have a staging persona when the journey needs a session. Do not create production users.
- Never drive `https://thoven.co` or `https://api.thoven.co`.

## Driving conventions

- Start from the feature's preconditions.
- Prefer ARIA roles and accessible names.
- Treat quoted names as literal.
- Restore any staging fixture you created. Keep proof artifacts.

## Proof and skip reporting

- Capture the action and the resulting state.
- UI proof includes a screenshot with the Thoven chrome visible.
- Record the feature id and entry point on every artifact.
- An unreachable path is a failure plus the unmet precondition. Do not mark it verified through a different path.

## Features

- [Sign in](./sign-in.md) reaches teacher, parent, or student home from `/login`.
- [Teacher schedule](./teacher-schedule.md) shows upcoming lessons on the teacher home.
- [Parent booking](./parent-booking.md) lets a parent request or see a lesson.
- [Student lesson](./student-lesson.md) lets a student open an assigned lesson.

Factory loop PRs must not change auth, billing, credits, privacy copy, or customer email. Those surfaces stay in the map so a verify can still read them.
