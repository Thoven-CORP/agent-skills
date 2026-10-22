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

## Verification contract

No Stop hook validates evidence (retired 2026-10-07, below). A done-claim carries the fresh `bin/verify` block per `skills/andres-mode/SKILL.md`, "Check your own work".

JSON reports under the workspace's exact `~/thoven/archive/` document boundary do not count as code edits. Application JSON, workspace configuration, archived scripts and symlinks crossing that boundary still require verification.

The native runners select checks from the diff and serialize heavyweight runs using one stable kernel lock. Production mutation checks run in private snapshots. Exact first-added verifier owners are bootstrap infrastructure: their owner suites and independent valid-code detector controls are required; deleting a new CLI is setup failure, not a behavior mutation kill. Later edits to those owners enter ordinary mutation selection.

## The hooks

`thoven-track-edits` runs after `Edit`, `Write` and `Bash`. It records which
source files a session touched, including tracked deletions, and keeps a
diagnostic log of check commands under `/tmp/claude-thoven/<session>/`. It reads `git status --porcelain` rather than the
tool arguments, because auto mode writes files with `cat` and heredocs and a hook
watching only `Edit` sees nothing. It injects one line pointing at the
`thoven-designer` skill the first time a component is touched.
A `Bash` call is charged only with the files that changed while it ran: the same script runs
with `--pre` before the call and stamps its start, and `PostToolUse` keeps files newer than
that stamp (the session start when there is none).
It runs after every `Bash` call, so it and the other hooks that read `git status` export
`GIT_OPTIONAL_LOCKS=0`: status then never takes `index.lock` to refresh stat data, which
had been failing other sessions' `git add` and `git commit`.

`thoven-guard-bash` runs before `Bash` and refuses destructive or invalid commands. It denies the unit-test runner's exclude flag, which replaces the
config's exclude array and reports failures that do not exist, and it denies
`git clean`, `git reset --hard`, and `stash`/`checkout`/`restore` against paths
this session did not edit. Worktrees here are shared, and a stash before a rebase
once ate a day of another session's work. A session may undo its own files by
path.

Every pattern it matches is anchored at command position. A substring match
denied this repo's own README, and then denied the edit that fixed it.

`thoven-ticket-recall` runs on `UserPromptSubmit` in Claude and Codex. When a prompt names a
THV ticket, it runs the mem0 plugin's own search for that ticket and injects what comes back. The
plugin searches only on a session's first prompt, and a ticket named mid-session is where earlier
rulings matter most. It reuses the plugin's scope and its per-session "already shown" record, so
nothing is injected twice. It is silent on any failure: recall is a bonus, never a gate.

`thoven-andres-mode` runs on `SessionStart` (startup, clear, compact) in Claude and Codex. For a
session in `~/thoven` or `~`, it tells the agent to read the installed andres-mode skill and prints
its Pitfalls, which both CLIs add to context. It stays near 2 KB: printing the whole 12 KB skill
put it over Claude Code's hook-output limit, which keeps only a 2 KB preview. The skill's description alone did not fire: three main sessions on 2026-10-21 and 10-22
never loaded it. Codex could not have, because `scripts/apply-skill-visibility.sh` had switched it
off; it is now in that script's visible core. `bin/thoven-andres-mode-test` covers it.

`thoven-graph-first` runs before `Grep`, `Glob` and `Bash`. Once per session,
when a search pattern is a bare symbol and the repo has a `graphify-out/` graph,
it notes that the graph traces relationships a text search cannot follow. It is
tool-agnostic on purpose: the same search arrives as a `Grep` call or a `Bash`
command depending on mode, so keying on one tool name is a guess about which gets
picked. Measured over two days in this setup, shell searches outnumbered `Grep`
tool calls 5228 to 0.

`thoven-require-evidence` was retired on 2026-10-07 (THV-1153). It demanded a fresh `bin/verify`
receipt for every edited repo at every `Stop`, which ran far too many checks and could never pass for
files outside a repo. `bin/verify` runs once per slice before DONE, and nothing reruns on push.

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
the env file copied, dependencies installed and backend storage blobs linked. With
`--project`, the first Build ticket cuts the Project's tree instead: `~/thoven/<repo>-<slug>`
on its registry row's branch, else `<slug>/integration`, pushed to origin. A Project branch
counts only when origin has it, so a local-only one (merged and deleted, or never pushed) is
refused, never reused. Git
carries none of those into a new worktree, and Claude's own `--worktree` names
the branch `worktree-<name>`, so both repos wire `hook` mode as Claude's
`WorktreeCreate` and `bootstrap` as Cursor's and the Codex app's setup step. A
generated name (a subagent's `bold-oak-a3f2`) gets a scratch worktree under
`.claude/worktrees/` instead, so isolation keeps working. `bin/thoven-worktree-test`
proves it on throwaway repos.

`bootstrap` also moves a worktree up to `origin/main` when it has no commits and no
edits of its own. Codex desktop cuts a detached worktree from the chosen branch's
local HEAD, and on 2026-09-30 local main was 1430 (frontend) and 570 (backend)
commits behind GitHub. A worktree with work in it is only told how far behind it is.

A backend worktree gets its own test database, `neondb_test_<area>_thv<n>`, or
`neondb_test_wt_<path hash>` off a ticket branch, and `bootstrap` runs
`db:test:prepare` on it. Sessions sharing `neondb_test` truncated each other's data.
The dev database stays shared, reached through `database.yml`'s fallback, because
backend's THV-89 boot guard refuses a branch whose explicit `DATABASE_URL` names
`thoven_development`. When the branch adds a migration (committed against
`origin/main`, or untracked, counted as backend's `worktree_db_guard.rb` counts
them), `bootstrap` copies `thoven_development` to `thoven_dev_<suffix>` and points
`DATABASE_URL` at it. A plain diff would also count the migrations `main` gained
since a stale branch was cut.
A live dev server blocks that copy, so rerun `bootstrap` after adding a migration
with the server stopped. `remove <path>` first copies the tree's gitignored docs
(`.md`, `.mdx`, `.markdown`, `.txt`, `.html`; never `node_modules` or build output)
to `~/thoven/archive/<tree>-<date>/`, because those plans and notes exist nowhere
else, and every untracked file beside them (`.specs/`, `.audit/`) except rebuildable
scratch, then runs `git worktree remove --force`. It refuses, and touches nothing, when
the tree has tracked changes, commits no origin branch holds, or a process working inside
it (a dev server writing during the delete left 176 MB behind). It drops both databases,
and only after `git worktree remove` succeeds. `orphan-dbs` lists the local Thoven databases no
worktree's `.env` names, and drops nothing.

`thoven-worktree post-checkout` is each repo's lefthook `post-checkout` step. It
fires after `git worktree add` from any tool, including a herdr create that did not
go through `thoven-worktree`, and warns when the new HEAD is behind `origin/main`
with no commits of its own. A hook at that point cannot block.

`bin/thoven-load-gate [--slots N] [--min-free PCT] [--max-load N] [--wait SECS] -- <cmd>`
runs a heavy job once a slot is free, system memory free is at least 20% and the
1-minute load is at most 12. Defaults are 2 slots and a 1500 s wait, each overridable
by a `THOVEN_GATE_*` variable. It exits 75 when the wait runs out. `--check-only` waits
on memory and load without taking a slot, and `THOVEN_GATE_DISABLE=1` skips the checks.
`bin/thoven-load-gate-test` proves it with a temp slot directory, no git and no database.

Exit codes:

| Command | Codes |
|---|---|
| `thoven-load-gate` | the command's own code, 2 usage, 75 the wait ran out |
| `thoven-worktree` | 0 created or already exists, 1 failure, 2 usage, 3 refused (read-only or docs-only kind), 4 reuse an existing tree (its path is the last stdout line) |
| `thoven-evidence-dedupe` | 0 success, 1 an apply failure, 2 refused input |
| `bin/verify` (both repos) | the gated command's code, 75 when the gate's wait ran out |

`bin/thoven-exit-codes-test` pins these codes, except 4, with throwaway directories.

`bin/thoven-evidence-dedupe [--apply] <dir>` finds byte-identical files under an
evidence folder (grouped by size, then sha256) and keeps the lexicographically first
path of each group. By default it only prints the duplicates and the reclaimable bytes.
With `--apply` it replaces each duplicate with a hardlink to the kept file, after it
re-checks that both files share a device and a hash. Every path still resolves to the
same bytes, because it never deletes and never makes symlinks. It exits 2 for no
directory, a missing or empty directory, `$HOME`, `/`, or `/Users`, and 1 when any
file fails to link. `bin/thoven-evidence-dedupe-test` proves it in a `mktemp -d` tree.

`bin/thoven-sync` runs every 30 minutes from the launchd agent `co.thoven.sync`,
installed by `install/launchd.py`. It runs `git fetch --prune` in both main
checkouts and fast-forwards each one only when it is on `main` with no tracked changes.
Untracked files do not block it: a fast-forward leaves them alone, and git refuses one that
would overwrite an untracked file, which the log line quotes. When a
fast-forward changes `pnpm-lock.yaml`, it runs `pnpm install --frozen-lockfile`,
unless a dev server (`next`, `vite`) works in that tree or in a worktree whose
`node_modules` links into it; the log line then names the pid and the command. Local main
is never committed on, so it only ever fast-forwards. It lists worktrees with
uncommitted files in `~/.thoven/sync.log` and never touches them. A session-start
trigger was rejected: it fires in every session in any directory, and none fires
before herdr or the Codex app pick their base. `install/gitconfig.py` sets
`fetch.prune`, `push.autoSetupRemote` and `branch.autoSetupMerge=simple` in both
main checkouts. `git maintenance` was left out because its prefetch never moves
`origin/*`.

`thoven-uncommitted` runs at stop. It reads paths recorded by `thoven-track-edits` and asks once per absolute path,
by blocking, about any still uncommitted. Tracking is not proof of ownership:
shell scans can include peer edits in shared worktrees. A partial commit does
not repeat previously raised paths; genuinely new paths still get a warning.
Warnings show at most 12 paths and retain the full absolute-path manifest under
`/tmp/claude-thoven/<session>/uncommitted-pending.paths`. Legacy whole-list
notifications are migrated without repeating them. It never stages or commits. OpenCode's `session.idle` cannot block, so
there it warns. Every tool writes the edit log: Cursor on `afterFileEdit` and
`afterShellExecution`, Devin on `PostToolUse`, OpenCode from the plugin's
`tool.execute.after`.

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

The guard and the edit tracker cross to Cursor, Devin and OpenCode, so the guard
tells a session's own files from another's in all five. Evidence-block enforcement
stays Claude and Codex only.

The two unconditional denies, `git clean` and `git reset --hard`, are also
written into each harness's own permission file, so they hold even where a
hook is skipped. The path-conditional ones need the session's edit record and
stay hook-only.
