# Production, after a promote

A smoke per persona on thoven.co, once the release is live. It reads; the only writes are between the ghost accounts.

## Accounts

The ghost household in `~/thoven/.secrets/thoven-prod.env` (`GHOST_TEACHER_*`, `GHOST_PARENT_*`, `GHOST_STUDENT_*`): test accounts that publish's smoke also uses, so nothing locks, drains or spends them. Load the file in the shell that logs in and never print a value. Every other account on production is a real family.

## Steps

1. **Confirm the release is live** before the first journey: a route or response only the new build has. Done when one probe per repo proves the promoted SHA serves.
2. **Walk each persona's home and the changed journeys** as [walk.md](walk.md) says, with these limits: book, cancel and message only between ghost accounts; spend no real card; a journey that would touch a real family's row stops at that step and is reported.
3. **Confirm money and booking state with a read-only query** on the laptop through Neon (project in `debug`'s `references/vendor-access.md`), quoting the row id: the browser can show "Booked!" with no row written.
4. Diagnose and report with [diagnose-and-report.md](diagnose-and-report.md).

Done when every persona the release touches has walked its home and the changed journeys, or stopped at a named step.
