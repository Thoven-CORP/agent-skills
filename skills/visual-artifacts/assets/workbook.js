(function () {
'use strict';

var root = document.documentElement;
var KEY = 'workbook:' + (root.getAttribute('data-workbook') || location.pathname);
var CTRL = 'input,textarea,select';
var S = {};
var Q = [];

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function str(v) { return typeof v === 'string' ? v.trim() : ''; }
function oneLine(v) { return str(v).replace(/\s*\n+\s*/g, ' / '); }
function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
function today() { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

/* ---------------- model ---------------- */
function controlsOf(q) {
  var list = q.matches(CTRL) ? [q] : $$(CTRL, q);
  return list.filter(function (el) {
    return el.closest('[data-q]') === q && !el.hasAttribute('data-skip') && !/^(button|submit|reset|file|hidden|image)$/.test(el.type);
  });
}
function kindOf(el) {
  if (el.type === 'radio') return 'radio';
  if (el.type === 'checkbox') return 'check';
  if (el.type === 'range') return 'range';
  return 'text';
}
function partLabel(el, q) {
  if (el.dataset.label) return el.dataset.label;
  if (el.type === 'range') {
    var row = el.closest('.slider');
    if (row && row !== q) return text($('.l', row)) + ' ↔ ' + text($('.r', row));
  }
  var wrap = el.closest('.parts > *');
  if (wrap) { var lab = $('.lab', wrap); if (lab) return text(lab).replace(/:\s*$/, ''); }
  if (el.id) { var f = document.querySelector('label[for="' + el.id + '"]'); if (f) return text(f).replace(/:\s*$/, ''); }
  return el.getAttribute('aria-label') || '';
}
function build() {
  Q = $$('[data-q]').map(function (q) {
    var id = q.getAttribute('data-q');
    var parts = [], byKey = {}, n = 0;
    controlsOf(q).forEach(function (el) {
      var kind = kindOf(el);
      var sub = el.dataset.k || (el.name && el.name !== id ? el.name : '');
      var key = id + (sub ? '.' + sub : '');
      if (el.hasAttribute('data-other')) {
        var box = el.closest('label') && $('input[type=radio],input[type=checkbox]', el.closest('label'));
        key = el.dataset.k ? id + '.' + el.dataset.k : (box ? keyFor(box, id) : id) + '.other';
        el.dataset.key = key;
        return;
      }
      if (byKey[key] && (kind === 'radio' || kind === 'check') && byKey[key].kind === kind) {
        byKey[key].els.push(el); el.dataset.key = key; return;
      }
      while (byKey[key]) key = id + (sub ? '.' + sub : '') + '#' + (++n);
      el.dataset.key = key;
      byKey[key] = { key: key, kind: kind, els: [el], label: partLabel(el, q) };
      parts.push(byKey[key]);
    });
    parts.forEach(function (p) { if (p.kind === 'check' && p.els.length > 1) p.kind = 'checks'; });
    var sec = q.closest('section');
    return {
      el: q, id: id, parts: parts,
      label: q.dataset.label || text($('h3', q)) || partLabel(q, q) || id,
      section: sec ? text($('h2', sec)) : ''
    };
  });
}
function keyFor(box, id) {
  var sub = box.dataset.k || (box.name && box.name !== id ? box.name : '');
  return id + (sub ? '.' + sub : '');
}

/* ---------------- state ---------------- */
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { S = {}; }
  if (!S._date) S._date = today();
}
var saveTimer = null;
function saveNow() {
  clearTimeout(saveTimer); saveTimer = null;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked */ }
  var d = new Date();
  $$('[data-saved]').forEach(function (el) {
    el.textContent = 'Saved ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  });
}
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }
window.addEventListener('pagehide', function () { if (saveTimer) saveNow(); });

function partOf(el) {
  for (var i = 0; i < Q.length; i++) for (var j = 0; j < Q[i].parts.length; j++) if (Q[i].parts[j].els.indexOf(el) > -1) return Q[i].parts[j];
  return null;
}
function readEl(el) {
  var k = el.dataset.key;
  if (!k) return;
  if (el.type === 'radio') { if (el.checked) S[k] = el.value; }
  else if (el.type === 'checkbox') {
    var p = partOf(el);
    if (p && p.kind === 'checks') S[k] = p.els.filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
    else S[k] = el.checked;
  }
  else if (el.type === 'range') S[k] = +el.value;
  else S[k] = el.value;
}
function writeEl(el) {
  var k = el.dataset.key, v = S[k];
  if (!k) return;
  if (el.type === 'radio') el.checked = v === el.value;
  else if (el.type === 'checkbox') el.checked = Array.isArray(v) ? v.indexOf(el.value) > -1 : !!v;
  else if (el.type === 'range') { if (!('def' in el.dataset)) el.dataset.def = el.value; el.value = v == null ? el.dataset.def : v; }
  else el.value = v == null ? (el.dataset.def || '') : v;
}
function writeAll() { Q.forEach(function (q) { q.parts.forEach(function (p) { p.els.forEach(writeEl); }); $$('[data-other]', q.el).forEach(writeEl); }); }

function onInput(e) {
  var el = e.target;
  if (!el || !el.dataset || !el.dataset.key) return;
  readEl(el);
  if (el.hasAttribute('data-other') && str(el.value)) {
    var box = el.closest('label') && $('input[type=radio],input[type=checkbox]', el.closest('label'));
    if (box && !box.checked) { box.checked = true; readEl(box); }
  }
  refresh();
  save();
}
document.addEventListener('input', onInput);
document.addEventListener('change', onInput);

/* ---------------- markdown ---------------- */
function otherText(box) {
  var lab = box.closest('label'), o = lab && $('[data-other]', lab);
  return o ? oneLine(S[o.dataset.key]) : '';
}
function withOther(p, v) {
  var box = p.els.filter(function (x) { return x.value === v; })[0];
  var t = box ? otherText(box) : '';
  return t ? v + ' (' + t + ')' : v;
}
function partMD(p) {
  var v = S[p.key];
  switch (p.kind) {
    case 'radio': return str(v) ? withOther(p, v) : '';
    case 'checks': return Array.isArray(v) && v.length ? v.map(function (x) { return withOther(p, x); }).join(', ') : '';
    case 'check': return v ? 'yes' : '';
    case 'range': return v == null ? '' : v + ' / ' + (p.els[0].max || 100);
    default: return oneLine(v);
  }
}
function answered(q) { return q.parts.some(function (p) { return !!partMD(p); }); }
function questionMD(q) {
  var any = false;
  var bits = q.parts.map(function (p) {
    var t = partMD(p); if (t) any = true;
    return (p.label && q.parts.length > 1 ? p.label + ': ' : '') + (t || '—');
  });
  return any ? bits.join(' · ') : '—';
}
function toMarkdown() {
  var title = root.getAttribute('data-md-title') || document.title || 'Workbook';
  var out = ['# ' + title + ' — ' + (S._date || today())];
  var sec = null;
  Q.forEach(function (q) {
    if (q.section !== sec) { sec = q.section; if (sec) out.push('', '## ' + sec); }
    out.push('**' + q.id + ' ' + q.label + '** — ' + questionMD(q));
  });
  return out.join('\n') + '\n';
}
window.__toMarkdown = toMarkdown;

/* ---------------- toast, modal, copy ---------------- */
function ensure(cls, html) {
  var el = $('.' + cls);
  if (!el) { el = document.createElement('div'); el.className = cls; el.innerHTML = html; document.body.appendChild(el); }
  return el;
}
var toastTimer = null;
function toast(msg) {
  var t = ensure('wb-toast', '');
  t.setAttribute('role', 'status'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
}
function openModal(md) {
  var m = ensure('wb-modal', '<div class="box" role="dialog" aria-modal="true" aria-label="Copy this Markdown">' +
    '<div class="row"><h3>Copy this Markdown</h3><button type="button" class="btn small" data-wb-close>Close</button></div>' +
    '<textarea class="in" readonly aria-label="Markdown"></textarea></div>');
  var ta = $('textarea', m);
  ta.value = md; m.classList.add('open'); ta.focus(); ta.select();
}
function closeModal() { var m = $('.wb-modal'); if (m) m.classList.remove('open'); }
function copyMD() {
  var md = toMarkdown();
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('no clipboard');
    navigator.clipboard.writeText(md).then(function () { toast('Copied as Markdown'); }, function () { openModal(md); });
  } catch (e) { openModal(md); }
}

/* ---------------- reset (two clicks, no confirm) ---------------- */
var resetTimer = null;
function resetClick(btn) {
  if (!btn.classList.contains('armed')) {
    btn.dataset.label = btn.dataset.label || btn.textContent;
    btn.classList.add('armed'); btn.textContent = 'Click again to reset';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () { btn.classList.remove('armed'); btn.textContent = btn.dataset.label; }, 4000);
    return;
  }
  clearTimeout(resetTimer);
  btn.classList.remove('armed'); btn.textContent = btn.dataset.label;
  S = { _date: today() };
  try { localStorage.removeItem(KEY); } catch (e) { /* blocked */ }
  writeAll(); refresh(); save(); toast('Reset');
}

document.addEventListener('click', function (e) {
  var t = e.target;
  if (!(t instanceof Element)) return;
  if (t.closest('[data-copy-md]')) { copyMD(); return; }
  var r = t.closest('[data-reset]'); if (r) { resetClick(r); return; }
  if (t.closest('[data-wb-close]') || t.classList.contains('wb-modal')) closeModal();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

/* ---------------- refresh ---------------- */
function refresh() {
  var done = 0;
  Q.forEach(function (q) { var a = answered(q); q.el.classList.toggle('done', a); if (a) done++; });
  $$('[data-progress]').forEach(function (el) { el.textContent = done + '/' + Q.length; });
  $$('.progress > i').forEach(function (el) { el.style.width = (Q.length ? done / Q.length * 100 : 0) + '%'; });
  $$('.slider').forEach(function (row) {
    var r = $('input[type=range]', row), o = $('output', row);
    if (!r || !r.dataset.key) return;
    var v = S[r.dataset.key];
    row.classList.toggle('untouched', v == null);
    if (o) o.textContent = v == null ? '–' : String(v);
  });
}

function boot() { build(); writeAll(); refresh(); }
window.__workbook = { rebuild: boot, markdown: toMarkdown };
load();
boot();
})();
