// review.ts: the Review cell (V C T D) and the builder's self-check mark.
//
// Only a verifier's own runs light a letter (ADR12), and only from its latest round:
//   Claude  the newest verifier brief names the session and the round (`at` of that brief); its
//           `review` facts with that sid and round are the letters it ran
//   Codex   the newest verifier rollout of a Codex pane in the space (board.ts picks them). C is
//           lit by a `spawn_agent` for both standards_review and spec_review; a skill that was only
//           selected is dim, because Codex records selection, not a run (ADR11)
// Whichever round started later is the latest. On top of that round:
//   amber T   thermo was due (review.md step 3) and has no trace
//   claimed   the ticket's newest verdict says VERIFIED after the round began, and V, C or D has
//             no trace at all
// The self-check mark is a `self` verify-this fact from the brief its session still holds.

import { newest, type BoardFacts } from './facts.ts'
import { REVIEW_SKILLS, isOneOf, type CodexRollout, type Letter, type Light, type PaneCell, type Pr, type ReviewCell, type ReviewSkill, type Tool } from './model.ts'

const LETTER_OF: Record<ReviewSkill, Letter> = { 'verify-this': 'V', 'code-review': 'C', 'thermo-nuclear-code-quality-review': 'T', deslop: 'D' }

/** A Review skill by name. A plugin skill's `<plugin>:` prefix is dropped, so `team-kit:verify-this` is verify-this. */
export function reviewSkill(name: string): ReviewSkill | undefined {
  const bare = name.replace(/^[\w.-]+:/, '')
  return isOneOf(REVIEW_SKILLS)(bare) ? bare : undefined
}

/** review.md step 3: the diff passes ~300 lines, or crosses a module, read as files under more than one top-level directory. */
const THERMO_LINES = 300
export const isThermoDue = (pr: Pr | undefined): boolean => pr !== undefined && (pr.changedLines > THERMO_LINES || pr.topDirs > 1)

/** One verifier round: where it ran, when it began, and the letters it left a trace of. */
type Round = { tool: Tool; start: number; traces: Partial<Record<Letter, 'lit' | 'dim'>> }

function claudeRound(about: BoardFacts): Round | undefined {
  const brief = newest(about.brief.filter((b) => b.k === 'first' && b.role === 'verifier'))
  if (!brief) return undefined
  const traces: Round['traces'] = {}
  for (const f of about.review) if (f.sid === brief.sid && f.round === brief.at) traces[LETTER_OF[f.skill]] = 'lit'
  return { tool: 'C', start: brief.at, traces }
}

/** Reviewer task names as they appear: `standards_review`, older `standards`, re-rounds `standards_review_r1` and `r2_standards`. */
const STANDARDS = /^(?:r\d+_)?standards(?:_review)?(?:_r\d+)?$/
const SPEC = /^(?:r\d+_)?spec(?:_review)?(?:_r\d+)?$/

function codexRound(rollouts: readonly CodexRollout[]): Round | undefined {
  const r = rollouts.reduce<CodexRollout | undefined>((a, x) => (a === undefined || x.startedAt > a.startedAt ? x : a), undefined)
  if (!r?.review) return undefined
  const traces: Round['traces'] = {}
  for (const name of r.review.selected) {
    const skill = reviewSkill(name)
    if (skill) traces[LETTER_OF[skill]] = 'dim'
  }
  const { spawned } = r.review
  if (spawned.some((t) => STANDARDS.test(t)) && spawned.some((t) => SPEC.test(t))) traces.C = 'lit'
  return { tool: 'X', start: r.startedAt, traces }
}

/**
 * The Review cell. `codex` holds this ticket's verifier rollouts from Codex panes in the space;
 * `pr` is the row's PR; `verifier` its verifier pane, whose tool says n/a when no trace can exist.
 */
export function reviewCell(about: BoardFacts, codex: readonly CodexRollout[], pr: Pr | undefined, verifier: PaneCell): ReviewCell {
  const round = [claudeRound(about), codexRound(codex)].reduce<Round | undefined>((a, r) => (r !== undefined && (a === undefined || r.start > a.start) ? r : a), undefined)
  const verdict = newest(about.verdict)
  const isClaimed = verdict?.verdict === 'VERIFIED' && (round === undefined || verdict.at >= round.start)
  // A round that has run nothing yet and claims nothing still reads as dashes: thermo is not missed before anything ran.
  if (!isClaimed && Object.keys(round?.traces ?? {}).length === 0) return { k: 'none' }
  const tool = round?.tool ?? (verifier.k === 'live' ? verifier.tool : undefined)
  const rounds = about.brief.filter((b) => b.k === 'first' && b.role === 'verifier').length + codex.filter((r) => r.review).length
  // A verifier pane without the mod and with no rollout leaves no trace to read: every letter is n/a.
  const isBlind = round === undefined && tool !== undefined && tool !== 'C'
  const isDue = isThermoDue(pr)
  const light = (l: Letter): Light => {
    if (isBlind) return 'na'
    const seen = round?.traces[l]
    if (seen) return seen
    if (l === 'T') return isDue ? 'amber' : 'off'
    return isClaimed ? 'claimed' : 'off'
  }
  return { k: 'review', lights: { V: light('V'), C: light('C'), T: light('T'), D: light('D') }, round: rounds, tool }
}

/** The builder ran /verify-this under the brief it holds now: a fix round's brief asks for it again. */
export function selfChecked(about: BoardFacts): boolean {
  return about.self.some((f) => f.skill === 'verify-this' && about.brief.some((b) => b.sid === f.sid && b.at === f.round))
}

