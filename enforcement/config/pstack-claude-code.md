# pstack in Claude Code, on Andres's machine

pstack skills use Cursor names. In Claude Code, read this file once per session, then map each Cursor name in a skill with the tables below. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

This is our copy of upstream `pstack/docs/harness/claude-code.md` (cursor/plugins `1b80080058`, 2026-10-17), changed for how pstack is installed here. Upstream assumes the pstack Claude plugin, with a `<pstack>` folder that holds `skills/` and `docs/`. Here `npx skills` installs each pstack skill on its own into `~/.agents/skills/<name>/`, linked from `~/.claude/skills/<name>`, and `docs/` is not installed. `enforcement/hooks/reapply-skill-patches.py` points poteto-mode and poteto-help at this file.

## Tools

| Cursor | Claude Code |
| --- | --- |
| `Task` | `Agent` |
| `AskQuestion` | `AskUserQuestion`. In `-p` mode it is absent, so ask in plain text. |
| Open a todolist | Use `TodoWrite` if the session offers it. Otherwise keep the list in your reply and update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | The `Skill` tool with that name. If it refuses, `Read` `~/.agents/skills/<name>/SKILL.md` and follow it. When you tell the user to type it, write `/<name>`, with no `pstack:` prefix. |
| Cursor's `/loop` command | Claude Code's `/loop` skill. |
| `/visualize` | The **visual-artifacts** skill, and the **dataviz** skill for a chart. |
| A Mermaid diagram | One HTML page built with the **visual-artifacts** skill. Mermaid does not render in this terminal. |
| `Grep`, `Glob` | `Bash` with `rg` when the session has no `Grep` or `Glob`. |

## Subagent fields

| Cursor | Claude Code |
| --- | --- |
| `subagent_type: generalPurpose` | `subagent_type: "general-purpose"` |
| `poteto-agent` | `subagent_type: "poteto-agent"`, defined in `~/.claude/agents/poteto-agent.md`. |
| `comment-sicko` | Not installed here. Use `general-purpose`, and say so. |
| `readonly: true` | `subagent_type: "Explore"`. It keeps `Bash`, so the brief also says "do not edit files", and you check `git status` afterward. |
| `readonly: false` | `general-purpose`. It keeps the session's MCP servers. |
| `environment: "cloud"` | `isolation: "worktree"`. Name the branch or commit the worker checks out. |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Tell the worker to check out `<b>` first. |
| `run_in_background: true` | Omit. Subagents run in the background by default and notify you when they finish. |
| `resume` | `SendMessage` to the earlier agent when it is still listed. Otherwise spawn a new agent and paste the earlier result into its brief. |
| `file_attachments` | List the paths in the brief. |

## Models

`~/.claude/pstack-models.md` is the model policy here. `~/.claude/CLAUDE.md` tells every session to read it before pstack work or any delegation. Its tiers and role table override every slug a pstack skill names, and it sets `model` and `effort` on each Agent call.

| Cursor | Claude Code |
| --- | --- |
| A slug a skill names, Claude or not (`claude-opus-5-5-xhigh`, `grok-4.7-xhigh-fast`, `gpt-*`) | The role's row in `~/.claude/pstack-models.md`, such as `sonnet` at `high` for swarm workers. A role with no row takes the difficulty tier that fits the job. |
| `auto` or `inherit-parent` | The role's row in `~/.claude/pstack-models.md`. Never silently inherit Opus for routine work. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.claude/pstack-models.md`. There is no `~/.claude/rules/pstack-models.md`. |

## setup-pstack

Do not run its write step in Claude Code. Andres sets the policy in `~/.claude/pstack-models.md` by hand, and a generated `~/.claude/rules/pstack-models.md` would be a second policy that disagrees with it. To change a role or the budget, edit `~/.claude/pstack-models.md`.

## Paths

| Cursor | Claude Code |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `~/.agents/skills/` holds the skills; `~/.claude/skills/` links to them. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `~/.claude/plugins/`, `.claude-plugin/plugin.json` |
| `.cursor/rules/*.mdc`, always-applied rules | `CLAUDE.md`, or `AGENTS.md` when no `CLAUDE.md` exists. Claude Code never reads `.mdc` files. |
| A file a skill links outside its own folder, such as `../../docs/...` | Not installed. Give the user `https://github.com/cursor/plugins/blob/main/pstack/<path>`. To read it, `gh api repos/cursor/plugins/contents/pstack/<path> --jq .content \| base64 -d`. |
| `control-ui`, `control-cli`, `deslop` from `cursor-team-kit` | The installed `control-ui`, `control-cli` and `deslop` skills. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `~/.claude/projects/<slug>/<session>.jsonl`. The slug is the workspace path with each `/` and `.` changed to `-`, so `/Users/you/proj` is `-Users-you-proj`. The newest `.jsonl` directly in that folder is the current session. Its `<session>/subagents/` folder holds subagent transcripts. Read only this workspace's folder. |

## Cursor-only features

Claude Code has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in Claude Code: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | Claude Code |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the forge command that the step gives. Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `environment: "cloud"` maps to a worktree, as in Subagent fields. Skip a step that needs the cloud agent itself, such as its dashboard status or its own machine. |
| Cursor's built-in babysit skill | Not present. The poteto-mode Babysit playbook applies. |
| A built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. That is not a skip, so write no line. |
