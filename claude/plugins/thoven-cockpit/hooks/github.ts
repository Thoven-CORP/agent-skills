// github.ts: gh's wire format in, gh commands out. S2b unit 2 fills these in.

import type { Pr, Ticket } from './model.ts'

export const FRONTEND = 'Thoven-CORP/frontend-remote'
export const BACKEND = 'Thoven-CORP/backend-remote'

export function configPathOf(_headPath: string): string {
  return ''
}

export function parseOrigin(_config: string): string | undefined {
  return undefined
}

export function titleTickets(_title: string): Ticket[] {
  return []
}

export function parsePrList(_repo: string, _json: string): Pr[] | undefined {
  return undefined
}
