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

**Done when:** every pane on the floor is listed; labels match §8 (tab =
Project, pane = `Ledger:` surface plus id); OpenCode `OC | …` leftovers are
named as stale, not used as routing.

Sweep a finished pane only after Andres has seen the surface. Recycle after
he confirms. `herdr agent prompt` after go.

## Launching a session

One issue = one pane, born inside its Project's tab. Same feature, next phase
(design done → backend) = **new pane, same tab.**

```bash
$H tab create --workspace <WS> --cwd <WORKTREE> --label dashboard
$H pane list
$H pane split --pane <PANE_ID> --direction right --ratio 0.5 --cwd <WORKTREE>
$H agent start <issue-id-slug> --kind opencode --pane <PANE_ID>
$H agent prompt <issue-id-slug> "Begin <ISSUE-ID>"
```

Stagger first turns (~5 min). Provider outage: wait or recycle the same pane;
do not rebuild a second session on the same tree.

Work-pane Begins stay skinny: ticket, ledger paths, named-path git, shared-tree
guard. They do not evoke workspace or feature-ledger.

Naming — the pane label **is** the location stamp's `Ledger:` line plus the id:

```bash
$H pane rename <PANE_ID> "Get-started panel on empty dashboard (D2 · THV-195)"
$H agent rename <PANE_ID> thv195
```

After start or recycle, `/rename` in that chat to the same sentence.

**Done when:** Linear still shows the issue; the pane sits in the Project tab;
pane label, OpenCode `/rename`, and `Ledger:` agree; Begin has been sent only
after go.

## Claim guard

Stage specific paths only. On a push race, `pull --rebase`. Other sessions'
uncommitted work shares this tree.

## Verification

Truth is Linear. After launch, re-fetch the issue. herdr `working` is liveness,
not shipped.

## Meta

The organizer desk is the `meta` skill. This skill launches and names the
floor.
