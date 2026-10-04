// detail.ts: the sentences under the Work table and the legend behind `h`. Pure text from a Row,
// so view.ts draws it and a test reads it. The table says what each cell shows; this says what
// the row as a whole means and what to do next.

import { LETTERS, type Letter, type PaneStatus, type ReportStatus, type Row, type Tool } from './model.ts'

const TOOL_NAME: Partial<Record<Tool, string>> = { C: 'Claude', X: 'Codex' }
const STATUS_WORD: Record<PaneStatus, string> = { idle: 'idle', working: 'working', blocked: 'blocked', done: 'finished', unknown: 'in an unknown state' }
const REPORT_WORD: Record<ReportStatus, string> = {
  DONE: 'reported DONE',
  DONE_WITH_CONCERNS: 'reported DONE with concerns',
  NEEDS_CONTEXT: 'is asking for context',
  BLOCKED: 'is blocked',
}
const LETTER_SKILL: Record<Letter, string> = { V: 'verify-this', C: 'code-review', T: 'thermo', D: 'deslop' }

function paneSentence({ panes }: Row): string {
  if (panes.k === 'gone') return 'Its pane has closed.'
  if (panes.k === 'none') return 'It has no pane.'
  const [lead, ...more] = panes.list
  const tool = lead.tool === undefined ? 'The' : (TOOL_NAME[lead.tool] ?? lead.tool)
  return `${tool} pane is ${STATUS_WORD[lead.status]}${more.length > 0 ? `, with ${more.length} more on this ticket` : ''}.`
}

function reportSentence({ cells: { report, fix } }: Row): string {
  const fixed = fix.k === 'round' ? ` It is on fix round ${fix.round} of ${fix.of}.` : ''
  switch (report.k) {
    case 'in':
      return `The builder ${REPORT_WORD[report.status]}${report.concerns > 0 ? ` (${report.concerns} open)` : ''}.${fixed}`
    case 'undelivered':
      return `The builder's report is still in the inbox.${fixed}`
    case 'escalation':
      return `The builder left a note for you.${fixed}`
    default:
      return `No report yet.${fixed}`
  }
}

function prSentence({ cells: { pr, ci } }: Row): string {
  if (pr.k === 'none') return 'No PR yet.'
  const subject = pr.k === 'own' ? `PR #${pr.pr.number}` : `It shares PR #${pr.pr.number}, which`
  const state = pr.pr.state === 'OPEN' ? 'is open' : pr.pr.state === 'MERGED' ? 'is merged' : 'was closed'
  const checks = ci.k === 'pass' ? ' CI passes.' : ci.k === 'fail' ? ` ${ci.failed} CI check${ci.failed === 1 ? '' : 's'} failed.` : ci.k === 'running' ? ` CI is running (${ci.done} of ${ci.total}).` : ''
  return `${subject} ${state}.${checks}`
}

function reviewSentence({ cells: { review } }: Row): string {
  if (review.k === 'none') return 'No verifier has run.'
  const ran = LETTERS.filter((l) => review.lights[l] === 'lit' || review.lights[l] === 'dim').map((l) => LETTER_SKILL[l])
  const missed = LETTERS.filter((l) => review.lights[l] === 'claimed').map((l) => LETTER_SKILL[l])
  const due = review.lights.T === 'amber' ? ' Thermo was due and did not run.' : ''
  const claimed = missed.length > 0 ? ` It said VERIFIED but never ran ${missed.join(', ')}.` : ''
  return `Verifier ran ${ran.length > 0 ? ran.join(', ') : 'nothing'}.${due}${claimed}`
}

/** What to do with this row now, read off its cells. The key letters are the Work tab's own. */
export function nextStep(row: Row): string {
  const { report, pr, ci, review } = row.cells
  if (report.k === 'in' && (report.status === 'NEEDS_CONTEXT' || report.status === 'BLOCKED')) return 'Answer it in its pane (f).'
  if (pr.k === 'none') return row.panes.k === 'live' && row.panes.list[0].status === 'working' ? 'Wait for it to finish.' : 'It has no PR to review.'
  if (pr.pr.state !== 'OPEN') return pr.pr.state === 'MERGED' ? 'Nothing. The PR is merged.' : 'Nothing. The PR was closed.'
  if (ci.k === 'fail') return 'Get the failing checks fixed.'
  if (ci.k === 'running') return 'Wait for CI.'
  if (review.k === 'none') return 'Review it (r).'
  if (Object.values(review.lights).includes('claimed')) return 'Review it again (r): a step it claimed never ran.'
  if (review.lights.T === 'amber') return 'Run thermo (t).'
  return 'Merge it (m).'
}

/** The lines under the table for the highlighted row: what it is, then what to do. */
export function detailLines(row: Row): string[] {
  return [`${paneSentence(row)} ${reportSentence(row)}`, prSentence(row), reviewSentence(row), `Next: ${nextStep(row)}`]
}

/** The one line every screen ends with. */
export const SENT_LINE = "Nothing is sent until you press enter. m, r and t only fill this session's prompt box."

/** Behind `?`: what the columns and keys mean. */
export const LEGEND = {
  work: [
    'Pane      ○ idle · ◐ working · ✓ finished · ! blocked. C is Claude, X is Codex.',
    'Report    ✓ done · n ! open concerns · ask or blocked needs you · note left for you · unsent not delivered yet.',
    'Fix       fix round n of the five allowed.',
    'Review    V verify-this · C code-review · T thermo · D deslop. A letter shows once it ran; red was claimed but never ran; · means thermo is due.',
    "PR, CI    the row's PR and its checks: ✓ pass · ✗ n failed · ◐ running.",
    "Keys      f goes to the ticket's agent pane. r starts a verifier for it, t adds thermo, m drafts the merge. All three need an open PR.",
  ],
  prs: [
    'State     held is open · merged · closed.',
    'CI        ✓ pass · ✗ n failed · ◐ running · – no checks ran.',
    "Keys      c lists a PR's failed or running checks. r starts a verifier for its ticket, t adds thermo, m drafts the merge.",
  ],
  all: ['Every herdr space and its agent panes, this space first. Press a pane to go to it.'],
} as const
