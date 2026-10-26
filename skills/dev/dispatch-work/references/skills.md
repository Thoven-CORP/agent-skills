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
| Before the first `.ts` or `.tsx` edit | `/typescript-best-practices` |
| Before the first React or Next.js implementation edit | `/vercel-react-best-practices` |
| Before implementing a React interaction or animated interface | `/interface-craft` |
| Before implementing a CSS transition | `/transitions-dev` |
| Before implementing keyboard, focus, forms or interactive controls | `/better-accessibility` |
| Before writing customer-facing copy | `/thoven-branding` |
| A screen is built, before the parity capture | `/better-ui` |
| Motion is built, before reporting it complete | `/review-animations`, asked to review the changed motion files |
| Before changing shared behaviour, an interface or a contract | `/blast-radius` |
| Before designing a new API contract or redesigning one the ticket names | `/api-designer` |
| Writing, changing or auditing a test | `/test-audit` |
| Before a requested test-first change, or a bug fix with an obvious cheap test target | `/tdd` |
| A specific claim is disputed or lacks evidence | `/verify-this`, scoped to that claim |
| A change affects documented behaviour or setup, before handoff | `/doc-freshness`, scoped to the affected docs |
| During edits and before sending DONE | `/verify`, targeted checks for this diff; full `bin/verify` only on Andres's request or once at the parent before integration into `main` |

Check each selected skill exists in `~/.agents/skills/` and is loadable in the builder's harness.
Use the loading procedure in brief.md. A missing skill is a named access gap to resolve before
dispatch. Invocation counts show execution gaps; they do not decide which skills belong here.
