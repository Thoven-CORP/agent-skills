# Evaluations for `thoven-designer`

Per Anthropic's skill best-practices: create ≥3 scenarios that test your skill against representative real tasks, score against expected behaviors, iterate when scores drop.

## How to run an eval

1. **Open a fresh Claude Code session** (no prior context that could bias the result). New chat / new tab.
2. **Paste the scenario's `Prompt`** verbatim — exactly as written.
3. **Watch what Claude does.** Don't intervene unless it goes off the rails. The point is to see whether the skill's instructions are sufficient on their own.
4. **Score against the `Expected behaviors` checklist** at the end of the scenario. Each item is a yes/no. Note which ones fail and why.
5. **Pass criteria**: 100% of `MUST` items, ≥80% of `SHOULD` items. Anything below = the skill needs revision.

## When to run evals

- **After any non-trivial edit to `SKILL.md`** or any `references/*.md` file
- **When you see Claude misbehave** while using the skill in real work — capture that as a NEW scenario, then verify the fix
- **Before merging skill changes** to `main` (treat as the design-time analog of CI tests)
- **Quarterly drift check** — even without changes, model updates can shift behavior

## When to add a new scenario

Whenever you observe the skill missing something in real use. Don't wait until eval time. Capture the failure as a scenario the same day, with the exact prompt that triggered it.

## File layout

```
evals/
├── README.md                  ← this file
├── 01-new-component.md        ← scenario 1
├── 02-redesign-existing.md    ← scenario 2
└── 03-audit-only.md           ← scenario 3
```

Each scenario is a self-contained markdown file with: `## Prompt` (verbatim), `## Setup` (what files/state needed), `## Expected behaviors` (MUST + SHOULD checklist), `## Anti-patterns to flag` (what would be wrong).

## Why three scenarios

Anthropic recommends ≥3 because:
- **One** scenario can pass by accident (Claude gets lucky on phrasing)
- **Two** can pass by overfitting (skill instructions are too specific to those two)
- **Three** forces the skill to generalize across different intents (net-new / redesign / audit)

Add more as the skill matures, but don't drop below three.

## Scoring template (copy per run)

```
Date: 2026-MM-DD
Scenario: 01-new-component.md
Model: Claude Opus 4.7
Result: PASS / FAIL

MUST items: X / Y passed
SHOULD items: X / Y passed

Failures:
- [item]: what went wrong + suspected cause

Action:
- [ ] no change needed
- [ ] update SKILL.md (specific section)
- [ ] update references/X.md
- [ ] add new anti-pattern
```

Append results to `evals/runs.log` (gitignored or committed — your call).
