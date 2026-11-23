# Learnings — workspace-sweep

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-23 — board cleanup is its own skill, because nothing walked GitHub and git against Linear

> reflect · 2026-11-23 · e2ee8938 · skill-gap · applied · seen 25

**What happened.** Andres typed "close the session / clean up worktrees" by hand in 25 of 110 sessions. `workspace` listed "reconcile the board" as a trigger, while its body said it "does not perform semantic feature reconciliation". He ruled S29: "it may just be better to add a workspace sweep or workspace cleanup".
**Why.** `workspace` reads one Project's Linear fields. Pull requests, branches and worktrees lived in no skill, so a ticket could sit In Review with its PR merged, or a closed ticket could keep its branch and tree, and nothing said so.
**What changed.** New skill: `scripts/collect.js` reads, `scripts/sweep.js` joins them as a pure function and refuses empty input, and `scripts/sweep.test.js` covers it. Its first real run found three defects in the joiner, and they were fixed in the same round. A closing word anywhere on a line counted as a link ("not fixed here: THV-963"). `Part of THV-582` did not beat the id in the branch name. "Open for Andres" read as his yes. The first read-only run over every open Project gave 97 rows: 33 follow-ups with no yes, 31 closed tickets with nothing merged, 14 branches and 3 worktrees for closed tickets, 8 open tickets whose PR merged, and 8 In Review with no open PR. P-THV-74 was clean.
