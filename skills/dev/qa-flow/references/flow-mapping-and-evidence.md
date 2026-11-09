# Flow mapping & evidence — map before you test, log as you go, ship an artifact

Companion to `execute-and-evaluate.md`. That doc covers *how to assert*. This one covers what to
do **before** the first assertion and what to leave **behind** after the last one.

---

## 1. Map the product flow, not just the deployment

You already prove *the release is live*. This is the different question: **what order must the
flows be tested in, and what will the DOM actually look like when you get there.**

Produce a click map before the first assertion. It is cheap and it prevents a whole class of
wasted run.

**Read selectors from the deployed code, never the working tree.** Use a detached worktree at the
deployed SHA. In the reference run, local `main` was one commit ahead of production *and* carried
uncommitted work from other agents — testing against it would have QA'd code no user has.

```bash
git worktree add ../fe-live <deployed-sha>
```

**Find the hard gates.** A hard gate is a UI control that is *disabled or absent* until an earlier
flow completes. Gates dictate test order, and getting the order wrong produces failures that are
artifacts of your sequencing rather than defects.

In the reference run, `lib/parent-cta-gates.ts` gated two CTAs:

| CTA | Enabled when |
|---|---|
| Purchase Lessons | `hasActiveEnrollments` |
| Schedule Lessons | `hasActiveEnrollments && hasCredits` |

and the family-scoping radio was `disabled` until the teacher had at least one attachable family.
So enrol → purchase → schedule was not a convention, it was enforced by the product. Testing
scoping first would have reported "the feature is unclickable" as a defect.

Grep for the shape: `disabled=`, `aria-disabled`, `cursor-not-allowed`, and any `*-gates.ts` /
`selectHas*` selector module.

**Note the two-implementation traps.** The same user-facing action often has separate parent and
teacher components. Record which one you are actually testing. Also record routes that exist but
are *not* on the live path — `/parent/scheduling` exists, but the CTA pushes to
`/parent/book-lessons`, and testing the wrong one proves nothing.

**Output:** a short `CLICK_MAP.md` — per flow, the URL, the component file, the exact selectors or
visible strings, and any gate. It is also the thing that makes a second run cheap.

---

## 2. Log as you go, to a machine-readable file

**Write each record the moment you observe it.** End-of-run writing is the single most consequential gap:
findings live in the conversation, and a compaction or a crash takes them with it.

Append **one record per step, at the moment you observe it**, to `steps.jsonl`:

```json
{"flow":"a5","step":3,"title":"Form survives background refetch","url":"https://…","screenshot":"a5-03-form.png","network":"","expected":"Open form survives refetches","verdict":"pass","note":"Held the form open 35s. Dashboard polls 3 endpoints every 15.00s (gaps 14994–15008ms), so ≥2 cycles landed inside the window. Every field byte-identical after.","slowest_ms":null,"slowest_call":null}
```

Rules that make the log worth having:

- **Append immediately.** Not in batches, not at the end of a flow.
- **The `note` field carries the evidence** — exact numbers, `file:line`, DB values. Everything
  downstream (the report, the severity ranking, the HTML map) is generated from these notes, so a
  vague note is a finding you will have to re-derive.
- **Say measured vs reasoned.** "Measured 818×460" and "would render 259px wide by arithmetic" are
  different epistemic states and the report must preserve which is which.
- **Record non-defects too.** A step that looked broken and wasn't is worth a record, or the next
  person re-investigates it. Use `info`.

`steps.example.jsonl` in this directory is a real excerpt.

---

## 3. Six verdicts, because "not passing" has kinds

| Verdict | Means | Routes to |
|---|---|---|
| `pass` | Behaved as specified | — |
| `fail` | Functional defect | Engineering |
| `design` | Works, but off design-system | Design / FE polish |
| `partial` | Could not fully verify — usually an environment limit | Re-run elsewhere |
| `blocked` | Prerequisite absent | Owner decision |
| `info` | Observation or explicit non-defect | Nobody, on purpose |

`design` and `partial` are the two that earn their place.

**`design`** keeps the fail count meaning "broken". A hand-rolled button and a swallowed 422 are
both "wrong" but they go to different people with different urgency.

**`partial`** is what stops an environment limitation being filed as a defect. In the reference
run, a live-lesson page rendered 146 elements and **zero** buttons — no toolbar, no end-lesson
control. Filed as `fail` that is an alarming P1. It was almost certainly headless Chromium with no
camera or microphone. It went in as `partial` with the caveat as the first line of the note, and
that was the honest call.

---

## 4. REQUIRED: a design row in every verdict table

Every run's verdict table carries a **Design** row. Not a separate pass, not an optional section.
Fill it while you are already on the page:

- Controls using the design-system primitive vs hand-rolled (grep for the primitive, e.g.
  `ThovenButton`, then look at what is on screen instead)
- Empty and end-of-list states that contradict loaded content, or that read as errors
  (`"no more lessons to load"` mid-panel; a counter reading `1 assigned` beside
  `No active homework yet`)
- Copy: pluralisation (`1 lessons`, `1 submissions`), and the same value formatted two ways on two
  surfaces (`0.0 MB` in a list, `11 KB` in the detail view — same file)
- Token conformance where the system specifies one (`amber-500` not `orange-500`)

If nothing is wrong, the row says so. An empty row means you did not look.

---

## 5. REQUIRED: a network and performance row in every verdict table

**Network first.** Every failed request, 4xx or 5xx, and console error from the flow's agent-browser log (`execute-and-evaluate.md`, "Evidence, not vibes") is explained or filed, and each write shows one POST per user intent. Then performance. You are already in the page with the network tab
open; the marginal cost is close to zero and it catches things static analysis cannot.

Use the Resource Timing API rather than eyeballing a waterfall:

```js
// inter-arrival gaps per endpoint — reveals polls, duplicates, and cold refetches
const marks = performance.getEntriesByType('resource')
  .filter(r => /\/api\//.test(r.name))
  .map(r => ({ t: Math.round(r.startTime), ms: Math.round(r.duration), u: r.name.split('/api/')[1] }));
```

Four things to look for, all of which were real findings in the reference run:

1. **Duplicate identical requests.** A detail dialog fired the *same* GET twice, 166ms apart —
   ~1.4s of spinner. Static analysis had predicted one redundant fetch; only the live trace showed
   it was doubled.
2. **Poll cadence.** Three endpoints at 15.00s (gaps 14994–15008ms) plus one at 30s = 12
   requests/minute per open tab, forever, continuing while a modal was open.
3. **Cold refetch on tab switch.** Returning to a tab loaded seconds earlier still round-tripped
   (294ms, 504ms) — no cache.
4. **Fetches the parent already had.** If a list response and a detail response serialize through
   the same serializer, the detail fetch is waste. Check the serializer, not the endpoint names.

Record `slowest_ms` and `slowest_call` on the step. Flag anything over 800ms.

---

## 6. Build the artifacts

Two artifacts with two readers: the technical map for checking your own coverage, and the reader page Andres reads.

`build-map.cjs` in this directory turns `steps.jsonl` into a self-contained `ui-map.html`: left rail
of flows with per-flow failure counts, a summary box at the top linking to every failure,
screenshots inline, slow calls highlighted, colour per verdict. No build step, no dependencies,
opens from disk.

```bash
node build-map.cjs          # reads ./steps.jsonl, writes ./ui-map.html
```

It skips images that are missing rather than rendering broken ones, and lists them in a footer.

Markdown reports are for reading. The HTML map is for **checking your own work** — scanning 77
steps at once makes it obvious which surface you never touched.

**The reader page.** One `visual-artifacts` page per run, organised by product flow:

- each flow's continuous video, embedded with chapter marks at its findings;
- each finding as a short card: severity (critical, high, medium, low), category (functional, visual, UX, content, performance, console, accessibility), verdict, evidence and fix;
- performance drawn with `dataviz` as what matters for this change (slowest calls, POSTs per user action, failed calls across the run).

Every result lives on a card or in a chart, and the step list stays in the technical map, linked from the page.

**Put it somewhere durable.** Not a scratch or temp directory — those are session-scoped and get
wiped. Commit it beside the findings, and decide deliberately whether the screenshots go with it
(they are usually gitignored, and the map's images break without them).

---

## 7. Capture: screenshots and recorded flows

Use this capture contract from QA, dispatch briefs and reader artifacts. A reader artifact reuses available evidence; creating or polishing it does not start or rerun feature QA.

**Host.** Heavy browser capture, recordings, encodes and capture verification run on the Mac mini, never the laptop. Before starting, record the execution host, source revision, environment, persona and viewport. Use existing remote-check and mini load-gate procedures for supported commands; an unavailable mini means the capture is deferred, not run locally. Read the verification disk-budget rule before starting.

**Journey.** Prioritise mobile. Record one continuous take per product flow or distinct persona. Weave the reversible real-user moves (`framing.md`, "Real-user take") into it: back and forward, clicking out and back in, a refresh, a cancel or unselect. Start another take when a different persona, destructive action or isolated prerequisite requires it. Retain meaningful transitions; trim only idle setup and disclose cuts. Keep real phone UI readable and preserve native playback controls in the reader artifact.

**Evidence by kind.** Before filing a finding, retry it once; one that does not repeat is an `info` note, not a defect. A finding that needs interaction to appear gets its flow video's timestamp plus a before and an after screenshot. A finding visible on load (a typo, clipped text, misalignment, a console error on load) gets one `agent-browser screenshot --annotate` and no video. File each finding the moment it repeats, then keep exploring.

**Pacing.** While recording, act at human speed so the video plays at 1x: type with `agent-browser type` or `keyboard type` (character by character), not `fill`; pause about a second between actions and two seconds on the result. Outside a recording, `fill` and no pauses keep the run fast.

**Coverage.** Map each required criterion to its evidence, using recording timestamps in the run record where useful. Required parity screenshots and exact-value assertions remain required: a readable continuous story does not replace them. Inspect links and externally delivered emails on their matching surfaces; a visible link or rendered email preview proves neither destination behaviour nor delivery. Label those limits beside the demonstration.

**Reuse and retention.** Reuse passing evidence for unchanged claims while its revision, environment and prerequisites remain applicable. After a fix, recapture the affected journey or state and reconcile old media against new copy and values. Keep credentials and session tokens out of reader exports. Embed media or move it to durable artifact-owned storage before deleting temporary evidence folders; retain the original technical record according to its workflow.

**Screenshots.**

- **Playwright MCP is sandboxed to the repo root.** A path outside it is rejected. Write to a
  gitignored directory inside the repo and symlink if you need it elsewhere.
- **Name the file after the step record** (`a5-03-form-survives-refetch.png`) and write the name
  into the record at the same moment. Hand-writing names into records later is how one goes
  missing.
- Prefer the accessibility tree for asserting **text**; use a screenshot for **visual** ground
  truth. A screenshot is evidence of layout, not of a value.

---

## 8. Multi-persona runs: capture the session, don't re-log-in

Logging in again for every persona switch is slow; the reference run's plan called for six
credential handoffs in a four-persona run.

**Log each account in once, by UI or injected token (`execute-and-evaluate.md` "Logging in"), then
stash that session in-page and switch between stashes.**

```js
// after the account logs in — capture
const stash = JSON.parse(localStorage.getItem('__qa_sessions__') || '{}');
stash['teacher'] = { token: localStorage.getItem('token'),
                     userData: localStorage.getItem('userData'),
                     profilesData: localStorage.getItem('profilesData') };
localStorage.setItem('__qa_sessions__', JSON.stringify(stash));

// switch — remove auth keys only, then restore. NEVER localStorage.clear()
const s = JSON.parse(localStorage.getItem('__qa_sessions__'))['parent'];
['token','userData','profilesData','student_token','student_data'].forEach(k => localStorage.removeItem(k));
Object.entries(s).forEach(([k, v]) => { if (v) localStorage.setItem(k, v); });
```

`localStorage.clear()` destroys the stash and costs every login again. Students use different keys
(`student_token`, `student_data`) — that is the dual-auth model, and it is also why a parent and a
student session coexist without evicting each other.

Verify a stashed session with one cheap authenticated call before trusting a "logged out" symptom;
tokens get revoked server-side mid-run.

---

## 9. Do not file false positives

Four rules, each from a near-miss in the reference run. Three of these would have shipped as
confident findings.

**Prove the attempt landed before reporting that something is broken.** Six login attempts
returned `401` and never the expected `423` lockout — apparently a broken lockout. The failed-attempt
counter in the database was still `0`: the requests were hitting a nonexistent route. **A 401 from
a wrong path is indistinguishable from a rejected credential.** Check a side channel — a counter, a
row, a log — before filing.

**Settle animations before measuring layout.** A page measured a real, reproducible 24px horizontal
overflow. The offender was a scroll-reveal stuck at `translate: 48px` because the tab was
backgrounded and the document timeline was frozen. `document.getAnimations().forEach(a => a.finish())`
made it vanish.

**Never parse computed colours with a regex.** Tailwind v4 emits `oklch()`; an `rgba()` pattern
fails silently and returns nonsense — in one case reporting white-on-white at 1.0:1. Paint the
colour to a 1×1 canvas and read back the bytes.

**Distinguish "behind an overlay" from "unreachable".** `elementFromPoint` returning a different
element is expected when a deliberate overlay is open. Close the overlay and re-measure before
calling a control blocked.

And when an environment limit could explain the observation, say so **in the first line** of the
note, not the last. `partial`, not `fail`.
