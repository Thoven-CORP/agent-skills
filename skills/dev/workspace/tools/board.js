// tools/board.js — single source of truth for "does this store item belong on the Dev Kanban".
// Extracted from regen.js so the Map's active/backlog split and the Notion sync agree by construction.
function boardEligible(item) {
  const f = (item && item.fields) || {};
  if (f.type === 'improvement') return false;
  if (f.type === 'techdebt') return f.P === 'P0' || f.P === 'P1';
  // todo / task / bug / prd
  return true;
}
module.exports = { boardEligible };
