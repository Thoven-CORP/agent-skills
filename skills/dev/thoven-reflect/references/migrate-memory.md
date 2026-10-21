# Migrate memory into skills

Claude memory reaches only Claude main sessions in one project directory. A skill reaches Claude, Codex, panes and subagents in every repo. So a memory that tells an agent *how to do a kind of work* belongs in the skill that owns that work. Memory keeps what is *about* Andres or a live project.

## 1. Inventory

```bash
ls ~/.claude/projects/*/memory/feedback_*.md
```

Done when you have the full list with counts per project directory.

## 2. Classify

Split the list into batches of about 45 files. Dispatch one `Agent` per batch (`subagent_type: general-purpose`, `model: sonnet`). Each agent reads its files and the skill names under `~/thoven/agent-skills/skills/`, then returns one row per file:

| File | Destination | Target | Pitfall line |
|---|---|---|---|
| `feedback_<topic>.md` | `skill` / `andres-mode` / `root` / `stays` / `delete` | skill name, or why it stays or goes | the positive one-line rule, or `-` |

- `skill`: names a workflow one Thoven skill owns (dispatch briefs, verification, design research, worktrees).
- `andres-mode`: how Andres works in general, or a lesson about a third-party skill.
- `root`: spans several skills.
- `stays`: a fact about Andres, a project, or a pointer to an external resource.
- `delete`: stale, contradicted by a newer memory, or already a step in the target skill. Name the newer source.

Done when every file has exactly one row.

## 3. Approve

Show the merged table grouped by target. Ask with `AskUserQuestion`: apply all, apply named groups, or none.

## 4. Apply

For each approved row:

1. Add a `LEARNINGS.md` entry to the target skill, using the entry shape in `SKILL.md`. In the header, use `memory:<file stem>` as the session id and the memory's date.
2. Add the Pitfall line if the memory changes a decision the skill makes. Respect the ten-line cap. When the skill's body already performs the rule, skip the Pitfall line.
3. Delete the memory file and its line in `~/.claude/projects/<project>/memory/MEMORY.md`, or in `~/.claude/projects/<project>/memory/INDEX_ARCHIVE.md` when the index was archived.

Commit the skill edits as in step 5 of `SKILL.md`. Memory deletions are local and need no commit.

Done when every approved file is gone from memory and present in a skill, and no index line in `~/.claude/projects/<project>/memory/` points at a missing file.
