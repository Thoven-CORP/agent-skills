# Review and fix round

The builder's REPORT is a claim. Main checks it, then one review judges the whole work once, on
the dispatch's final diff, with [`/review-change`](../../review-change/SKILL.md). No verifier
subagent runs by default.

## Main's checks

Main runs each single-command check itself: lint and type-check on the touched files, and the
narrowest test or command that measures an exit criterion. A check runs once per commit: one the
REPORT shows passing at the head SHA is cited with its pass line, never rerun. A later commit
reruns only the checks whose files it touched. Wider suites run once, when the branch lands (law,
"Check once; the first failure is a finding"). The first failure is a finding, never a rerun to
green.

**Done when:** every exit criterion has a verdict with its measurement at the head SHA.

## Every PR

The one review is the PR review of the PR that carries the work. A hotfix, follow-up or CI-fix PR
with no dispatch gets it from main, once, on its final diff. Once it passes, main arms auto-merge
(`~/thoven/agent-skills/enforcement/rules/branches-and-prs.md`) and says in one line on the
work-session page what merged. `/deslop` and `/no-comments` run only when Andres asks.

## Handling findings

Read the builder's concerns and Noticed lines, the review's findings, red CI and Andres's notes as
one set. Diagnose each before fixing it: a bad seed, a stale import, or code already due for
deletion is not a product bug.

1. **Group by root cause.** Findings with one cause are one item, with every location.
2. **Sort each item by its kind** (`review-change`, "Kind"):

   | Kind | What happens |
   |---|---|
   | User bug, broken ruling | Fixed in the fix round with a check at the class level: the earliest rung of the law's "A rule carries its check" that catches every instance, never a guard for one test |
   | Edge case, taste | One line each to Andres, with your default; nothing is built until he answers |
   | Minor | One line in the PR's report; no fix round |

3. **The fix round.** Main makes each easy fix on the spot. What is left goes to one fresh
   subagent with the fix-round brief ([brief.md](brief.md), "Fix round"), split by
   cause into subagents whose files do not overlap. Its proof per item is the class-level check
   going green after failing on the old code. The ticket stays In Review.
4. **After the round,** main reads the fix diff and its checks only; no second review. A fix too
   big for the round is a sub-issue of the ticket, done before it closes (law, "Own what you
   find"). Gate repair and redesigns go to Andres as one line with a choice.

**Done when:** every item is fixed with its check, asked, a sub-issue, or a report line, and the
work-session page shows the outcome.
