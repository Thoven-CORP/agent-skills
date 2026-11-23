#!/usr/bin/env node
"use strict";

// Gathers the sweep's inputs. Reads only: Linear through the API key set-status.js uses, GitHub
// through gh, and git. Every failed source exits non-zero, so a missing source never looks clean.
//   node collect.js linear --project "<name or slugId>" [--project ...] | --all-open   > issues.json
//   node collect.js evidence [--limit 2000]                                             > evidence.json

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = process.env.THOVEN_ROOT || path.join(os.homedir(), "thoven");
// gh pr list reads GitHub's GraphQL API; gh pr list --search goes through search, capped at 30 a minute.
const REPOS = [
  { repo: "frontend", gh: "Thoven-CORP/frontend-remote" },
  { repo: "backend", gh: "Thoven-CORP/backend-remote" },
];
const COMMIT_REPOS = ["frontend", "backend", "agent-skills"];

function run(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"], ...opts });
  } catch (error) {
    throw new Error(cmd + " " + args.slice(0, 3).join(" ") + ": " + String(error.stderr || error.message).trim().split("\n")[0]);
  }
}

function parseLsRemote(text, repo) {
  return text.split("\n").filter(Boolean).map((line) => {
    const [sha, ref] = line.split("\t");
    return { repo, name: ref.replace(/^refs\/heads\//, ""), sha };
  }).filter((b) => b.name !== "main");
}

// The primary checkout is a worktree too, and never one to remove, so its block is skipped.
function parseWorktrees(text, repo, primary) {
  return text.split("\n\n").map((block) => {
    const tree = {};
    for (const line of block.split("\n")) {
      if (line.startsWith("worktree ")) tree.path = line.slice(9);
      else if (line.startsWith("branch ")) tree.branch = line.slice(7).replace(/^refs\/heads\//, "");
    }
    return tree.path && tree.path !== primary ? { repo, path: tree.path, branch: tree.branch || null } : null;
  }).filter(Boolean);
}

function parseLog(text, repo) {
  return text.split("\x1e").map((r) => r.trim()).filter(Boolean).map((record) => {
    const [sha, subject, body] = record.split("\x1f");
    return { repo, sha, subject, body: body || "" };
  });
}

function evidence(limit) {
  const prs = [];
  for (const { repo, gh } of REPOS) {
    const list = JSON.parse(run("gh", ["pr", "list", "--repo", gh, "--state", "all", "--limit", String(limit),
      "--json", "number,title,headRefName,baseRefName,state,mergedAt,url,body"]));
    if (list.length >= limit) process.stderr.write("collect: " + gh + " has more than " + limit + " PRs; raise --limit to read the oldest\n");
    prs.push(...list.map((pr) => ({ repo, ...pr })));
  }
  const branches = [];
  const worktrees = [];
  for (const { repo } of REPOS) {
    const dir = path.join(ROOT, repo);
    branches.push(...parseLsRemote(run("git", ["-C", dir, "ls-remote", "--heads", "origin"]), repo));
    worktrees.push(...parseWorktrees(run("git", ["-C", dir, "worktree", "list", "--porcelain"]), repo, fs.realpathSync(dir)));
  }
  const commits = [];
  for (const repo of COMMIT_REPOS) {
    const dir = path.join(ROOT, repo);
    // A ticket built straight onto a Project's integration branch shows only in that branch's log.
    run("git", ["-C", dir, "fetch", "--quiet", "origin", "main", "+refs/heads/*/integration:refs/remotes/origin/*/integration"]);
    const refs = ["origin/main", ...run("git", ["-C", dir, "for-each-ref", "--format=%(refname:short)", "refs/remotes/origin/*/integration"]).split("\n").filter(Boolean)];
    for (const ref of refs) {
      const range = ref === "origin/main" ? ref : "origin/main.." + ref;
      commits.push(...parseLog(run("git", ["-C", dir, "log", range, "-i", "--grep=THV-", "--format=%h%x1f%s%x1f%b%x1e"]), repo).map((c) => ({ ...c, ref })));
    }
  }
  return { collectedAt: new Date().toISOString(), prs, branches, worktrees, commits };
}

const COMMENT_PAGE = "pageInfo { hasNextPage endCursor } nodes { body }";
const ISSUE_FIELDS = "id identifier title description state { name type } labels { nodes { name } } parent { identifier } project { name } comments(first: 30) { " + COMMENT_PAGE + " }";
const MORE_COMMENTS = "query ($id: String!, $cursor: String) { issue(id: $id) { comments(first: 100, after: $cursor) { " + COMMENT_PAGE + " } } }";
const PROJECTS = "query { projects(first: 200) { nodes { id name slugId status { type } } } }";
const ISSUES = "query ($id: String!, $cursor: String) { project(id: $id) { name documents(first: 50) { nodes { title updatedAt url } } issues(first: 50, after: $cursor, includeArchived: true) { pageInfo { hasNextPage endCursor } nodes { " + ISSUE_FIELDS + " } } } }";

async function gql(key, query, variables) {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: key },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error("Linear API " + response.status);
  const body = await response.json();
  if (body.errors) throw new Error(body.errors[0].message);
  return body.data;
}

// Reads every page of an issue's comments, so a yes in a late comment still counts.
async function allComments(issue, fetchPage) {
  const comments = issue.comments || { nodes: [] };
  const nodes = [...(comments.nodes || [])];
  let page = comments.pageInfo;
  while (page?.hasNextPage) {
    const next = await fetchPage(page.endCursor);
    nodes.push(...next.nodes);
    page = next.pageInfo;
  }
  return { ...issue, comments: { nodes } };
}

async function linear(selectors, allOpen) {
  const { apiKey } = require("../../workspace/tools/linear.js");
  const key = apiKey();
  if (!key) throw new Error("no Linear key: set LINEAR_API_KEY or write it to ~/.linear-api-key");
  const { projects } = await gql(key, PROJECTS);
  const wanted = allOpen
    ? projects.nodes.filter((p) => !["completed", "canceled"].includes(p.status?.type))
    : selectors.map((s) => {
      const hit = projects.nodes.find((p) => [p.name.toLowerCase(), p.slugId].includes(s.toLowerCase()) || s.endsWith("-" + p.slugId));
      if (!hit) throw new Error("no Project named " + JSON.stringify(s) + " (a P-THV-n id needs the Linear MCP; pass the name)");
      return hit;
    });
  const issues = [];
  const documents = [];
  for (const project of wanted) {
    let cursor = null;
    do {
      const data = await gql(key, ISSUES, { id: project.id, cursor });
      if (!cursor) documents.push(...data.project.documents.nodes.map((d) => ({ project: project.name, ...d })));
      for (const issue of data.project.issues.nodes) {
        issues.push(await allComments(issue, async (after) => (await gql(key, MORE_COMMENTS, { id: issue.id, cursor: after })).issue.comments));
      }
      cursor = data.project.issues.pageInfo.hasNextPage ? data.project.issues.pageInfo.endCursor : null;
    } while (cursor);
  }
  return { projects: wanted.map((p) => p.name), issues, documents };
}

async function main(argv) {
  const [command, ...rest] = argv;
  const selectors = [];
  let allOpen = false;
  let limit = 2000;
  for (let i = 0; i < rest.length; i += 1) {
    if (rest[i] === "--project") selectors.push(rest[++i]);
    else if (rest[i] === "--all-open") allOpen = true;
    else if (rest[i] === "--limit") limit = Number(rest[++i]);
  }
  if (command === "evidence") return evidence(limit);
  if (command === "linear" && (allOpen || selectors.length)) return linear(selectors, allOpen);
  throw new Error("usage: collect.js linear --project <name> | --all-open; collect.js evidence [--limit n]");
}

if (require.main === module) {
  main(process.argv.slice(2)).then((out) => process.stdout.write(JSON.stringify(out) + "\n")).catch((error) => {
    process.stderr.write("collect failed: " + String(error.message).replace(/lin_api_\w+/g, "lin_api_[redacted]") + "\n");
    process.exitCode = 1;
  });
}

module.exports = { allComments, parseLog, parseLsRemote, parseWorktrees };
