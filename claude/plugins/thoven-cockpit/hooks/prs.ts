// prs.ts: which PRs belong to which rows, and the PRs tab.
//
// PRs attach to a row by branch, then by ticket (design: "branch ticket ∪ the title's trailing
// `(…)` group only"). A PR whose head branch is checked out in one of the row's folders (in the
// same repo, when the folder's origin is known) wins; else a PR whose `tickets` name the row's.
// Open beats merged beats closed. When panes of several tickets sit on that branch, each of their
// PR cells says `in #N`. The PRs tab lists each PR once, with the rows it attached to, plus
// ticketless PRs on a space folder's branch.

import { configPathOf } from './github.ts'
import type { Pane, PaneId, Pr, PrCell, PrGroup, RowIdentity, Ticket, World } from './model.ts'
import { valueOf } from './sources.ts'

/** A folder on a branch. `repo` is its origin, undefined until (or unless) its config names one. */
type Place = { repo: string | undefined; branch: string }

const STATE_RANK: Record<Pr['state'], number> = { OPEN: 0, MERGED: 1, CLOSED: 2 }
const best = (prs: readonly Pr[]): Pr | undefined => [...prs].sort((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state])[0]
const keyOf = (pr: Pr): string => `${pr.repo}#${pr.number}`
const isOn = (pr: Pr, places: readonly Place[]): boolean => places.some((p) => p.branch === pr.branch && (p.repo === undefined || p.repo === pr.repo))

/**
 * Where each row's panes are, and which PRs that ties to it. A stale gh source still joins on its
 * last answer; a gh that never answered joins nothing.
 */
export function prJoin(world: World, panes: readonly Pane[], rows: readonly RowIdentity[]) {
  const prs = valueOf(world.sources.github)?.prs ?? []
  const heads = valueOf(world.sources.heads)
  const branches = valueOf(world.sources.branches)
  const origins = valueOf(world.sources.origins)
  const placeOf = (cwd: string): Place[] => {
    const branch = branches?.get(cwd)
    const head = heads?.get(cwd)
    return branch === undefined ? [] : [{ repo: head === undefined ? undefined : origins?.get(configPathOf(head)), branch }]
  }
  // Main's own folder is its session cwd, which the snapshot may not show.
  const cwdOf = new Map<PaneId, string>([...panes.map((p): [PaneId, string] => [p.pane, p.cwd]), [world.me.pane, world.me.cwd]])
  const placesOf = (r: RowIdentity): Place[] =>
    [...(r.panes.k === 'live' ? r.panes.list : []), ...(r.verifierPane.k === 'live' ? [r.verifierPane] : [])].flatMap((c) => {
      const cwd = cwdOf.get(c.pane)
      return cwd === undefined ? [] : placeOf(cwd)
    })
  const places = new Map(rows.map((r) => [r.ticket, placesOf(r)]))

  const byBranch = (t: Ticket) => prs.filter((pr) => isOn(pr, places.get(t) ?? []))
  const byTicket = (t: Ticket) => prs.filter((pr) => pr.tickets.includes(t))
  const attached = (t: Ticket): Pr[] => [...new Set([...byBranch(t), ...byTicket(t)])]

  const cell = (t: Ticket): PrCell => {
    const onBranch = best(byBranch(t))
    if (onBranch) return rows.filter((r) => isOn(onBranch, places.get(r.ticket) ?? [])).length > 1 ? { k: 'shared', pr: onBranch } : { k: 'own', pr: onBranch }
    const named = best(byTicket(t))
    return named ? { k: 'own', pr: named } : { k: 'none' }
  }

  /** Each PR once, with the rows it attached to, plus ticketless PRs on any space folder's branch. */
  const groups = (): PrGroup[] => {
    const tickets = new Map<string, Ticket[]>()
    for (const r of rows) for (const pr of attached(r.ticket)) tickets.set(keyOf(pr), [...(tickets.get(keyOf(pr)) ?? []), r.ticket])
    const spacePlaces = [...cwdOf.values()].flatMap(placeOf)
    for (const pr of prs) if (pr.tickets.length === 0 && !tickets.has(keyOf(pr)) && isOn(pr, spacePlaces)) tickets.set(keyOf(pr), [])
    const out: PrGroup[] = []
    for (const pr of prs) {
      const ts = tickets.get(keyOf(pr))
      if (ts === undefined) continue
      let group = out.find((g) => g.repo === pr.repo)
      if (!group) {
        group = { repo: pr.repo, items: [] }
        out.push(group)
      }
      group.items.push({ pr, tickets: ts })
    }
    return out
  }

  return { cell, attached, groups }
}

/** The PR join for one tick: each row's PR cell, the PRs attached to a ticket, and the PRs tab. */
export type PrJoin = ReturnType<typeof prJoin>
