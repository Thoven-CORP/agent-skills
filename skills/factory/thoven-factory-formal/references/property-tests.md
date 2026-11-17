# Property and bounded tests

Default tool. Run against the real code in the product repo (frontend or backend), not a hand model of a function.

## Pick the shape

- **Property test** when many inputs should obey one rule (amounts, ids, date math, serializers).
- **Bounded test** when a small finite set of steps or sizes is enough (a state machine with a handful of states, a retry cap).
- **One failing unit or request spec** when the guarantee is a single user-visible behaviour and a property would only restate that spec.

## Able to fail

Show the check red on the pre-fix revision. If you cannot make it fail, you do not have a check. You have a passing test that never saw the bug.

## Findings stay findings

If current HEAD fails the property, report the counterexample in product words. Do not weaken the property until it passes. Do not change product code unless the review asked for that change.

## Cheap to rerun

One command. Pin the runner version the repo already uses (RSpec, Vitest). Fast enough that the next agent will run it on the next loop PR.
