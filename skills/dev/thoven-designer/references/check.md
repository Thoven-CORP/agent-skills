# Check the rendered page

Run this after you build or change a surface, before you say it is done. It runs in the build, not in CI: CI drops the design scans and the geometry tests (`TESTING.md`, "What CI runs"), so nothing downstream catches what you skip here.

## Measure what the eye sees

A bounding box is not what the eye sees. Align and compare on the visible edge:

| Thing | Its visible edge | Read it with |
| --- | --- | --- |
| A 3D ThovenButton | The ledge: the face's bottom plus the ledge depth. The ledge is a box-shadow, so the box ends above it. | `rect.bottom + ledgeOf(button)` (`test-utils/button-ledge.ts`); a flat variant has no ledge, so 0 |
| An icon | Its glyph. The svg box carries padding around the glyph. | The union of the svg's `path` rects, `getBoundingClientRect()` on each path |
| Text beside something | Its first line. The element's centre moves down each time the text wraps. | `Range.selectNodeContents(el).getClientRects()[0]`; the centre is its top plus half its height |

Why: Andres, 2026-11-24, about a Thoven button: "does not show the ledge in the alignment". Boxes lined up and the eye saw them off, three times before this rule.

Two edges that should line up (a button and its paired field, an icon and its title, the last line of a card and the button under it) agree within 1px on those visible edges, at 390 and at the frame's width, with the longest real copy.

## Run these, in order

1. **Design scans.** They read source, not the screen. The commit hook runs them when you stage a component, route, stylesheet or token module; run them yourself before you build on the result:
   `pnpm exec vitest run $(node scripts/ci/design-rules.mjs --list | rg -v '\.browser\.')`
   Done when exit 0 is pasted. A scan that refuses a Paper value gets one allowlist entry naming the Paper node and the reason.
2. **Oxlint on the files you touched.** `pnpm exec oxlint <files>` runs the `thoven-library` rules: `raw-button`, `hand-spinner`, `hand-chevron`, `hand-close`, `deprecated-import`. Done when exit 0.
3. **Geometry in a real browser.** Any change that moves, aligns or sizes something carries a browser test (a file named like *.browser.test.tsx) asserting the visible edges above. Models: `components/teacher/private-lessons/LessonsOverview.geometry.browser.test.tsx` (reads `ledgeOf`) and `components/ui/thoven-button.browser.test.tsx` (the ledge itself). Run it with `pnpm exec vitest run <file> --config vitest.browser.config.ts`. Done when it is red before the change and green after.
4. **Look at the page.** Capture the real route with a headless browser shot at the frame's width and at 390, in your scratch directory, and open the shots. Done when you have written, per state and width, whether anything looks lower, higher, tighter or wider than its neighbour, whether a fact shows twice, whether two buttons compete in colour, and whether a confirmation wears the empty-state layout.
5. **Copy on a dialog or notice.** Print every text node of the rendered dialog, one per line, and run `python3 ~/.agents/skills/thoven-branding/scripts/word_lint.py --once -`. Done when it exits 0 or each finding has a one-line reason.

## Gaps: what no check sees yet

Each applicable row goes in the report as `Not checked:`, so a missing check is said, never silent.

| Defect | Today | Closed by |
| --- | --- | --- |
| Alignment on visible edges (ledge, glyph, first line) | No shared helper; steps 3 and 4 do it by hand and each geometry test re-derives it | ticket THV-2134: one measuring helper |
| A state you did not render | No states route exists: Storybook has no stories and `design/blocks.registry.json` mounts nothing | ticket THV-2134: a route that renders every block in every state |
| A dialog's secondary that is not neutral, or a ThovenButton recoloured through `className` | `button-row-scan` never reads colour; no lint rule covers it | tickets THV-2132 (typed footer roles) and THV-2135 (lint rule) |
| Raw palette steps in components | `raw-color-scan` only holds a baseline that shrinks; 6,213 steps remain, mostly grays | ticket THV-2133: semantic role tokens |
| A phone section card out of line with the header's leading control | No check | ticket THV-2137 |
