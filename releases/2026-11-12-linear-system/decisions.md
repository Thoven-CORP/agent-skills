# Linear system: what Andres decided, 2026-11-12

His goal, in his words: "linear overtime in one project can become too verbose, way too hard to
read, which causes me to just be lost, not understand where we are at and not be able to catch gaps
and stuff beforehand." He wants Linear readable as the source of truth.

He answered four rounds of questions and then said "Yes, apply all of it". The rulings below are
his picks. Lines marked "main's reading" are the main session's, not his.

## Rulings

1. **Done means in `main`.** Statuses on the main team (THV) run Todo, In Progress, In Review,
   Merged, Done. In Progress: a builder is building. In Review: its pull request is open. Merged:
   in the project's integration branch, not yet in `main`. Done: in `main`.
2. **Auto-close stays on** (his pick, against main's recommendation). Closing the last child still
   closes the parent, and closing a parent still closes its remaining children.
3. **Where we are.** An update with a health flag on every landing, plus weekly. The project's
   front page is one screen: built, next, blocked, needs Andres.
4. **Labels.** His words: "the labels need to be actually something useful unless we can do like a
   follow up to track followups and like techdebt in projects"; the kind "we say it in the ticket
   header so we dont really need it". Two labels exist: `Follow-up` and `Tech debt`.
5. **Follow-ups.** A problem found during a build that sits inside the feature's code gets
   `Follow-up`, stays in the same project, in a last stage called Follow-ups. A problem outside the
   feature's code gets `Tech debt` and goes to the inbox (Triage); Andres accepts it into the Tech
   debt project, declines it or marks it a duplicate.
6. **Priority** only where it changes the order: projects, bugs, follow-ups and tech debt. Build
   tickets take their parent's. Urgent means production is broken. A ticket cannot leave the inbox
   without one.
7. **Milestones** stay: three to five per project, each a stage Andres can open on staging and
   judge, plus Follow-ups last.
8. **Long against short.** A feature is a project with an end, inside an initiative. Ongoing work
   lives in standing projects with no end date: Tech debt, Small fixes, Operations. Nothing floats
   with no project.
9. **Views.** His existing views stay. Five were added: Building now; Merged, not in main; Project
   health; Follow-ups and tech debt; Tickets with no project.
10. **Cleanup: active projects only.** The 15 In Progress or Planned projects get a one-screen
    front page, a fresh update with a health flag, every open ticket in a stage, and an initiative.
    The open tickets with no project get a home. Finished and cancelled work is left alone.
11. **Teams: main team only.** Deployment (DEP) and Lab keep their statuses and merge rules.
12. **Try once:** a guided review of a project pull request, diagrams in Linear documents, a
    release list from `main`.

## Already applied in Linear by main (do not redo)

- THV status `Ready` renamed `In Review` (same status, same id). New THV status `Merged`
  (started). `Speccing` is untouched (main's reading: he did not rule on it).
- THV merge rules: a pull request merged into `main` sets Done; merged into any other branch sets
  Merged. Draft sets In Progress; opened, review requested and ready-to-merge set In Review.
- A ticket cannot leave the THV inbox without a priority. Weekly project-update reminder is on.
- Labels `Follow-up` and `Tech debt` created at workspace level. `Bug`, `Feature`, `Improvement`
  retired (old tickets keep them; they cannot be added to new ones). DEP's own labels are untouched
  (main's reading: they drive the Deployment team's fix loop, which he left out of scope).
- Projects: `techdebt` renamed `Tech debt`; `Small fixes` and `Operations` created.
- Five views created; two old views' filters updated for the renamed status.
- Before-values of every setting: `~/.thoven-artifacts/dev/meta-analysis/linear-system/applied/before-*.json`.

## Consequence every agent must know

When a project's integration branch lands in `main`, Linear moves only the tickets that the landing
pull request names. So the landing pull request's description lists every ticket it carries with a
closing word (`Closes THV-1, THV-2`). Without that line, the tickets stay Merged forever.
(Linear's documentation, GitLab and GitHub integration pages: a ticket is linked by its id in the
branch name, the pull request title, or a closing word in the description.)

## Health flag rule (main's reading, for updates)

- Off track: open work and nothing has moved in 14 days, or a blocker nobody owns.
- At risk: something waits on Andres, or a target date has passed.
- On track: otherwise.
