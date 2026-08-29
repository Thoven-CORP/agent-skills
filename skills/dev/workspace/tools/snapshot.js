"use strict";

const { fingerprint } = require("./hash.js");
const { SNAPSHOT_STATES: S } = require("./states.js");
const { sessionGate } = require("./checks.js");

const rank = { started: 0, unstarted: 1, triage: 2, backlogged: 3, completed: 4, canceled: 5, unknown: 6 };

function projectIssues(linear, identity) {
  const needle = (identity.name || "").toLowerCase();
  return linear.issues.filter((issue) => issue.project && issue.project.toLowerCase() === needle)
    .sort((a, b) => (rank[a.stateType] ?? 9) - (rank[b.stateType] ?? 9) || a.identifier.localeCompare(b.identifier, undefined, { numeric: true }));
}

function deriveSnapshot({ identity, linear, git, projectState, workflow = null, related = [] }) {
  const tickets = projectIssues(linear, identity);
  const active = tickets.filter((ticket) => !["completed", "canceled"].includes(ticket.stateType));
  const current = active.find((ticket) => ticket.stateType === "started") || active[0] || null;
  const findings = [];
  if (linear.state === S.UNKNOWN) findings.push({ state: S.UNKNOWN, code: "linear", message: linear.reason || "Linear access unavailable" });
  else findings.push(sessionGate(current));
  if (!identity.dir) findings.push({ state: S.UNKNOWN, code: "project-folder", message: "Project folder could not be resolved" });
  if (!projectState.source) findings.push({ state: S.UNKNOWN, code: "project-state", message: "Project STATE.md is missing" });
  else if (projectState.compatibility) findings.push({ state: S.ADVISORY, code: "compatibility-state", message: `Using audience-level compatibility input: ${projectState.source}` });
  if (projectState.imbalances.length) findings.push({ state: S.CONTRADICTED, code: "imbalances", message: `${projectState.imbalances.length} unresolved imbalance(s)` });
  const base = { project: identity, tickets, git, projectState, workflow, relatedSessions: related, findings };
  const snapshotFingerprint = fingerprint(base);
  const blockers = findings.filter((item) => [S.BLOCKED, S.CONTRADICTED].includes(item.state));
  const unknowns = findings.filter((item) => item.state === S.UNKNOWN);
  return {
    ...base,
    snapshotFingerprint,
    completionClaim: blockers.length ? S.BLOCKED : unknowns.length ? S.UNKNOWN : S.VERIFIED,
    next: current ? `${current.identifier}: ${current.title}` : tickets.length ? "$feature-ledger reconcile" : "$workspace capture",
  };
}

module.exports = { deriveSnapshot, projectIssues };
