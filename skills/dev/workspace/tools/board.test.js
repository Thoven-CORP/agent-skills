const { test } = require('node:test');
const assert = require('node:assert');
const { boardEligible } = require('./board.js');

const mk = (type, extra = {}) => ({ text: 't', status: 'open', fields: { id: 'x', type, ...extra } });

test('todo/task/bug/prd are board-eligible', () => {
  for (const type of ['todo', 'task', 'bug', 'prd']) {
    assert.strictEqual(boardEligible(mk(type)), true, type);
  }
});
test('improvement is never board-eligible', () => {
  assert.strictEqual(boardEligible(mk('improvement')), false);
});
test('techdebt is eligible only at P0/P1', () => {
  assert.strictEqual(boardEligible(mk('techdebt', { P: 'P0' })), true);
  assert.strictEqual(boardEligible(mk('techdebt', { P: 'P1' })), true);
  assert.strictEqual(boardEligible(mk('techdebt', { P: 'P2' })), false);
  assert.strictEqual(boardEligible(mk('techdebt', { P: 'P3' })), false);
  assert.strictEqual(boardEligible(mk('techdebt', {})), false); // no P → not eligible
});
