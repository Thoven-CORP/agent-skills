const { test } = require("node:test");
const assert = require("node:assert/strict");
const { deriveSnapshot } = require("./snapshot.js");
const { normalizeLinear } = require("./linear.js");
const { renderSnapshot } = require("./render.js");

const git = { head: "abc", branch: "main", fingerprint: "git1", workingTreeFingerprint: "tree1" };
const projectState = { source: "/x/projects/shell/STATE.md", compatibility: false, imbalances: [], coverage: [], commits: [], log: [] };

test("snapshot renders bare invocation contract and history", () => {
  const linear = normalizeLinear({ issues: [
    { identifier: "THV-1", title: "Build", state: { type: "started", name: "In Progress" }, project: { name: "Teacher: Shell" }, projectMilestone: { name: "Build" }, assignee: { name: "A" }, description: "Writes to: x" },
    { identifier: "THV-2", title: "Old", state: { type: "completed", name: "Done" }, project: { name: "Teacher: Shell" } },
  ] });
  const snapshot = deriveSnapshot({ identity: { name: "Teacher: Shell", dir: "/x/projects/shell" }, linear, git, projectState });
  assert.equal(snapshot.tickets.length, 2);
  const output = renderSnapshot(snapshot);
  for (const label of ["Project:", "Snapshot:", "Ticket ledger:", "Mechanical findings:", "Completion claim:", "Next:"]) assert.match(output, new RegExp(label));
});

test("shared engine is deterministic for both skill consumers", () => {
  const input = { identity: { name: "Teacher: Shell", dir: "/x/projects/shell" }, linear: normalizeLinear({ issues: [] }), git, projectState };
  assert.equal(deriveSnapshot(input).snapshotFingerprint, deriveSnapshot(input).snapshotFingerprint);
});
