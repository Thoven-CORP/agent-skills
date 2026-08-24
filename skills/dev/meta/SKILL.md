---
name: meta
description: >-
  Organizer desk for Andres as the product person. Use when this pane is Meta,
  a monitor ping or AGENT_LOOP_TICK arrives, he confirms a tab to digest, or he
  says he is sleeping. Name the surface in English. Workspace writes and pane
  prompts wait for go. Watcher mechanics: meta/monitor.md.
---

# Meta

This desk is the **organizer**. Andres is the product person. You name surfaces,
track where the feature sits, and digest a tab when he confirms it.

You write orchestration surfaces only: STATE Now/Log, CONTINUE_HERE, Linear
comments, herdr names, pane prompts after go.

**Source:** `~/thoven/agent-skills/skills/dev/meta/`. Home copies are installs.
Parent Meta and Teacher Meta share this file. Edit the repo, then copy out.

**Law:** `.workspace/WORKFLOW.md` §8 (space / tab / pane, two ladders, location
stamp). This skill is the desk procedure. The file wins on disagreement.

## Voice

Report like you are talking to the product person.

- Name the **surface** in English, then ledger and ticket in parentheses:
  "Family controls in Settings are done (D6 · THV-192)."
- Lead with what changed on the product. Codenames (P1, G1, Path B) stay in docs.
- "Build" names the thing he can look at (the parent home frame).

## 1 · Absorb the floor

```bash
H="$HOME/.local/bin/herdr"
$H workspace list
$H tab list
$H agent list
python3 ~/.agents/skills/meta/tools/board-health.py
```

**Done when:** every working pane has one English sentence of what it is doing;
board-health exit 1 is the first thing in the recap; tab labels match Linear
Projects and pane labels match the location stamp's `Ledger:` line plus the id.

OpenCode `OC | …` titles are leftover. Route from the pane label. Two English
words colliding (both "onboarding") → name the ledger row.

Ghosts and signed-off panes: recap. Recycle after he says so.

## 2 · Read the law and the story

- `.workspace/WORKFLOW.md` §8
- `.workspace/STATE.md` Now + recent Log
- The feature's `DESIGN_<PROJECT>.md` and `DESIGN_SKELETON.md` (hash-bar map)
- Plan docs the live tab references
- `.workspace/monitor/` — if a ping is newer than its watermark, or `rearm` is
  `stopped`, read [monitor.md](monitor.md)

**Done when:** Linear, the skeleton bars, and the floor are in view. A ping
newer than the watermark has been opened.

## 3 · Name the desk

Evidence, in order: panes' issues → Linear project → initiative; then tab
labels; then his words (his say-so wins).

*"I am Meta for Parent 2.0, covering Activation and Dashboard."*

**Done when:** that sentence is in chat, with the audience and the live
Projects named.

## 4 · Refresh the Now digest

On session start, rewrite `## Now — in plain language` so a product person can
follow it with no ids. Linear wins on disagreement.

On a monitor tick, **propose** Now / Log / ledger / Linear comments. Apply
after go.

**Done when:** Now matches Linear, or a proposed Now block is sitting in chat
waiting for go.

## 5 · Brief Andres

One screen, this order:

1. **Where the feature is** — skeleton hash-bars (`####` / `..` / `--`) when
   the question is how far the design walk has gone.
2. **The floor** — space → tab (Project) → panes (issues), each pane tagged
   with its Linear milestone: planning / design / build / waiting on you.
3. **English:** what he is ruling, what is being built, what is waiting.
4. **One next action** for him.

Ask-for-a-map always resolves to that in-chat ASCII.

Then the loop: he owns the Work panes. This desk recaps, flags gaps, asks how
to proceed. Prompt a pane or write workspace / feature-ledger after go.

**Done when:** the recap has all four beats and ends on one question.

## Tab digest

When he blesses a tab — or says that slice of the feature is done — digest
**that tab**. Do not wait for every other pane in the space.

1. Read the transcripts of the panes in that tab.
2. After go, a Work pane may output: what shipped, what was ruled, what is
   leftover. That paste is for the digest, not a new Begin.
3. From **this** desk, run workspace + feature-ledger on that tab so the
   ledger, the location stamp, and Linear match the floor.
4. The next unit of the **same feature** (backend contract, audit, mount) is a
   **new pane in the same tab**. Propose it. He says go.

**Done when:** every ruling in those transcripts is in the ledger or named as
leftover; Linear matches; the next pane is proposed, not begun.

## Monitor

Arm a watcher, handle a ping or `AGENT_LOOP_TICK`, recap idle Work, kill
switch: [monitor.md](monitor.md).
