// tools/sync.js — deterministic sync-state detection for the Dev Kanban.
// The node layer computes WHAT is out of sync; the SKILL.md verbs perform the
// actual Notion writes (node cannot reach the connector).
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { parseLine } = require('./item.js');
const { boardEligible } = require('./board.js');
const { laneFor } = require('./lane.js');

// A compact, space-free 3-way base marker. Stored in the item's `last-synced:`
// field at the moment local + Notion last agreed. Space-free so it round-trips
// through item.js (which space-tokenizes the comment).
function syncMark({ date, title, status, boardStatus }) {
  const digest = crypto
    .createHash('sha1')
    .update([title, status, boardStatus].join('|'))
    .digest('hex')
    .slice(0, 8);
  return `${date}:${digest}`;
}

// markFor(item, section, date) → the `last-synced:` value this item SHOULD carry
// once local and Notion agree. This is the ONLY supported way to produce a
// marker: pendingSync's clean-check calls it too, so a stamping site and the
// detector can never drift apart.
//
// Why this exists: syncMark takes a loose bag of four strings, and the marker
// digest is over the item's FULL text — not cardTitle(text), which is the
// truncated form used for the Notion card title. Hand-rolling a marker with
// cardTitle produces a value that never matches, so the item reports `update`
// on every single sync forever, firing a redundant Notion write each time. That
// is silent (the write succeeds, the flag just never clears), so pass the item
// and let this compute the tuple.
//
// Returns null for a prd (standalone page — no Status ladder to sync).
function markFor({ item, section = '', date }) {
  const lane = laneFor(item, section);
  if (lane === null) return null;
  return syncMark({ date, title: item.text, status: item.status, boardStatus: lane });
}

// Store item text is long, detailed prose. The Dev Tracker card `Feature / Item`
// title gets a clean truncated form; the full text goes into the card `Notes`.
// Truncate at a word boundary near the cap so titles don't cut mid-word.
// NOTE: this is for the card title ONLY — never feed it into a sync marker.
const TITLE_MAX = 80;
function cardTitle(text) {
  if (!text || text.length <= TITLE_MAX) return text || '';
  const cut = text.slice(0, TITLE_MAX);
  const sp = cut.lastIndexOf(' ');
  return (sp > TITLE_MAX * 0.6 ? cut.slice(0, sp) : cut).trimEnd() + '…';
}

// Compute the exact set of Notion actions needed so the Dev Kanban matches the
// store. Pure over file contents — no Notion calls. The agent's sync-notion /
// bulk-promote verbs execute the returned worklist via MCP, then stamp
// notion:/last-synced: back onto each line. Each entry carries `title` (truncated,
// for the card title) and `text` (full, for the card Notes).
function pendingSync({ storeDir, registers, date }) {
  const work = [];
  for (const { file } of registers) {
    const full = path.join(storeDir, file);
    if (!fs.existsSync(full)) continue;
    let section = ''; // track '## <name>' headers — same rule regen.js uses
    for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
      const h = /^##\s+(.*)/.exec(line);
      if (h) { section = h[1].trim().toLowerCase(); continue; }
      const item = parseLine(line);
      if (!item || !item.fields.id) continue;
      if (!boardEligible(item)) continue;
      const lane = laneFor(item, section);
      if (lane === null) continue; // prd — standalone page, no Status ladder to sync
      const { id, notion, ['last-synced']: base } = item.fields;
      const board = item.fields.type === 'bug' ? 'bug-log' : 'dev-tracker';

      if (!notion) {
        // never pushed → create the card straight into its real lane
        work.push({ id, action: 'create', board, title: cardTitle(item.text), text: item.text, status: item.status, notionId: null, targetStatus: lane });
        continue;
      }
      // Has a card: dirty iff current (title|status|lane) no longer matches the
      // base marker, reconstructed with the base's own date. ANY local change —
      // close, section move, stage: pin, repo/title edit — surfaces here, not
      // just the done→Published transition. Board-only changes (a manual drag)
      // never trip this: local is still clean vs base, so drags survive until
      // local state itself moves.
      const baseDate = typeof base === 'string' && base.includes(':') ? base.split(':')[0] : null;
      const clean = baseDate !== null && base === markFor({ item, section, date: baseDate });
      if (!clean) {
        work.push({ id, action: 'update', board, title: cardTitle(item.text), text: item.text, status: item.status, notionId: notion, targetStatus: lane });
      }
    }
  }
  return work;
}

module.exports = { syncMark, markFor, cardTitle, pendingSync };
