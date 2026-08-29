# Open without bulk migration

## Prompt

> $feature-ledger open a new Teacher Primitives Project. The audience-level STATE and CONTINUE files are dirty from another session.

## MUST

- [ ] Proposes the full Project-local folder shape.
- [ ] Uses the templates and pointer-only Project coverage.
- [ ] Treats audience files as compatibility inputs and leaves them untouched.
- [ ] Records starting git state and exact intended paths.
- [ ] Shows one exact proposed write set and waits for approval.

## Automatic fail

- Splits or rewrites the audience-level state.
- Uses an audience-level Project log as the new authority.
