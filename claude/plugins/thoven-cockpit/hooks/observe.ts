// observe.ts: what a session learns from a prompt, a Bash command, a skill run or its own answer,
// as facts.
//
// Pure. register.ts parses what a hook saw (dispatch.ts), supplies who this session is, its id and
// the time, then writes the facts and keeps the `me` that come back. Every rule about what a brief,
// report, verdict or send.sh call means for the store lives here, not in the shell.

import { builderTickets, sentLines } from './background.ts'
import type { ReportLine, readPrompt } from './dispatch.ts'
import { claimOf } from './facts.ts'
import { spaceOfPane } from './herdr.ts'
import type { Readback } from './linear.ts'
import { VERDICTS, isOneOf, type Engagement, type Fact, type FactOf, type Me, type Ms, type ReviewSkill, type SendCall, type SessionId, type StatusLine } from './model.ts'

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
  const engagement: Engagement = { ...b, ...(labelKind === undefined ? {} : { labelKind }), ...(title === undefined ? {} : { title }) }
  const facts: Fact[] = [{ kind: 'brief', ...engagement, sid, pane: me.pane, at }]
  if (me.k !== 'pane') return { me, facts }
  return { me: { ...me, engagements: [...me.engagements.filter((x) => x.ticket !== b.ticket), engagement] }, facts }
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

/**
 * A Review skill this session ran itself, with the brief facts it wrote (ADR12): one fact per ticket
 * it holds a brief for, `review` under a verifier brief and `self` under any other, in the round of
 * that brief. A pane with no brief records a `ran`, for a verdict reply to name (verdictsSeen). Main
 * and a session outside herdr record nothing.
 */
export const skillSeen: Observer<{ skill: ReviewSkill; briefs: ReadonlyArray<FactOf<'brief'>> }> = (me, { skill, briefs }, sid, at) => {
  const mine = briefs.filter((b) => b.sid === sid)
  const ran: Fact[] = me.k === 'pane' ? [{ kind: 'ran', sid, skill, at }] : []
  if (mine.length === 0) return { me, facts: ran }
  return {
    me,
    facts: mine.map((b): Fact => {
      const run = { ticket: b.ticket, sid, skill, round: b.at, at }
      return b.k === 'first' && b.role === 'verifier' ? { kind: 'review', ...run } : { kind: 'self', ...run }
    }),
  }
}

/** What a pane's own answer ended its turn with, and the briefs and skill runs its session holds. */
export type Answer = { lines: readonly StatusLine[]; briefs: ReadonlyArray<FactOf<'brief'>>; ran: ReadonlyArray<FactOf<'ran'>> }

/**
 * The status lines a pane's own answer gave. A pane holding a builder or fix-round brief is a
 * builder, whatever it replies: its report lines for the tickets it holds are what it last sent
 * main, and its role, self-check and pane kind stay (ADR12). Any other pane's verdict lines make
 * it a verifier (verdictsSeen). Main relays verdicts, so only a pane.
 */
export const answerSeen: Observer<Answer> = (me, answer, sid, at) => {
  if (me.k !== 'pane') return { me, facts: [] }
  const tickets = builderTickets(answer.briefs, sid)
  if (tickets.length === 0) return verdictsSeen(me, answer, sid, at)
  return { me, facts: sentLines(tickets, answer.lines).map((l) => ({ kind: 'status', ticket: l.ticket, sid, status: l.word, text: l.line, at })) }
}

/**
 * Replying `VERIFIED THV-n` or `FINDINGS THV-n` makes a pane THV-n's verifier (spec, Review row, and
 * Andres's ruling on THV-1095): it writes the verifier brief a `Verify THV-n` would have, so the
 * Review skills it runs next write `review`, and each skill it already ran with no brief (`ran`)
 * becomes `review` in that round too. A run counts once, for the first verdict that claims it: only
 * an unclaimed run newer than every brief the pane holds counts, and one answer naming two tickets
 * credits its runs to the first it names. A pane keeps any brief it already holds for the ticket,
 * and with it the round its skills ran in.
 */
function verdictsSeen(me: Me, { lines, briefs, ran }: Answer, sid: SessionId, at: Ms): Observed {
  const mine = briefs.filter((b) => b.sid === sid)
  const verdicts = lines.filter((l) => isOneOf(VERDICTS)(l.word) && !mine.some((b) => b.ticket === l.ticket))
  // A claim is kept on the run, because a run can outlive the brief that claimed it. The brief
  // watermark is still needed: a run made before a brief this pane holds was never claimed (THV-1100).
  const claimedUntil = Math.max(...mine.map((b) => b.at))
  const unclaimed = ran.filter((r) => r.sid === sid && !r.claimed && r.at > claimedUntil)
  return verdicts.reduce<Observed>(
    (seen, l, i) => {
      const next = promptSeen(seen.me, { k: 'brief', brief: { k: 'first', ticket: l.ticket, role: 'verifier' } }, sid, at)
      const runs = i === 0 ? unclaimed : []
      const reviews = runs.map((r): Fact => ({ kind: 'review', ticket: l.ticket, sid, skill: r.skill, round: at, at: r.at }))
      const claims = runs.map((r): Fact => ({ ...r, claimed: true }))
      return { me: next.me, facts: [...seen.facts, ...next.facts, ...reviews, ...claims] }
    },
    { me, facts: [] },
  )
}
