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

test("one owner per fact, and the write tools include documents and Project Updates", () => {
  assert.match(workflow, /\| Decision \| The Project's governing decision document/);
  assert.match(workflow, /\| Handoff, progress, and risk \| The latest Project Update/);
  assert.doesNotMatch(workflow, /decisions\/architecture\.md/);
  assert.match(workflow, /save_document/);
  assert.match(workflow, /save_status_update/);
  assert.doesNotMatch(workflow, /Linear's write tools are `save_issue` and `save_comment`/);
});
