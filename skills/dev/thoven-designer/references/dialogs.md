# Dialogs and footers

Use for any popup, dialog, notice, confirmation, or a footer's buttons. A popup is a `ThovenDialog` (`components/ui/thoven-dialog.tsx`). It owns width, inset, header, footer and backdrop; a caller passes content and `footer` data and never chrome. Each rule names the catch that holds it today. A sentence is the weakest catch, so every rule held only by one has a gap row below.

## Each fact once

The title says what happened. One line says what that means or what happens next. A fact list holds only the facts the title and that line do not. A fact never sits in two slots: no coloured subtitle, summary sentence and table repeating one outcome.

Why: Andres, 2026-11-24, on the Reschedule Denied popup: "the header says what happened, then under it a summary, then a table with the same information". The reader pays for every repeat.

Catch: `word_lint.py --once` on the rendered text ([check](check.md), step 5). Wording is `~/.agents/skills/thoven-branding/references/plain-copy.md`, "Once".

## Facts are labelled

A fact sits in a sentence ("Emma's piano lesson is on Wed, Nov 25 at 1:00 PM.") or in a labelled row ("Student: Emma"). Never string values together with dashes or dots.

Why: Andres, 2026-11-24, on a refund request: "Emma piano — Emma — date and time with no context". A reader cannot tell what each value is.

Catch: `word_lint.py` reports `dash-chain`; `__tests__/middle-dot-scan.test.ts` reports middle dots.

## The secondary is neutral

A dialog's secondary or dismiss button is `neutral` or `ghost` in every tone. Only the primary carries the status or brand colour. Never an `outline-*` face as the secondary.

Why: Andres, 2026-11-24: "the footers again have an emerald secondary instead of grey". Two coloured buttons compete for the one action. `design/buttons.md` still lists the outline families as general secondaries; inside a dialog footer this rule wins until that file says so (ticket THV-2132).

Catch today: run this on the dialog files you touched; every match inside a `footer` is a finding.
`rg -n "variant: '(outline|outline-sky|outline-rose|outline-emerald)'" <files>`

## Footers

- The footer is the `footer` prop: `start` is the way back, `end` the secondaries, `main` the primary. It lays out through `ButtonRow`. Never hand-build a row of two ThovenButtons: `button-row-scan` fails it.
- Stacking on a phone is allowed. Andres, 2026-11-24: "footer button stacking is fine on mobile". Never shorten a label, change a width or add a width threshold to avoid it; `ButtonRow` stacks by CSS because a threshold guesses at label length.
- Footer placement, phone layout, button height, the lone-button and two-3D-button cases, and overflow fades are Linear THV-1353 until `lib/dialog-tokens.ts` and `hooks/useScrollFadeMask.ts` carry them. Open the issue and point at it; never restate it.

## A confirmation is not an empty state

After an action, the dialog confirms it: the title says what happened, one line says what comes next, and the primary closes it. Never use the empty-state layout (a centred icon in a circle over a centred line) on a confirmation.

Why: Andres, 2026-11-24, on Makeup offered: "makeup offered is centred, an icon with a circle: the empty state layout, not the confirmation". An empty state reads "nothing here".

Catch: your look at the page ([check](check.md), step 4).

## Gaps

| Defect | Today | Closed by |
| --- | --- | --- |
| A fact in two slots, or unlabelled facts | ThovenDialog has no summary-line slot and no fact-list slot, only free children; the lint is the catch | ticket THV-2132 |
| A coloured secondary | `footer` accepts any variant; the `rg` above is the catch | tickets THV-2132 and THV-2135 |
| A confirmation in the empty-state layout | No confirmation layout exists | ticket THV-2132 |
| Popups outside the dialog system | Family popups are still hand-rolled; `pnpm run design:audit` counts them | the tech-debt ticket under the same parent |
