---
name: herdr
description: >-
  Orchestrate parallel agent sessions in herdr — spaces, tabs and panes mapped to the
  Linear board. Use when launching multiple sessions ("spin up panes", "launch these
  lanes", "meta orchestration"), sweeping stale panes, recovering sessions stuck on
  provider errors, or setting up a new space/tab layout for a sprint. Also when Andres
  says "herder" or "meta tab".
---

# herdr orchestration

Run multi-session work in visible panes instead of trusting status labels. Linear stays the
source of truth; herdr makes parallelism physical.

**The law lives at `.workspace/WORKFLOW.md` §8.** This skill is the operating procedure;
that file is the ruling. When they disagree, the file wins.

**Source of this skill:** `~/thoven/agent-skills/skills/dev/herdr/`. Home copies are
installs. Do not freelance-edit them from a Meta desk.

## Session-start sweep

```bash
H="$HOME/.local/bin/herdr"
$H workspace list
$H tab list
$H agent list
```

Sweep stale panes only after Andres has seen the surface and is satisfied. A pane
that just finished is a recap on Meta, not a ghost. Do not `herdr agent prompt`
without go. Recycle only when he confirms.

## What maps to what

| Linear | herdr | Label |
|---|---|---|
| Initiative / audience | **Space** | `~Parent2.0`, `~Teacher2.0` |
| **Project** (the feature) | **Tab** | `dashboard`, `activation`, `business` — a bigger piece of work he can hold in his head. Later issues `pane split` inside it. Never a bare `Work`. Never the issue. |
| **Issue** (the unit of work) | **Pane** | English surface first, ledger + ticket in parens: `Get-started panel on empty dashboard (D2 · THV-195)` |
| Milestone (Design / Build) | not spatial | Tag the pane in Meta's map as planning / design / build. Do not make a tab named Design. |

Same feature, next phase (design done → backend contract) = **new pane, same tab.**

## Launching a session

One issue = one pane. Born inside its project's tab:

```bash
$H tab create --workspace <WS> --cwd <WORKTREE> --label dashboard
$H pane list
$H pane split --pane <PANE_ID> --direction right --ratio 0.5 --cwd <WORKTREE>
$H agent start <issue-id-slug> --kind opencode --pane <PANE_ID>
$H agent prompt <issue-id-slug> "Begin <ISSUE-ID>"
```

Stagger first turns (~5 min). Do not nudge `continue` without go. Never rebuild a
pane for a provider outage.

Work-pane Begins stay skinny: ticket, ledger paths, named-path git, shared-tree
guard. They do not evoke workspace or feature-ledger.

Naming:

```bash
$H pane rename <PANE_ID> "Get-started panel on empty dashboard (D2 · THV-195)"
$H agent rename <PANE_ID> thv195
```

OpenCode session title must match. After start or recycle, `/rename` in that chat
to the same sentence. `OC | …` leftover is not the room.

## Claim guard

> Stage specific paths only. Never `checkout -f`, `reset --hard`, `clean`, or stashing files you
> did not write — other sessions' uncommitted work shares this tree. Push race → `pull --rebase`,
> never force.

## Verification

Truth is Linear, not terminal chrome. After launch: re-fetch the issue. herdr
"working" is not shipped.

## Meta duties

Meta is the organizer. See the `meta` skill: product-person voice, room map,
tab digest after his confirmation. This skill only launches and names the floor.
