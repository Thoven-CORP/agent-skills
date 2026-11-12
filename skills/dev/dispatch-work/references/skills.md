# Skills: the moment each one fires

Read this when you reach one of these moments. Load the skill there; when the Skill tool refuses
it, read its `SKILL.md` in full. poteto-mode routes its own skills; this table adds Thoven's.

| Moment | Skill |
| -- | -- |
| Before the first edit to a component or a design value | `/thoven-designer`, to find the shared component and its call sites in the generated `design/components.md`, `design/tokens.md` and `design/blocks.md`; build on a `current` row. After a component, token module or block changes, it says to run `pnpm run design:catalogue` |
| Building a component the system does not have, or changing one | `/building-components` |
| Before the first React or Next.js implementation edit | `/vercel-react-best-practices` |
| Before building an animation | `/animate`; add `/interface-craft` when it sequences stages or needs live tuning |
| Before implementing a CSS transition | `/transitions-dev` |
| Before implementing keyboard, focus, forms or interactive controls | `/better-accessibility` |
| Before writing customer-facing copy | `/thoven-branding` |
| Placing a sticker, stamp, instrument, icon or hand-drawn mark | `/thoven-art` |
| Building a screen from a Paper, board or Figma frame | `/build-design` |
| A component with four or more reachable states, before DONE | `/state-machine`; the switcher URL rides in the REPORT so Andres can flip every state. The route stays uncommitted and is deleted once he has looked |
| Before the first edit, when the ticket adds or changes a flow that passes the gate in state-brief's When to run and the Project's Architecture document holds no machine for it | `/state-brief`; the transition table and invariants ride in the REPORT |
| Before DONE, when the ticket ran `/state-brief` or its diff adds or changes a status write, a reducer, or two or more flags for one flow | `/state-audit` over the diff; its rating and every Low finding ride in the REPORT |
| A screen is built | `/better-ui` |
| A screen a phone reaches | `/mobile-native`, for what the phone frame does not show |
| Motion is built, before reporting it complete | `/review-animations`, asked to review the changed motion files |
| Before changing shared behaviour, an interface or a contract | `/blast-radius` |
| Before designing a new API contract or redesigning one the ticket names | `/api-designer` |
| Before writing or changing a migration | `/safe-migrate` |
| A change to consent, VPC, activation gates or a parent-facing compliance surface | `/thoven-coppa-vpc-contracts` |
| Writing, changing or auditing a test | `/test-audit` |
| Before a requested test-first change, or a bug fix with an obvious cheap test target | `/tdd` |
| Before reading Sentry, prod SQL, Mixpanel or SendGrid | `~/.agents/skills/investigate-thoven/references/vendor-access.md` for the org, project and tool to use |
| A change affects documented behaviour or setup, before handoff | `/doc-freshness`, scoped to the affected docs |
