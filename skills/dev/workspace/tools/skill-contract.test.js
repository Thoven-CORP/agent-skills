const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const skill = fs.readFileSync(path.join(root, "SKILL.md"), "utf8");
const workflow = fs.readFileSync(path.join(root, "references", "WORKFLOW.md"), "utf8");

test("description fires on a ruling, a finished grill, and a doc update", () => {
  const description = skill.slice(0, skill.indexOf("# Workspace"));
  assert.match(description, /make it the accordion/);
  assert.match(description, /grill or spec/);
  assert.match(description, /Project Update/);
});

test("a ruling is written when it is said, and close only mines what that pass missed", () => {
  assert.match(skill, /## Ruling/);
  assert.match(skill, /does not wait for capture, close, or log/);
  assert.match(skill, /Mark each one\n\s*written, amended, missing, or contradicted/);
  assert.match(skill, /A new snapshot fingerprint does not prove the text/);
});

test("a confirmed grill or product brief is a fixed write in the same turn", () => {
  assert.match(skill, /\| `grill` \|/);
  assert.match(skill, /\| `brief` \|/);
  assert.match(skill, /Apply it in the same turn/);
});

test("one home per kind of writing, and the write tools include documents and Project Updates", () => {
  assert.match(skill, /\| Current truth: .*\| The Project's Spec document/);
  assert.match(skill, /\| History: .*\| The Project's Log document/);
  assert.match(skill, /\| Progress, risk, handoff, next step \| A Project Update/);
  assert.doesNotMatch(workflow, /### Decision entry/);
  assert.doesNotMatch(workflow, /decisions\/architecture\.md/);
  assert.match(workflow, /save_document/);
  assert.match(workflow, /save_status_update/);
  assert.doesNotMatch(workflow, /Linear's write tools are `save_issue` and `save_comment`/);
});
