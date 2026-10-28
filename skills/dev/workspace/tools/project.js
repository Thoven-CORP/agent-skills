"use strict";

const fs = require("node:fs");
const path = require("node:path");

function projectName(projectDir) {
  return path.basename(projectDir).replace(/^\d+-/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function findProjectDir(start) {
  let current = path.resolve(start);
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, "PRD.md")) && fs.existsSync(path.join(current, "decisions"))) return current;
    current = path.dirname(current);
  }
  return null;
}

function resolveProject({ cwd = process.cwd(), explicitDir = null, explicitName = null } = {}) {
  const dir = explicitDir ? path.resolve(explicitDir) : findProjectDir(cwd);
  return { dir, name: explicitName || (dir ? projectName(dir) : null), source: explicitName || explicitDir ? "argument" : dir ? "cwd" : "unknown" };
}

module.exports = { findProjectDir, projectName, resolveProject };
