# maintain-verification-skill: drift list and the one PR

Target: the verify chain (`skills/dev/verify/SKILL.md`, `dispatch-work/references/{brief,review}.md`, `enforcement/rules/thoven-law.md`, `enforcement/README.md`, `LEARNINGS.md`, `dispatch-work/scripts/{label,send,watch}.sh`, frontend and backend `bin/verify`). Outcome proposed: **changed**, one PR in agent-skills plus one small PR per product repo for `bin/verify`.

| # | Drift | Where | Fix |
|---|---|---|---|
| D1 | Verify cadence stated three ways | `andres-mode:53`, `thoven-law.md:65`, `review.md:13` | One sentence (andres-mode draft, Tests section), copied by `sync.sh` |
| D2 | Builder DONE WHEN never names bin/verify or the repo guard tests; allows `--no-verify` commits | `brief.md:36-38, 48-49` | DONE WHEN names `bin/verify --base <integration>` and the guard tests; drop the `--no-verify` line |
| D3 | Verifier told to read a receipt that only exists on PASS, no instruction when missing | `review.md:38-41` | "No receipt means the run did not pass: run `bin/verify --base` yourself and paste the block" |
| D4 | verify skill has no branch for integration diffs, docs-only diffs, shared trees, lock waits | `verify/SKILL.md` (10 lines) | Add the four cases, each one line, pointing at `bin/verify` flags |
| D5 | Stop hook described as live | `enforcement/README.md:29` | Delete the paragraph; keep `:65` retired note |
| D6 | "Do not create andres-mode" | `LEARNINGS.md:107, 355, 372` | Delete the three lines |
| D7 | Kind lists disagree | `label.sh` (no Verify), `thoven-worktree:431` (no Meta) | One list in both: add Verify to label.sh, Meta to thoven-worktree |
| D8 | `send.sh` refuses any `<lowercase>` text | `send.sh` | Refuse only `{{...}}` leftovers; keep the pane-status refusal |
| D9 | HEARTBEAT and SETTLED have no row in the stale table | `SKILL.md:133-142`, `watch.sh` | Table rows; HEARTBEAT re-arms silently, SETTLED checks commits before firing |
| D10 | Default base is `origin/main` on integration branches | frontend `diff.mjs:47`, backend `verify.rb:69` | Read `git config thoven.verifyBase` (written by `thoven-worktree`), fall back to `origin/main` |
| D11 | Mutation row blocks new-file, comment-only and type-only hunks and stops at the first survivor | `diff.mjs:168-201`, `verify.rb:288-340` | Skip hunks that add a whole file or change only comments/types; test every hunk; survivors are one WARN row with the hunk list (ruling 10-19) |
| D12 | Receipt written only on PASS | `diff.mjs:224`, `verify.rb:198` | Write the receipt on every run with its status; `--check-evidence` still requires PASS |
| D13 | `agents.toml` tiers route to Codex/droid while andres-mode says Claude | `agents.toml:13+` | Tiers 1 to 5 Claude models; Codex a named opt-in tier |

Live pass: run the `/verify` live layer once on one feature (step 4 of the generator) before this PR merges; drift found there joins the table.
