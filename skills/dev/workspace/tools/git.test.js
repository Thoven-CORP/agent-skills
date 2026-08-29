const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { gitFingerprint } = require("./git.js");

function run(cwd, args) { execFileSync("git", args, { cwd, stdio: "ignore" }); }
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workspace-git-"));
  run(dir, ["init", "-q"]); run(dir, ["config", "user.email", "test@example.com"]); run(dir, ["config", "user.name", "Test"]);
  fs.writeFileSync(path.join(dir, "tracked.txt"), "one\n"); run(dir, ["add", "tracked.txt"]); run(dir, ["commit", "-qm", "base"]);
  return dir;
}

test("fingerprints complete git state", () => {
  const dir = repo();
  fs.appendFileSync(path.join(dir, "tracked.txt"), "two\n");
  fs.writeFileSync(path.join(dir, "stage.txt"), "stage\n"); run(dir, ["add", "stage.txt"]);
  fs.writeFileSync(path.join(dir, "loose.txt"), "loose\n");
  const result = gitFingerprint(dir);
  assert.ok(result.head); assert.ok(result.branch); assert.deepEqual(result.staged, ["stage.txt"]);
  assert.deepEqual(result.unstaged, ["tracked.txt"]); assert.deepEqual(result.untracked, ["loose.txt"]);
  assert.equal(result.unpushed, null); assert.ok(result.fingerprint); assert.ok(result.workingTreeFingerprint);
});

test("exact-path commit preserves unrelated dirty and untracked files", () => {
  const dir = repo();
  fs.writeFileSync(path.join(dir, "unit.txt"), "unit\n");
  fs.appendFileSync(path.join(dir, "tracked.txt"), "unrelated\n");
  fs.writeFileSync(path.join(dir, "scratch.txt"), "scratch\n");
  run(dir, ["add", "unit.txt"]); run(dir, ["commit", "-qm", "unit"]);
  const result = gitFingerprint(dir);
  assert.deepEqual(result.unstaged, ["tracked.txt"]); assert.deepEqual(result.untracked, ["scratch.txt"]);
});
