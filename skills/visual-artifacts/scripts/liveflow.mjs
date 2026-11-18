// Build-time half of a live flow (references/live-flow.md).
// annotate() reads a Pele SVG, works out which nodes each edge joins, and writes that onto the SVG
// so assets/liveflow.js needs no geometry. check() refuses cases the diagram cannot play.

const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
const r1 = (n) => Math.round(n * 10) / 10;

// An SVG path as a polyline of absolute points. Curves are sampled; an arc becomes its chord.
export function flatten(d, samples = 10) {
  const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const pts = [];
  let i = 0, cmd = null, x = 0, y = 0, sx = 0, sy = 0, px = null, py = null;
  const curve = (f) => { for (let k = 1; k <= samples; k++) pts.push(f(k / samples)); };
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    if (!cmd) break;
    const up = cmd.toUpperCase(), rel = cmd !== up, n = ARGS[up];
    if (up === 'Z') { x = sx; y = sy; pts.push([x, y]); cmd = null; continue; }
    if (i + n > tokens.length) break;
    const a = tokens.slice(i, i + n).map(Number); i += n;
    const X = (v) => (rel ? x + v : v), Y = (v) => (rel ? y + v : v);
    const x0 = x, y0 = y;
    let cx = null, cy = null;
    if (up === 'M') { x = X(a[0]); y = Y(a[1]); sx = x; sy = y; pts.push([x, y]); cmd = rel ? 'l' : 'L'; }
    else if (up === 'L') { x = X(a[0]); y = Y(a[1]); pts.push([x, y]); }
    else if (up === 'H') { x = X(a[0]); pts.push([x, y]); }
    else if (up === 'V') { y = Y(a[0]); pts.push([x, y]); }
    else if (up === 'A') { x = X(a[5]); y = Y(a[6]); pts.push([x, y]); }
    else if (up === 'C' || up === 'S') {
      const s = up === 'S';
      const c1 = s ? (px == null ? [x0, y0] : [2 * x0 - px, 2 * y0 - py]) : [X(a[0]), Y(a[1])];
      const c2 = [X(a[s ? 0 : 2]), Y(a[s ? 1 : 3])], e = [X(a[s ? 2 : 4]), Y(a[s ? 3 : 5])];
      curve((t) => { const u = 1 - t; return [u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0], u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1]]; });
      [cx, cy] = c2; [x, y] = e;
    } else {
      const s = up === 'T';
      const c = s ? (px == null ? [x0, y0] : [2 * x0 - px, 2 * y0 - py]) : [X(a[0]), Y(a[1])];
      const e = [X(a[s ? 0 : 2]), Y(a[s ? 1 : 3])];
      curve((t) => { const u = 1 - t; return [u * u * x0 + 2 * u * t * c[0] + t * t * e[0], u * u * y0 + 2 * u * t * c[1] + t * t * e[1]]; });
      [cx, cy] = c; [x, y] = e;
    }
    px = cx; py = cy;
  }
  return pts;
}

const attrOf = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`)); return m ? m[1] : null; };
const num = (tag, name) => Number(attrOf(tag, name) || 0);
const bounds = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
};
function shapeBox(kind, tag) {
  if (kind === 'rect') return [num(tag, 'x'), num(tag, 'y'), num(tag, 'width'), num(tag, 'height')];
  if (kind === 'circle') { const r = num(tag, 'r'); return [num(tag, 'cx') - r, num(tag, 'cy') - r, 2 * r, 2 * r]; }
  if (kind === 'ellipse') { const rx = num(tag, 'rx'), ry = num(tag, 'ry'); return [num(tag, 'cx') - rx, num(tag, 'cy') - ry, 2 * rx, 2 * ry]; }
  if (kind === 'polygon') { const v = (attrOf(tag, 'points') || '').trim().split(/[\s,]+/).map(Number); const pts = []; for (let k = 0; k + 1 < v.length; k += 2) pts.push([v[k], v[k + 1]]); return pts.length ? bounds(pts) : null; }
  const pts = flatten(attrOf(tag, 'd') || '');
  return pts.length ? bounds(pts) : null;
}
const gap = (p, b) => Math.hypot(Math.max(b[0] - p[0], 0, p[0] - (b[0] + b[2])), Math.max(b[1] - p[1], 0, p[1] - (b[1] + b[3])));

const NODE = /<g class="pele-node(?: [^"]*)?"[^>]*>\s*<(rect|circle|ellipse|polygon|path)\b[^>]*>/g;
const EDGE = /(<g class="pele-edge(?: [^"]*)?")([^>]*)>([\s\S]*?)<\/g>/g;

// Returns the SVG with data-box on nodes and data-from, data-to, data-pts on edges, plus the graph.
export function annotate(svg) {
  const boxes = new Map();
  let out = svg.replace(NODE, (whole, kind) => {
    const open = whole.slice(0, whole.indexOf('>') + 1), shape = whole.slice(whole.lastIndexOf('<'));
    const id = attrOf(open, 'data-id');
    const box = shapeBox(kind, shape);
    if (id == null || !box) return whole;
    const t = (attrOf(open, 'transform') || '').match(/translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/);
    const abs = [r1(box[0] + (t ? Number(t[1]) : 0)), r1(box[1] + (t ? Number(t[2]) : 0)), r1(box[2]), r1(box[3])];
    if (!boxes.has(id)) boxes.set(id, []);
    boxes.get(id).push(abs);
    return open.slice(0, -1).replace(/\sdata-box="[^"]*"/, '') + ` data-box="${abs.join(',')}">` + whole.slice(open.length);
  });
  const nearest = (p) => {
    let best = null, d = Infinity;
    for (const [id, list] of boxes) for (const b of list) { const g = gap(p, b); if (g < d) { d = g; best = id; } }
    return best;
  };
  const edges = [];
  out = out.replace(EDGE, (whole, head, rest, body) => {
    const id = attrOf(head + rest, 'data-id');
    const paths = [...body.matchAll(/<path\b[^>]*>/g)].map((m) => m[0]);
    const main = paths.find((p) => !/class="[^"]*pele-marker/.test(p));
    if (id == null || !main) return whole;
    const pts = flatten(attrOf(main, 'd') || '');
    if (pts.length < 2) return whole;
    for (const mk of paths.filter((p) => /class="[^"]*pele-marker/.test(p))) {
      const tip = flatten(attrOf(mk, 'd') || '')[0];
      if (!tip) continue;
      const a = pts[0], b = pts[pts.length - 1];
      if (Math.hypot(tip[0] - b[0], tip[1] - b[1]) <= Math.hypot(tip[0] - a[0], tip[1] - a[1])) pts.push(tip); else pts.unshift(tip);
    }
    const from = nearest(pts[0]), to = nearest(pts[pts.length - 1]);
    if (from == null || to == null) return whole;
    edges.push({ id, from, to });
    const clean = rest.replace(/\sdata-(?:from|to|pts)="[^"]*"/g, '');
    return `${head}${clean} data-from="${from}" data-to="${to}" data-pts="${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(' ')}">${body}</g>`;
  });
  return { svg: out, graph: { sequence: /class="pele pele-sequence"/.test(svg), nodes: [...boxes.keys()], edges } };
}

const isText = (v) => typeof v === 'string' && v.trim() !== '';

// Every way the cases cannot play on this diagram, as plain sentences. An empty list means it plays.
export function check(spec, graph, name) {
  const errs = [];
  const bad = (m) => errs.push(`live flow "${name}": ${m}`);
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) { bad('the cases script must hold one JSON object'); return errs; }
  const lenses = spec.lenses == null ? [] : spec.lenses;
  if (!Array.isArray(lenses) || lenses.length > 4 || !lenses.every(isText)) bad('"lenses" is a list of one to four card titles');
  if (!Array.isArray(spec.cases) || spec.cases.length === 0) { bad('"cases" is empty; a live flow needs at least one case with steps'); return errs; }
  const nodes = new Set(graph.nodes);
  const out = (id) => [...new Set(graph.edges.filter((e) => e.from === id).map((e) => e.to))].join(', ') || 'nothing';
  const seen = new Set();
  spec.cases.forEach((c, ci) => {
    const cn = `case ${ci + 1}`;
    if (!c || typeof c !== 'object') return bad(`${cn} is not an object`);
    if (!isText(c.id) || !/^[A-Za-z0-9-]+$/.test(c.id)) bad(`${cn} needs an "id" of letters, digits or hyphens`);
    else if (seen.has(c.id)) bad(`${cn} repeats the id "${c.id}"`);
    seen.add(c.id);
    if (!isText(c.name)) bad(`${cn} needs a "name"`);
    const absent = c.absent == null ? [] : c.absent;
    if (!Array.isArray(absent)) bad(`${cn}: "absent" is a list of node ids`);
    else for (const a of absent) if (!nodes.has(a)) bad(`${cn}: "absent" names "${a}", which is not a node. Nodes: ${graph.nodes.join(', ')}`);
    if (!Array.isArray(c.steps) || c.steps.length === 0) return bad(`${cn} has no steps`);
    let prev = null;
    c.steps.forEach((s, si) => {
      const sn = `${cn}, step ${si + 1}`;
      if (!s || typeof s !== 'object') return bad(`${sn} is not an object`);
      if (!isText(s.say)) bad(`${sn} needs "say": one sentence on what happens`);
      if (lenses.length ? !(Array.isArray(s.cards) && s.cards.length === lenses.length && s.cards.every(isText)) : s.cards != null) {
        bad(`${sn}: "cards" must hold one text per lens (${lenses.length})`);
      }
      let at = null;
      if (s.msg != null) {
        if (!graph.sequence) bad(`${sn}: "msg" works only on a sequence diagram; use "at"`);
        else if (!Number.isInteger(s.msg) || s.msg < 1 || s.msg > graph.edges.length) bad(`${sn}: "msg" ${s.msg} is not a message; the diagram has ${graph.edges.length}`);
        else at = graph.edges[s.msg - 1].to;
      } else if (!isText(s.at)) {
        bad(`${sn} needs ${graph.sequence ? '"msg" (the message number)' : '"at" (a node id)'}`);
      } else if (!nodes.has(s.at)) {
        bad(`${sn}: "at" names "${s.at}", which is not a node. Nodes: ${graph.nodes.join(', ')}`);
      } else if (graph.sequence && si > 0) {
        bad(`${sn}: on a sequence diagram every step after the first uses "msg"`);
      } else {
        at = s.at;
        const via = s.via == null ? [] : s.via;
        if (!Array.isArray(via)) bad(`${sn}: "via" is a list of node ids`);
        else if (si === 0 && via.length) bad(`${sn}: the first step has nowhere to come from, so it takes no "via"`);
        else if (prev != null) {
          const path = [prev, ...via, at];
          for (let k = 0; k + 1 < path.length; k++) {
            const a = path[k], b = path[k + 1];
            if (!nodes.has(b)) { bad(`${sn}: "via" names "${b}", which is not a node`); break; }
            if (a !== b && !graph.edges.some((e) => e.from === a && e.to === b)) { bad(`${sn}: the diagram has no arrow from "${a}" to "${b}". "${a}" leads to: ${out(a)}`); break; }
          }
        }
      }
      if (at != null && Array.isArray(absent) && absent.includes(at)) bad(`${sn} rests on "${at}", which this case marks absent`);
      prev = at;
    });
  });
  return errs;
}
