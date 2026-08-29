const { test } = require("node:test");
const assert = require("node:assert/strict");
const { concurrentWorkUnits, proofFreshness, reachability, sessionGate } = require("./checks.js");

test("same issue permits disjoint path sets", () => {
  const [result] = concurrentWorkUnits([{ name: "A", issue: "THV-1", paths: ["a.ts"] }, { name: "B", issue: "THV-1", paths: ["b.ts"] }]);
  assert.equal(result.state, "VERIFIED");
});

test("same-file overlap blocks for named integration", () => {
  const [result] = concurrentWorkUnits([{ name: "A", issue: "THV-1", paths: ["a.ts"], integrationSession: "Root" }, { name: "B", issue: "THV-1", paths: ["a.ts"] }]);
  assert.equal(result.state, "BLOCKED"); assert.match(result.message, /Root/);
});

test("existence alone cannot satisfy reachability", () => assert.equal(reachability({ exists: true }).state, "BLOCKED"));

test("proof stales on commit or tree change", () => {
  assert.equal(proofFreshness({ commit: "a", workingTreeFingerprint: "x" }, { head: "b", workingTreeFingerprint: "x" }).state, "STALE");
  assert.equal(proofFreshness({ commit: "a", workingTreeFingerprint: "x" }, { head: "a", workingTreeFingerprint: "y" }).state, "STALE");
});

test("stage gate requires claimed routed work", () => {
  assert.equal(sessionGate({ identifier: "THV-1", state: "In Progress", assignee: "A", milestone: "Build", writesTo: "x" }).state, "VERIFIED");
  assert.equal(sessionGate({ identifier: "THV-1", state: "Todo" }).state, "BLOCKED");
});
