# Monitor

The factory floor is the Work panes. This desk is the organizer. The watcher
watches. Meta recaps for the product person. Andres owns the panes.

Reach this file when you arm a lane watcher, a ping file appears, `AGENT_LOOP_WAKE_*`
or `AGENT_LOOP_TICK_*` fires, `herdr agent wait` returns, Work panes go idle, a
requirements gap shows, a pane is stuck, or Andres says he is sleeping. Skip it on
ordinary Meta init unless a ping is newer than its watermark or `rearm` is `stopped`.

## Split

**Work panes** build or draw. Their brief is the ticket + ledger paths. They do not
run workspace or feature-ledger. That spend belongs here.

**Watcher** (cheap, background, one cycle). Sweep the packet. Write the ping file.
Stop. No chat. No `herdr agent prompt`. No ledger writes.

**Meta** (this chat). On a tick or ping: recap in product language, show the room
map, name the surface (ledger row · ticket in parens). Propose workspace and
feature-ledger writes. Wait for go. Prompt a Work pane only after explicit approval.

When he **confirms a tab**, digest that tab (transcripts → workspace + ledger).
Do not wait for every pane in the space to finish.

## When this chat speaks

Classify the event, then ask how to proceed. One screen. English first.

| Event | What to say |
|---|---|
| Design pane idle | Name the surface. Ledger + ticket in parens. Link the proto. Ask bless, correct (in that pane), or stop. |
| Build pane idle | Name what was built in English (the parent home frame, not "P1 landed"). Ask him to look at it, or keep going. |
| Plan / spec landed | Name the decision. Ask him to read it and rule. |
| Named files moved | Paths vs the surface. |
| Requirements miss | Quote the ledger row. Quote what the pane did. Ask how to proceed. |
| Stuck / provider / wrong files | Name the pane and the failure. Ask: nudge `continue`, re-prompt (his words), or leave it. |
| Quiet 30m tick | Short recap a walk-away can recapture. If nothing moved, say so in three lines. Include the room map on any tick where something actually changed. |

A queued Begin is not permission to send. A recap is not a ledger write.

## Kill switch

Andres saying he is sleeping, or `rearm: stopped`, ends the arm. Idle after work is
a recap, not sleep.

On the switch: leave proposals queued. Do not prompt panes. Kill the heartbeat
loop. Wait until he speaks.

## Ranked truth

Higher wins. Meta repairs the lower one, after go.

1. Ledger files (what to build). Ticket bodies point here. They do not restate the spec.
2. Linear (lifecycle only: Speccing / In Progress / Ready). Ready is shipped for a slice. Never mark Done from this flow.
3. herdr (liveness). `working` is not shipped.
4. Named-path git (what landed). Stage the paths you wrote.

`STATE.md` Now and Log are Meta's digest of the four above, not a fifth spec.
Writing them is a proposal until Andres says go.

## Packet

Instance data lives in `.workspace/monitor/<lane>-watermark.json` and the watcher
prompt, not in this file. A new lane is a new watermark + ping file. Same this doc.

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

`rearm: stopped` is terminal for this arm. A later tick that finds it recaps only
if new evidence exists, then exits. Arm again only when Andres says to.

The watcher reads only `closed_read_list` plus the watermark, Linear status+last
comment for the listed issues, herdr for the wait panes, and named-path git against
the watermark SHAs. A builder citing a file or ADR outside that list is
`HALLUCINATION`. The watcher does not fetch more docs. The watcher does not open
workspace or feature-ledger.

## Watcher turn

1. Read the watermark. If `rearm` is `stopped` and nothing moved, write `status: quiet` / `meta_todo: stop` and exit.
2. Sweep herdr on `wait_panes` only.
3. Fetch Linear status for the listed issues.
4. Diff named-path git against watermark SHAs.
5. Quote contract rows you check. Copy the row. Do not paraphrase.
6. Write `.workspace/monitor/<lane>-ping.md` with the schema below.
7. Stop.

Heartbeat is Meta's loop (30 minutes unless the watermark says otherwise), not a
watcher self-loop.

## Ping schema

```
status: quiet | landed | drifted | hallucinated | stuck | recap
kind: design_check | build_landed | plan_landed | files | req_gap | stuck | quiet_recap
issue: ISSUE-… or none
linear: Speccing | In Progress | Ready | Todo | …
pane: herdr pane id or none
files: named paths only
quotes: ledger rows touched (verbatim)
verdict: PASS | DRIFT | HALLUCINATION
meta_todo: ask_how_to_proceed | propose_writes | stop
next_prompt: empty, or a paste-ready block (queued; send only after go)
shared_tree: dirty-<lane> | clear
```

## Hallucination

Quote contract rows.

If the pane claims a payload key, route, or ADR number that is not in
`closed_read_list`, `status: hallucinated`, `verdict: HALLUCINATION`.

Shipped means Linear Ready and the named paths exist at the watermark SHAs. herdr
`working` does not count.

## Meta on ping

1. Read the ping. Open the cited ledger rows yourself. The watcher's summary is a pointer, not evidence.
2. Recap in chat in product language: the surface, the map, what he is ruling. Classify planning / design / build.
3. **Requirements pass** when a pane claims done: ticket acceptance vs named files vs quoted ledger rows. Report misses. Do not fix from this desk.
4. Propose workspace (`log` / Now) and feature-ledger writes as a block. Do not apply them until Andres says go. Session gate still binds the proposal — a red gate is part of the proposal, not a silent claim.
5. Ask how to proceed. One question. Examples: look at the proto · paste a correction (his words) · digest this tab into the ledger · leave it.
6. Prompt a Work pane only after that go, with the text he approved. `continue` on a provider death also needs go unless he already standing-ordered nudges (he has not).
7. Kill switch: sleeping or `rearm: stopped` → do not prompt, do not write, stop the loop.

## Arm

From Meta, after the layout matches WORKFLOW §8. Skip this section when `rearm` is
`stopped` unless Andres says to arm again.

1. Write or refresh the lane watermark. `rearm` starts as `heartbeat-only` for
   observe-while-he-works, or `one-task` when waiting on a single pane to land.
2. Launch one cheap background Task only when a pane wait is worth a cycle.
   Otherwise heartbeat-only.
3. Start the local loop at the interval on the watermark (default 1800s). Sentinel
   `AGENT_LOOP_TICK_<lane>_monitor`.

Re-arm a Task only when the kill switch did not fire. Record Task id and loop pid
on the watermark.
