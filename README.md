# Thoven agent skills

Private repo of **Thoven-custom** agent skills. Install once globally; they then work in Cursor, Claude Code, Codex, and Hermes in every repo — frontend, backend, and everything else.

This is the source of truth. Skills no longer live inside `frontend` / `backend`.

## Who this is for

Anyone at Thoven who uses an AI coding agent on our repos. You need:

1. GitHub access to the `Thoven-CORP` org (this repo is private).
2. Node.js so `npx` works.
3. GitHub auth on your machine (`gh auth login` or SSH keys that can clone this repo).

## Install (once)

```bash
npx skills add Thoven-CORP/agent-skills -g -y \
  -a claude-code -a codex -a cursor -a hermes-agent \
  --skill '*'
```

That copies skills into `~/.agents/skills/` and links them for each agent.

Restart the agent (new Cursor chat / new `claude` session) so it picks them up.

## Update after we change skills

Re-run the same install command. It overwrites the global copies with whatever is on `main`.

Do **not** run `npx skills remove --all` — that would also wipe third-party skills (GSAP, Neon, Matt Pocock, etc.).

## How to use them

In Claude Code / Cursor, invoke by name:

```
/qa-flow
/publish
/verify
/thoven-email-system
/doc-freshness
```

Or ask in plain English ("run thorough QA before publish") — the skill descriptions are what the agent matches on.

### Nested skills (one name, two workflows)

These detect which repo you are in and load only that side:

| Skill | Backend (Rails / `Gemfile`) | Frontend (Next.js App Router) |
|---|---|---|
| `publish` | BE release | FE release |
| `verify` | BE completion checks | FE completion checks |
| `orchestrate` | BE routing | FE routing |
| `prompt-generator` | BE prompts | FE prompts |
| `doc-freshness` | BE docs | FE docs |

If detection is ambiguous, the skill asks once.

### Renames (old → new)

| Old | New |
|---|---|
| `/manual-qa` | `/qa-flow` |
| `/email` (mailers) | `/thoven-email-system` |
| `docs-freshness` | `doc-freshness` |

`email-writing` is unchanged — that is outbound email in Andres's voice, not Rails mailers.

## Layout

```
skills/dev/    engineering + personal-dev workflows
skills/exec/   executive assistant, outreach, CFO, fundraising
```

Each skill is `skills/<bucket>/<name>/SKILL.md` plus optional `references/`, `scripts/`, `templates/`.

## What this repo is not

Do **not** copy third-party or plugin skills in here. Those stay where they already install from:

- `mattpocock/skills`, `Jeffallan/claude-skills`
- `neondatabase/agent-skills`, `greensock/gsap-skills`, `heygen-com/hyperframes`
- Claude Code plugins: `dev-pipeline`, `team-kit`, `superpowers`

Frontend/backend still keep **lockfile** copies of Neon / GSAP where the product needs them. Do not `git rm` those.

## Adding or changing a skill

1. Edit or add the folder under `skills/dev/` or `skills/exec/`.
2. Frontmatter `name:` must match the folder name.
3. PR to `main`. After merge, everyone re-runs the install command above.

Do not add skills by copying them into `frontend/.claude/skills` or `backend/.claude/skills` anymore.

## Help

- Routing (which skill when several match): `frontend/.claude/docs/SKILL_AND_AGENT_ROUTING.md` and `backend/.claude/docs/SKILL_AND_AGENT_ROUTING.md`
- What belongs in this repo: [AGENTS.md](./AGENTS.md)
