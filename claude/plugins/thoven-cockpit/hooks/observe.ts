// observe.ts: what a session learns from a prompt, a Bash command, a skill run or its own answer,
// as facts.
//
// Pure. register.ts parses what a hook saw (dispatch.ts), supplies who this session is, its id and
// the time, then writes the facts and keeps the `me` that come back. Every rule about what a brief,
// report, verdict or send.sh call means for the store lives here, not in the shell.

import type { ReportLine, readPrompt } from './dispatch.ts'
import { claimOf } from './facts.ts'
import { spaceOfPane } from './herdr.ts'
import type { Readback } from './linear.ts'
import { VERDICTS, isOneOf, type Engagement, type Fact, type FactOf, type Me, type Ms, type ReportStatus, type ReviewSkill, type SendCall, type SessionId, type StatusLine } from './model.ts'

export type Observed = { facts: Fact[]; me: Me }
export type Observer<I> = (me: Me, input: I, sid: SessionId, at: Ms) => Observed

/** A prompt dispatch.ts could read. */
export type Prompt = NonNullable<ReturnType<typeof readPrompt>>

/**
 * A prompt or hand-back any session received. A brief ties this pane to its ticket and engages it;
 * an inert session (outside herdr) has no pane to tie, so it records only reports and verdicts
 * (synthesis B2). A fix round names neither playbook nor title, so it keeps the first brief's.
 */
export const promptSeen: Observer<Prompt> = (me, read, sid, at) => {
  if (read.k === 'report') return { me, facts: read.lines.map((l) => lineFact(l, sid, at)) }
  if (me.k === 'inert') return { me, facts: [] }
  const b = read.brief
  const before = me.k === 'pane' ? me.engagements.find((x) => x.ticket === b.ticket) : undefined
  const labelKind = b.k === 'first' ? b.labelKind : before?.labelKind
  const title = (b.k === 'first' ? b.title : undefined) ?? before?.title
  const held: Engagement = { ...b, ...(labelKind === undefined ? {} : { labelKind }), ...(title === undefined ? {} : { title }) }
  const facts: Fact[] = [{ kind: 'brief', ...held, sid, pane: me.pane, at }]
  if (me.k !== 'pane') return { me, facts }
  return { me: { ...me, engagements: [...me.engagements.filter((x) => x.ticket !== b.ticket), held] }, facts }
}

function lineFact(l: ReportLine, sid: SessionId, at: Ms): Fact {
  return isOneOf(VERDICTS)(l.word)
    ? { kind: 'verdict', ticket: l.ticket, sid, verdict: l.word, text: l.line, at }
    : { kind: 'report', ticket: l.ticket, sid, status: l.word, text: l.line, concerns: l.concerns, at }
}

/** Read-back lines `/workspace update` printed. Only main hands events to it, so only main records them. */
export const readbackSeen: Observer<readonly Readback[]> = (me, lines, sid, at) => ({
  me,
  facts: me.k === 'main' ? lines.map((l) => ({ kind: 'readback', ticket: l.ticket, sid, isError: l.isError, text: l.text, at })) : [],
})

/** The send.sh calls a Bash command made. send.sh itself needs HERDR_PANE_ID, so an inert session records none. */
export const bashSeen: Observer<readonly SendCall[]> = (me, calls, _sid, at) => ({
  me,
  facts: me.k === 'inert' ? [] : calls.map((c) => ({ kind: 'send', ...c, at })),
})

/**
 * ADR3: a space's main is claimed by `/cockpit` or by the first send.sh. The claim a pane session's
 * send makes, when no session holds its space; a send never takes a claim. send.sh runs only under
 * HERDR_PANE_ID, so the space is that pane id's workspace, with no snapshot to wait on.
 */
export function sendClaim(me: Me, claims: readonly Fact[], at: Ms): FactOf<'main'> | undefined {
  if (me.k !== 'pane') return undefined
  const space = spaceOfPane(me.pane)
  if (space === undefined || claimOf(claims, space) !== undefined) return undefined
  return { kind: 'main', space, sid: me.sid, pane: me.pane, at }
}

/** The status lines a builder pane's own answer ended its turn with: what it last sent main. Only a pane holds a brief. */
export const answerSeen: Observer<ReadonlyArray<StatusLine & { word: ReportStatus }>> = (me, lines, sid, at) => ({
  me,
  facts: me.k === 'pane' ? lines.map((l) => ({ kind: 'status', ticket: l.ticket, sid, status: l.word, text: l.line, at })) : [],
})

/**
 * A Review skill this session ran itself, with the brief facts it wrote (ADR12): one fact per ticket
 * it holds a brief for, `review` under a verifier brief and `self` under any other, in the round of
 * that brief. A pane with no brief records a `ran`, for a verdict reply to name (verdictSeen). Main
 * and a session outside herdr record nothing.
 */
export const skillSeen: Observer<{ skill: ReviewSkill; briefs: ReadonlyArray<FactOf<'brief'>> }> = (me, { skill, briefs }, sid, at) => {
  const held = briefs.filter((b) => b.sid === sid)
  if (held.length === 0) return { me, facts: me.k === 'pane' ? [{ kind: 'ran', sid, skill, at }] : [] }
  return {
    me,
    facts: held.map((b): Fact => {
      const run = { ticket: b.ticket, sid, skill, round: b.at, at }
      return b.k === 'first' && b.role === 'verifier' ? { kind: 'review', ...run } : { kind: 'self', ...run }
    }),
  }
}

/**
 * The verdicts a pane's own answer gave. Replying `VERIFIED THV-n` or `FINDINGS THV-n` makes it
 * THV-n's verifier (spec, Review row, and Andres's ruling on THV-1095): it writes the verifier brief
 * a `Verify THV-n` would have, so the Review skills it runs next write `review`, and each skill it
 * already ran with no brief (`ran`) becomes `review` in that round too. A run counts once, for the
 * first verdict that claims it: only an unclaimed run newer than every brief the pane holds counts, and
 * one answer naming two tickets credits its runs to the first it names. A pane holding a builder or
 * fix-round brief is a builder, whatever it replies: its role, self-check and pane kind stay
 * (ADR12). A pane keeps any brief it already holds for the ticket, and with it the round its skills
 * ran in. Main relays verdicts, so only a pane.
 */
export const verdictSeen: Observer<{ lines: readonly StatusLine[]; briefs: ReadonlyArray<FactOf<'brief'>>; ran: ReadonlyArray<FactOf<'ran'>> }> = (me, { lines, briefs, ran }, sid, at) => {
  const held = briefs.filter((b) => b.sid === sid)
  if (me.k !== 'pane' || held.some((b) => b.k === 'fix' || b.role === 'builder')) return { me, facts: [] }
  // Persist claims on the runs because they can outlive the brief that first claimed them.
  const claimedUntil = Math.max(-Infinity, ...held.map((b) => b.at))
  const unclaimed = ran.filter((r) => r.sid === sid && !r.claimed && r.at > claimedUntil)
  const out = lines.reduce<Observed & { runs: ReadonlyArray<FactOf<'ran'>> }>(
    (seen, l) => {
      if (!isOneOf(VERDICTS)(l.word) || held.some((b) => b.ticket === l.ticket)) return seen
      const next = promptSeen(seen.me, { k: 'brief', brief: { k: 'first', ticket: l.ticket, role: 'verifier' } }, sid, at)
      const reviews = seen.runs.map((r): Fact => ({ kind: 'review', ticket: l.ticket, sid, skill: r.skill, round: at, at: r.at }))
      const claims = seen.runs.map((r): Fact => ({ ...r, claimed: true }))
      return { me: next.me, facts: [...seen.facts, ...next.facts, ...reviews, ...claims], runs: [] }
    },
    { me, facts: [], runs: unclaimed },
  )
  return { me: out.me, facts: out.facts }
}
