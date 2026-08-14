// tools/lane.js — single source of truth: store item state → board Status lane.
// Replaces the old two-point model (create → Backlog, close → Published) that
// left every in-flight item stranded in Backlog. The lane is DERIVED from the
// item's real state so the kanban mirrors the store without hand-dragging.
//
// Option strings are copied VERBATIM from the live boards (references/notion.md)
// — typos included. Do NOT "correct" them: Notion select writes need an exact match.
const DEV_LANES = [
  'Speccing', 'Backend dev', 'Front end dev', 'Code Review/PR', 'Tech Debt',
  'Manual QA', 'Keri testing', 'Backlog', 'Potential Design Impovments',
  'Tests & Edge cases to check', 'Production/Published', 'Future Improvements',
  'Published',
];
const BUG_LANES = ['Reported', 'In Triage', 'In Progress', 'Verified', 'Fixed'];

// `stage:` field values are space-free (item.js space-tokenizes the comment),
// so accept dash/underscore forms (stage:Keri-testing) and resolve to canonical.
const canon = (s) => String(s).replace(/[-_]/g, ' ').toLowerCase();
const DEV_BY_KEY = new Map(DEV_LANES.map((l) => [canon(l), l]));
const BUG_BY_KEY = new Map(BUG_LANES.map((l) => [canon(l), l]));

// laneFor(item, section) → the board Status this item belongs in right now,
// or null when the item has no board ladder (prd = standalone page).
// `section` = the register section header the line sits under, lowercased
// ('in progress' / 'backlog' / '' for section-less registers).
//
// Precedence: done > explicit stage: pin > type/section/repo derivation.
function laneFor(item, section = '') {
  const f = (item && item.fields) || {};
  const done = item.status === 'done';
  const inProgress = String(section).toLowerCase().includes('in progress');

  if (f.type === 'prd') return null; // standalone page under the Hub — no Status ladder

  if (f.type === 'bug') { // Bug Log vocab
    if (done) return 'Fixed';
    if (f.stage && BUG_BY_KEY.has(canon(f.stage))) return BUG_BY_KEY.get(canon(f.stage));
    return inProgress ? 'In Progress' : 'Reported';
  }

  // Dev Tracker vocab (todo / task / techdebt)
  if (done) return 'Published';
  if (f.stage && DEV_BY_KEY.has(canon(f.stage))) return DEV_BY_KEY.get(canon(f.stage)); // pin wins
  if (f.type === 'techdebt') return 'Tech Debt';
  if (inProgress) {
    if (f.repo === 'backend') return 'Backend dev';
    if (f.repo === 'frontend') return 'Front end dev';
    return 'Speccing'; // cross-stack / unscoped in-flight — pin with stage: if wrong
  }
  return 'Backlog';
}

module.exports = { laneFor, DEV_LANES, BUG_LANES };
