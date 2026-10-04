// doctor.ts: what `/cockpit doctor` reports, as data. view.ts's doctorText turns it into text.
//
// It reads and never writes: the store's cockpit keys with their ages, the claim on this
// session's space, each source's health when this session is main, and where the plugin loaded.
// A space with no Project has no Linear read (spec "Spaces"), so its Linear health says nothing.
// Which keys main deletes is expiry.ts's own rule over main's board. A session that is not main has
// no board, so every key past 14 days shows as deleted, a Linear key of a ticket on screen included.

import { claimOf } from './facts.ts'
import { ageOf, expiresByAge, ticketsOn, type Stored } from './expiry.ts'
import type { Board, Health, Ms, PaneId, SessionId, SpaceId, Ticket } from './model.ts'
import { isCockpitKey, parseFact } from './store.ts'

/** ADR2: the one folder `CLAUDE_CODE_PLUGIN_DIRS` should name, in the main checkout. */
export const mainCheckoutDir = (home: string): string => `${home}/thoven/agent-skills/claude/plugins/thoven-cockpit`

export type DoctorInput = {
  now: Ms
  stored: readonly Stored[]
  /** This session's space, from main's claim or HERDR_PANE_ID. */
  space: SpaceId | undefined
  pane: PaneId | undefined
  /** Main's last board; undefined in any session that is not main, because only main polls. */
  board: Pick<Board, 'health' | 'project' | 'build'> | undefined
  plugin: { root: string; env: string | undefined; home: string }
}

export type DoctorKey = { key: string; ageMs: Ms | undefined; isExpired: boolean; isReadable: boolean }

export type DoctorClaim =
  | { k: 'no-space' }
  | { k: 'unclaimed'; space: SpaceId }
  | { k: 'held'; space: SpaceId; pane: PaneId; sid: SessionId; ageMs: Ms; isMine: boolean }

export type DoctorReport = {
  /** Expired keys first, each group oldest first; a key with no age comes last. */
  keys: DoctorKey[]
  claim: DoctorClaim
  /** Undefined in any session that is not main. */
  sources: { health: Health; isLinearRead: boolean } | undefined
  plugin: { root: string; isMainCheckout: boolean; expected: string; env: string | undefined }
}

export function doctor(i: DoctorInput): DoctorReport {
  const cockpit = i.stored.filter((s) => isCockpitKey(s.key))
  const onBoard = i.board ? ticketsOn(i.board) : new Set<Ticket>()
  const keys = cockpit.map((s): DoctorKey => ({ key: s.key, ageMs: ageOf(s.value, i.now), isExpired: expiresByAge(s, i.now, onBoard), isReadable: parseFact(s.key, s.value) !== undefined }))
  keys.sort((a, b) => Number(b.isExpired) - Number(a.isExpired) || (b.ageMs ?? -Infinity) - (a.ageMs ?? -Infinity) || a.key.localeCompare(b.key))
  const facts = cockpit.flatMap(({ key, value }) => parseFact(key, value) ?? [])
  const expected = mainCheckoutDir(i.plugin.home)
  return {
    keys,
    claim: claimFor(i, facts),
    sources: i.board && { health: i.board.health, isLinearRead: i.board.project !== undefined },
    plugin: { root: i.plugin.root, isMainCheckout: i.plugin.root.replace(/\/+$/, '') === expected, expected, env: i.plugin.env },
  }
}

function claimFor(i: DoctorInput, facts: Parameters<typeof claimOf>[0]): DoctorClaim {
  if (i.space === undefined) return { k: 'no-space' }
  const claim = claimOf(facts, i.space)
  if (!claim) return { k: 'unclaimed', space: i.space }
  return { k: 'held', space: i.space, pane: claim.pane, sid: claim.sid, ageMs: i.now - claim.at, isMine: claim.pane === i.pane }
}
