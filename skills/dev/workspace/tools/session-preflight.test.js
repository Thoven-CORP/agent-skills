const { test } = require('node:test');
const assert = require('node:assert/strict');
const { preflight } = require('./session-preflight.js');

// THV-63 as the 2026-08-23 grill found it. Codex saw this and asked Q1 anyway.
const thv63AsFound = {
  identifier: 'THV-63',
  state: 'Todo',
  assignee: null,
  milestone: null,
  writesTo: 'docs/Teacher_Onboarding_Tour/PRD.md',
  writesToExists: true,
};

const thv63Claimed = {
  identifier: 'THV-63',
  state: 'In Progress',
  assignee: 'Cursor',
  milestone: 'Design',
  writesTo: 'docs/Teacher_Onboarding_Tour/PRD.md',
  writesToExists: true,
};

test('THV-63 as found is red on unclaimed, assignee, and milestone', () => {
  const r = preflight(thv63AsFound);
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.startsWith('unclaimed:')));
  assert.ok(r.failures.some((f) => f.startsWith('assignee:')));
  assert.ok(r.failures.some((f) => f.startsWith('milestone:')));
});

test('claimed In Progress issue with a resolving Writes to: is green', () => {
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

test('retired Speccing lane with no Writes to: is red', () => {
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

test('retired Speccing lane with Writes to: is red', () => {
  const r = preflight({
    identifier: 'THV-63',
    state: 'Speccing',
    assignee: 'Cursor',
    milestone: 'Design',
    writesTo: 'docs/Teacher_Onboarding_Tour/PRD.md',
    writesToExists: true,
  });
  assert.equal(r.ok, false);
  assert.ok(r.failures.some((f) => f.startsWith('lane:')));
});

test('no issue at all is red', () => {
  const r = preflight(null);
  assert.equal(r.ok, false);
  assert.ok(r.failures[0].startsWith('no-issue:'));
});

test('a Linear issue destination is resolved by Linear, not local file existence', () => {
  const r = preflight({ ...thv63Claimed, writesTo: 'this ticket', writesToExists: false });
  assert.equal(r.ok, true);
});

test('a Linear document needs confirmed access', () => {
  const doc = { ...thv63Claimed, writesTo: 'https://linear.app/thoven/document/remote-plan-example', writesToExists: false };
  assert.equal(preflight(doc).ok, false);
  assert.equal(preflight({ ...doc, writesToExists: true }).ok, false);
  assert.equal(preflight({ ...doc, writesToAccessible: true }).ok, true);
  assert.equal(preflight({ ...doc, writesToExists: undefined }).ok, false);
});
