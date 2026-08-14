# Scenario 02 — Redesign of existing component

Tests whether the skill correctly identifies existing components, recommends extending vs creating new, and respects the brand-fidelity contract during a refresh.

## Prompt

> The teacher dashboard's "Upcoming Lessons" section feels stale and crowded. Can you redesign it to feel more spacious, with a clearer visual hierarchy between today's lessons and later-in-the-week lessons?

## Setup

- Fresh Claude Code session in `~/thoven/frontend`
- No prior conversation context
- The existing `components/teacher/CalendarSection.tsx` (or equivalent upcoming-lessons surface) should be present in the codebase
- thoven-designer skill must be available

## Expected behaviors — MUST (all required to pass)

- [ ] Creates the TodoWrite checklist first
- [ ] Phase 0: asks at least one clarifying question about scope (full redesign vs visual refresh vs information-architecture change) BEFORE making changes
- [ ] Phase 1 dedup: Explore agent or Grep finds the existing component(s) — does not skip dedup just because the user said "redesign"
- [ ] Provides VISUAL DESCRIPTION of what's there now (ASCII or word-picture of current layout) so user can confirm we're looking at the same thing
- [ ] Recommends "extend existing" path (since upcoming-lessons is a real, used component) — NOT "create new"
- [ ] HALTS at GATE 1 for the extend-vs-rewrite call
- [ ] When designing, preserves the canonical Thoven 3D amber CTA pattern for any primary actions (`shadow-[0_4px_0_0_rgb(217,119,6)]`)
- [ ] Phase 4 audit: checks new layout against viewport-constraint rules — confirms the section doesn't introduce a page-scroll on the dashboard shell

## Expected behaviors — SHOULD (≥80% required to pass)

- [ ] Reads `component-patterns.md` for similar list/card patterns before drafting
- [ ] Suggests inspiration from the curated list (Linear / Notion / Airbnb) when justifying spacing/hierarchy choices
- [ ] Notes the existing component's test file (if any) and flags that tests will need to be updated
- [ ] Surfaces any tertiary palette colors (`student-colors.ts` 8-family palette) that could differentiate today vs. later — does NOT use rainbow cards
- [ ] Asks whether to keep the existing data shape or refactor — doesn't rewrite without permission
- [ ] Honors the "selected/active state gets 3D depth, unselected stays flat" rule
- [ ] Gates wireframe + design approval before implementation

## Anti-patterns to flag (any one = automatic FAIL)

- ❌ Proposes "create new component, deprecate old" without considering extend
- ❌ Skips the dedup check entirely because the user said "redesign"
- ❌ Uses any `orange-*` Tailwind class
- ❌ Adds a dark backdrop or modal overlay where there wasn't one
- ❌ Introduces left-hand accent bars on lesson cards
- ❌ Suggests rainbow-coded lesson cards (4+ different accent colors per card)
- ❌ Implements directly without Gate 1 (extend vs new) or Gate 2 (design approval)
- ❌ Flips the canonical amber-500 to some other accent for the primary CTA
