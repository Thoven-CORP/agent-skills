// view.ts: Board → element tree. No Table exists, so a table is a column of row Boxes whose
// cells are fixed-width Boxes (widths from `COLUMNS`).
//
// The view never calls `$`. It takes the element constructors `$.ui.resolve(e)` returned and one
// `act(intent)` callback, so a drawing test presses a key and main.ts alone decides what the
// Intent does. Every glyph the cockpit shows is in this file.

import type { Elements, RenderElement } from 'claude-code'
import type { DoctorReport } from './doctor.ts'
import { ciCell } from './cells.ts'
import { pendingOf } from './linear.ts'
import { AGENT_SKILLS, BACKEND, FRONTEND } from './github.ts'
import { LETTERS } from './model.ts'
import type { Board, Cells, CiCell, Group, Health, Intent, Letter, Light, Ms, LivePane, OtherItem, PaneStatus, PaneUi, Pr, PrCell, PrItem, ReportStatus, Row } from './model.ts'

/** The three elements the cockpit draws with, on whichever surface resolved them. */
type El = Pick<Elements[keyof Elements], 'Box' | 'Text' | 'Button'>
type Act = (i: Intent) => void | Promise<void>

const DASH = '–'
const MIN_WORK = 10
const KIND_WIDTH = 9

/** What one cell reads, and its colour. `parts`, when set, are its pieces each in their own colour; `text` is them joined. */
type Drawn = { text: string; color?: string | undefined; parts?: ReadonlyArray<{ text: string; color?: string | undefined; dim?: boolean }> }

/** One Work-tab column after Work. While its `source` is stale the column keeps its last answer, dimmed and uncoloured. */
type Column = { heading: string; width: number; draw(row: Row): Drawn; shownIf?: (board: Board) => boolean; source?: keyof Health; wrap?: 'wrap'; press?: (row: Row) => { key: string; intent: Intent } | undefined }

/** The Work tab's columns after Work, in order. Report fits `blocked` and a space before Fix. */
const COLUMNS = {
  // Several panes outgrow the column, so they wrap onto the next line rather than truncate.
  pane: { heading: 'Pane', width: 5, wrap: 'wrap', draw: ({ panes: p }) => (p.k === 'live' ? { text: p.list.map(liveText).join(' '), color: PANE_COLOR[p.list[0].status] } : { text: absent(p) }) },
  report: { heading: 'Report', width: 8, draw: (r) => reportDrawn(r.cells.report) },
  fix: { heading: 'Fix', width: 5, draw: ({ cells: { fix } }) => ({ text: fix.k === 'round' ? `${fix.round}/${fix.of}` : DASH }) },
  review: { heading: 'Review', width: 9, draw: (r) => reviewDrawn(r.cells.review) },
  pr: { heading: 'PR', width: 9, source: 'github', draw: (r) => prDrawn(r.cells.pr) },
  ci: { heading: 'CI', width: 6, source: 'github', draw: (r) => ciDrawn(r.cells.ci) },
  linear: { heading: 'Linear', width: 7, source: 'linear', shownIf: (b) => b.project !== undefined, draw: (r) => linearDrawn(r.cells.linear), press: linearPress },
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
  codex: { name: 'Codex rollouts', down: 'stale' },
  linear: { name: 'Linear', down: 'stale' },
}

/**
 * Text drawn in the theme's own colours. Claude Code fills a pane with the theme's background, but an
 * uncoloured Text keeps the terminal's foreground, so a light theme in a dark terminal hides it.
 */
const THEMED: Record<string, string> = { green: 'success', red: 'error', yellow: 'warning', blue: 'suggestion' }
function themed(el: El): El {
  type TextArgs = Parameters<El['Text']>[0]
  const Text = (p: TextArgs) =>
    el.Text({ ...p, color: p.color !== undefined ? (THEMED[p.color] ?? p.color) : p.dimColor === true ? 'inactive' : 'text' })
  return { ...el, Text }
}

export function drawCockpit(raw: El, board: Board | undefined, ui: PaneUi, columns: number, act: Act): RenderElement {
  const el = themed(raw)
  const { Box, Text, Button } = el
  if (!board) return Text({ dimColor: true, children: ['This session is not main of a space. Run /cockpit to claim it.'] })
  // The open tab is Text, so it takes the theme's colour; a Button's label has no colour of its own.
  const tab = (id: PaneUi['tab'], label: string, hotkey: string) =>
    ui.tab === id
      ? Text({ bold: true, children: [`${hotkey}: ${label}`] })
      : Button({ key: `tab-${id}`, label, hotkey, plain: true, dimColor: true, onPress: () => act({ k: 'tab', tab: id }) })
  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [Text({ bold: true, children: [board.space.label] }), Text({ dimColor: true, children: [board.project ?? 'no project'] })],
      }),
      Box({ flexDirection: 'row', columnGap: 3, children: [tab('work', 'Work', '1'), tab('prs', 'PRs', '2'), tab('all', 'All', '3')] }),
      ...healthLines(board.health).map((line) => Text({ color: 'yellow', children: [line] })),
      Text({ children: [' '] }),
      DRAW_TAB[ui.tab](el, board, ui, columns, act),
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
        ...shown.map((c) => {
          const press = c.press?.(row)
          return press ? Box({ width: c.width, flexShrink: 0, children: [Button({ key: press.key, label: c.draw(row).text, plain: true, onPress: () => act(press.intent) })] }) : cell(el, c.width, c.draw(row), isStale(c), c.wrap)
        }),
      ],
    })
  }

  const parentLine = (g: Extract<Group, { k: 'parent' }>) =>
    Text({ bold: true, children: [`${g.title} ${g.parent}: ${g.done} of ${g.total} done${g.counted === 'screen' ? ' on screen' : ''}${g.needsYou > 0 ? `, ${g.needsYou} needs you` : ''}`] })

  return Box({
    flexDirection: 'column',
    children: [
      Text({ dimColor: true, children: ['BUILD'] }),
      rows.length === 0
        ? Text({ dimColor: true, children: ['No build work in this space.'] })
        : [headingRow, ...board.build.flatMap((g) => (g.k === 'single' ? [buildRow(g.row)] : [parentLine(g), ...g.children.map(buildRow)]))],
      board.other.length === 0 ? null : [Text({ children: [' '] }), Text({ dimColor: true, children: ['OTHER'] }), ...board.other.map((o) => otherLine(el, o, columns))],
      Text({ children: [' '] }),
      Box({
        flexDirection: 'row',
        columnGap: 3,
        children: [
          Button({
            key: 'focus-row',
            label: 'focus row',
            hotkey: 'f',
            plain: true,
            onPress: () => (focusTarget === undefined ? undefined : act({ k: 'focus-pane', pane: focusTarget })),
          }),
          // `u` sends every pending event in one `/workspace update` (ADR5); with none it is not offered.
          board.pending.length === 0 ? null : Button({ key: 'update-all', label: 'update all ↻', hotkey: 'u', plain: true, onPress: () => act({ k: 'update', pending: board.pending }) }),
        ],
      }),
    ],
  })
}

/** What each tab draws below the header. */
const DRAW_TAB: Record<PaneUi['tab'], (el: El, board: Board, ui: PaneUi, columns: number, act: Act) => RenderElement> = {
  work: (...a) => drawWork(...a),
  prs: (...a) => drawPrs(...a),
  all: (el, board, _ui, columns, act) => drawAll(el, board, columns, act),
}

/** The All tab: every space's agent panes, grouped by space. Pressing a pane focuses it. */
function drawAll(el: El, board: Board, columns: number, act: Act): RenderElement {
  const { Box, Text, Button } = el
  const width = Math.max(MIN_WORK, columns - 12)
  return Box({
    flexDirection: 'column',
    children: [
      Text({ dimColor: true, children: ['ALL SPACES'] }),
      board.spaces.length === 0 ? Text({ dimColor: true, children: ['herdr has not answered yet.'] }) : null,
      ...board.spaces.flatMap((g) => [
        Text({ bold: true, children: [g.isThis ? `${g.space.label} (this space)` : g.space.label] }),
        g.panes.length === 0
          ? Text({ dimColor: true, children: ['  no agent panes'] })
          : g.panes.map(({ title, pane }) =>
              Box({
                flexDirection: 'row',
                paddingLeft: 2,
                children: [
                  Box({ width, flexShrink: 0, children: [Button({ key: `all-${pane.pane}`, label: clip(title, width - 1), plain: true, onPress: () => act({ k: 'focus-pane', pane: pane.pane }) })] }),
                  Text({ color: PANE_COLOR[pane.status], children: [liveText(pane)] }),
                ],
              }),
            ),
      ]),
    ],
  })
}

/** `owner/name#n`: a PR's key in PaneUi and in its Button's key. */
const prKey = (pr: Pr): string => `${pr.repo}#${pr.number}`

/**
 * The PRs tab: one block per repo, each PR's state and CI. `c` (or pressing a PR) lists the
 * checks still red or running. `m` and `r` only draft a prompt for the focused PR; Andres sends it.
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
          Button({ key: 'checks', label: 'checks', hotkey: 'c', plain: true, onPress: () => (focused === undefined ? undefined : act({ k: 'checks', pr: prKey(focused.pr) })) }),
          focused?.pr.state !== 'OPEN' ? null : Button({ key: 'fill-merge', label: 'merge it', hotkey: 'm', plain: true, onPress: () => act({ k: 'fill', text: `merge it ${prKey(focused.pr)}` }) }),
          focused?.pr.state !== 'OPEN' ? null : Button({ key: 'fill-review', label: 'review', hotkey: 'r', plain: true, onPress: () => act({ k: 'fill', text: `/code-review ${focused.pr.url}` }) }),
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
function cell({ Box, Text }: El, width: number, { text, color, parts }: Drawn, dim = false, wrap: 'wrap' | 'truncate-end' = 'truncate-end'): RenderElement {
  const children = parts && !dim ? parts.map((p) => Text({ color: p.color, dimColor: p.dim === true, children: [p.text] })) : [text]
  return Box({ width, flexShrink: 0, children: [Text({ dimColor: dim, color: dim ? undefined : color, wrap, children })] })
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
  const label = o.k === 'labelled' ? o.title : `tab "${o.tab}" (unlabelled)`
  return Box({
    flexDirection: 'row',
    children: [
      Box({ width: KIND_WIDTH, flexShrink: 0, children: [Text({ dimColor: true, children: [o.k === 'labelled' ? (o.kind ?? '') : ''] })] }),
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

/** The builder's own /verify-this, a small mark after Report. */
const SELF_MARK = 'ᵛ'
const withSelfMark = (d: Drawn, isChecked: boolean): Drawn => (isChecked ? { ...d, text: `${d.text}${SELF_MARK}` } : d)

function reportDrawn(r: Cells['report']): Drawn {
  if (r.k === 'in') return withSelfMark(REPORT_IN[r.status](r.concerns), r.selfChecked)
  if (r.k === 'undelivered') return withSelfMark({ text: 'unsent', color: 'yellow' }, r.selfChecked)
  if (r.k === 'escalation') return { text: 'note', color: 'yellow' }
  return { text: r.k === 'na' ? 'n/a' : DASH }
}

const LIGHT_TEXT: Record<Light, (letter: Letter) => string> = { lit: (l) => l, dim: (l) => l, claimed: (l) => l, amber: () => '·', na: () => 'n/a', off: () => DASH }

/** The mock's classes: a letter that ran green, the amber dot, a VERIFIED claim with no run red, a skill Codex only selected dim. */
const LIGHT_STYLE: Record<Light, { color?: string; dim?: boolean }> = { lit: { color: 'green' }, dim: { dim: true }, claimed: { color: 'red' }, amber: { color: 'yellow' }, na: { dim: true }, off: { dim: true } }

/** Until a verifier reports, every letter is a dash. A verifier no trace can come from reads n/a once. */
function reviewDrawn(r: Cells['review']): Drawn {
  if (r.k !== 'review') return { text: LETTERS.map(() => DASH).join(' ') }
  if (LETTERS.every((l) => r.lights[l] === 'na')) return { text: 'n/a' }
  const parts = LETTERS.flatMap((l, i) => [...(i === 0 ? [] : [{ text: ' ' }]), { text: LIGHT_TEXT[r.lights[l]](l), ...LIGHT_STYLE[r.lights[l]] }])
  return { text: parts.map((p) => p.text).join(''), parts }
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

/** The mock's Linear copy: ✓ up to date, ↻ to send `/workspace update`. A read-back error keeps the ↻ and adds `!`. */
function linearDrawn(l: Cells['linear']): Drawn {
  switch (l.k) {
    case 'none':
      return { text: DASH }
    case 'ok':
      return { text: '✓', color: 'green' }
    case 'pending':
      return { text: '↻', color: 'blue' }
    case 'error':
      return { text: '↻ !', color: 'red' }
  }
}

/** ↻ on a row with pending events hands exactly those to `/workspace update`. */
function linearPress(row: Row): { key: string; intent: Intent } | undefined {
  const pending = pendingOf(row.cells.linear)
  return pending.length === 0 ? undefined : { key: `linear-${row.ticket}`, intent: { k: 'update', pending } }
}

function healthLines(health: Health): string[] {
  return Object.keys(health).filter(isHealthId).flatMap((id) => {
    const h = health[id]
    const { name, down } = HEALTH_WORDS[id]
    if (h.k === 'ok') return []
    return [h.k === 'stale' ? `${name} ${down} since ${hhmm(h.since)}` : `${name} unavailable`]
  })
}

const isHealthId = (k: string): k is keyof Health => Object.hasOwn(HEALTH_WORDS, k)

/** `/cockpit doctor` as the lines it answers with. */
export function doctorText(r: DoctorReport): string {
  const c = r.claim
  const claim =
    c.k === 'no-space' ? 'Main: this session is not in a herdr pane, so it has no space.'
    : c.k === 'unclaimed' ? `Main of ${c.space}: none. Run /cockpit to claim it.`
    : `Main of ${c.space}: ${c.isMine ? 'this session' : `pane ${c.pane}, session ${c.sid}`}, claimed ${ago(c.ageMs)} ago.`
  const polled = r.sources
  const sources = polled === undefined
    ? ['Sources: polled only by main, and this session is not main.']
    : ['Sources:', ...Object.keys(polled.health).filter(isHealthId).map((id) => {
        const h = polled.health[id]
        if (id === 'linear' && polled.linear === 'no-project') return `  ${HEALTH_WORDS[id].name}: not read here, this space has no Project`
        if (id === 'linear' && polled.linear === 'no-live-spaces') return `  ${HEALTH_WORDS[id].name}: not read here, ${HEALTH_WORDS.spaces.name} is unavailable`
        return `  ${HEALTH_WORDS[id].name}: ${h.k === 'ok' ? 'ok' : h.k === 'stale' ? `${HEALTH_WORDS[id].down} since ${hhmm(h.since)}` : 'unavailable'}`
      })]
  const where = r.plugin.isMainCheckout ? 'the main checkout' : `not the main checkout (${r.plugin.expected})`
  const keys = r.keys.map((k) => `  ${(k.ageMs === undefined ? '?' : ago(k.ageMs)).padEnd(6)} ${k.key}${k.isExpired ? '  older than 14 days, main deletes it' : ''}${k.isReadable ? '' : '  (unreadable)'}`)
  return [
    'Cockpit doctor',
    `Plugin: ${r.plugin.root}, ${where}. CLAUDE_CODE_PLUGIN_DIRS: ${r.plugin.env ?? 'unset'}.`,
    claim,
    ...sources,
    `Store: ${r.keys.length} cockpit key${r.keys.length === 1 ? '' : 's'}.`,
    ...keys,
  ].join('\n')
}

/** An age in its largest whole unit: `15 d`, `3 h`, `12 m`, `40 s`. */
function ago(ms: Ms): string {
  const units: Array<[string, number]> = [['d', 86_400_000], ['h', 3_600_000], ['m', 60_000], ['s', 1_000]]
  for (const [unit, size] of units) if (ms >= size) return `${Math.floor(ms / size)} ${unit}`
  return '0 s'
}

function hhmm(ms: Ms): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function clip(text: string, width: number): string {
  return text.length <= width ? text : `${text.slice(0, Math.max(0, width - 1))}…`
}
