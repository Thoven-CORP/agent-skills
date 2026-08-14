// ids.js — always-mint, immutable, type-prefixed birth-tag IDs.
// type: field is authoritative; the prefix is just a birth tag.
const PREFIXES = { todo: 'td', task: 'tk', bug: 'bg', improvement: 'fi', prd: 'pr', techdebt: 'dd' };
const BY_PREFIX = Object.fromEntries(Object.entries(PREFIXES).map(([t, p]) => [p, t]));
let counter = 0;
function mint(type) {
  const p = PREFIXES[type];
  if (!p) throw new Error(`unknown type: ${type}`);
  const rand = Math.floor(Math.random() * 36 ** 4).toString(36).padStart(4, '0');
  const seq = (counter++).toString(36); // monotonic tail guarantees in-process uniqueness
  return `${p}-${rand}${seq}`;
}
function typeOf(id) {
  const m = /^([a-z]{2})-/.exec(id || '');
  return m ? (BY_PREFIX[m[1]] ?? null) : null;
}
module.exports = { mint, typeOf, PREFIXES };
