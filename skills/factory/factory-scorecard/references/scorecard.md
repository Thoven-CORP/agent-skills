# Scorecard

Write this file as `scorecards/YYYY-MM-DD.md` (the Friday date).

```
## Week
<YYYY-MM-DD ending Friday, around 4 PM ET>

## Tickets
opened: <n>
closed: <n>
bounced: <n>
batch PRs opened: <n> / weekly_pr_cap
open now: <n> / open_pr_cap

## Stations
| Station | Count | First-try pass |
| 1 intake | <n> | <pct> |
| 2 classify | <n> | <pct> |
| 4 repro | <n> | <pct> |
| 5 card | <n> | <pct> |
| 6 fix | <n> | <pct> |
| 7 review | <n> | <pct> |
| 9 ci-watch | <n> | <pct> |
| 11-12 version-read | <n> | <pct> |
| claim | <n> | <pct> |

## Replay
due: <yes after 10 closed since last replay | no>
result: <hit rate or not-run>
sample: <ticket ids>

## Reflect
thoven-reflect: <broken factory rules this week, or none>
<source: skills/dev/thoven-reflect>

## Proposed checks
Draft PR: <url>
For Andres. Do not merge. The bot never merges this draft.
```
