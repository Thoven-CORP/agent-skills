// regen.js — the anti-staleness core. The STATE Map is DERIVED by scanning the
// register files, so it cannot drift the way a hand-maintained current_phase can.
// Pure over provided file contents — no git call here (git reconciliation is
// layered in by the `resume` verb, kept out of the unit so it stays testable).
//
// The Map is a DECISION surface ("what do I work on"), not an inventory. So it is
// rendered in tiers, not as a flat dump:
//   🔵 In flight — todos/tasks/bugs/prds under TODO.md "## In Progress" (+ P0 debt)
//   🟡 Queued    — TODO.md "## Backlog" work + P1 tech-debt (near-term)
//   📚 Backlog   — improvements + P2/P3 tech-debt COLLAPSED to themed counts +
//                  file pointers. Ideas are inventory; you drill into the file for
//                  them and promote one to a todo when you actually work it.
// Within a tier, rows are TRUNCATED (scan surface — full text lives in the file)
// and 🚧 parked/blocked items sink to the bottom.
const fs = require('node:fs');
const path = require('node:path');
const { parseLine } = require('./item.js');
const { boardEligible } = require('./board.js');

// Render-time theme buckets for backlog improvements. Hybrid: an item's explicit
// `group:` field WINS (authoritative, set it on the few the heuristic gets wrong);
// otherwise the keyword rules below infer a theme (first match wins, else "misc").
// So you never have to tag the whole pile — only the exceptions earn a `group:`.
const THEME_RULES = [
  ['u17/tldraw', /u17|tldraw|sync[-_ ]?(core|token|state)|SYNC_|capstream|R2 Bucket/i],
  ['teach-mode-polish', /\bB-\d|\bSB-\d|metronome|openmoji|canvas|whiteboard|waiting variant|toolbar|emoji|recording/i],
  ['scheduling', /schedul|booking|recurr|reschedule|calendar|availab|slot|credit/i],
  ['marketplace', /marketplace/i],
  ['email/leads', /email|ESA|lead|unsubscribe|nurture/i],
  ['perf/infra', /caching|optimization|scaling|puma|stripe connect|backfill|materializ|queue/i],
  ['homework', /\bhw-|homework/i],
  ['ai-data', /\bAI-|AI-Powered|AI-Ready|match-to-outcome|feedback collection|conversions api/i],
  ['reviews', /review/i],
  ['dogfood', /dogfood/i],
];
function themeOf(item) {
  if (item.fields && item.fields.group) return item.fields.group; // explicit override wins
  for (const [name, re] of THEME_RULES) if (re.test(item.text)) return name;
  return 'misc';
}

// Expanded-tier rows show a SHORT form — the Map scans, the register file holds
// the detail. Truncate at a word boundary near the cap.
const MAX_ROW = 120;
function shortText(text) {
  if (text.length <= MAX_ROW) return text;
  const cut = text.slice(0, MAX_ROW);
  const sp = cut.lastIndexOf(' ');
  return (sp > MAX_ROW * 0.6 ? cut.slice(0, sp) : cut).trimEnd() + '…';
}

// Items whose text flags them blocked/paused/gated/his-action get a 🚧 marker
// and sink to the bottom of their tier, so "in flight" reads as actually-in-flight.
// (Deliberately NOT matching "parked" — it shows up in resolved historical prose.)
const PARKED_RE = /\bBLOCKED\b|\bPAUSED\b|\bGATED\b|\bHOLD\b|Andres-action/i;

function regenerateMap({ storeDir, registers }) {
  const inFlight = []; // {row, parked} — active todos/tasks/bugs/prds + P0 debt
  const queued = []; // {row, parked} — ## Backlog work + P1 tech-debt
  const impThemes = {}; // theme -> count
  let impTotal = 0;
  const debtLow = {}; // P-level -> count (P2/P3/other)
  let debtLowTotal = 0;

  for (const { file } of registers) {
    const full = path.join(storeDir, file);
    if (!fs.existsSync(full)) continue;
    let section = '';
    for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
      const h = line.match(/^##+\s+(.*)/); // ## sub-headers (not the # title)
      if (h) { section = h[1].trim().toLowerCase(); continue; }
      const item = parseLine(line);
      if (!item || !item.fields.id || item.status === 'done') continue;
      const { id, type } = item.fields;
      const repo = item.fields.repo || '?';

      if (type === 'improvement') {
        const t = themeOf(item);
        impThemes[t] = (impThemes[t] || 0) + 1;
        impTotal += 1;
        continue;
      }

      // Everything below lands in an expanded tier — compute the shared display bits.
      const parked = PARKED_RE.test(item.text);
      const flag = parked ? '🚧 ' : '';

      // NOTE: board-eligibility (tools/board.js boardEligible) MUST match this
      // classification — improvement + P2/P3 techdebt are backlog (not on board),
      // everything else is in-flight/queued (on board). If you change one, change both.
      if (type === 'techdebt') {
        const p = item.fields.P || 'other';
        if (p !== 'P0' && p !== 'P1') {
          debtLow[p] = (debtLow[p] || 0) + 1;
          debtLowTotal += 1;
          continue;
        }
        const row = `- ${id} [${p}] ${flag}${shortText(item.text)} (${repo})`;
        (p === 'P0' ? inFlight : queued).push({ row, parked });
        continue;
      }

      // todo / task / bug / prd — split by TODO.md section
      const row = `- ${id} [${item.status}] ${flag}${shortText(item.text)} (${repo})`;
      (section.includes('in progress') ? inFlight : queued).push({ row, parked });
    }
  }

  // Preserve the "empty store → empty string" contract (the resume verb maps
  // that to "_(empty)_"), so an empty store never renders bare tier headers.
  if (inFlight.length + queued.length + impTotal + debtLowTotal === 0) return '';

  // Stable sort sinks parked items to the bottom of each tier, active order kept.
  const render = (arr) =>
    arr.slice().sort((a, b) => (a.parked ? 1 : 0) - (b.parked ? 1 : 0)).map((x) => x.row).join('\n');

  const out = [];
  out.push(`### 🔵 In flight (${inFlight.length})`);
  out.push(inFlight.length ? render(inFlight) : '_(none)_');
  out.push('');
  out.push(`### 🟡 Queued (${queued.length})`);
  out.push(queued.length ? render(queued) : '_(none)_');

  if (impTotal + debtLowTotal > 0) {
    out.push('');
    out.push(`### 📚 Backlog — themes only, drill into files (${impTotal + debtLowTotal})`);
    if (impTotal) {
      const themes = Object.entries(impThemes)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k} ·${v}`)
        .join('   ');
      out.push(`- 💡 Improvements (${impTotal}) → FUTURE_IMPROVEMENTS.md`);
      out.push(`     ${themes}`);
    }
    if (debtLowTotal) {
      const bd = Object.entries(debtLow)
        .sort()
        .map(([k, v]) => `${k} ·${v}`)
        .join(' · ');
      out.push(`- 🔧 Tech-debt low-pri (${debtLowTotal}) → TECH_DEBT.md   (${bd})`);
    }
  }
  return out.join('\n');
}
module.exports = { regenerateMap, themeOf };
