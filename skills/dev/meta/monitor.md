# Monitor

Optional. **Meta init does not open this file.**

Reach it when Andres says watch this tab, ping me, or I'm walking away.
He can also arm it himself. Ordinary Meta recaps when he sits at the desk.

Tab digest after he confirms a tab lives in the `meta` skill. This file is the
watcher packet and the ping loop.

## Split

**Work panes** build or draw. Brief = ticket if one exists, plus ledger paths.

**Watcher** (cheap, background, one cycle). Sweep the packet. Write the ping
file. Stop.

**Meta** (the organizer chat). On a tick or ping: recap in product language,
show the floor, name the surface. Propose workspace and feature-ledger writes.
Wait for go. Prompt a Work pane after that go.

## When this chat speaks

Classify the event, then ask how to proceed. One screen. English first.

| Event | What to say |
|---|---|
| Design pane idle | Name the surface. Ledger + ticket in parens. Link the proto. Ask bless, correct (in that pane), or stop. |
| Build pane idle | Name what was built (the parent home frame). Ask him to look at it, or keep going. |
| Plan / spec ready | Name the decision. Ask him to read it and rule. |
| Named files moved | Paths vs the surface. |
| Requirements miss | Quote the ledger row. Quote what the pane did. Ask how to proceed. |
| Stuck / provider / wrong files | Name the pane and the failure. Ask: nudge `continue`, re-prompt (his words), or leave it. |
| Quiet 30m tick | Short recap a walk-away can recapture. If nothing moved, three lines. Floor map only when something changed. |

A queued Begin is a draft. A recap is a proposal.

**Done when:** one classified recap is in chat, ending on one question.

## Kill switch

Andres saying he is sleeping, or `rearm: stopped`, ends the arm. Idle after
work is a recap, not sleep.

On the switch: leave proposals queued. Kill the heartbeat loop. Wait until he
speaks.

**Done when:** the loop pid is gone and `rearm` is `stopped`.

## Ranked truth

Higher wins. Meta repairs the lower one, after go.

1. Ledger files (what to build). Ticket bodies **point** (location stamp). They
   do not restate the spec.
2. Linear (lifecycle: In Progress / In Review / Merged / Done). Done is in `main`.
3. herdr (liveness). `working` is not shipped.
4. Named-path git (what landed). Stage the paths you wrote.

`STATE.md` Now and Log are Meta's digest of the four above. Writing them is a
proposal until Andres says go.

## Packet

Instance data lives in `.workspace/monitor/<lane>-watermark.json` and the
watcher prompt. A new lane is a new watermark + ping file. Same this doc.

Watermark fields:

```
scope, tab, panes
linear: { ISSUE: status }
git: { repo, sha } per tree
closed_read_list: absolute paths the watcher may read
wait_panes / skip_panes
shared_tree: dirty-<lane> | clear
next_slice
rearm: one-task | heartbeat-only | stopped
do_not_prompt_panes: true unless Andres just approved a paste
```

`rearm: stopped` is terminal for this arm. A later tick that finds it recaps
only if new evidence exists, then exits. Arm again when Andres says to.

The watcher reads `closed_read_list` plus the watermark, Linear status+last
comment for the listed issues, herdr for the wait panes, and named-path git
against the watermark SHAs. A builder citing a file or ADR outside that list
is `HALLUCINATION`. The watcher does not fetch more docs, and does not open
workspace or feature-ledger.

## Watcher turn

1. Read the watermark. If `rearm` is `stopped` and nothing moved, write
   `status: quiet` / `meta_todo: stop` and exit.
2. Sweep herdr on `wait_panes` only.
3. Fetch Linear status for the listed issues.
4. Diff named-path git against watermark SHAs.
5. Quote contract rows you check. Copy the row.
6. Write `.workspace/monitor/<lane>-ping.md` with the schema below.
7. Stop.

Heartbeat is Meta's loop (30 minutes unless the watermark says otherwise).

**Done when:** the ping file exists, every field in the schema is filled, and
the watcher process has exited.

## Ping schema

```
status: quiet | landed | drifted | hallucinated | stuck | recap
kind: design_check | build_landed | plan_landed | files | req_gap | stuck | quiet_recap
issue: ISSUE-… or none
linear: In Progress | In Review | Merged | Done | Todo | …
pane: herdr pane id or none
files: named paths only
quotes: ledger rows touched (verbatim)
verdict: PASS | DRIFT | HALLUCINATION
meta_todo: ask_how_to_proceed | propose_writes | stop
next_prompt: empty, or a paste-ready block (queued; send after go)
shared_tree: dirty-<lane> | clear
```

## Hallucination

Quote contract rows.

If the pane claims a payload key, route, or ADR number that is not in
`closed_read_list`, `status: hallucinated`, `verdict: HALLUCINATION`.

Shipped means Linear Done and the named paths exist at the watermark SHAs.

## Meta on ping

1. Read the ping. Open the cited ledger rows yourself.
2. Recap in chat: the surface, the floor, what he is ruling. Tag the pane with
   its Linear milestone (`PRD + Architecture` · `Design` · `Build` · `Review`).
3. **Requirements pass** when a pane claims done: ticket `Exit criteria` vs named
   files vs quoted ledger rows. Report misses from this desk.
4. Propose workspace (`log` / Now) and feature-ledger writes as a block,
   including a red session gate if one is red. Apply after go.
5. Ask how to proceed. One question.
6. Prompt a Work pane after that go, with the text he approved. `continue` on a
   provider death also needs go unless he already standing-ordered nudges (he
   has not).
7. Kill switch: sleeping or `rearm: stopped` → stop the loop.

**Done when:** the recap is in chat, the write-block is proposed or skipped
with a reason, and the turn ends on one question (or the kill switch has
fired).

## Arm

From Meta, after the layout matches WORKFLOW §8. Skip this section when
`rearm` is `stopped` unless Andres says to arm again.

1. Write or refresh the lane watermark. `rearm` starts as `heartbeat-only` for
   observe-while-he-works, or `one-task` when waiting on a single pane to land.
2. Launch one cheap background Task only when a pane wait is worth a cycle.
   Otherwise heartbeat-only.
3. Start the local loop at the interval on the watermark (default 1800s).
   Sentinel `AGENT_LOOP_TICK_<lane>_monitor`.

Re-arm a Task only when the kill switch did not fire. Record Task id and loop
pid on the watermark.

**Done when:** the watermark is on disk, `rearm` is `heartbeat-only` or
`one-task`, and the loop pid is recorded.
