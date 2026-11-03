# Feeding statechart

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
