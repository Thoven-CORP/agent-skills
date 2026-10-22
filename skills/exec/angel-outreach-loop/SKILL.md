---
name: angel-outreach-loop
description: Research and draft workflow for Thoven's angel fundraising sprint. Use when the user says "start [prospect name]", "next prospect", "/angel-outreach", "put [prospect] on hold", or references a High-priority prospect in the Notion Angel CRM and asks for research, a draft, or a triage disposition (Pass / On Hold / Redirect). ALSO use for hands-off batch runs — trigger "/angel-outreach-loop:auto", "auto mode", "batch mode", "run the whole batch", "draft all of them", "do the next 10 without me" — which curates the queue, drafts every email, runs a fact-parity sub-agent check, updates Notion, and posts all drafts in chat for one final review. Enforces paginated CRM queries, verified column writes, On Hold + Hold Until handling, and cross-session history logging.
---

# Angel Outreach Loop

Per-prospect research + draft + send workflow for Thoven angel fundraising. Three explicit phases, phase-gated. The user writes every draft; the assistant researches, polishes, and tracks state.

> **Canonical CRM contract:** `Fundraising/automation-playbook/crm-contract.md`. Query/validate via data source `170c7a68-…`. Stage is **select**. ICP Pass in Phase A includes celebrity / mega-cap / Imagine K-12 partner / wrong check-size — do not leave them in Ready to Send.

## The Meta-Rule

**The middle of the email is fixed. The opener and closer are where you write for THIS prospect — fresh, from their actual reality, not from a canonical menu.**

Past examples and approved patterns are reference material, not templates to clone. If a prior draft maps cleanly, use it as inspiration. If it doesn't, write fresh and explain why.

## Core Rules

**Process rules (rigid — these prevent class-of-bug issues):**
- **Phase-gated.** Phase A (Triage) clears the queue. Phase B (Research + Draft) runs one prospect at a time. Phase C (Send + Log) records what shipped. Never skip Phase A, even when the user says "next prospect."
- **One prospect at a time in Phase B.** Never pre-research prospect N+1 before prospect N's draft is accepted.
- **User writes every word of every draft.** Assistant role is research + polish + save, not authoring. Exceptions: user explicitly says "you draft it" / "draft it since you have enough context," OR the run is in **Auto Mode** (see below), where the user has delegated authoring for the whole batch.
- **All flags surface BEFORE drafting.** Competitor risk, weak-draft indicators, fact errors, unverified CRM claims — raise them in the raw material presentation, not after polishing.
- **Body content is decision-of-record.** Every prospect's Notion page body is where the user writes triage decisions. Phase A reads body content for ALL queue candidates before any per-prospect work begins.
- **If user provides their own opener words, use them.** When the user dictates a draft or starter phrase in their own voice, clean it up minimally and build the full email around it. Do not rewrite it into a "better" version.

**Fixed-template rules (middle of email — verbatim):**
- **Middle paragraph stays verbatim.** Mission + traction + advisors + raise. Only the four numbers swap. This is the actual product pitch — it stays consistent.
- **Ask line, website line, sign-off, default subject stay verbatim.** See `feedback_strict_outreach_template.md` for the exact text. These are tested.
- **Prospect type determines middle paragraph variant.** Operator-angels get the standard middle ($150k/$50k default). VC/GP prospects get the VC-nature variant ($300k/$50k stretch + thesis-wrap paragraph).

**Opener + closer rules (principles — write fresh):**
- **Opener anti-patterns (still hard rules):** No bio recap (don't describe their company back to them), no performative research signals ("I found your podcast"), no surgical parallels ("you built X, I build Y"). These are the failure modes, not a prescribed structure.
- **No prescribed first words.** "I came across" is one good opener — not the only one. Write what's true to THIS prospect.
- **No closer chain-of-thought table lookups.** If you have a real Thoven challenge that fits this prospect's specific experience, weave it in. Don't pull from a hash table.
- **Reference past drafts when one cleanly fits.** Not mandatory. If the prospect calls for something fresh, write fresh.
- **Preserve user voice tightly.** Light polish only when user provides a draft: typos, voice-to-text errors, grammatical tightening. Never restructure paragraphs or add framings the user didn't mention.
- **Escalation rule.** If you generate 2+ rounds of opener options and the user keeps rejecting them, STOP generating and ask the user to write the opener in their own words. Their phrasing will always be more authentic.

## Rationalization Table — Process Gate Violations

These are excuses for skipping process gates. They don't apply to writing decisions.

| Rationalization | Reality |
|---|---|
| "I have enough context to pick the best angle and draft it" | Step 7 lists angles. Step 9 waits. These are always two separate responses. Always. |
| "There are N prospects in the queue, I need to keep momentum" | Queue size doesn't change the gate. One prospect at a time. One response per step. |
| "I'll present the angles and then draft the most obvious one" | No. List angles, end with the question, stop. Draft happens in the next exchange after explicit confirmation. |
| "The batch-enrich hook says overlap so I'll use that" | Batch-enrich hooks are auto-generated and frequently wrong. Run Step 6.5 yourself before repeating any overlap claim. |

For writing decisions (opener tone, connection framing, closer specifics), think through them per-prospect. Don't pre-empt judgment with a table.

---

## Opener + Closer — Principles

The opener and closer are where you write for THIS prospect. They are NOT templated. Past examples are reference material, not patterns to clone.

### Anti-patterns (these still apply — they're failure modes, not prescriptions)

1. **No bio recap.** Don't describe the prospect's company or background back to them. They know what they built.
2. **No performative research signals.** "I found your 2019 podcast" or "specifically what you built with X" reads as AI checklist, not genuine discovery.
3. **No surgical parallels.** "You built X for Y so I built X for Z" telegraphs an agenda. Let the reader connect the dots.

### Principles (think through, don't recipe-follow)

- **Write from Andres's perspective, not the prospect's history.** The email is about why Andres wanted to reach out — their bio is context for the ask, not the point.
- **Name the connection honestly.** If there's genuine product overlap, say so. If the overlap is structural (marketplace mechanics), say *that*. If it's thesis or mentor angle only, frame it that way. Don't overclaim with "ton of overlap" when the overlap is just structural.
- **Closer references real Thoven challenges when fit is genuine.** If the prospect has specific experience that maps to a real problem Andres is working through, weave it in. If not, the generic "learn from your journey" close is fine. Don't pull from a lookup table — reason from THIS prospect's actual experience.
- **Match the prospect identity to the variant tone.** Operator-angels → founder-to-founder voice, marketplace/EdTech anchor where applicable. VC/GP prospects → thesis-hook + thesis-wrap + investor-and-founder closer.
- **Match the opener framing to how recognizable the company is.** "I came across" implies discovery — honest for a company few have heard of, slightly off for a household name nobody actually "comes across." For a well-known / scaled company, open on the person: *"I came across your background building Cambly…"* or *"your work on Photomath…"*. For a lesser-known company, opening on the company is genuine: *"I came across SportsRecruits and what you built there…"*. Either way: name one thing, center the person, and don't describe the company back.
- **Real examples (NOT templates) live in `references/example-drafts.md` and `references/approved-patterns.md`.** Use them as proof-of-concept that certain shapes work. Don't clone them.

### Escalation rule

If you generate 2+ rounds of opener options and the user keeps rejecting them: **STOP generating. Ask the user to write the opener in their own words.** Their voice will always be more authentic. Then clean up minimally and build the full email around their phrasing. Do NOT rewrite their words into a "better" version.

---

## Auto Mode — `/angel-outreach-loop:auto` (batch, hands-off)

**Trigger:** invoked as `/angel-outreach-loop:auto`, or when Andres says "auto mode," "batch mode," "run the whole batch," "draft all of them," "do the next 10 without me," or similar. Default invocation (no auto/batch signal) stays the rigid one-at-a-time flow documented below.

**What auto mode is:** the same per-prospect work as Phase B, run back-to-back for a whole batch with no mid-run gates. The assistant curates the queue, drafts every email, runs a fact-parity sub-agent check, writes everything to Notion at Ready to Send, and posts all drafts in chat for ONE human review at the end. Andres is in the loop only at kickoff (numbers) and at the final review — never in between.

**Why the human-pause gates are dropped here (and only here):** the rigid one-at-a-time gates exist so Andres writes every word. In auto mode he has explicitly delegated authoring for this batch. The *correctness* rails stay fully intact — verified writes, LinkedIn role checks, competitor flags, history logging, the fact-parity sub-agent. What's removed is only the "stop and wait for the human" pauses, not the checks that keep drafts accurate.

### Kickoff (the one allowed upfront touch)

Confirm the four traction numbers ONCE before starting: teachers onboarded, musicians/music teachers applying to teach last month (NOT MAU — supply/demand framing, see `feedback_strict_outreach_template.md`), raise size, committed. This is non-negotiable even in auto mode — file-sourced numbers are never trusted (see `feedback_no_file_sourced_specifics.md` + root `CLAUDE.md` drafting rules). Confirming once at kickoff is the *input* to the run, not a mid-run pause. If Andres supplied the numbers (or a batch size) in the invocation, use those and don't re-ask. Default batch size = **10** unless he gives a number.

**Personal-use check (added 2026-05-20).** A personal-use opener ("I used [product] when I was learning to code…") is the strongest hook there is, but only Andres knows what he's used. Two-part handling: (1) at kickoff, when you present the curated batch, scan it for broad-reach consumer EdTech/learning products and ask Andres in one line which (if any) he has personally used; (2) the drafter returns a `personal-use-candidate: {product}` flag for any such prospect — collect those flags and, if Andres confirmed use, swap the safe "I came across…" opener for the personal-use shape before saving. Confirmed-used as of 2026-05-20: MasterClass, Quizlet, Codecademy (plus plausibly Desmos, Khan Academy). Never invent personal history — if Andres doesn't confirm, keep the default opener.

### Auto Phase A — Curate (no pause)

Run the Phase A query exactly as documented below (paginated, client-side Stage + Hold filters). Then, instead of waiting for batch confirmation, **auto-apply** the triage rules and record every decision for the end report:
- **Auto-skip + log** (do not draft, surface in final report): direct teacher-side music competitors (`feedback_competitor_risk_flag.md`); prospects whose page body says defer / already-contacted; On Hold within window; clear tier-mismatch (pivoted out of EdTech/marketplace entirely).
- **Auto-proceed:** everyone else, ranked by score/priority. Take the top N (default 10).
- Still APPEND the disposition stamp to `Notes` and the history log for every skip (verified write) — the audit trail matters even when no human confirmed it.

### Auto Phase B — Draft loop (dispatch drafters in parallel)

Dispatch the **`angel-outreach-drafter`** subagent — one per prospect on the GO list, in parallel batches (send multiple Task calls in a single turn). Each drafter receives a prospect card (name + CRM background + contact info + prospect type) AND the four kickoff traction numbers, and returns a finished draft with an angle, a personalization hook, a contact path, and any flags. The drafter does the per-prospect heavy lifting that the rigid flow did serially:
- Runs the LinkedIn current-role check (correctness check, not a gate).
- Runs the connection reality check and picks the single most honest angle (no surgical parallels, no bio recap).
- Writes the opener + verbatim middle paragraph ("digital-native music academy," kickoff numbers) + collapsed-or-one-topic closer, then a humanizer pass.
- Returns a SKIP flag instead of a draft for competitors / tier-mismatch / numbers-missing.

**Why a dedicated subagent + parallel dispatch:** auto mode's whole point is throughput. The drafter encapsulates the voice/template/anti-pattern rules and runs N prospects concurrently instead of one serial loop. The drafter has read-only research tools only — it structurally cannot write to Notion or send, which keeps those operations under the main agent's control.

**The main agent (you) owns what the drafter cannot:**
- **Per returned draft, do the VERIFIED Notion write** — Stage = Ready to Send, write Outreach Draft + Personalization Hook + `date:Drafted At:start` = today + Notes stamp (one atomic write), re-fetch to confirm (including `Drafted At` == today), append history-log row. The drafter never writes to Notion; you do.
- **Honor every SKIP flag** the drafter returns — apply the disposition (Passed / log) with a Notes stamp + history row.
- **Roll up contact-path flags** for the final report.

If a drafter returns `numbers-missing`, that means kickoff was skipped — stop and fix kickoff, don't paper over it.

### Auto Phase B.5 — Fact-parity sub-agent (ALWAYS runs)

After ALL drafts are saved, dispatch the **`angel-outreach-fact-parity`** subagent to fact-check every opener's claim against the real person — the parity check that protected the 2026-05-19 run. Brief it with each prospect name + the specific factual claim that prospect's opener makes (e.g. "opener says Conrad built Teachable — verify"). It returns VERIFIED / WRONG / UNCERTAIN per prospect. (If for some reason that named agent is unavailable, fall back to a `general-purpose` sub-agent with the same brief.)
- **WRONG with a clear correction:** fix the opener and re-save that prospect (verified write).
- **WRONG / UNCERTAIN with no clean fix:** leave the draft, flag it loudly in the final report so Andres catches it before sending.

Why a sub-agent, not inline: a hallucinated "you built X" sent to a real founder kills the relationship. A fresh agent with no authoring investment catches what the drafter rationalizes past. Cheap insurance against the highest-cost error.

### Auto Phase C — Report (the one human review)

**Stop at Ready to Send — never auto-send.** Then post in chat:
1. Every drafted email in full, so Andres can read them all at once.
2. A skip list with one-line reasons (competitor, already-messaged, tier-mismatch, On Hold).
3. Fact-parity results — call out any WRONG / UNCERTAIN prominently.
4. Contact-path flags (LinkedIn-DM-only, unconfirmed paths).
5. Confirmation that all writes verified and the history log is updated.

Andres reviews, requests edits, and sends manually. On his "sent" confirmation for a prospect, run the normal Phase C send-verification (Gmail-corroborated) for those — that gate is NOT dropped, because flipping Stage to Outreach Sent on an unsent email corrupts the follow-up cadence.

### Auto-mode guard

The only things auto mode removes are the human-pause gates. These stay non-negotiable: confirming numbers at kickoff, the LinkedIn role check, competitor skips, verified writes, the fact-parity sub-agent, history logging, and stopping at Ready to Send. If you catch yourself skipping a *correctness* check "to go faster," that's the exact bug auto mode must not have.

---

## Phase A — Triage / Queue Hygiene

Run ONCE per skill invocation, before any per-prospect work.

> **Auto mode:** read "Auto Phase A" above — same query, but auto-apply dispositions instead of pausing for confirmation.

1. **Pull High queue via PAGINATED query.** Use `mcp__notion__API-query-data-source` (NOT `mcp__claude_ai_Notion__notion-query-data-sources` in rows or sql mode — rows mode returns at most 100 rows with no cursor; only its view mode paginates via `next_cursor`. The retired `notion-query-database-view` tool had the same 100-row cap, which caused the "same prospects keep surfacing" bug documented in `Fundraising/automation-playbook/errors-and-fixes.md` 2026-04-08 entry).

   ```
   data_source_id: "170c7a68-da78-46be-bf70-9ba05ed47334"
   filter: {
     "and": [
       {"property": "Prioirty", "select": {"equals": "High"}},
       {"or": [
         {"property": "Outreach Draft", "rich_text": {"is_empty": true}},
         {"property": "Drafted At", "date": {"is_empty": true}},
         {"property": "Drafted At", "date": {"on_or_before": "{today − 30 days, YYYY-MM-DD}"}}
       ]}
     ]
   }
   page_size: 100
   ```

   The `or` block widens the old `Outreach Draft is_empty` filter so it ALSO pulls back present-but-stale drafts: a card is stale when `Drafted At` is empty or more than 30 days ago. Compute `{today − 30 days}` at runtime.

   Loop while `has_more == true`, passing prior `next_cursor` as `start_cursor`. Accumulate ALL pages.

   Then apply CLIENT-SIDE filters on the accumulated results:
   - Drop rows where `Stage IN [Outreach Sent, Passed, On Hold]`
   - **STALENESS rule for `Stage == Ready to Send`:** KEEP the row and surface it for **RE-DRAFT** (not "done") when its `Drafted At` is empty OR more than 30 days ago — a present-but-rotted draft must not be treated as ready. DROP a Ready-to-Send row only when it has a fresh `Drafted At` (≤ 30 days old): that draft is genuinely done and awaiting the user's send. (This replaces the old blanket "drop all Ready to Send" behavior, which silently hid stale drafts.)
   - Drop rows where `Hold Until` is set AND `Hold Until > today` (parked prospects awaiting their revisit window)

2. Fetch each remaining candidate's page body
3. Present body content verbatim to user in a single batch summary
4. Wait for user's batch confirmation: which to mark Passed, which to redirect, which to proceed, which to put On Hold
5. **Apply confirmed Stage updates in batch — VERIFIED WRITE.** For each disposition:
   a. Update `Stage` to the new value (Passed / On Hold / Researched-still / etc.)
   b. If Stage = `On Hold`: also set `Hold Until` = today + 21 days (default revisit window) unless the user specified otherwise.
   c. APPEND (do NOT replace) a disposition stamp to `Notes`:
      ```
      --- PHASE A {DISPOSITION} {YYYY-MM-DD} ---
      Reason: {body content extract or user-stated reason}
      ```
   d. Re-fetch the page; confirm `Stage` AND `Notes` BOTH landed. If verification fails, log to history as `WRITE-FAILED` and surface to user before continuing.

   Skipping the Notes stamp loses the audit trail (Jessie Woolley-Wilson 2026-05-04 and Cheyenne Ehrlich 2026-05-03 had Stage flipped to Passed but no Notes stamp — making it impossible to reconstruct WHY they were passed without consulting the history log).
6. Append all Phase A dispositions to the history log (see Phase C). Use `ON-HOLD` disposition for any prospect put On Hold.
7. Output: a clean GO list of N candidates ready for Phase B

**Why Phase A exists:** Body content is where the user writes deferral decisions. Structured fields (Stage, Outreach Draft) lag. Reading body at queue-scan time prevents wasted per-prospect research.

See `references/workflow-steps.md` for full Step 0 detail.

## Phase B — Research + Draft Loop

For each prospect on the GO list, run Steps 1-16 sequentially:

1. Fetch Notion CRM page (full page, including body)
2. Echo user's CRM comment verbatim
3. Competitor risk check → flag + defer if triggered
4. **LinkedIn current-role verification (MANDATORY — caught 3 stale prospects in 2026-05-18 session).** Run `mcp__exa__linkedin_search_exa` with query `"{prospect name} {known company} current role 2026"`. Compare to CRM Company/Background:
   - If LinkedIn shows a different current role: refresh the CRM Company/Background field in Step 15 (verified write).
   - If LinkedIn shows a role change <6 months old: flag as "fresh-exit/transition" — the angle may shift (post-exit timing window, capacity concern, or new competitor risk).
   - If LinkedIn shows pivot away from EdTech entirely (e.g., to film/arts/real estate): flag tier-mismatch and consider Pass.
   - If CRM email is tied to the old company (e.g., `name@oldcompany.com`): treat as stale — clear it in Step 15 and route to LinkedIn DM.
   If `mcp__exa__*` is not connected (it is optional; not connected as of 2026-10-22), run the same check with `WebSearch` (`site:linkedin.com/in "{name}" {company}`) plus `WebFetch`, and note the source.
   Crunchbase/Tracxn/RocketReach/AeroLeads/The Org all lag LinkedIn by 6–18 months on role changes. LinkedIn is ground truth. See `feedback_linkedin_current_role_check.md`.
5. Fact verification → flag unverified claims
6. Email hunt (verified or candidates)
7. Light research (3-5 facts, 1-2 articles, company briefing)

7.5. **Connection reality check (verify the Thoven connection claim is genuine — not a check for a warm intro path) — output this before angles, no exceptions.**
   
   State explicitly (one sentence each):
   - **What [Name] primarily does:** honest plain-English description of their work
   - **Genuine Thoven connection:** is there one? What specifically?
   
   Genuine connection requires ONE of:
   - Their product serves music teachers, music students/learners, or families seeking instruction → product overlap
   - They built a family-facing marketplace (not music-specific) → structural overlap (cold-start, trust, two-sided)
   - They invested in EdTech / learning companies → thesis alignment (label it as thesis, not overlap)
   - They have a specific founder perspective Andres is seeking (mentor-angle) → no overlap claim needed
   
   **NOT genuine connections:**
   - "They're in music" or "the problem shapes are adjacent" — Splice serves producers, not teachers or learners. Different market.
   - "Music infrastructure overlap is real even if it's a different problem" — No. If it's a different problem, it's a different problem. Name the honest angle.
   - Batch-enrich hook says "overlap" → verify it yourself before repeating it
   
   If no genuine product overlap exists: name the honest angle (thesis alignment, founder perspective, music mission) and use that in Step 7. Do NOT claim overlap that isn't there.

7.7. **READ `references/example-drafts.md` IN FULL — for VOICE, every prospect, before Step 8.** Read the 7 sent drafts end-to-end and absorb their cadence, warmth, and sentence rhythm so this draft sounds like Andres. This is the single highest-leverage step for draft quality — skipping it is what produces cold, clinical drafts. It is calibration, NOT mechanical matching: you are NOT picking a template to clone, and you do NOT have to cite which variant you matched.

   `references/example-drafts.md` (voice samples — read every time) and `references/approved-patterns.md` (approved opener/closer phrases by prospect type — scan only when one obviously fits). Don't force a fit; most prospects are new-pattern cases. Pull a specific sample or pattern only when it genuinely matches this prospect's shape.

8. **List 2-4 angles** framed around this prospect's actual reality. NO drafted copy. NO mandatory variant citation — only cite a prior draft if it genuinely matches.

   **Frame angles as honest connection shapes:** "structural marketplace overlap (recurring-services booking)", "thesis alignment around teacher empowerment", "founder-journey mentor". Not "you built X which maps to Y" — that's a surgical parallel.

   **Anti-pattern gate (still applies):** Each angle must NOT describe the prospect's company back to them, NOT frame as "I found your podcast", NOT state a surgical parallel.

   **HARD STOP after listing angles.** End your response with: *"Which angle should I pursue for [Name]?"* Do NOT draft in this same response. Present the list and stop.

9. Weak-draft pre-check
10. **ABSOLUTE GATE — different response required before drafting.**

   After presenting angles (Step 7), you have STOPPED. Now wait for user reply.

   - If user confirms an angle but does NOT say "draft it" / "you draft it" / "go ahead": respond with *"Got it — [angle]. Ready when you have your opener. Write it and I'll build the full email around it."* STOP again.
   - If user says "draft it", "you draft it", "go ahead", or equivalent: proceed to Step 11.
   - NEVER transition from angle presentation directly to a draft in the same response. These are always two separate exchanges.

   **"There are N prospects in the queue" does NOT override this gate.** Queue size is not a reason to skip a step.

11. **Write the opener and closer fresh. Middle paragraph stays verbatim. Ask line + website + sign-off follow the COLLAPSED-CLOSER pattern (see below).**

    **Hook structure (Per `feedback_hook_structure_why_what_ask.md`):** The opener has three jobs only:
    1. **WHY** I'm reaching out (the specific connection to the prospect)
    2. **WHAT** I'm reaching out about at the high level — general "overlap with what I'm working on" (NEVER describe Thoven; the middle paragraph owns that)
    3. **ASK setup** — "so I wanted to reach out"

    **Opener anti-pattern check (before polishing):**
    1. Does the opener describe Thoven (e.g., "I'm building a marketplace for X" / "I'm building a digital-native music academy")? → Remove. Middle paragraph covers that.
    2. Does the opener describe the prospect's company or background back to them? → Remove it.
    3. Does it cite a specific research artifact (podcast, interview, article, post)? → Remove or reframe as shape ("your story" not "the 2023 EdTech Insiders episode").
    4. Does it state a parallel explicitly ("you built X, I build Y")? → Let the parallel be implied.
    5. If the user provided their own opener phrasing: preserve it. Do NOT rewrite into a "better" version. Minimal cleanup only.

    **Personal-experience hook variant (see `feedback_personal_experience_hook.md`):** If Andres personally used the prospect's product (Desmos, Khan Academy, Quizlet, Photomath, similar broad-reach K-12 EdTech), use this shape instead of "I came across":
    > *"I used [product] a lot growing up, and it was a huge part of my education. Now that I'm building in the space myself, I wanted to reach out to someone whose work I actually learned from."*
    Only use when Andres confirms he actually used it. Don't invent personal history.

    **Collapsed closer + ask pattern (see `feedback_closer_ask_collapse_pattern.md`):** The closer paragraph and canonical ask line are collapsed into ONE paragraph:
    > *"I think you'd have great insights into what I'm building and could provide a ton of value and advice. If you have time in the next couple of weeks, I'd love to connect, show you what we're building, and get your feedback."*

    **This intentionally deviates from the strict template's verbatim ask line** ("20-30 minutes... connect" → "connect, show you what we're building, and get your feedback"). Note in the per-prospect Notes stamp as "Intentional deviation from verbatim template."

    **Closer rules:**
    - **NO "Given your background" prefix** (see `feedback_drop_given_your_background.md`). Start directly with the substance. Also avoid "Given your experience," "Given what you've built," "Based on your background." All fluff.
    - **NO "chat"** — use "connect" (see `feedback_no_chat_use_connect.md`).
    - If you have a real Thoven challenge that fits this prospect's specific experience, you can replace the generic closer with a specific one. Don't manufacture a challenge to add depth.
    - **The closer is NOT deterministic — write it with judgment, don't apply a fixed stem.** Per Andres 2026-05-20: stop freezing the closer into one phrasing (e.g. always "One thing I'm working through is X, and..."). Follow an approved *shape* and tone, vary naturally. Approved shapes: (1) **founder-journey + topic** — *"I'm still early in my founder journey, and given your background I'd love the chance to connect. I think you'd have great insights on [topic]."*; (2) **topic-value + connect** — *"I think you'd have great insights on building the demand side, and I'd love to connect and get your perspective."*; (3) **collapsed generic** when no topic stands out. Always: humble peer-to-peer tone, a real specific topic the prospect could speak to, "connect" not "chat," no em dashes/"--" asides, vary across the batch. "given your background" is fine woven into the founder-journey shape, not as a bare leading prefix. See `feedback_closer_ask_collapse_pattern.md`.
12. Humanizer pass (invoke `humanizer` skill)
13. Traction verification (confirm numbers in session, never from files)
14. Fundraising hint placement check
15. ESA toggle check
16. **Save to Notion CRM page → set `Stage = Ready to Send`. VERIFIED WRITE.**
    a. Write `Stage`, `Outreach Draft`, `Personalization Hook`, `Email`, `date:Drafted At:start` = today's date (`YYYY-MM-DD`), `Notes` (append, do NOT replace) — all in the ONE atomic write. `Drafted At` is the draft stamp: it records when this draft was written, so downstream skills can detect a rotted draft (see the canonical date-stamp contract below).
    b. Re-fetch the page via `mcp__claude_ai_Notion__notion-fetch`.
    c. Confirm `Stage == "Ready to Send"`, `Outreach Draft` non-empty, `Personalization Hook` set, `Drafted At` == today.
    d. If verification fails: log to history file as `WRITE-FAILED`, surface to user, do NOT proceed to next prospect.

   This closes the column-write drift class of bug — see `Fundraising/automation-playbook/errors-and-fixes.md` for prior incidents (Joe Lu Last Contact stale, Simone Spence no-thread).

After Step 16, the draft is locked, Gmail draft is queued, and the prospect is in "Ready to Send" status awaiting the user's actual send.

## Phase C — Send Confirmation + History Log

17. **WAIT for user's "sent" confirmation** (this is the second gate; "accept" alone is no longer sufficient — the user must actually send the email)
18. **On user's "sent" confirmation — Gmail-corroborated VERIFIED WRITE.**
    a. Verify the Gmail thread ACTUALLY contains a sent message: `mcp__gws__gmail` `users.threads.list` with `q: "to:{prospect.email} from:andres@thoven.co"`. Confirm at least one Andres-sent message exists in the past 5 minutes.
    b. If no thread/message found: PAUSE — ask user to confirm send happened. Do NOT flip Stage.
    c. On verified send, write ALL of these in ONE atomic patch: flip `Stage = Outreach Sent`; set `Delivery Method = Email` (this skill's send path is always email); set `date:Last Contact:start` = the actual Gmail send date (NOT today, NOT user-claimed date — parse Gmail's Date header); set `Email` = the address actually sent to (correct it if the real `To` differs from the CRM guess); set `Next Action` = "Day 6 follow-up — Touch 1".
    d. Re-fetch the page; confirm `Stage`, `Delivery Method`, AND `Last Contact` all landed.
    e. If verification fails: log `WRITE-FAILED`, surface, halt loop.

   **INVARIANT: Stage never flips to `Outreach Sent` without `Delivery Method` AND `Last Contact` in the same patch.** A blank `Delivery Method` on a sent record breaks the `outreach-followup` channel filter (a no-thread record with `Delivery Method=Email` is a wrong-email problem to fix; `Delivery Method=LinkedIn` is correctly never threaded). `Last Contact` MUST come from Gmail's Date header on the actual sent message — not from "today" — to prevent the Joe Lu drift case (CRM said 2026-04-27, actual send 2026-04-22, formula computed off stale baseline).
19. **Append to history log** at `Fundraising/angel-outreach-loop-history.md` — one row per disposition (PASSED, REDIRECTED, READY-TO-SEND, SENT)
20. Move to next prospect on the GO list (return to Phase B Step 1) — or end loop if list is exhausted

### Post-5 Pattern Extraction (rolling, triggered automatically)

**Trigger:** When the session's cumulative SENT count hits a multiple of 5 (5th, 10th, 15th sent in this session), run this before advancing to the next prospect.

1. Pull the 5 most recent CRM pages where Stage = `Outreach Sent` (sorted by Last Contact descending)
2. For each of the 5 pages, read: `Outreach Draft`, `Personalization Hook`, `Angle` fields
3. Extract patterns not yet in `references/approved-patterns.md`:
   - New opener structures (especially ones where Andres rewrote or confirmed his own phrasing)
   - Specific-challenge closers that added depth beyond the canonical cadence
   - New angle types or profile-specific hook patterns
4. Append extracted patterns to `references/approved-patterns.md` under the matching prospect type tag
5. Report to Andres: *"Added [N] new patterns from the last 5 drafts to approved-patterns.md: [1-line on what was added]."*

## Notion Angel CRM — Data Reference

**Data source URL:** `collection://170c7a68-da78-46be-bf70-9ba05ed47334`
**Database URL:** `https://www.notion.so/4fa3de459f8a4ae28a1adc404fac5f24`
**View URL:** `https://www.notion.so/4fa3de459f8a4ae28a1adc404fac5f24?v=4df68df763f340f8b75ef9a648ed2e68`

**Stage values (v3, 2026-05-04):**
- `Identified` — prospect added but not yet enriched/triaged
- `Researched` — enrichment complete, in queue for Phase A triage
- `Ready to Send` — Phase B complete, draft locked, Gmail draft created, awaiting user send
- `Outreach Sent` — user has sent the email
- `On Hold` — prospect parked (warm-intro pending, deferral, etc.). Combined with `Hold Until` date prop. Phase A queue scan EXCLUDES On Hold rows where `Hold Until > today` (NEW 2026-05-04)
- `Replied` / `Meeting Booked` / `Meeting Done` / `Committed` / `Passed` — downstream lifecycle

**Fields to update on save:**
- `Email` — verified address
- `Stage` — see lifecycle above
- `Personalization Hook` — 1-line summary of the hook used
- `Outreach Draft` — full drafted email + `[Sources: ...]` footer with URLs
- `Notes` — APPEND source attribution, quality flags, competitor/weak/fact warnings, and Phase A disposition stamps. NEVER replace existing content (Phase A stamps must be visible alongside batch-enrich scoring blocks etc.)
- `date:Drafted At:start` — ISO date the draft was written (draft stamp). Set in the SAME atomic write as `Stage = Ready to Send` (Step 16). Owned by the drafter. A Ready-to-Send card whose `Drafted At` is empty or > 30 days old is stale and must be re-drafted, never sent (see canonical contract).
- `date:Last Contact:start` — ISO date Gmail's Date header on the actual sent message (send stamp; set after Phase C send confirmation, NOT before)
- `Delivery Method` — select (`Email` | `LinkedIn`). This skill always writes `Email`. Written in the SAME atomic patch as the `Stage = Outreach Sent` flip — never after, never separately (see Step 18 INVARIANT). LinkedIn sends are written by the `linkedin-assisted-send` skill.
- `date:Hold Until:start` — ISO date when an On Hold prospect should re-enter the queue. REQUIRED when Stage = `On Hold`. Default to today + 21 days unless user specifies otherwise.
- `Next Action` — follow-up timing if sent

**Verified-write protocol (applies to every page write):** After any page update, re-fetch the page and confirm the written values landed. If they didn't, log `WRITE-FAILED` to the history log and surface to user before continuing.

**Priority field is spelled `Prioirty`** (typo in the schema, do not correct). Values: `Low`, `Medium`, `High`.

### Canonical Date-Stamp & Query Contract (source of truth for all angel-CRM skills)

This block is the canonical contract every angel-CRM skill references (`prospect-scorer`, `outreach-followup`, `prospect-finder`, `linkedin-assisted-send`, `angel-graph-scout`, `apollo-enrich`):

- **Drafter stamps `Drafted At`; sender stamps `Last Contact` + flips `Stage` atomically.** `Drafted At` (date) = when the draft was written. `Last Contact` (date) = when it was sent. Never flip `Stage` to a sent state without `Delivery Method` + `Last Contact` in the same patch.
- **No skill sends or reuses a Ready-to-Send draft whose `Drafted At` is > 30 days old (or empty) — re-draft or surface it first.** A rotted draft carries stale traction numbers and framing.
- **Query the CRM only via paginated `mcp__notion__API-query-data-source`, never `mcp__claude_ai_Notion__notion-query-data-sources` rows mode (successor to the retired `notion-query-database-view`), which silently stops at 100 rows.**
- **Canonical verbatim-template source of truth = `feedback_strict_outreach_template.md`.** Other template/pattern docs (`references/example-drafts.md`, `references/approved-patterns.md`, `Fundraising/outreach-templates.md`, etc.) are voice/pattern reference only — never the fixed-text authority.

## Cross-Session History Log

Path: `Fundraising/angel-outreach-loop-history.md`

Append-only ledger of every prospect dispositioned in any session. One row per disposition:

```
| Date | Prospect | Disposition | Email | Note |
|------|----------|-------------|-------|------|
| 2026-04-30 | Laine Bradshaw | SENT | laine.bradshaw@pearson.com | K-12 assessment thesis bridge |
```

**Disposition values:** `PASSED`, `REDIRECTED`, `READY-TO-SEND`, `SENT`, `WARM-INTRO-PATH`, `ON-HOLD` (NEW 2026-05-04 — Stage = On Hold + Hold Until set), `WRITE-FAILED` (NEW — verified-write check failed; investigate before continuing), `INFRA` (schema migrations / non-per-prospect changes)

This log is a recovery tool, not the primary state. Notion CRM remains the source of truth. The log exists for cross-session memory and integrity check (the followup-runs incident on 2026-04-28 showed how Notion permission issues can break primary state — the log is a fallback).

**When to append:** end of Phase A (every disposition), end of Phase C (every send), and end of any per-prospect Phase B that ends in a redirect or skip.

## Memory Files — Review if Relevant

Path: `/Users/andresmartinez/.claude/projects/-Users-andresmartinez-Vaults-Executive-Assistant/memory/`

**Always check (per-prospect, every time):**
- `feedback_strict_outreach_template.md` — fixed middle paragraph + ask + website + sign-off + canonical subject line (only these stay verbatim — opener and closer are NOT templated)
- `feedback_no_file_sourced_specifics.md` — never pull traction numbers from memory; confirm in session
- `feedback_competitor_risk_flag.md` — defer prospects who run direct music-education competitors

**Review if the prospect type calls for it:**
- `feedback_vc_prospect_pattern.md` — VC/GP variant: thesis-hook + thesis-wrap + investor-and-founder closer (apply when prospect is a fund GP)
- `feedback_thesis_connection_hook.md` — for sophisticated investors with public writing, lead with thesis not bio
- `feedback_esa_toggle_rule.md` — drop ESA for thesis-driven SV angels; keep for impact/regional

**Voice references (loose principles, not strict rules):**
- `feedback_no_ai_style_outreach_writing.md` — voice rules (no AI tells)
- `feedback_outreach_draft_polish.md` — light polish only when user provides draft
- `feedback_no_chat_use_connect.md` — use "connect", not "chat"
- `feedback_outreach_hook_specificity.md` — make connections concrete; this memory contains some prescriptive rules that the current skill loosens (see meta-rule)

## Reference Drafts (reference material, NOT templates to clone)

`references/example-drafts.md` — sent drafts that landed. Use these to see what shapes worked. Do not match drafts mechanically to prospects who don't fit.

`references/approved-patterns.md` — collection of opener and closer phrases organized by prospect type. Reference when one obviously fits this prospect. Skip when the prospect calls for fresh.

## Humanizer Integration

After Step 10 (light polish) and before Step 15 (save), always invoke the `humanizer` skill on the polished draft. Removes em dashes, AI vocabulary, parallel structures, throughline framings, rule-of-three padding, sycophantic tone.

The humanizer output IS the final draft. Do not re-edit after humanizer.

## Task Gate Pattern

Use `TaskCreate` to create `Outreach: [Name]` task per prospect at start of Phase B. Use `TaskUpdate`:

- Phase B start: `status: in_progress`
- Phase A defer / redirect: `status: completed` immediately (with disposition note)
- Phase B accept (Ready to Send): keep `in_progress` until Phase C
- Phase C sent confirmation: `status: completed`

Do NOT mark completed until the user's actual send confirmation in Phase C.

## When NOT to Invoke

- For bulk prospect-finding (use `prospect-finder` or `prospect-finder-mass`)
- For generic non-angel outreach (press, partnerships, etc.)
- When user is writing a draft independently without research help
- When the Notion CRM is not available or the prospect isn't in the Angel CRM

## Triggers

Invoke on:
- User says "start [prospect name]" in fundraising context
- User says "next prospect" after a previous gate
- User says "/angel-outreach" or "/angel-outreach-loop"
- User references a High-priority prospect and asks for research or a draft
- A previous task was marked completed and the next `Outreach: [Name]` task is ready
