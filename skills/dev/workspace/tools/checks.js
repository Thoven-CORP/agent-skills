"use strict";

const { SNAPSHOT_STATES: S } = require("./states.js");

function finding(state, code, message, evidence = null) { return { state, code, message, evidence }; }

function sessionGate(issue) {
  if (!issue) return finding(S.UNKNOWN, "session-gate", "No matching Linear issue was found");
  if (!["In Progress", "Ready"].includes(issue.state)) return finding(S.BLOCKED, "session-gate", `${issue.identifier} is ${issue.state}`);
  if (!issue.assignee) return finding(S.BLOCKED, "session-gate", `${issue.identifier} has no assignee`);
  if (!issue.milestone) return finding(S.BLOCKED, "session-gate", `${issue.identifier} has no milestone`);
  if (!issue.writesTo) return finding(S.BLOCKED, "session-gate", `${issue.identifier} has no Writes to: path`);
  return finding(S.VERIFIED, "session-gate", `${issue.identifier} is claimed and routed`);
}

function concurrentWorkUnits(units) {
  const findings = [];
  for (let left = 0; left < units.length; left += 1) {
    for (let right = left + 1; right < units.length; right += 1) {
      if (units[left].issue !== units[right].issue) continue;
      const overlap = units[left].paths.filter((path) => units[right].paths.includes(path));
      findings.push(overlap.length
        ? finding(S.BLOCKED, "same-file-overlap", `${units[left].name} and ${units[right].name} require serialization through ${units[left].integrationSession || units[right].integrationSession || "a named integration session"}`, overlap)
        : finding(S.VERIFIED, "disjoint-work-units", `${units[left].name} and ${units[right].name} may commit independently`));
    }
  }
  return findings;
}

function reachability({ exists, productionMounts = [] }) {
  if (!exists) return finding(S.BLOCKED, "missing-component", "The component does not exist");
  if (!productionMounts.length) return finding(S.BLOCKED, "unmounted-component", "The component exists but has no production mount");
  return finding(S.VERIFIED, "mounted-component", "The component is reachable from production", productionMounts);
}

function proofFreshness(proof, git) {
  if (!proof) return finding(S.UNKNOWN, "proof", "No proof receipt exists");
  if (proof.commit !== git.head || proof.workingTreeFingerprint !== git.workingTreeFingerprint) {
    return finding(S.STALE, "proof", "Proof predates the current commit or working tree");
  }
  return finding(S.VERIFIED, "proof", "Proof matches the current commit and working tree");
}

module.exports = { concurrentWorkUnits, finding, proofFreshness, reachability, sessionGate };
