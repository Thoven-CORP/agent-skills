# Enforcement

Hooks, agent definitions and the config that drives them, tracked here and
copied out to each harness. This directory is the source of truth. Everything
under `~/.claude/`, `~/.codex/`, `~/.cursor/` and `~/.config/{devin,opencode}/`
is a copy.

## Why the repo is the source

A hook is a program the harness runs at a fixed moment, and its exit code decides
what happens next. The model never chooses to call one and cannot skip one. That
is why they exist, and also why a stale copy is dangerous: nothing reports it.

On 2026-09-18 the Claude copy of `thoven-require-evidence` was rewritten and the
Codex copy was not. Codex kept running the old version. Four copies of each hook
existed across the machine and two were stale. `sync.sh` exists so that cannot
recur.

```
./sync.sh          report drift, write nothing, exit 1 if any
./sync.sh --apply  overwrite each harness copy from this repo
```

It only touches a file a harness already has, so it never installs a hook into a
harness that was not running it.

## The rule

**A hook may ask for a statement, or refuse a destructive command. It may not
require work.**

That rule was bought on 2026-09-18. `thoven-require-evidence` used to demand an
artifact under `test-results/` before letting a done-claim through. A type-check
and a lint finish in seconds and write no file, so satisfying it meant reaching
for a tool that does. One session stood up dev servers on three ports, drove a
real browser, and ran 718 unit tests. Another left a Ruby suite hung for 27
minutes. Three parallel panes did this within seven minutes of each other,
because nothing coordinates panes.

The same day, `thoven-track-edits` was injecting "prove the change with a browser
test" on every component edit. Two hooks were pushing the same expensive tool
from different directions.

It asks a question now. A question costs nothing, so parallel panes need no lock,
and an honest answer was the signal wanted all along.

## The hooks

`thoven-track-edits` runs after `Edit`, `Write` and `Bash`. It records which
source files a session touched and which check commands it ran, under
`/tmp/claude-thoven/<session>/`. It reads `git status --porcelain` rather than the
tool arguments, because auto mode writes files with `cat` and heredocs and a hook
watching only `Edit` sees nothing. It injects one line pointing at the
`thoven-designer` skill the first time a component is touched.

`thoven-guard-bash` runs before `Bash` and is the only hook that refuses
anything. It denies the unit-test runner's exclude flag, which replaces the
config's exclude array and reports failures that do not exist, and it denies
`git clean`, `git reset --hard`, and `stash`/`checkout`/`restore` against paths
this session did not edit. Worktrees here are shared, and a stash before a rebase
once ate a day of another session's work. A session may undo its own files by
path.

Every pattern it matches is anchored at command position. A substring match
denied this repo's own README, and then denied the edit that fixed it.

`thoven-graph-first` runs before `Grep`, `Glob` and `Bash`. Once per session,
when a search pattern is a bare symbol and the repo has a `graphify-out/` graph,
it notes that the graph traces relationships a text search cannot follow. It is
tool-agnostic on purpose: the same search arrives as a `Grep` call or a `Bash`
command depending on mode, so keying on one tool name is a guess about which gets
picked. Measured over two days in this setup, shell searches outnumbered `Grep`
tool calls 5228 to 0.

`thoven-require-evidence` runs at `Stop`. On a session that edited source,
claimed done, and ran no check, it asks once what was run and what it returned.
"No check run" is an accepted answer. It has eight ways to stay silent and one to
speak.

`graph-session-reminder` runs at `SessionStart` and says nothing unless this
repo's graph is more than seven days behind its last commit, in which case it
names the gap in days and the rebuild command.

`reapply-skill-patches.py` runs at `SessionStart`. `npx skills update` overwrites
the skill trees, so this puts local fixes back: non-kebab frontmatter names,
string patches across `SKILL.md` and its playbooks, whole-file overrides from
`skill-overrides/`, and the model-invocation allowlist in
`config/skills-invocable.txt`. It reads the router's own text each run, so an
upstream update that adds a route unblocks that route too. Idempotent, and silent
unless it changed something.

## Config

`config/skills-invocable.txt` lists skills the model may invoke on its own, one
per line. Everything unlisted and not named by a router stays blocked, which is
what keeps the always-loaded description list small. All 344 skills unblocked
costs roughly 34,800 tokens of descriptions every turn. The current list costs
roughly 8,500.

`config/deny.json` lists the guard's unconditional denies. Each installer renders
it into its harness's permission file, and Codex gets it as `rules/thoven.rules`.

`rules/thoven-law.md` is the cross-repo law. `install/law.py` writes it between
markers into each repo's `CLAUDE.md`, and `sync.sh` reports when a copy is stale.

`skill-overrides/<slug>.SKILL.md` replaces that skill's file in every tree
whenever upstream's copy returns. Use it for a rewrite that a string patch cannot
restore.

## Agents

`agents/` holds `verifier`, which has no write tools at all, `poteto-agent`,
which `poteto-mode` dispatches throughout its playbooks, plus `explorer` and
`ui-builder`.

`thermo-nuclear-review-subagent` and `thermo-nuclear-code-quality-review-subagent`
are cursor/plugins' `thermos/agents/` files, kept under upstream's names so the
npx-installed `/thermos` dispatches them unpatched. `npx skills` installs skills
only, never agents, so these are the one upstream piece copied by hand. Only the
Cursor-specific orchestration line is rewritten.

## pstack and cursor-team-kit skills

`deslop`, `verify-this`, `weekly-review`, `poteto-mode` and the three thermo
skills come from cursor/plugins through `npx skills`, and nowhere else. The
`thoven-dev` marketplace's `team-kit` plugin was a fork of these and is retired:
it put a second copy of each in the slash menu as `team-kit:<name>`. Local
changes to upstream skills live here, as a string patch in
`reapply-skill-patches.py`, a whole-file `skill-overrides/` entry, or a line in
`config/skills-invocable.txt`. Never in a forked copy.

## Worktrees

`bin/thoven-worktree create <fe|be> <area> <n>` is the one way a ticket worktree
gets made: `~/thoven/<repo>-thv-<n>` on `<area>/thv-<n>` from `origin/main`, with
the env file copied, dependencies installed and backend storage blobs linked. Git
carries none of those into a new worktree, and Claude's own `--worktree` names
the branch `worktree-<name>`, so both repos wire `hook` mode as Claude's
`WorktreeCreate` and `bootstrap` as Cursor's and the Codex app's setup step. A
generated name (a subagent's `bold-oak-a3f2`) gets a scratch worktree under
`.claude/worktrees/` instead, so isolation keeps working. `bin/thoven-worktree-test`
proves it on throwaway repos.

## Harness coverage

`thoven-guard-bash` is one script with three output dialects, and every harness
here runs it from its own copy, kept in step by `sync.sh`.

Claude Code and Codex run it on `PreToolUse` for `Bash` in the default dialect,
installed by `install/claude.py` and `install/codex.py`, and they run the other
hooks too. Codex's hook schema is identical to Claude Code's.

Cursor runs it on `beforeShellExecution` with `--dialect cursor`, which reads the
top-level `command` and answers `{"permission":"deny"}`. Cursor staff say the
`cursor-agent` CLI fires that event too (forum, 2026-04-12); the docs do not.
`install/cursor.py` wires it into `~/.cursor/hooks.json` beside the orca and herdr entries.

Devin runs it on `PreToolUse` with matcher `^exec$` and `--dialect devin`. Devin
sends no `cwd`, so the guard falls back to `DEVIN_PROJECT_DIR`, and Devin blocks
only on exit 2. Its config sets `read_config_from.claude=false`, so it never sees
Claude's entries; `install/devin.py` writes its own into
`~/.config/devin/config.json`.

OpenCode has no shell-hook format. `opencode/thoven-guard.js` is a plugin whose
`tool.execute.before` feeds the guard a Claude-dialect payload and throws on a
deny. If the guard fails to run, the command proceeds, as it does in every other
harness when a hook errors. `install/opencode.py` installs both.

Only the guard crosses to Cursor, Devin and OpenCode. The edit tracker and the
evidence question stay Claude and Codex only. Without the tracker the guard
cannot tell a session's own files from another's, so in those three it refuses
a path-scoped stash, checkout or restore too. Commit is the way out there.

The two unconditional denies, `git clean` and `git reset --hard`, are also
written into each harness's own permission file, so they hold even where a
hook is skipped. The path-conditional ones need the session's edit record and
stay hook-only.
