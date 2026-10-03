# Fixtures

Each `.ts` file exports real text as string constants, copied byte for byte from the source
named in the constant's comment. A test has no file access, so embedding is the only way.
Nothing here is hand-made; a case that needs a shape no log holds is an open gap, not a fixture.

| File | Constants | Source |
|---|---|---|
| `herdr.ts` | `SNAPSHOT_LIVE`, `PANE_GET_P8W`, `TAB_GET_T45` | `/tmp/cockpit-fixtures/herdr/{snapshot-live,pane-get-sample,tab-get-sample}.json` |
| `workflow.ts` | `WORKFLOW_LIVE_SPACES` | `~/.agents/skills/workspace/references/WORKFLOW.md`, `### Live spaces` section |
| `git.ts` | `DOT_GIT_WORKTREE`, `HEAD_COCKPIT` | the `.git` file and HEAD of the `agent-skills-thv-1058` worktree |

Two test inputs are derived from these, not copied, and say so where they are built
(`tests/stage.ts`): `relabelTab` renames one tab of `SNAPSHOT_LIVE` to a label `label.sh` writes,
because no snapshot on file holds a `Build ·` tab, and `herdr pane get` is answered with the
pane's own snapshot entry.

Later slices add their sources here as they land: status lines, `send.sh` calls and the inbox (S2),
Skill events and the Codex rollout (S3), the Linear answer (S4), and the measured event payloads
(S5). Each is in `/tmp/cockpit-fixtures/` or `/tmp/cockpit-spike/log/events.jsonl` today.
