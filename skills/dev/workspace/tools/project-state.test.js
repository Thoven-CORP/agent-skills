const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseProjectState } = require("./project-state.js");

test("parses Project state sections", () => {
  const state = parseProjectState(`# State\n\n## Coverage\n\n| Surface | Authority |\n|---|---|\n| Shell | decisions/design.md#D1 |\n\n## Commit ledger\n\n| Unit | Commit |\n|---|---|\n| Shell | abc123 |\n\n## Unresolved imbalances\n\n| ID | Finding |\n|---|---|\n| I1 | missing mount |\n\n## Feature log\n\n- OPENED`, "/x/projects/shell/STATE.md");
  assert.equal(state.coverage[0].Authority, "decisions/design.md#D1");
  assert.equal(state.commits[0].Commit, "abc123");
  assert.equal(state.imbalances[0].ID, "I1");
  assert.deepEqual(state.log, ["- OPENED"]);
  assert.equal(state.compatibility, false);
});

test("marks audience-level state as compatibility input", () => {
  assert.equal(parseProjectState("# State", "/x/teacher-2.0/STATE.md").compatibility, true);
});
