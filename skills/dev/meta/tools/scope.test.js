const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { MAP, bind, allowedWrite, normalize } = require('./scope.js');

const THOVEN = path.join(os.homedir(), 'thoven');
const SCOPE = path.join(__dirname, 'scope.js');

test('no space binds a folder', () => {
  assert.deepEqual(MAP, {});
  assert.equal(bind('~Business'), null);
  assert.equal(bind('~Settings · parked'), null);
});

test('a write from any space is refused as unbound', () => {
  const r = allowedWrite('~Business', path.join(THOVEN, '.workspace/STATE.md'));
  assert.deepEqual(r, { ok: false, reason: 'unbound-space: ~Business' });
});

test('the CLI exits 1 for a former bind', () => {
  const r = spawnSync(process.execPath, [SCOPE, '~Business'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unbound-space: ~Business/);
});

test('normalize strips parked', () => {
  assert.equal(normalize('~Dashboard · parked'), '~Dashboard');
});
