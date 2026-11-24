# Layout and alignment

Use for an icon or text beside text, a header, a row, a list, a section card, spacing and wrapping.

## An icon beside wrapping text aligns to the first line

The icon's centre sits on the centre of the text's first line, never the block's centre. This holds in dialog headers, notification rows and list rows. Put the row on `items-start` and the icon in a slot one line tall (`1lh`) so its centre is the first line's centre.

Why: Andres, 2026-11-24: "the icon looks lower ... the header grows and the icon is aligned to the header". Centred on the block, the icon drifts down every time the text wraps another line.

Catch: [check](check.md) measures the glyph's centre against the first line's centre, within 1px, at 390 and at the frame's width, with the longest real copy.

## Phone section cards line up with the header

On a phone, a section card's left edge aligns with the header's leading control (the menu chip), and its right margin mirrors that inset. Set it once in the section component, never as a margin on each card.

Why: Andres, 2026-11-24: "the left side aligned with the menu chip and the right side has the same margin". One component sets it, so no card can drift.

Catch: none yet (gap, ticket THV-2137). Read the card's left edge and the control's left edge at 390 and write both numbers in the report.

## Vertical rhythm and type

Where no Paper frame sets them, check every vertical gap and line height against Linear THV-1389's rhythm rule, and every text block against its wrapping, tracking, measure, punctuation and truncation rules. Done when each gap is on the rhythm or listed as a finding with `file:line`. Open the issue and point at it; never restate it. It lands in `design/layout.md` "Vertical rhythm" and the type tests; when it does, repoint this section at the file.

Every spacing or size value reaches code through `rem()` in `lib/density-tokens.ts`, so the 90% desktop scale (THV-1333) applies. A raw px vertical value is a defect. A signed-in frame's values are already at 90%: divide each by 0.9 for the code number (the law's "Design parity", "Desktop frames are a 1280×720 window").

## One screen

Write one-screen acceptance as "fits without scrolling at every desktop viewport" and shrink the content until it does. Phones may scroll the page.
