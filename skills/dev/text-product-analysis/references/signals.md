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
| `churn` | a family paused, stopped, or said why they might |
| `positive feedback` | praise for the teacher, the lesson or the product |

An automated Thoven text is a signal only when a person reacts to it, or when it is wrong on its
face (a wrong time, a dead link, the same text twice).

## Reader's done line

Every in-window teacher and parent message in the assigned threads was read, and the reader
reports, per thread, how many it read beside the thread's `counts`. A thread with no signal says
so.
