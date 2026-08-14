# Scenario 03 — Audit-only (Phase 4 review on already-built component)

Tests whether the skill's Phase 4 design-system review checklist is correctly applied as a standalone audit pass, not just as an end-of-flow step. This is the most common in-the-wild use of the skill.

## Prompt

> Audit the `components/teacher/classroom/MaterialsSlideOver.tsx` file against the Thoven design system. Tell me what's compliant, what's drifted, and what's a hard violation.

## Setup

- Fresh Claude Code session in `~/thoven/frontend`
- No prior conversation context
- The `MaterialsSlideOver.tsx` file exists and is readable
- thoven-designer skill must be available

## Expected behaviors — MUST (all required to pass)

- [ ] Reads the actual file before commenting (does NOT audit from memory)
- [ ] Reads at least `brand-colors.md` AND `component-patterns.md` AND `viewport-constraint.md` from `references/` before scoring
- [ ] Walks the Phase 4 checklist in order: Colors → Typography → Patterns → Viewport constraint → Accessibility → Error Handling
- [ ] Distinguishes between THREE severity buckets: hard violations (`orange-500` button, dark backdrop on floating panel, etc.), drift (warm-decorative-accent borders OK but not canonical), and compliant
- [ ] For each finding, cites the EXACT file:line and a specific design-system rule it violates or matches
- [ ] Honors the "tertiary palette colors are permitted for categorical/identity/decorative usage" exception — does NOT flag `bg-amber-50` icon containers as orange violations
- [ ] Honors the "decorative orange-family usage is permitted" exception — does NOT flag `border-orange-100` on cards as a hard violation
- [ ] If the file is an overlay/sheet, applies the Rule 1 viewport-constraint audit (checks for `max-h-[90vh]`, anchored header/footer, `min-h-0` body)

## Expected behaviors — SHOULD (≥80% required to pass)

- [ ] Quotes the exact className being audited (verbatim) when flagging an issue
- [ ] Suggests a specific fix (with the canonical replacement classes) when flagging a violation
- [ ] Identifies any literal hex colors (`bg-[#FF8C1A]`, `rgb(204,107,21)` shadows) and flags as drift from `bg-amber-500` + `rgb(217,119,6)` canonical pattern
- [ ] Checks for `font-display` misuse (e.g., on buttons) — should be on h2/h1 only
- [ ] Notes if 3D buttons have any borders (NEVER allowed)
- [ ] Notes if unselected states have 3D shadows (NEVER allowed — only selected/active)
- [ ] Provides a final summary with counts: "X hard violations, Y drifts, Z compliant"
- [ ] If recommending a fix, follows `feedback_no_techdebt_punts_in_active_feature_dev` (don't propose TECH_DEBT.md punts)

## Anti-patterns to flag (any one = automatic FAIL)

- ❌ Audits without reading the file (commits "I think it probably uses..." claims)
- ❌ Flags every non-amber color as a violation (misses the tertiary palette + decorative-warm-accent exceptions)
- ❌ Flags `border-orange-100` on cards (this is permitted decorative warm accent)
- ❌ Misses the viewport-constraint audit on a sheet/overlay component (Rule 1 must apply)
- ❌ Returns a vague summary like "looks mostly fine" without specific file:line citations
- ❌ Recommends a fix that introduces `orange-*` Tailwind classes
- ❌ Misses literal-hex `#FF8C1A` violations if present (those should be flagged as drift from the canonical `bg-amber-500` Tailwind class)
