# Install the full Thoven development environment on another Mac

Use this guide to reproduce Andres's development skills and user-scoped Claude plugins on the
Mac mini. Include the third-party catalog and project-local skills. The earlier minimal-skill
selection is superseded. Keep Codex sign-in deferred.

## Read the inventory and release gate

Read [development-environment.json](development-environment.json) before installing. Its snapshot
contains 312 global skill folders, 283 lock entries across 26 sources, 30 project-local skill
folders, and 29 user-scoped Claude plugins. Seventeen plugins are enabled and twelve are disabled.
The source checkout contributes 66 canonical development skills, including the new remote-check.
These are dated inventory counts, not a promise that every installed folder has a known upstream.

The manifest records names, source paths, hashes, plugin versions, and enabled state. It includes
41 global folders without lock records and twelve stale or missing lock entries. Resolve those
rows by provenance rather than ignoring them or claiming they were installed. A folder hash is
not a Git revision. Preserve local customizations before replacing any installed package.

Obtain the approved published Thoven SHA before installing the updated Thoven skills. The authoring
branch may contain earlier unpublished commits. Compare with fresh origin/main and publish only
the approved changes and reviewed prerequisites. This repository uses direct main publication,
not a PR or app-CI loop. Main publication requires Andres's explicit approval. Do not force-push.

Reading this guide authorizes no installation by itself. The continuation prompt below carries
the destination setup request; it does not authorize publication from the MacBook.

## Reproduce the development catalog

1. Inspect the mini's existing skills, plugin inventory, paths, free disk, and running processes.
   Preserve unrelated work. Inspect metadata without displaying credentials or full settings.
2. Use a clean checkout of the approved Thoven release. Install every entry in
   `canonicalDevelopment.skills`, plus its referenced files. This includes Interface Craft by
   Josh Puckett, which is maintained in this repository. Executive-assistant skills are outside
   this development install; their lock entries remain in the snapshot for accounting.
3. Reproduce the installed third-party entries in `globalLockedSkills` from their upstream
   repositories. For Thoven entries, use the development list from step 2 instead of stale lock
   names. Restore needed missing dependencies and record stale aliases without reinstalling them.
4. Include the requested additions. Install all nine Theo tstack skills from `t3dotgg/tstack`.
   Complete Jakub Krehel's existing design set with `break`, `build-design`, `teardown`, and
   `state-machine`. Pin reviewed upstream revisions and record them. Do not replace the full
   requested catalog with a usage-based shortlist.
5. Reconcile every `globalSkillsWithoutLock` entry. For vendor-installed skills, use the vendor's
   destination installer and compare its result. For custom skills, obtain reviewed skill assets
   separately from credentials. If provenance remains unknown, name the pending row and continue
   independent installation. Herdr's service remains outside this setup per Andres's instruction.
6. Restore `projectSkills` at their original scope when preparing the selected repositories.
   This includes root HyperFrames, frontend GSAP, and backend Neon. Preserve unlocked project
   skills and resolve their provenance. Project-local copies can shadow global names, so compare
   overlapping `prototype`, Neon, and design skills before declaring parity.

Use `~/.agents/skills` as the canonical global catalog. Link the supported Claude adapter at
`~/.claude/skills`. Codex discovers the canonical catalog directly; avoid a second Codex link
catalog. Install Cursor's adapter only if Cursor is used on this host. Native app commands may
require their app; their presence on the laptop does not prove Claude can execute them remotely.

Check the installed Skills CLI help and [official commands](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).
Install from a reviewed local checkout with explicit agent and skill flags. For example, this
installs the complete existing Emil set from its reviewed checkout:

```bash
npx skills add /absolute/path/to/reviewed-emil-skills -g -y -a claude-code \
  --skill animate --skill animation-vocabulary --skill break-ui \
  --skill emil-design-eng --skill find-animation-opportunities \
  --skill improve-animations --skill pick-ui-library --skill prototype \
  --skill review-animations
```

Generate equivalent argument lists from the manifest for the other sources. Do not run a bare
installer that detects every app. `skills update` refreshes already installed packages; it does
not install this catalog on a new Mac. An install command that exits successfully is not proof
that its referenced files, dependencies, or agent definitions arrived.

## Retain the named third-party workflows

Install these as part of the full manifest, not as a substitute for it:

- Matt Pocock: `mattpocock/skills`, including the existing nineteen loose-skill names and the
  installed Claude plugin. Compare overlapping content before choosing a Claude exposure path.
  Keep customizations and explain intentional namespaced plugin copies. Do not overwrite a
  same-name custom skill or load redundant copies by accident.
- Emil Kowalski: `emilkowalski/skills`, including the nine skills in the example above.
- Jakub Krehel: `jakubkrehel/skills`, including Better Interface and all its Better helpers,
  Interface Review, Explain Interface, Variant, and the four requested design additions.
- Poteto/pstack, `deslop`, `verify-this`, and review helpers: their recorded paths in `cursor/plugins`.
  Preserve the Claude-specific pstack adapter, playbooks, principles, and referenced files.
- Thermos: `cursor/plugins`, with `thermos`, `thermo-nuclear-review`, and
  `thermo-nuclear-code-quality-review`. Install the two named review agents too.
- Theo: all nine skills in [t3dotgg/tstack](https://github.com/t3dotgg/tstack).
  Provide authenticated `gh` and `python3`. `council` and `sol-loop` need cross-provider model
  delegation; report those workflows pending until that capability is actually configured.
- Vercel, Next.js, browser automation, Jeffallan's test and engineering skills, Render, Sentry,
  Neon, animation, and the remaining recorded third-party sources: use the manifest's names
  and source paths. Provider login remains a separate step from installing skill text.

Tstack's `full-send` includes merging. Installing it grants no merge, publication, deployment, or
comment-posting permission. Preserve Thoven's explicit main approval in host instructions. Use
`full-stop` when the task must wait for merge approval. Do not invoke a shipping workflow as an
installation test. See [tstack requirements and dependencies](https://github.com/t3dotgg/tstack#requirements).

The Skills CLI does not install Claude agent definitions. Reconcile `claudeAgentDefinitions`
separately, including `poteto-agent` and both thermo review agents from `enforcement/agents`.
Resolve the provenance of other custom definitions before copying them. Adapt host paths and
supported model names. Do not copy global hook registrations to obtain an agent definition.

The laptop's customized `verify-this` calls `classify` with a local schema. The upstream version
read for this migration does not. Compare the installed customization first. Either preserve and
provision its command/schema, or explicitly choose the reviewed upstream workflow and record that
difference. Do not silently lose the customization or assume `classify` exists on the mini.

## Reproduce user-scoped Claude plugins

Use `claudeUserPlugins` as the required list. User scope applies to every project on that machine;
it does not transfer installation, credentials, or GUI permissions to another Mac. Follow
[Claude's install and scope documentation](https://code.claude.com/docs/en/discover-plugins).

Inspect each plugin's skills, agents, hooks, MCP servers, binaries, and host paths before enabling
it. Preserve the enabled and disabled states below. Review plugin-provided hooks as part of the
plugin; do not copy the MacBook's unrelated global hook registry. Explain any compatibility gap
instead of silently changing enabled state.

| Plugin | Observed version | Destination state |
|---|---|---|
| `Notion@claude-plugins-official` | `0.1.0` | Installed, disabled |
| `canva@anthropic-plugin-directory` | `1.0.0-906e8e0b0808` | Enabled |
| `chrome-devtools-mcp@claude-plugins-official` | `1.11.0` | Enabled |
| `cloudflare@cloudflare` | `1.0.0` | Enabled |
| `code-review@claude-plugins-official` | `1.0.1` | Installed, disabled |
| `code-simplifier@claude-plugins-official` | `1.0.0` | Installed, disabled |
| `context7@claude-plugins-official` | `f8c5e7a1dcb7` | Enabled |
| `explanatory-output-style@claude-plugins-official` | `1.0.1` | Installed, disabled |
| `feature-dev@claude-plugins-official` | `1.0.1` | Enabled |
| `frontend-design@claude-plugins-official` | `1.1.1` | Installed, disabled |
| `github@claude-plugins-official` | `f8c5e7a1dcb7` | Enabled |
| `i-have-adhd@i-have-adhd` | `0.1.0` | Enabled |
| `impeccable@impeccable` | `4.8.0` | Installed, disabled |
| `linear@claude-plugins-official` | `f8c5e7a1dcb7` | Enabled |
| `mattpocock-skills@mattpocock` | `1.3.1` | Enabled |
| `mem0@mem0-plugins` | `0.3.3` | Enabled |
| `next-steps@claude-community` | `1.0.0` | Enabled |
| `paper-desktop@paper` | `0.2.1` | Enabled |
| `playwright@claude-plugins-official` | `f8c5e7a1dcb7` | Installed, disabled |
| `ralph-loop@claude-plugins-official` | `1.0.1` | Installed, disabled |
| `ruby-lsp@claude-plugins-official` | `1.0.0` | Installed, disabled |
| `security-guidance@claude-plugins-official` | `2.0.17` | Installed, disabled |
| `sentry@claude-plugins-official` | `1.4.0` | Enabled |
| `skill-creator@claude-plugins-official` | `f8c5e7a1dcb7` | Installed, disabled |
| `stripe@claude-plugins-official` | `0.11.17` | Enabled |
| `superpowers@claude-plugins-official` | `7.0.0` | Enabled |
| `typesafe@typesafe-ai` | `0.5.7` | Enabled |
| `upstash@upstash` | `1.2.5` | Enabled |
| `warp@claude-code-warp` | `2.4.0` | Installed, disabled |

For each required marketplace, use its sanitized source in `knownMarketplaceSources`. Do not
register unrelated historical marketplaces just because they exist in the laptop registry.
An installed plugin whose marketplace is missing, such as the observed Canva directory entry,
needs resolution through the supported official catalog. Do not invent a repository or claim
that cache files establish a working installer.

Check the destination's `claude plugin --help` and marketplace help. Typical shell commands are:

```bash
claude plugin marketplace add mattpocock/skills
claude plugin install mattpocock-skills@mattpocock --scope user
claude plugin install code-review@claude-plugins-official --scope user
claude plugin disable code-review@claude-plugins-official --scope user
claude plugin list
```

For disabled entries, preserve the disabled state before reloading the plugin into a working
session. Review hooks before installation. If current installer behavior cannot preserve that
state safely, defer that entry with its reason. Check whether the plugin is already installed
before adding it. Use the supported enable or disable operation only for that plugin and scope.

Observed versions and Git SHAs are baselines, not automatic version pins. Resolve a supported
reviewed marketplace revision or record the available version difference. Report renamed or
removed plugins. Do not reinstall the same upstream through a second marketplace to hide a gap.
Preserve project and local scope. `otherScopeOnlyPlugins` are not user-install requirements;
reconcile them with the chosen repositories rather than promoting them globally.

Reconcile overlapping Sentry, Matt Pocock, and Superpowers capabilities. Keep plugin identities
and enabled state unless a reviewed compatibility issue requires a change. Account for loose
skills separately, including custom differences. Codex plugins and bundled computer-use tools
have their own installation and permission model; Claude plugins do not provision them.

## Retain the Codex plugin inventory without blocking Claude

The manifest also records 26 plugin entries from the MacBook's user Codex configuration, with
23 enabled and three disabled. Treat these as configured-state evidence, not proof of installed
or working destination plugins. Preserve this inventory for the later Codex setup, including
Matt Pocock, Sentry, Stripe, Mem0, GitHub, Context7, and bundled browser and computer-use tools.

Use Codex's supported destination plugin mechanism when that phase is resumed. Claude's plugin
commands do not install Codex plugins. Bundled app tools depend on the host application and its
permissions; copying their cache folders or TOML entries cannot prove remote availability.
Keep Codex sign-in and authenticated execution deferred, and continue the Claude setup.

## Provision access and host requirements

Authenticate GitHub, Linear, Sentry, Stripe, Cloudflare, Mem0, and other enabled integrations
through supported destination flows as needed. Installing a plugin does not prove access.
Never copy auth files, tokens, keychains, browser profiles, Codex sessions, or full settings files.
Report variable names and secret-file paths only. Preserve Codex sign-in as deferred.

For `chrome-devtools-mcp`, verify the actual MCP executable/server, browser target, and host.
For Paper, tldraw, and desktop automation, verify the app, logged-in GUI session, and human-granted
permissions on that Mac. MacBook browser control stays on the MacBook unless a supported remote
connection is deliberately configured. Keep CDP and preview ports private.

Reconcile related shared instructions with the released Linear-first policy using host-local
paths. Preserve unrelated edits and historical runbooks. Linear contains project authority;
tldraw and Paper are optional design aids. Read the governing document content before a handoff.
Missing local STATE.md or project folders must not block orientation.

Inspect the skill-patch and visibility scripts before applying them. Preserve useful adaptations
without bringing back mandatory local documents, obsolete classifiers, or unwanted hooks. Do not
run blanket enforcement installers. Keep the installed catalog complete; configure Codex's
model-visible subset separately using the reviewed visibility procedure in the repository README.

## Verify installation and remote execution

1. Compare installed names, supporting files, adapters, source revisions, and plugin scopes/states
   with the manifest. Account for every row as matched, intentionally different, pending, or
   outside development scope. Keep unresolved provenance visible.
2. Start a fresh Claude session. Confirm discovery of the requested development and design skills,
   pstack playbooks, helper agents, tstack, and enabled plugins. Check for load errors and shadows.
   Discovery proves loading only. Do not run every skill or a multi-model review as a smoke test.
3. Prove Linear-only project orientation by reading actual relevant documents. Run one small
   requested check through the intended skill and return its exact command, result, and artifacts.
   Distinguish authenticated integration proof from installed-but-untested providers.
4. Configure Mutagen for the chosen frontend/backend pair. Use dedicated disposable test mirrors;
   keep coding agents in separate Git worktrees. Follow [remote-check](../../remote-check/SKILL.md)
   for exclusions, a stable capture, targeted execution, artifacts, and reconnect proof.
5. Return the installed-versus-expected report, pinned revisions, pending human sign-ins, host
   permissions, and a working remote-check example. Keep incomplete rows pending. Installing the
   full catalog does not prove every provider workflow or desktop tool works.

## Continue in the mini Claude session

Read this guide and its companion inventory at the approved published Thoven revision. Reproduce
the full development catalog, all recorded third-party development skills, project-local skills
at their original scopes, required helper agents, all twenty-nine user plugins with their recorded
states, and the requested tstack and design additions. This replaces the earlier minimal selection.

Reuse the host setup already completed. Keep Codex sign-in deferred. Continue independent work
when one login or source cannot be resolved. Report the named gap instead of stopping the entire
setup or claiming parity. Keep the existing Git branching and PR workflow. Set up Mutagen only
between the chosen MacBook source pair and disposable mini test mirrors, with mini coding worktrees
outside sync ownership. No production changes, blanket hooks, or unrelated service installation.
