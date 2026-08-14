// tools/sync.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { cardTitle } = require('./sync.js');

test('cardTitle passes short text through unchanged', () => {
  assert.strictEqual(cardTitle('Ship X'), 'Ship X');
});
test('cardTitle truncates long text at a word boundary with an ellipsis', () => {
  const long = 'Track B: GCS-native transcode via Eventarc to Cloud Transcoder API to a single H.264 AAC MP4 output';
  const t = cardTitle(long);
  assert.ok(t.length <= 82, `title too long: ${t.length}`);
  assert.match(t, /…$/);
  assert.ok(!t.slice(0, -1).endsWith(' ')); // trimmed before the ellipsis
  assert.ok(long.startsWith(t.slice(0, -1))); // it's a genuine prefix of the original
});
test('cardTitle handles empty/undefined text', () => {
  assert.strictEqual(cardTitle(''), '');
  assert.strictEqual(cardTitle(undefined), '');
});
const { syncMark, pendingSync } = require('./sync.js');

function tmpStore(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
  return dir;
}
const registers = [{ file: 'TODO.md' }];
const DATE = '2026-07-15';

test('syncMark is deterministic and space-free', () => {
  const a = syncMark({ date: '2026-07-15', title: 'Ship X', status: 'open', boardStatus: 'Backlog' });
  const b = syncMark({ date: '2026-07-15', title: 'Ship X', status: 'open', boardStatus: 'Backlog' });
  assert.strictEqual(a, b);
  assert.doesNotMatch(a, /\s/); // no spaces — safe as a field value
  assert.match(a, /^2026-07-15:/);
});
test('syncMark changes when any of title/status/boardStatus changes', () => {
  const base = syncMark({ date: '2026-07-15', title: 'Ship X', status: 'open', boardStatus: 'Backlog' });
  assert.notStrictEqual(base, syncMark({ date: '2026-07-15', title: 'Ship Y', status: 'open', boardStatus: 'Backlog' }));
  assert.notStrictEqual(base, syncMark({ date: '2026-07-15', title: 'Ship X', status: 'done', boardStatus: 'Backlog' }));
  assert.notStrictEqual(base, syncMark({ date: '2026-07-15', title: 'Ship X', status: 'open', boardStatus: 'Published' }));
});
test('board-eligible item with no notion ref → create', () => {
  const dir = tmpStore({ 'TODO.md': '## Backlog\n- [ ] Ship X <!-- id:td-1 type:todo status:open links: git: repo:backend last-synced: -->\n' });
  const work = pendingSync({ storeDir: dir, registers, date: DATE });
  assert.strictEqual(work.length, 1);
  assert.strictEqual(work[0].id, 'td-1');
  assert.strictEqual(work[0].action, 'create');
  assert.strictEqual(work[0].targetStatus, 'Backlog');
});
test('improvement is never in the worklist', () => {
  const dir = tmpStore({ 'TODO.md': '## Backlog\n- [ ] Nice idea <!-- id:fi-1 type:improvement status:open links: git: repo: last-synced: -->\n' });
  assert.strictEqual(pendingSync({ storeDir: dir, registers, date: DATE }).length, 0);
});
test('promoted item, closed since last sync → update to Published', () => {
  // notion ref present, box now done, last-synced base was the OPEN state.
  const dir = tmpStore({ 'TODO.md': '## Backlog\n- [x] Ship X <!-- id:td-2 type:todo status:done links: git: repo:backend notion:abc last-synced:2026-07-01:deadbeef -->\n' });
  const work = pendingSync({ storeDir: dir, registers, date: DATE });
  assert.strictEqual(work.length, 1);
  assert.strictEqual(work[0].action, 'update');
  assert.strictEqual(work[0].targetStatus, 'Published');
});
test('promoted item already in sync → omitted', () => {
  const mark = syncMark({ date: '2026-07-01', title: 'Ship X', status: 'open', boardStatus: 'Backlog' });
  const dir = tmpStore({ 'TODO.md': `## Backlog\n- [ ] Ship X <!-- id:td-3 type:todo status:open links: git: repo:backend notion:abc last-synced:${mark} -->\n` });
  assert.strictEqual(pendingSync({ storeDir: dir, registers, date: DATE }).length, 0);
});
test('item moved to ## In Progress → lane update fires (backend → Backend dev)', () => {
  // base was stamped while the item sat in Backlog; the section move makes it dirty.
  const mark = syncMark({ date: '2026-07-01', title: 'Ship X', status: 'open', boardStatus: 'Backlog' });
  const dir = tmpStore({ 'TODO.md': `## In Progress\n- [ ] Ship X <!-- id:td-4 type:todo status:open links: git: repo:backend notion:abc last-synced:${mark} -->\n\n## Backlog\n` });
  const work = pendingSync({ storeDir: dir, registers, date: DATE });
  assert.strictEqual(work.length, 1);
  assert.strictEqual(work[0].action, 'update');
  assert.strictEqual(work[0].targetStatus, 'Backend dev');
});
test('in-progress item already stamped at its lane → clean, drag-safe', () => {
  const mark = syncMark({ date: '2026-07-01', title: 'Ship X', status: 'open', boardStatus: 'Backend dev' });
  const dir = tmpStore({ 'TODO.md': `## In Progress\n- [ ] Ship X <!-- id:td-5 type:todo status:open links: git: repo:backend notion:abc last-synced:${mark} -->\n\n## Backlog\n` });
  assert.strictEqual(pendingSync({ storeDir: dir, registers, date: DATE }).length, 0);
});
test('create lands straight in its real lane, not Backlog', () => {
  const dir = tmpStore({ 'TODO.md': '## In Progress\n- [ ] Ship X <!-- id:td-6 type:todo status:open links: git: repo:frontend last-synced: -->\n\n## Backlog\n' });
  const work = pendingSync({ storeDir: dir, registers, date: DATE });
  assert.strictEqual(work.length, 1);
  assert.strictEqual(work[0].action, 'create');
  assert.strictEqual(work[0].targetStatus, 'Front end dev');
});
test('stage: pin overrides the derived lane', () => {
  const dir = tmpStore({ 'TODO.md': '## Backlog\n- [ ] Ship X <!-- id:td-7 type:todo status:open links: git: repo:backend stage:Speccing last-synced: -->\n' });
  const work = pendingSync({ storeDir: dir, registers, date: DATE });
  assert.strictEqual(work[0].targetStatus, 'Speccing');
});
test('open P0 techdebt → Tech Debt lane, routed to dev-tracker', () => {
  const dir = tmpStore({ 'TODO.md': '', 'TECH_DEBT.md': '- [ ] Fix N+1 <!-- id:dd-1 type:techdebt status:open P:P0 links: git: repo:backend last-synced: -->\n' });
  const work = pendingSync({ storeDir: dir, registers: [{ file: 'TODO.md' }, { file: 'TECH_DEBT.md' }], date: DATE });
  assert.strictEqual(work.length, 1);
  assert.strictEqual(work[0].targetStatus, 'Tech Debt');
  assert.strictEqual(work[0].board, 'dev-tracker');
});
test('done bug → Fixed on the bug-log board', () => {
  const dir = tmpStore({ 'TECH_DEBT.md': '- [x] Crash on save <!-- id:bg-1 type:bug status:done links: git: repo:backend notion:abc last-synced:2026-07-01:deadbeef -->\n' });
  const work = pendingSync({ storeDir: dir, registers: [{ file: 'TECH_DEBT.md' }], date: DATE });
  assert.strictEqual(work.length, 1);
  assert.strictEqual(work[0].targetStatus, 'Fixed');
  assert.strictEqual(work[0].board, 'bug-log');
});
test('prd with a notion ref is never status-synced (standalone page, no ladder)', () => {
  const dir = tmpStore({ 'TODO.md': '## In Progress\n- [ ] PRD X <!-- id:pr-1 type:prd status:open links: git: repo: notion:abc last-synced: -->\n\n## Backlog\n' });
  assert.strictEqual(pendingSync({ storeDir: dir, registers, date: DATE }).length, 0);
});
test('malformed last-synced marker → treated as dirty, update fires', () => {
  const dir = tmpStore({ 'TODO.md': '## In Progress\n- [ ] Ship X <!-- id:td-8 type:task status:open links: git: repo:backend notion:abc last-synced:2026-07-15.1d3e9b62 -->\n\n## Backlog\n' });
  const work = pendingSync({ storeDir: dir, registers, date: DATE });
  assert.strictEqual(work.length, 1);
  assert.strictEqual(work[0].targetStatus, 'Backend dev');
});

// --- markFor: the stamping side of the contract ------------------------------
// pendingSync decides what is dirty; markFor produces the value that makes it
// clean. These MUST agree, so markFor is the only supported way to stamp.
const { markFor } = require('./sync.js');
const { parseLine } = require('./item.js');

// Long enough that cardTitle() truncates it — the exact shape that regressed.
const LONG = 'Marketplace Musical Fit Discovery — genre/goal/level as REORDER+badge preferences (not hard filters) plus name-scoped search and filter-value analytics';

test('markFor round-trips: a freshly stamped item is clean', () => {
  const item = parseLine(`- [ ] ${LONG} <!-- id:td-9 type:task status:open links: git: repo:backend notion:abc last-synced: -->`);
  const mark = markFor({ item, section: 'in progress', date: '2026-07-25' });
  const dir = tmpStore({ 'TODO.md': `## In Progress\n- [ ] ${LONG} <!-- id:td-9 type:task status:open links: git: repo:backend notion:abc last-synced:${mark} -->\n\n## Backlog\n` });
  assert.strictEqual(pendingSync({ storeDir: dir, registers, date: DATE }).length, 0);
});

test('a marker built from cardTitle() never goes clean — regression guard', () => {
  // The trap: cardTitle is right there in the same module and looks like "the
  // title". Stamping with it makes the item report `update` on every sync
  // forever, silently firing a redundant Notion write each time.
  const item = parseLine(`- [ ] ${LONG} <!-- id:td-10 type:task status:open links: git: repo:backend notion:abc last-synced: -->`);
  const wrong = syncMark({ date: '2026-07-25', title: cardTitle(item.text), status: item.status, boardStatus: 'Backend dev' });
  const right = markFor({ item, section: 'in progress', date: '2026-07-25' });
  assert.notStrictEqual(wrong, right, 'cardTitle-based marker must differ from the canonical one');

  const dir = tmpStore({ 'TODO.md': `## In Progress\n- [ ] ${LONG} <!-- id:td-10 type:task status:open links: git: repo:backend notion:abc last-synced:${wrong} -->\n\n## Backlog\n` });
  const work = pendingSync({ storeDir: dir, registers, date: DATE });
  assert.strictEqual(work.length, 1, 'the cardTitle-stamped item stays dirty');
  assert.strictEqual(work[0].action, 'update');
});

test('markFor tracks the derived lane, not a hardcoded one', () => {
  const line = `- [ ] Ship X <!-- id:td-11 type:task status:open links: git: repo:frontend notion:abc last-synced: -->`;
  const item = parseLine(line);
  assert.notStrictEqual(
    markFor({ item, section: 'in progress', date: DATE }), // → Front end dev
    markFor({ item, section: 'backlog', date: DATE }),     // → Backlog
  );
});

test('markFor honours a stage: pin', () => {
  const pinned = parseLine('- [ ] Ship X <!-- id:td-12 type:task status:open links: git: repo:frontend stage:Keri-testing notion:abc last-synced: -->');
  const plain = parseLine('- [ ] Ship X <!-- id:td-13 type:task status:open links: git: repo:frontend notion:abc last-synced: -->');
  assert.strictEqual(
    markFor({ item: pinned, section: 'in progress', date: DATE }),
    syncMark({ date: DATE, title: 'Ship X', status: 'open', boardStatus: 'Keri testing' }),
  );
  assert.notStrictEqual(
    markFor({ item: pinned, section: 'in progress', date: DATE }),
    markFor({ item: plain, section: 'in progress', date: DATE }),
  );
});

test('markFor returns null for a prd (no Status ladder)', () => {
  const item = parseLine('- [ ] PRD X <!-- id:pr-2 type:prd status:open links: git: repo: notion:abc last-synced: -->');
  assert.strictEqual(markFor({ item, section: 'in progress', date: DATE }), null);
});
