# When the branch lands

Once per branch, before its PR into `main`:

- **Callers.** When the diff changes copy a user reads, `rg` the old sentence across `spec/` and `__tests__/` in both repos and run every file it hits. For a changed job, scope, model method or association, `rg -l '<ClassName>|<method>' spec` (with `spec/integration` and every `receive(:method)` stub), because the files you edited are not the files that call them (2026-11-05, 2026-11-18).
- **Full verify.** `bin/verify --base <integration branch>` on the mini; from the laptop that is `remote-verify` (`run-on-mini`). Paste its `THOVEN_VERIFY` block verbatim. Mutation runs on GitHub; locally only when Andres asks.
- **The user's view.** User-facing work is walked as a user by `qa-product` (law, "User-facing work is checked as a user").

What CI runs: `TESTING.md`, "What CI runs". Local checks before `gh pr merge --auto`: `enforcement/rules/branches-and-prs.md`.

**Done when:** the `THOVEN_VERIFY` block is pasted, and user-facing work has its `qa-product` report.
