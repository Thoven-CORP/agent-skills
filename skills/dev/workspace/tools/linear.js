"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { SNAPSHOT_STATES } = require("./states.js");

const QUERY = `query WorkspaceSnapshot($cursor: String) {
  projects(first: 100, includeArchived: true) { nodes { id name targetDate status { name } } }
  issues(first: 250, after: $cursor, filter: { team: { key: { eq: "THV" } } }) {
    pageInfo { hasNextPage endCursor }
    nodes { identifier title description updatedAt state { type name } project { id name } projectMilestone { name } assignee { name } }
  }
}`;

function writesTo(description = "") {
  return description.match(/^Writes to:\s*(.+)$/mi)?.[1]?.trim() || null;
}

// Accepts three shapes: the GraphQL node (identifier/state{}), the Linear MCP record
// (id/status/statusType), and a flat hand-built record.
function normalizeIssue(issue) {
  return {
    identifier: issue.identifier || issue.id,
    title: issue.title || "",
    description: issue.description || "",
    updatedAt: issue.updatedAt || null,
    state: issue.state?.name || issue.state || issue.status || "Unknown",
    stateType: issue.state?.type || issue.stateType || issue.statusType || "unknown",
    project: issue.project?.name || issue.project || null,
    projectId: issue.project?.id || issue.projectId || null,
    milestone: issue.projectMilestone?.name || issue.milestone || null,
    assignee: issue.assignee?.name || issue.assignee || null,
    writesTo: issue.writesTo || writesTo(issue.description),
  };
}

function normalizeLinear(input) {
  const data = input?.data || input || {};
  const issues = data.issues?.nodes || data.issues || [];
  const projects = data.projects?.nodes || data.projects || [];
  return { state: SNAPSHOT_STATES.VERIFIED, issues: issues.map(normalizeIssue), projects };
}

const MCP_FETCH_HINT = [
  "No Linear data supplied.",
  "Fetch the Project's issues with the available authorized Linear MCP connector,",
  "then re-run with --linear-json <file> or --stdin.",
].join(" ");

function linearNotSupplied(reason = MCP_FETCH_HINT) {
  return { state: SNAPSHOT_STATES.ADVISORY, reason, issues: [], projects: [] };
}

function apiKey() {
  if (process.env.LINEAR_API_KEY) return process.env.LINEAR_API_KEY;
  const home = process.env.HOME;
  const file = home ? path.join(home, ".linear-api-key") : null;
  return file && fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : null;
}

async function fetchLinear(key = apiKey()) {
  if (!key) return { state: SNAPSHOT_STATES.UNKNOWN, reason: "Linear access unavailable", issues: [], projects: [] };
  const all = [];
  let cursor = null;
  let projects = [];
  do {
    let response;
    try {
      response = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: key },
        body: JSON.stringify({ query: QUERY, variables: { cursor } }),
      });
    } catch (error) {
      return { state: SNAPSHOT_STATES.UNKNOWN, reason: `Linear unavailable: ${error.message}`, issues: [], projects: [] };
    }
    if (!response.ok) return { state: SNAPSHOT_STATES.UNKNOWN, reason: `Linear API ${response.status}`, issues: [], projects: [] };
    const body = await response.json();
    if (body.errors) return { state: SNAPSHOT_STATES.UNKNOWN, reason: body.errors[0].message, issues: [], projects: [] };
    projects = body.data.projects?.nodes || projects;
    all.push(...(body.data.issues?.nodes || []));
    cursor = body.data.issues?.pageInfo?.hasNextPage ? body.data.issues.pageInfo.endCursor : null;
  } while (cursor);
  return normalizeLinear({ projects, issues: all });
}

module.exports = { MCP_FETCH_HINT, QUERY, apiKey, fetchLinear, linearNotSupplied, normalizeIssue, normalizeLinear, writesTo };
