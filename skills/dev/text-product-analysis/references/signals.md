# Signals

A **signal** is one message that tells us something about the product: the words a teacher or
parent actually wrote, tied to the moment they wrote them. Readers return signals; main segments
them into themes.

## Shape

One row per signal, as a JSON object:

| Field | Value |
|---|---|
| `thread` | `teacher ↔ parent` as `threads.json` names them |
| `at` | the message's UTC timestamp, copied from `threads.json` |
| `speaker` | `teacher`, `parent` or `automation` |
| `quote` | the shortest verbatim span that carries the point, copied character for character |
| `type` | one of the types below |
| `note` | one plain sentence: what happened, and what the product did or failed to do |
| `in_window` | true when `at` falls inside the window; older messages count as context only |

## Types

| Type | The message shows |
|---|---|
| `bug report` | the product did something wrong or failed to do what it claims ("not showing in the dashboard") |
| `confusion` | a person did not know how something works, or misread it (time zones, where to click) |
| `scheduling friction` | booking, moving, missing or cancelling a lesson took texting the product should have handled |
| `teacher workaround` | a teacher did by text what the product should do (explaining a decline, tracking credits by hand) |
| `feature ask` | someone asked for something the product does not offer |
| `churn` | the family says they are stopping, switching teachers, or not coming back, or the teacher says the family has stopped practicing or will not continue. A vacation, an illness or one missed week is not churn |
| `rude` | an insult, a threat, or abuse aimed at the teacher or at Thoven. Impatience, a short reply and a complaint are not rude |
| `quality` | a complaint about the teaching, the lesson, a no-show, or the teacher not replying. Praise stays `positive feedback` |
| `product frustration` | the person is blocked or annoyed by the product: they cannot book, pay, approve or see what they bought |
| `positive feedback` | praise for the teacher, the lesson or the product |

One message can emit two signals when it is both a tone (`rude`, `churn`, `quality`,
`product frustration`) and a defect (`bug report`). The tone signal is the person's reaction.
The bug signal is the claimed defect, and only the bug goes to a tracer.

A thread with no `rude`, `churn`, `quality` or `product frustration` signal still reports those
four as empty. Silence is a result, not a skipped check.

An automated Thoven text is a signal only when a person reacts to it, or when it is wrong on its
face (a wrong time, a dead link, the same text twice).

## Reader's done line

Every in-window teacher and parent message in the assigned threads was read, and the reader
reports, per thread, how many it read beside the thread's `counts`. A thread with no signal says
so.
