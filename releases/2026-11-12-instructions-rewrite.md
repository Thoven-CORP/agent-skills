# 2026-11-12: the instructions rewrite

One release of changes to the skills, the law, the rule files, the hooks and the Linear templates.
Read this before you change how a spec, an architecture document, a ticket, a dispatch brief or a
review is written.

## Why

Two projects missed the product with green checks: the credential close-out and the Music Passport.
A meta-analysis on 2026-11-12 traced both to the instructions agents follow. In Andres's words:
"the issue is instructions and what to build… Agents follow prompts. Agents follow skills. That is
what we're trying to fix."

What the instructions produced:

- A Passport-sized project wrote about 131,800 words of documents. The spec was 25,026 words, and a
  third of it was not current truth.
- The decisions log was 22,138 words and quoted Andres 12 times.
- A sent dispatch brief was about 2,250 words, of which 11 to 13% pointed at a source and the rest
  restated or prescribed method.
- 43 of 46 builders loaded the main session's 4,289-word working-style skill.

## What Andres decided

His answers, in his words where he typed them, are in
`2026-11-12-instructions-rewrite/grill-outcome.md`. In short:

- A Project has three Linear documents, each from a template with fixed sections: a **Spec** (what
  is true now), an **Architecture** (where it lives in the code) and a **Log** (why, in his words).
- The **Build ticket is the brief**: Outcome, What to build, Build from, Exit criteria.
- Every spec rule carries its reason. Every exit line pairs an outcome with its one proof.
- Size limits: Spec 3,000 words, Architecture 3,000, Log 120 an entry, ticket 400 with 3 to 10 exit
  lines. At the limit the writer consolidates, then adds. A counter runs on every Linear save.
- The builder finishes the whole dispatch, runs each proof once, and reports once. One review at
  the end reads those proofs. No check is run by two parties by default. The builder never edits
  exit lines.
- The main session's own start-up load does not change.

## What changed

| Area | Change | Words before | Words after |
|---|---|---|---|
| Linear | Workspace-level document templates Spec, Architecture, Log. Workspace-level issue templates Build, Work item, Bug, Brainstorm. The "Thoven project" template and the two setup documents updated | no document templates | seven templates |
| `skills/dev/workspace` | "Writing to Linear" with "How to write a Project document". "Exit criteria" as the one home, with three worked examples. The history-shaped decision entry is gone. The old "Log" artifact is "Activity" | SKILL 1,989. WORKFLOW 5,485 | 1,979 and 5,035 |
| `skills/andres-mode` | Now the main session's file. Parity and the check cadence are pointers | 4,289 | 2,745 |
| `skills/dev/dispatch-work` | The brief is the ticket plus where to work and how to report. FINISH replaces DONE WHEN. No hand-over at 150 actions. One review of the whole dispatch | brief.md 1,951. review.md 1,438 | 753 and 1,066 |
| `skills/dev/verify` | Home of the check cadence: each exit line's proof once, plus lint and type-check on touched files | 1,450 | 1,195 |
| `enforcement/rules/thoven-law.md` | "Records and sources". Design parity moved in word for word from andres-mode. Branch, pull request and merge rules moved out | 2,041 | 1,575 |
| `enforcement/rules/branches-and-prs.md` | New. Read before branch, pull request or merge work | 0 | 1,387 |
| Spec and plan skills | `technical-spec-generator` deleted. `feature-ledger` local templates deleted. `to-spec` and `writing-plans` leave the spec stage. `architect` is judged by four fixed measures and `to-tickets` cuts tickets from the Units table (both through `reapply-skill-patches.py`) | | |
| Builder start-up | `enforcement/config/builder-settings.json`, passed by `dispatch spawn`. The andres-mode and ticket-recall hooks stay quiet in a builder | | |
| Size counter | New hook `enforcement/hooks/thoven-doc-size`, registered by `enforcement/install/claude.py` | | |
| Rule files outside this repo | The root file drops Feature Folders (2,577 words to 701). The frontend and backend `CLAUDE.md` stop restating the law (5,034 to 3,684, and 4,785 to 4,137) | | |

The per-file table and the check against the proposal are in
`2026-11-12-instructions-rewrite/integrator.md`. Each touched skill's `LEARNINGS.md` has a
2026-11-12 entry.

## How to go back

- **This repo.** The commit before this release is tagged
  `release/2026-11-12-before-instructions-rewrite`. The release commit is tagged
  `release/2026-11-12-instructions-rewrite`. Diff the two tags to see everything.
- **Linear.** `2026-11-12-instructions-rewrite/linear-before.json` holds every template and both
  setup documents as they were before the first write. `l-linear.md` lists each id written.
- **Rule files outside this repo** are in git in their own repos.

## Not proven

Andres chose to execute and dogfood: "We do not need to prove anything yet".

- No real spec has been written into the new template. The 3,000-word limit is untried.
- The builder profile started one throwaway session. No dispatched builder has run with it.
- The counter blocks an over-limit save that sends the whole body. Whether a Linear save returns
  the saved body is unknown, so the count line after a save, and any check of a partial edit, may
  never fire. Codex panes do not run it.
- Nobody measured what a long dispatch costs without the 150-action hand-over, which was set for
  cost.
- One review at the end means a mistake in a parent's first ticket is found last.

## Left open

- The law's moved parity bullet still says "acceptance line" and "decision id". Main moved the
  wording unchanged (main's reading; the transcript holds no ruling from Andres on it, found by the
  2026-11-12 decisions ledger).
- `WORKFLOW.md` sections 1, 6 and 8 still carry old stage names ("PRD and Design fat cards", the
  DESIGN_SKELETON ladder).
- `thoven-designer/SKILL.md:10` cites a `feature-ledger` rule 16 that no longer exists.
- `README.md` still lists `/technical-spec-generator` and `to-spec`. The fix was held back because
  another session had uncommitted README edits.
- The Thoven and Deployment teams show Work item, Bug and Brainstorm twice, once from the workspace
  and once from the team.
- `WORKFLOW.md` section 7 changed and is pasted into Linear's agent guidance by hand.

The research behind this release is on Andres's laptop under
`~/.thoven-artifacts/dev/meta-analysis/`.
