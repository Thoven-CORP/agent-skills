---
name: andres-mode
description: Andres's working style. Load it at the start of every Thoven main session, in any session about his own agent workflow (dispatching panes, Rex or herdr, agent-skills, /reflect, /recall) wherever it starts, and when he says "work in my style".
---

# Andres mode

Thoven work spans a frontend and a backend repo, run by a main session that dispatches panes. These rules sit on top of `~/thoven/CLAUDE.md` and each repo's CLAUDE.md. Where a rule here is stricter, it wins. Revised 2026-10-19 (THV-1334) from `audits/2026-10-18-skill-retro/VERIFICATION.md`. Read `LEARNINGS.md` before editing this file.

## Pitfalls

- Treat a grill answer about parallelising as shaping the setup; run nothing until the user says run. (LEARNINGS 2026-09-03)
- On "pause" or "realign", stop writes and audit tickets, docs, code and live systems read-only against settled decisions; bring the user only the gaps no decision covers. (LEARNINGS 2026-09-24)
- Read a "work on these areas" or stale-items list as a reconcile of Linear with open PRs, branches and docs; start a builder only on a ticket the user names for building. (LEARNINGS 2026-10-01)
- Run the skill the user names; if it seems wrong, run it and say why, or ask before substituting. (LEARNINGS 2026-08-28)
- In an audit or scoping phase, a "do X now" adds X to the plan with scope and evidence; write production code once the build phase starts. (LEARNINGS 2026-08-03)
- Map callers (exact import grep, graphify, route to handler) before ruling anything dead or deletable, and label each ruling verified or audit claim. (LEARNINGS 2026-09-03)
- Resolve each merge conflict by product intent with its source, check blast radius past the conflicted lines, and state the oracle before the smallest test; a walkthrough is not proof. (LEARNINGS 2026-10-20)
- Improve verification through skill text and check selection; hooks, receipt plumbing and watcher scripts are not the deliverable. (LEARNINGS 2026-10-19)
- Ship internal tooling in agent-skills with one builder and a test run, fixing in this session with subagents; verifier panes, thermo rounds and live waves wait until the user asks. (LEARNINGS 2026-10-03)
- Leave `disable-model-invocation` off a skill unless the user says that skill must never self-trigger, and search installed skills under `~/.agents/skills`, since `grep -r` skips the `~/.claude/skills` symlinks. (LEARNINGS 2026-08-20)

## Records

- **Linear and the tldraw board are the only records.** Specs, decisions, rulings, evidence and status live in Linear. Designs live on the Project's `.tldraw` board.
- **Local evidence stays until the user has seen it.** Upload to Linear, show it in chat, and delete the local copy only after the user says they have looked. (E1: seven "show me" asks in one slice after a close step deleted the folder.)
- **The Linear parent holds the canonical decisions**, each with an id, a date and its board frame. Slice tickets cite ids and never restate them.
- **A ruling changes the ticket description** with a dated marker, in the same turn it is given. A ruling that lives only in chat is not yet a ruling. (H6: panes re-asked rulings that were in chat and not in the parent.)
- **After a Linear write, read it back** and report it in one line. Write no local receipt.
- **The board is one living spec.** Edit it in place and change only the layer or frame the user named. Keep it on one page with nothing overlapping; an ADR, PRD or motion card holds 3-6 requirement lines. Each design-variant refinement goes in a new row beside the last, and superseded iterations go once an option is picked.
- A dropped skill or tool loses every mention. No Retired list names it.

## Spec writing

- Before asking, search the Linear parents, the Project description and Mem0. A settled ruling gets applied, not re-asked. (F5: eight re-asks.)
- A product grill stays at product and flow level. Park design details as "Open for design".
- A decision row records what looking at the board cannot tell you. Layout, colour, copy and motion point at the frame.
- Every Private Lessons ticket opens with `Writes to:` the board path.
- Lexicon: a "Session" is the unit, "Lessons" is the arrangement. Audiences are the student dashboard, the parent side, the adult student. Demo data uses Andres Martinez or real fixtures, never an invented name.
- Group findings into the existing unit-of-work tickets. Keep the ticket count low. Debt, bugs and smells in code the ticket or feature owns are fixed on its branch in the same round. A problem outside it gets one line in an existing grouped Linear issue, or a new issue only when none fits. A product call goes to the user as a question.

## Parity

Both checks run twice: in the brief before dispatch and as the reviewer's first two sections. `~/.agents/skills/dispatch-work/references/brief.md` and `~/.agents/skills/dispatch-work/references/review.md` carry the procedure.

- **Spec parity by decision id.** Trace every acceptance line and every behaviour in the diff to a parent decision id. Quote the parent, never a sub-issue's paraphrase.
- **Visual parity on the real page.** Capture every state at 1440 and 390 beside its frame, plus a short video, on the route a user reaches. The `parity` row of `bin/verify` makes the captures; the verify skill carries the unmapped-surface step. A `/dev` or lab route, a component without its parent panel, or a re-render of the board is not parity.
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
- **Design is checked on the real page.** The route a user reaches, at 1440 and 390, beside its frame, looked at before DONE. Shared component where one exists; tokens, not values; the design scan suite green. A `/dev` route, a component without its panel, or a re-render of the board proves nothing.
- **Red then green on the behaviour the ticket names**, in the file's own test. A test that passes with the change reverted is not a test.
- **Check a claim before saying it.** Before calling something missing, search `~/thoven/frontend` and every sibling worktree, and name which you covered. Open a cited doc line's heading before calling it a lock. A fact not checked this session is called unverified in the same sentence.
- **Other people's tests run once.** Lint on changed files, cached typecheck, direct importers once, `--mutation` on a logic hunk. Never per hunk over the suite.
- **One cadence.** Targeted checks while editing; `bin/verify --base <integration branch>` once before DONE; CI on the integration PR; nothing on push. A FAIL row is fixed or raised by name, never described away.
- **A CI failure is real until proven a flake**: the same SHA passes on rerun and the test passes on `main`'s latest run. Red CI on `main` gets a named owner the day it appears.
- **Show, then claim.** The receipt block, the grid, the red and green lines, in chat. Done means merged and a user can reach it.
- Fix rounds carry only bugs a user hits in the normal flow. Rare edge cases, test nits and CI red on files the slice did not touch are one line in the report. Gate repair, other CI fixes and redesigns are a line to the user with a choice.

## Delegation

- Roles: dispatch-work (Roles table). Panes run Claude Code under `/poteto-mode`; Codex only when the user asks for it by name in this session.
- Guard main's context: bulk reads go to subagents.
- The session the user is talking to does the work they give it. Read another main's pane for state; never route a task or its ownership through it.
- Subagents run opus, sonnet or haiku, never Fable. Research and inspiration fan-outs run sonnet. Vendor and library questions go through Context7, up to three queries, before WebSearch or WebFetch.
- A brief quotes the user's words and states no preference the user did not say.
- Name source, target and method in every merge line ("THV-1234 into scheduling/improvements, squash"; "scheduling/improvements → main, merge commit") and ask before any merge that touches `main`. The method by PR role is in thoven-law.md "Branches and PRs". A stale branch "predates" work on main; "deleted" is for a commit that removed something.
- Check disk and memory before any dispatch. Below 5 GB free or above load 10, prune first; never a worktree for a minor fix. At most two build panes with browsers open at once; verify reads load and free memory itself and drops to one row when the box is busy.
- Close a pane and prune its scratch when its work lands and the user has seen the evidence. Never remove unpushed work. Delete your own one-off probes and scratch scripts once you have checked them, and say so.

## Replies

- **Show, then ask.** Open the screenshot, grid or receipt in chat before any question about it. A question about something the user cannot see is a wasted turn.
- **A question is not a work order.** Answer an understanding question in full from what is known and end the turn; the decision comes in a later turn. An investigation runs only when the user asks, in subagents; otherwise it goes on the owning ticket.
- Lead with the finding or the next step. Eight lines or fewer for status. Plain product English, naming things by what they do. No ticket or decision ids in chat or a question, and no skill or hook names unless the user must act on them.
- **"Where are we" walks the user's own list.** Fetch first (`gh pr list --state merged`, `git log origin/main`, the Linear tickets), then go item by item through what the user asked for: done with its PR, open with its PR, dropped, missed. Each part of a two-part ticket gets its own line, and ticket numbers appear when the user asks for them. This also opens the reply after a long autonomous stretch.
- **Status is pushed, not polled.** When a pane reports, a verify finishes or a watcher fires with something to act on, one line reaches the user in that turn. Silence while something runs is a defect. (F1: 20+ polls.)
- **Standing or this time.** When the user waives or changes a rule, the reply names which it is in four words ("this slice only" or "standing from now"). Default is this time.
- Stay in the current mode. Build mode raises no publish gates and creates no proto or design-gate tickets; slices build straight into the real components.
- Do reversible in-scope work without asking. Ask only for a product decision or a merge into `main`, through the ask tool, with the recommendation first and its consequence in one line. Grill rounds go through the tool too, four questions per call at most, with previews for visual options; an HTML page is for looking. Once the user rules, do the safe parts and report any hazard beside the work in one or two sentences. No "want me to" at the end of a turn.
- **A visual explainer is one self-contained HTML file**, opened in the browser in the same turn. It draws the flow or the before and after states rather than boxing prose, and reuses any earlier artifact the user pointed to as the format.
- **Polishing the user's own draft keeps their voice**, their warmth and every fact they wrote. Tighten only, and return one draft unless they ask for options.
- When the user corrects one thing, change that one thing. On a design they hand-edited, read their node values first, keep their structure, and change only the named property in one side-by-side copy. An adjacent defect gets one sentence and a Linear line, raised once and never as a question with options; then return to the named deliverable.
