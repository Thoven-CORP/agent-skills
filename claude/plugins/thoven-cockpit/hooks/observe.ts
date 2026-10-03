// observe.ts: what a session learns from a prompt or a Bash command, as facts.
//
// Pure. register.ts parses what a hook saw (dispatch.ts), supplies who this session is, its id and
// the time, then writes the facts and keeps the `me` that come back. Every rule about what a brief,
// report, verdict or send.sh call means for the store lives here, not in the shell.

import type { ReportLine, readPrompt } from './dispatch.ts'
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

/** The send.sh calls a Bash command made. send.sh itself needs HERDR_PANE_ID, so an inert session records none. */
export const bashSeen: Observer<readonly SendCall[]> = (me, calls, _sid, at) => ({
  me,
  facts: me.k === 'inert' ? [] : calls.map((c) => ({ kind: 'send', ...c, at })),
})

/** The status lines a builder pane's own answer ended its turn with: what it last sent main. Only a pane holds a brief. */
export const answerSeen: Observer<ReadonlyArray<StatusLine & { word: ReportStatus }>> = (me, lines, sid, at) => ({
  me,
  facts: me.k === 'pane' ? lines.map((l) => ({ kind: 'status', ticket: l.ticket, sid, status: l.word, text: l.line, at })) : [],
})

/**
 * A Review skill this session ran itself, with the brief facts it wrote (ADR12): one fact per ticket
 * it holds a brief for, `review` under a verifier brief and `self` under any other, in the round of
 * that brief. A session with no brief (main, a /clear, Andres's own sessions) records nothing.
 */
export const skillSeen: Observer<{ skill: ReviewSkill; briefs: ReadonlyArray<FactOf<'brief'>> }> = (me, { skill, briefs }, sid, at) => ({
  me,
  facts: briefs.flatMap((b): Fact[] => {
    if (b.sid !== sid) return []
    const run = { ticket: b.ticket, sid, skill, round: b.at, at }
    return [b.k === 'first' && b.role === 'verifier' ? { kind: 'review', ...run } : { kind: 'self', ...run }]
  }),
})
