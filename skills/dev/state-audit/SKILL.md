---
name: state-audit
description: Audit built code for state robustness, including flag soup, transitions hidden in effects or conditionals, effects detached from transitions, and missing recovery, timeouts or back-pressure. Use before the first DONE on a stateful feature, when a flow keeps breaking in new ways, or for /state-audit.
---

# State audit

The audit recovers the machine the code actually implements, compares it with the one it should implement, and reports where they differ. The audit edits nothing. A finding in code the ticket owns is fixed on its branch in the same round. A finding outside it gets one line in an existing grouped Linear issue.

The intended machine is the `/state-brief` output in the Linear parent when one exists. Otherwise it is the design source and the issue. The `statechart` skill turns a suspected race into a shortest bug path when it is installed (`~/.agents/skills/statechart/SKILL.md`).

## 1. Scope

Take the feature's diff, or the files the user names. Add every other place that writes the same status column or reads the same flags, using `graphify-out/` for callers and a text search for the rest.

Done when: every module, hook, job and endpoint that reads or writes this state is listed.

## 2. Recover the machine as built

For each piece of state logic, list every variable that describes the flow, such as `useState`, refs, store fields, columns and job arguments, with each place that writes it, as `file:line`. Then write the states that combination of variables can actually reach, and the events that move between them.

Run each probe over the scope. A search is a starting point, and a hit counts only once you have read it.

- **Flag soup.** Two or more booleans or nullable fields that describe one process, and conditions like `loading && !error`. Search `rg -n 'useState(<boolean>)?\((true|false|null)\)'`.
- **Hidden transitions.** An effect that sets state from other state, or a status write outside the owning module. Search `rg -U -n 'useEffect\(\(\) => \{\s*if \([^)]*\)\s*set[A-Z]'`, and in the backend `rg -n 'update(_column|_columns|!)?\(.*\b(status|state):' app -g '!app/domain/**'`.
- **Copied server state.** React Query data mirrored into `useState`, or a `useState` initialised from server props and never updated from them again.
- **Missing recovery.** An async effect with no failure branch, no timeout, no cancel on unmount, or no retry limit. A job whose retry does something different from its first run. Search the scope for `await` with no failure dispatch, and `rg -n 'retry_on' app/jobs`.
- **Detached effects.** An effect that runs during render, runs from two places, or runs from a component that is not the owner.
- **Transaction boundaries.** An email, a Stripe call or a job enqueue inside a `transaction do` or `with_lock` block that can roll back. A status write and its effect in separate transactions with no compare-and-set.
- **Isolation and back-pressure.** Heavy work in the request path, such as a handler that loops over records. A second press or a burst of webhooks with no guard.
- **Reversibility.** A migration in the diff that renames or removes a status value, or has no `down`.

Done when: the as-built states and transitions are written down, and every probe has been run with its hits read.

## 3. Prove the reachable bad states

A claim that the code can reach an impossible or inconsistent state carries the event sequence that reaches it, and one of these:

- A failing test that drives that sequence.
- A live repro on the real surface.
- For a race between two or more actors, a statechart model of the code as built, whose report gives the shortest path to the broken rule. Replay that path against the real code. A path that does not reproduce means the model is wrong until shown otherwise.

Without one of these, label the claim inferred. Size each finding by who it hits, how often, and what it costs, before proposing a fix.

## 4. Evaluate each machine

For each piece of state logic, answer:

1. Can it reach an impossible or inconsistent state?
2. Are its transitions explicit and complete?
3. How much code changes to add a step, a branch or a recovery path?
4. Can the logic be tested alone, by sending events and asserting the next state?
5. Does it have one owner, isolated from other work?
6. Does a diagram or a transition table describe it?

Rate it:

- **High.** One owner, a union type, every write goes through a transition, and tests drive events.
- **Medium.** The states are explicit, but a transition, a failure path or a test is missing, or an effect sits outside its transition.
- **Low.** A bad state is reachable, or the flow lives in flags and effects with no single owner.

## 5. Report

- **Files.** The modules, hooks, jobs and endpoints involved.
- **Rating.** One per machine, with a one-line reason.
- **Highest-risk spots.** Each with `file:line`, a short snippet, the event sequence, and its evidence or the label inferred.
- **Improvements.** Concrete moves, such as "extract to a reducer with these states and events", "make these three states children of `paying`", "move this effect onto the `CONFIRMED` transition", "make this job retry to the same end state", or "give this migration a `down`". For an extraction, write the target machine with `/state-brief` steps 2 to 6.
- **Diagram.** The as-built machine beside the intended one, with every difference marked. When statechart ran, its chart is the as-built diagram. Put both on one page made with the `visual-artifacts` skill, because this terminal does not render Mermaid.
- **Lint candidates.** For each repeated pattern, the search that finds it, its count of real hits after reading them, and the false positives seen. A pattern with three or more real hits becomes one Linear line proposing an oxlint rule in the frontend's `.oxlintrc.json`, or a RuboCop cop in the backend. Fewer hits stay in this report.
