// view.ts: Board → element tree. No Table exists, so a table is a column of row Boxes whose
// cells are fixed-width Boxes (widths from `bodyColumns`).
//
// The view never calls `$`. It takes the element constructors `$.ui.resolve(e)` returned and one
// `act(intent)` callback, so a drawing test presses a key and register.ts alone decides what the
// Intent does. Every glyph the cockpit shows is in this file.

import type { Elements, RenderElement } from 'claude-code'
import type { Board, Group, Health, Intent, Ms, OtherItem, PaneCell, PaneStatus, PaneUi, Row, SourceId } from './model.ts'

/** The three elements the cockpit draws with, on whichever surface resolved them. */
type El = Pick<Elements[keyof Elements], 'Box' | 'Text' | 'Button'>
type Act = (i: Intent) => void | Promise<void>

const DASH = '–'
/** Pane, Report, Fix, Review, PR, CI. Report fits `blocked` and a space before Fix. */
const FIXED = [5, 8, 5, 9, 9, 6]
const LINEAR_WIDTH = 7
const MIN_WORK = 10
const KIND_WIDTH = 9
const HEADINGS = ['Work', 'Pane', 'Report', 'Fix', 'Review', 'PR', 'CI', 'Linear']

const PANE_GLYPH: Record<PaneStatus, string> = { working: '◐', done: '✓', idle: '○', blocked: '!', unknown: '?' }
const PANE_COLOR: Partial<Record<PaneStatus, string>> = { working: 'blue', done: 'green', blocked: 'red' }

const SOURCE_NAME: Record<SourceId, string> = {
  herdr: 'herdr',
  labels: 'pane labels',
  spaces: 'Live spaces',
  heads: 'git',
  branches: 'git',
  github: 'gh',
  linear: 'Linear',
  inbox: 'dispatch inbox',
  codex: 'Codex',
}

export function drawCockpit(el: El, board: Board | undefined, ui: PaneUi, columns: number, act: Act): RenderElement {
  const { Box, Text, Button } = el
  if (!board) return Text({ dimColor: true, children: ['This session is not main of a space. Run /cockpit to claim it.'] })
  const tab = (id: PaneUi['tab'], label: string, hotkey: string) =>
    Button({ key: `tab-${id}`, label, hotkey, plain: true, dimColor: ui.tab !== id, onPress: () => act({ k: 'tab', tab: id }) })
  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [Text({ bold: true, children: [board.space.label] }), Text({ dimColor: true, children: [board.project === undefined ? 'no project' : 'Linear project'] })],
      }),
      Box({ flexDirection: 'row', columnGap: 3, children: [tab('work', 'Work', '1'), tab('prs', 'PRs', '2')] }),
      ...healthLines(board.health).map((line) => Text({ color: 'yellow', children: [line] })),
      Text({ children: [' '] }),
      ui.tab === 'work' ? drawWork(el, board, ui, columns, act) : drawPrs(el, board, columns, act),
    ],
  })
}

export function drawWork(el: El, board: Board, ui: PaneUi, columns: number, act: Act): RenderElement {
  const { Box, Text, Button } = el
  const hasLinear = board.project !== undefined
  const widths = columnsFor(columns, hasLinear)
  const rows = board.build.flatMap(rowsOf)
  const selected = rows.find((r) => r.ticket === ui.selected) ?? rows[0]
  const focusTarget = selected?.pane.k === 'live' ? selected.pane.pane : undefined

  const cells = (texts: string[], from: number, dim: boolean, colors: ReadonlyArray<string | undefined> = []) =>
    texts.map((t, i) => Box({ width: widths[from + i] ?? 0, flexShrink: 0, children: [Text({ dimColor: dim, color: colors[i], wrap: 'truncate-end', children: [t] })] }))

  const headingRow = Box({
    flexDirection: 'row',
    children: [
      Box({ width: widths[0] ?? MIN_WORK, flexShrink: 0, children: [Text({ dimColor: true, children: [HEADINGS[0] ?? ''] })] }),
      ...cells(HEADINGS.slice(1, widths.length), 1, true),
    ],
  })

  const buildRow = (row: Row) => {
    const t = cellText(row)
    const pane = row.pane
    const subtitle = [row.kind, row.ticket].filter((x) => x !== undefined).join(' ') + (row.origin === 'this-session' ? ' (this session)' : '')
    return Box({
      flexDirection: 'row',
      children: [
        Box({
          width: widths[0] ?? MIN_WORK,
          flexShrink: 0,
          flexDirection: 'column',
          children: [
            Button({
              key: `row-${row.ticket}`,
              label: clip(row.title, (widths[0] ?? MIN_WORK) - 1),
              plain: true,
              onPress: () => (pane.k === 'live' ? act({ k: 'focus-pane', pane: pane.pane }) : undefined),
            }),
            Text({ dimColor: true, children: [subtitle] }),
          ],
        }),
        Box({ width: widths[1] ?? 0, flexShrink: 0, children: [Text({ color: pane.k === 'live' ? PANE_COLOR[pane.status] : undefined, children: [t.pane] })] }),
        ...cells([t.report, t.fix, t.review, t.pr, t.ci, ...(hasLinear ? [t.linear] : [])], 2, false, [reportColor(row.report)]),
      ],
    })
  }

  const parentLine = (g: Extract<Group, { k: 'parent' }>) =>
    Text({ bold: true, children: [`${g.title} ${g.parent}: ${g.done} of ${g.total} done${g.needsYou > 0 ? `, ${g.needsYou} needs you` : ''}`] })

  return Box({
    flexDirection: 'column',
    children: [
      board.here === undefined ? null : Text({ dimColor: true, children: [`You are here: ${board.here}`] }),
      Text({ dimColor: true, children: ['BUILD'] }),
      rows.length === 0
        ? Text({ dimColor: true, children: ['No build work in this space.'] })
        : [headingRow, ...board.build.flatMap((g) => (g.k === 'single' ? [buildRow(g.row)] : [parentLine(g), ...g.children.map(buildRow)]))],
      board.other.length === 0 ? null : [Text({ children: [' '] }), Text({ dimColor: true, children: ['OTHER'] }), ...board.other.map((o) => otherLine(el, o, columns))],
      Text({ children: [' '] }),
      Button({
        key: 'focus-row',
        label: 'focus row',
        hotkey: 'f',
        plain: true,
        onPress: () => (focusTarget === undefined ? undefined : act({ k: 'focus-pane', pane: focusTarget })),
      }),
    ],
  })
}

export function drawPrs(el: El, _board: Board, _columns: number, _act: Act): RenderElement {
  return el.Text({ dimColor: true, children: ['PRs arrive in S2'] })
}

/** Cell glyphs live here and nowhere else. */
export function cellText(row: Row): Record<'pane' | 'report' | 'fix' | 'review' | 'pr' | 'ci' | 'linear', string> {
  return {
    pane: [row.pane, ...row.extraPanes].map(paneText).join(' '),
    report: reportText(row.report),
    fix: row.fix.k === 'round' ? `${row.fix.round}/${row.fix.of}` : DASH,
    review: reviewText(row.review),
    pr: prText(row.pr),
    ci: ciText(row.ci),
    linear: linearText(row.linear),
  }
}

/** Column widths for the pane's body width; the Work column takes what is left. */
export function columnsFor(width: number, hasLinear: boolean): number[] {
  const fixed = hasLinear ? [...FIXED, LINEAR_WIDTH] : FIXED
  return [Math.max(MIN_WORK, width - fixed.reduce((a, b) => a + b, 0)), ...fixed]
}

function rowsOf(g: Group): Row[] {
  return g.k === 'single' ? [g.row] : g.children
}

function otherLine(el: El, o: OtherItem, columns: number): RenderElement {
  const { Box, Text } = el
  const status = o.pane.k === 'live' ? [o.pane.status, o.pane.tool].filter((x) => x !== undefined).join(' ') : paneText(o.pane)
  const label = o.note === undefined ? o.label : `${o.label} (${o.note})`
  return Box({
    flexDirection: 'row',
    children: [
      Box({ width: KIND_WIDTH, flexShrink: 0, children: [Text({ dimColor: true, children: [o.kind ?? ''] })] }),
      Box({ width: Math.max(MIN_WORK, columns - KIND_WIDTH - 12), flexShrink: 0, children: [Text({ wrap: 'truncate-end', children: [label] })] }),
      Text({ dimColor: true, children: [status] }),
    ],
  })
}

function paneText(p: PaneCell): string {
  if (p.k === 'live') return p.tool === undefined ? PANE_GLYPH[p.status] : `${PANE_GLYPH[p.status]} ${p.tool}`
  return p.k === 'gone' ? 'gone' : DASH
}

/** The mock's Report copy: ✓ clean, `2 !` concerns, `ask` needs you. A report still in the inbox is `unsent`. */
function reportText(r: Row['report']): string {
  switch (r.k) {
    case 'none':
      return DASH
    case 'na':
      return 'n/a'
    case 'in':
      switch (r.status) {
        case 'DONE':
          return '✓'
        case 'DONE_WITH_CONCERNS':
          return r.concerns > 0 ? `${r.concerns} !` : '!'
        case 'NEEDS_CONTEXT':
          return 'ask'
        case 'BLOCKED':
          return 'blocked'
      }
      return DASH
    case 'undelivered':
      return 'unsent'
    case 'escalation':
      return 'note'
  }
}

/** The mock's classes: `g` green for ✓, `a` amber for concerns, `r` red for what needs Andres. */
function reportColor(r: Row['report']): string | undefined {
  if (r.k === 'undelivered' || r.k === 'escalation') return 'yellow'
  if (r.k !== 'in') return undefined
  return r.status === 'DONE' ? 'green' : r.status === 'DONE_WITH_CONCERNS' ? 'yellow' : 'red'
}

function reviewText(r: Row['review']): string {
  if (r.k === 'none') return `${DASH} ${DASH} ${DASH} ${DASH}`
  const light = (letter: 'V' | 'C' | 'T' | 'D') => {
    const l = r[letter]
    return l === 'lit' || l === 'dim' ? letter : l === 'amber' ? '·' : l === 'na' ? 'n/a' : DASH
  }
  return (['V', 'C', 'T', 'D'] as const).map(light).join(' ')
}

function prText(p: Row['pr']): string {
  if (p.k === 'own') return `#${p.pr.number}`
  if (p.k === 'shared') return `in #${p.pr.number}`
  return p.k === 'stale' ? 'stale' : DASH
}

function ciText(c: Row['ci']): string {
  switch (c.k) {
    case 'pass':
      return '✓'
    case 'fail':
      return `✗ ${c.failed}`
    case 'running':
      return `◐ ${c.done}/${c.total}`
    case 'stale':
      return 'stale'
    case 'none':
      return DASH
  }
}

function linearText(l: Row['linear']): string {
  switch (l.k) {
    case 'hidden':
      return ''
    case 'none':
      return DASH
    case 'stale':
      return 'stale'
    case 'ok':
      return '✓'
    case 'pending':
      return '↻'
    case 'error':
      return '↻ !'
  }
}

function healthLines(health: Health): string[] {
  const seen = new Set<string>()
  return (Object.keys(health) as SourceId[]).flatMap((id) => {
    const h = health[id]
    const name = SOURCE_NAME[id]
    if (h.k === 'ok' || seen.has(name)) return []
    seen.add(name)
    if (id === 'herdr') return [h.k === 'stale' ? `herdr unavailable since ${hhmm(h.since)}` : 'herdr unavailable']
    return [h.k === 'stale' ? `${name} stale since ${hhmm(h.since)}` : `${name} unavailable`]
  })
}

function hhmm(ms: Ms): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function clip(text: string, width: number): string {
  return text.length <= width ? text : `${text.slice(0, Math.max(0, width - 1))}…`
}
