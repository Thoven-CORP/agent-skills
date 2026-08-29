const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const workspace = require("../../workspace/tools/map.js");
const ledger = require("./reconcile.js");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "shared-snapshot-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  const project = path.join(root, "projects", "shell");
  fs.mkdirSync(path.join(project, "decisions"), { recursive: true });
  fs.writeFileSync(path.join(project, "PRD.md"), "# PRD\n");
  fs.writeFileSync(path.join(project, "STATE.md"), "# STATE\n\n## Unresolved imbalances\n");
  fs.writeFileSync(path.join(project, "decisions", "architecture.md"), "# Architecture\n");
  execFileSync("git", ["add", "projects"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  const linear = path.join(root, "linear.json");
  fs.writeFileSync(linear, JSON.stringify({ issues: [] }));
  return { root, project, linear };
}

test("plain workspace and feature-ledger resolve the same Project snapshot", async () => {
  const { root, project, linear } = fixture();
  const args = ["--linear-json", linear, "--project", "Teacher: Shell", "--project-dir", project, "--repo", root, "--json"];
  const fromWorkspace = JSON.parse(await workspace.main(args, root));
  const fromLedger = JSON.parse(await ledger.main(args, root));
  assert.equal(fromWorkspace.project.name, fromLedger.project.name);
  assert.equal(fromWorkspace.project.dir, fromLedger.project.dir);
  assert.equal(fromWorkspace.snapshotFingerprint, fromLedger.snapshotFingerprint);
});
