// github.ts: gh's wire format in, gh commands out, and the repo each folder belongs to.
//
// `gh pr list --json` and `.git/config` text are read here and nowhere else. What leaves is a
// `Pr` or an `owner/name` string; no gh field name appears outside this file.

import { gh } from './commands.ts'
import { branchTicket, trailingTickets } from './dispatch.ts'
import type { Checks, Pr, Ticket } from './model.ts'
import type { Req } from './sources.ts'

export const FRONTEND = 'Thoven-CORP/frontend-remote'
export const BACKEND = 'Thoven-CORP/backend-remote'
/** Every space's PRs cover these, whatever folders its panes are in (synthesis A4). */
export const FIXED_REPOS: readonly string[] = [FRONTEND, BACKEND]

const TIMEOUT_MS = 30_000

export function prListReq(repo: string): Req {
  return { k: 'proc', argv: gh.prList(repo), timeoutMs: TIMEOUT_MS }
}

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

const STATES: ReadonlyArray<Pr['state']> = ['OPEN', 'MERGED', 'CLOSED']
/** CheckRun conclusions and StatusContext states that mean the check failed. */
const FAILED = new Set(['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE', 'ERROR'])

/** A PR title's tickets: its trailing group only. */
export function titleTickets(title: string): Ticket[] {
  return trailingTickets(title)?.tickets ?? []
}

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
  const state = STATES.find((s) => s === v.state)
  if (!title || !branch || !state) return undefined
  const trailing = trailingTickets(title)
  const files = Array.isArray(v.files) ? v.files.filter(isObj) : []
  const dirs = new Set(files.flatMap((f) => (str(f.path)?.includes('/') ? [(f.path as string).split('/')[0]] : [])))
  return {
    repo,
    number: v.number,
    title: trailing?.rest || title,
    branch,
    state,
    tickets: [...new Set([branchTicket(branch), ...(trailing?.tickets ?? [])].filter((t): t is Ticket => t !== undefined))],
    checks: checksOf(v.statusCheckRollup),
    changedLines: num(v.additions) + num(v.deletions),
    topDirs: dirs.size,
    url: str(v.url) ?? `https://github.com/${repo}/pull/${v.number}`,
  }
}

/** A CheckRun is done at `status: COMPLETED`; a StatusContext once its `state` leaves PENDING. */
function checksOf(rollup: unknown): Checks {
  const checks = Array.isArray(rollup) ? rollup.filter(isObj) : []
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
