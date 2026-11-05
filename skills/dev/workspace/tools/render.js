"use strict";

const GLYPH = { started: "▶", unstarted: "○", triage: "△", backlog: "⌂", completed: "✓", canceled: "×" };
const short = (text) => text.replace(/\s+/g, " ").slice(0, 68) + (text.length > 68 ? "…" : "");

function renderSnapshot(snapshot) {
  const lines = [
    `Project: ${snapshot.project.name || "UNKNOWN"}`,
    `Snapshot: ${snapshot.snapshotFingerprint}`,
    `Git: ${snapshot.git?.branch || "UNKNOWN"}@${snapshot.git?.head?.slice(0, 12) || "UNKNOWN"} (${snapshot.git?.fingerprint || "UNKNOWN"})`,
    "",
    "Ticket ledger:",
  ];
  if (!snapshot.tickets.length) {
    lines.push(snapshot.linearState === "ADVISORY" ? "  (no Linear data supplied — see findings)" : "  (none or Linear UNKNOWN)");
  }
  for (const issue of snapshot.tickets) lines.push(`  ${GLYPH[issue.stateType] || "·"} ${issue.identifier}  ${short(issue.title)}  [${issue.state}]`);
  lines.push("", "Mechanical findings:");
  for (const item of snapshot.findings) lines.push(`  ${item.state}  ${item.code}: ${item.message}`);
  lines.push("", `Completion claim: ${snapshot.completionClaim}`, `Next: ${snapshot.next}`);
  return lines.join("\n");
}

function renderTree(linear, { family = null, feature = null } = {}) {
  let issues = linear.issues;
  if (feature) issues = issues.filter((issue) => issue.project?.toLowerCase().includes(feature.toLowerCase()));
  if (family) issues = issues.filter((issue) => issue.project?.split(":")[0].toLowerCase().includes(family.toLowerCase()));
  const projects = new Map();
  for (const issue of issues) {
    const project = issue.project || "(no project)";
    if (!projects.has(project)) projects.set(project, []);
    projects.get(project).push(issue);
  }
  const lines = [`=== TREE === THOVEN · ${new Date().toISOString().slice(0, 10)}`];
  for (const [project, tickets] of [...projects].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push("", project);
    for (const issue of tickets) lines.push(`  ${GLYPH[issue.stateType] || "·"} ${issue.identifier}  ${short(issue.title)}  [${issue.state}]`);
  }
  return lines.join("\n");
}

module.exports = { renderSnapshot, renderTree };
