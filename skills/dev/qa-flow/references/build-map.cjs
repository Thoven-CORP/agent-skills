const fs = require('fs');
// Run directory: first CLI arg, else the current working directory.
// (Not __dirname — this script ships inside the skill, not beside your steps.jsonl.)
const RUN = process.argv[2] ? require('path').resolve(process.argv[2]) : process.cwd();
if (!fs.existsSync(RUN + '/steps.jsonl')) {
  console.error(`No steps.jsonl in ${RUN}\nUsage: node build-map.cjs [run-directory]`);
  process.exit(1);
}
const steps = fs.readFileSync(RUN + '/steps.jsonl', 'utf8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));

const FLOWS = {
  a0:'Setup', a1:'A1 · Teacher availability', a2:'A2 · Parent enrols',
  a3:'A3 · Scoped package created', a3b:'A3b · Control — must not leak',
  a3c:'A3c · Purchase ($4, real)', a4:'A4 · Schedule', a5:'A5 · Manage Lesson',
  a6:'A6 · Payment requests', a7:'A7 · Paid lesson', a8:'A8 · Homework',
  a9:'A9 · Auth & induced failures', a10:'A10 · Student', a11:'A11 · Unlist handshake',
  ux:'UX · Reported by Andres',
};
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const has = f => { try { return fs.existsSync(RUN + '/screenshots/' + f); } catch { return false; } };

const byFlow = {};
for (const s of steps) (byFlow[s.flow] ||= []).push(s);
const needsAttention = steps.filter(s => s.verdict === 'fail' || s.verdict === 'blocked');
const tally = steps.reduce((a,s) => (a[s.verdict] = (a[s.verdict]||0)+1, a), {});
const missingShots = steps.filter(s => s.screenshot && !has(s.screenshot)).map(s => s.screenshot);

const card = s => `
  <article class="step ${s.verdict}" id="${s.flow}-${s.step}">
    <header><span class="badge">${esc(s.verdict)}</span><h3>${esc(s.title)}</h3></header>
    ${s.screenshot && has(s.screenshot) ? `<a href="screenshots/${esc(s.screenshot)}" target="_blank">
      <img loading="lazy" src="screenshots/${esc(s.screenshot)}" alt="${esc(s.title)}"></a>` : ''}
    <dl>
      <dt>Expected</dt><dd>${esc(s.expected)}</dd>
      ${s.note ? `<dt>Note</dt><dd>${esc(s.note)}</dd>` : ''}
      ${s.url && s.url !== 'n/a' ? `<dt>URL</dt><dd><code>${esc(s.url)}</code></dd>` : ''}
      ${s.slowest_ms != null ? `<dt>Slowest call</dt><dd${s.slowest_ms > 800 ? ' class="slow"' : ''}>${s.slowest_ms} ms — ${esc(s.slowest_call)}</dd>` : ''}
      ${s.network ? `<dt>Trace</dt><dd><a href="network/${esc(s.network)}" target="_blank">${esc(s.network)}</a></dd>` : ''}
    </dl>
  </article>`;

const order = ['fail','blocked','partial','design','info','pass'];
const html = `<!doctype html><meta charset="utf-8">
<title>v3.0.0 Post-Production QA — UI Map</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#111;--mut:#666;--line:#e5e5e5;--pass:#0a7d32;--fail:#c02626;--blocked:#a86400;--partial:#7048b6;--info:#2563a8;--design:#b1478a}
@media (prefers-color-scheme:dark){:root{--bg:#111;--fg:#eee;--mut:#999;--line:#2a2a2a}}
*{box-sizing:border-box}body{margin:0;display:flex;font:15px/1.5 ui-sans-serif,system-ui;background:var(--bg);color:var(--fg)}
nav{position:sticky;top:0;height:100vh;overflow:auto;min-width:250px;border-right:1px solid var(--line);padding:1.5rem 1rem}
nav a{display:block;padding:.4rem .5rem;color:var(--fg);text-decoration:none;border-radius:5px;font-size:14px}
nav a:hover{background:var(--line)}
nav .n{color:var(--mut);font-size:12px}
main{flex:1;padding:2rem;max-width:1000px}
.summary{border:2px solid var(--fail);border-radius:8px;padding:1rem 1.25rem;margin-bottom:1.5rem}
.summary.clean{border-color:var(--pass)}
.tally{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:2.5rem}
.tally span{padding:.25rem .7rem;border-radius:99px;font-size:13px;color:#fff}
.step{border:1px solid var(--line);border-radius:8px;padding:1rem;margin:0 0 1.25rem}
.step.fail{border-color:var(--fail)}.step.blocked{border-color:var(--blocked)}
.step.partial{border-color:var(--partial)}.step.info{border-color:var(--info)}
.step.design{border-color:var(--design)}
.step header{display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem}
.step h3{margin:0;font-size:16px;font-weight:600}
.badge{font-size:11px;text-transform:uppercase;letter-spacing:.05em;padding:.15rem .5rem;border-radius:99px;background:var(--pass);color:#fff;flex:none}
.fail .badge{background:var(--fail)}.blocked .badge{background:var(--blocked)}
.partial .badge{background:var(--partial)}.info .badge{background:var(--info)}
.design .badge{background:var(--design)}
.b-pass{background:var(--pass)}.b-fail{background:var(--fail)}.b-blocked{background:var(--blocked)}
.b-partial{background:var(--partial)}.b-info{background:var(--info)}
.b-design{background:var(--design)}
img{width:100%;border:1px solid var(--line);border-radius:5px;display:block}
dl{display:grid;grid-template-columns:max-content 1fr;gap:.3rem .9rem;margin:.9rem 0 0;font-size:14px}
dt{color:var(--mut);white-space:nowrap}dd{margin:0}dd.slow{color:var(--fail);font-weight:600}
code{font-size:12px;color:var(--mut);word-break:break-all}
h2{margin:2.5rem 0 1rem;padding-bottom:.4rem;border-bottom:1px solid var(--line)}
table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;padding:.3rem .6rem .3rem 0;vertical-align:top}
td a{color:var(--fg)}
.note{color:var(--mut);font-size:13px;margin-top:1rem}
</style>
<nav><strong>Flows</strong>
${Object.keys(FLOWS).filter(f => byFlow[f]).map(f => {
  const bad = byFlow[f].filter(s=>s.verdict==='fail'||s.verdict==='blocked').length;
  return `<a href="#${f}">${esc(FLOWS[f])} <span class="n">${byFlow[f].length}${bad?` · ${bad}✕`:''}</span></a>`;
}).join('\n')}
</nav>
<main>
<h1>v3.0.0 Post-Production QA</h1>
<p style="color:var(--mut)">Backend [3.0.0] · Frontend [2.22.0] · both published 2026-08-08 · run against production</p>
<div class="summary ${needsAttention.length ? '' : 'clean'}">
  <strong>${needsAttention.length ? `${needsAttention.length} step(s) failed or blocked` : 'All captured steps passed'}</strong>
  ${needsAttention.length ? `<table>${needsAttention.map(s => `<tr><td style="white-space:nowrap"><a href="#${s.flow}-${s.step}">${esc(FLOWS[s.flow] || s.flow)}</a></td><td>${esc(s.title)}</td><td>${esc(s.verdict)}</td></tr>`).join('')}</table>` : ''}
</div>
<div class="tally">${order.filter(v=>tally[v]).map(v=>`<span class="b-${v}">${tally[v]} ${v}</span>`).join('')}</div>
${Object.keys(FLOWS).filter(f => byFlow[f]).map(f =>
  `<section id="${f}"><h2>${esc(FLOWS[f])}</h2>${byFlow[f].sort((a,b)=>a.step-b.step).map(card).join('')}</section>`
).join('\n')}
${missingShots.length ? `<p class="note">Screenshots referenced but not on disk (image omitted, step still shown): ${missingShots.map(esc).join(', ')}</p>` : ''}
</main>`;
fs.writeFileSync(RUN + '/ui-map.html', html);
console.log('wrote ui-map.html — ' + steps.length + ' steps, ' + needsAttention.length + ' fail/blocked, tally ' + JSON.stringify(tally));
if (missingShots.length) console.log('missing screenshots: ' + missingShots.join(', '));
