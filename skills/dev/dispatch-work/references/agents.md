# Agents: which one runs the ticket

## Tiers

Skills route by tier number. What each tier runs today (CLI, model, effort) lives in
`~/thoven/agent-skills/config/agents.toml`, the one place a model name is written (THV-1077).
Codex, Devin, Cursor and Droid launch only when Andres names one in this session.

| Tier | Work |
| -- | -- |
| 1 | Hard or extremely complex: cross-cutting design, concurrency, a large unit, a fix loop that failed two rounds |
| 2 | Build, design, orchestration, verification |
| 3 | Well-specified multi-file builds where the spec is decided |
| 4 | Easy mechanical bulk writes: transcription plus a test |
| 5 | Quick writes, exploration, comments, Linear updates, monitoring |

`python3 <this skill>/scripts/agents.py tiers` prints what each tier resolves to. A ticket that
needs something outside the tiers gets an explicit CLI, model and effort: `agents.py models <cli>`
and `agents.py efforts <cli> <model>` list the choices. To change a tier, edit its line in
`agents.toml`, run `agents.py check`, and merge it. In herdr, `Ctrl+Space g` does the same from
lists.

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
  independence that matters (Andres, 2026-09-27). A verifier on another CLI runs only when Andres
  asks for a second family.
- Fix rounds follow `review.md` "Handling findings". The fresh round-3 pane is one tier up, told:
  "A prior agent attempted this twice. Read its commits and the findings."

## Launch lines

Every pane launches without approval prompts. A Claude pane uses `--permission-mode auto`, because
the auto-mode classifier blocks `--dangerously-skip-permissions` when main starts the pane.
`dispatch spawn` builds the launch line from `agents.toml` and prints it. Confirm the model on the
pane's first screen. A CLI `agents.toml` lacks shows as unwired in `agents.py clis`; it needs a
`[cli.<name>]` block before it can launch.

## Gotchas by CLI

- **Codex** has no peer messages. It posts its question and report entries and stops; `dispatch
  watch` prints each of those entries, the watcher posts a SETTLED alert when it goes idle, and main
  reads its entry. Send it corrections
  with `dispatch send` once it is idle. Codex shows no status for about 40 seconds at startup,
  then working and idle, never done. It sees only the allowlisted skills: any other skill needs
  `~/thoven/agent-skills/scripts/apply-skill-visibility.sh activate <name>` and a new Codex session.
- **Devin** drops a prompt whose first line is only a slash command. Put the task on the same line
  as `/poteto-mode`, as the brief template does.
