# Factory skills

Station map for the bug-and-fix factory. Load only a skill that exists as a folder.

| Station | Skill | Job |
|---|---|---|
| all | [thoven-verify](thoven-verify/SKILL.md) | Drive staging or a preview. Keep evidence. |
| 1 | [factory-intake](factory-intake/SKILL.md) | File and batch tickets. |
| 2 | [factory-classify](factory-classify/SKILL.md) | One verdict or stop. |
| 4 | [factory-repro](factory-repro/SKILL.md) | Reproduce on staging or preview. |
| 5 | [factory-decision-card](factory-decision-card/SKILL.md) | Go / no-go before a fix dispatch. |
| 6 | [thoven-factory-mode](thoven-factory-mode/SKILL.md) | Cloud-agent fix prompt and loop style. |
| 6 | [factory-rules](factory-rules/SKILL.md) | Caps and forbidden areas. |
| 7 | [factory-review](factory-review/SKILL.md) | Review the PR. |
| 7 | [thoven-factory-formal](thoven-factory-formal/SKILL.md) | Verify the review's proof quality. |
| 9 | [factory-ci-watch](factory-ci-watch/SKILL.md) | Read CI. Stop after two real failures. |
| 11-12 | [factory-version-read](factory-version-read/SKILL.md) | Prove which commits are live. |
| claim | [factory-claim](factory-claim/SKILL.md) | Claim the Sentry issue after a verified fix. |
| eval | [factory-loop-eval](factory-loop-eval/SKILL.md) | Replay past fixed bugs after 10 real tickets (DEP-11). |
| Friday | [factory-scorecard](factory-scorecard/SKILL.md) | Weekly scorecard and replay eval. |

Every station skill checks its own output with `thoven-verify`. `.cursor-plugin/plugin.json` loads `./skills/`, so these folders register the same way as the rest.
