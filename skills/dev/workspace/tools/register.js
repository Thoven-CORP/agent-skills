// register.js — insert a serialized item line under a section header of a
// register file (TODO.md). The add-* recipes share this so "which section, and
// fail loud if it's absent" lives — and is tested — in exactly one place.
//
// Replaces an inline `content.replace(/(## Backlog\n)/, ...)` that silently
// no-op'd when the section was missing: String.replace returns the text
// unchanged on no-match, so the item was dropped while the caller still printed
// a (fake) success id. This helper throws instead — no silent data loss.
const fs = require('node:fs');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Insert `line` directly under the FIRST section header in `sectionNames`
// (priority order) that exists in `content`. Returns the new content.
// Throws if none of the sections exist — never silently drops the line.
function insertUnderSection(content, sectionNames, line) {
  for (const name of sectionNames) {
    // A markdown `## <name>` header line + an optional trailing blank line, so
    // the item lands at the top of the section and keeps the blank-line gap
    // when there is one. `m` flag so `^` anchors to a line start, not the file.
    const re = new RegExp(`(^##[ \\t]+${escapeRe(name)}[ \\t]*\\n\\n?)`, 'm');
    if (re.test(content)) return content.replace(re, `$1${line}\n`);
  }
  throw new Error(
    `register: no matching section in target (tried: ${sectionNames.join(', ')})`,
  );
}

// File wrapper the add-* recipes call: read -> insert -> write. Returns the
// content written so callers/tests can assert on it.
function insertItem(filePath, sectionNames, line) {
  const next = insertUnderSection(fs.readFileSync(filePath, 'utf8'), sectionNames, line);
  fs.writeFileSync(filePath, next);
  return next;
}

module.exports = { insertUnderSection, insertItem };
