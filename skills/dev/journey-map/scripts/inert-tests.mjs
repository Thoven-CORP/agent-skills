#!/usr/bin/env node
// Lists e2e tests that can never fail, so a journey that looks covered is not counted as covered.
// Usage: node inert-tests.mjs <spec file or directory>...
// Exit 0 clean, 1 findings, 2 nothing to scan (no arguments, or no spec files under them).
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SPEC_FILE = /\.(spec|test)\.[cm]?[jt]sx?$/
// Helpers a journey imports (a kit, a walk driver) can hold its assertions, so they are scanned too.
const SOURCE_FILE = /(?<!\.d)\.[cm]?[jt]sx?$/
const ASSERT = /\bexpect(?:\.soft)?\s*\(/
// A rejection handler that turns a failure into a value: .catch(() => {}), .catch(() => false), .catch(e => null)...
const SWALLOW = /\.catch\(\s*(?:\([^)]*\)|\w+)\s*=>\s*(?:\{\s*\}|undefined|null|false|true|void 0)\s*\)/
// The catch hangs off a matcher call (expect(x).not.toY(...), optionally .then(...)), not off a probe inside it.
const ASSERTION_CHAIN = /expect(?:\.soft)?\s*\([\s\S]*\)\s*\.\s*(?:not\s*\.\s*)?to\w+\s*\([\s\S]*\)\s*(?:\.\s*then\s*\([\s\S]*\)\s*)?$/
const STATEMENT_START = /^\s*(?:await\b|const\b|let\b|var\b|return\b|expect\b)/
const SKIPPED = /\b(?:test|it|describe)(?:\.describe)?\.(?:skip|fixme)\s*\(|\bx(?:it|describe)\s*\(/
const COMMENT_LINE = /^\s*(?:\/\/|\/?\*)/
const TEST_CALL = /\b(?:test|it)(?:\.only)?\s*\(/
const EMPTY_CATCH = /\bcatch\s*(?:\([^)]*\))?\s*\{\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*\}/g

function sourceFiles(arg) {
  const stat = statSync(arg)
  if (stat.isFile()) return SOURCE_FILE.test(arg) ? [arg] : []
  return readdirSync(arg, { withFileTypes: true }).flatMap((entry) =>
    entry.name === 'node_modules' ? [] : sourceFiles(join(arg, entry.name)),
  )
}

function swallowedAssertions(lines) {
  const found = []
  lines.forEach((line, i) => {
    const match = SWALLOW.exec(line)
    if (!match) return
    let start = i
    while (start > Math.max(0, i - 8) && !STATEMENT_START.test(lines[start])) start -= 1
    const before = [...lines.slice(start, i), line.slice(0, match.index)].join('\n')
    if (ASSERTION_CHAIN.test(before)) found.push({ line: i + 1, kind: 'swallowed-assertion' })
  })
  return found
}

// An assertion inside a try whose catch block is empty fails into nothing.
function assertionsInEmptyCatch(text) {
  const found = []
  for (const match of text.matchAll(EMPTY_CATCH)) {
    const head = text.slice(0, match.index)
    const close = head.lastIndexOf('}')
    let depth = 0
    let open = -1
    for (let k = close; k >= 0; k -= 1) {
      if (head[k] === '}') depth += 1
      if (head[k] === '{') depth -= 1
      if (depth === 0) { open = k; break }
    }
    if (open < 0 || !/\btry\s*$/.test(head.slice(0, open))) continue
    if (ASSERT.test(head.slice(open, close))) {
      found.push({ line: head.slice(0, open).split('\n').length, kind: 'assertion-in-empty-catch' })
    }
  }
  return found
}

export function scan(path, text) {
  const lines = text.split('\n')
  const findings = [
    ...swallowedAssertions(lines),
    ...assertionsInEmptyCatch(text),
    ...lines.flatMap((line, i) => (SKIPPED.test(line) && !COMMENT_LINE.test(line) ? [{ line: i + 1, kind: 'skipped' }] : [])),
  ]
  if (SPEC_FILE.test(path) && TEST_CALL.test(text) && !ASSERT.test(text)) findings.push({ line: 1, kind: 'no-expect-in-file' })
  return findings
    .sort((a, b) => a.line - b.line)
    .map((f) => ({ path, ...f, text: (lines[f.line - 1] ?? '').trim().slice(0, 160) }))
}

function main(args) {
  if (args.length === 0) {
    console.error('usage: node inert-tests.mjs <spec file or directory>...')
    return 2
  }
  const files = [...new Set(args.flatMap(sourceFiles))]
  const specs = files.filter((file) => SPEC_FILE.test(file))
  if (specs.length === 0) {
    console.error(`no spec files under: ${args.join(' ')}`)
    return 2
  }
  const findings = files.flatMap((file) => scan(file, readFileSync(file, 'utf8')))
  for (const f of findings) console.log(`${f.path}:${f.line}\t${f.kind}\t${f.text}`)
  console.log(`${findings.length} finding(s) in ${specs.length} spec file(s) and ${files.length - specs.length} helper(s)`)
  return findings.length === 0 ? 0 : 1
}

// Installed skills are symlinks, so compare real paths: run through a link, the script must still run.
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) process.exit(main(process.argv.slice(2)))
