const { test } = require("node:test");
const assert = require("node:assert/strict");
const { appendLog, resolveImbalance } = require("./log.js");

test("logging is idempotent", () => {
  const once = appendLog("# State\n\n## Feature log\n", "OPENED");
  assert.equal(appendLog(once, "OPENED"), once);
});

test("resolution leaves current table and gets one log entry", () => {
  const input = "## Unresolved imbalances\n\n| ID | Finding |\n|---|---|\n| I1 | Missing |\n\n## Feature log\n";
  const result = resolveImbalance(input, "I1", "Mounted at abc123");
  assert.doesNotMatch(result, /\| I1 \|/); assert.equal((result.match(/RESOLVED I1/g) || []).length, 1);
});
