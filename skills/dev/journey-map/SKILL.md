---
name: journey-map
description: Pick the Thoven personas a change reaches from the user roster, write each one's journeys with the screen every step should show, and name the production-shaped seed each needs. Use before a qa-product walk, or to see which users a feature's journeys cover.
---

# journey-map

A QA run walks the paths its tester thinks of, and a tester who knows the code thinks like an engineer. This skill makes the run walk as Thoven's users: under-13 learners with a parent, teens, adult learners, parents of several children, younger and older teachers. (THV-2003: no run walked the adult who signs up as "Myself", and an adult got the kid onboarding in production.)

It writes one file, `JOURNEYS.md`, and changes no product code and no test.

## Inputs

- **The roster**: [references/roster.md](references/roster.md), the personas from production's shape.
- **The spec and its Log** in Linear, bodies read in full (`workspace`). With no Linear MCP, query `https://api.linear.app/graphql` with the key in `~/.config/thoven-linear/api-key`.
- **The code at the SHA under test**, read-only: `git -C ~/thoven/frontend fetch origin`, then `git grep <term> <sha> -- app components lib` and `git show <sha>:<path>`.

## Steps

1. **Personas.** Take every roster persona whose path crosses the change: the ones the spec names, and the ones the diff never names but who pass the same screen (a parent-side change has a teacher-side twin; a signup change reaches the adult, the parent of one and the parent of three). A persona the spec adds that the roster lacks goes into the roster in this run. Done when every persona is in or out with a one-line reason.
2. **Journeys.** For each persona, each journey is a goal the person has ("book a second child into the same teacher"), not a feature. Write its entry (route and the control that starts it), each step with what the screen should show as an exact observable (heading text, a button label, the route, a request body), and the end state, including the rows that must and must not exist. Read expected values from the code at the SHA; cite the spec rule or Log row a step proves. Where code and spec disagree, write both and mark the step `CONFLICT`. Add what this person would also try on the way (go back, switch child, retry, leave and return). Done when every step has an observable, and every journey has an end state.
3. **Seed needs.** For each persona, the state its journeys start from, **production-shaped**: names of real length (the snapshot scrubber cuts every name to 17 characters, which hides layout bugs), past sessions and notes for an account that has history, the right consent band from a real date of birth. Name the staging account or the seed that provides it (the roster's Seeds). Done when every persona has a seed line a walker can act on.
4. **Write `JOURNEYS.md`** into the caller's run folder in the shape below. Done when every chosen persona has its journeys and seed line, and Gaps lists every `CONFLICT`, every step with no rule, and every persona with no account or seed.

## JOURNEYS.md

```markdown
# Journeys — <change> · spec <url> · frontend@<sha> · <date>

| Persona | Device | Journeys | Seed |
|---|---|---|---|

## <persona> — <goal>
Entry: <route, control>. End state: <screen; rows that exist and rows that must not>.

| # | Step | Route | Screen shows (exact) | Proves |
|---|---|---|---|---|

Also tries: <the two-way moves this person makes>

## Gaps
- <persona or step>: <what is missing>, <file:line or rule id>
```
