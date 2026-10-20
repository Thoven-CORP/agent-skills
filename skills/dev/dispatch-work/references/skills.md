# Skills: the moment each one fires

A skill fires when it is tied to a moment the agent is already at: before a commit, on a
done-claim, at the first component edit. A skill tied to a standing condition ("you are writing
React") never fires. The 2026-09-18 audit counted 11 of 16 UI skills at zero runs for that reason
(THV-640). So every line below names a moment.

**poteto-mode runs every execution.** It opens the brief. Its own triggers already cover
`/architect`, `/interrogate`, `/arena`, `/swarm`, `/how`, `/deslop`, `/no-comments`, `/unslop`,
`/technical-writing` and the control skills, each at its moment. Leave those to poteto-mode and
pick the Thoven lines below that this ticket reaches.

## Thoven moments

| Moment in this ticket | Skill |
| -- | -- |
| The first edit to a component or a design value | `/thoven-designer` |
| Building a component the system does not have, or changing one | `/building-components` |
| Turning a board frame, proto or wireframe into a shipped component | `/design-to-production` |
| Choosing a library for a UI job | `/pick-ui-library` |
| A screen is built, before the parity capture | `/better-ui`, then `/interface-craft` for a taste call |
| Adding or reviewing motion | `/transitions-dev`, `/review-animations` |
| Types or a signature crossing a module | `/typescript-best-practices` |
| A behaviour to pin test-first at a named seam | `/tdd` |
| A user flow to prove end to end | `/qa-flow`, `/playwright-expert` |
| An endpoint, payload or serializer changes | the `api-designer` subagent (Claude Code) |
| Rails model, controller or job code | `/security-review` |
| A migration, index or backfill | `/safe-migrate` |
| Consent, minors' data or parent verification | `/thoven-coppa-vpc-contracts` |
| A mailer or email template | `/thoven-email-system` |
| Render services, env vars or deploys | `/render-cli` and the matching `render-*` skill |
| Why the code is this way before changing it | `/why` |
| Before sending DONE | `/verify` "Before DONE" steps; `/verify-this` for one disputed claim |

## Skills the agent cannot load

`/blast-radius`, `/test-master` and, in Claude Code, `/typescript-best-practices`
set `disable-model-invocation`. When a ticket needs one, tell the pane to read
`~/.claude/skills/<name>/SKILL.md` and follow it.

Name a skill only after checking it exists under `~/.claude/skills/` or `~/.agents/skills/`.
