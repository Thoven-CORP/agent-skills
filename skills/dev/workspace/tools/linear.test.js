const { test } = require("node:test");
const assert = require("node:assert/strict");
const { fetchLinear, normalizeLinear, writesTo } = require("./linear.js");
const { SNAPSHOT_STATES } = require("./states.js");

test("keeps open, Done, and Canceled history", () => {
  const result = normalizeLinear({ issues: [
    { identifier: "THV-1", title: "Open", state: { type: "started", name: "In Progress" }, project: { name: "Teacher: Shell" } },
    { identifier: "THV-2", title: "Done", state: { type: "completed", name: "Done" }, project: { name: "Teacher: Shell" } },
    { identifier: "THV-3", title: "No", state: { type: "canceled", name: "Canceled" }, project: { name: "Teacher: Shell" } },
  ] });
  assert.deepEqual(result.issues.map((issue) => issue.stateType), ["started", "completed", "canceled"]);
});

test("extracts exact Writes to path", () => assert.equal(writesTo("Why\nWrites to: foo/bar.md\n"), "foo/bar.md"));

test("missing Linear access is UNKNOWN", async () => {
  const result = await fetchLinear(null);
  assert.equal(result.state, SNAPSHOT_STATES.UNKNOWN);
});

test("a Linear network rejection is UNKNOWN rather than a thrown snapshot", async () => {
  const original = global.fetch;
  global.fetch = async () => { throw new Error("network down"); };
  try {
    const result = await fetchLinear("linapi_test_key");
    assert.equal(result.state, SNAPSHOT_STATES.UNKNOWN);
    assert.match(result.reason, /network down/);
  } finally {
    global.fetch = original;
  }
});
