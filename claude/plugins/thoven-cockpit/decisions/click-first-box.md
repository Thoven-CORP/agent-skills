# Cockpit Work tab: a click-first action box

Status: DRAFT, awaiting Andres's review. Nothing here is built.

## Why

Andres could not tell how to operate the cockpit. Three causes, all read from the code and the mod API:

- The pane starts without the keyboard. `f m r t u h`, Tab and the arrows work only after the person gives the pane the keyboard (`ctrl+x tab` or a click; Esc returns it). Nothing on screen says which state the pane is in, yet the UI printed the letters as if they worked.
- Clicking works, but a ticket's title is a hidden button: it switches herdr to that agent's tab and the cockpit shows nothing.
- The actions were drawn as plain text, and their result (a draft in main's prompt box) lands outside the pane.

Andres chose click-first. He wants to keep the table, keep a box under it, and have the box say what each action does.

## What stays

The Work table, its columns and cell glyphs, the `▸` marker, the OTHER list, the PRs and All tabs' data. `m`, `r`, `t`, `f` and `u` keep working for anyone who has given the pane the keyboard.

## The box

Below the table, one box titled with the selected ticket, in two halves. Left: status sentences, then `Next:`. Right, headed "Do something": one button per action, each with a few words on what it does.

```
 ┌ THV-1007 ─────────────────────────────┬─ Do something ────────────────┐
 │ Claude is idle.                       │ [ Review ]     start a verifier│
 │ Builder reported DONE, fix round 1/5. │ [ + thermo ]   verifier + deep │
 │ PR #168 open, CI passes.              │ [ Merge ]      draft the merge │
 │ No verifier has run.                  │ [ Switch tab ] go to its agent │
 │ Next: review it.                      │                                │
 └───────────────────────────────────────┴────────────────────────────────┘
```

Narrow panes: below 70 columns the halves stack, sentences first, then one button per line with the same explanation. The wording does not change.

## Buttons

| Button | Does | Needs |
| -- | -- | -- |
| Review | Drafts "Start the verifier for THV-n (repo#n, base origin/<base>) as dispatch-work step 5 says." in main's prompt box | an open PR |
| + thermo | The same draft plus `/thermo-nuclear-code-quality-review` whatever the diff size | an open PR |
| Merge | Drafts `merge it owner/repo#n` | an open PR |
| Switch tab | Moves herdr to the agent's tab and says which | a live pane |

- Drafts only fill the prompt box. Nothing is sent until Andres presses enter, and the cockpit still runs no command that changes anything but the herdr focus.
- A button with no valid action stays drawn but dim, and its explanation says why ("needs an open PR", "no live pane").
- The button for the `Next:` step has a bold border, so the box says what to press first. `Next:` is read off the row's cells by `nextStep` in `hooks/detail.ts`.

## Selecting

Clicking a row selects it (`▸`) and the box follows. Clicking the title no longer switches tabs; Switch tab is its own button.

## Result line

One line under the box says what the last click did, for example "Drafted in the prompt box. Press enter there to send it." or "Switched to Audit · Tooling (THV-1007)". It stays until another ticket is selected or the tab changes.

## What goes

The `f/m/r/t` hints beside the buttons and the long footer sentence. The `h` legend stays as one small "what the columns mean" link.

## Out of scope

The PRs and All tabs keep their current layout for now. They share the `draftButtons` helper, so they get the explanations and dim states, not the box. Reword of the OTHER list's `done X`. The bare `/code-review` in the `orchestrate` references.

## Tests

- Re-print the Work-tab pins in `tests/pin.test.ts`; no `board.*` or facts literal moves.
- The box lays out in two halves at 70 columns or more and stacks below.
- A ticket with no open PR draws Review, + thermo and Merge dim, each with its reason; a ticket with no live pane draws Switch tab dim.
- The bold border sits on the button that matches `nextStep` for each of: no PR, CI failing, CI running, review not run, review claimed but missing, thermo due, ready to merge, merged.
- Pressing each button: Review, + thermo and Merge fill exactly the drafts above and send nothing; Switch tab runs one `herdr agent focus` argv and nothing else; the gate test still finds no argv containing `merge`.
- Clicking a title selects the row and runs no herdr argv.
