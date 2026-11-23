#!/usr/bin/env node
"use strict";

// Joins a saved Linear issues JSON with gh and git evidence into one table of proposed writes.
// Pure over its inputs: collect.js gathers them, this file only reads and compares.
//   node sweep.js --issues issues.json --evidence evidence.json [--json]

const fs = require("node:fs");

const KINDS = {
  "review-no-pr": "In Review with no open PR",
  "closed-no-merge": "Merged or Done with nothing merged",
  "open-pr-merged": "open ticket whose PR merged",
  "orphan-branch": "branch for a closed ticket",
  "orphan-worktree": "worktree for a closed ticket",
  "unagreed-follow-up": "Follow-up or Tech debt with no yes from Andres",
};
const EVIDENCE_KEYS = ["prs", "branches", "worktrees", "commits"];
// Linear's magic words count only right before the ids: "Closes THV-1, THV-2", never "not fixed here: THV-3".
const ID_RUN = "((?:\\[?THV-\\d+\\]?(?:\\([^)\\s]*\\))?(?:\\s*(?:,|and)\\s*|\\s+)?)+)";
const CLOSING = new RegExp("\\b(?:close[sd]?|closing|fix(?:e[sd])?|fixing|resolve[sd]?|resolving|complete[sd]?|completing)[\\s:]+" + ID_RUN, "gi");
const PARTIAL = new RegExp("\\b(?:part of|refs?|references|related to|contributes to)[\\s:]+" + ID_RUN, "gi");
// A ticket whose title names a thinking kind lands in a document, not a PR.
const DOC_KIND = /^(?:research|brainstorm|design|spec|plan|grill|audit|check)\b/i;
// The law dates his words: "(Andres, 2026-11-20)", "Andres, 16 Nov:". A ruling verb counts too.
// A question addressed to him ("Open for Andres") carries no date and no verb, so it stays unagreed;
// so does agent text that only dates something of his ("Andres's session 2026-11-20").
const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*";
const HIS_YES = [
  new RegExp("\\bAndres(?:,\\s*|\\s+)(?:on\\s+)?(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2} " + MONTH + "|" + MONTH + " \\d{1,2})"),
  /\bAndres (?:ruled|chose|picked|parked|approved|agreed|said yes)\b/,
];

function ids(text) {
  return [...String(text || "").matchAll(/\bTHV-(\d+)\b/gi)].map((m) => "THV-" + m[1]);
}

function branchId(name) {
  const hit = String(name || "").match(/(?:^|[^a-z0-9])thv-(\d+)(?![0-9])/i);
  return hit ? "THV-" + hit[1] : null;
}

function names(labels) {
  const list = labels?.nodes || labels || [];
  return list.map((l) => (typeof l === "string" ? l : l.name)).filter(Boolean);
}

// Takes the GraphQL node, the Linear MCP record, or a flat record (workspace map-input.md).
function normalizeIssue(issue) {
  const state = issue.state?.name || (typeof issue.state === "string" ? issue.state : null) || issue.status || "Unknown";
  const description = issue.description || "";
  return {
    id: issue.identifier || issue.id,
    title: issue.title || "",
    description,
    state,
    stateType: issue.state?.type || issue.stateType || issue.statusType || "unknown",
    labels: names(issue.labels),
    parent: issue.parent?.identifier || (typeof issue.parent === "string" ? issue.parent : null),
    project: issue.project?.name || (typeof issue.project === "string" ? issue.project : null),
    comments: (issue.comments?.nodes || issue.comments || []).map((c) => (typeof c === "string" ? c : c.body || "")),
    writesTo: description.match(/^Writes to:\s*(.+)$/im)?.[1]?.trim() || null,
  };
}

const isClosed = (i) => ["completed", "canceled"].includes(i.stateType) || /^(done|canceled|duplicate)$/i.test(i.state);
const isMerged = (i) => /^merged$/i.test(i.state);
const isDone = (i) => /^done$/i.test(i.state);
// A ticket whose Writes to: names no repo lands in a document and moves by hand (WORKFLOW.md, States).
const isDocTicket = (i) => (Boolean(i.writesTo) && !/frontend|backend/i.test(i.writesTo)) || (!i.writesTo && DOC_KIND.test(i.title));
// He accepts a ticket into the Tech debt Project by moving it there (WORKFLOW.md, "Follow-ups").
const hasHisYes = (i) => /^tech debt$/i.test(i.project || "") || [i.description, ...i.comments].some((t) => HIS_YES.some((re) => re.test(t)));

// closing: the id is in the head branch, the title, or right after a closing word. An explicit
// "Part of THV-n" in the body wins over the branch and title, as WORKFLOW.md's multi-PR rule intends.
function prLinks(pr) {
  const body = String(pr.body || "");
  const partial = new Set([...body.matchAll(PARTIAL)].flatMap((m) => ids(m[1])));
  const closing = new Set([branchId(pr.headRefName), ...ids(pr.title), ...[...body.matchAll(CLOSING)].flatMap((m) => ids(m[1]))]
    .filter((id) => id && !partial.has(id)));
  const mentioned = new Set([...closing, ...partial, ...ids(pr.title + "\n" + body)]);
  return { closing, partial, mentioned };
}

function indexBy(list, keysOf) {
  const map = new Map();
  for (const item of list) for (const key of keysOf(item)) {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

const prRef = (pr) => pr.repo + "#" + pr.number;

function followUpProposal(issue, byId) {
  if (issue.parent) return "keep as sub-issue of " + issue.parent + ", drop the label, fix before " + issue.parent + " closes";
  const named = ids(issue.description).find((id) => id !== issue.id && byId.has(id) && !isClosed(byId.get(id)));
  if (named) return "fold into " + named + " as a sub-issue (named in its description)";
  return "fix now, or close with one evidence line";
}

function sweep(input) {
  const all = (input.issues?.nodes || input.issues || []).map(normalizeIssue);
  // Deployment and Lab keep their own rules and repos (WORKFLOW.md, States); the sweep lines up THV.
  const issues = all.filter((i) => /^THV-\d+$/i.test(i.id));
  const ev = input.evidence || {};
  const byId = new Map(issues.map((i) => [i.id, i]));
  const links = (ev.prs || []).map((pr) => ({ pr, ...prLinks(pr) }));
  const closingBy = indexBy(links, (l) => [...l.closing]);
  const anyBy = indexBy(links, (l) => [...l.closing, ...l.partial]);
  const mentionBy = indexBy(links, (l) => [...l.mentioned]);
  const commitsBy = indexBy(ev.commits || [], (c) => new Set(ids(c.subject + "\n" + (c.body || ""))));
  const branchesBy = indexBy(ev.branches || [], (b) => [branchId(b.name)].filter(Boolean));
  const treesBy = indexBy(ev.worktrees || [], (w) => [branchId(w.branch) || branchId(w.path.split("/").pop())].filter(Boolean));
  const rows = [];
  const add = (issue, kind, evidence, proposal) => rows.push({ id: issue.id, state: issue.state, kind, finding: KINDS[kind], evidence, proposal });

  for (const issue of issues) {
    const linked = (anyBy.get(issue.id) || []).map((l) => l.pr);
    const open = linked.filter((pr) => pr.state === "OPEN");
    const closingMerged = (closingBy.get(issue.id) || []).map((l) => l.pr).filter((pr) => pr.state === "MERGED");
    // A sub-issue fixed inside its parent's PR (law, "Own what you find") ships under the parent's id.
    const carriers = issue.parent ? [issue.id, issue.parent] : [issue.id];
    const shipped = carriers.flatMap((id) => (mentionBy.get(id) || []).map((l) => l.pr)).filter((pr) => pr.state === "MERGED");
    const commits = carriers.flatMap((id) => commitsBy.get(id) || []);
    const closed = isClosed(issue);

    if (/^in review$/i.test(issue.state) && !open.length && !closingMerged.length && !isDocTicket(issue)) {
      add(issue, "review-no-pr", linked.length ? "linked PRs: " + linked.map((p) => prRef(p) + " " + p.state.toLowerCase()).join(", ") : "no PR names it in either repo",
        'set-status.js "In Progress" ' + issue.id + ", or open its PR");
    }
    if ((isDone(issue) || isMerged(issue)) && !shipped.length && !commits.length && !isDocTicket(issue)) {
      add(issue, "closed-no-merge", "no merged PR and no commit on main or an integration branch names it" + (issue.parent ? " or its parent " + issue.parent : "") + (issue.writesTo ? "; Writes to: " + issue.writesTo : "; no Writes to: line"),
        "comment one evidence line naming where it shipped, or set-status.js \"Todo\" " + issue.id);
    }
    if (!closed && closingMerged.length && !open.length) {
      const intoMain = closingMerged.filter((pr) => pr.baseRefName === "main");
      const target = intoMain.length ? "Done" : "Merged";
      if (!(target === "Merged" && isMerged(issue))) {
        const pr = (intoMain[0] || closingMerged[0]);
        add(issue, "open-pr-merged", prRef(pr) + " merged into " + pr.baseRefName + " " + String(pr.mergedAt || "").slice(0, 10),
          "set-status.js \"" + target + "\" " + issue.id);
      }
    }
    if (closed) {
      for (const b of branchesBy.get(issue.id) || []) {
        const head = links.find((l) => l.pr.repo === b.repo && l.pr.headRefName === b.name && l.pr.state === "OPEN");
        const wasMerged = links.some((l) => l.pr.repo === b.repo && l.pr.headRefName === b.name && l.pr.state === "MERGED");
        add(issue, "orphan-branch", b.repo + " origin/" + b.name + (b.sha ? " " + b.sha.slice(0, 12) : "") + (head ? "; open " + prRef(head.pr) : ""),
          head ? "close " + prRef(head.pr) + ", or reopen " + issue.id
            : wasMerged ? "thoven-branch-prune --repo ~/thoven/" + b.repo + " --remote --delete"
              : "git -C ~/thoven/" + b.repo + " push origin --delete " + b.name);
      }
      for (const w of treesBy.get(issue.id) || []) {
        add(issue, "orphan-worktree", w.repo + " " + w.path + (w.branch ? " [" + w.branch + "]" : ""), "thoven-worktree remove " + w.path);
      }
    }
    const label = issue.labels.find((l) => /^(follow-up|tech debt)$/i.test(l));
    if (!closed && label && !hasHisYes(issue)) {
      add(issue, "unagreed-follow-up", "label " + label + ", no quoted yes from Andres in its text or comments", followUpProposal(issue, byId));
    }
  }
  const num = (id) => Number(String(id).replace(/\D/g, "")) || 0;
  rows.sort((a, b) => num(a.id) - num(b.id) || a.kind.localeCompare(b.kind));
  return { rows, counts: { tickets: issues.length, otherTeams: all.length - issues.length, prs: (ev.prs || []).length, branches: (ev.branches || []).length, worktrees: (ev.worktrees || []).length, commits: (ev.commits || []).length } };
}

// A sweep over nothing proves nothing, so missing input is a refusal, never a clean table.
function refusal(input) {
  const issues = input?.issues?.nodes || input?.issues;
  if (!Array.isArray(issues) || issues.length === 0) return "no tickets in the input, so there is nothing to line up";
  const missing = EVIDENCE_KEYS.filter((k) => !Array.isArray(input.evidence?.[k]));
  if (missing.length) return "no " + missing.join(", ") + " evidence; run collect.js evidence";
  return null;
}

const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

function render({ rows, counts }, documents = []) {
  const lined = "lined up " + counts.tickets + " THV tickets" + (counts.otherTeams ? " (left " + counts.otherTeams + " of other teams)" : "") + " with " + counts.prs + " PRs, " + counts.branches + " branches, " + counts.worktrees + " worktrees, " + counts.commits + " commits on main and integration branches";
  const docs = documents.map((d) => "- " + (d.project ? d.project + " · " : "") + d.title + " updated " + String(d.updatedAt || "?").slice(0, 10));
  if (!rows.length) return ["nothing to propose: " + lined + ".", ...docs].join("\n");
  return [
    "| # | Ticket | Status | Finding | Evidence | Proposed write |",
    "|---|---|---|---|---|---|",
    ...rows.map((r, n) => "| " + (n + 1) + " | " + r.id + " | " + r.state + " | " + r.finding + " | " + cell(r.evidence) + " | " + cell(r.proposal) + " |"),
    "",
    rows.length + " proposed writes; " + lined + ". Nothing is written until Andres says yes.",
    ...docs,
  ].join("\n");
}

function argsOf(argv) {
  const out = { json: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--json") out.json = true;
    else if (argv[i] === "--issues") out.issues = argv[++i];
    else if (argv[i] === "--evidence") out.evidence = argv[++i];
  }
  return out;
}

function main(argv) {
  const args = argsOf(argv);
  if (!args.issues || !args.evidence) {
    process.stderr.write("usage: sweep.js --issues issues.json --evidence evidence.json [--json]\n");
    return 2;
  }
  const linear = JSON.parse(fs.readFileSync(args.issues, "utf8"));
  const input = { issues: linear.data?.issues || linear.issues, evidence: JSON.parse(fs.readFileSync(args.evidence, "utf8")) };
  const refused = refusal(input);
  if (refused) {
    process.stderr.write("workspace-sweep: " + refused + "\n");
    return 2;
  }
  const result = sweep(input);
  process.stdout.write((args.json ? JSON.stringify(result, null, 2) : render(result, linear.documents || [])) + "\n");
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { KINDS, branchId, hasHisYes, normalizeIssue, prLinks, refusal, render, sweep };
