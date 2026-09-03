const { test } = require("node:test");
const assert = require("node:assert/strict");
const { argsOf } = require("./map.js");

test("preserves feature and family flags", () => {
  assert.equal(argsOf(["--feature", "shell"]).feature, "shell");
  assert.equal(argsOf(["--family", "teacher"]).family, "teacher");
});

test("the API-key path is opt-in, never the default", () => {
  assert.equal(argsOf(["--project", "Teacher: Shell"]).linearApi, false);
  assert.equal(argsOf(["--linear-api"]).linearApi, true);
});

test("accepts JSON/stdin and Project selection", () => {
  assert.deepEqual(argsOf(["--stdin", "--project", "Teacher: Shell", "--project-dir", "/x", "--json"]), { stdin: true, json: true, linearApi: false, project: "Teacher: Shell", projectDir: "/x" });
});
