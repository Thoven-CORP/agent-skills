# thoven-cockpit

A Claude Code mod that shows a herdr space's work in one pane, inside that space's main session. It reads herdr, git, `gh`, the dispatch inbox and Linear. It never writes Linear and never merges.

The design lives in the spec on [THV-1053](https://linear.app/thoven/issue/THV-1053). The layout and copy live in the mock `~/mods/thoven-cockpit-mock.html`.

## What it shows

Run `/cockpit` in a session to make it the space's main and open the pane.

- **Work tab.** One row per ticket, with the columns Pane, Report, Fix, Review, PR, CI and Linear. Work that is not a build goes in the Other list.
- **PRs tab.** The space's PRs in each repo, with state and CI. Press `c` to list the checks that failed or are still running.
  For an open PR, `m` puts `merge it owner/name#n` in the prompt box and `r` puts `/code-review <url>`. Both only fill the box; you send it.
- **All tab.** Every herdr space and its agent panes, this space first. Press a pane to focus it.
- **Health lines.** A source that fails shows as "stale since hh:mm", or "herdr unavailable". The other columns keep updating.

Run `/cockpit doctor` in any session to see:

- every `cockpit:` key in the store, with its age, keys older than 14 days first;
- which session holds main for this space;
- each source's health, in main only;
- the folder the plugin loaded from.

Main deletes a key 14 days after its last write. It also deletes a ticket's keys once its PR has merged, Linear reads Done and the ticket has left the board. A `main:` claim never expires. Nor do the keys a ticket's Linear cell reads (`happened:`, `update:` and `readback:`) while the ticket has a row, so its ↻ does not come back, nor its `send:` and `brief:` keys. A row whose panes have closed keeps every key of its ticket, so its Report and Review cells stay. A parent summary keeps none of the parent's keys. Doctor in main marks the same keys; in any other session it has no board and marks every key past 14 days.

## How it loads

Tested with Claude Code 2.1.289. It loads as a sideloaded mod, `thoven-cockpit@inline`, and `/plugin` shows whether it loaded. Managed `allowManagedModsOnly` or `disableSideloadFlags`, `--safe-mode`, `--bare` and `disableAllHooks` each stop it loading.

Every Claude session loads the mod through `CLAUDE_CODE_PLUGIN_DIRS`. The installer sets it in the `env` block of `~/.claude/settings.json`:

```json
"CLAUDE_CODE_PLUGIN_DIRS": "/Users/andresmartinez/thoven/agent-skills/claude/plugins/thoven-cockpit"
```

It points at the main checkout and never at a worktree, because a worktree link breaks once the worktree is cleaned (ADR2).

```bash
python3 ~/thoven/agent-skills/enforcement/install/claude.py            # dry run
python3 ~/thoven/agent-skills/enforcement/install/claude.py --apply    # write
```

Once the main checkout is pulled, new sessions load the change, and a running session hot-reloads the changed hooks module.

## Develop in a worktree

Start a session on your worktree's copy:

```bash
claude --plugin-dir ~/thoven/agent-skills-thv-<n>/claude/plugins/thoven-cockpit
```

`--plugin-dir` wins over the env var: the main checkout's copy is skipped, and Claude Code prints a line saying so. `/cockpit doctor` names the folder that loaded.

A `--plugin-dir` load writes `.claude-plugin/types/` and `tsconfig.json` into the folder, which the type check needs. Both are gitignored.

## Run the gates

From the plugin folder:

```bash
claude plugin test .
claude plugin validate --strict --json .
~/thoven/frontend/node_modules/.bin/tsc --noEmit --allowImportingTsExtensions -p .
awk 'FNR==601{print FILENAME" is over 600 lines"; bad=1} END{exit bad}' hooks/*.ts
```

`tests/gate.test.ts` fails the build if any process argv holds `merge`, or if any Linear request body holds `mutation`. No file in `hooks/` may pass 600 lines.

For the installer, run `python3 enforcement/install/test_claude.py`. It uses a throwaway HOME under `/tmp`.

## Roll back

Take the cockpit out of `CLAUDE_CODE_PLUGIN_DIRS` and leave the rest of settings alone:

```bash
python3 ~/thoven/agent-skills/enforcement/install/claude.py --rollback           # dry run
python3 ~/thoven/agent-skills/enforcement/install/claude.py --rollback --apply   # write
```

Or delete the `CLAUDE_CODE_PLUGIN_DIRS` line from the `env` block of `~/.claude/settings.json` yourself. New sessions then start without the mod. The keys it left in the store do no harm.
