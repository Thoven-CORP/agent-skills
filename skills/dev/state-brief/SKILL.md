---
name: state-brief
description: Design a stateful feature as an explicit state machine before code. Use before building a multi-step flow, a request that can fail or retry, a record with a status column, or a job or webhook workflow; when a plan holds two or more flags for one process; or for /state-brief.
---

# State brief

The brief names the machine before the code: its states, events, transition table, owner and invariants, with a diagram drawn from the table. The code implements the table and adds no transition the table lacks.

It covers a flow with three or more states, anything that waits on a request, and anything a job, webhook, timer, second tab or second person can move. A local toggle such as open and closed gets no brief. Server data stays in React Query, whose status is already a machine; the brief covers what the user or the system does with that data.

`/state-audit` is the check after the build. The `statechart` skill is the model checker this brief feeds. When `~/.agents/skills/statechart/SKILL.md` exists, step 5 hands the brief to it.

## 1. Find what exists

- Read the decisions in the Linear parent and the design source the issue names. Read the source's REJECTED block too. A state the design draws is a state, and a state it rejected stays out.
- Read the code the feature touches. In the backend, find the model's `enum :status` and every write to that column (`rg -n 'update(_column|_columns|!)?\(.*\b(status|state):' app`). In the frontend, find the hooks and components that hold the flow. Use `graphify-out/` for callers that a text search misses.

Done when: each existing status value and each place that writes it is listed with `file:line`.

## 2. List the states and events

- **States** are named in product words, such as `choosing`, `approving`, `approved` and `failed`. Data that exists in one state lives on that state, as a member of a discriminated union like `{ kind: 'failed'; code }`. It is never a sibling field that is null in every other state.
- **Compound states.** When several states share an exit, such as cancel or an expired session, make them children of one parent and put the exit on the parent once.
- **Parallel regions.** When two things vary independently, such as an upload's progress and a form's validity, give each its own region. Never list their cross product.
- **Events** are user intents or facts that happened, each with its payload: `APPROVE_PRESSED`, `PAYMENT_CONFIRMED { paymentId }`, `TIMED_OUT`. List the events the system sends too: a webhook arrives, a job retries, a timer fires, another tab or person changes the record, the session expires.

Done when: every state has a way out or is marked final, and every event names the states that accept it.

## 3. Write the transition table

| From | Event | Guard | To | Effect |
| --- | --- | --- | --- | --- |
| `ready` | `APPROVE_PRESSED` | one or more ticked | `approving` | `POST /consent/payments` |

Write one row for each state and event that the machine accepts. For every other pair, say whether the event is ignored or refused. The default is ignored in the UI and refused with an error in the backend. Name each effect, such as `POST /consent/payments`, `enqueue ReminderJob` or `send the receipt email`. An effect runs on its transition, started by the owner, and never from a render or from a callback that works the state out again.

Done when: every effect sits on a row, every async effect has a success row and a failure row, and every timer or retry has a row for firing and a row for being cancelled.

## 4. Name the owner

Each machine has one owner, and every write goes through it.

| What holds the state | Owner | House example |
| --- | --- | --- |
| A frontend flow | A pure module `<feature>-state.ts` that exports the union types and `reducer(state, event)`. A hook runs the effects and dispatches their results as events | `components/parent/purchasing/purchase-approval-state.ts` and `usePurchaseApproval.ts` |
| Server data | React Query, or the owner hook when the read is part of the flow. Either way the reducer receives the read's result as an event and keeps no loading or error flag of its own | `usePurchaseApproval.ts` dispatches `READ` or `READ_FAILED` from its own read |
| A backend record's lifecycle | A module under `app/domain/` that owns every write to the status column. Each transition is one compare-and-set or runs under `with_lock`, and only the caller whose update moved the row runs the effects | `app/domain/consent/attempts.rb` |
| Background work | A solid_queue job that reads the row again and calls the domain transition. A retry reaches the same end state | `app/jobs/consent/reconcile_job.rb` calls `Consent::Attempts.reconcile!` |

XState is not installed in the frontend. Adding it is a dependency decision for Andres. Propose it only when the machine needs spawned actors or timers across parallel regions that a reducer would have to build by hand.

A status value the frontend shows is a payload field. It belongs in the parent's API decision rows, because both repos' suites stay green when it drifts.

When the machine spans a request and a job or webhook, also write down:

- **Races.** Who wins when two transitions start from the same state, and what a duplicate delivery does.
- **Timeouts.** The limit, the event it sends, and what the user sees while waiting.
- **Back-pressure.** What a second press does while the first request is out. The house answer is a press guard, like the `pressing` ref in `usePurchaseApproval.ts`. Also what a burst of jobs or webhooks does to the database.
- **Isolation.** Heavy work such as a backfill or a fan-out runs in a batched job, never in the request.
- **Reversibility.** Adding an enum value is reversible. Renaming or removing one needs a migration plan from the `safe-migrate` skill.

## 5. Write the invariants and the tests

An invariant is a sentence that holds in every state, in product words, such as "an approved request has exactly one grant" or "no request is out unless the state is `approving`". A rule that the union already enforces, such as "never a spinner and an error together", needs no test. Say that the type enforces it.

| Check | When |
| --- | --- |
| A reducer unit test for each table row, driving events and asserting the next state, plus one test for each ignored pair a user can actually hit | Every frontend machine |
| A `switch` on `state.kind` and `event.type` that ends in a `never` assignment, so a new state fails the type-check until it is handled | Every frontend machine |
| A spec for each transition, including two concurrent transitions from one state: one wins and its effects run once | Every backend machine |
| The `statechart` skill: a TLA+ model whose INVARIANTs are this step's sentences | Two or more actors, a retry, a timeout, or a race |
| `/state-machine` renders each UI state once it is built. Its switcher list equals this brief's UI states | A component with four or more reachable states |

The `test-audit` skill sets the bar for each test.

### Feeding statechart

`statechart` is user-invoked, so read `~/.agents/skills/statechart/SKILL.md` and follow it. The brief already holds what its spec needs:

| Brief | statechart |
| --- | --- |
| A state's product name | The label that `state(vars)` returns in the view |
| A compound state | `state()` returns an array, parent first |
| Parallel regions | `state()` returns an object with one key per region |
| An event | One TLA+ action in `Next`, written as a disjunction. `step()` returns the event in the user's words |
| A guard | The bracketed condition at the end of the `step()` label |
| A final state | The `Done` action that holds only in final states |
| An invariant | One INVARIANT line. Add a variable when no variable can express the rule |

Each bug path in its report becomes a test that replays the path against the real code, one step per action, before the build starts. A path that does not reproduce means the model is wrong until shown otherwise.

## 6. Draw it and record it

- **Diagram.** When statechart ran, its `chart.mmd` is the diagram, because it was checked rather than drawn. Otherwise write a Mermaid `stateDiagram-v2` from the transition table, with compound states as nested blocks and parallel regions split by `--`. For a flow across services, add a `sequenceDiagram`. This terminal does not render Mermaid, so put the diagram on a page made with the `visual-artifacts` skill and open it.
- **Record.** The binding text goes in the Linear parent as decision rows: the machine as an architecture row, status payload fields as API rows, and enum changes as database rows. Use the `workspace` skill, or write to the path the issue's `Writes to:` line names. The HTML page is only a view of it.

## Output

1. The states and events, and the transition table.
2. The diagram, with its page path.
3. The implementation approach: the owner and pattern from step 4, and why the alternatives lose.
4. The invariants and the test plan, with the statechart result when it ran.
5. Cross-cutting concerns: isolation, consistency, retries, timeouts, back-pressure and reversibility.
