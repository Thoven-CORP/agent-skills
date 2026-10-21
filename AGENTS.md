# Agent skills repo

- `skills/dev/` — Thoven engineering + personal-dev workflow
- `skills/exec/` — executive assistant, outreach, CFO, fundraising
- `skills/factory/` — bug-and-fix factory stations (see `skills/factory/INDEX.md`)
- `archive/` — retired skills (`SKILL.md.archived` only). Never installable. See `archive/README.md`.

Nested BE/FE skills (one name, two workflows): `publish`, `orchestrate`, `prompt-generator`, `doc-freshness`. Detect Rails vs Next.js; load only the matching `references/` file.

`verify` runs each changed repository's native `bin/verify`, pastes its evidence block, and fixes failing rows. It has no nested reference workflow.

Renames: `manual-qa` → `qa-flow`; `email` (mailers) → `thoven-email-system`; `docs-freshness` → `doc-freshness`.

Never copy third-party npx skills or plugin skills into this repo. Team install instructions: [README.md](./README.md).
