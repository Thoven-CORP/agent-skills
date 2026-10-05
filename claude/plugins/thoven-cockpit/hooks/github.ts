// github.ts: gh's wire format in, and the repo each folder belongs to.
//
// `gh pr list --json` and `.git/config` text are read here and nowhere else. What leaves is a
// `Pr` or an `owner/name` string; no gh field name appears outside this file.

import { branchTicket, trailingTickets } from './dispatch.ts'
import { PR_STATES, isOneOf, type Checks, type Pr, type Ticket } from './model.ts'

export const FRONTEND = 'Thoven-CORP/frontend-remote'
export const BACKEND = 'Thoven-CORP/backend-remote'
export const AGENT_SKILLS = 'Thoven-CORP/agent-skills'
/** Every space's PRs cover these, whatever folders its panes are in (synthesis A4). */
export const FIXED_REPOS: readonly string[] = [FRONTEND, BACKEND]

// ── .git/config ──────────────────────────────────────────────────────────────────────────────

/**
 * The config beside a HEAD file. A worktree's gitdir is `<repo>/.git/worktrees/<name>` and holds
 * no remotes; they live in the common `<repo>/.git/config`.
 */
export function configPathOf(headPath: string): string {
  const gitdir = headPath.replace(/\/HEAD$/, '')
  return `${/^(.*)\/worktrees\/[^/]+$/.exec(gitdir)?.[1] ?? gitdir}/config`
}

/** `[remote "origin"]`'s GitHub URL as `owner/name`. Other remotes, and an origin off GitHub, name no repo. */
export function parseOrigin(config: string): string | undefined {
  let isOrigin = false
  for (const line of config.split('\n')) {
    const section = /^\s*\[(.+)\]\s*$/.exec(line)
    if (section) {
      isOrigin = /^remote\s+"origin"$/.test(section[1] ?? '')
      continue
    }
    const url = isOrigin ? /^\s*url\s*=\s*(\S+)\s*$/.exec(line)?.[1] : undefined
    if (url) return /github\.com[:/]([A-Za-z0-9][\w.-]*\/[\w.-]+?)(?:\.git)?\/?$/.exec(url)?.[1]
  }
  return undefined
}

// ── gh pr list ───────────────────────────────────────────────────────────────────────────────

type Json = Record<string, unknown>
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined)
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

const isPrState = isOneOf(PR_STATES)
/** CheckRun conclusions and StatusContext states that mean the check failed. */
const FAILED = new Set(['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE', 'ERROR'])

/** Undefined when the text is not a PR list (an error body, a shape change), which marks gh stale. */
export function parsePrList(repo: string, json: string): Pr[] | undefined {
  let root: unknown
  try {
    root = JSON.parse(json)
  } catch {
    return undefined
  }
  return Array.isArray(root) ? root.flatMap((v) => prOf(repo, v) ?? []) : undefined
}

function prOf(repo: string, v: unknown): Pr | undefined {
  if (!isObj(v) || typeof v.number !== 'number') return undefined
  const title = str(v.title)
  const branch = str(v.headRefName)
  const state = isPrState(v.state) ? v.state : undefined
  if (!title || !branch || !state) return undefined
  const trailing = trailingTickets(title)
  const files = Array.isArray(v.files) ? v.files.filter(isObj) : []
  const dirs = new Set(files.flatMap((f) => {
    const path = str(f.path)
    return path?.includes('/') ? [path.split('/')[0]] : []
  }))
  return {
    repo,
    number: v.number,
    title: trailing?.rest || title,
    branch,
    base: str(v.baseRefName) ?? 'main',
    state,
    tickets: [...new Set([branchTicket(branch), ...(trailing?.tickets ?? [])].filter((t): t is Ticket => t !== undefined))],
    checks: checksOf(v.statusCheckRollup),
    changedLines: num(v.additions) + num(v.deletions),
    topDirs: dirs.size,
    url: str(v.url) ?? `https://github.com/${repo}/pull/${v.number}`,
  }
}

/** CheckRun conclusions of a check that ran no CI: Cursor's bot agents end NEUTRAL, a job its condition skipped ends SKIPPED. */
const NO_CI = new Set(['NEUTRAL', 'SKIPPED'])

/**
 * A CheckRun is done at `status: COMPLETED`; a StatusContext once its `state` leaves PENDING. A PR
 * whose every check is a CheckRun that ran no CI has no checks, so its CI cell reads `–`, not ✓.
 */
function checksOf(rollup: unknown): Checks {
  const all = Array.isArray(rollup) ? rollup.filter(isObj) : []
  const checks = all.every((c) => c.__typename !== 'StatusContext' && c.status === 'COMPLETED' && NO_CI.has(String(c.conclusion))) ? [] : all
  const failed: string[] = []
  const running: string[] = []
  for (const c of checks) {
    const isContext = c.__typename === 'StatusContext'
    const name = str(isContext ? c.context : c.name) ?? '(unnamed)'
    const isDone = isContext ? c.state !== 'PENDING' && c.state !== 'EXPECTED' : c.status === 'COMPLETED'
    if (!isDone) running.push(name)
    else if (FAILED.has(String(isContext ? c.state : c.conclusion))) failed.push(name)
  }
  return { total: checks.length, done: checks.length - running.length, failed, running }
}
