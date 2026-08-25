const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { bind, allowedWrite, normalize } = require('./scope.js');

const THOVEN = path.join(os.homedir(), 'thoven');

test('space label binds to one folder', () => {
  const b = bind('~Dashboard');
  assert.equal(b.folder, 'thoven2.0/teacher-2.0/projects/02-dashboard');
  assert.equal(b.nowHeading, 'Teacher 2.0: Dashboard');
});

test('parked suffix still binds', () => {
  assert.equal(bind('~Onboarding · parked').folder, 'thoven2.0/teacher-2.0/projects/00-onboarding');
});

test('unknown space is unbound', () => {
  assert.equal(bind('~Teacher2.0 · parked'), null);
});

test('Dashboard Meta may write its DESIGN file', () => {
  const r = allowedWrite(
    '~Dashboard',
    path.join(THOVEN, 'thoven2.0/teacher-2.0/projects/02-dashboard/DESIGN_DASHBOARD.md'),
  );
  assert.equal(r.ok, true);
});

test('Dashboard Meta may not write Onboarding', () => {
  const r = allowedWrite(
    '~Dashboard',
    path.join(THOVEN, 'thoven2.0/teacher-2.0/projects/00-onboarding/DESIGN_ONBOARDING.md'),
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
