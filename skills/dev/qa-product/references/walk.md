# Walk a change as its users

For a branch, a local build or staging. The walk runs on the mini (`run-on-mini`, "browser work"). Load agent-browser's guide first: `agent-browser skills get core`.

## Before the first journey

- **Read the product at the SHA under test**, never a working tree other sessions write to: `git -C ~/thoven/frontend worktree add --detach <dir> <sha>`. Find the hard gates that set the order (a control `disabled` until an earlier step is done, a `*-gates.ts` module), and the routes that exist but sit off the live path. Done when you know each journey's entry route and which journey must run first.
- **Log in.** On staging, take the persona's credentials from `~/thoven/.secrets/staging.env` (the `STAGING_QA_*`, `STAGING_KERI_*` and `STAGING_SWEEP_TEEN*` households) and inject the API login's token; never print a value. When the change touches sign-in, redirects, role routing or an onboarding gate, that path is a journey, so walk it through the UI. Students sign in with username and passcode on their own auth (`student_token`), so a parent and a student session sit side by side.

## Each journey

1. Clear the evidence and start the recording:

   ```bash
   agent-browser network requests --clear; agent-browser console --clear; agent-browser errors --clear
   agent-browser network har start <run>/<journey>.har
   agent-browser record start <run>/<journey>.webm <entry-url>
   ```

2. **Act as the persona.** Set the viewport to its device (390 wide for a parent or teen on a phone, 1280×720 for a teacher at a desk). Read only what the screen shows; a literal user takes the UI at its word and never reads the code. Move at human speed (`agent-browser type`, a second between actions) so the video plays at 1x. Weave in what people do: go back, refresh, cancel and reopen, switch child, leave a form half-filled and return.
3. **Ask what else this user would do here**, and do it when the door is two-way: change a date, open the other child, try the action twice.
4. **Log each finding the moment it repeats** as one line in `<run>/findings.jsonl`: journey, step, route, what you saw, what the persona expected, the recording timestamp, and one `agent-browser screenshot --annotate` path. Retry once first; a finding that does not repeat is a note, not a finding. Then keep walking.
5. Stop and save: `agent-browser record stop`, `agent-browser network har stop`. Read `network requests --status 400-599`, `network requests --method POST` (one per user intent), `console` and `errors`. Each unexplained 4xx, 5xx, duplicate POST or console error is a finding.

Done when the persona reached the journey's end state, or a one-way door, and the recording and HAR are saved.

## Off-screen effects

Where the journey implies an effect the screen cannot show (an email, an SMS, a Stripe object, a job, a credit moved), confirm it once at the end: a read-only query on staging's database or the provider's test dashboard, quoted with its id or count.

