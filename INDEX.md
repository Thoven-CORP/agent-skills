# Skills index

Each skill lives at `skills/<category>/<name>/SKILL.md`. The Cursor plugin at `.cursor-plugin/plugin.json` loads `./skills/`. Frontmatter `name` matches the folder name.

## factory

Bug-and-fix factory. Stations run in order. Every station skill checks its own output with `thoven-verify`.

| Skill | Station | When to use |
|---|---|---|
| [thoven-verify](skills/factory/thoven-verify/SKILL.md) | all | Drive staging or a Vercel preview and keep evidence. |
| [factory-intake](skills/factory/factory-intake/SKILL.md) | 1 | File tickets and batch them into one PR. |
| [factory-classify](skills/factory/factory-classify/SKILL.md) | 2 | One verdict or stop for a Triage issue. |
| [factory-repro](skills/factory/factory-repro/SKILL.md) | 4 | Reproduce the batch on staging or a preview. |
| [factory-decision-card](skills/factory/factory-decision-card/SKILL.md) | 5 | Go / no-go before the cloud-agent fix. |
| [thoven-factory-mode](skills/factory/thoven-factory-mode/SKILL.md) | 6 | Factory loop working style and the cloud-agent fix prompt. |
| [factory-rules](skills/factory/factory-rules/SKILL.md) | 6 | Configurable caps and the forbidden-area list. |
| [factory-review](skills/factory/factory-review/SKILL.md) | 7 | Review the PR. Invokes thoven-factory-formal. |
| [thoven-factory-formal](skills/factory/thoven-factory-formal/SKILL.md) | 7 | Verify the review's proof, not the factory loop. |
| [factory-ci-watch](skills/factory/factory-ci-watch/SKILL.md) | 9 | Read loop-PR CI, classify failures, stop after two real ones. |
| [factory-version-read](skills/factory/factory-version-read/SKILL.md) | 11-12 | Prove which frontend and backend commits are live. |
| [factory-claim](skills/factory/factory-claim/SKILL.md) | claim | Claim the Sentry issue in org thoven-gy. |
| [factory-loop-eval](skills/factory/factory-loop-eval/SKILL.md) | eval | Replay past fixed bugs after 10 real tickets (DEP-11). |
| [factory-scorecard](skills/factory/factory-scorecard/SKILL.md) | Friday | Weekly scorecard and replay eval after 10 tickets. |

## Other categories

- `skills/andres-mode/`
- `skills/andres-dev-evaluation/`
- `skills/dev/` (engineering and personal-dev)
- `skills/exec/` (executive assistant, outreach, CFO, fundraising)
- `archive/` (retired, `SKILL.md.archived` only)
