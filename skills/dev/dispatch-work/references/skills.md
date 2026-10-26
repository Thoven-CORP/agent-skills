# Skills: the moment each one fires

A skill fires when it is tied to a moment the agent is already at: before a commit, on a
done-claim, at the first component edit. A skill tied to a standing condition ("you are writing
React") never fires.

**poteto-mode owns the process.** The builder runs its playbook step by step, as the parent
session does, and poteto-mode routes its own skills: `/how`, `/architect`, `/interrogate`,
`/arena`, `/swarm`, `/deslop`, `/no-comments`, `/unslop`, `/technical-writing` and the control
skills. Never list those in ACCESS. ACCESS carries only the Thoven moments below that the ticket
reaches.

## Thoven moments

| Moment in this ticket | Skill |
| -- | -- |
| The first edit to a component or a design value | `/thoven-designer` |
| Building a component the system does not have, or changing one | `/building-components` |
| A screen is built, before the parity capture | `/better-ui` |
| Adding or reviewing motion | `/review-animations` |
| Writing, changing or auditing a test | `/test-audit` |
| A behaviour to pin test-first at a named seam | `/tdd` |
| An endpoint, payload or serializer changes | the `api-designer` subagent (Claude Code) |
| A migration, index or backfill | `/safe-migrate` |
| Consent, minors' data or parent verification | `/thoven-coppa-vpc-contracts` |
| A mailer or email template | `/thoven-email-system` |
| Before sending DONE | `/verify` "Before DONE" steps |

Name a skill only after checking it exists under `~/.claude/skills/` or `~/.agents/skills/`.
