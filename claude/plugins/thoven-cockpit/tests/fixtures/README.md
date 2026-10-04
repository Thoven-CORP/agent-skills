# Fixtures

Each `.ts` file exports real text as string constants, copied byte for byte from the source
named in the constant's comment. A test has no file access, so embedding is the only way.
Nothing here is hand-made except `built.ts`, which says for each constant why no log could supply it.

| File | Constants | Source |
|---|---|---|
| `herdr.ts` | `SNAPSHOT_LIVE`, `PANE_GET_P8W` | `/tmp/cockpit-fixtures/herdr/{snapshot-live,pane-get-sample}.json` |
| `workflow.ts` | `WORKFLOW_LIVE_SPACES` | `~/.agents/skills/workspace/references/WORKFLOW.md`, `### Live spaces` section |
| `git.ts` | `DOT_GIT_WORKTREE`, `HEAD_COCKPIT`, `DOT_GIT_THV_481`, `HEAD_THV_481`, `CONFIG_FRONTEND`, `CONFIG_BACKEND`, `CONFIG_AGENT_SKILLS` | the `.git` file and HEAD of the `agent-skills-thv-1058` and `frontend-thv-481` worktrees; the `.git/config` of `~/thoven/{frontend,backend,agent-skills}` |
| `github.ts` | `GH_FRONTEND`, `GH_BACKEND`, `GH_AGENT_SKILLS` | `/tmp/cockpit-fixtures/gh/{frontend-remote,backend-remote,agent-skills}.json` (`gh pr list --json`, 10 PRs each) |
| `reports.ts` | `PASTED_CONCERNS_THV_1041`, `PASTED_DONE_FIX_ROUND_THV_1041`, `BUILD_BRIEF_THV_1014`, `FIX_ROUND_3_THV_1015`, and six from `status-lines/` | transcript lines named above each constant, and `/tmp/cockpit-fixtures/status-lines/*.txt` |
| `send.ts` | `SEND_FIX2_THV_1004`, `SEND_1` to `SEND_6` | a main session's Bash `tool_use` (line named in the file), and `/tmp/cockpit-fixtures/send/*.txt` |
| `inbox.ts` | `OUT_ESCALATION_THV_1004`, `OUT_RESEARCH_THV_1038_HEAD` | `/tmp/cockpit-fixtures/dispatch-out/`, and the head of `$TMPDIR/dispatch/out/THV-1038.md` |
| `turns.ts` | `ANSWER_DONE_THV_978`, `ANSWER_NO_STATUS_THV_1082`, `BRIEF_FILE_THV_978`, `STOP_TASKS_SLEEP`, `WATCH_BASH_INPUT` | builder transcripts' last `text` block (lines named in the file), `$TMPDIR/dispatch/THV-978.md`, the S0 spike's `classic.Stop` log, and a main session's Bash `tool_use` |
| `review.ts` | `SKILL_PROMPT_DESLOP`, `SKILL_TOOL_CALL`, `SKILL_TOOL_RESULT`, `ROLLOUT_VERIFY_THV_1000` | `/tmp/cockpit-spike/log/events.jsonl` lines 81 and 88, `/tmp/cockpit-fixtures/skills/skill-tool-result.jsonl`, and seven lines of a real Codex verifier rollout (path in the file; its `session_meta` drops `base_instructions` and the creator account ids) |
| `linear.ts` | `LINEAR_STATES_945_1038`, `READBACK_DONE_THV_1038`, `READBACK_ERROR_THV_1038` | the answer to `STATE_QUERY` from `api.linear.app/graphql` on 2026-10-03 (read only); the read-back lines are set-status.js's printed form with the spec's literals, since no transcript holds one yet, and the file says so |
| `wave.ts` | `BRIEF_BUG_FIX_THV_1096`, `MAIN_SID_THV_1094`, `SEND_1947_THV_1095_1097` | the live acceptance wave THV-1094 (2026-10-03): the THV-1096 builder's first prompt and main's 19:47 send.sh `tool_use`, transcript lines named in the file |
| `built.ts` | `BUILT_CONCERNS_TABLE_THV_1045` | built by hand, not captured: no log holds a concerns table; shaped on brief.md's REPORT section (`skills/dev/dispatch-work/references/brief.md`), and said so in the file |

Two test inputs are derived from these, not copied, and say so where they are built
(`tests/stage.ts`): `relabelTab` renames one tab of `SNAPSHOT_LIVE` to a label `label.sh` writes,
because no snapshot on file holds a `Build ·` tab, and `herdr pane get` is answered with
`PANE_GET_P8W` for `w18:p8W` and with the pane's own snapshot entry for any other pane.

S2 derives two inputs and says so where it builds them (`tests/s2.test.ts`): the inbox file
`THV-1041.md` is the text inside `PASTED_CONCERNS_THV_1041`'s `<pasted_content>`, because send.sh
sends `"$(cat $TMPDIR/dispatch/out/THV-<id>.md)"`; and one tab is relabelled with `relabelTab`.
No log holds the spec's `DONE_WITH_CONCERNS THV-1045` paste or `FIX ROUND 3/5 THV-978`, so the
tests use the real `THV-1041` and `THV-1015` prompts in their place.

S2b derives its inputs where `tests/s2b.test.ts` builds them: relabelled tabs and pane labels, a
checkout's branch set to `ui/thv-481` or `sentry-error`, a pane moved into the backend checkout, and
BE #145 retitled with the spec's `(THV-851, THV-847, THV-843)`, since no PR on file has a
multi-ticket title group.

Later slices add their sources here as they land: Skill events and the Codex rollout (S3), the Linear answer (S4), and the measured event payloads
(S5). Each is in `/tmp/cockpit-fixtures/` or `/tmp/cockpit-spike/log/events.jsonl` today.
