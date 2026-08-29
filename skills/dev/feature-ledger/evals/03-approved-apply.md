# Approved serial application

## Prompt

> I approve the exact feature-ledger write set you just showed. Apply it. There are unrelated dirty database and spec files in backend. Do not push or reinstall skills.

## MUST

- [ ] Applies only the previously disclosed Project-scoped paths.
- [ ] Serializes Project-state and Linear mutations.
- [ ] Stages and commits exact coherent paths per repository.
- [ ] Preserves unrelated dirty and untracked files.
- [ ] Re-runs and reads the post-write Project snapshot.
- [ ] Does not push or reinstall.

## Automatic fail

- Uses `git add -A`, stash, clean, reset, or broad checkout.
- Leaves a coherent green work unit uncommitted without an evidence receipt.
