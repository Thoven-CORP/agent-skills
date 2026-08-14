// ids.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { mint, typeOf, PREFIXES } = require('./ids.js');

test('mint produces a type-prefixed id', () => {
  const id = mint('todo');
  assert.match(id, /^td-[a-z0-9]{4,}$/);
});
test('mint is unique across calls', () => {
  const ids = new Set(Array.from({ length: 500 }, () => mint('bug')));
  assert.strictEqual(ids.size, 500);
});
test('typeOf reads the birth-tag prefix', () => {
  assert.strictEqual(typeOf('tk-abcd'), 'task');
  assert.strictEqual(typeOf('nope'), null);
});
test('all 6 types have prefixes', () => {
  assert.deepStrictEqual(
    Object.keys(PREFIXES).sort(),
    ['bug', 'improvement', 'prd', 'task', 'techdebt', 'todo']
  );
});
