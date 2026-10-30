---
name: text-product-analysis
description: Text product analysis — mine the teacher↔parent text threads in Twilio for product feedback, bug reports and hiccups, trace each bug, and hand Andres a themed page and his calls. Use for "analyse the texts", "what are families texting about", or a feedback sweep of the last few weeks.
---

# Text product analysis

Teachers and parents text each other through Thoven, and those threads are the most candid
product feedback we have: what broke, what confused people, and what teachers did by hand
because the product did not. This skill reads them, checks every bug against production, and
hands Andres a page segmented by theme plus the calls only he can make.

**Twilio is the transcript.** The database misses replies and holds texts that never left
Thoven, so it only labels what Twilio shows: names, teacher versus automation, and delivery
gaps. Main keeps synthesis; every bulk read goes to a subagent (sonnet, high effort).

Open a task list with one entry per step.

## 1. Scope

Default window: the 21 days ending today. Names Andres gives narrow it to those families or
teachers. Scratch folder: `/tmp/text-product-analysis/<YYYY-MM-DD>/`.

Done when your first message states the window, the scope and the scratch folder.

## 2. Pull

Run the fetch, sourcing the backend env in the same command and printing nothing from it:

```bash
cd ~/thoven/backend && (set -a; source .env >/dev/null; set +a; \
  python3 <this skill>/scripts/fetch_twilio.py --out <scratch>)
```

One subagent runs queries 1 and 2 in [references/db-lookups.md](references/db-lookups.md) and
writes each value verbatim to its file. Then run
`python3 <this skill>/scripts/build_threads.py --dir <scratch> --since <start>`. When it prints
DB-only ids, the subagent runs query 3, and you run the build again.

Done when the build prints no "without a body" line and no "no db_people row" line, and you
have listed the test and internal threads it excluded, by teacher and parent.

## 3. Read

Split the in-window threads that hold teacher or parent text into batches of about four. Give
one reader subagent per batch, at most five at once, and one more for the notification-only
threads. Brief each reader with [references/signals.md](references/signals.md), its thread
names, the `threads.json` path and the window. Readers return signals and their read counts;
they do not diagnose.

Done when every reader's read counts match its threads' `counts` and you hold the merged
signal list.

## 4. Segment

Group the signals into themes, and cluster each `bug report` with the anomalies from
`anomalies.json` that share its cause. A theme about a timing or policy rule (how long a request
stays open, how fast teachers answer) gets its production number from one read-only subagent.

Done when every signal sits in exactly one theme or bug cluster.

## 5. Trace

Launch one tracer subagent per bug cluster, in parallel, briefed per
[references/trace.md](references/trace.md). For each `NOT FIXED` or `UNKNOWN` verdict, run
`/diagnosing-bugs` yourself, read-only, and stop at the diagnosis.

Done when every bug has a verdict naming a real record, and every `NOT FIXED` bug has a
diagnosis or a stated reason it has none.

## 6. Page

Run `python3 <this skill>/scripts/render_threads.py --dir <scratch>`, then build the page with the
`visual-artifacts` skill to the outline in [references/artifact.md](references/artifact.md).

Done when `finish.mjs` reports every diagram rendered and the page is open in the browser.

## 7. Brief

Reply in chat, finding first: one line per bug with its verdict, one line per theme, the page
path. Then ask Andres his calls through the ask tool, at most four, each with your pick first:
which fixes to dispatch, which product rules to change, and where the tickets go. Write to Linear
only after his answers, through the `workspace` skill: a delivery problem becomes a line in the
existing messaging-reliability issue, a new ticket only when no open issue fits, and nothing goes
under a Project he did not name.

Done when the page path is in the reply and every call carries a recommendation.
