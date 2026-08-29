const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { bind, allowedWrite, normalize } = require('./scope.js');

const THOVEN = path.join(os.homedir(), 'thoven');

test('space label binds to one Project folder', () => {
  const b = bind('~Business');
  assert.equal(b.folder, 'thoven2.0/teacher-2.0/projects/business');
  assert.equal(b.nowHeading, 'Teacher 2.0: Business');
});

test('parked suffix still binds', () => {
  assert.equal(bind('~Settings · parked').folder, 'thoven2.0/teacher-2.0/projects/settings');
});

test('unknown space is unbound', () => {
  assert.equal(bind('~Teacher2.0 · parked'), null);
});

test('Business Meta may write Project-local STATE', () => {
  const r = allowedWrite(
    '~Business',
    path.join(THOVEN, 'thoven2.0/teacher-2.0/projects/business/STATE.md'),
  );
  assert.equal(r.ok, true);
});

test('Business Meta may not write Settings', () => {
  const r = allowedWrite(
    '~Business',
    path.join(THOVEN, 'thoven2.0/teacher-2.0/projects/settings/STATE.md'),
  );
  assert.equal(r.ok, false);
  assert.ok(r.reason.startsWith('outside-bind:'));
});

test('STATE.md is allowed', () => {
  const r = allowedWrite('~Business', path.join(THOVEN, '.workspace/STATE.md'));
  assert.equal(r.ok, true);
  assert.equal(r.via, 'state');
});

test('normalize strips parked', () => {
  assert.equal(normalize('~Dashboard · parked'), '~Dashboard');
});
