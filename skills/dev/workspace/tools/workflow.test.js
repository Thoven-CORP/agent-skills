const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseWorkflow } = require("./workflow.js");

test("parses stable lanes and Project-local state law", () => {
  const result = parseWorkflow("`Triage → Backlog → Todo → In Progress → Ready → Done`\nprojects/<project>/\n  CONTINUE_HERE.md\n  STATE.md\nThe main session synthesizes.");
  assert.deepEqual(result.lanes, ["Triage", "Backlog", "Todo", "In Progress", "Ready", "Done", "Canceled"]);
  assert.equal(result.projectStateRequired, true);
  assert.equal(result.mainSessionSynthesis, true);
});
