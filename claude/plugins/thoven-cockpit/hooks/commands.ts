// commands.ts: every process the cockpit can run, built here and only here.
//
// The spec's static gate forbids any process argv that merges. Rather than list what is banned,
// this module lists what is allowed: each entry below is one read-only subcommand, keyed by its
// own words, its flags are literals, and only its operands come from data. `mint` and its symbol
// are not exported, so no other file can make a `Req`, and register.ts runs nothing else.
// tests/gate.test.ts builds every entry and replays a session against this list.

import type { LabelRecord } from './background.ts'
import type { PaneId } from './model.ts'

const minted: unique symbol = Symbol('minted')

/** One process to run, and how long it may take, as one of the entries below made it. */
export type Req = { readonly argv: readonly string[]; readonly timeoutMs: number; readonly [minted]: true }

function mint(timeoutMs: number, ...argv: string[]): Req {
  return { argv, timeoutMs, [minted]: true }
}

const HERDR_MS = 10_000
const GH_MS = 30_000

/** The fields every PR read asks for. */
const PR_FIELDS = 'number,title,headRefName,state,statusCheckRollup,url,additions,deletions,files'
/** `owner/name`, starting with a letter or digit, so a repo operand can never read as a flag. */
const REPO = /^[A-Za-z0-9][\w.-]*\/[\w.-]+$/
/** herdr's `w18:p8V`, starting with a letter or digit, so the pane operand can never read as a flag. */
const PANE = /^[A-Za-z0-9][\w:.-]*$/

export const COMMANDS = {
  /** ADR4: the whole session layout, every 5 s. `/cockpit` waits on it with a shorter timeout. */
  'herdr api snapshot': (timeoutMs: number = HERDR_MS): Req => mint(timeoutMs, 'herdr', 'api', 'snapshot'),
  /** One pane's label, when the snapshot gave none. */
  'herdr pane get': (pane: PaneId): Req => mint(HERDR_MS, 'herdr', 'pane', 'get', pane),
  /** `f`: jump to a pane, the same as clicking it in the sidebar. */
  'herdr agent focus': (pane: PaneId): Req => mint(HERDR_MS, 'herdr', 'agent', 'focus', pane),
  /**
   * ADR9: the cockpit's whole record for one pane, title and state labels together, under its own
   * source. herdr's parser wants the pane first and each value as the next word, and takes a value
   * that starts with `-` as text. Never `--display-agent`: thoven.workflow:verify owns the badge.
   */
  'herdr pane report-metadata': (pane: PaneId, record: LabelRecord): Req => {
    if (!PANE.test(pane)) throw new Error(`not a herdr pane: ${pane}`)
    const states = record.states.flatMap((s) => ['--state-label', `${s.status}=${s.text}`])
    return mint(HERDR_MS, 'herdr', 'pane', 'report-metadata', pane, '--source', 'cockpit', '--title', record.title, ...states)
  },
  /**
   * One repo's last 50 PRs every 60 s. `--state all` keeps merged PRs in view, which the Merge
   * event and the PRs tab need; gh's default lists open PRs only.
   */
  'gh pr list': (repo: string): Req => {
    if (!REPO.test(repo)) throw new Error(`not a GitHub repo: ${repo}`)
    return mint(GH_MS, 'gh', 'pr', 'list', '--repo', repo, '--state', 'all', '--json', PR_FIELDS, '--limit', '50')
  },
}

export type CommandName = keyof typeof COMMANDS
