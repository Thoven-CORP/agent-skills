# Migrate memory into skills

Claude memory reaches only Claude main sessions in one project directory. A skill reaches Claude, Codex, panes and subagents in every repo. So a memory that tells an agent *how to do a kind of work* belongs in the skill that owns that work. Memory keeps what is *about* Andres or a live project.

## 1. Inventory

```bash
grep -l '^ *type: feedback' ~/.claude/projects/*/memory/*.md
```

The type in the frontmatter decides, not the filename: a feedback memory can have any name. Done when you have the full list with counts per project directory.

## 2. Classify

Split the list into batches of about 45 files. Dispatch one `Agent` per batch (`subagent_type: general-purpose`, `model: sonnet`). Each agent reads its files and the skill names under `~/thoven/agent-skills/skills/`, then returns one row per file:

| File | Destination | Target | Pitfall line |
|---|---|---|---|
| `<memory>.md` | `skill` / `andres-mode` / `root` / `stays` / `delete` / `conflict` | skill name, or why it stays or goes | the positive one-line rule, or `-` |

- `skill`: names a workflow one Thoven skill owns (dispatch briefs, verification, design research, worktrees).
- `andres-mode`: how Andres works in general, or a lesson about a third-party skill.
- `root`: spans several skills.
- `stays`: a fact about Andres, a project, or a pointer to an external resource.
- `delete`: stale, about a project that has shipped or been archived, or already a step in the target skill. Name the skill or file that replaces it, never another memory row.
- `conflict`: two memories give opposite rules and neither has clearly replaced the other. Name both files. Andres picks the winner at the approval step; the loser becomes `delete`.

Done when every file has exactly one row.

## 3. Approve

Show the merged table grouped by target, with the `conflict` rows first. Ask with `AskUserQuestion`: one question per conflict, then apply all, apply named groups, or none.

## 4. Apply

For each approved row:

1. Add a `LEARNINGS.md` entry to the target skill, using the entry shape in `SKILL.md`. In the header, use `memory:<file stem>` as the session id and the memory's date.
2. Add the Pitfall line if the memory changes a decision the skill makes. Follow the `pitfall:` row in `SKILL.md`, cap included: when a skill draws more rows than its Pitfalls block can hold, the most decision-changing get lines and the rest become `step:` edits in their sections. When the skill's body already performs the rule, skip the Pitfall line.
3. Delete the memory file and its line in `~/.claude/projects/<project>/memory/MEMORY.md`, or in `~/.claude/projects/<project>/memory/INDEX_ARCHIVE.md` when the index was archived.

Commit the skill edits as in step 5 of `SKILL.md`. Memory deletions are local and need no commit.

Done when every approved file is gone from memory and present in a skill, and no index line in `~/.claude/projects/<project>/memory/` points at a missing file.
