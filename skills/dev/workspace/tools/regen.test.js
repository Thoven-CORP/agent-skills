// regen.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { regenerateMap } = require('./regen.js');

test('regenerateMap aggregates open items and excludes done items from the map', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  fs.writeFileSync(path.join(dir, 'TODO.md'),
    '# TODO\n## In Progress\n- [ ] Ship X <!-- id:td-1 type:todo status:open repo:frontend -->\n## Backlog\n- [x] Old thing <!-- id:td-2 type:todo status:done repo:backend -->\n');
  const out = regenerateMap({ storeDir: dir, registers: [{ file: 'TODO.md' }] });
  assert.match(out, /td-1 \[open\] Ship X \(frontend\)/);
  // A done item must NOT surface in the in-flight Map (context-bloat guard).
  assert.doesNotMatch(out, /td-2/);
  assert.doesNotMatch(out, /Old thing/);
});
test('regenerateMap ignores headings and blank lines', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  fs.writeFileSync(path.join(dir, 'TECH_DEBT.md'), '# TECH_DEBT\n\n## P1\n');
  const out = regenerateMap({ storeDir: dir, registers: [{ file: 'TECH_DEBT.md' }] });
  assert.strictEqual(out.trim(), '');
});

test('regenerateMap tiers In Progress vs Backlog and collapses improvements to themed counts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  fs.writeFileSync(path.join(dir, 'TODO.md'),
    '# TODO\n## In Progress\n- [ ] Build guardrail <!-- id:td-a type:todo status:open repo:frontend -->\n## Backlog\n- [ ] Later thing <!-- id:td-b type:todo status:open repo:backend -->\n');
  fs.writeFileSync(path.join(dir, 'FUTURE_IMPROVEMENTS.md'),
    '# FI\n- [ ] marketplace card polish <!-- id:fi-1 type:improvement status:open repo:frontend -->\n- [ ] u17 canvas autosave thrash <!-- id:fi-2 type:improvement status:open repo:frontend -->\n');
  const out = regenerateMap({ storeDir: dir, registers: [{ file: 'TODO.md' }, { file: 'FUTURE_IMPROVEMENTS.md' }] });
  // In-flight tier holds the In Progress todo; Queued holds the Backlog todo.
  assert.match(out, /🔵 In flight \(1\)[\s\S]*td-a \[open\] Build guardrail/);
  assert.match(out, /🟡 Queued \(1\)[\s\S]*td-b \[open\] Later thing/);
  // Improvements collapse to a themed count, NOT listed as rows.
  assert.match(out, /💡 Improvements \(2\)/);
  assert.match(out, /marketplace ·1/);
  assert.match(out, /u17\/tldraw ·1/);
  assert.doesNotMatch(out, /- fi-1/);
  assert.doesNotMatch(out, /- fi-2/);
});

test('long item text is truncated for the Map; the full text is not shown', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  const long = 'alpha '.repeat(40).trim(); // ~240 chars
  fs.writeFileSync(path.join(dir, 'TODO.md'),
    `# TODO\n## In Progress\n- [ ] ${long} <!-- id:td-x type:todo status:open repo:frontend -->\n`);
  const out = regenerateMap({ storeDir: dir, registers: [{ file: 'TODO.md' }] });
  assert.match(out, /td-x \[open\] alpha[\s\S]*…/); // truncated with ellipsis
  assert.ok(!out.includes(long)); // the full untruncated text never appears
});

test('parked items get 🚧 and sink below active items in their tier', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  fs.writeFileSync(path.join(dir, 'TODO.md'),
    '# TODO\n## In Progress\n- [ ] Redesign PAUSED brainstorm <!-- id:td-b type:todo status:open repo:frontend -->\n- [ ] Active work now <!-- id:td-a type:todo status:open repo:frontend -->\n');
  const out = regenerateMap({ storeDir: dir, registers: [{ file: 'TODO.md' }] });
  assert.match(out, /td-b \[open\] 🚧/); // parked item flagged
  const activeLine = out.split('\n').find((l) => l.includes('td-a'));
  assert.doesNotMatch(activeLine, /🚧/); // active item not flagged
  assert.ok(out.indexOf('td-a') < out.indexOf('td-b')); // active sorts above parked
});

test('an explicit group: field overrides the theme heuristic', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  fs.writeFileSync(path.join(dir, 'FUTURE_IMPROVEMENTS.md'),
    '# FI\n- [ ] marketplace card polish <!-- id:fi-1 type:improvement status:open group:billing repo:frontend -->\n');
  const out = regenerateMap({ storeDir: dir, registers: [{ file: 'FUTURE_IMPROVEMENTS.md' }] });
  // The heuristic would bucket this as "marketplace"; the explicit group: wins.
  assert.match(out, /billing ·1/);
  assert.doesNotMatch(out, /marketplace ·1/);
});

test('regenerateMap surfaces P1 tech-debt in Queued and collapses P2/P3 to a count', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  fs.writeFileSync(path.join(dir, 'TECH_DEBT.md'),
    '# TD\n- [ ] Broken availability validation <!-- id:dd-1 type:techdebt status:open P:P1 repo:backend -->\n- [ ] Dead component <!-- id:dd-2 type:techdebt status:open P:P3 repo:frontend -->\n');
  const out = regenerateMap({ storeDir: dir, registers: [{ file: 'TECH_DEBT.md' }] });
  assert.match(out, /🟡 Queued \(1\)[\s\S]*dd-1 \[P1\] Broken availability validation \(backend\)/);
  // P3 debt is a count, not a row.
  assert.match(out, /🔧 Tech-debt low-pri \(1\)/);
  assert.match(out, /P3 ·1/);
  assert.doesNotMatch(out, /- dd-2/);
});
