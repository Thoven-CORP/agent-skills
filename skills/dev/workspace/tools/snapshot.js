"use strict";

const { fingerprint } = require("./hash.js");
const { SNAPSHOT_STATES: S } = require("./states.js");
const { sessionGate } = require("./checks.js");
const { MCP_FETCH_HINT } = require("./linear.js");

// Terminal states close an issue. `duplicate` belongs here: Linear reports it as its own
// statusType, and leaving it out made a Duplicate count as active — so a Project whose work
// was entirely finished still reported BLOCKED, with the Duplicate named as the next issue.
const TERMINAL = Object.freeze(["completed", "canceled", "duplicate"]);
const rank = { started: 0, unstarted: 1, triage: 2, backlogged: 3, completed: 4, canceled: 5, duplicate: 6, unknown: 7 };

function projectIssues(linear, identity) {
  const needle = (identity.name || "").toLowerCase();
  return linear.issues.filter((issue) => issue.project && issue.project.toLowerCase() === needle)
    .sort((a, b) => (rank[a.stateType] ?? 9) - (rank[b.stateType] ?? 9) || a.identifier.localeCompare(b.identifier, undefined, { numeric: true }));
}

function deriveSnapshot({ identity, linear, git, projectState, workflow = null, related = [] }) {
  const tickets = projectIssues(linear, identity);
  const active = tickets.filter((ticket) => !TERMINAL.includes(ticket.stateType));
  const current = active.find((ticket) => ticket.stateType === "started") || active[0] || null;
  const findings = [];
  if (linear.state === S.ADVISORY) findings.push({ state: S.ADVISORY, code: "linear-input", message: linear.reason || MCP_FETCH_HINT });
  else if (linear.state === S.UNKNOWN) findings.push({ state: S.UNKNOWN, code: "linear", message: linear.reason || "Linear access unavailable" });
  else findings.push(sessionGate(current, { hasTickets: tickets.length > 0 }));
  if (!identity.name) findings.push({ state: S.UNKNOWN, code: "project-identity", message: "Name the Linear Project or resolve it from the issue" });
  if (!projectState.source) findings.push({ state: S.ADVISORY, code: "project-state", message: "No optional local Project state; use the current Linear brief and documents" });
  else if (projectState.compatibility) findings.push({ state: S.ADVISORY, code: "compatibility-state", message: `Historical context only: ${projectState.source}` });
  if (projectState.imbalances.length) findings.push({ state: S.ADVISORY, code: "imbalances", message: `${projectState.imbalances.length} historical local imbalance(s); reconcile relevant claims with current Linear decisions` });
  const base = { project: identity, tickets, git, projectState, workflow, relatedSessions: related, findings, linearState: linear.state };
  const snapshotFingerprint = fingerprint(base);
  const blockers = findings.filter((item) => [S.BLOCKED, S.CONTRADICTED].includes(item.state));
  const unknowns = findings.filter((item) => item.state === S.UNKNOWN);
  return {
    ...base,
    snapshotFingerprint,
    completionClaim: blockers.length ? S.BLOCKED : (unknowns.length || linear.state !== S.VERIFIED) ? S.UNKNOWN : S.VERIFIED,
    next: linear.state !== S.VERIFIED
      ? MCP_FETCH_HINT
      : current
        ? `${current.identifier}: ${current.title}`
        : tickets.length
          ? "$feature-ledger reconcile"
          : "Read the current Linear Project brief and issues; name any missing required context",
  };
}

module.exports = { deriveSnapshot, projectIssues };
