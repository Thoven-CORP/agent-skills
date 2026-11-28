---
name: qa-product
description: Walk a change as Thoven's real users with agent-browser, recording each journey, then report findings grouped by cause. Use before a parent issue lands, to reproduce a production report on a prod snapshot, or to smoke production after a promote.
---

# qa-product

Walk the product as the people who use it: an under-13 learner and the parent beside them, a teen, an adult learner, a parent of three, a teacher in their sixties. Each persona walks its whole journey on the route it reaches, with production-shaped data, on agent-browser, and the walk is recorded. Then diagnose, group by cause, report, and stop. This skill finds; it fixes nothing.

agent-browser is the QA tool. A journey that walks clean and is stable becomes a deterministic test through the `e2e` skill; name it in the report and leave the test to that skill. Design judgment is `qa-design`.

## Pick the run

| The run | Load |
|---|---|
| A change on a branch, local or on staging (the default) | [references/walk.md](references/walk.md) |
| A production report to reproduce | [references/prod-snapshot.md](references/prod-snapshot.md) for the data, then [references/walk.md](references/walk.md) |
| Production, after a promote | [references/production.md](references/production.md) |

Every run ends with [references/diagnose-and-report.md](references/diagnose-and-report.md).

## Steps

1. **Personas and journeys.** Run `journey-map` for the change. Its `JOURNEYS.md` names each persona the change reaches, every journey to walk, and the seed each one needs. Done when `JOURNEYS.md` sits in this run's folder and every journey in it has a seed line.
2. **Seed.** Build the data each journey needs, production-shaped: real-length names, history, several children where the persona has them. Done when every persona can log in and stands at its journey's entry with the state `JOURNEYS.md` names.
3. **Walk.** Follow the run's reference. Complete every journey. A finding that leaves the way forward open is logged, and the walk goes on; only a one-way door stops a journey: the page will not load, the next step cannot be undone on real data, or the seed is wrong in a way that makes the rest meaningless. Done when every journey is walked to its end or stopped at a named one-way door, and each has its recording.
4. **Diagnose, group, report.** Follow [references/diagnose-and-report.md](references/diagnose-and-report.md). Done when every finding has a cause, every group fits one agent's round, and the report is delivered. Then stop.

## Safety

- **The production read is human-run.** You build the extract, the neutralisation and the harness; a person runs the `pg_dump` from production, because it copies real children's data (`prod-snapshot.md`).
- **Ambiguous people stop the run.** Four parents share one display name, and one name belongs to a teacher and a parent. Follow the rows to the account you mean; when it is still ambiguous, name the candidates in the report and walk nothing on them.
- **Writes stay inside test accounts.** Every snapshot load neutralises email, phone and tokens before it lands. `keri@thoven.co` teaches real children: never seed or write there; her test account is `kerimanerten@icloud.com`.
- **Heavy runs go to the mini.** Recording browsers run there through `run-on-mini` ("browser work"); platform reads (Neon, Sentry, Mixpanel) run on the laptop.

## Pitfalls

- Assert a toast that precedes a redirect with an `addInitScript` MutationObserver that records each toast to `sessionStorage`, and read it after the redirect settles; polling from the driver races the navigation. (LEARNINGS 2026-08-06)
- Treat a Neon branch of production as a copy of production's PII: it carries production's role password, so reset the branch role's password before any agent sees its connection string. (LEARNINGS 2026-11-09)
- Run a journey that locks, drains or spends an account on a seeded throwaway account, never on the accounts publish's smoke logs in with. (LEARNINGS 2026-11-09)
