"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { sections, table } = require("./markdown.js");

function parseProjectState(markdown, source = "STATE.md") {
  const parsed = sections(markdown);
  return {
    source,
    compatibility: !/projects[\\/]/.test(source),
    coverage: table(parsed.Coverage || ""),
    commits: table(parsed["Commit ledger"] || ""),
    imbalances: table(parsed["Unresolved imbalances"] || ""),
    log: (parsed["Feature log"] || "").split("\n").filter((line) => /^[-*]\s+/.test(line)),
  };
}

function readProjectState(projectDir, compatibilityDirs = []) {
  const candidates = [projectDir, ...compatibilityDirs].map((dir) => path.join(dir, "STATE.md"));
  const source = candidates.find((candidate) => fs.existsSync(candidate));
  if (!source) return { source: null, compatibility: false, coverage: [], commits: [], imbalances: [], log: [] };
  return parseProjectState(fs.readFileSync(source, "utf8"), source);
}

module.exports = { parseProjectState, readProjectState };
