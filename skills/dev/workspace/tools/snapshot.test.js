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

test("missing Linear access never routes to a write intent", () => {
  const snapshot = deriveSnapshot({
    identity: { name: "Teacher: Business", dir: "/x/projects/business" },
    linear: { state: "UNKNOWN", reason: "Linear unavailable: fetch failed", issues: [], projects: [] },
    git,
    projectState: { ...projectState, source: "/x/STATE.md", compatibility: true },
  });
  assert.match(snapshot.next, /Linear MCP connector/);
  assert.doesNotMatch(snapshot.next, /Restore Linear access/);
});

test("no Linear data supplied is advisory context but completion remains unknown", () => {
  const { linearNotSupplied } = require("./linear.js");
  const snapshot = deriveSnapshot({
    identity: { name: "Teacher: Business", dir: "/x/projects/business" },
    linear: linearNotSupplied(),
    git,
    projectState,
  });
  const finding = snapshot.findings.find((item) => item.code === "linear-input");
  assert.equal(finding.state, "ADVISORY");
  assert.match(finding.message, /authorized Linear MCP connector/);
  assert.equal(snapshot.completionClaim, "UNKNOWN");
  assert.match(snapshot.next, /--linear-json <file> or --stdin/);
  assert.match(renderSnapshot(snapshot), /no Linear data supplied/);
});

test("a Duplicate is closed work and is never the next issue", () => {
  // Linear reports `duplicate` as its own statusType. While it was missing from the
  // terminal list, a Project whose work was entirely finished still reported BLOCKED
  // with the Duplicate named as next.
  const linear = normalizeLinear({ issues: [
    { identifier: "THV-1", title: "Shipped", state: { type: "completed", name: "Done" }, project: { name: "Teacher: Shell" } },
    { identifier: "THV-2", title: "Dupe", state: { type: "duplicate", name: "Duplicate" }, project: { name: "Teacher: Shell" } },
  ] });
  const snapshot = deriveSnapshot({ identity: { name: "Teacher: Shell", dir: "/x/projects/shell" }, linear, git, projectState });
  assert.doesNotMatch(snapshot.next, /THV-2/, "a Duplicate is never named as the next issue");
  assert.equal(snapshot.next, "$feature-ledger reconcile", "a terminal ledger routes to reconcile, not to a ticket");
  assert.equal(snapshot.completionClaim, "VERIFIED", "every issue is terminal, so nothing blocks the claim");
  const gate = snapshot.findings.find((f) => f.code === "session-gate");
  assert.equal(gate.state, "VERIFIED");
  assert.match(gate.message, /every issue in this Project is complete/);
});

const readyLinear = normalizeLinear({ issues: [
  { identifier: "THV-1", title: "Check", state: "In Progress", stateType: "started",
    project: "Remote pilot", milestone: "Build", assignee: "A", description: "Writes to: this ticket" },
] });
const noLocalState = { source: null, compatibility: false, imbalances: [], coverage: [], commits: [], log: [] };

test("a named Linear project starts without any local project files", () => {
  const snapshot = deriveSnapshot({ identity: { name: "Remote pilot", dir: null }, linear: readyLinear, git, projectState: noLocalState });
  assert.equal(snapshot.completionClaim, "VERIFIED");
  assert.equal(snapshot.next, "THV-1: Check");
  assert.ok(!snapshot.findings.some(f => f.state === "UNKNOWN" || f.state === "BLOCKED"));
});

test("historical local imbalances do not override a ready Linear task", () => {
  const snapshot = deriveSnapshot({ identity: { name: "Remote pilot", dir: "/old" }, linear: readyLinear, git,
    projectState: { ...noLocalState, source: "/old/STATE.md", imbalances: ["old open item"] } });
  assert.equal(snapshot.completionClaim, "VERIFIED");
  assert.equal(snapshot.findings.find(f => f.code === "imbalances").state, "ADVISORY");
});

test("missing project identity and inaccessible Linear data stay unknown", () => {
  const snapshot = deriveSnapshot({ identity: { name: null, dir: null },
    linear: { state: "UNKNOWN", reason: "required Linear source unavailable", issues: [], projects: [] }, git, projectState: noLocalState });
  assert.equal(snapshot.completionClaim, "UNKNOWN");
  assert.ok(snapshot.findings.some(f => f.code === "project-identity"));
  assert.match(snapshot.next, /Linear/);
});
