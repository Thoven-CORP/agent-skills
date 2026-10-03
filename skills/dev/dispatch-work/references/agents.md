# Agents: which one runs the ticket

## Tiers

Skills route by tier number. What each tier runs today (CLI, model, effort) lives in
`~/thoven/agent-skills/config/agents.toml`, the one place a model name is written (THV-1077).

| Tier | Work |
| -- | -- |
| 1 | Hard or extremely complex: cross-cutting design, concurrency, a large unit, a fix loop that failed three rounds |
| 2 | Build, design, orchestration, verification |
| 3 | Well-specified multi-file builds where the spec is decided |
| 4 | Easy mechanical bulk writes: transcription plus a test |
| 5 | Quick writes, exploration, comments, Linear updates, monitoring |

`python3 <this skill>/scripts/agents.py tiers` prints what each tier resolves to. A ticket that
needs something outside the tiers gets an explicit CLI, model and effort: `agents.py models <cli>`
and `agents.py efforts <cli> <model>` list the choices. To change a tier, edit its line in
`agents.toml`, run `agents.py check`, and merge it. From herdr, `Ctrl+Space g` does the same from
lists: set a tier, wire a new CLI, or check the config. It merges the change and pulls the checkout.

## Complexity signals

- One or two files and a complete spec: tier 4.
- Several files and a decided spec, with no design call left: tier 3.
- Several files with integration between them, or a UI surface: tier 2.
- Design judgment, broad codebase understanding, or a problem two tier-2 attempts could not close:
  tier 1.
- Fewer turns beats a cheaper token. A cheap model that takes three times the turns costs more.
  Tier 4 is for work that is transcription plus a test.

## Verifier and fix rounds

- The verifier is a fresh tier-2 pane that did not build the ticket. A fresh pane is the
  independence that matters (Andres, 2026-09-27). The cockpit mod (THV-1053) sees which review
  skills ran only in Claude panes, so a verifier on another CLI shows a partial Review cell. Use
  one when Andres asks for a second family.
- Fix rounds 1 to 3 go back to the builder's pane. Rounds 4 and 5 go to a fresh pane one tier up,
  told: "A prior agent attempted this N times. Read its commits and the findings."

## Launch lines

Every pane launches with its permissions bypassed. `agents.py launch-line <tier>` prints the
`herdr agent start` line, with the model, the effort and the bypass flag filled in from
`agents.toml`. Confirm the model on the pane's first screen. A CLI herdr runs but `agents.toml`
lacks shows as unwired in `agents.py clis`; it needs a `[cli.<name>]` block before it can launch.

## Gotchas by CLI

- **Devin** drops a prompt whose first line is only a slash command. Put the task on the same line
  as `/poteto-mode`.
- **Cursor** has no Linear MCP. Paste the ticket's Acceptance, Paths and Done when into the brief.
- **Codex** sees only the allowlisted skills. Any other skill needs
  `~/thoven/agent-skills/scripts/apply-skill-visibility.sh activate <name>` and a new Codex session.
- **Any CLI:** a skill with `disable-model-invocation` cannot be loaded by the agent. Tell the pane
  to read that skill's `SKILL.md` and follow it.
