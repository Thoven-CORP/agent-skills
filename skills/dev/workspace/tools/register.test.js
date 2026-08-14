// register.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { insertUnderSection, insertItem } = require('./register.js');

const LINE = '- [ ] New thing <!-- id:td-x type:todo status:open -->';

test('insertUnderSection inserts under the FIRST matching section (priority order)', () => {
  const src = '# TODO\n\n## Backlog\n\n- [ ] old-bk <!-- id:td-bk -->\n\n## In Progress\n\n- [ ] old-ip <!-- id:td-ip -->\n';
  const out = insertUnderSection(src, ['Backlog', 'In Progress'], LINE);
  // Landed under Backlog, not In Progress.
  assert.ok(out.indexOf(LINE) > out.indexOf('## Backlog'));
  assert.ok(out.indexOf(LINE) < out.indexOf('## In Progress'));
});

test('insertUnderSection falls back to the next section when the first is absent', () => {
  const src = '# TODO\n\n## In Progress\n\n- [ ] old-ip <!-- id:td-ip -->\n';
  const out = insertUnderSection(src, ['Backlog', 'In Progress'], LINE);
  assert.ok(out.includes(LINE));
  assert.ok(out.indexOf(LINE) > out.indexOf('## In Progress'));
});

test('insertUnderSection THROWS when no section matches (no silent drop — the bug this replaces)', () => {
  const src = '# TODO\n\n## Someday\n\n- [ ] x <!-- id:td-z -->\n';
  assert.throws(
    () => insertUnderSection(src, ['Backlog', 'In Progress'], LINE),
    /no matching section/,
  );
});

test('insertUnderSection preserves the header and pre-existing items', () => {
  const src = '# TODO\n\n## In Progress\n\n- [ ] keep-me <!-- id:td-keep -->\n';
  const out = insertUnderSection(src, ['In Progress'], LINE);
  assert.match(out, /## In Progress/);        // header intact (not clobbered)
  assert.match(out, /keep-me/);                // existing item intact
  assert.ok(out.includes(LINE));              // new line present
});

test('insertUnderSection inserts at the TOP of the section (newest-first)', () => {
  const src = '# TODO\n\n## In Progress\n\n- [ ] existing <!-- id:td-e -->\n';
  const out = insertUnderSection(src, ['In Progress'], LINE);
  assert.ok(out.indexOf(LINE) < out.indexOf('- [ ] existing'));
});

test('insertItem round-trips through a file (read -> insert -> write)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-reg-'));
  const p = path.join(dir, 'TODO.md');
  fs.writeFileSync(p, '# TODO\n\n## In Progress\n\n- [ ] existing <!-- id:td-e -->\n');
  const returned = insertItem(p, ['Backlog', 'In Progress'], LINE);
  const onDisk = fs.readFileSync(p, 'utf8');
  assert.strictEqual(returned, onDisk);        // returns exactly what it wrote
  assert.ok(onDisk.includes(LINE));            // persisted
  assert.match(onDisk, /existing/);            // didn't drop existing content
});

test('insertItem throws (and writes nothing) when the file has no usable section', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-reg-'));
  const p = path.join(dir, 'TODO.md');
  const before = '# TODO\n\n## Someday\n';
  fs.writeFileSync(p, before);
  assert.throws(() => insertItem(p, ['Backlog', 'In Progress'], LINE), /no matching section/);
  assert.strictEqual(fs.readFileSync(p, 'utf8'), before); // untouched on failure
});
