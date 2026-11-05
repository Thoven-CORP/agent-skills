# Skills: the moment each one fires

A skill line names an action the builder reaches in this ticket and the skill to load there.
Copy only applicable rows into ACCESS, with the affected files or claim named.

**poteto-mode owns the process.** FIRST TURN in [brief.md](brief.md) loads it explicitly for
Claude Code or Codex. The builder follows the installed native playbook, including its routed
skills. ACCESS adds the ticket-specific moments below. Skills already routed by the playbook
stay there rather than being repeated in ACCESS.

## Thoven moments

| Moment in this ticket | Skill |
| -- | -- |
| The first edit to a component or a design value | `/thoven-designer` |
| Building a component the system does not have, or changing one | `/building-components` |
| Before the first React or Next.js implementation edit | `/vercel-react-best-practices` |
| Before building an animation | `/animate`; add `/interface-craft` when it sequences stages or needs live tuning |
| Before implementing a CSS transition | `/transitions-dev` |
| Before implementing keyboard, focus, forms or interactive controls | `/better-accessibility` |
| Before writing customer-facing copy | `/thoven-branding` |
| Placing a sticker, stamp, instrument, icon or hand-drawn mark | `/thoven-art` |
| Building a screen from a board frame or Figma frame | `/build-design`; its Design / Built / Status table rides in the REPORT beside the parity grid |
| A component with four or more reachable states, before the first DONE | `/state-machine`; the switcher URL rides in the REPORT so Andres can flip every state. The route stays uncommitted and is deleted once he has looked |
| Before the first edit, when the ticket adds or changes a flow that passes the gate in state-brief's When to run and the Linear parent holds no machine for it | `/state-brief`; the transition table and invariants ride in the first REPORT |
| Before the first DONE, when the ticket ran `/state-brief` or its diff adds or changes a status write, a reducer, or two or more flags for one flow | `/state-audit` over the diff; its rating and every Low finding ride in the REPORT |
| A screen is built, before the parity capture | `/better-ui` |
| A screen a phone reaches, before the 390 capture | `/mobile-native` |
| Motion is built, before reporting it complete | `/review-animations`, asked to review the changed motion files |
| Before changing shared behaviour, an interface or a contract | `/blast-radius` |
| Before designing a new API contract or redesigning one the ticket names | `/api-designer` |
| Before writing or changing a migration | `/safe-migrate` |
| A change to consent, VPC, activation gates or a parent-facing compliance surface | `/thoven-coppa-vpc-contracts` |
| Writing, changing or auditing a test | `/test-audit` |
| Before a requested test-first change, or a bug fix with an obvious cheap test target | `/tdd` |
| Before reading Sentry, prod SQL, Mixpanel or SendGrid | `~/.agents/skills/investigate-thoven/references/vendor-access.md` for the org, project and tool to use |
| A specific claim is disputed or lacks evidence | `/verify-this`, scoped to that claim |
| A change affects documented behaviour or setup, before handoff | `/doc-freshness`, scoped to the affected docs |
| Each changed behaviour, at the first DONE and in every fix round | `/verify-this`, one claim per behaviour; a fix round re-verifies only the claims it changed |
| The first DONE | `/verify`'s check list once, through `/remote-check` on a `laptop` host; full `bin/verify` only on Andres's request or once at the parent before integration into `main` |

Before dispatch, run `~/thoven/agent-skills/scripts/check-skill-routes.sh` on the filled brief; every
ACCESS skill prints `ok`. A skill off the invocable list still loads: brief.md's loading step reads its
SKILL.md when the Skill tool refuses it. Use the loading procedure in brief.md. A missing skill is a named access gap to resolve before
dispatch. Invocation counts show execution gaps; they do not decide which skills belong here.
