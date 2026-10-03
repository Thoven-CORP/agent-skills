// herdr.ts: herdr's wire format in. Nothing else in the plugin reads herdr JSON.
//
// Snapshot envelope (herdr 0.9.0, protocol 22): `.result.snapshot.{workspaces,tabs,panes}`.
// Panes carry `label` only sometimes, so a missing one is read with `herdr pane get` (ADR4).

import { PANE_STATUSES, isOneOf, isPaneId, isSessionId, isSpaceId, isTabId, type Pane, type PaneStatus, type SessionId, type Snapshot, type SpaceId, type TabId, type Tool } from './model.ts'

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

  const spaces = snap.workspaces.flatMap((w) => (isObj(w) && isSpaceId(w.workspace_id) ? [{ space: w.workspace_id, label: str(w.label) ?? w.workspace_id }] : []))
  const tabLabels = new Map<TabId, string | undefined>()
  for (const t of snap.tabs) if (isObj(t) && isTabId(t.tab_id)) tabLabels.set(t.tab_id, str(t.label))

  const panes = snap.panes.flatMap((p) => paneOf(p, tabLabels) ?? [])
  return { spaces, panes }
}

/** `herdr pane get` → the pane's label, when it has one. */
export function parsePaneLabel(json: string): string | undefined {
  const root = parseJson(json)
  return isObj(root) && isObj(root.result) ? paneOf(root.result.pane, new Map())?.paneLabel : undefined
}

/** One pane entry, as the snapshot and `herdr pane get` both give it. `tabLabels` names its tab. */
function paneOf(p: unknown, tabLabels: ReadonlyMap<TabId, string | undefined>): Pane | undefined {
  if (!isObj(p)) return undefined
  const { pane_id: pane, tab_id: tab, workspace_id: space } = p
  if (!isPaneId(pane) || !isTabId(tab) || !isSpaceId(space)) return undefined
  const agent = str(p.agent)
  const session = isObj(p.agent_session) ? p.agent_session.value : undefined
  return {
    pane,
    tab,
    space,
    sid: isSessionId(session) ? session : undefined,
    agent,
    tool: toolOf(agent),
    status: statusOf(str(p.agent_status)),
    cwd: str(p.foreground_cwd) ?? str(p.cwd) ?? '',
    paneLabel: str(p.label),
    tabLabel: tabLabels.get(tab),
    terminalTitle: str(p.terminal_title_stripped),
  }
}

const TOOLS: Readonly<Record<string, Tool>> = { claude: 'C', codex: 'X', devin: 'D', cursor: 'R' }

/** herdr `agent` → tool tag. `claude` C, `codex` X, `devin` D, `cursor` R; any other agent or a shell is undefined. */
function toolOf(agent: string | undefined): Tool | undefined {
  return agent === undefined ? undefined : TOOLS[agent]
}

/** herdr `agent_status`, with anything unknown as `unknown`. */
function statusOf(raw: string | undefined): PaneStatus {
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
  const space = pane === undefined ? undefined : /^([^:\s]+):[^:\s]+$/.exec(pane)?.[1]
  return isSpaceId(space) ? space : undefined
}
