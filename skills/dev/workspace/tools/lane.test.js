// tools/lane.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { laneFor } = require('./lane.js');

const item = (fields, status = 'open') => ({ text: 'x', status, fields });

test('done wins over everything (Dev Tracker)', () => {
  assert.strictEqual(laneFor(item({ type: 'todo', repo: 'backend', stage: 'Speccing' }, 'done'), 'in progress'), 'Published');
});
test('done bug → Fixed', () => {
  assert.strictEqual(laneFor(item({ type: 'bug' }, 'done'), ''), 'Fixed');
});
test('open backlog todo → Backlog', () => {
  assert.strictEqual(laneFor(item({ type: 'todo', repo: 'backend' }), 'backlog'), 'Backlog');
});
test('in-progress todo maps by repo', () => {
  assert.strictEqual(laneFor(item({ type: 'todo', repo: 'backend' }), 'in progress'), 'Backend dev');
  assert.strictEqual(laneFor(item({ type: 'task', repo: 'frontend' }), 'in progress'), 'Front end dev');
});
test('in-progress cross-stack (no repo) → Speccing', () => {
  assert.strictEqual(laneFor(item({ type: 'todo', repo: '' }), 'in progress'), 'Speccing');
});
test('stage: pin wins over derivation, dash form normalizes to canonical', () => {
  assert.strictEqual(laneFor(item({ type: 'todo', repo: 'backend', stage: 'Keri-testing' }), 'in progress'), 'Keri testing');
  assert.strictEqual(laneFor(item({ type: 'todo', stage: 'code-review/pr' }), 'backlog'), 'Code Review/PR');
});
test('unknown stage: value is ignored, falls through to derivation', () => {
  assert.strictEqual(laneFor(item({ type: 'todo', repo: 'backend', stage: 'Nonsense' }), 'in progress'), 'Backend dev');
});
test('open techdebt → Tech Debt lane regardless of section', () => {
  assert.strictEqual(laneFor(item({ type: 'techdebt', P: 'P0' }), ''), 'Tech Debt');
});
test('open bug: section + stage pin use Bug Log vocab', () => {
  assert.strictEqual(laneFor(item({ type: 'bug' }), ''), 'Reported');
  assert.strictEqual(laneFor(item({ type: 'bug' }), 'in progress'), 'In Progress');
  assert.strictEqual(laneFor(item({ type: 'bug', stage: 'in-triage' }), ''), 'In Triage');
});
test('prd has no ladder → null', () => {
  assert.strictEqual(laneFor(item({ type: 'prd' }), 'in progress'), null);
  assert.strictEqual(laneFor(item({ type: 'prd' }, 'done'), ''), null);
});
