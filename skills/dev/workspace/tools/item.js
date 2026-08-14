// item.js — an item is a markdown line + trailing HTML-comment field bag.
// The checkbox is human status; the comment is the machine layer.
const LINE_RE = /^- \[( |x)\] (.*?)(?:\s*<!--\s*(.*?)\s*-->)?$/;
function parseLine(line) {
  const m = LINE_RE.exec(line);
  if (!m) return null;
  const status = m[1] === 'x' ? 'done' : 'open';
  const text = m[2].trim();
  const fields = {};
  if (m[3]) {
    for (const tok of m[3].split(/\s+/)) {
      const i = tok.indexOf(':');
      if (i > 0) fields[tok.slice(0, i)] = tok.slice(i + 1);
    }
  }
  return { text, status, fields };
}
function serialize({ text, status, fields }) {
  const box = status === 'done' ? 'x' : ' ';
  const keys = Object.keys(fields);
  if (keys.length === 0) return `- [${box}] ${text}`;
  // The status: field mirrors the checkbox — derive it from `status` so the
  // comment can never drift from the box (one fact, not two).
  const comment = keys
    .map((k) => `${k}:${k === 'status' ? status : (fields[k] ?? '')}`)
    .join(' ');
  return `- [${box}] ${text} <!-- ${comment} -->`;
}
module.exports = { parseLine, serialize };
