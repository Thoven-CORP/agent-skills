# Thoven agent skills

Private repo of **Thoven-custom** agent skills. Install once globally; they then work in Cursor, Claude Code, and Codex in every repo — frontend, backend, and everything else.

This is the source of truth. Skills no longer live inside `frontend` / `backend`.

## Who this is for

Anyone at Thoven who uses an AI coding agent on our repos. You need:

1. GitHub access to the `Thoven-CORP` org (this repo is private).
2. Node.js so `npx` works.
3. GitHub auth on your machine (`gh auth login` or SSH keys that can clone this repo).

## Install (once)

```bash
npx skills add Thoven-CORP/agent-skills -g -y \
  -a claude-code -a cursor \
  --skill '*'
```

That copies skills into the canonical `~/.agents/skills/` catalog and links them for Claude Code and Cursor. Codex discovers that canonical catalog directly; do **not** also target `-a codex`, which creates a second model-visible symlink catalog and can exhaust Codex's skills-context budget.

Restart the agent (new Cursor chat / new `claude` session) so it picks them up.

⚠ **Keep the `-a` flags. Do not run the bare `npx skills add … -g -y`.**

Without them the installer auto-detects every agent it can find, including **PromptScript**, which
does not support global installs at all. It then fails **once per skill** and prints a wall of red:

```
Failed to install 99
  ✗ accessibility-check → PromptScript: PromptScript does not support global skill installation
  ✗ api-endpoint        → PromptScript: PromptScript does not support global skill installation
  … ×99
```

**That output is a lie about what happened.** Hit 2026-08-17: all four real targets installed
fine and only the PromptScript link step failed. Nothing is left half-installed. Verify rather
than re-running blind — check any skill you just changed actually landed:

```bash
grep -l "<a line you just added>" ~/.agents/skills/*/SKILL.md \
  ~/.claude/skills/*/SKILL.md ~/.cursor/skills/*/SKILL.md \
  ~/.hermes/skills/*/SKILL.md
```

The canonical hit is what matters for Codex; agent-specific hits confirm the other requested adapters.

## Update after we change skills

Re-run the same install command — **with the `-a` flags**. It overwrites the global copies with
whatever is on `main`.

**Push first.** The installer reads `main` on GitHub, not your local checkout, so an unpushed
commit installs nothing and reports success.

Do **not** run `npx skills remove --all` — that would also wipe third-party skills (GSAP, Neon, Matt Pocock, etc.).

### Keep the model-visible catalog small

After **any** `npx skills add` or update, run:

```bash
bash ~/thoven/agent-skills/scripts/apply-skill-visibility.sh
```

It preserves every installed skill. The Pstack suite, `/qa-flow`, daily Thoven workflows, retained Better/Interface/Transitions/Emil design skills, and the Matt Pocock skills used routinely stay automatically discoverable. The rest move to `~/.agents/skills-on-demand/`, outside Codex’s discovery root, so they cannot exhaust its skills-context budget.

To use a parked package, activate it globally and start a new Codex session:

```bash
bash ~/thoven/agent-skills/scripts/apply-skill-visibility.sh activate sentry-ruby-sdk
```

It remains installed and source-managed. Park it again when finished with `deactivate sentry-ruby-sdk`, or run the normal `sync` command. This is a Codex limitation: the installed version indexes every folder under `~/.agents/skills` and ignores `disable-model-invocation` metadata.

### Pstack composition

Pstack stays third-party and installs from its own source. Thoven skills compose with it rather than copying it here:

- `/poteto-mode` frames nontrivial work; `/how`, `/why`, `/teach`, and `/recall` supply a grounded mental model.
- `/qa-flow` is Thoven's product-verification loop: it chooses realistic state, drives the real user path, and leaves criterion-level evidence.
- `/create-verification-skill` and `/maintain-verification-skill` create and keep a product-specific control surface and Feature Map. When one exists, `/qa-flow` uses it rather than inventing one-off browser scripts.

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
| `/to-prd` | `/to-spec` |
| `/to-issues` | `/to-tickets` |
| `/brainstorm` | `/grill-with-docs` then `/architect` |
| `/investigate` (generic) | `/investigate-thoven` |
| `/dev` (GSD conductor) | retired — `/writing-plans` + `/to-tickets`. `app/dev/` proto routes stay |
| `codebase-memory` (`codebase-memory-mcp`) | `/graphify` + the `graphify` CLI (2026-08-21) |
| `dialkit` | `/interface-craft` — it absorbed dialkit whole (2026-09-03) |

`email-writing` is unchanged — that is outbound email in Andres's voice, not Rails mailers.

Retired bodies live in [`archive/`](./archive/README.md) as `SKILL.md.archived`. The installer only discovers a file named `SKILL.md`, so `npx skills add --skill '*'` and `npx skills update` cannot install or refresh them. Do not put a `SKILL.md` back under `skills/dev/brainstorm`, `skills/dev/investigate`, `skills/dev/dev`, `skills/dev/codebase-memory`, or `skills/dev/dialkit` — `scripts/assert-retired-skills-not-installable.sh` fails if a merge does that.

## Layout

```
skills/dev/    engineering + personal-dev workflows
skills/exec/   executive assistant, outreach, CFO, fundraising
archive/       retired skills — SKILL.md.archived only, never installable
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
3. Open a PR against `main` and hold it. Merge when Andres says. Pushing or merging to `main`: run `/loop-on-ci` and wait for green. `/publish` is still `git push origin main`. Everyone then re-runs the install command above.

Do not add skills by copying them into `frontend/.claude/skills` or `backend/.claude/skills` anymore.

## Help

- Routing (which skill when several match): `frontend/.claude/docs/SKILL_AND_AGENT_ROUTING.md` and `backend/.claude/docs/SKILL_AND_AGENT_ROUTING.md`
- What belongs in this repo: [AGENTS.md](./AGENTS.md)
