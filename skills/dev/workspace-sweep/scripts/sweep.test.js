const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { KINDS, hasHisYes, normalizeIssue, refusal, sweep } = require("./sweep.js");
const { allComments, parseLog, parseLsRemote, parseWorktrees } = require("./collect.js");

const issue = (id, state, type, extra = {}) => ({ identifier: id, title: id + " work", state: { name: state, type }, labels: { nodes: [] }, ...extra });
const pr = (repo, number, state, head, extra = {}) => ({ repo, number, state, headRefName: head, baseRefName: "main", title: "change", body: "", mergedAt: state === "MERGED" ? "2026-11-20T00:00:00Z" : null, ...extra });
const noEvidence = { prs: [], branches: [], worktrees: [], commits: [] };

function cli(input) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sweep-"));
  fs.writeFileSync(path.join(dir, "issues.json"), JSON.stringify({ issues: input.issues }));
  fs.writeFileSync(path.join(dir, "evidence.json"), JSON.stringify(input.evidence));
  return spawnSync(process.execPath, [path.join(__dirname, "sweep.js"), "--issues", path.join(dir, "issues.json"), "--evidence", path.join(dir, "evidence.json")], { encoding: "utf8" });
}

test("empty input is refused, never reported as a clean board", () => {
  const run = cli({ issues: [], evidence: noEvidence });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /no tickets/);
  assert.doesNotMatch(run.stdout, /nothing to propose/);
  assert.match(refusal({ issues: [issue("THV-1", "Todo", "unstarted")], evidence: { prs: [] } }), /no branches, worktrees, commits evidence/);
});

test("one ticket per mismatch kind is each flagged with its proposed write", () => {
  const input = {
    issues: [
      issue("THV-1", "In Review", "started", { description: "Writes to: frontend on area/thv-1" }),
      issue("THV-2", "Done", "completed", { description: "Writes to: backend on lessons/thv-2" }),
      issue("THV-3", "In Progress", "started"),
      issue("THV-4", "Done", "completed"),
      issue("THV-5", "Canceled", "canceled", { description: "Writes to: this ticket" }),
      issue("THV-6", "Todo", "unstarted", { labels: { nodes: [{ name: "Follow-up" }] }, description: 'Found while building THV-3. Open for Andres: "should the card stay?"' }),
    ],
    evidence: {
      ...noEvidence,
      prs: [pr("frontend", 30, "MERGED", "lessons/thv-3"), pr("backend", 40, "MERGED", "lessons/thv-4")],
      branches: [{ repo: "backend", name: "lessons/thv-4", sha: "abc123" }],
      worktrees: [{ repo: "backend", path: "/Users/a/thoven/backend-thv-5", branch: "lessons/thv-5" }],
    },
  };
  const { rows } = sweep(input);
  assert.deepEqual(rows.map((r) => [r.id, r.kind]), [
    ["THV-1", "review-no-pr"],
    ["THV-2", "closed-no-merge"],
    ["THV-3", "open-pr-merged"],
    ["THV-4", "orphan-branch"],
    ["THV-5", "orphan-worktree"],
    ["THV-6", "unagreed-follow-up"],
  ]);
  assert.deepEqual(new Set(rows.map((r) => r.kind)), new Set(Object.keys(KINDS)));
  const byKind = Object.fromEntries(rows.map((r) => [r.kind, r.proposal]));
  assert.equal(byKind["open-pr-merged"], 'set-status.js "Done" THV-3');
  assert.match(byKind["orphan-branch"], /thoven-branch-prune .*--remote --delete/);
  assert.equal(byKind["orphan-worktree"], "thoven-worktree remove /Users/a/thoven/backend-thv-5");
  assert.match(byKind["unagreed-follow-up"], /fold into THV-3 as a sub-issue/);
  const table = cli(input);
  assert.equal(table.status, 0);
  assert.match(table.stdout, /^\| # \| Ticket \| Status \| Finding \| Evidence \| Proposed write \|/);
  assert.match(table.stdout, /6 proposed writes; .* Nothing is written until Andres says yes/);
});

test("a board that lines up prints nothing to propose", () => {
  const input = {
    issues: [
      issue("THV-10", "In Review", "started"),
      issue("THV-11", "Done", "completed", { description: "Writes to: this ticket" }),
      issue("THV-12", "Todo", "unstarted"),
      issue("THV-123", "Done", "completed"),
      issue("THV-13", "Todo", "unstarted", { labels: { nodes: [{ name: "Follow-up" }] }, description: 'Deferred: "yes, after launch" (Andres, 2026-11-20)' }),
      issue("THV-14", "In Progress", "started"),
      issue("THV-15", "Merged", "started"),
      issue("THV-16", "Done", "completed"),
      issue("THV-17", "Todo", "unstarted"),
      issue("THV-18", "In Progress", "started"),
      issue("THV-19", "Done", "completed", { title: "Research: what the library needs" }),
      issue("THV-20", "Merged", "started", { description: "Writes to: backend on `lessons/integration`" }),
      issue("LAB-1", "Done", "completed"),
    ],
    evidence: {
      prs: [
        pr("frontend", 100, "OPEN", "area/thv-10"),
        pr("frontend", 123, "MERGED", "x/thv-123", { title: "THV-123 the thing" }),
        pr("backend", 140, "MERGED", "chore/batch", { body: "Part of THV-14" }),
        pr("backend", 150, "MERGED", "lessons/thv-15", { baseRefName: "lessons/integration" }),
        pr("frontend", 170, "MERGED", "teacher/thv-961", { body: "Found while recording, not fixed here: THV-17." }),
        pr("frontend", 180, "MERGED", "docs/thv-18", { title: "Point the docs at the catalogue THV-18", body: "Part of THV-18 (the ticket stays open)" }),
      ],
      branches: [{ repo: "frontend", name: "area/thv-10", sha: "def456" }],
      worktrees: [{ repo: "backend", path: "/Users/a/thoven/backend", branch: "main" }],
      commits: [
        { repo: "agent-skills", sha: "aaa111", subject: "fix: the gate (THV-16)", body: "" },
        { repo: "backend", sha: "bbb222", subject: "feat: pair siblings THV-20", body: "", ref: "origin/lessons/integration" },
      ],
    },
  };
  assert.deepEqual(sweep(input).rows, []);
  const run = cli(input);
  assert.equal(run.status, 0);
  assert.match(run.stdout, /^nothing to propose: lined up 12 THV tickets \(left 1 of other teams\) with 6 PRs/);
});

test("collect parses ls-remote, worktree porcelain and git log records", () => {
  assert.deepEqual(parseLsRemote("aaa\trefs/heads/main\nbbb\trefs/heads/lessons/thv-7\n", "backend"), [{ repo: "backend", name: "lessons/thv-7", sha: "bbb" }]);
  const porcelain = "worktree /a/backend\nHEAD 1\nbranch refs/heads/main\n\nworktree /a/backend-thv-7\nHEAD 2\nbranch refs/heads/lessons/thv-7\n\nworktree /tmp/x\nHEAD 3\ndetached\n";
  assert.deepEqual(parseWorktrees(porcelain, "backend", "/a/backend").map((w) => [w.path, w.branch]), [["/a/backend-thv-7", "lessons/thv-7"], ["/tmp/x", null]]);
  assert.deepEqual(parseLog("a1\x1ffix THV-7\x1fbody THV-8\x1e\nb2\x1fdocs\x1f\x1e", "frontend").map((c) => c.sha), ["a1", "b2"]);
});

test("a primary checkout on a closed ticket's branch is never proposed for removal", () => {
  const porcelain = "worktree /a/frontend\nHEAD 1\nbranch refs/heads/area/thv-30\n\nworktree /a/frontend-thv-30\nHEAD 2\nbranch refs/heads/area/thv-30\n";
  const worktrees = parseWorktrees(porcelain, "frontend", "/a/frontend");
  const { rows } = sweep({ issues: [issue("THV-30", "Canceled", "canceled", { description: "Writes to: frontend" })], evidence: { ...noEvidence, worktrees } });
  assert.deepEqual(rows.map((r) => r.proposal), ["thoven-worktree remove /a/frontend-thv-30"]);
});

test("a ticket in the Tech debt Project carries his yes", () => {
  const debt = issue("THV-31", "Todo", "unstarted", { labels: { nodes: [{ name: "Tech debt" }] }, project: { name: "Tech debt" } });
  const triage = issue("THV-32", "Triage", "triage", { labels: { nodes: [{ name: "Tech debt" }] } });
  assert.deepEqual(sweep({ issues: [debt, triage], evidence: noEvidence }).rows.map((r) => [r.id, r.kind]), [["THV-32", "unagreed-follow-up"]]);
});

test("a Done sub-issue shipped in its parent's PR or commit is not reopened", () => {
  const input = {
    issues: [
      issue("THV-40", "Done", "completed", { description: "Writes to: frontend" }),
      issue("THV-41", "Done", "completed", { parent: { identifier: "THV-40" }, description: "Writes to: frontend" }),
      issue("THV-50", "Done", "completed", { description: "Writes to: backend" }),
      issue("THV-51", "Done", "completed", { parent: { identifier: "THV-50" }, description: "Writes to: backend" }),
      issue("THV-61", "Done", "completed", { parent: { identifier: "THV-60" }, description: "Writes to: backend" }),
    ],
    evidence: { ...noEvidence, prs: [pr("frontend", 400, "MERGED", "area/thv-40")], commits: [{ repo: "backend", sha: "c50", subject: "fix: the gate THV-50", body: "" }] },
  };
  assert.deepEqual(sweep(input).rows.map((r) => [r.id, r.kind]), [["THV-61", "closed-no-merge"]]);
});

test("his yes is his dated word or ruling, never agent text that dates his session", () => {
  const yes = (text) => hasHisYes(normalizeIssue(issue("THV-70", "Todo", "unstarted", { description: text })));
  assert.equal(yes('Deferred: "after launch" (Andres, 2026-11-20)'), true);
  assert.equal(yes("Andres, 16 Nov: keep it"), true);
  assert.equal(yes("Andres ruled the card stays"), true);
  assert.equal(yes("Found in Andres's session 2026-11-20 while building THV-3."), false);
  assert.equal(yes("Open for Andres: should the card stay?"), false);
});

test("collect reads every page of an issue's comments", async () => {
  const pages = { c1: { pageInfo: { hasNextPage: true, endCursor: "c2" }, nodes: [{ body: "two" }] }, c2: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ body: "yes (Andres, 2026-11-20)" }] } };
  const asked = [];
  const full = await allComments({ id: "x", comments: { pageInfo: { hasNextPage: true, endCursor: "c1" }, nodes: [{ body: "one" }] } }, async (after) => { asked.push(after); return pages[after]; });
  assert.deepEqual(asked, ["c1", "c2"]);
  assert.deepEqual(full.comments.nodes.map((c) => c.body), ["one", "two", "yes (Andres, 2026-11-20)"]);
  assert.equal(hasHisYes(normalizeIssue({ identifier: "THV-71", title: "t", state: { name: "Todo", type: "unstarted" }, ...full })), true);
});
