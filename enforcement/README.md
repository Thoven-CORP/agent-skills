# Enforcement

Hooks, agent definitions and the config that drives them, tracked here and
copied out to each harness. This directory is the source of truth. Everything
under `~/.claude/`, `~/.codex/` and `~/.cursor/` is a copy.

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

## Harness coverage

Claude Code and Codex both run these hooks from their own copies, kept in step by
`sync.sh`. Cursor runs one unrelated `sessionStart` hook and has never run these.
Devin has no hook configuration. Codex's hook schema is identical to Claude
Code's. Cursor's differs, which is why the hook half stays unwired there.
