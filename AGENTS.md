# Agent skills repo

- `skills/dev/` — Thoven engineering + personal-dev workflow
- `skills/exec/` — executive assistant, outreach, CFO, fundraising
- `archive/` — retired skills (`SKILL.md.archived` only). Never installable. See `archive/README.md`.

Nested BE/FE skills (one name, two workflows): `publish`, `orchestrate`, `prompt-generator`, `doc-freshness`. Detect Rails vs Next.js; load only the matching `references/` file.

`verify` picks targeted checks by what the diff touches, pastes each command and its pass line, and fixes what fails. The full native `bin/verify` runs when Andres asks or once at the parent. It has no nested reference workflow.

Renames: `manual-qa` → `qa-flow`; `email` (mailers) → `thoven-email-system`; `docs-freshness` → `doc-freshness`.

This repo takes no PRs and runs no CI: commit the exact paths in `git worktree add --detach <tmp> origin/main`, `git push origin HEAD:main`, then reinstall (README). See `enforcement/rules/branches-and-prs.md`.

Never copy third-party npx skills or plugin skills into this repo. Team install instructions: [README.md](./README.md).
