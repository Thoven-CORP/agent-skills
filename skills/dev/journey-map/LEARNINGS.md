# Learnings — journey-map

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-11-28 — Persona and journey creator from a roster; the inert-test scan leaves

> session · 2026-11-28 · THV-2197 · correction · applied · seen 1

**What happened.** THV-2193 grill: journey-map is "a product flow QA creator skill ... it doesn't understand the context of our user base ... adult learners, teachers, parents, older teachers, younger teachers, a platform that's built for under 13 ... teens ... simulate real usage, try to simulate production cases".
**Why.** Seats came only from the spec, so a persona the spec never named went unwalked, and seeds were not production-shaped. The inert-test scan was a check in a skill; checks live in code (the frontend's `vitest/no-disabled-tests` and `no-conditional-in-test` rules already cover skips).
**What changed.** references/roster.md holds the personas and their staging seeds; the skill picks personas the change reaches, writes goal journeys with observables, and a seed line per persona. Deleted scripts/inert-tests.mjs and its test.

## 2026-11-23 — A QA run walks every seat the spec names, and a journey that cannot fail is not coverage

> reflect · 2026-11-23 · e2ee8938 · skill-gap · applied · seen 1

**What happened.** THV-2003: on Nov 20 the first adult to sign up as "Myself" after the Music Passport launch (Nov 16) got the kid onboarding. The server refused every answer and no date of birth was saved. Mixpanel and Neon showed it, not QA. qa-flow first ran on the Passport on Nov 21, after the fix. The adult e2e journey (`e2e/parent-p2/journeys/j1-adult-myself.spec.ts`, Sept 5) held its face check at line 76 in `.catch(() => {})` until f5a53331c removed it on Nov 22.
**Why.** qa-flow picked its own paths, and no step read the spec's seats. The spec named the adult (story 44, DD9, F14), and nothing turned that row into a walk. Nothing checked whether an existing journey could fail.
**What changed.** New skill (Spec S34): it writes one storyline per seat from the spec, the Log and the code at the SHA. `scripts/inert-tests.mjs` lists swallowed assertions, skips and files with no `expect`, and `scripts/inert-tests.test.mjs` covers it, the empty-input refusal included. qa-flow Step 1 runs it first. First run on the Music Passport spec: the adult seat's storyline, a `CONFLICT` between story 44's "no list" and the 2026-11-20 ruling the code follows, and eight skipped or `fixme` passport tests.
