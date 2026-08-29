"use strict";

const { execFileSync } = require("node:child_process");
const { fingerprint } = require("./hash.js");

function git(cwd, args, fallback = "") {
  try { return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return fallback; }
}

function lines(value) { return value ? value.split("\n").filter(Boolean) : []; }

function gitFingerprint(cwd) {
  const root = git(cwd, ["rev-parse", "--show-toplevel"], cwd);
  const upstream = git(cwd, ["rev-parse", "--abbrev-ref", "@{upstream}"], null);
  const result = {
    root,
    worktree: git(cwd, ["rev-parse", "--show-toplevel"], cwd),
    head: git(cwd, ["rev-parse", "HEAD"], null),
    branch: git(cwd, ["branch", "--show-current"], "(detached)"),
    upstream,
    staged: lines(git(cwd, ["diff", "--cached", "--name-only"])),
    unstaged: lines(git(cwd, ["diff", "--name-only"])),
    untracked: lines(git(cwd, ["ls-files", "--others", "--exclude-standard"])),
    unpushed: upstream ? Number(git(cwd, ["rev-list", "--count", `${upstream}..HEAD`], "0")) : null,
  };
  result.workingTreeFingerprint = fingerprint({ staged: result.staged, unstaged: result.unstaged, untracked: result.untracked });
  result.fingerprint = fingerprint(result);
  return result;
}

module.exports = { gitFingerprint };
