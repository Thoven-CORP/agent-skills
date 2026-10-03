// dispatch.ts: the grammar of what dispatch-work's scripts and briefs already produce.
//
// Owns ticket ids, label.sh labels and branch names. If dispatch-work changes a format, this is
// the only file that changes. Every function is pure and is tested on real text.

import type { Kind, Label, Ticket } from './model.ts'

const KINDS: readonly Kind[] = ['Meta', 'Plan', 'Design', 'Build', 'Review', 'Research', 'Audit', 'Fix']

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
  let kind: Kind | undefined
  const sep = rest.indexOf(' · ')
  if (sep > 0) {
    const word = rest.slice(0, sep)
    if ((KINDS as readonly string[]).includes(word)) {
      kind = word as Kind
      rest = rest.slice(sep + 3).trim()
    }
  }

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

/** The spec's "first match wins": pane label, tab label, terminal title, then the branch. */
export function pickLabel(candidates: ReadonlyArray<string | undefined>, branch: string | undefined): Label | undefined {
  for (const text of candidates) {
    const label = text === undefined ? undefined : parseLabel(text)
    if (label) return label
  }
  const t = branch === undefined ? undefined : branchTicket(branch)
  return t && branch ? { kind: undefined, title: branch, tickets: [t] } : undefined
}

/** The ticket a branch names: `legal/thv-1045` → THV-1045, `sentry-error` → undefined. */
export function branchTicket(branch: string): Ticket | undefined {
  const m = /thv-(\d+)/i.exec(branch)
  return m?.[1] ? ticket(m[1]) : undefined
}
