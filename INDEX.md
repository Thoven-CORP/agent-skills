# Skills index

Each skill lives at `skills/<category>/<name>/SKILL.md`. The Cursor plugin at `.cursor-plugin/plugin.json` loads `./skills/`. Frontmatter `name` matches the folder name.

## factory

Bug-and-fix factory. Stations run in order. Every station skill checks its own output with `thoven-verify`.

| Skill | Station | When to use |
|---|---|---|
| [thoven-verify](skills/factory/thoven-verify/SKILL.md) | all | Drive staging or a Vercel preview and keep evidence. |
| [thoven-factory-formal](skills/factory/thoven-factory-formal/SKILL.md) | 7 | Verify the review's proof, not the factory loop. |

Deferred folders (another agent supplies them later). Do not add plugin or index rows until those folders exist.

- classify (station 2)
- ci-watch (station 9)
- version-read (stations 11-12)

## Other categories

- `skills/andres-mode/`
- `skills/andres-dev-evaluation/`
- `skills/dev/` (engineering and personal-dev)
- `skills/exec/` (executive assistant, outreach, CFO, fundraising)
- `archive/` (retired, `SKILL.md.archived` only)
