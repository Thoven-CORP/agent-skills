# 2026-11-12: the Linear system

Changes to Linear's settings and to the instructions agents follow in it. Read this before you
change a status, label, milestone, Project Update or a Project's front page.

## Why

Andres, 2026-11-12: "linear overtime in one project can become too verbose, way too hard to read,
which causes me to just be lost, not understand where we are at and not be able to catch gaps and
stuff beforehand." He wants Linear readable as the source of truth.

He answered four rounds of questions, then said "Yes, apply all of it". His picks are in
`~/.thoven-artifacts/dev/meta-analysis/linear-system/decisions.md`.

## The rulings

| # | Ruling |
|---|---|
| 1 | Done means in `main`. THV statuses: Todo, In Progress, In Review, Merged, Done |
| 2 | Auto-close stays on (his pick, against main's recommendation) |
| 3 | An update with a health flag on every landing, plus weekly. The front page is one screen: built, next, blocked, needs Andres |
| 4 | Two labels: `Follow-up` and `Tech debt` |
| 5 | A problem in the feature's code is a `Follow-up` in the same Project's last stage. One outside it is `Tech debt` in the inbox |
| 6 | Priority only on Projects, bugs, follow-ups and tech debt. Urgent means production is broken. No priority, no leaving the inbox |
| 7 | Milestones stay: three to five stages Andres can open on staging, then Follow-ups |
| 8 | A feature is a Project with an end, in an Initiative. Ongoing work lives in standing Projects. Nothing floats |
| 9-12 | Five views, cleanup of the 15 active Projects, main team only, three things to try |

## What changed in Linear (by main, before these files)

- THV `Ready` renamed `In Review` (same id). New THV status `Merged`.
- Merge rules: merged into `main` sets Done, into any other branch sets Merged. Draft sets In
  Progress. Opened, review requested and ready-to-merge set In Review.
- The inbox refuses a ticket with no priority. The weekly update reminder is on.
- Labels `Follow-up` and `Tech debt` created. `Bug`, `Feature`, `Improvement` retired.
- Projects `Tech debt` (renamed), `Small fixes`, `Operations`. Five views.

## What changed in the instructions

| File | Change |
|---|---|
| `skills/dev/workspace/references/WORKFLOW.md` | Statuses, loop and Linear's moves; standing projects; milestones; labels; "Follow-ups"; "Priority"; Updates and "Where we are"; views; agent guidance; auto-close gotcha |
| `skills/dev/workspace/SKILL.md` | `pr` and `merged` rows read the status Linear set. Two table rows. The grouped-issue pitfall |
| `skills/dev/workspace/tools/` | Gate, preflight and lane list use `In Review`; tests |
| `enforcement/rules/branches-and-prs.md` | New "Landing line": the PR that lands an integration branch lists every ticket with `Closes` |
| `enforcement/rules/thoven-law.md` | "Scope" sends a leftover problem to a `Follow-up` or `Tech debt` ticket |
| `skills/dev/dispatch-work/` | DONE no longer moves a ticket to Ready. Close reads Merged or Done back. Findings become tickets |
| `skills/dev/linear-project/SKILL.md` | Initiative, standing Projects, stages, the front page |
| `meta/monitor.md`, `map-input.md`, `evals/dispatch-work/evals.json` | Status names |

## How to go back

- **Linear.** Before-values of every setting are in
  `~/.thoven-artifacts/dev/meta-analysis/linear-system/applied/before-*.json`.
- **This repo.** Diff the release commit against its parent.

## Not proven

- No landing PR has yet carried a `Closes` line. That the line moves each ticket from Merged to Done
  rests on Linear's documentation.
- A vertical issue has a PR in each repo. Which merge moves it is unmeasured under the new rules.
- The health rule is main's reading, not Andres's.
- The size counter does not count the 150-word update or the 200-word front page.

## Left open

- `Speccing` is untouched.
- A ticket with no PR (a document, research) has no automatic move. WORKFLOW's In Review, then Done
  when its exit lines hold, is main's reading.
- The gate still demands a milestone (`checks.js`, `session-preflight.js`, `map-input.md`), and
  `meta/monitor.md` still lists the old lifecycle milestone names.
- The WIP cap counts `In Progress` plus `In Review`; Merged is outside it.
- WORKFLOW section 7 is pasted into Linear's agent guidance by hand.
- Each product repo's `CLAUDE.md` carries the old "Scope" sentence until sync.
