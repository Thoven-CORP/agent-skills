# TLA+

Use TLA+ only when the guarantee is about **event orderings**. Two writes, a retry and a confirm, a webhook and a user click, a job and a request. If the question is "can these steps happen in a bad order?", this is the tool.

Do not use TLA+ for

- a missing null check
- a wrong amount
- a CSS or copy bug
- a parser or a data-structure invariant on one thread

Those belong in [property-tests.md](property-tests.md).

## How to run

Prefer a PlusCal or TLA+ spec that names this repo's events. One model, one invariant, one bound on steps.

Record

- spec path
- TLC version
- the invariant in one sentence
- the counterexample as a short sequence of product events, not TLC internals

A spec you have never seen fail proves nothing. Break one step on a scratch copy and show TLC find it before you trust a pass.
