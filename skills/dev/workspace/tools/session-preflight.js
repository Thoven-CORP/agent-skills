// session-preflight.js — the session gate. Pure over a provided issue snapshot.
// Linear fetch stays in the skill; this file only judges. Red is a stop, not a finding.
//
// node session-preflight.js < snapshot.json
// exit 0 = may proceed; exit 1 = claim / milestone / Writes to: first.

const ALLOWED = new Set(['In Progress', 'Ready']);
const UNCLAIMED = new Set(['Triage', 'Backlog', 'Todo']);

function preflight(issue) {
  const failures = [];
  if (!issue || !issue.identifier) {
    return { ok: false, failures: ['no-issue: no THV- identifier. Name the issue before grilling or writing.'] };
  }

  const id = issue.identifier;
  const state = issue.state || '';

  if (UNCLAIMED.has(state)) {
    failures.push(`unclaimed: ${id} is ${state}. Claim it before the work starts.`);
  }

  if (!issue.assignee) {
    failures.push(`assignee: ${id} has no assignee. The lock is empty.`);
  }

  if (!issue.milestone) {
    failures.push(`milestone: ${id} has no lifecycle milestone. Create the stage this work is, then attach.`);
  }

  if (state && !ALLOWED.has(state) && !UNCLAIMED.has(state)) {
    failures.push(`lane: ${id} is ${state}. In Progress is the lane.`);
  }

  const destination = (issue.writesTo || '').trim().replace(/^`|`$/g, '');
  const sameIssue = /^this (ticket|issue)$/i.test(destination);
  const linearRecord = /^https:\/\/linear\.app\/[^/\s]+\/(document|issue)\//i.test(destination);
  if (linearRecord && issue.writesToAccessible !== true) {
    failures.push(`unverified-destination: read the Linear record at ${destination} before proceeding.`);
  }
  if (!linearRecord && issue.writesToExists === false && !sameIssue) {
    failures.push(`ghost-path: Writes to: ${issue.writesTo} does not resolve.`);
  }

  return { ok: failures.length === 0, failures, identifier: id };
}

if (require.main === module) {
  const fs = require('node:fs');
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    raw = '';
  }
  if (!raw.trim()) {
    console.error('usage: node session-preflight.js < snapshot.json');
    process.exit(2);
  }
  const result = preflight(JSON.parse(raw));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

module.exports = { preflight, ALLOWED, UNCLAIMED };
