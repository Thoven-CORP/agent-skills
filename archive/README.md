# Archived skills

Retired Thoven-custom skills. **History, not an install source.**

`npx skills` discovers every file named `SKILL.md` under this repo (it walks `archive/` too). Each archived skill therefore keeps its body as `SKILL.md.archived`. That is the whole block: `add --skill '*'`, `add -s brainstorm`, and `update` cannot see these.

| Archived | Live path |
|---|---|
| `brainstorm` | `/grill-with-docs` then `/architect` |
| `investigate` (generic) | `/investigate-thoven` or `/diagnosing-bugs` |
| `dev` (GSD conductor) | retired. Session plan is `/writing-plans`. Slices are `/to-tickets`. `app/dev/` proto routes are unrelated |

Do not move these folders back under `skills/dev/`. Do not rename `SKILL.md.archived` to `SKILL.md`. A merge from an old branch that restores `skills/dev/brainstorm/SKILL.md` (or `investigate` / `dev`) will make `npx skills add --skill '*'` install it again for everyone.

`scripts/assert-retired-skills-not-installable.sh` fails the commit if that happens.

`npx skills update` only refreshes skills already in `~/.agents/.skill-lock.json` whose `skillPath` still exists on GitHub `main`. After these left `skills/dev/`, update cannot revive them. Remove leftover lock rows with `npx skills remove brainstorm investigate dev`.
