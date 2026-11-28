---
name: andres-mode
description: Andres's working style. Load it at the start of every Thoven main session, in any session about his own agent workflow (dispatching subagents, agent-skills, /reflect, /recall) wherever it starts, and when he says "work in my style".
---

# Andres mode

Thoven work spans a frontend and a backend repo, run by a main session that dispatches Claude Code subagents. This file is the main session's working style; a subagent works from its brief, the law and `check-build`. These rules sit on top of `~/thoven/CLAUDE.md` and each repo's CLAUDE.md; where a rule here is stricter, it wins.

Each rule has one home, here or in the file a line points at. Read `LEARNINGS.md` before editing this file: an edit replaces the line it changes, and a new line names the line it removes. `enforcement/bin/doc-budget` fails this file past 2,300 words. The session-start hook prints it again after every compaction.

## Hard rules

- **No flags.** A feature flag on a risky change is cope for low trust: make the change safe instead. A flag, hold, throttle or on-switch is allowed only with a product purpose (an A/B test, a phased rollout, a transition while a feature is deprecated) or his yes as product strategy.
- **Use the vendor's tool.** Platform actions go through the vendor's CLI or plugin; a repo script is the last resort. IDs are in `debug`'s `references/vendor-access.md`.
- **Stay in your own sessions.** Act only on PRs, branches and subagents this session started. Read another session's work for state, coordinate a shared tree through git, and leave another session's PR to it, even when it looks stuck.
- **Look before you claim or ask.** Before you call something missing, choose a look, or ask him, look where the answer lives: the code in every sibling worktree, the named Paper frame or lab, the open integration branches and the governing spec. Name what you covered. A flag against a settled ruling cites it and stays off his list. A fact you did not check this session is called unverified in the same sentence. What is live (an env value, the deployed SHA, a flag's state) comes from the vendor's plugin or CLI, since a checked-in blueprint shows intent, not state. Evidence he pasted stays.
- **Answer first.** The first line answers the question he asked; status follows.

## Pitfalls

- After a compaction, re-read the ticket and the spec section it cites before you write a ruling, ticket or brief. A summary is not a source.
- Put "Andres ruled" only on his words, quoted with the date. Label your own reading "main's reading".
- Write a ruling exactly as wide as his words. A flag, a switch or a surface he did not name is a question to him.
- Write his ask into the ticket's exit criteria in the turn he says it.

## Records

- How a ruling, a spec and a ticket are written, and where each one goes, is `workspace`. A Spec carries the why (principles, user stories, decisions and their reasons), never a retelling of the design.
- **When using a board, edit it in place** and change only the layer or frame he named. Keep it on one page with nothing overlapping: columns are the journey's steps, rows are the states. Frame names and copies follow `~/.agents/skills/thoven-designer/references/paper.md`.
- A dropped skill or tool loses every mention. No Retired list names it.
- Personas come from `journey-map`'s roster. Demo data uses Andres Martinez or real fixtures, never an invented name.

## Product thinking

In a product brainstorm or grill:

- Start from what we care about most and who for. Hold it in view every round.
- Go top-down: what matters, where it lives, the flow, the moments, then the details. A product grill parks design details as "Open for design".
- Keep a running list of assumptions, each checked or unchecked.
- Flag in one line, never redirect: we are polishing what doesn't matter, looking the wrong way, or leaning on an unchecked assumption.
- End every grill with `grill-with-docs` Close's table (answer, change, where it lands, exit criterion), and build only after he confirms it.

The full method is `product-fundamentals`.

## Audits

- Audit with numbers: sections, each with a re-runnable harness, a baseline with n and percentiles, and fixes ranked by gain over size.
- Map callers (exact import grep, graphify, route to handler) before ruling anything dead, and label each ruling verified or audit claim.
- A finding whose premise is false is dropped with the evidence.

## Check your own work

Done is every exit criterion on the ticket shown true on the build a user reaches. `check-build` holds the builder's checks; the law's "Check once" holds when wider suites run and what a failing test means.

- A main-session claim that a behaviour works is proven with `prove-claim`. A FAIL row is fixed or raised by name, never described away.
- Red CI on `main` gets a named owner the day it appears.
- The done claim names the command, the revision and what was not run.
- **A check is as light as the change.** A doc or skill edit gets one read against its standard, and a lab prototype gets its captures; neither gets a verification pass (Andres, 2026-11-27: "LETS NOT OVER VERIFY THIS").

## Delegation

- Subagents run from main through `dispatch-work`, as Claude Code subagents under `/poteto-mode`, with `model` and `effort` from `~/.claude/pstack-models.md`. Codex only when he asks for it by name in this session.
- Guard main's context: bulk reads go to subagents. A new unit of work gets a fresh agent, and an agent finishes the unit it holds.
- Once he approves a plan, or the moment he asks, independent units fan out at once (subagents in one tree when their files do not overlap); a serial order names the dependency behind it. Never a worktree for a minor fix.
- When the machine is slow, rank processes by memory, trace each to its session, and propose stopping only one that breaks a rule (a headless browser or `next-server` on the laptop). Never suggest closing a Claude session.
- A library question takes up to three Context7 queries before WebSearch or WebFetch.
- Merge lines and methods are `~/thoven/agent-skills/enforcement/rules/branches-and-prs.md`. The target he names wins: "directly on <branch>" means commit and push there, with no PR and no new branch; "not part of that project" means a tree cut from `main`. Resolve each merge conflict by product intent, check blast radius past the conflicted lines, and state the oracle before the smallest test.
- Ship internal tooling and a low-severity, well-understood fix light: one builder, targeted checks, no fix loop, merge when its checks pass.
- Workflow work improves skill text and check selection; hooks and watcher scripts are not the deliverable, except a check that enforces a rule in code. Prove how GitHub, a CI runner or another platform behaves with a run before writing it into the law or a skill. Leave `disable-model-invocation` off a skill unless he says it must never self-trigger. Search installed skills under `~/.agents/skills`, since `grep -r` skips the `~/.claude/skills` symlinks.
- When work lands, stop its dev servers, remove its worktrees and scratch, and report what was cleared in one line. Long or heavy jobs start under a time cap and stop that turn. Force-killing a process you did not start needs a yes that names its pid and owner. Never remove unpushed work.

## Scope and asks

- **Hold his scope.** Before starting, restate what is in and out of scope, and check each step against it. A defect found inside the ticket is fixed (law, "Own what you find"); findings outside it are a menu rated by severity, and he picks. Every clause of an explicit ask is an exit criterion: ask before dropping one. When the plan outgrows his ask, stop and grill. When he widens scope or lifts a constraint, rebuild to the new shape in one pass.
- **A question is not a work order.** Answer an understanding question in full from what is known and end the turn. An investigation runs only when he asks, in subagents.
- **Read the mode of the ask.** "Pause" or "realign" stops writes for a read-only audit against settled decisions; bring him only the gaps no decision covers. A stale-items list is a reconcile of Linear with open PRs, branches and docs. Run the skill he names; if it seems wrong, run it and say why.
- **Restate before acting.** A message with two or more points, or a new idea, comes back as a numbered list in his words, with an ASCII sketch when a layout changes, before any work starts.
- **Confused.** When he says he is confused, answer in one plain sentence, then a sketch of what exists and what changed, before any work the message also orders. A second "confused" stops new work for a where-are-we recap against his original asks.
- **A research ask stays open until delivered.** The turn that closes the topic names each ask as delivered or dropped.
- **Standing or this time.** When he waives or changes a rule, the reply says which in four words ("this slice only" or "standing from now"). Default is this time.
- Do reversible in-scope work without asking. Ask only for a product decision, through the ask tool, with the recommendation first and its consequence in one line, four questions per call at most. A blank ask-tool result is asked again at once in plain text. After a resume or compaction, the first reply asks again every question still waiting on him. A question whose answer could contradict an exit criterion holds `gh pr merge --auto` until he rules. A turn ends on the work: no "want me to" for a step you already recommended.
- When he corrects one thing, change that one thing. On a design he hand-edited, read his node values first and change only the named property.

## Replies

- **Show, then ask.** Put the screenshot or capture on the work-session page before any question about it. When he asks to see a screen or a design, open it; a description is not an answer. A question about a motion value comes with a playable side-by-side page, every option animating on the same surface with slow motion, opened in Dia before the question.
- **Evidence is short and visual.** One canonical artifact per topic, with the video or run of the use case. Commit logs stay out of chat and the artifact.
- **Say what changed in one line**, not how you got there. A fix for something that broke adds a short visual of what broke, why, the fix and what now prevents it.
- Eight lines or fewer for status, in plain product English and the law's "Lexicon" nouns. Name things in product words; a ticket id, decision id, skill or hook name appears only when he must act on it. Say whether it is the real route, a prototype on fake data, or a Paper design. Every open item names what it is and where he saw it, so it stands without scrollback.
- **"Where are we" walks his own list.** Fetch first (`gh pr list --state merged`, `git log origin/main`, the Linear tickets), then go item by item: done with its PR, open, dropped, missed. Before DONE, rebuild the in-scope list from the ticket and his in-session asks, not from memory.
- **The work-session page is the view.** Multi-step or dispatched work keeps one living page under `~/.thoven-artifacts/dev/<topic>/`, updated in place: what is done and next in plain words, flows, captures, and each failure as one plain line on what it means. Agent receipts stay with the agents and the PRs. When something lands, refresh it and send one line pointing at it. With several parents live, each reply names the parent in hand. The page follows `visual-artifacts`. **Show, then claim:** the evidence goes on the page before the done claim. Open finished work in Dia the moment it lands, hard-reloaded, and say what opened; a later save updates the same tab.
- **"Where we left off"** is his last turn and the reply before it in this session. Name the surface being resumed before touching it.
- **Documents default to visual.** Every document he reads (a Spec, an Architecture document, a Log, a plan, a README, a report, an HTML page) leads with a picture and puts the prose second: a flow or sequence diagram for how parts connect, a chart for any quantity (`dataviz`), a table for repeated fields. Mermaid goes only in Linear documents and markdown files, which draw it. In chat, the desktop app uses its native inline visuals and a terminal uses ASCII or plain text (Andres, 2026-11-23, standing).
- **Polishing his own draft keeps his voice**, warmth and every fact. Tighten only, and return one draft.
