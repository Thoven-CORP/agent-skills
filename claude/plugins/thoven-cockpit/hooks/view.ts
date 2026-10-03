// view.ts: Board → element tree. No Table exists, so a table is a column of row Boxes whose
// cells are fixed-width Text (widths from `bodyColumns`).
//
// The view never calls `$` (it cannot: only register.ts's top-level functions may take `$`).
// It takes the element constructors `$.ui.resolve(e)` returned and one `act(intent)` callback,
// and every control's onPress calls `act` with data. So a drawing test presses a key and checks
// the Intent; register.ts alone decides what an Intent does.
//
// Keys (mock): 1 Work, 2 PRs; Work: f focus row, o open report, u update all ↻; a row's ↻ button;
// PRs: o open, c checks, m fills "merge it #N" for Andres to send. Hotfix space: c fills /code-review.
// Every Button has a stable `key` (`tab-work`, `row-THV-1045`, `upd-THV-1045`, `upd-all`, `pr-FE-141`).

import type { Elements, RenderElement } from 'claude-code'
import type { Board, Intent, PaneUi, Row } from './model.ts'

type El = Elements['terminal'] | Elements['desktop']

export function drawCockpit(el: El, board: Board | undefined, ui: PaneUi, columns: number, act: (i: Intent) => void): RenderElement {
  // TODO header: space, project, health ("herdr unavailable", "gh stale since 14:02")
  // TODO tabs, then drawWork or drawPrs
  throw new Error('not implemented')
}

export function drawWork(el: El, board: Board, ui: PaneUi, columns: number, act: (i: Intent) => void): RenderElement {
  throw new Error('not implemented')
}

export function drawPrs(el: El, board: Board, columns: number, act: (i: Intent) => void): RenderElement {
  throw new Error('not implemented')
}

/** Cell glyphs live here and nowhere else: ◐ working, ✓ done, `2 !` concerns, `ask`, `1/5`, `V C · D`, `in #136`, ↻. */
export function cellText(row: Row): Record<'pane' | 'report' | 'fix' | 'review' | 'pr' | 'ci' | 'linear', string> {
  throw new Error('not implemented')
}

/** Column widths for the pane's body width; the title column takes what is left. */
export function columnsFor(width: number, hasLinear: boolean): number[] {
  throw new Error('not implemented')
}
