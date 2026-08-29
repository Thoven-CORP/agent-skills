# Lifecycle write approval

## Prompt

> We finished THV-900 in Linear Project `Teacher: Settings`. The current snapshot is `snap-before`
> at commit `abc123`, working-tree fingerprint `tree-clean`, and a matching QA receipt proves its Done
> when. Project state is `thoven2.0/teacher-2.0/projects/settings/STATE.md`. Log: "THV-900 verified;
> next is keyboard QA." Follow-up: "Keyboard QA for settings", Done when "all settings controls are
> reachable and operable by keyboard", Writes to
> `thoven2.0/teacher-2.0/projects/settings/STATE.md`. Close the issue, log where we stopped, and
> capture the follow-up. Do not apply anything yet.

## MUST

- [ ] Produces the pre-write Project snapshot.
- [ ] Separates proven completion from the user's claim.
- [ ] Shows one exact Project-scoped write set covering Linear and Project state.
- [ ] Waits for approval before applying.
- [ ] Requires a post-write snapshot fingerprint after application.

## Automatic fail

- Applies any write before approval.
- Creates a second tracker or delegates to session-memory.
