const { test } = require('node:test');
const assert = require('node:assert/strict');
const { preflight } = require('./session-preflight.js');

// THV-63 as the 2026-08-23 grill found it. Codex saw this and asked Q1 anyway.
const thv63AsFound = {
  identifier: 'THV-63',
  state: 'Todo',
  assignee: null,
  milestone: null,
  writesTo: 'thoven2.0/teacher-2.0/projects/00-onboarding/DESIGN_ONBOARDING.md',
  writesToExists: true,
};

const thv63Claimed = {
  identifier: 'THV-63',
  state: 'Speccing',
  assignee: 'Cursor',
  milestone: 'Design',
  writesTo: 'thoven2.0/teacher-2.0/projects/00-onboarding/DESIGN_ONBOARDING.md',
  writesToExists: true,
};

test('THV-63 as found is red on unclaimed, assignee, and milestone', () => {
  const r = preflight(thv63AsFound);
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.startsWith('unclaimed:')));
  assert.ok(r.failures.some((f) => f.startsWith('assignee:')));
  assert.ok(r.failures.some((f) => f.startsWith('milestone:')));
});

test('claimed Speccing issue with a resolving Writes to: is green', () => {
  const r = preflight(thv63Claimed);
  assert.equal(r.ok, true);
  assert.deepEqual(r.failures, []);
});

test('Ready with Writes to: is green — wrap-up is allowed', () => {
  const r = preflight({ ...thv63Claimed, state: 'Ready' });
  assert.equal(r.ok, true);
});

test('ghost Writes to: is red even when claimed', () => {
  const r = preflight({ ...thv63Claimed, writesToExists: false });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.startsWith('ghost-path:')));
});

test('Speccing with no Writes to: is red', () => {
  const r = preflight({
    identifier: 'THV-1',
    state: 'Speccing',
    assignee: 'Cursor',
    milestone: 'Build',
    writesTo: '',
  });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.startsWith('lane:')));
});

test('no issue at all is red', () => {
  const r = preflight(null);
  assert.equal(r.ok, false);
  assert.ok(r.failures[0].startsWith('no-issue:'));
});
