const { test } = require("node:test");
const assert = require("node:assert/strict");
const { relatedSessions } = require("./sessions.js");

test("includes matching sessions and excludes unrelated panes", () => {
  const sessions = [{ id: 1, project: "Teacher: Shell" }, { id: 2, issue: "THV-7" }, { id: 3, project: "Parent: Onboarding" }];
  assert.deepEqual(relatedSessions(sessions, { project: "Teacher: Shell", issueIds: ["THV-7"] }).map((s) => s.id), [1, 2]);
});
