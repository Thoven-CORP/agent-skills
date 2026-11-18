// node --test scripts/liveflow.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from './vendor/pele.js';
import { annotate, check, flatten } from './liveflow.mjs';

const finish = fileURLToPath(new URL('./finish.mjs', import.meta.url));
const STATE = 'stateDiagram-v2\n  [*] --> Requested: family books\n  Requested --> Booked: teacher approves\n  Booked --> Spent: start passes\n  Booked --> Returned: cancelled with notice\n  Spent --> Closed: daily run';
const SEQ = 'sequenceDiagram\n  participant P as Parent\n  participant T as Thoven\n  participant S as Stripe\n  P->>T: choose plan\n  T->>S: create subscription\n  S-->>T: invoice.paid';
const graphOf = (src) => annotate(render(src, { idPrefix: 't-' }).svg);
const page = (mermaid, json) => `<!doctype html><html><head><title>t</title></head><body><pre class="mermaid" data-live="s">\n${mermaid}\n</pre>\n${json == null ? '' : `<script type="application/json" data-live-for="s">${json}</script>`}\n</body></html>`;
const run = (html) => {
  const dir = mkdtempSync(join(tmpdir(), 'liveflow-test-'));
  const file = join(dir, 'p.html');
  writeFileSync(file, html);
  try { return { ok: true, out: execFileSync('node', [finish, file], { encoding: 'utf8', stdio: 'pipe' }), html: readFileSync(file, 'utf8') }; }
  catch (e) { return { ok: false, out: String(e.stderr), html: readFileSync(file, 'utf8') }; }
  finally { rmSync(dir, { recursive: true, force: true }); }
};
const good = { cases: [{ id: 'a', name: 'Normal', steps: [{ at: 'Requested', say: 'The family books.' }, { at: 'Booked', say: 'The teacher approves.' }, { at: 'Closed', via: ['Spent'], say: 'The run closes it.' }] }] };

test('flatten follows lines, curves and the short commands', () => {
  assert.deepEqual(flatten('M0,87H161.62'), [[0, 87], [161.62, 87]]);
  assert.deepEqual(flatten('M1 2 L3 4 v6 h-1'), [[1, 2], [3, 4], [3, 10], [2, 10]]);
  const c = flatten('M0,0C10,0 10,10 20,10');
  assert.deepEqual(c[c.length - 1], [20, 10]);
  assert.equal(c.length, 11);
});

test('annotate joins every edge to the nodes it leaves and reaches', () => {
  const { svg, graph } = graphOf(STATE);
  const pairs = graph.edges.map((e) => `${e.from}>${e.to}`);
  assert.deepEqual(pairs.sort(), ['Booked>Returned', 'Booked>Spent', 'Requested>Booked', 'Spent>Closed', 'root_start>Requested'].sort());
  assert.match(svg, /data-id="Booked"[^>]* data-box="[-\d.]+,[-\d.]+,[\d.]+,[\d.]+"/);
  assert.equal((svg.match(/ data-pts="/g) || []).length, 5);
  assert.equal(annotate(svg).svg, svg, 'annotating twice changes nothing');
});

test('annotate reads a sequence diagram in message order', () => {
  const { graph } = graphOf(SEQ);
  assert.equal(graph.sequence, true);
  assert.deepEqual(graph.edges.map((e) => `${e.from}>${e.to}`), ['P>T', 'T>S', 'S>T']);
});

test('check refuses empty input', () => {
  const { graph } = graphOf(STATE);
  for (const empty of [null, undefined, '', [], {}, { cases: [] }, { cases: [{ id: 'a', name: 'A', steps: [] }] }]) {
    assert.notEqual(check(empty, graph, 's').length, 0, JSON.stringify(empty));
  }
});

test('check accepts a case the diagram can play, and names what it cannot', () => {
  const { graph } = graphOf(STATE);
  assert.deepEqual(check(good, graph, 's'), []);
  const one = (steps, extra = {}) => check({ cases: [{ id: 'a', name: 'A', steps, ...extra }], ...(extra.top || {}) }, graph, 's').join('\n');
  assert.match(one([{ at: 'Nowhere', say: 'x' }]), /not a node\. Nodes: .*Requested/);
  assert.match(one([{ at: 'Requested', say: 'x' }, { at: 'Closed', say: 'x' }]), /no arrow from "Requested" to "Closed"\. "Requested" leads to: Booked/);
  assert.match(one([{ at: 'Requested' }]), /needs "say"/);
  assert.match(one([{ at: 'Requested', say: 'x', msg: 1 }]), /"msg" works only on a sequence diagram/);
  assert.match(one([{ at: 'Requested', say: 'x' }], { absent: ['Requested'] }), /marks absent/);
  assert.match(check({ lenses: ['Parent'], cases: [{ id: 'a', name: 'A', steps: [{ at: 'Requested', say: 'x' }] }] }, graph, 's').join('\n'), /one text per lens \(1\)/);
  assert.match(check({ cases: [good.cases[0], good.cases[0]] }, graph, 's').join('\n'), /repeats the id "a"/);
  assert.deepEqual(check({ cases: [{ id: 'a', name: 'A', steps: [{ at: 'Booked', say: 'x' }, { at: 'Booked', say: 'a day passes' }] }] }, graph, 's'), [], 'a step may stay where it is');
});

test('check plays a sequence by message number', () => {
  const { graph } = graphOf(SEQ);
  assert.deepEqual(check({ cases: [{ id: 'a', name: 'A', steps: [{ msg: 1, say: 'x' }, { msg: 2, say: 'y' }, { msg: 3, say: 'z' }] }] }, graph, 's'), []);
  assert.match(check({ cases: [{ id: 'a', name: 'A', steps: [{ msg: 4, say: 'x' }] }] }, graph, 's').join('\n'), /"msg" 4 is not a message; the diagram has 3/);
});

test('finish.mjs prepares a live flow and is idempotent', () => {
  const first = run(page(STATE, JSON.stringify(good)));
  assert.equal(first.ok, true, first.out);
  assert.match(first.out, /diagrams 1, workbook –, live 1/);
  assert.match(first.html, /<figure class="diagram" data-live="s" data-mermaid=/);
  assert.match(first.html, /data-from="Requested" data-to="Booked"/);
  assert.match(first.html, /\/\* liveflow\.js:start \*\//);
  const dir = mkdtempSync(join(tmpdir(), 'liveflow-test-'));
  const file = join(dir, 'p.html');
  writeFileSync(file, first.html);
  execFileSync('node', [finish, file], { stdio: 'pipe' });
  assert.equal(readFileSync(file, 'utf8'), first.html);
  rmSync(dir, { recursive: true, force: true });
});

test('finish.mjs refuses a live flow it cannot play and leaves the file alone', () => {
  const cases = [
    [page(STATE, null), /expected one <script type="application\/json" data-live-for="s">, found 0/],
    [page(STATE, ''), /not valid JSON/],
    [page(STATE, '{"cases":[]}'), /"cases" is empty/],
    [page(STATE, JSON.stringify({ cases: [{ id: 'a', name: 'A', steps: [{ at: 'Requested', say: 'x' }, { at: 'Closed', say: 'y' }] }] })), /no arrow from "Requested" to "Closed"/],
  ];
  for (const [html, want] of cases) {
    const r = run(html);
    assert.equal(r.ok, false);
    assert.match(r.out, want);
    assert.equal(r.html, html);
  }
  const stray = run(`<!doctype html><html><head></head><body><script type="application/json" data-live-for="x">{}</script></body></html>`);
  assert.equal(stray.ok, false);
  assert.match(stray.out, /has no diagram with data-live="x"/);
});

test('a page without a live flow finishes as before', () => {
  const r = run('<!doctype html><html><head></head><body><pre class="mermaid">\nflowchart LR\n  a --> b\n</pre></body></html>');
  assert.equal(r.ok, true, r.out);
  assert.match(r.out, /css ✓, diagrams 1, workbook –\n$/);
  assert.doesNotMatch(r.html, /liveflow\.js/);
  assert.doesNotMatch(r.html, /data-pts/);
});
