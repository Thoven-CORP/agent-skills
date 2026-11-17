# Drive

## Harness

Use the browser tool already in the session (Cursor browser, Chrome DevTools MCP, or `control-ui`). Prefer stable handles.

- ARIA role plus accessible name
- Visible button and heading text
- Route paths (`/teacher`, `/parent`, `/student`, `/login`)

Do not use click coordinates. Do not tab through a whole form to reach a field.

## Proof standard

- Walk the path a user walks. Login through the UI when the journey needs a session.
- Capture the action and the resulting state, not only the last screen.
- Confirm side effects the user can see (a new row, a status, a disabled button).
- Mocks only at a production boundary that already isolates the other system.

## Factory safety

- Staging or preview only.
- Use seeded or existing staging accounts. Do not invent a real family.
- Do not email, SMS, or charge anyone.
- Do not click production admin tools that mutate live schools.
- If a journey needs a precondition the seed lacks, fail the journey and write the reason in that feature's Gotchas. Do not weaken the journey.

## Station output check

When the station produced a document rather than a UI change, skip the browser and run

```bash
scripts/check-station-output.sh --kind <intake|repro|card|review|claim|scorecard|formal> --file <artifact>
```

Then still write version JSON for the target the station talked about, so the artifact is pinned to a sha.
