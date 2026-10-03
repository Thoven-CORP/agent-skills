// codex.ts: Codex's rollout format in. Nothing else in the plugin reads `~/.codex/sessions`.
//
// A rollout is JSONL: a `session_meta` line (cwd, start time), then `response_item` lines. What a
// verifier's Review cell can use, measured on real rollouts in S0 (spike RESULTS.md section 10):
//   - its first user message is the verifier brief (`$poteto-mode Verify THV-n …`); the injected
//     AGENTS.md, environment and `<skill>` blocks come before or beside it and are skipped
//   - `function_call` `spawn_agent` with `arguments.task_name` is a reviewer that was started
//   - a user message whose `content_item_kinds` holds `skills.selected_skill_instructions` and
//     whose text opens `<skill>\n<name>NAME</name>` is a skill that was only selected, not proof it ran

import { briefOf } from './dispatch.ts'
import type { CodexReview, CodexRollout, Ms } from './model.ts'
import type { Ask } from './sources.ts'

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

const SELECTED = 'skills.selected_skill_instructions'
const SKILL_NAME = /^<skill>\s*<name>([^<]+)<\/name>/

/** A user message's text blocks, joined, and its content kinds. */
function userMessage(payload: Json): { text: string; kinds: unknown[] } | undefined {
  if (payload.type !== 'message' || payload.role !== 'user' || !Array.isArray(payload.content)) return undefined
  const text = payload.content.map((c) => (isObj(c) ? (str(c.text) ?? '') : '')).join('')
  const meta = payload.internal_chat_message_metadata_passthrough
  return { text, kinds: isObj(meta) && Array.isArray(meta.content_item_kinds) ? meta.content_item_kinds : [] }
}

/** Undefined when the text has no `session_meta` with a cwd and a start time. */
export function parseRollout(file: string, at: Ms, text: string): CodexRollout | undefined {
  let cwd: string | undefined
  let startedAt: number | undefined
  let first: string | undefined
  const spawned: string[] = []
  const selected: string[] = []
  for (const line of text.split('\n')) {
    const row = line.trim() === '' ? undefined : parseJson(line)
    if (!isObj(row) || !isObj(row.payload)) continue
    const p = row.payload
    if (row.type === 'session_meta') {
      cwd = str(p.cwd)
      startedAt = Date.parse(str(p.timestamp) ?? '')
      continue
    }
    if (row.type !== 'response_item') continue
    if (p.type === 'function_call' && p.name === 'spawn_agent') {
      const args = parseJson(str(p.arguments) ?? '')
      const task = isObj(args) ? str(args.task_name) : undefined
      if (task) spawned.push(task)
      continue
    }
    const msg = userMessage(p)
    if (!msg) continue
    const skill = msg.kinds.includes(SELECTED) ? SKILL_NAME.exec(msg.text)?.[1]?.trim() : undefined
    if (skill) selected.push(skill)
    else if (first === undefined && !/^\s*(?:<|# AGENTS\.md)/.test(msg.text)) first = msg.text
  }
  if (cwd === undefined || startedAt === undefined || !Number.isFinite(startedAt)) return undefined
  const brief = first === undefined ? undefined : briefOf(first)
  const review: CodexReview | undefined = brief?.k === 'first' && brief.role === 'verifier' ? { ticket: brief.ticket, spawned, selected } : undefined
  return { file, at, cwd, startedAt, review }
}

/** How many of the newest day folders (`YYYY/MM/DD`) are read: the spec's 2-day window, plus the day it began on. */
const DAYS = 3
const ROLLOUT = /^rollout-.*\.jsonl$/

/** Entries of `dir` named by `pattern`, newest name first. A folder that cannot be listed has none. */
async function newestNamed(ask: Ask, dir: string, pattern: RegExp, kind: string): Promise<string[]> {
  const listing = await ask.list(dir).catch(() => [])
  return listing.filter((e) => e.kind === kind && pattern.test(e.name)).map((e) => e.name).sort().reverse()
}

/** The newest DAYS day folders under `root`, newest first. */
async function dayFolders(ask: Ask, root: string): Promise<string[]> {
  const days: string[] = []
  for (const year of await newestNamed(ask, root, /^\d{4}$/, 'dir')) {
    for (const month of await newestNamed(ask, `${root}/${year}`, /^\d{2}$/, 'dir')) {
      for (const day of await newestNamed(ask, `${root}/${year}/${month}`, /^\d{2}$/, 'dir')) {
        days.push(`${root}/${year}/${month}/${day}`)
        if (days.length === DAYS) return days
      }
    }
  }
  return days
}

/**
 * The rollouts of the newest day folders. An unchanged file keeps its last read, so a rollout is
 * read again only while it grows; one that cannot be read (over `$.fs.read`'s 4 MiB) is skipped.
 * Which rollouts belong to which pane, and the 2-day window, are board.ts's to decide.
 */
export async function readRollouts(ask: Ask, home: string, known: readonly CodexRollout[]): Promise<CodexRollout[]> {
  const out: CodexRollout[] = []
  for (const day of await dayFolders(ask, `${home}/.codex/sessions`)) {
    const listing = await ask.list(day).catch(() => [])
    const read = await Promise.all(listing.filter((e) => e.kind === 'file' && ROLLOUT.test(e.name)).map(async (e) => {
      const file = `${day}/${e.name}`
      const kept = known.find((r) => r.file === file && r.at === e.mtimeMs)
      if (kept) return kept
      const text = await ask.read(file).catch(() => undefined)
      return text === undefined ? undefined : parseRollout(file, e.mtimeMs, text)
    }))
    for (const r of read) if (r) out.push(r)
  }
  return out
}
