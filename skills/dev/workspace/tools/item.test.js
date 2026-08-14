// item.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { parseLine, serialize } = require('./item.js');

test('parseLine reads checkbox status + comment fields', () => {
  const r = parseLine('- [x] Fix X race <!-- id:td-a1 type:todo status:done links:pr-z git:fix/x -->');
  assert.strictEqual(r.text, 'Fix X race');
  assert.strictEqual(r.status, 'done');
  assert.strictEqual(r.fields.id, 'td-a1');
  assert.strictEqual(r.fields.links, 'pr-z');
});
test('parseLine returns null for a non-item line', () => {
  assert.strictEqual(parseLine('## Backlog'), null);
});
test('serialize is the inverse of parseLine (round-trip)', () => {
  const line = '- [ ] Email accountant <!-- id:td-b2 type:todo status:open links: git: -->';
  const r = parseLine(line);
  assert.strictEqual(serialize(r), line);
});
test('serialize forces status: in the comment to match the checkbox (no drift)', () => {
  // Inconsistent input: box says done, the field bag still says open.
  const line = serialize({ text: 'Ship X', status: 'done', fields: { id: 'td-c3', status: 'open' } });
  assert.match(line, /^- \[x\] Ship X/); // checkbox = done
  assert.match(line, /status:done/); // comment now agrees with the box
  assert.doesNotMatch(line, /status:open/); // the stale value is gone
});
test('parseLine tolerates a checkbox with no comment', () => {
  const r = parseLine('- [ ] Bare todo');
  assert.strictEqual(r.text, 'Bare todo');
  assert.deepStrictEqual(r.fields, {});
});
