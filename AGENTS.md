# Agent skills repo

- `skills/dev/`: Thoven engineering and personal-dev workflow.
- `skills/exec/`: executive assistant, outreach, CFO, fundraising.
- `archive/`: retired skills (`SKILL.md.archived` only), never installable. See `archive/README.md`.

Nested BE/FE skills (one name, two workflows): `publish`, `orchestrate`, `prompt-generator`, `doc-freshness`. Detect Rails or Next.js and load only the matching `references/` file.

This repo takes no PRs and runs no CI: commit exact paths in a worktree cut from `origin/main`, `git push origin HEAD:main`, then reinstall (README). Never copy third-party npx or plugin skills into this repo.

## How we write

Everything an agent reads (skills, the law, CLAUDE.md, DESIGN.md, briefs) follows these rules. Agents write it; use `writing-for-agents` and poteto-mode's "Authoring a skill" playbook.

- Teach how to do the work. A check belongs in code (types, lint, a test), and the doc names it in one line.
- Be strict. Write the number or the named thing: "under 300 ms", "`ThovenDialog`". Never "reasonably", "where appropriate" or "tasteful": the agent cannot act on them.
- Give the why in one clause when the rule would be misapplied without it. A rule with its reason extends to cases nobody wrote down.
- Every line changes what the agent does. Cut what the agent already knows.
- One home per fact. Point at it; never copy it. Values live in code, and docs name them.
- "Always" and "never" mark the rules that matter. Use them for nothing else.
- One job per skill, named verb-object: `check-build`, `qa-product`.

## Skill shape

- `SKILL.md` is a router of about 80 lines. Each branch loads one file from `references/`, named by its trigger.
- A standards doc is referenced by heading, never copied.
- Build the feedback loop first: name the command that goes red when the work is wrong.
- Each step ends on "Done when", a condition the agent can check.
- Report, then stop. One root cause is one finding, with every location.
- A repeated mechanic is a script in the skill folder; the prose says when to run it.
- Before it lands, run the skill on 2 or 3 real prompts with and without it, and keep it only if the run with it is better.
