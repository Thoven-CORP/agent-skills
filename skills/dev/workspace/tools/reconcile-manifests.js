// reconcile-manifests.js — find .dev/MANIFEST.md files whose Current Phase is
// non-terminal (the source of the lying session banner). Pure filesystem scan;
// the git/CHANGELOG "is it really shipped?" judgment is layered in by the
// reconcile verb, kept out of the unit so it stays testable.
const fs = require('node:fs');
const path = require('node:path');
const TERMINAL = new Set(['shipped', 'archived', 'done']);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === 'MANIFEST.md' && full.includes(`${path.sep}.dev${path.sep}`)) out.push(full);
  }
  return out;
}
function field(content, key) {
  const m = new RegExp(`\\|\\s*\\*\\*${key}\\*\\*\\s*\\|\\s*([^|]*)\\|`, 'i').exec(content)
    || new RegExp(`^${key}:\\s*(.+)`, 'im').exec(content);
  return m ? m[1].trim() : '';
}
function findStaleManifests({ repoDir }) {
  const docs = path.join(repoDir, 'docs');
  if (!fs.existsSync(docs)) return [];
  const stale = [];
  for (const mf of walk(docs)) {
    const c = fs.readFileSync(mf, 'utf8');
    const phase = field(c, 'Current Phase').toLowerCase() || field(c, 'current_phase').toLowerCase();
    if (phase && !TERMINAL.has(phase)) stale.push({ path: mf, feature: field(c, 'Feature'), phase });
  }
  return stale;
}
module.exports = { findStaleManifests };
