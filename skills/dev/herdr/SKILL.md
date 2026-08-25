---
name: herdr
description: >-
  Floor layout in herdr. Use when spinning panes, sweeping a space after he has
  seen the surfaces, recovering a pane stuck on a provider error, or standing up
  a space for a sprint.
---

# herdr

Run multi-session work in visible panes. Linear stays the source of truth;
herdr makes parallelism physical.

**Law:** `.workspace/WORKFLOW.md` §8. This skill is the operating procedure;
that file is the mapping (space / tab / pane), the two ladders, and the
location stamp. The file wins on disagreement.

**Source:** `~/thoven/agent-skills/skills/dev/herdr/`. Home copies are
installs.

## Session-start sweep

```bash
H="$HOME/.local/bin/herdr"
$H workspace list
$H tab list
$H agent list
```

**Done when:** every pane on the floor is listed; labels match §8 (space =
Project, Work tab = named room, pane = milestone + job); OpenCode `OC | …`
leftovers are named as stale, not used as routing.

Sweep a finished pane only after Andres has seen the surface. Recycle after
he confirms. `herdr agent prompt` after go.

## Launching a session

Andres creates the Work tab and the pane. This skill names and, if the pane is
still a shell, starts an agent in it.

`herdr agent start <NAME>` starts Cursor or OpenCode **in an existing pane**.
NAME is a nickname (`messages-panel`, `upcoming`). It is not a Linear id and it
does not mint a THV-. Docs: https://herdr.dev/docs/agent-automation/

Agents he launched by hand are already detected. Address them by pane id.
Give a nickname only when a stable target helps.

Same Project, next independent unit = **new pane in that room, or a new room
he named.** Same feature, next phase of the *same* unit = new pane, same tab.

```bash
$H pane list
$H pane rename <PANE_ID> "Build · Upcoming person-or-count"
$H agent start upcoming --kind opencode --pane <PANE_ID>
$H agent prompt upcoming "Begin THV-189"
```

Skip `agent start` when the pane already has an agent. Prompt by pane id.

Stagger first turns (~5 min). Provider outage: wait or recycle the same pane;
do not rebuild a second session on the same tree.

Work-pane Begins stay skinny: ticket if one exists, ledger paths, named-path
git, shared-tree guard. They do not evoke workspace or feature-ledger.

Naming — the pane label is **milestone + job**, then the id when one exists:

```bash
$H pane rename <PANE_ID> "Design · Messages panel (THV-149)"
$H agent rename <PANE_ID> messages-panel
```

After start or recycle, `/rename` in that chat to the same sentence.

**Done when:** the pane sits in the Project space; the pane label carries a
milestone word; Begin has been sent only after go; Linear has a new THV- only
if he asked for one.

## Claim guard

Stage specific paths only. On a push race, `pull --rebase`. Other sessions'
uncommitted work shares this tree.

## Verification

Truth is Linear. After launch, re-fetch the issue if one is attached. herdr
`working` is liveness, not shipped.

## Meta

The organizer desk is the `meta` skill. This skill launches and names the
floor.
