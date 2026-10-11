---
name: andres-mode
description: Andres's working style for Thoven: Linear and the tldraw board as the only records, spec parity by decision id, visual parity against board frames, hardening that keeps the product design, targeted tests. Use for /andres-mode or "work in my style".
disable-model-invocation: true
---

# Andres mode

Thoven work spans a frontend and a backend repo, and is run by a main session that dispatches panes. These rules sit on top of `~/thoven/CLAUDE.md` and each repo's `CLAUDE.md`. Where a rule here is stricter, it wins.

## Records

- **Linear and the tldraw board are the only records.** Specs, decisions, rulings, evidence and status live in Linear. Designs live on the Project's `.tldraw` board. Local files are scratch: briefs, receipts, evidence folders and plans in `$TMPDIR` or `~/.thoven-artifacts/` are deleted when the work lands.
- **The Linear parent holds the canonical decisions.** Each decision has an id and cites its board frame ("Frame: <frame name>"). Slice tickets cite decision ids and never restate them.
- **A ruling changes the ticket description**, with a dated marker. Comments carry evidence: parity images, test results, PR links.
- **After a Linear write, read it back** and report it in chat in one line. Write no local receipt.
- **The board is one living spec.** Edit it in place and change only the layer or frame the user named. Once an option is picked, delete the superseded iterations. Place evidence images beside the frames they prove.

## Spec writing

- Before asking or grilling, search the Linear parents, the Project description and Mem0 for an existing ruling. A settled ruling gets applied, not re-asked.
- A product grill stays at product and flow level. Park design details and undefined features as "Open for design".
- A decision row records what looking at the board cannot tell you: rules, thresholds, data shape, timing, and what was rejected and why. Layout, colour, copy and motion point at the frame.
- Every Private Lessons ticket opens with `Writes to:` the board path.
- Lexicon: a "Session" is the unit, and "Lessons" is the arrangement. Name the audience as the student dashboard, the parent side or the adult student. Demo data uses Andres Martinez.
- Group findings into the existing unit-of-work tickets. Keep the ticket count low, and give each ticket a clear unit of done.
- Write tickets, ADRs and handoffs with `~/.agents/skills/technical-writing` and `~/.agents/skills/writing-for-agents`. A handoff ends with an invocation prompt of five sentences or fewer.

## Parity

Both checks run twice: in the brief before dispatch, and as the reviewer's first two sections. `~/.agents/skills/dispatch-work/references/brief.md` and `review.md` carry the procedure.

- **Spec parity by decision id.** Trace every acceptance line, and every behaviour in the diff, to a parent decision id. Report invented scope and missed decisions. Quote the parent, never a sub-issue's paraphrase.
- **Visual parity against board frames.** Capture every screen and state the work built at 1440 and 390, beside its frame, plus a short video of the flow. Upload the images and the difference list once, at close after the user confirms (dispatch-work `SKILL.md` step 6.1).
- **An unconfirmed difference is a defect.** A difference the user did not confirm in a Linear ruling or in chat is fixed in the PR. A confirmed one cites its ruling. Only fully confirmed board states bind. A small exploratory prototype, or a state the user waived, is listed as "not binding" with the reason.
- **The board frame beats written prose** on layout and flow. Update the ruling and the ticket to match the frame. Rulings still govern what a frame cannot show.
- **A frame binds what shows, not how it sizes.** A frame is one static sample at one width. It binds which elements are present, their states, order, hierarchy and tokens. Fill or hug, stretch and reflow at other widths follow component best practice: match the frame at its own width, and give the reason in one line.
- **Fidelity means visual parity on design-system tokens.** Use the shared component where one exists. Build a missing one with `~/.agents/skills/building-components`, which is normal work, not a defect. Check against `~/.agents/skills/better-ui` and `~/.agents/skills/thoven-designer`.
- The boards are approved. Read the board and build to it.

## Hardening

- **Hardening keeps the product design.** Improve the architecture, data flow, concurrency and performance underneath. Change visuals only to fix a defect found at another viewport, in motion, or in a perf measurement, and say which.
- Audit with numbers. Measure on local databases, report the baseline with n and percentiles, and rank fixes by gain over size.
- A finding whose premise turns out false gets dropped with the evidence, not built.
- Fix bugs and debt found during the work on the owning branch. File only a genuine product decision. Fix rounds follow dispatch-work `references/review.md`, "Handling findings".

## Tests and verification

- **Targeted tests only.** Full suites, builds and e2e run only when the user asks. The machine and database rules live in dispatch-work `references/brief.md` (STANDING) and `enforcement/rules/thoven-law.md`. Production is read-only.
- "Done" means the touched tests ran green and you read the output. Name anything not run.
- Show the evidence, then merge. Merge the SHA you tested: the tested commit, the PR head and the report must name the same SHA.
- Run `bin/verify` once per diff, before the push, and cite its receipt. Integration-branch slices rely on targeted specs and CI.
- A feature slice gets a verifier pane. Cleanup and hardening get a review subagent (tiers: see dispatch-work `references/agents.md`). Run the review skill the user named, and say which one ran.

## Delegation

- Roles: see dispatch-work (Roles table).
- Panes run under `/poteto-mode`, which picks its own skills. Codex panes run only when the user asks. Tiers: see dispatch-work `references/agents.md`.
- Guard main's context: route bulk reads to subagents and keep their summaries.
- A brief quotes the user's words. It states no preference the user did not say.
- Cutting a lane, dropping a gate or swapping a planned check is a plan edit plus one chat line, in the same turn.
- Close a pane and prune its scratch as soon as its work lands. Never remove unpushed work.

## Replies

- Lead with the finding or the next step. A status reply is eight lines or fewer. Plain English, short sentences, tables for comparisons. An open question for the user goes first, never at the end of a long message. Diagrams are ASCII in chat, or a visual HTML page for data models and evidence.
- Explain at beginner level when asked, as you would to a product person.
- Stay in the current mode. In design mode, nothing gets built. In build mode, raise no publish or deploy gates and no legacy-screen framing.
- Do the exact instruction. When the user corrects one thing, change that one thing.
- Do reversible in-scope work without asking. Ask only for a genuine product decision, through the ask-question tool, leading with your recommendation.
