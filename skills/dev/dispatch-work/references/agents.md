# Agents: which one runs the ticket

## The harness picks the family

Main runs in either Claude Code or Codex CLI. That harness decides the model family for tiers 1, 2
and 4, so a pane speaks the same skill syntax and reads the same skill installs as main. Tier 3 is
the same in both.

| Tier | Work | Claude Code main | Codex CLI main |
| -- | -- | -- | -- |
| 1 | Hard or extremely complex: cross-cutting design, concurrency, a large unit, a fix loop that failed three rounds | Fable, high | Astra (`gpt-6-astra`), high |
| 2 | Build, design, orchestration, verification | Opus 5.5 (`claude-opus-5-5`), high | Sol (`gpt-6-sol`), high |
| 3 | Easy mechanical bulk writes, quick work | Devin SWE-2, or Cursor Grok 4.7 high fast | same |
| 4 | Quick writes, exploration, comments, Linear updates, monitoring | Sonnet (`claude-sonnet-5`) | Luna (`gpt-6-luna`) |

Opus 5 is retired. Pick a tier-2 model instead.

## Complexity signals

- One or two files and a complete spec: tier 3.
- Several files with integration between them, or a UI surface: tier 2.
- Design judgment, broad codebase understanding, or a problem two tier-2 attempts could not close:
  tier 1.
- Fewer turns beats a cheaper token. A cheap model that takes three times the turns costs more.
  Tier 3 is for work that is transcription plus a test.

## Verifier and fix rounds

- The verifier runs on the other family, or one tier above the builder when the other family is
  not available. Agreement across families is the signal worth having.
- Fix rounds 1 to 3 go back to the builder's pane. Rounds 4 and 5 go to a fresh pane one tier up,
  told: "A prior agent attempted this N times. Read its commits and the findings."

## Launch lines

Every pane launches with its permissions bypassed. Put the model id in the flag, then confirm it on
the pane's first screen.

| CLI | herdr kind | Launch arguments after `--` | Skill prefix |
| -- | -- | -- | -- |
| Claude Code | `claude` | `--model <id> --effort high --dangerously-skip-permissions` | `/skill` |
| Codex CLI | `codex` | `-m <id> -c model_reasoning_effort="high" --dangerously-bypass-approvals-and-sandbox` | `$skill` |
| Devin | `devin` | `--model swe-2-high --permission-mode dangerous` | `/skill` |
| Cursor | `cursor` | `--model <grok-4.7 high fast id> --force` | `/skill` |

`herdr agent start <name> --kind <kind> --pane <pane> -- <arguments>` starts it. Tier-3 model ids:
`devin models`, `cursor-agent --list-models`.

## Gotchas by CLI

- **Devin** drops a prompt whose first line is only a slash command. Put the task on the same line
  as `/poteto-mode`.
- **Cursor** has no Linear MCP. Paste the ticket's Acceptance, Paths and Done when into the brief.
- **Codex** sees only the allowlisted skills. Any other skill needs
  `~/thoven/agent-skills/scripts/apply-skill-visibility.sh activate <name>` and a new Codex session.
- **Any CLI:** a skill with `disable-model-invocation` cannot be loaded by the agent. Tell the pane
  to read that skill's `SKILL.md` and follow it.
