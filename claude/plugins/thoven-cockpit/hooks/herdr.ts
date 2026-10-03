// herdr.ts: herdr's wire format in, herdr commands out. Nothing else in the plugin reads herdr JSON.
//
// Snapshot envelope (herdr 0.9.0, protocol 22): `.result.snapshot.{workspaces,tabs,panes}`.
// Panes carry `label` only sometimes, so a missing one is read with `herdr pane get` (ADR4).

import { herdr } from './commands.ts'
import { PANE_STATUSES, isOneOf, type Pane, type PaneId, type PaneStatus, type SessionId, type Snapshot, type SpaceId, type TabId, type Tool } from './model.ts'
import type { Req } from './sources.ts'

const TIMEOUT_MS = 10_000

type Json = Record<string, unknown>
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined)

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Undefined when the text is not a snapshot of a shape we know, which the pane shows as "herdr unavailable". */
export function parseSnapshot(json: string): Snapshot | undefined {
  const root = parseJson(json)
  const snap = isObj(root) && isObj(root.result) ? root.result.snapshot : undefined
  if (!isObj(snap) || !Array.isArray(snap.workspaces) || !Array.isArray(snap.tabs) || !Array.isArray(snap.panes)) return undefined

  const spaces = snap.workspaces.flatMap((w) => {
    const space = isObj(w) ? str(w.workspace_id) : undefined
    return isObj(w) && space ? [{ space: space as SpaceId, label: str(w.label) ?? space }] : []
  })
  const tabLabels = new Map<string, string | undefined>()
  for (const t of snap.tabs) if (isObj(t) && str(t.tab_id)) tabLabels.set(t.tab_id as string, str(t.label))

  const panes = snap.panes.flatMap((p): Pane[] => {
    if (!isObj(p)) return []
    const pane = str(p.pane_id)
    const tab = str(p.tab_id)
    const space = str(p.workspace_id)
    if (!pane || !tab || !space) return []
    const agent = str(p.agent)
    const session = isObj(p.agent_session) ? str(p.agent_session.value) : undefined
    return [
      {
        pane: pane as PaneId,
        tab: tab as TabId,
        space: space as SpaceId,
        sid: session as SessionId | undefined,
        agent,
        tool: toolOf(agent),
        status: statusOf(str(p.agent_status)),
        cwd: str(p.foreground_cwd) ?? str(p.cwd) ?? '',
        paneLabel: str(p.label),
        tabLabel: tabLabels.get(tab),
        terminalTitle: str(p.terminal_title_stripped),
      },
    ]
  })
  return { spaces, panes }
}

/** `herdr pane get` → the pane's label, when it has one. */
export function parsePaneLabel(json: string): string | undefined {
  const root = parseJson(json)
  const pane = isObj(root) && isObj(root.result) ? root.result.pane : undefined
  return isObj(pane) ? str(pane.label) : undefined
}

const TOOLS: Readonly<Record<string, Tool>> = { claude: 'C', codex: 'X', devin: 'D', cursor: 'R' }

/** herdr `agent` → tool tag. `claude` C, `codex` X, `devin` D, `cursor` R; any other agent or a shell is undefined. */
export function toolOf(agent: string | undefined): Tool | undefined {
  return agent === undefined ? undefined : TOOLS[agent]
}

/** herdr `agent_status`, with anything unknown as `unknown`. */
export function statusOf(raw: string | undefined): PaneStatus {
  return isOneOf(PANE_STATUSES)(raw) ? raw : 'unknown'
}

/** The pane this session runs in: HERDR_PANE_ID, else the pane whose agent_session is our sid. */
export function findMe(snapshot: Snapshot, envPane: string | undefined, sid: SessionId): Pane | undefined {
  return snapshot.panes.find((p) => p.pane === envPane) ?? snapshot.panes.find((p) => p.sid === sid)
}

/**
 * `w18:p8W` → `w18`: herdr 0.9.0 prefixes every pane id with its workspace id. Used only when the
 * snapshot cannot be read, so `/cockpit` can still claim and say "herdr unavailable".
 */
export function spaceOfPane(pane: string | undefined): SpaceId | undefined {
  const m = pane === undefined ? null : /^([^:\s]+):[^:\s]+$/.exec(pane)
  return m?.[1] as SpaceId | undefined
}

export function snapshotReq(): Req {
  return { k: 'proc', argv: herdr.snapshot(), timeoutMs: TIMEOUT_MS }
}

export function paneGetReq(pane: PaneId): Req {
  return { k: 'proc', argv: herdr.paneGet(pane), timeoutMs: TIMEOUT_MS }
}

/** `f`: jump to a pane, same as clicking it in the sidebar. */
export function focusReq(pane: PaneId): Req {
  return { k: 'proc', argv: herdr.agentFocus(pane), timeoutMs: TIMEOUT_MS }
}
