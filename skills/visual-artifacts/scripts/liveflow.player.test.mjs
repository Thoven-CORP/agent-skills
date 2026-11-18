// node --test scripts/liveflow.player.test.mjs
// Drives assets/liveflow.js in jsdom. jsdom is borrowed from a Thoven checkout; without one the test skips.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let JSDOM = null;
try { ({ JSDOM } = require(require.resolve('jsdom', { paths: [process.cwd(), join(homedir(), 'thoven/frontend')] }))); } catch { /* skipped below */ }

const cards = (a, b) => [a, b];
const PAGE = `<!doctype html><html><head><title>t</title></head><body>
<pre class="mermaid" data-live="session">
flowchart LR
  pool([Family pool]) -->|family books| requested[Requested]
  requested -->|teacher approves| booked[Booked]
  booked -->|start passes| spent[Spent]
  spent -->|daily run closes it| closed([Closed])
  booked -->|cancelled with notice| returned[Returned]
  returned -.->|back in the pool| pool
</pre>
<script type="application/json" data-live-for="session">${JSON.stringify({ lenses: ['Parent', 'Data'], cases: [
    { id: 'normal', name: 'A normal session', steps: [
      { at: 'pool', when: 'Start', say: 'Thoven charges the plan.', cards: cards('Charged 180.', 'Pool: 4 of 4.') },
      { at: 'requested', say: 'The family books.', cards: cards('Waiting.', 'Session `requested`.') },
      { at: 'booked', say: 'The teacher approves.', cards: cards('On the calendar.', 'Session `booked`.') },
      { at: 'closed', via: ['spent'], say: 'The session happens and the run closes it.', cards: cards('In history.', 'Session `closed`.') }] },
    { id: 'notice', name: 'Cancelled with notice', steps: [
      { at: 'booked', say: 'A booked session.', cards: cards('On the calendar.', 'Session `booked`.') },
      { at: 'returned', say: 'The family cancels with notice.', cards: cards('The session is back.', 'Session `returned`.') },
      { at: 'pool', say: 'It is back in the pool.', cards: cards('Pool shows 4.', 'Pool: 4 of 4.') }] }] })}</script>
<pre class="mermaid" data-live="charge">
sequenceDiagram
  participant P as Parent
  participant V as Thoven
  participant S as Stripe
  P->>V: picks a plan
  V->>S: start the subscription
  S-->>V: invoice paid
</pre>
<script type="application/json" data-live-for="charge">${JSON.stringify({ cases: [{ id: 'first', name: 'First charge', steps: [{ msg: 1, say: 'The parent picks a plan.' }, { msg: 2, say: 'Thoven starts the subscription.' }, { msg: 3, say: 'Stripe says the invoice is paid.' }] }] })}</script>
<pre class="mermaid" data-live="pay">
flowchart TB
  closed([Closed]) --> earning[Earning written]
  earning --> payout[In a payout]
  payout -->|Stripe makes the transfer| transfer[Transfer sent]
  payout -->|Stripe says no| refused[Stripe said no]
  refused -->|next run| payout
  transfer --> paid([Paid])
</pre>
<script type="application/json" data-live-for="pay">${JSON.stringify({ cases: [{ id: 'wrong', name: 'Refused once', steps: [{ at: 'closed', say: 'Closed.' }, { at: 'earning', say: 'Earned.' }, { at: 'payout', say: 'Try 1.' }, { at: 'refused', say: 'Stripe says no.' }, { at: 'payout', say: 'Try 2.' }, { at: 'transfer', say: 'Sent.' }, { at: 'paid', say: 'Paid.' }] }] })}</script>
<input id="field">
</body></html>`;

test('the player steps, jumps, switches cases and keeps its place', { skip: JSDOM ? false : 'jsdom not found' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'liveflow-player-'));
  const file = join(dir, 'p.html');
  writeFileSync(file, PAGE);
  execFileSync('node', [fileURLToPath(new URL('./finish.mjs', import.meta.url)), file], { stdio: 'pipe' });
  const errors = [];
  const dom = new JSDOM(readFileSync(file, 'utf8'), { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/p.html',
    beforeParse(w) { w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, addListener() {} }); w.addEventListener('error', (e) => errors.push(String(e.message))); w.Element.prototype.scrollIntoView = () => {}; } });
  rmSync(dir, { recursive: true, force: true });
  const w = dom.window, d = w.document;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const key = (k, el) => (el || d.body).dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await wait(50);
  const L = w.__liveflow;
  assert.deepEqual(Object.keys(L), ['session', 'charge', 'pay']);
  const s = L.session, ui = d.querySelector('[data-live-ui="session"]');
  const node = (id) => ui.querySelector(`.pele-node[data-id="${id}"]`);
  const steps = () => [...ui.querySelectorAll('.lf-step')];
  const play = () => ui.querySelector('.lf-ctrl .btn.primary');
  const named = (t) => [...ui.querySelectorAll('.lf-ctrl .btn')].find((b) => b.textContent === t);

  // first paint
  assert.deepEqual({ ...s.state() }, { caseId: 'normal', step: 1, at: 'pool', steps: 4, playing: false });
  assert.equal(ui.querySelectorAll('.lf-case').length, 2);
  assert.deepEqual(steps().map((b) => b.querySelector('.t').textContent), ['Family pool', 'Requested', 'Booked', 'Closed']);
  assert.equal(ui.querySelector('.lf-when').textContent, 'Step 1 of 4 · Start');
  assert.equal(named('Back').disabled, true);
  assert.equal(d.querySelector('script[data-live-for="session"]').textContent.includes('normal'), true, 'the cases stay in the page');

  // Next, marks, cards, address
  click(named('Next'));
  assert.equal(s.state().at, 'requested');
  assert.ok(node('requested').classList.contains('lf-cur') && node('pool').classList.contains('lf-seen') && !node('booked').classList.contains('lf-seen'));
  assert.ok(ui.querySelector('.pele-edge[data-from="pool"][data-to="requested"]').classList.contains('lf-cur'));
  assert.equal(ui.querySelector('.lf-cards code').textContent, 'requested');
  assert.equal(w.location.hash, '#session:normal.2');

  // a step that crosses two arrows lights both
  click(steps()[3]);
  assert.equal(s.state().at, 'closed');
  assert.equal(ui.querySelectorAll('.pele-edge.lf-cur').length, 2);
  assert.ok(node('spent').classList.contains('lf-seen'));
  assert.equal(named('Next').disabled, true);
  assert.equal(play().textContent, 'Replay');
  assert.equal(ui.querySelectorAll('.lf-step.done').length, 3);
  assert.equal(steps()[3].getAttribute('aria-current'), 'step');

  // click a state in this case, then one only another case reaches
  click(node('booked'));
  assert.deepEqual([s.state().caseId, s.state().step], ['normal', 3]);
  click(node('returned'));
  assert.deepEqual([s.state().caseId, s.state().step, s.state().at], ['notice', 2, 'returned']);
  assert.equal(node('returned').getAttribute('role'), 'button');
  assert.equal(node('returned').getAttribute('aria-label'), 'Go to Returned');
  assert.equal(node('spent').hasAttribute('tabindex'), false, 'a state no step rests on is not a button');

  // keys act on the flow without focus, and leave fields alone
  key('ArrowRight');
  assert.equal(s.state().at, 'pool');
  key('ArrowLeft'); key('1');
  assert.deepEqual([s.state().caseId, s.state().step], ['normal', 1]);
  key('End');
  assert.equal(s.state().step, 4);
  key('Home', d.getElementById('field'));
  assert.equal(s.state().step, 4);

  // an arrow label plays its step
  click([...ui.querySelectorAll('.pele-edge-label.lf-hit')].find((g) => g.textContent.includes('teacher approves')));
  assert.deepEqual([s.state().step, s.state().at], [3, 'booked']);

  // sequence: one case, message labels, the receiver is where it rests
  const cu = d.querySelector('[data-live-ui="charge"]');
  assert.equal(cu.querySelectorAll('.lf-case').length, 0);
  assert.deepEqual([...cu.querySelectorAll('.lf-step .t')].map((x) => x.textContent), ['picks a plan', 'start the subscription', 'invoice paid']);
  assert.equal(L.charge.state().at, 'V');
  L.charge.go(2);
  assert.equal(cu.querySelectorAll('.pele-edge.lf-cur').length, 1);
  assert.equal(cu.querySelectorAll('.pele-edge.lf-taken').length, 2);
  assert.equal(cu.querySelectorAll('.lf-cards').length, 0);

  // a tall diagram sits beside its panel; a state visited twice resolves by step
  const pu = d.querySelector('[data-live-ui="pay"]');
  assert.ok(pu.classList.contains('lf-side') && !ui.classList.contains('lf-side'));
  L.pay.go(4);
  assert.ok(pu.querySelector('.pele-edge[data-from="refused"][data-to="payout"]').classList.contains('lf-cur'));
  const box = pu.querySelector('.pele-node[data-id="payout"]').getAttribute('data-box').split(',').map(Number);
  assert.equal(Number(pu.querySelector('.lf-ring').getAttribute('x')), box[0] - 5);
  assert.equal(Number(pu.querySelector('.lf-ring').getAttribute('width')), box[2] + 10);
  assert.equal(d.querySelectorAll('.lf-token').length, 3);

  // play, pause, and a link to an exact step
  s.pickCase(0);
  click(play());
  assert.equal(play().textContent, 'Pause');
  await wait(800);
  assert.deepEqual([s.state().step, s.state().playing], [2, true]);
  click(play());
  assert.equal(s.state().playing, false);
  w.location.hash = '#pay:wrong.6';
  await wait(30);
  assert.deepEqual([L.pay.state().step, L.pay.state().at], [6, 'transfer']);
  assert.deepEqual(errors, []);
  w.close();
});
