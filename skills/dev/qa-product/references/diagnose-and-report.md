# Diagnose, group, report

Run after the last journey. A finding is not a bug until its cause is known: a bad seed, a stale build or code already being deleted looks broken to a walker and costs a fixer a round for nothing.

## Diagnose each finding

Reproduce it once more, then name its cause from this table. A product bug's cause is a `file:line` found with `diagnosing-bugs`.

| Cause | How you tell | Where it goes |
|---|---|---|
| Product bug | It repeats on a fresh seed at the SHA under test, and the code at `file:line` explains it | A group below |
| Bad seed | The state is one no real user could reach: a learner with no date of birth, a consent band that does not match the age, credits reserved by a request that no longer exists | Fix the seed, walk the journey again |
| Stale build or import | The server or bundle is older than the SHA: a 404 on a `page.js` chunk, a module imported from its old path | Restart or rebuild, walk again |
| Code awaiting deletion | The route or component is off the live path, or a ticket already removes it | A note naming the ticket |
| Environment limit | Headless Chromium has no camera or microphone; staging lacks a provider | A note, first words naming the limit |
| Designed | The screen matches its approved Paper frame or main lab | One question to Andres |
| Walker error | A 401 from a wrong path, a control behind an open overlay, layout measured mid-animation, a colour parsed by regex from `oklch()` | Delete the finding |

Done when every line in `findings.jsonl` has one cause and the evidence that shows it.

## Group by cause

One root cause is one finding, with every location it shows up in. Then group the product bugs so one agent can fix a group in one round on one branch: same module or same cause, no product call inside it. A group that needs a product call becomes one question to Andres. Done when every product bug sits in exactly one group and each group names its locations (`file:line`, route, recording timestamp).

## Report

One `visual-artifacts` page, by journey:

1. Each journey's recording, with chapter marks at its findings, and whether it reached its end or the one-way door that stopped it.
2. The groups: cause, every location, which personas it hits, and severity (blocks a journey, wrong result, friction, polish).
3. The non-defects in one list (seed, stale build, deletion, environment), so nobody investigates them again.
4. The journeys that walked clean and are stable: candidates for the `e2e` skill.

Put the page's link on the Linear ticket. Then stop.
