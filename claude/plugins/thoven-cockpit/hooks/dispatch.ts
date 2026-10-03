// dispatch.ts: the grammar of what dispatch-work's scripts and briefs already produce.
//
// Owns ticket ids, label.sh labels, branch names, status lines, briefs, send.sh calls and the
// inbox file grammar. If dispatch-work changes a format, this is
// the only file that changes. Every function is pure and is tested on real text.

import { KINDS, STATUS_WORDS, isOneOf, type Brief, type InboxFile, type Kind, type Label, type PaneId, type Role, type SendCall, type StatusLine, type Ticket } from './model.ts'

/** `THV-1045`, `thv-1045`, `1045` → Ticket. Undefined for anything else. */
export function ticket(raw: string): Ticket | undefined {
  const m = /^(?:THV-)?(\d+)$/i.exec(raw.trim())
  return m ? (`THV-${Number(m[1])}` as Ticket) : undefined
}

/** `(THV-1045)`, `(THV-843 847 851)`, `(THV-851, THV-847, THV-843)` at the end of a label. */
const TRAILING_TICKETS = /\s*\((THV-\d+(?:[\s,]+(?:THV-)?\d+)*)\)\s*$/i
/** A terminal title Claude led with the ticket: `THV-1004 children's media URL expiry`. */
const LEADING_TICKET = /^(THV-\d+)[\s:–-]+(\S.*)$/i

/**
 * label.sh's `<Kind> · <title> (THV-n)`, plus the older forms still on screen:
 *   `Build · Consent evidence hardening (THV-1045)`
 *   `Book Lessons follow-ups (THV-843 847 851)`  (no kind, three tickets)
 *   `THV-1004 children's media URL expiry`       (a terminal title)
 * Undefined when the text carries neither a known Kind nor a ticket, as with herdr's default tab
 * name `1`, a plain `Mods`, or `main · COPPA orchestrator` (`main` is not a Kind).
 */
export function parseLabel(text: string): Label | undefined {
  let rest = text.trim()
  const sep = rest.indexOf(' · ')
  const kind = sep > 0 ? kindOf(rest.slice(0, sep)) : undefined
  if (kind) rest = rest.slice(sep + 3).trim()

  let tickets: Ticket[] = []
  const trailing = TRAILING_TICKETS.exec(rest)
  if (trailing?.[1]) {
    tickets = trailing[1].split(/[\s,]+/).flatMap((t) => ticket(t) ?? [])
    rest = rest.slice(0, trailing.index).trim()
  } else {
    const leading = LEADING_TICKET.exec(rest)
    const first = leading?.[1] ? ticket(leading[1]) : undefined
    if (first && leading?.[2]) {
      tickets = [first]
      rest = leading[2].trim()
    }
  }

  if (!kind && tickets.length === 0) return undefined
  return { kind, title: rest, tickets }
}

/** A label.sh Kind (`Build`), or undefined for any other word (`main`, `Feature`, `Verify`). */
export function kindOf(word: string | undefined): Kind | undefined {
  return isOneOf(KINDS)(word) ? word : undefined
}

/**
 * The tickets of a trailing `(THV-n …)` group and the text before it, or undefined when the text
 * does not end in one. A PR title's tickets are these only, never ones named in its prose.
 */
export function trailingTickets(text: string): { tickets: Ticket[]; rest: string } | undefined {
  const m = TRAILING_TICKETS.exec(text)
  if (!m?.[1]) return undefined
  return { tickets: m[1].split(/[\s,]+/).flatMap((t) => ticket(t) ?? []), rest: text.slice(0, m.index).trim() }
}

/** The spec's "first match wins" over a pane's texts: pane label, tab label, terminal title. */
export function pickLabel(candidates: ReadonlyArray<string | undefined>): Label | undefined {
  for (const text of candidates) {
    const label = text === undefined ? undefined : parseLabel(text)
    if (label) return label
  }
  return undefined
}

/** The last fallback, after `pickLabel`: the ticket the folder's branch names, titled by the branch. */
export function labelOfBranch(branch: string | undefined): Label | undefined {
  const t = branch === undefined ? undefined : branchTicket(branch)
  return t && branch ? { kind: undefined, title: branch, tickets: [t] } : undefined
}

/** The ticket a branch names: `legal/thv-1045` → THV-1045, `sentry-error` → undefined. */
export function branchTicket(branch: string): Ticket | undefined {
  const m = /thv-(\d+)/i.exec(branch)
  return m?.[1] ? ticket(m[1]) : undefined
}


// ── Reports, briefs and send.sh (brief.md REPORT, FIX ROUND; scripts/send.sh) ───────────────

/**
 * The one regex a session that is neither main nor engaged runs per prompt: could this text hold
 * a status line or a brief? `readPrompt` reads further only when it says yes.
 */
const WORTH_READING = new RegExp(String.raw`^[ \t]*(?:${STATUS_WORDS.join('|')}|FIX ROUND|[/$]poteto-mode[ \t]|Verify[ \t]+THV-)`, 'm')

/** herdr's `agent prompt` arrives pasted: `<pasted_content id="f722">` … `</pasted_content id="f722">`. */
export function unwrapPasted(text: string): string {
  return text.replace(/<\/?pasted_content\b[^>]*>/g, '')
}

/**
 * ADR6: line-anchored, leading spaces allowed (a hand-back's harness indents every line), trailing
 * text allowed (`DONE THV-1041 (fix round 1)`). DONE_WITH_CONCERNS is tried before DONE, and the
 * word must be followed by a space, so `DONE_WITH_CONCERNS THV-7` can never read as DONE.
 */
const STATUS_LINE = new RegExp(String.raw`^[ \t]*(${STATUS_WORDS.join('|')})[ \t]+(THV-\d+)\b[^\n]*`, 'gm')
const LINE_MAX = 200

/** Every status line in the text, the first per ticket, pastes unwrapped. */
export function statusLines(text: string): StatusLine[] {
  const seen = new Set<Ticket>()
  const lines: StatusLine[] = []
  for (const m of unwrapPasted(text).matchAll(STATUS_LINE)) {
    const t = m[2] ? ticket(m[2]) : undefined
    const word = m[1]
    if (!t || !isOneOf(STATUS_WORDS)(word) || seen.has(t)) continue
    seen.add(t)
    lines.push({ ticket: t, word, line: m[0].replace(/\s+$/, '').slice(0, LINE_MAX) })
  }
  return lines
}

type Groups = Partial<Record<string, string>>

/** A brief's first line, in the order they are tried, and the Brief each is. Every head names its `ticket`. */
const HEADS: ReadonlyArray<{ head: RegExp; brief(t: Ticket, g: Groups): Brief }> = [
  // brief.md's fix-round brief: `FIX ROUND 3/5 THV-1015. Base for this round: …`.
  { head: /^FIX ROUND[ \t]+(?<round>\d+)\/(?<of>\d+)[ \t]+(?<ticket>THV-\d+)\b/, brief: (t, g) => ({ k: 'fix', ticket: t, round: Number(g.round), of: Number(g.of) }) },
  // `/poteto-mode Build THV-1014 "title"` (or `$poteto-mode` for Codex).
  {
    head: /^[/$]poteto-mode[ \t]+(?<playbook>\S+)[ \t]+(?<ticket>THV-\d+)\b(?:[ \t]+"(?<title>[^"\n]*)")?/,
    brief: (t, g) => {
      const labelKind = kindOf(g.playbook)
      const role = /^verify$/i.test(g.playbook ?? '') ? 'verifier' : 'builder'
      return { k: 'first', ticket: t, role, ...(labelKind ? { labelKind } : {}), ...(g.title ? { title: g.title } : {}) }
    },
  },
  // The spec's other verifier opening: a brief that starts `Verify THV-n`.
  { head: /^Verify[ \t]+(?<ticket>THV-\d+)\b/, brief: (t) => ({ k: 'first', ticket: t, role: 'verifier' }) },
]

function ticketAt(m: RegExpExecArray | null): Ticket | undefined {
  const raw = m?.groups?.ticket
  return raw === undefined ? undefined : ticket(raw)
}

/** The brief a prompt is, read from its first non-empty line, or undefined. */
export function briefOf(text: string): Brief | undefined {
  const first = unwrapPasted(text).split('\n').find((l) => l.trim() !== '')?.trim() ?? ''
  for (const { head, brief } of HEADS) {
    const m = head.exec(first)
    const t = ticketAt(m)
    if (m?.groups && t) return brief(t, m.groups)
  }
  return undefined
}

/** An Acceptance row the report marks unmet: `[~]`, `[ ]`, `[!]`, `✗` or `~`. */
const UNMET_ROW = /^[ \t]*(?:\[[ ~!-]\]|✗|~)[ \t]/gm

/**
 * What one prompt says. A brief is never also a report: the status lines it quotes (a verifier
 * brief pastes the builder's `DONE THV-n`) are its content, not a hand-back.
 */
export function readPrompt(text: string): { briefs: Brief[]; lines: StatusLine[]; concerns: number } {
  if (!WORTH_READING.test(text)) return { briefs: [], lines: [], concerns: 0 }
  const brief = briefOf(text)
  if (brief) return { briefs: [brief], lines: [], concerns: 0 }
  const lines = statusLines(text)
  return { briefs: [], lines, concerns: lines.some((l) => l.word === 'DONE_WITH_CONCERNS') ? [...unwrapPasted(text).matchAll(UNMET_ROW)].length : 0 }
}

/** `send.sh <pane-or-agent> <brief-file>`, operands optionally quoted. */
const SEND_CALL = /send\.sh[ \t]+["']?([^\s"'|;&]+)["']?[ \t]+["']?([^\s"'|;&]+)/g
/** The brief file names dispatch-work uses: `THV-1004.md`, `THV-1004-fix2.md`, `THV-1030-verify.md`. */
const BRIEF_FILE = /^(THV-\d+)(?:-(fix)(\d+)|-(verify)(\d*))?\.md$/i

/**
 * Every send.sh call in a Bash command whose file is a brief, a fix round or a verify brief.
 * Other files (`THV-1038-ruling.md`, `THV-482-final.md`) are notes to a pane and give nothing.
 */
export function sendCalls(command: string): SendCall[] {
  const calls: SendCall[] = []
  for (const m of command.matchAll(SEND_CALL)) {
    const file = (m[2] ?? '').split('/').pop() ?? ''
    const f = BRIEF_FILE.exec(file)
    const t = f?.[1] ? ticket(f[1]) : undefined
    if (!m[1] || !f || !t) continue
    const role: Role = f[4] ? 'verifier' : 'builder'
    calls.push({ pane: m[1] as PaneId, ticket: t, role, round: Number(f[3] ?? f[5] ?? 0) || 0, file })
  }
  return calls
}

const HEAD_MAX = 300

/**
 * One file in `$TMPDIR/dispatch/out/`. It is an unsent report only when its first line is its
 * own ticket's status line: the folder also holds research deliverables (`# THV-1038 step 1`)
 * and herdr's `[thoven verify]` escalation notes.
 */
export function inboxFile(name: string, text: string, at: number): InboxFile {
  const m = /^(THV-\d+)\.md$/i.exec(name)
  const t = m?.[1] ? ticket(m[1]) : undefined
  const head = (text.split('\n').find((l) => l.trim() !== '') ?? '').trim().slice(0, HEAD_MAX)
  const first = statusLines(head)[0]
  return { name, ticket: t, line: first && first.ticket === t ? first : undefined, head, at }
}
