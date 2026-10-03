// commands.ts: every argv the cockpit can run, built here and only here.
//
// The spec's static gate forbids any process argv that merges. Rather than list what is banned,
// this module lists what is allowed: each builder below is one read-only subcommand, its flags
// are literals, and only its operands come from data. `mint` is not exported, so no other file
// can make an `Argv`, and `perform` in register.ts takes nothing else. tests/gate.test.ts replays
// a session and checks every argv it ran against this list.

import type { PaneId } from './model.ts'

declare const argvBrand: unique symbol
/** An argument list one of the builders below made. */
export type Argv = readonly string[] & { readonly [argvBrand]: true }

function mint(...argv: string[]): Argv {
  return argv as readonly string[] as Argv
}

export const herdr = {
  /** ADR4: the whole session layout, every 5 s. */
  snapshot: (): Argv => mint('herdr', 'api', 'snapshot'),
  /** One pane's label, when the snapshot gave none. */
  paneGet: (pane: PaneId): Argv => mint('herdr', 'pane', 'get', pane),
  /** `f`: jump to a pane, the same as clicking it in the sidebar. */
  agentFocus: (pane: PaneId): Argv => mint('herdr', 'agent', 'focus', pane),
} as const
