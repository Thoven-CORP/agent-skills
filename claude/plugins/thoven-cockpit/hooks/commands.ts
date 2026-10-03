// commands.ts: every process the cockpit can run, built here and only here.
//
// The spec's static gate forbids any process argv that merges. Rather than list what is banned,
// this module lists what is allowed: each entry below is one read-only subcommand, keyed by its
// own words, its flags are literals, and only its operands come from data. `mint` is not
// exported, so no other file can make an `Argv`, and register.ts runs nothing else.
// tests/gate.test.ts builds every entry and replays a session against this list.

import type { PaneId } from './model.ts'

declare const argvBrand: unique symbol
/** An argument list one of the entries below made. */
export type Argv = readonly string[] & { readonly [argvBrand]: true }

/** One process to run, and how long it may take. */
export type Req = { k: 'proc'; argv: Argv; timeoutMs: number }

function mint(timeoutMs: number, ...argv: string[]): Req {
  return { k: 'proc', argv: argv as readonly string[] as Argv, timeoutMs }
}

const HERDR_MS = 10_000
const GH_MS = 30_000

/** The fields every PR read asks for. `mergedAt` is a field name inside `--json`, not a verb. */
const PR_FIELDS = 'number,title,headRefName,state,statusCheckRollup,mergedAt,url,additions,deletions,files'
/** `owner/name`, starting with a letter or digit, so a repo operand can never read as a flag. */
const REPO = /^[A-Za-z0-9][\w.-]*\/[\w.-]+$/

export const COMMANDS = {
  /** ADR4: the whole session layout, every 5 s. */
  'herdr api snapshot': (): Req => mint(HERDR_MS, 'herdr', 'api', 'snapshot'),
  /** One pane's label, when the snapshot gave none. */
  'herdr pane get': (pane: PaneId): Req => mint(HERDR_MS, 'herdr', 'pane', 'get', pane),
  /** `f`: jump to a pane, the same as clicking it in the sidebar. */
  'herdr agent focus': (pane: PaneId): Req => mint(HERDR_MS, 'herdr', 'agent', 'focus', pane),
  /**
   * One repo's last 50 PRs every 60 s. `--state all` keeps merged PRs in view, which the Merge
   * event and the PRs tab need; gh's default lists open PRs only.
   */
  'gh pr list': (repo: string): Req => {
    if (!REPO.test(repo)) throw new Error(`not a GitHub repo: ${repo}`)
    return mint(GH_MS, 'gh', 'pr', 'list', '--repo', repo, '--state', 'all', '--json', PR_FIELDS, '--limit', '50')
  },
} as const

export type CommandName = keyof typeof COMMANDS
