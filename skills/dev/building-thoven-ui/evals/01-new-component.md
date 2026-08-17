# Scenario 01 — Net-new component design

Tests the full thoven-designer flow on a green-field component request. The skill should drive Phase 0 → Phase 4 with all gates intact.

## Prompt

> I want to add a new "Daily Practice Streak" tile on the student dashboard. It shows current streak count, a flame icon if streak > 7 days, and a tap target to view streak history.

## Setup

- Fresh Claude Code session in `~/thoven/frontend`
- No prior conversation context
- thoven-designer skill must be available

## Expected behaviors — MUST (all required to pass)

- [ ] Creates a TodoWrite checklist as the FIRST action, with all Phase 0–4 steps + Gate 1 + Gate 1.5 + Gate 2
- [ ] Asks clarifying questions ONE AT A TIME (Phase 0) — does NOT batch 5 questions at once
- [ ] Produces an ASCII layout sketch of the proposed tile BEFORE the dedup check
- [ ] Confirms the layout via AskUserQuestion (with the sketch in the preview) before proceeding
- [ ] Runs a deduplication check using Explore subagent or Grep on `components/student/`, `components/shared/`, and similar tile patterns
- [ ] HALTS at GATE 1 (asks "should I reuse / extend / create new?") and waits for user input
- [ ] Generates wireframe options (2–3) at Phase 1.5
- [ ] HALTS at GATE 1.5 for wireframe approval
- [ ] Cites specific Thoven design tokens in the design spec: `amber-500`, `font-display`, `rgb(217,119,6)` 3D shadow, spring params
- [ ] HALTS at GATE 2 for design approval before implementation

## Expected behaviors — SHOULD (≥80% required to pass)

- [ ] References `brand-identity.md` or `component-patterns.md` for the tile pattern
- [ ] Notes the "no rainbow card grids" rule if proposing accent colors
- [ ] References `viewport-constraint.md` if the tile lives inside a dashboard shell — confirms shell uses `h-[100dvh] overflow-hidden`
- [ ] Identifies which student-color from `lib/student-colors.ts` palette to use (if any) — does NOT default to `orange-*`
- [ ] Mentions Phase 4 audit checklist
- [ ] Produces design spec via the `ui-designer` agent (not freestyle)
- [ ] Does NOT skip directly to implementation
- [ ] Asks ≤5 questions in Phase 0 (per skill's "Max 5" rule)

## Anti-patterns to flag (any one = automatic FAIL)

- ❌ Proceeds to implementation without waiting for any gate approval
- ❌ Uses `bg-orange-500` or `text-orange-*` for the primary tile color
- ❌ Adds a left-hand colored accent bar to the tile
- ❌ Puts a Lucide icon in the tile without functional reason (decoration only)
- ❌ Creates a duplicate tile when one of `LessonStreakCard`, `XPStreakTile`, or similar already exists
- ❌ Skips the ASCII sketch step
- ❌ Batches all Phase 0 questions in one AskUserQuestion call
- ❌ Uses `font-display` on the body text or tap-target label
