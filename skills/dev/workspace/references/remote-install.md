# Selected remote-development skill release

Use after reviewing the canonical diff and approving publication to `main`. This guide does not
publish, install, authenticate or enable Mutagen by being read. Keep the installation bounded to
these workflows; do not run fleet installation, global patch scripts, blanket updates or sync hooks.

## Sources and selection

| Source | Selected skills | When needed |
|---|---|---|
| `Thoven-CORP/agent-skills`, reviewed published revision | `andres-mode`, `workspace`, `linear-project`, `feature-ledger`, `session-memory`, `remote-check` | Core project context, continuity and remote checks |
| Same release | `meta`, `dispatch-work` | Only when deliberately coordinating/dispatching agents |
| Same release | `test-audit`, `verify`, `qa-flow` and project-specific verification skills | Only the checks/task that use them; include referenced helpers |
| `Jeffallan/claude-skills`, `skills/test-master` | `test-master` | When the target checkout requires adversarial test strategy; review the selected upstream revision |
| `cursor/plugins`, `cursor-team-kit/skills/verify-this` | `verify-this` | Small baseline/treatment verification |
| `cursor/plugins`, `harness/pstack/claude-code/skills` | `poteto-mode` and dependencies of the selected playbook | Poteto authoring/coding; retain its adapter and relative references |

Third-party skills remain upstream-owned. Resolve their actual revision and required dependency
closure before install. Poteto is not standalone: inspect its chosen playbook, routed skills and
adapter references. Do not claim success if a referenced file/tool is missing. Do not copy the
MacBook's whole skill catalog or all MCP plugins as a shortcut.

The local `verify-this` copy was observed to call `classify` with
`~/thoven/agent-skills/evals/schemas/evidence.json`. The upstream skill read on 2026-10-28 contains
no classifier requirement. Prefer the reviewed upstream workflow for this setup; do not add that
local dependency by assumption. Preserve any unpublished local customization before replacing it.
If deliberately retaining the customized version, provision and test its command/schema separately.
See the [upstream skill](https://github.com/cursor/plugins/blob/main/cursor-team-kit/skills/verify-this/SKILL.md).

## Publication gate

The authoring branch may contain earlier unpublished commits. Compare against fresh `origin/main`
before publication; do not merge its entire ancestry by accident. Publish only the approved change
and any explicitly reviewed prerequisites. This repo's README requires direct main publication,
not a PR or app-CI loop. Ask for the exact source → main publication in one line after showing the
changes and focused proof. Do not force-push. Preserve other worktrees and uncommitted edits.

## Install on each host

1. Obtain the approved published SHA; verify it exists upstream. Use a clean read-only checkout at
   that SHA for installation. Do not change an active source checkout's branch or install from an
   unpublished working tree. Record the source SHA and installer version.
2. Inspect existing selected installed skills for unpublished changes before replacement. Preserve
   those changes deliberately. Use `~/.agents/skills` as the canonical catalog, with the supported
   Claude adapter in `~/.claude/skills`; Codex already discovers the canonical catalog. Avoid
   creating a duplicate model-visible Codex skill catalog.
3. Check the installed Skills CLI help and the [official installation reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).
   A selected Thoven install from that verified local checkout has this form; replace the checkout
   path with the actual host-local released path:

   ```bash
   npx skills add /absolute/path/to/released-agent-skills -g -y -a claude-code \
     --skill andres-mode --skill workspace --skill linear-project \
     --skill feature-ledger --skill session-memory --skill remote-check
   ```

   Keep explicit agent and skill flags. Install reviewed upstream dependencies separately. Do not
   assume the installer fetches transitive skills or preserves relative references outside a skill
   directory: inspect the resulting package and repair its supported layout before invoking it.
4. Reconcile only the related records/startup wording in the host's shared `CLAUDE.md` / `AGENTS.md`
   and named technical runbooks. Existing local documents remain useful; remove mandatory-local-file
   startup assumptions. Do not overwrite unrelated dirty instructions or copy the MacBook's global
   configuration. Use host-local paths; the mini account is different.
5. Compare the selected installed skill trees, including tools/references, to the reviewed release.
   Inspect any session hook that could reapply old patches; do not run a blanket patch script.
   Launch a fresh Claude session and show that it loads the selected skills and their dependencies.
   Discovery proves loading only. Run Linear-only orientation with actual governing content, then
   a requested small verification workflow to prove execution. Codex sign-in stays deferred.
6. Configure and test Mutagen only after the selected repository pair, endpoints and exclusions are
   reviewed. Use `remote-check` to prove a disposable edit/create/delete, secret/dependency exclusions,
   stable paired input, a targeted check, artifacts and reconnect. Confirm the coding worktree was
   untouched. Mark this gate pending until it actually runs on the mini.

A missing human login or source-pair choice blocks only that dependent step. Report installed,
verified, deferred and pending-human items separately. Never claim end-to-end readiness from a
successful install command alone.
