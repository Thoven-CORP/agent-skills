---
name: journey-map
description: Seat storylines for a Project, from its spec, its grill Log and the live routes, with the screen each step shows and the spec rule it proves; flags seats no journey covers and e2e tests that can never fail. Use before a QA run (qa-flow runs it first), or to check which seats a feature's journeys cover.
---

# journey-map — every seat's storyline, from the spec

A QA run tests the paths its tester thinks of. This skill makes the spec choose them: each **seat** the spec names gets a **storyline**, and each step names the screen that person sees and the rule it proves. (THV-2003: an adult who signed up as "Myself" got the kid onboarding in production four days after the Music Passport launch. No QA run had mapped the adult seat, and the adult e2e journey's check sat in a `.catch(() => {})`, so it could never fail.)

The skill reads and writes one file. It changes no product code and no test; what it finds goes in the file's Gaps, and the run that reads the file handles each gap under Thoven law's **Own what you find**.

## Inputs

- **The spec and the Log.** The Project's Spec document and its grill Log (the decisions log) in Linear, bodies read in full (`workspace`). Where the Linear MCP is missing, as in a subagent, query `https://api.linear.app/graphql` with the key in `~/.config/thoven-linear/api-key`.
- **The live code, read-only.** The frontend at the deployed SHA: `git -C ~/thoven/frontend fetch origin main`, then `git grep <term> FETCH_HEAD -- app components lib` and `git show FETCH_HEAD:<path>`. To scan files, `git archive FETCH_HEAD <paths> | tar -x -C <run dir>`. Leave every checkout as it is.
- **The e2e journeys** for the feature: `git grep -l` under `e2e/` for each seat's entry (its signup intent, route or persona).

## Steps

1. **Seats.** List every seat the spec and the Log name: each "As a <role>" in the user stories, and each path the spec splits a role into. For the Music Passport that was the adult learner ("Myself"), each parent path (under 13, teen, siblings, invite link, family from before the launch), the child and the teacher. A role that never drives a screen, such as "a Thoven team member", is a row marked `not walked` with the steps that check its rules. Done when every role in the spec and the Log is a row.
2. **Storylines.** For each seat write who, the entry point (the route and the control that starts it), each step with its expected screen or state as an exact observable (heading text, a `data-*` attribute, the route, a request body), and the end state, including the rows that must and must not exist. Each step cites the spec rule or Log row it proves (FG45, DD9, story 44). Read the expected values from the code at the SHA. Where the code and the spec disagree, write both and mark the step `CONFLICT`. Done when every step has an observable and a rule, or `no rule`.
3. **Coverage.** Name the e2e journeys that walk each seat, then run the inert scan over them and the helpers they import:

   ```bash
   node ~/.agents/skills/journey-map/scripts/inert-tests.mjs <spec files or directories>
   ```

   It lists each assertion a `.catch` or an empty `catch {}` swallows, each skipped or `fixme` test (a conditional skip included), and each spec file with no `expect`. Exit 1 means findings and exit 2 means it found no spec file to scan, which is never a clean result. Done when every journey named in this step went through the scan.
4. **Write `JOURNEYS.md`** into the run directory (qa-flow's, beside `steps.jsonl`; on its own, a folder the caller names) in the shape below. Done when every seat has a storyline or a gap line, and the Gaps list holds every seat with no journey, every `CONFLICT`, every `no rule` step and every scan finding.

## The file qa-flow reads

```markdown
# Journeys — <Project> · spec <doc url> · code frontend@<sha> · <date>

| Seat | Entry | End state | e2e journeys | Scan |
|---|---|---|---|---|

## <seat-key> — <who>
Entry: <route, control, request>. End state: <screen, rows that exist and rows that must not>.

| # | Step | Route | Expected (exact) | Proves |
|---|---|---|---|---|

## Gaps
- <seat or step>: <what is missing or inert>, <file:line or rule id>
```

One seat is one qa-flow flow, and one step row is one criterion with its expected value.
