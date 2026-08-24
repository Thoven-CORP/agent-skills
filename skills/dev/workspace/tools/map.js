#!/usr/bin/env node
// map.js — the Thoven board as a tree, no agent required.
// Usage:
//   map.js                          zoom 2 — everything
//   map.js --family teacher         zoom 1 — one audience family (substring match)
//   map.js --feature dashboard      zoom 0 — one project (substring match), full detail
// Key: env LINEAR_API_KEY, or the file ~/.linear-api-key (one line, 0600).
// Create the key at https://linear.app/settings/api — "New API key".

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : null;
};
const zoom = flag("feature") ? 0 : flag("family") ? 1 : 2;

let key = process.env.LINEAR_API_KEY;
if (!key) {
  const f = path.join(process.env.HOME, ".linear-api-key");
  if (fs.existsSync(f)) key = fs.readFileSync(f, "utf8").trim();
}
if (!key || key.length < 20) {
  console.error("No Linear API key found.\n");
  console.error("  1. Open https://linear.app/settings/api");
  console.error("  2. New API key — name it 'workspace-map'");
  console.error("  3. Save it:  echo 'linapi_...' > ~/.linear-api-key && chmod 600 ~/.linear-api-key");
  console.error("  4. Run this again.");
  process.exit(1);
}

const QUERY = `query {
  projects(first: 60, includeArchived: false) {
    nodes { name targetDate status { name } }
  }
  issues(first: 250, filter: { team: { key: { eq: "THV" } } }) {
    pageInfo { hasNextPage endCursor }
    nodes {
      identifier title
      state { type name }
      project { name }
      projectMilestone { name }
      assignee { name }
    }
  }
}`;

const GLYPH = {
  unstarted: "○",
  started: "▶",
  triage: "△",
  backlogged: "⌂",
};
const SHORT = (t) => t.replace(/\s+/g, " ").slice(0, 58) + (t.length > 58 ? "…" : "");
const family = (p) => {
  const c = p.indexOf(":");
  return c > 0 ? p.slice(0, c).trim() : p.trim();
};

(async () => {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: key },
    body: JSON.stringify({ query: QUERY }),
  });
  if (!res.ok) {
    console.error("Linear API " + res.status + " — is the key valid?");
    process.exit(1);
  }
  const body = await res.json();
  if (body.errors) {
    console.error("GraphQL error: " + body.errors[0].message);
    process.exit(1);
  }

  let issues = body.data.projects ? body.data.issues.nodes : [];
  // paginate if needed
  let cursor = body.data.issues.pageInfo.endCursor;
  while (body.data.issues.pageInfo.hasNextPage) {
    const r2 = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: key },
      body: JSON.stringify({ query: QUERY.replace("issues(first: 250,", `issues(first: 250, after: "${cursor}",`) }),
    });
    const b2 = await r2.json();
    issues = issues.concat(b2.data.issues.nodes);
    if (!b2.data.issues.pageInfo.hasNextPage) break;
    cursor = b2.data.issues.pageInfo.endCursor;
  }

  const open = issues.filter((i) => !["completed", "canceled"].includes(i.state.type));
  const byProject = {};
  for (const i of open) {
    const p = i.project ? i.project.name : "(no project)";
    byProject[p] = byProject[p] || [];
    byProject[p].push(i);
  }
  const sortIssue = (a, b) =>
    ["started", "unstarted", "triage", "backlogged"].indexOf(a.state.type) -
      ["started", "unstarted", "triage", "backlogged"].indexOf(b.state.type) ||
    a.identifier.localeCompare(b.identifier, undefined, { numeric: true });

  const families = {};
  for (const p of Object.keys(byProject)) {
    (families[family(p)] = families[family(p)] || {})[p] = byProject[p];
  }
  const famOrder = Object.keys(families).sort();

  const line = (s) => console.log(s);

  if (zoom === 0) {
    const needle = flag("feature").toLowerCase();
    const hits = Object.keys(byProject).filter((p) => p.toLowerCase().includes(needle));
    if (!hits.length) {
      console.error("No project matches '" + flag("feature") + "'. Projects:\n  " + Object.keys(byProject).join("\n  "));
      process.exit(1);
    }
    for (const p of hits) {
      line(`=== TREE ===  ${p}  ·  ${open.length ? "" : "all clear"}${new Date().toISOString().slice(0, 10)}`);
      const byMilestone = {};
      for (const i of byProject[p].sort(sortIssue)) {
        const m = i.projectMilestone ? i.projectMilestone.name : "(no milestone)";
        (byMilestone[m] = byMilestone[m] || []).push(i);
      }
      for (const m of Object.keys(byMilestone)) {
        line(`  ${m}`);
        for (const i of byMilestone[m]) {
          const who = i.assignee ? " · " + i.assignee.name.split(" ")[0] : "";
          line(`    ${GLYPH[i.state.type] || "·"} ${i.identifier}  ${SHORT(i.title)}${who}`);
        }
      }
    }
    return;
  }

  const show = zoom === 2 ? famOrder : famOrder.filter((f) => f.toLowerCase().includes(flag("family").toLowerCase()));
  if (!show.length) {
    console.error("No family matches '" + flag("family") + "'. Families:\n  " + famOrder.join("\n  "));
    process.exit(1);
  }
  line(`=== TREE ===  THOVEN · ${new Date().toISOString().slice(0, 10)} · live from Linear`);
  for (const f of show) {
    const projects = Object.keys(families[f]).sort();
    const count = projects.reduce((n, p) => n + families[f][p].length, 0);
    line(`\n${f}  (${count} open)`);
    for (const p of projects) {
      const items = families[f][p].sort(sortIssue);
      const started = items.filter((i) => i.state.type === "started");
      const rest = items.filter((i) => i.state.type !== "started");
      const bits = [];
      if (started.length) bits.push("▶ " + started.map((i) => i.identifier).join(" "));
      const todos = rest.filter((i) => i.state.type === "unstarted");
      if (todos.length) bits.push("○ " + todos.length + " todo");
      const tri = rest.filter((i) => i.state.type === "triage");
      if (tri.length) bits.push("△ " + tri.length + " triage");
      const back = rest.filter((i) => i.state.type === "backlogged");
      if (back.length) bits.push("⌂ " + back.length + " backlog");
      line(`  ${p}`);
      if (zoom === 1) {
        for (const i of items) line(`      ${GLYPH[i.state.type] || "·"} ${i.identifier}  ${SHORT(i.title)}`);
      } else {
        line(`      ${bits.join("   ") || "clear"}`);
      }
    }
  }
})().catch((e) => {
  console.error("map failed: " + e.message);
  process.exit(1);
});
