# Thoven agent skills

Custom skills for Thoven engineering and executive workflows.

## Install (once, global, all agents)

```bash
npx skills add Thoven-CORP/agent-skills -g -y \
  -a claude-code -a codex -a cursor -a hermes-agent \
  --skill '*'
```

## What this repo is not

Do not add skills from mattpocock/skills, Jeffallan/claude-skills,
neondatabase/agent-skills, greensock/gsap-skills, heygen-com/hyperframes,
or Claude Code plugins (dev-pipeline, team-kit, superpowers).
