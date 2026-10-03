// view.ts: Board → element tree. No Table exists, so a table is a column of row Boxes whose
// cells are fixed-width Boxes (widths from `COLUMNS`).
//
// The view never calls `$`. It takes the element constructors `$.ui.resolve(e)` returned and one
// `act(intent)` callback, so a drawing test presses a key and register.ts alone decides what the
// Intent does. Every glyph the cockpit shows is in this file.

import type { Elements, RenderElement } from 'claude-code'
import { ciCell } from './board.ts'
import { AGENT_SKILLS, BACKEND, FRONTEND } from './github.ts'
import { LETTERS } from './model.ts'
import type { Board, Cells, CiCell, Group, Health, Intent, Letter, Light, Ms, LivePane, OtherItem, PaneStatus, PaneUi, Pr, PrCell, PrItem, ReportStatus, Row } from './model.ts'

/** The three elements the cockpit draws with, on whichever surface resolved them. */
type El = Pick<Elements[keyof Elements], 'Box' | 'Text' | 'Button'>
type Act = (i: Intent) => void | Promise<void>

const DASH = '–'
const MIN_WORK = 10
const KIND_WIDTH = 9

/** What one cell reads, and its colour. */
type Drawn = { text: string; color?: string | undefined }

/** One Work-tab column after Work. While its `source` is stale the column keeps its last answer, dimmed and uncoloured. */
type Column = { heading: string; width: number; draw(row: Row): Drawn; shownIf?: (board: Board) => boolean; source?: keyof Health; wrap?: 'wrap' }

/** The Work tab's columns after Work, in order. Report fits `blocked` and a space before Fix. */
const COLUMNS = {
  // Several panes outgrow the column, so they wrap onto the next line rather than truncate.
  pane: { heading: 'Pane', width: 5, wrap: 'wrap', draw: ({ panes: p }) => (p.k === 'live' ? { text: p.list.map(liveText).join(' '), color: PANE_COLOR[p.list[0].status] } : { text: absent(p) }) },
  report: { heading: 'Report', width: 8, draw: (r) => reportDrawn(r.cells.report) },
  fix: { heading: 'Fix', width: 5, draw: ({ cells: { fix } }) => ({ text: fix.k === 'round' ? `${fix.round}/${fix.of}` : DASH }) },
  review: { heading: 'Review', width: 9, draw: (r) => ({ text: reviewText(r.cells.review) }) },
  pr: { heading: 'PR', width: 9, source: 'github', draw: (r) => prDrawn(r.cells.pr) },
  ci: { heading: 'CI', width: 6, source: 'github', draw: (r) => ciDrawn(r.cells.ci) },
  linear: { heading: 'Linear', width: 7, shownIf: (b) => b.project !== undefined, draw: (r) => ({ text: linearText(r.cells.linear) }) },
} satisfies Record<string, Column>
export type ColumnId = keyof typeof COLUMNS

/** PRs tab: State and CI widths. The PR column takes what is left. */
const STATE_WIDTH = 8
const PR_CI_WIDTH = 7
const REPO_TAG: Readonly<Record<string, string>> = { [FRONTEND]: 'FE', [BACKEND]: 'BE', [AGENT_SKILLS]: 'AS' }
const PR_STATE: Record<Pr['state'], Drawn> = {
  OPEN: { text: 'held', color: 'yellow' },
  MERGED: { text: 'merged', color: 'green' },
  CLOSED: { text: 'closed', color: undefined },
}

const PANE_GLYPH: Record<PaneStatus, string> = { working: '◐', done: '✓', idle: '○', blocked: '!', unknown: '?' }
const PANE_COLOR: Partial<Record<PaneStatus, string>> = { working: 'blue', done: 'green', blocked: 'red' }

/** Each health entry's name, and the word for it once a source that answered has failed. herdr is only ever unavailable. */
const HEALTH_WORDS: Record<keyof Health, { name: string; down: string }> = {
  herdr: { name: 'herdr', down: 'unavailable' },
  labels: { name: 'pane labels', down: 'stale' },
  spaces: { name: 'Live spaces', down: 'stale' },
  git: { name: 'git', down: 'stale' },
  github: { name: 'gh', down: 'stale' },
  inbox: { name: 'dispatch inbox', down: 'stale' },
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
        children: [Text({ bold: true, children: [board.space.label] }), Text({ dimColor: true, children: [board.project ?? 'no project'] })],
      }),
      Box({ flexDirection: 'row', columnGap: 3, children: [tab('work', 'Work', '1'), tab('prs', 'PRs', '2')] }),
      ...healthLines(board.health).map((line) => Text({ color: 'yellow', children: [line] })),
      Text({ children: [' '] }),
      ui.tab === 'work' ? drawWork(el, board, ui, columns, act) : drawPrs(el, board, ui, columns, act),
    ],
  })
}

function drawWork(el: El, board: Board, ui: PaneUi, columns: number, act: Act): RenderElement {
  const { Box, Text, Button } = el
  const { work, shown } = columnsFor(columns, board)
  const rows = board.build.flatMap(rowsOf)
  const selected = rows.find((r) => r.ticket === ui.selected) ?? rows[0]
  const focusTarget = selected?.panes.k === 'live' ? selected.panes.list[0].pane : undefined

  const isStale = (c: Column) => c.source !== undefined && board.health[c.source].k === 'stale'
  const headingRow = Box({ flexDirection: 'row', children: [cell(el, work, { text: 'Work' }, true), ...shown.map((c) => cell(el, c.width, { text: c.heading }, true))] })

  const buildRow = (row: Row) => {
    const lead = row.panes.k === 'live' ? row.panes.list[0] : undefined
    const subtitle = [row.kind, row.ticket].filter((x) => x !== undefined).join(' ') + (row.origin === 'this-session' ? ' (this session)' : '')
    return Box({
      flexDirection: 'row',
      children: [
        Box({
          width: work,
          flexShrink: 0,
          flexDirection: 'column',
          children: [
            Button({
              key: `row-${row.ticket}`,
              label: clip(row.title, work - 1),
              plain: true,
              onPress: () => (lead === undefined ? undefined : act({ k: 'focus-pane', pane: lead.pane })),
            }),
            Text({ dimColor: true, children: [subtitle] }),
          ],
        }),
        ...shown.map((c) => cell(el, c.width, c.draw(row), isStale(c), c.wrap)),
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

/** `owner/name#n`: a PR's key in PaneUi and in its Button's key. */
const prKey = (pr: Pr): string => `${pr.repo}#${pr.number}`

/**
 * The PRs tab: one block per repo, each PR's state and CI. `c` (or pressing a PR) lists the
 * checks still red or running. `o` and `m` are shown as hints only; they arrive with S4.
 */
function drawPrs(el: El, board: Board, ui: PaneUi, columns: number, act: Act): RenderElement {
  const { Box, Text, Button } = el
  const items = board.prs.flatMap((g) => g.items)
  const heading = board.project === undefined ? "THIS SPACE'S PRS" : "THIS PROJECT'S PRS"
  if (items.length === 0) return Box({ flexDirection: 'column', children: [Text({ dimColor: true, children: [heading] }), Text({ dimColor: true, children: ['No PRs for this space.'] })] })

  const prWidth = Math.max(MIN_WORK, columns - STATE_WIDTH - PR_CI_WIDTH)
  const focused = items.find((i) => prKey(i.pr) === ui.selectedPr) ?? items[0]

  const prRow = ({ pr, tickets }: PrItem) => {
    const isOpen = ui.checks === prKey(pr)
    return Box({
      flexDirection: 'column',
      children: [
        Box({
          flexDirection: 'row',
          children: [
            Box({
              width: prWidth,
              flexShrink: 0,
              flexDirection: 'column',
              children: [
                Button({ key: `pr-${prKey(pr)}`, label: clip(`#${pr.number} ${pr.title}`, prWidth - 1), plain: true, onPress: () => act({ k: 'checks', pr: prKey(pr) }) }),
                Text({ dimColor: true, children: [tickets.length > 0 ? tickets.join(' ') : pr.branch] }),
              ],
            }),
            cell(el, STATE_WIDTH, PR_STATE[pr.state]),
            cell(el, PR_CI_WIDTH, ciDrawn(ciCell(pr))),
          ],
        }),
        isOpen ? checkLines(el, pr) : null,
      ],
    })
  }

  return Box({
    flexDirection: 'column',
    children: [
      Text({ dimColor: true, children: [heading] }),
      Box({ flexDirection: 'row', children: [cell(el, prWidth, { text: 'PR' }, true), cell(el, STATE_WIDTH, { text: 'State' }, true), cell(el, PR_CI_WIDTH, { text: 'CI' }, true)] }),
      ...board.prs.flatMap((g) => [Text({ bold: true, children: [REPO_TAG[g.repo] ?? g.repo.split('/').pop() ?? g.repo] }), ...g.items.map(prRow)]),
      Text({ children: [' '] }),
      Box({
        flexDirection: 'row',
        columnGap: 3,
        children: [
          Text({ dimColor: true, children: ['o open'] }),
          Button({ key: 'checks', label: 'checks', hotkey: 'c', plain: true, onPress: () => (focused === undefined ? undefined : act({ k: 'checks', pr: prKey(focused.pr) })) }),
          Text({ dimColor: true, children: [focused === undefined ? 'm merge it' : `m merge it #${focused.pr.number}`] }),
        ],
      }),
    ],
  })
}

/** Under an open PR: its failed checks, then those still running, else that all passed. */
function checkLines(el: El, pr: Pr): RenderElement {
  const { Box, Text } = el
  const { failed, running, total } = pr.checks
  const lines = [...failed.map((name) => Text({ color: 'red', children: [name] })), ...running.map((name) => Text({ color: 'blue', children: [name] }))]
  return Box({
    flexDirection: 'column',
    paddingLeft: 2,
    children: lines.length > 0 ? lines : [Text({ dimColor: true, children: [total === 0 ? 'no checks' : `all ${total} checks passed`] })],
  })
}

/** One fixed-width cell. A dimmed cell drops its colour. */
function cell({ Box, Text }: El, width: number, { text, color }: Drawn, dim = false, wrap: 'wrap' | 'truncate-end' = 'truncate-end'): RenderElement {
  return Box({ width, flexShrink: 0, children: [Text({ dimColor: dim, color: dim ? undefined : color, wrap, children: [text] })] })
}

/** What a row's cell in one column reads. Cell glyphs live in COLUMNS and nowhere else. */
export const cellText = (row: Row, id: ColumnId): string => COLUMNS[id].draw(row).text

/** The columns this board shows, and the Work column's width: what the pane's width leaves, never under 10. */
export function columnsFor(width: number, board: Board): { work: number; shown: Column[] } {
  const shown = Object.values(COLUMNS).filter((c: Column) => c.shownIf === undefined || c.shownIf(board))
  return { work: Math.max(MIN_WORK, width - shown.reduce((sum, c) => sum + c.width, 0)), shown }
}

function rowsOf(g: Group): Row[] {
  return g.k === 'single' ? [g.row] : g.children
}

function otherLine(el: El, o: OtherItem, columns: number): RenderElement {
  const { Box, Text } = el
  const status = o.pane.k === 'live' ? [o.pane.status, o.pane.tool].filter((x) => x !== undefined).join(' ') : absent(o.pane)
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

const liveText = (p: LivePane): string => (p.tool === undefined ? PANE_GLYPH[p.status] : `${PANE_GLYPH[p.status]} ${p.tool}`)

const absent = (p: { k: 'gone' | 'none' }): string => (p.k === 'gone' ? 'gone' : DASH)

/** The mock's Report copy and classes: ✓ green, `2 !` concerns amber, what needs Andres red. A report still in the inbox is `unsent`. */
const REPORT_IN: Record<ReportStatus, (concerns: number) => Drawn> = {
  DONE: () => ({ text: '✓', color: 'green' }),
  DONE_WITH_CONCERNS: (n) => ({ text: n > 0 ? `${n} !` : '!', color: 'yellow' }),
  NEEDS_CONTEXT: () => ({ text: 'ask', color: 'red' }),
  BLOCKED: () => ({ text: 'blocked', color: 'red' }),
}

function reportDrawn(r: Cells['report']): Drawn {
  if (r.k === 'in') return REPORT_IN[r.status](r.concerns)
  if (r.k === 'undelivered') return { text: 'unsent', color: 'yellow' }
  if (r.k === 'escalation') return { text: 'note', color: 'yellow' }
  return { text: r.k === 'na' ? 'n/a' : DASH }
}

const LIGHT_TEXT: Record<Light, (letter: Letter) => string> = { lit: (l) => l, dim: (l) => l, claimed: (l) => l, amber: () => '·', na: () => 'n/a', off: () => DASH }

/** Until a verifier reports, and while the offer stands, every letter is a dash. */
function reviewText(r: Cells['review']): string {
  return LETTERS.map((l) => (r.k === 'review' ? LIGHT_TEXT[r.lights[l]](l) : DASH)).join(' ')
}

/** The mock's classes: an open PR blue, a merged one green. */
const PR_COLOR: Record<Pr['state'], string | undefined> = { OPEN: 'blue', MERGED: 'green', CLOSED: undefined }

function prDrawn(p: PrCell): Drawn {
  if (p.k === 'none') return { text: DASH }
  return { text: p.k === 'own' ? `#${p.pr.number}` : `in #${p.pr.number}`, color: PR_COLOR[p.pr.state] }
}

function ciDrawn(c: CiCell): Drawn {
  switch (c.k) {
    case 'pass':
      return { text: '✓', color: 'green' }
    case 'fail':
      return { text: `✗ ${c.failed}`, color: 'red' }
    case 'running':
      return { text: `◐ ${c.done}/${c.total}`, color: 'blue' }
    case 'none':
      return { text: DASH }
  }
}

function linearText(l: Cells['linear']): string {
  switch (l.k) {
    case 'none':
      return DASH
    case 'ok':
      return '✓'
    case 'pending':
      return '↻'
    case 'error':
      return '↻ !'
  }
}

function healthLines(health: Health): string[] {
  return (Object.keys(health) as Array<keyof Health>).flatMap((id) => {
    const h = health[id]
    const { name, down } = HEALTH_WORDS[id]
    if (h.k === 'ok') return []
    return [h.k === 'stale' ? `${name} ${down} since ${hhmm(h.since)}` : `${name} unavailable`]
  })
}

function hhmm(ms: Ms): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function clip(text: string, width: number): string {
  return text.length <= width ? text : `${text.slice(0, Math.max(0, width - 1))}…`
}
