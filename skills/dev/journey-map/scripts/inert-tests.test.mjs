import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SCRIPT = fileURLToPath(new URL('./inert-tests.mjs', import.meta.url))
const SCRIPTS = fileURLToPath(new URL('.', import.meta.url))
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' })

function specDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'inert-tests-'))
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body)
  return dir
}

test('refuses to call an empty input clean', () => {
  assert.equal(run().status, 2)
  const empty = mkdtempSync(join(tmpdir(), 'inert-tests-'))
  mkdirSync(join(empty, 'helpers'))
  writeFileSync(join(empty, 'helpers', 'kit.ts'), 'export const a = 1\n')
  const result = run(empty)
  assert.equal(result.status, 2)
  assert.match(result.stderr, /no spec files/)
})

test('flags an assertion whose failure a catch swallows (THV-2003 j1 line 76)', () => {
  const dir = specDir({
    'j1.spec.ts': [
      "test('j1', async ({ page }) => {",
      "  await expect(title).not.toHaveText(faces.at(-1)!, { timeout: 10_000 }).catch(() => {})",
      '  await expect(saveBtn)',
      '    .toBeEnabled({ timeout: 10_000 })',
      '    .then(() => true)',
      '    .catch(() => false)',
      '})',
    ].join('\n'),
  })
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stdout, /j1\.spec\.ts:2\tswallowed-assertion/)
  assert.match(result.stdout, /j1\.spec\.ts:6\tswallowed-assertion/)
})

test('leaves a swallowed probe inside a retried assertion alone', () => {
  const dir = specDir({
    'probe.spec.ts': [
      "test('probe', async ({ page }) => {",
      '  await expect(async () => { if (!(await email.isVisible().catch(() => false))) await open(); await email.waitFor() }).toPass()',
      "  await page.waitForURL(/dashboard/).catch(() => {})",
      '  await expect(card).toBeVisible()',
      '})',
    ].join('\n'),
  })
  const result = run(dir)
  assert.equal(result.status, 0, result.stdout)
})

test('flags an assertion inside a try with an empty catch, a skipped test, a test file with no expect, and a swallowed assertion in a helper', () => {
  const dir = specDir({
    'try.spec.ts': [
      "test('try', async () => {",
      '  try {',
      '    await expect(row).toBeVisible()',
      '  } catch { /* fine */ }',
      '  try { JSON.parse(body) } catch {}',
      '})',
      "test.skip('later', async () => { expect(1).toBe(1) })",
      '// test.skip() inside a try throws, so the skip sits outside it',
    ].join('\n'),
    'walk.spec.ts': "test('walk', async ({ page }) => { await page.goto('/') })\n",
    'kit.ts': "export async function seen(page) {\n  await expect(page.getByRole('dialog')).toHaveCount(0).catch(() => {})\n}\n",
  })
  const result = run(dir)
  assert.equal(result.status, 1)
  assert.match(result.stdout, /try\.spec\.ts:2\tassertion-in-empty-catch/)
  assert.doesNotMatch(result.stdout, /try\.spec\.ts:(5|8)\t/)
  assert.match(result.stdout, /try\.spec\.ts:7\tskipped/)
  assert.match(result.stdout, /walk\.spec\.ts:1\tno-expect-in-file/)
  assert.match(result.stdout, /kit\.ts:2\tswallowed-assertion/)
  assert.doesNotMatch(result.stdout, /kit\.ts:\d+\tno-expect-in-file/)
})

test('runs through a symlinked install and reports, never exits silently clean', () => {
  const home = mkdtempSync(join(tmpdir(), 'inert-tests-link-'))
  symlinkSync(SCRIPTS, join(home, 'scripts'))
  const dir = specDir({ 'j1.spec.ts': "test('j1', async () => {\n  await expect(title).toHaveText('x').catch(() => {})\n})\n" })
  const result = spawnSync(process.execPath, [join(home, 'scripts', 'inert-tests.mjs'), dir], { encoding: 'utf8' })
  assert.equal(result.status, 1, result.stderr)
  assert.match(result.stdout, /j1\.spec\.ts:2\tswallowed-assertion/)
  assert.match(result.stdout, /1 finding\(s\) in 1 spec file/)
})
