# Linear workspace audit (linear-audit, 2026-11-12)

Read-only GraphQL pulls of every non-archived issue (1,620), project (63), initiative (3), document (55), label (17), workflow status (26), custom view (7) and the three teams' settings. Templates are out of scope. Counts are as of 2026-11-12. "Open" means Triage, Backlog, Todo or a started status. One "screen" is taken as 300 words.

## In plain words

1. **One project holds most of the writing.** The Intro-Call Learner Packet (Music Passport) has 149,720 words of documents, 56% of all document words in the workspace. Its spec alone is 27,947 words, against the new 3,000-word cap.
2. **Done does not mean shipped.** A PR merged into any branch sets Done. 140 Done issues were closed only by merges into integration branches, not `main`.
3. **Status also lags the other way.** 11 issues in a started status already have every linked PR merged.
4. **Priority and labels carry almost no signal.** 76% of open issues have no priority and 85% have no label.
5. **Project updates are all or nothing.** The Music Passport has 38 updates, but 6 of the 15 In Progress or Planned projects have none in 30 days, and Linear's update reminder is set to "never".

## 1. Teams and workflow statuses

| Team | Statuses (category) | Open issues today |
|---|---|---|
| THV | Triage (triage) 14 · Backlog 17 · Todo 127 · Speccing (started) 1 · In Progress (started) 18 · Ready (started) 7 · Done · Canceled · Duplicate | 184 |
| DEP (sub-team of THV, own statuses) | Triage 25 · Backlog 0 · Todo 4 · Speccing 0 · In Progress 6 · In Review 0 · Ready 0 · Done · Canceled · Duplicate | 35 |
| LAB | Backlog 8 · Todo 0 · In Progress 1 · In Review 0 · Done · Canceled · Duplicate | 9 |

- All issues: 1,109 Done, 178 Canceled, 105 Duplicate, 228 open.
- THV has no review status. "Ready" is the started status the GitHub automation sets when a PR opens (section 9).
- DEP has never used Speccing, In Review or Ready, and LAB has never used In Review.

## 2. Initiatives and projects

- **Initiatives: 3.** 1 Active (Thoven 2.5, 11 projects) and 2 Completed (Thoven 2.0 with 20 projects, and one with 1 project). 31 of 63 projects belong to no initiative.
- **Projects: 63.** 26 Completed, 12 Canceled, 11 In Progress, 4 Planned and 10 Backlog. 61 projects have one team and 2 have two.
- The Thoven 2.5 initiative's 11 projects hold 95 open issues.

In Progress and Planned projects ("words" is document words; "desc" is words in the project description):

| Project | Status | Issues / open | Milestones | Docs / words | Desc | Updates / last | Age (days) |
|---|---|---|---|---|---|---|---|
| Intro-Call Learner Packet | In Progress | 51 / 17 | 4 | 8 / 149,720 | 2,572 | 38 / 11-12 | 44 |
| Observability weekly | In Progress | 47 / 35 | 2 | 2 / 3,008 | 412 | 0 / never | 12 |
| Academy Positioning & Public Pages | In Progress | 39 / 16 | 4 | 2 / 3,325 | 918 | 6 / 10-29 | 22 |
| Neurodivergent Product Work | In Progress | 41 / 9 | 3 | 5 / 18,222 | 1,383 | 11 / 11-12 | 44 |
| Private Lessons Rework | In Progress | 162 / 8 | 4 | 3 / 4,481 | 1,802 | 26 / 10-29 | 39 |
| Recurring lesson booking | In Progress | 21 / 7 | 2 | 1 / 1,315 | 5,123 | 3 / 11-05 | 15 |
| Multi-state ESA landers + Google ads | In Progress | 9 / 4 | 0 | 0 | 86 | 0 / never | 51 |
| Thoven Labs | In Progress | 6 / 4 | 0 | 0 | 353 | 0 / never | 54 |
| Holiday PLG: Instrument Redeem Flow | In Progress | 7 / 0 | 2 | 0 | 670 | 5 / 11-10 | 8 |
| Labs: Teacher habit | In Progress | 2 / 0 | 0 | 0 | 184 | 0 / never | 11 |
| COPPA and Data Compliance Audit | In Progress | 42 / 0 | 3 | 1 / 3,842 | 746 | 3 / 10-04 | 44 |
| Design System | Planned | 121 / 31 | 4 | 2 / 2,106 | 2,181 | 11 / 11-04 | 88 |
| Parent lifecycle and email platform | Planned | 14 / 2 | 2 | 1 / 2,554 | 1,842 | 3 / 11-06 | 87 |
| Post-intro purchase guide | Planned | 0 / 0 | 2 | 0 | 2,258 | 1 / 10-21 | 21 |
| Internal: Thoven Analytics in Hex | Planned | 12 / 0 | 3 | 1 / 974 | 384 | 0 / never | 32 |

- **No update in 30 days:** Observability weekly, ESA landers, Thoven Labs, Labs: Teacher habit, COPPA audit and Hex analytics. That is 6 of 15, and 5 of them have never had an update.
- Three In Progress projects (Holiday PLG, Labs: Teacher habit and COPPA audit) have 0 open issues, so their status is stale.
- 9 of the 10 Backlog projects have never had an update. The tech-debt project ("techdebt") holds 35 issues, 20 of them open.
- **Workspace documents:** 55 documents with 266,892 words. 13 are not attached to a project.

## 3. Milestones

- 144 milestones across 40 of 63 projects. 12 of the 15 In Progress or Planned projects use them.
- 1,230 issues sit in projects that have milestones. 357 of them are in no milestone, and 89 of those are open (of 131 open issues in those projects).

## 4. Labels

- **17 labels.** 3 are workspace labels (Improvement, Bug, Feature). 14 belong to DEP, including 3 label groups: Repo, Fix loop and Found by. THV and LAB have no team labels. None are retired.
- **Use across all 1,620 issues:**

| Label | Issues | Open issues |
|---|---|---|
| Improvement | 180 | 10 |
| Bug | 128 | 22 |
| Feature | 40 | 2 |
| factory | 13 | 0 |
| SEO | 6 | 1 |
| frontend | 6 | 1 |
| Andres | 2 | 0 |
| backend | 1 | 0 |

  No other label is on any issue. Of the 14 labels that are not groups, 8 are on fewer than 3 issues and 6 are on none.
- **No label:** 1,257 of 1,620 issues (78%) and 194 of 228 open issues (85%).

## 5. Priorities (228 open issues)

| Priority | Issues | Share |
|---|---|---|
| None | 173 | 76% |
| Urgent | 11 | 5% |
| High | 12 | 5% |
| Medium | 16 | 7% |
| Low | 16 | 7% |

No team requires a priority to leave Triage.

## 6. Hierarchy

- **Depth:** 966 issues have no parent, 588 sit at depth 1, 64 at depth 2 and 2 at depth 3. So sub-issues go 3 levels below the top issue.
- **Parents:** 128 issues have children. 15 have more than 10, the largest THV-908 (39), THV-503 and THV-481 (25 each) and THV-386 (20).
- **No project:** 52 open issues. Another 2 open issues sit in Completed or Canceled projects.

## 7. Status against reality

Linear does expose PR state. Every GitHub attachment carries `status` (merged, open, draft or closed), `targetBranch`, `mergedAt` and `linkKind` (closes, contributes or links). The workspace has 745 GitHub PR attachments on 385 issues: 717 merged, 22 closed, 3 open and 3 draft.

- **Started with no update in 14 days:** 1 of 33 (THV-1154, 34 days). Agents' edits bump `updatedAt`, so this undercounts.
- **Started, but every linked PR is merged:** 11 issues. Six use "closes" links (THV-1779, 1770, 1608, 1558, 1534, DEP-22), and the rest use "links" or "contributes". THV-738 is started with only closed PRs. Only 15 of the 33 started issues have a PR.
- **Completed while a linked PR is open:** 3. THV-1751 has 1 open PR among 16. THV-1739 and THV-1152 each have only a draft.
- **Done before reaching `main`:** 317 of the 717 merged PRs targeted a branch other than `main`. 140 Done issues have merged PRs that all target integration branches.

## 8. Reading load in the two studied projects

| | Intro-Call Learner Packet (Music Passport) | Neurodivergent Product Work (whole project) | Credential close-out (THV-1770) |
|---|---|---|---|
| Issues / open | 51 / 17 | 41 / 9 | 1 issue, no children, started |
| Comments per issue, median / max | 2 / 27 (THV-1701) | 0 / 4 | 4 |
| Total comments / words | 213 / 38,720 | 30 / 2,983 | 4 / 267 |
| Description words, median / max | 439 / 10,791 (THV-1766) | 296 / 2,772 (THV-1408) | 428 |
| Descriptions over 400 words | 28 of 51 | 15 of 41 | yes |
| Documents / words | 8 / 149,720 (largest 40,206; spec 27,947) | 5 / 18,222 | 3 credential documents / 16,790 |
| Project description words | 2,572 | 1,383 | n/a |
| Updates / words / last one | 38 / 11,853 / 289 | 11 / 3,072 / 283 | n/a |

**Screens to learn "where are we" (300 words each):**

| Reading path | Intro-Call Learner Packet | Neurodivergent Product Work |
|---|---|---|
| Project description and the latest update | 9.5 | 5.6 |
| Plus the open issues' descriptions | 73 | 19 |
| Plus the largest document | 144 | 38 |
| Everything (documents, descriptions, comments and updates) | about 805 | about 148 |

Five of the Music Passport's eight documents changed on 2026-11-12.

## 9. Views and automation

- **Custom views:** 7, all shared and all on THV. There are 6 issue views and 1 project view, created between 08-15 and 10-06 and not edited since. Four of them overlap: "Thoven 2.5 Initiative Issues", "Thoven 2.5 Initiative" (one issue view, one project view), "Active Project" and "Active Projects". The other two are "Work" and "Shipping".
- **GitHub status automation:** no rule names a target branch, so every rule fires on a PR into any branch, integration branches included. THV and DEP: draft → In Progress; start, review and mergeable → Ready; merge → Done. LAB: start → In Progress, review → In Review, merge → Done.
- **Parent and sub-issue auto-close:** both on for THV (`autoCloseParentIssues` and `autoCloseChildIssues` are true). This is the setting behind the cascade trap. DEP and LAB return null.
- **Other team settings:** stale issues auto-close after 6 months on all teams. Auto-archive runs after 3 months on THV and DEP, 6 on LAB. Cycles are on for THV and DEP, estimates are off, and AI summaries are on.
- **Organisation:** the project update reminder is `never`. Branch format is `feature/{issueIdentifier}`, which is not Thoven's naming. Integrations are GitHub and Notion.

## Could not measure

- **Whether an integration branch's tickets reached `main`.** Linear sees only the PR into the integration branch.
- **Who moved a status.** I did not pull issue history, so I can't tell whether the 11 started issues with merged PRs were reopened after the cascade or never closed.
- **Whether anyone opens the custom views.** The API returns no usage.
- **Real staleness.** `updatedAt` counts any edit, agents' included.
- **Archived or deleted records.** They are not counted, which probably explains the gap from the brief's 131,800 words.
- **Settings the API does not return:** workspace GitHub settings beyond team automations, whether DEP inherits THV's auto-close values (null comes back), and notification rules.
- **Screens.** They rest on my 300-words-per-screen assumption.
