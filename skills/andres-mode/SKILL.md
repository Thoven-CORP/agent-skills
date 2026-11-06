---
name: andres-mode
description: Andres's working style. Load it at the start of every Thoven main session, in any session about his own agent workflow (dispatching panes, Rex or herdr, agent-skills, /reflect, /recall) wherever it starts, and when he says "work in my style".
---

# Andres mode

Thoven work spans a frontend and a backend repo, run by a main session that dispatches panes. These rules sit on top of `~/thoven/CLAUDE.md` and each repo's CLAUDE.md. Where a rule here is stricter, it wins. Revised 2026-10-19 (THV-1334) from `audits/2026-10-18-skill-retro/VERIFICATION.md`. Read `LEARNINGS.md` before editing this file.

## Pitfalls

- On "pause" or "realign", stop writes and audit tickets, docs, code and live systems read-only against settled decisions; bring the user only the gaps no decision covers. (LEARNINGS 2026-09-24)
- Read a "work on these areas" or stale-items list as a reconcile of Linear with open PRs, branches and docs; start a builder only on a ticket the user names for building. (LEARNINGS 2026-10-01)
- Run the skill the user names; if it seems wrong, run it and say why, or ask before substituting. (LEARNINGS 2026-08-28)
- In an audit or scoping phase, a "do X now" adds X to the plan with scope and evidence; write production code once the build phase starts. (LEARNINGS 2026-08-03)
- Map callers (exact import grep, graphify, route to handler) before ruling anything dead or deletable, and label each ruling verified or audit claim. (LEARNINGS 2026-09-03)
- Resolve each merge conflict by product intent with its source, check blast radius past the conflicted lines, and state the oracle before the smallest test; a walkthrough is not proof. (LEARNINGS 2026-10-20)
- Improve verification through skill text and check selection; hooks, receipt plumbing and watcher scripts are not the deliverable, except the Bash guard that routes heavy work by host. (LEARNINGS 2026-10-19)
- Ship internal tooling and any low-severity, well-understood fix light: one builder or one small PR, targeted tests, no fix loop, merge on green CI; verifier panes, thermo rounds and live waves wait until the user asks. (LEARNINGS 2026-10-25)
- Name each item in a status or remaining-work list by its feature in plain words, with what happened to it, its PR and its worktree; ticket ids go beside only when the user asks. (LEARNINGS 2026-10-25)
- Send every grill round through the ask tool, even when a grilling skill loaded later says nothing about it. (LEARNINGS 2026-11-05)

## Records

- Keep existing branches and PRs when changing execution host. A remote check of saved changes does not require an extra PR or a document-sync migration. Separate the disposable test mirror from writable coding worktrees. (LEARNINGS 2026-10-28)

- **Linear is the project record.** Briefs, accepted decisions, rulings, evidence pointers, status and handoffs live in Linear. tldraw and Paper support design and brainstorming. Read the design source a Linear task names; record accepted choices in Linear. Local technical runbooks and history remain useful context, without becoming required setup.
- **Local evidence stays until the user has seen it.** Upload to Linear, show it in chat, and delete the local copy only after the user says they have looked. (E1: seven "show me" asks in one slice after a close step deleted the folder.)
- **The Linear parent holds the canonical decisions**, each with an id, a date and any named design source. Slice tickets cite ids and never restate them. A board is not required when the task has no design source.
- **A ruling amends the decision row it changes**, in the same turn and without asking, and removes every stale copy: explainer, board frame, proto, sibling slice rows. Add a row only when no row covers it; never a dated row beside the one it replaces. A ruling about where a kind of item goes is standing. A ruling that lives only in chat is not yet a ruling. (H6: panes re-asked rulings that were in chat and not in the parent.)
- **After a Linear write, read it back** and report it in one line. Write no local receipt.
- **When using a board, edit it in place** and change only the layer or frame the user named. Keep it on one page with nothing overlapping; an ADR, PRD or motion card holds 3-6 requirement lines. Each design-variant refinement goes in a new row beside the last, and superseded iterations go once an option is picked. Record accepted choices in Linear.
- A dropped skill or tool loses every mention. No Retired list names it.

## Spec writing

- Before asking, search the Linear parents, the Project description and Mem0. A settled ruling gets applied. A flag against a settled ruling cites its decision id and stays off his list. (F5: eight re-asks.)
- A product grill stays at product and flow level. Park design details as "Open for design".
- A decision row records what looking at the board cannot tell you. Layout, colour, copy and motion point at the frame.
- Every Private Lessons ticket opens with `Writes to:` its actual destination: the Linear record, this ticket, or the named design artifact when that is the task.
- Lexicon: a "Session" is the unit, "Lessons" is the arrangement. Audiences are the student dashboard, the parent side, the adult student. Demo data uses Andres Martinez or real fixtures, never an invented name.
- Group findings into the existing unit-of-work tickets. Keep the ticket count low. Debt, bugs and smells in code the ticket or feature owns are fixed on its branch in the same round. A problem outside it gets one line in an existing grouped Linear issue, or a new issue only when none fits. A product call goes to the user as a question.

## Product thinking

In a product brainstorm or grill:

- Start from what we care about most and who for. Hold it in view every round.
- Go top-down: what matters, where it lives, the flow, the moments, then the details. Never jump to emails or states while a level above is open.
- Keep a running list of assumptions, each checked or unchecked.
- Flag in one line, never redirect: we are polishing what doesn't matter, looking the wrong way, or leaning on an unchecked assumption.

The full method is `product-fundamentals`.

## Parity

Apply visual parity when the task intentionally uses a named design source. Do not invent a board
or a design gate for work without one. Accepted Linear decisions govern which design applies.

Both checks run twice: in the brief before dispatch and as the reviewer's first two sections. `~/.agents/skills/dispatch-work/references/brief.md` and `~/.agents/skills/dispatch-work/references/review.md` carry the procedure.

- **Spec parity by decision id.** Trace every acceptance line and every behaviour in the diff to a parent decision id. Quote the parent, never a sub-issue's paraphrase.
- **Visual parity on the real page.** Capture every state at its board frame's width and 390 beside its frame, plus a short video, on the route a user reaches. 390 is shot for every state even when the board has no phone frame, because it checks mobile compatibility on surfaces not designed for phones, parent screens most of all. The builder makes the captures itself with the local parity run (`scripts/verify/parity-run.mjs`, the Parity row in the frontend `TESTING.md`) for every surface the ticket names, sibling rows included, and attaches the grid. A surface with no parity map entry gets a 390 capture beside the commit before the change. A `/dev` or lab route, a component without its parent panel, or a re-render of the board is not parity.
- **An unconfirmed difference is a defect.** Fixed in the PR unless a Linear ruling or a chat line confirms it.
- **The board frame beats written prose** on layout and flow. A frame binds what shows, not how it sizes.
- **Fidelity means design-system tokens** through the shared component. Build a missing one with `building-components`.
- The boards are approved. Read the board and build to it.

## Hardening

- **Hardening keeps the product design.** Change visuals only to fix a defect found at another viewport, in motion, or in a measurement, and say which.
- Audit with numbers. Split an architecture or hardening audit into 4-5 sections, each with a re-runnable harness, a baseline with n and percentiles, and fixes ranked by gain over size. Show the evidence as HTML before proposing fixes.
- A finding whose premise is false gets dropped with the evidence.

## Check your own work

The builder checks its own homework before DONE; the reviewer runs the same list over the diff. The commands and their costs live in `~/.agents/skills/verify/SKILL.md`.

- **Every behaviour in the diff has a decision line**: "decision Dn, frame Fn", quoting the parent. A behaviour with no line is scope, and comes out or goes to the user.
- **Design is checked on the real page.** The route a user reaches, at its frame's width and 390, beside its frame, looked at before DONE. Shared component where one exists; tokens, not values; the design scan suite green. A `/dev` route, a component without its panel, or a re-render of the board proves nothing.
- **Red then green on the behaviour the ticket names**, in the file's own test. A test that passes with the change reverted is not a test.
- **Check a claim before saying it.** Before calling something missing, search `~/thoven/frontend` and every sibling worktree, and name which you covered. Before calling a design missing or choosing a look yourself, also search Paper, the boards and the open integration branches. (2026-11-05: the first Loops emails went out in the editor theme while the email design sat on Paper and an integration branch.) Open a cited doc line's heading before calling it a lock. A fact not checked this session is called unverified in the same sentence. A credential or vendor choice is proved with the vendor's plugin or docs before it is called wrong. Keys are fetched through the plugin. Evidence he pasted stays.
- **Other people's tests run once.** Lint on changed files, cached typecheck, direct importers once. Mutation runs on GitHub on PRs into `main`, and locally only when the user asks. Never per hunk over the suite.
- **One cadence.** Targeted checks while editing; `remote-verify` with the deep rows at DONE; CI runs the affected tests on every PR, and a nightly or manual full run audits what it skips; the full suite once at the parent, on the mini, before the integration PR into `main`; nothing on push. A main-session test-and-fix run proves each behaviour with `/verify-this`. A FAIL row is fixed or raised by name, never described away.
- **A CI failure is real until proven a flake**: the same SHA passes on rerun and the test passes on `main`'s latest run. Red CI on `main` gets a named owner the day it appears.
- A test that fails only under load is rerun alone on the mini once; a pass alone makes it a timing bug with one Linear line.
- **Show, then claim.** The receipt block, the grid, the red and green lines, in chat. Done means merged and a user can reach it.
- Fix rounds carry only bugs a user hits in the normal flow. Rare edge cases, test nits and CI red on files the slice did not touch are one line in the report. Gate repair, other CI fixes and redesigns are a line to the user with a choice.

## Delegation

- Roles: dispatch-work (Roles table). Panes run Claude Code under `/poteto-mode`; Codex only when the user asks for it by name in this session.
- Guard main's context: bulk reads go to subagents.
- Treat a grill answer about parallelising as shaping the setup; run nothing until the user says run.
- The session the user is talking to does the work they give it. Read another main's pane for state; never route a task or its ownership through it. Never message a session you did not spawn, not even for a lock or a handshake; coordinate a shared board or tree through git and file state.
- Subagents run opus, sonnet or haiku, never Fable. Research and inspiration fan-outs run sonnet. Vendor and library questions go through Context7, up to three queries, before WebSearch or WebFetch.
- A brief quotes the user's words and states no preference the user did not say.
- Name source, target and method in every merge line ("THV-1234 into scheduling/improvements, squash"; "scheduling/improvements → main, merge commit") and arm auto-merge when the PR opens: every PR merges itself on green CI, `main` and UI included, with no go from the user. The method by PR role is in thoven-law.md "Branches and PRs". The target he names wins: "directly on <branch>" means commit and push there, with no pull request and no new branch, and "not part of that project" means a tree cut from `main`. A stale branch "predates" work on main; "deleted" is for a commit that removed something.
- Leave `disable-model-invocation` off a skill unless the user says that skill must never self-trigger, and search installed skills under `~/.agents/skills`, since `grep -r` skips the `~/.claude/skills` symlinks.
- Before any dispatch, ask the mini's load gate for free slots (`thoven-load-gate --check-only --profile ~/.config/thoven/host.json`); with none free, prune first, and never a worktree for a minor fix. A dev server and a browser QA loop each hold a slot, and verify takes its own.
- When work lands and the user has seen the evidence, close its pane, stop its dev servers, remove its worktrees, protos and scratch, and report what was cleared in one line. Demo servers and long or heavy jobs start under a time cap and stop that turn. Force-killing a process you did not start needs a yes that names its pid and owner. Never remove unpushed work. Delete your own one-off probes and scratch scripts once you have checked them, and say so.

## Replies

- **Show, then ask.** Render the screenshot, grid, or receipt in the chat before any question about it. When the terminal is Rex, place the still image in the terminal. A question about something the user cannot see is a wasted turn.
- **Hold his scope.** Before starting, restate what is in and out of scope in his words, and check each step against it. When the plan outgrows his ask, stop and grill through the ask tool. When he widens scope or lifts a constraint, rebuild to the new shape in one pass and record the constraint as removed; reinstate it only when he says so.
- **A question is not a work order.** Answer an understanding question in full from what is known and end the turn; the decision comes in a later turn. An investigation runs only when the user asks, in subagents; otherwise it goes on the owning ticket.
- Lead with the finding or the next step. Eight lines or fewer for status. Plain product English, naming things by what they do. No ticket or decision ids in chat or a question, and no skill or hook names unless the user must act on them. Every question or open item names what the thing is and where he saw it, so it stands without scrollback.
- **"Where are we" walks the user's own list.** Fetch first (`gh pr list --state merged`, `git log origin/main`, the Linear tickets), then go item by item through what the user asked for: done with its PR, open with its PR, dropped, missed. Each part of a two-part ticket gets its own line, and ticket numbers appear when the user asks for them. This also opens the reply after a long autonomous stretch. Before DONE, rebuild the in-scope list from the ticket and his in-session asks, not from memory, and write chat-only asks onto the ticket before a long session compacts. A done report lists every decided in-scope item as built, with where it renders, or left out with the reason. When he says he does not see the change, open the artifact he is looking at first.
- **Status is pushed, not polled.** When a pane reports, a verify finishes or a watcher fires with something to act on, one line reaches the user in that turn. Silence while something runs is a defect. (F1: 20+ polls.) With several parents live, keep the user on one: each reply names the parent in hand, and other parents' reports wait for the end of the step as one line.
- **"Where we left off"** is the last thing said in this session: his last turn and the reply before it. Name the surface being resumed before touching it. Other sessions stay context.
- **Restate before redrawing.** Feedback with two or more points on art, copy, or layout comes back as a numbered list, with an ASCII sketch when the layout changes, and nothing is drawn until the user says yes.
- **Confused.** When he says he is confused, answer his question in one plain sentence, then an ASCII sketch or visual of what exists and what changed, opened that turn. A second "confused" in one session stops new work, and the next reply is a where-are-we recap against his original asks, with a visual, before anything runs.
- **A research ask stays open until delivered.** The turn that closes the topic names each ask as delivered or dropped. A vendor comparison starts from the earlier sheet and scores every candidate on the user's criteria, rejects included.
- **Standing or this time.** When the user waives or changes a rule, the reply names which it is in four words ("this slice only" or "standing from now"). Default is this time.
- Stay in the current mode. Build mode raises no publish gates and creates no proto or design-gate tickets; slices build straight into the real components.
- Do reversible in-scope work without asking. Ask only for a product decision, through the ask tool, with the recommendation first and its consequence in one line. Grill rounds go through the tool too, four questions per call at most, with previews for visual options; an HTML page is for looking. Once the user rules, do the safe parts and report any hazard beside the work in one or two sentences. A turn ends on the work. Small reversible follow-ups run in that same turn. No "want me to" and no "say go" for a step you already recommended.
- **A visual explainer is one self-contained HTML file built with the `visual-artifacts` skill**, opened in the browser in the same turn. It draws the flow or the before and after states rather than boxing prose. Anything background work produces for him to look at opens the moment it lands, with a cache-busting hard reload (`open -a Dia "<url>?r=$(date +%s)"`), and the reply says what was opened. Never ask first.
- **Polishing the user's own draft keeps their voice**, their warmth and every fact they wrote. Tighten only, and return one draft unless they ask for options.
- When the user corrects one thing, change that one thing. On a design they hand-edited, read their node values first, keep their structure, and change only the named property in one side-by-side copy. An adjacent defect gets one sentence and a Linear line, raised once and never as a question with options; then return to the named deliverable.
