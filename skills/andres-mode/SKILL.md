---
name: andres-mode
description: Andres's working style for Thoven. Main loads it at session start; it also answers /andres-mode or "work in my style". Linear and the tldraw board are the only records, spec parity by decision id, visual parity against board frames, show before ask, one verify cadence.
---

# Andres mode

Thoven work spans a frontend and a backend repo, run by a main session that dispatches panes. These rules sit on top of `~/thoven/CLAUDE.md` and each repo's `CLAUDE.md`. Where a rule here is stricter, it wins. Revised 2026-10-19 (THV-1334) from `audits/2026-10-18-skill-retro/VERIFICATION.md`.

## Records

- **Linear and the tldraw board are the only records.** Specs, decisions, rulings, evidence and status live in Linear. Designs live on the Project's `.tldraw` board.
- **Local evidence stays until the user has seen it.** Upload to Linear, show it in chat, and delete the local copy only after the user says they have looked. (E1: seven "show me" asks in one slice after a close step deleted the folder.)
- **The Linear parent holds the canonical decisions**, each with an id, a date and its board frame. Slice tickets cite ids and never restate them.
- **A ruling changes the ticket description** with a dated marker, in the same turn it is given. A ruling that lives only in chat is not yet a ruling. (H6: panes re-asked rulings that were in chat and not in the parent.)
- **After a Linear write, read it back** and report it in one line. Write no local receipt.
- **The board is one living spec.** Edit it in place and change only the layer or frame the user named. Delete superseded iterations once an option is picked.

## Spec writing

- Before asking, search the Linear parents, the Project description and Mem0. A settled ruling gets applied, not re-asked. (F5: eight re-asks.)
- A product grill stays at product and flow level. Park design details as "Open for design".
- A decision row records what looking at the board cannot tell you. Layout, colour, copy and motion point at the frame.
- Every Private Lessons ticket opens with `Writes to:` the board path.
- Lexicon: a "Session" is the unit, "Lessons" is the arrangement. Audiences are the student dashboard, the parent side, the adult student. Demo data uses Andres Martinez.
- Group findings into the existing unit-of-work tickets. Keep the ticket count low. Debt and bugs found in a build are fixed on the owning branch, never filed.

## Parity

Both checks run twice: in the brief before dispatch and as the reviewer's first two sections. `dispatch-work/references/brief.md` and `review.md` carry the procedure.

- **Spec parity by decision id.** Trace every acceptance line and every behaviour in the diff to a parent decision id. Quote the parent, never a sub-issue's paraphrase.
- **Visual parity on the real page.** Capture every state at 1440 and 390 beside its frame, plus a short video, on the route a user reaches (the `parity` row of `bin/verify` captures mapped surfaces; agent-browser or Playwright by hand only for unmapped ones, and then the spec gets added to the map). A `/dev` or lab route, a component without its parent panel, or a re-render of the board is not parity.
- **An unconfirmed difference is a defect.** Fixed in the PR unless a Linear ruling or a chat line confirms it.
- **The board frame beats written prose** on layout and flow. A frame binds what shows, not how it sizes.
- **Fidelity means design-system tokens** through the shared component. Build a missing one with `building-components`.
- The boards are approved. Read the board and build to it.

## Hardening

- **Hardening keeps the product design.** Change visuals only to fix a defect found at another viewport, in motion, or in a measurement, and say which.
- Audit with numbers: baseline with n and percentiles, fixes ranked by gain over size.
- A finding whose premise is false gets dropped with the evidence.

## Check your own work

The builder checks its own homework before DONE; the reviewer runs the same list over the diff. The commands and their costs live in `~/.agents/skills/verify/SKILL.md`.

- **Every behaviour in the diff has a decision line**: "decision Dn, frame Fn", quoting the parent. A behaviour with no line is scope, and comes out or goes to the user.
- **Design is checked on the real page.** The route a user reaches, at 1440 and 390, beside its frame, looked at before DONE. Shared component where one exists; tokens, not values; the design scan suite green. A `/dev` route, a component without its panel, or a re-render of the board proves nothing.
- **Red then green on the behaviour the ticket names**, in the file's own test. A test that passes with the change reverted is not a test.
- **Other people's tests run once.** Lint on changed files, cached typecheck, direct importers once, `--mutation` on a logic hunk. Never per hunk over the suite.
- **One cadence.** Targeted checks while editing; `bin/verify --base <integration branch>` once before DONE; CI on the integration PR; nothing on push. A FAIL row is fixed or raised by name, never described away.
- **Show, then claim.** The receipt block, the grid, the red and green lines, in chat. Done means merged and a user can reach it.
- Fix rounds count product fixes only. Gate repair, CI fixes and redesigns are a line to the user with a choice.

## Delegation

- Roles: dispatch-work (Roles table). Panes run Claude Code under `/poteto-mode`; Codex only when the user asks for it by name in this session.
- Guard main's context: bulk reads go to subagents.
- A brief quotes the user's words and states no preference the user did not say.
- Name the merge direction in every merge line ("THV-1234 into scheduling/improvements") and ask before any merge that touches `main`.
- Check disk and memory before any dispatch. Below 5 GB free or above load 10, prune first; never a worktree for a minor fix. At most two build panes with browsers open at once; verify reads load and free memory itself and drops to one row when the box is busy.
- Close a pane and prune its scratch when its work lands and the user has seen the evidence. Never remove unpushed work.

## Replies

- **Show, then ask.** Open the screenshot, grid or receipt in chat before any question about it. A question about something the user cannot see is a wasted turn.
- Lead with the finding or the next step. Eight lines or fewer for status. Plain English, no skill or hook names unless the user must act on them.
- **Status is pushed, not polled.** When a pane reports, a verify finishes or a watcher fires with something to act on, one line reaches the user in that turn. Silence while something runs is a defect. (F1: 20+ polls.)
- **Standing or this time.** When the user waives or changes a rule, the reply names which it is in four words ("this slice only" or "standing from now"). Default is this time.
- Stay in the current mode. Build mode raises no publish gates.
- Do reversible in-scope work without asking. Ask only for a product decision or a merge into `main`, through the ask tool, with the recommendation first and its consequence in one line. No "want me to" at the end of a turn.
- When the user corrects one thing, change that one thing.
