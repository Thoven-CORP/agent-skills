(function () {
'use strict';

// Live flow player (references/live-flow.md). finish.mjs has already written data-box on every node
// and data-from, data-to, data-pts on every edge, so nothing here measures the SVG.

var NS = 'http://www.w3.org/2000/svg';
var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
var flows = [];
var byId = {};

function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
function nums(str) { return String(str || '').trim().split(/[\s,]+/).map(Number); }
function h(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function button(cls, text) { var b = h('button', cls, text); b.type = 'button'; return b; }
function svgEl(tag, cls, parent) { var e = document.createElementNS(NS, tag); e.setAttribute('class', cls); parent.appendChild(e); return e; }
function flag(el, name, on) { if (on) el.classList.add(name); else el.classList.remove(name); }
// Plain text with `code` spans; nothing else is markup.
function rich(el, text) {
  el.textContent = '';
  String(text).split('`').forEach(function (part, i) {
    if (!part) return;
    if (i % 2) el.appendChild(h('code', '', part)); else el.appendChild(document.createTextNode(part));
  });
}

function Flow(fig, spec) {
  var self = this;
  var id = fig.getAttribute('data-live');
  var svg = fig.querySelector('svg');
  var sequence = svg.classList.contains('pele-sequence');
  var lenses = spec.lenses || [];

  // Index the diagram
  var nodes = {};
  all(svg, '.pele-node[data-id]').forEach(function (g) {
    var k = g.getAttribute('data-id');
    var n = nodes[k] || (nodes[k] = { els: [], box: null, label: '' });
    n.els.push(g);
    var box = g.getAttribute('data-box') ? nums(g.getAttribute('data-box')) : null;
    if (box && (!n.box || box[1] < n.box[1])) n.box = box;
    var t = g.querySelector('text');
    if (!n.label && t) n.label = t.textContent.replace(/\s+/g, ' ').trim();
  });
  var labels = {};
  all(svg, '.pele-edge-label[data-id]').forEach(function (g) { labels[g.getAttribute('data-id')] = g; });
  var edges = all(svg, '.pele-edge[data-from]').map(function (g) {
    var v = nums(g.getAttribute('data-pts')), pts = [];
    for (var j = 0; j + 1 < v.length; j += 2) pts.push([v[j], v[j + 1]]);
    var lab = labels[g.getAttribute('data-id')] || null;
    return { g: g, lab: lab, from: g.getAttribute('data-from'), to: g.getAttribute('data-to'), pts: pts, text: lab ? lab.textContent.replace(/\s+/g, ' ').trim() : '' };
  });
  function edgeBetween(a, b) { for (var j = 0; j < edges.length; j++) if (edges[j].from === a && edges[j].to === b) return edges[j]; return null; }

  // Resolve every case once: where each step rests and which edges it travels
  var cases = spec.cases.map(function (c) {
    var prev = null;
    var steps = c.steps.map(function (s) {
      var hops = [], at = s.at;
      if (s.msg != null && edges[s.msg - 1]) { hops = [edges[s.msg - 1]]; at = hops[0].to; }
      else if (prev != null) {
        var path = [prev].concat(s.via || [], [s.at]);
        for (var j = 0; j + 1 < path.length; j++) { var e = path[j] !== path[j + 1] && edgeBetween(path[j], path[j + 1]); if (e) hops.push(e); }
      }
      prev = at;
      var words = String(s.say).split(/\s+/).length;
      return { at: at, hops: hops, via: s.via || [], say: s.say, when: s.when || '', cards: s.cards || [],
        label: s.label || (hops.length && sequence ? hops[0].text : '') || (nodes[at] ? nodes[at].label : at),
        dwell: Math.min(8000, 1800 + 230 * words) };
    });
    return { id: c.id, name: c.name, absent: c.absent || [], steps: steps };
  });

  var state = { c: 0, i: 0, timer: null, raf: null };

  // Build the controls around the figure
  var root = h('div', 'liveflow');
  root.setAttribute('data-live-ui', id);
  fig.parentNode.insertBefore(root, fig);
  var tabs = h('div', 'lf-cases');
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'Cases');
  var caseButtons = cases.map(function (c, n) {
    var b = button('lf-case');
    if (cases.length > 1) b.appendChild(h('span', 'n', String(n + 1)));
    b.appendChild(document.createTextNode(c.name));
    b.addEventListener('click', function () { self.pickCase(n); });
    tabs.appendChild(b);
    return b;
  });
  if (cases.length > 1) root.appendChild(tabs);
  var body = h('div', 'lf-body');
  root.appendChild(body);
  body.appendChild(fig);
  var panel = h('div', 'lf-panel');
  body.appendChild(panel);
  var vb = nums(svg.getAttribute('viewBox'));
  if (vb.length === 4 && vb[3] > vb[2] * 0.85) root.classList.add('lf-side');

  var rail = h('ol', 'lf-rail');
  rail.setAttribute('aria-label', 'Steps');
  panel.appendChild(rail);
  var now = h('div', 'lf-now');
  now.setAttribute('aria-live', 'polite');
  var whenEl = h('p', 'lf-when'), sayEl = h('p', 'lf-say');
  now.appendChild(whenEl); now.appendChild(sayEl);
  panel.appendChild(now);
  var ctrl = h('div', 'lf-ctrl');
  var backB = button('btn small', 'Back'), playB = button('btn small primary', 'Play'), nextB = button('btn small', 'Next');
  ctrl.appendChild(backB); ctrl.appendChild(playB); ctrl.appendChild(nextB);
  var where = sequence ? 'Click a message or a step.' : 'Click a state or a step.';
  ctrl.appendChild(h('span', 'lf-hint', where + (cases.length > 1 ? ' Keys: ← → step, 1–' + Math.min(9, cases.length) + ' case.' : ' Keys: ← → step.')));
  panel.appendChild(ctrl);
  var cardEls = [];
  if (lenses.length) {
    var cards = h('div', 'lf-cards');
    lenses.forEach(function (name) {
      var p = h('div', 'panel');
      p.appendChild(h('p', 'k', name));
      var t = h('p');
      p.appendChild(t); cards.appendChild(p); cardEls.push(t);
    });
    panel.appendChild(cards);
  }

  // The moving layer sits in the edges' own coordinate space, above the nodes
  var first = svg.querySelector('.pele-edges') || svg.querySelector('.pele-nodes');
  var layer = first ? first.parentNode : svg;
  var ring = svgEl('rect', 'lf-ring', layer);
  ring.setAttribute('rx', '12');
  var token = svgEl('circle', 'lf-token', layer);
  token.setAttribute('r', '7');
  fig.classList.add('lf-on');

  // Anything a case reaches can be clicked
  Object.keys(nodes).forEach(function (k) {
    if (!cases.some(function (c) { return c.steps.some(function (s) { return s.at === k; }); })) return;
    nodes[k].els.forEach(function (g) { hit(g, 'Go to ' + nodes[k].label, function () { self.pickNode(k); }); });
  });
  edges.forEach(function (e) {
    if (!e.lab || !cases.some(function (c) { return c.steps.some(function (s) { return s.hops.indexOf(e) >= 0; }); })) return;
    hit(e.lab, 'Play: ' + e.text, function () { self.pickEdge(e); });
  });
  function hit(g, label, fn) {
    g.classList.add('lf-hit');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', label);
    g.addEventListener('click', fn);
    g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); fn(); } });
  }

  function cur() { return cases[state.c]; }
  function stop() { if (state.timer) { clearTimeout(state.timer); state.timer = null; } }

  function buildRail() {
    rail.textContent = '';
    cur().steps.forEach(function (s, n) {
      var li = h('li'), b = button('lf-step');
      b.appendChild(h('span', 'n', String(n + 1)));
      b.appendChild(h('span', 't', s.label));
      b.addEventListener('click', function () { stop(); go(n, n === state.i + 1); });
      li.appendChild(b); rail.appendChild(li);
    });
  }

  function rest(c, i) {
    for (var j = i; j >= 0; j--) { var hp = c.steps[j].hops; if (hp.length) { var p = hp[hp.length - 1].pts; return p[p.length - 1]; } }
    var n = nodes[c.steps[0].at];
    return n && n.box ? [n.box[0], n.box[1]] : [-99, -99];
  }

  function paint(animate) {
    var c = cur(), i = state.i, st = c.steps[i];
    var seen = {}, taken = [], off = {};
    c.absent.forEach(function (k) { off[k] = 1; });
    for (var j = 0; j <= i; j++) {
      seen[c.steps[j].at] = 1;
      c.steps[j].via.forEach(function (k) { seen[k] = 1; });
      if (j < i) taken = taken.concat(c.steps[j].hops);
    }
    Object.keys(nodes).forEach(function (k) {
      nodes[k].els.forEach(function (g) { flag(g, 'lf-cur', k === st.at); flag(g, 'lf-seen', !!seen[k]); flag(g, 'lf-off', !!off[k]); });
    });
    edges.forEach(function (e) {
      var isCur = st.hops.indexOf(e) >= 0, isTaken = !isCur && taken.indexOf(e) >= 0, isOff = !!(off[e.from] || off[e.to]);
      [e.g, e.lab].forEach(function (g) { if (g) { flag(g, 'lf-cur', isCur); flag(g, 'lf-taken', isTaken); flag(g, 'lf-off', isOff); } });
    });
    var box = nodes[st.at] && nodes[st.at].box;
    if (box) {
      ring.setAttribute('x', box[0] - 5); ring.setAttribute('y', box[1] - 5);
      ring.setAttribute('width', box[2] + 10); ring.setAttribute('height', box[3] + 10);
    }
    if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null; }
    var end = rest(c, i);
    if (animate && st.hops.length && !reduce.matches) {
      var pts = [];
      st.hops.forEach(function (e) { pts = pts.concat(e.pts); });
      run(pts);
    } else { token.setAttribute('cx', end[0]); token.setAttribute('cy', end[1]); }

    whenEl.textContent = 'Step ' + (i + 1) + ' of ' + c.steps.length + (st.when ? ' · ' + st.when : '');
    rich(sayEl, st.say);
    cardEls.forEach(function (el, n) { rich(el, st.cards[n] == null ? '' : st.cards[n]); });
    all(rail, '.lf-step').forEach(function (b, n) {
      if (n === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      flag(b, 'done', n < i);
    });
    caseButtons.forEach(function (b, n) { b.setAttribute('aria-pressed', n === state.c ? 'true' : 'false'); });
    backB.disabled = i === 0;
    nextB.disabled = i === c.steps.length - 1;
    playB.textContent = state.timer ? 'Pause' : (i === c.steps.length - 1 ? 'Replay' : 'Play');
  }

  function run(pts) {
    var lens = [0];
    for (var j = 1; j < pts.length; j++) lens.push(lens[j - 1] + Math.sqrt(Math.pow(pts[j][0] - pts[j - 1][0], 2) + Math.pow(pts[j][1] - pts[j - 1][1], 2)));
    var total = lens[lens.length - 1] || 1, dur = Math.min(1500, 380 + total * 1.3), t0 = null;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var u = Math.min(1, (ts - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, at = e * total, j = 1;
      while (j < lens.length - 1 && lens[j] < at) j++;
      var seg = (lens[j] - lens[j - 1]) || 1, f = (at - lens[j - 1]) / seg;
      token.setAttribute('cx', pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f);
      token.setAttribute('cy', pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f);
      state.raf = u < 1 ? requestAnimationFrame(frame) : null;
    }
    state.raf = requestAnimationFrame(frame);
  }

  function link() {
    if (!window.history || !history.replaceState) return;
    try { history.replaceState(null, '', '#' + id + ':' + cur().id + '.' + (state.i + 1)); } catch (e) { /* file pages in some browsers refuse */ }
  }
  function go(i, animate, quiet) {
    state.i = Math.max(0, Math.min(cur().steps.length - 1, i));
    paint(animate);
    if (!quiet) link();
  }
  function tick() {
    if (state.i >= cur().steps.length - 1) { stop(); paint(false); return; }
    go(state.i + 1, true);
    state.timer = setTimeout(tick, cur().steps[state.i].dwell);
    playB.textContent = 'Pause';
  }

  this.id = id;
  this.root = root;
  this.go = function (i, animate) { stop(); go(i, !!animate); };
  this.next = function () { stop(); if (state.i < cur().steps.length - 1) go(state.i + 1, true); };
  this.back = function () { stop(); go(state.i - 1, false); };
  this.play = function () {
    if (state.timer) { stop(); paint(false); return; }
    if (state.i >= cur().steps.length - 1) go(0, false);
    state.timer = setTimeout(tick, 500);
    playB.textContent = 'Pause';
  };
  this.pickCase = function (n, step, quiet) {
    if (n < 0 || n >= cases.length) return;
    stop();
    state.c = n;
    buildRail();
    go(step || 0, false, quiet);
  };
  // A node: the next step in this case that rests there, else the first case that reaches it
  this.pickNode = function (k) {
    var steps = cur().steps, n = steps.length, j;
    for (j = 1; j <= n; j++) { var at = (state.i + j) % n; if (steps[at].at === k) { stop(); go(at, at === state.i + 1); return; } }
    for (var c = 0; c < cases.length; c++) for (j = 0; j < cases[c].steps.length; j++) if (cases[c].steps[j].at === k) { self.pickCase(c, j); return; }
  };
  this.pickEdge = function (e) {
    var steps = cur().steps, j;
    for (j = 0; j < steps.length; j++) if (steps[j].hops.indexOf(e) >= 0) { stop(); go(Math.max(0, j - 1), false, true); go(j, true); return; }
    for (var c = 0; c < cases.length; c++) for (j = 0; j < cases[c].steps.length; j++) if (cases[c].steps[j].hops.indexOf(e) >= 0) { self.pickCase(c, Math.max(0, j - 1), true); go(j, true); return; }
  };
  this.state = function () { var s = cur().steps[state.i]; return { caseId: cur().id, step: state.i + 1, at: s.at, steps: cur().steps.length, playing: !!state.timer }; };
  this.open = function (caseId, step) {
    for (var c = 0; c < cases.length; c++) if (cases[c].id === caseId) { self.pickCase(c, (step || 1) - 1, true); return true; }
    return false;
  };

  backB.addEventListener('click', this.back);
  nextB.addEventListener('click', this.next);
  playB.addEventListener('click', this.play);
  buildRail();
  paint(false);
}

function fromHash(scroll) {
  var m = /^#([^:]+):([A-Za-z0-9-]+)\.(\d+)$/.exec(location.hash || '');
  if (!m || !byId[m[1]]) return;
  if (byId[m[1]].open(m[2], Number(m[3])) && scroll && byId[m[1]].root.scrollIntoView) byId[m[1]].root.scrollIntoView({ block: 'center' });
}

// The flow the keys act on: the one holding focus, else the one nearest the middle of the window
function target(ev) {
  var el = ev.target, j;
  for (j = 0; j < flows.length; j++) if (flows[j].root.contains(el)) return flows[j];
  if (el && el !== document.body && el !== document.documentElement) return null;
  var best = null, d = Infinity, mid = window.innerHeight / 2;
  flows.forEach(function (f) {
    var r = f.root.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    var gap = Math.abs((r.top + r.bottom) / 2 - mid);
    if (gap < d) { d = gap; best = f; }
  });
  return best;
}
function onKey(ev) {
  if (ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.altKey) return;
  var t = ev.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
  var f = target(ev);
  if (!f) return;
  if (ev.key === 'ArrowRight') f.next();
  else if (ev.key === 'ArrowLeft') f.back();
  else if (ev.key === 'Home') f.go(0);
  else if (ev.key === 'End') f.go(f.state().steps - 1);
  else if (/^[1-9]$/.test(ev.key)) f.pickCase(Number(ev.key) - 1);
  else return;
  ev.preventDefault();
}

function boot() {
  all(document, 'figure[data-live]').forEach(function (fig) {
    var id = fig.getAttribute('data-live'), src = null;
    all(document, 'script[data-live-for]').forEach(function (s) { if (s.getAttribute('data-live-for') === id) src = s; });
    if (!src || !fig.querySelector('svg') || byId[id]) return;
    var spec;
    try { spec = JSON.parse(src.textContent); } catch (e) { return; }
    if (!spec || !spec.cases || !spec.cases.length) return;
    var f = new Flow(fig, spec);
    flows.push(f); byId[id] = f;
  });
  if (!flows.length) return;
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', function () { fromHash(true); });
  fromHash(true);
  window.__liveflow = byId;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
