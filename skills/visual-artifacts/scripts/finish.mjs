#!/usr/bin/env node
// Usage: node finish.mjs <file.html>
// Inlines artifact.css (and workbook.js when <html data-workbook>), renders Mermaid to SVG with the
// vendored Pele. Idempotent: rerunning on a finished file rewrites nothing.
import { readFileSync, writeFileSync } from 'node:fs';
import { render } from './vendor/pele.js';

const here = (p) => new URL(p, import.meta.url);
const file = process.argv[2];
if (!file) { console.error('usage: node finish.mjs <file.html>'); process.exit(2); }

const before = readFileSync(file, 'utf8');
const css = readFileSync(here('../assets/artifact.css'), 'utf8').trim();
const js = readFileSync(here('../assets/workbook.js'), 'utf8').trim();
let html = before;

const block = (name, body) => `/* ${name}:start */\n${body}\n/* ${name}:end */`;
const between = (name) => new RegExp(`/\\* ${name.replace('.', '\\.')}:start \\*/[\\s\\S]*?/\\* ${name.replace('.', '\\.')}:end \\*/`);

// Diagrams first, so error line numbers match the file on disk; document order keeps ids stable
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dedent = (s) => {
  const lines = s.replace(/\r\n?/g, '\n').replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
  const pad = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0].length));
  return lines.map((l) => l.slice(Number.isFinite(pad) ? pad : 0)).join('\n');
};
const lineAt = (i) => html.slice(0, i).split('\n').length;

const DIAGRAM = /<pre\b([^>]*\bclass="[^"]*\bmermaid\b[^"]*"[^>]*)>([\s\S]*?)<\/pre>|<figure\b([^>]*\sdata-mermaid="([^"]*)"[^>]*)>[\s\S]*?<\/figure>/g;
let count = 0;
const errors = [];
html = html.replace(DIAGRAM, (whole, preAttrs, preBody, figAttrs, figSrc, offset) => {
  count += 1;
  const source = preAttrs != null ? dedent(decode(preBody)) : decode(figSrc);
  let svg;
  try {
    ({ svg } = render(source, { idPrefix: `d${count}-` }));
  } catch (e) {
    const where = e && e.line ? ` (diagram line ${e.line})` : '';
    errors.push(`diagram ${count} at ${file}:${lineAt(offset)} "${source.split('\n')[0].trim()}"${where}: ${String(e && e.message || e).split('\n')[0]}` +
      (e && e.snippet ? `\n    ${e.snippet.replace(/\n/g, '\n    ')}` : ''));
    return whole;
  }
  if (figAttrs != null) return `<figure${figAttrs}>${svg}</figure>`;
  const attrs = preAttrs
    .replace(/\sdata-mermaid="[^"]*"/, '')
    .replace(/\bclass="([^"]*)"/, (_, c) => `class="${['diagram', ...c.split(/\s+/).filter((x) => x && x !== 'mermaid' && x !== 'diagram')].join(' ')}"`);
  return `<figure${attrs} data-mermaid="${attr(source)}">${svg}</figure>`;
});

// Any Pele failure stops the run before the file is touched
if (errors.length) fail(errors.join('\n'));

// The page is the only scroll: a box grows to fit its content
const blank = (m) => m.replace(/[^\n]/g, '');
const own = html.replace(between('artifact.css'), blank).replace(between('workbook.js'), blank);
const scrolls = [...own.matchAll(/overflow(?:-[xy])?\s*:\s*(?:auto|scroll)|max-height\s*:/g)]
  .map((m) => `  line ${own.slice(0, m.index).split('\n').length}: ${m[0]}`);
if (scrolls.length) fail(`an inner scroll box; let it grow and the page scroll instead\n${scrolls.join('\n')}`);

// Stylesheet
if (between('artifact.css').test(html)) {
  html = html.replace(between('artifact.css'), () => block('artifact.css', css));
} else if (/<\/head>/i.test(html)) {
  html = html.replace(/<\/head>/i, () => `<style>\n${block('artifact.css', css)}\n</style>\n</head>`);
} else {
  fail('no /* artifact.css:start */ markers and no </head> to add them to');
}

// Workbook
const isWorkbook = /<html\b[^>]*\sdata-workbook\b/i.test(html);
if (isWorkbook) {
  if (between('workbook.js').test(html)) {
    html = html.replace(between('workbook.js'), () => block('workbook.js', js));
  } else {
    const at = html.toLowerCase().lastIndexOf('</body>');
    if (at < 0) fail('data-workbook is set but there is no </body> to add the script before');
    html = html.slice(0, at) + `<script>\n${block('workbook.js', js)}\n</script>\n` + html.slice(at);
  }
}

if (html !== before) writeFileSync(file, html);
console.log(`finished ${file}: css ✓, diagrams ${count}, workbook ${isWorkbook ? '✓' : '–'}`);

function fail(msg) {
  console.error(`finish.mjs: ${file}: ${msg}`);
  process.exit(1);
}
