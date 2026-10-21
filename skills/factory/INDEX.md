# Factory skills

Station map for the bug-and-fix factory. Load only a skill that exists as a folder.

| Station | Skill | Job |
|---|---|---|
| all | [thoven-verify](thoven-verify/SKILL.md) | Drive staging or a preview. Keep evidence. |
| 1 | [factory-intake](factory-intake/SKILL.md) | File and batch tickets. |
| 2 | *(deferred)* | Classify. Another agent supplies the folder. |
| 4 | [factory-repro](factory-repro/SKILL.md) | Reproduce on staging or preview. |
| 5 | [factory-decision-card](factory-decision-card/SKILL.md) | Go / no-go before a fix dispatch. |
| 6 | [thoven-factory-mode](thoven-factory-mode/SKILL.md) | Cloud-agent fix prompt and loop style. |
| 6 | [factory-rules](factory-rules/SKILL.md) | Caps and forbidden areas. |
| 7 | [factory-review](factory-review/SKILL.md) | Review the PR. |
| 7 | [thoven-factory-formal](thoven-factory-formal/SKILL.md) | Verify the review's proof quality. |
| 9 | *(deferred)* | CI watch. Another agent supplies the folder. |
| 11-12 | *(deferred)* | Production version read. Another agent supplies the folder. |
| claim | [factory-claim](factory-claim/SKILL.md) | Claim the Sentry issue after a verified fix. |
| Friday | [factory-scorecard](factory-scorecard/SKILL.md) | Weekly scorecard and replay eval. |

Deferred folders have no INDEX row that points at a missing path, and no plugin.json entries.

Every station skill checks its own output with `thoven-verify`.
