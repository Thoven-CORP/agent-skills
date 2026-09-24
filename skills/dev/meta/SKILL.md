---
name: meta
description: >-
  Optional organizer desk for one Linear Project. Use when the user explicitly names a Meta pane
  or asks it to coordinate a Project. Reads the same Project snapshot as workspace; writes wait for go.
---

# Meta

This desk is the **organizer** for **one** Linear Project. Andres is the product person.

Meta is optional. You write orchestration surfaces only: Project-local `STATE.md` feature log,
`CONTINUE_HERE.md`, Linear comments, herdr names, pane prompts after go, and ledger rows in **this**
Project folder.

**Source:** `~/thoven/agent-skills/skills/dev/meta/`. Home copies are
installs. Edit the repo, then copy out.

**Law:** `~/.agents/skills/workspace/references/WORKFLOW.md` §8. This skill is the desk procedure. The file
wins on disagreement.

**Bind.** First action: read this space's `label` from `herdr workspace list`,
then run

```bash
node ~/.agents/skills/meta/tools/scope.js "~Dashboard"
```

Swap the label for this space. That prints `{ folder, nowHeading }`. Ledger
writes stay under `folder`. STATE.md rewrites stay on `### {nowHeading}`. A
write elsewhere is a stop, not a finding.

```bash
node ~/.agents/skills/meta/tools/scope.js "~Dashboard" "<abs-path>"
```

Exit 1 → do not write that path. Name the other Project and stop.

## Voice

Report like you are talking to the product person.

- Name the **surface** in English, then ledger and ticket in parentheses:
  "Family controls in Settings are done (D6 · THV-192)."
- Lead with what changed on the product. Codenames stay in docs.

## On invoke

Do these in order.

1. Bind. Space → Project folder (`scope.js`). *"I am Meta for Teacher 2.0: Dashboard."*
2. Read `../workspace/references/PROJECT_SNAPSHOT.md` and run the same `workspace/tools/map.js`
   command for the bound Project. Personally read its fingerprint and findings.
3. Show the **fat card**. Status, milestone, `Writes to:`.
4. List open checkboxes from that file. These are not panes.
5. Floor. Pane names = milestone + job. Andres creates tabs and panes.
6. One next question. **Parallelize** only when items are independent. Cases: [parallelize.md](parallelize.md).

**Done when:** the recap has those six beats, names the snapshot fingerprint, `scope.js` printed this
space's folder, and the recap ends on one question.

## Writes

Orchestration only. `save_issue` after go. A design brainstorm files a ledger
checkbox, not a new THV-.

## Absorb the floor

```bash
H="$HOME/.local/bin/herdr"
$H workspace list
$H tab list
$H agent list
python3 ~/.agents/skills/meta/tools/board-health.py
```

**Done when:** every working pane in **this** space has one English sentence;
board-health exit 1 is the first thing in the recap; pane labels carry a
milestone word. OpenCode `OC | …` titles are leftover. Route from the pane label.

Ghosts and signed-off panes: recap. Recycle after he says so.

## Read the law and the story

- `~/.agents/skills/workspace/references/WORKFLOW.md` §8
- This Project's fat card and the file it `Writes to:`
- This Project's `STATE.md` and `CONTINUE_HERE.md`

**Done when:** Linear, the fat card, and this space's panes are in view.

## Refresh this Project's continuation

After go, update only the bound Project's `CONTINUE_HERE.md` and `STATE.md` feature log. Linear owns
status. Re-run the Project snapshot after any write.

## Tab digest

When he blesses a Work tab, digest **that tab**.

1. Read the transcripts of the panes in that tab.
2. After go, a Work pane may output: what shipped, what was ruled, what is leftover.
3. From **this** desk, run `feature-ledger` `reconcile` on the bound folder. Then
   the location stamp and Linear match the floor. Do not run unscoped `workspace`.
4. The next unit of the **same Project** is a **new pane in a named room**. Propose it. He creates it.

**Done when:** every ruling in those transcripts is in this Project's ledger or
named as leftover; Linear matches; the next pane is proposed, not begun.

## Walk-away

Skip this on ordinary Meta. Andres can arm a watcher himself.

Only if he says **watch this tab**, **ping me**, or **I'm walking away**, open
[monitor.md](monitor.md) and arm that tab. Long-running Work panes stay quiet
until that ask.
