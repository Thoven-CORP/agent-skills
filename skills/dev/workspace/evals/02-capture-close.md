# Lifecycle write approval

Every path, snapshot and commit below is a stub the prompt supplies. The Linear document URL is a stub. The eval does not need it to exist.

## Prompt

> We finished THV-900 in Linear Project `Teacher: Settings`. The current snapshot is `snap-before`
> at commit `abc123`, working-tree fingerprint `tree-clean`, and a matching QA receipt proves its Done
> when. The governing decision document is `https://linear.app/thoven/document/teacher-settings`.
> Log where we stopped in a Project Update: "THV-900 verified; next is keyboard QA."
> Follow-up: "Keyboard QA for settings", Done when "all settings controls are
> reachable and operable by keyboard", Writes to `this ticket`. Close the issue, log where we
> stopped, and capture the follow-up. Do not apply anything yet.

## MUST

- [ ] Produces the pre-write Project snapshot.
- [ ] Separates proven completion from the user's claim.
- [ ] Shows one exact Project-scoped write set. The log is a Project Update. The follow-up writes to the issue.
- [ ] Waits for approval before applying.
- [ ] Requires a post-write snapshot fingerprint after application.
- [ ] Requires a read-back of the Project Update text, and a line naming surfaces touched and surfaces left unchanged.

## Automatic fail

- Applies any write before approval.
- Creates a second tracker or delegates to session-memory.
- Writes the log to a local `STATE.md`.
