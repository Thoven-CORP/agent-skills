#!/usr/bin/env node
"use strict";

// Move Linear issues to a workflow state and print one short line each.
// The Linear MCP save_issue echoes the whole issue body back (45-49k chars on spec parents), so a
// status-only move through it costs a full read every time (retro 2026-10-03, THV-1047).
//   node set-status.js <state name> THV-1 [THV-2 ...]
//   prints: THV-1 In Progress   (or "THV-1 ERROR <reason>", exit 1)

const { apiKey } = require("./linear.js");

const ISSUE = `query Issue($id: String!) { issue(id: $id) { id identifier team { states { nodes { id name } } } } }`;
const MOVE = `mutation Move($id: String!, $stateId: String!) {
  issueUpdate(id: $id, input: { stateId: $stateId }) { success issue { identifier state { name } } }
}`;

async function gql(key, query, variables) {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: key },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Linear API ${response.status}`);
  const body = await response.json();
  if (body.errors) throw new Error(body.errors[0].message);
  return body.data;
}

async function move(key, identifier, stateName) {
  const { issue } = await gql(key, ISSUE, { id: identifier });
  if (!issue) throw new Error("not found");
  const wanted = stateName.toLowerCase();
  const state = issue.team.states.nodes.find((s) => s.name.toLowerCase() === wanted);
  if (!state) throw new Error(`no state "${stateName}" (have: ${issue.team.states.nodes.map((s) => s.name).join(", ")})`);
  const { issueUpdate } = await gql(key, MOVE, { id: issue.id, stateId: state.id });
  if (!issueUpdate.success) throw new Error("update refused");
  return issueUpdate.issue.state.name;
}

async function main(argv) {
  const [stateName, ...ids] = argv;
  if (!stateName || ids.length === 0) {
    console.error("usage: set-status.js <state name> THV-1 [THV-2 ...]");
    return 2;
  }
  const key = apiKey();
  if (!key) {
    console.error("no Linear key: set LINEAR_API_KEY or write it to ~/.linear-api-key");
    return 2;
  }
  let failed = 0;
  for (const id of ids) {
    try {
      console.log(`${id} ${await move(key, id, stateName)}`);
    } catch (error) {
      console.log(`${id} ERROR ${error.message}`);
      failed = 1;
    }
  }
  return failed;
}

if (require.main === module) main(process.argv.slice(2)).then((code) => process.exit(code));

module.exports = { move };
