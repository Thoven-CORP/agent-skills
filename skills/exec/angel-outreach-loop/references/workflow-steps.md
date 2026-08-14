# Angel Outreach Loop — Phase-Gated Workflow Detail

Full detail for each step in the three-phase workflow. SKILL.md has the at-a-glance version.

**Phases:**
- **Phase A — Triage** (Step 0): batch queue hygiene before any per-prospect work
- **Phase B — Research + Draft Loop** (Steps 1-15): per-prospect, gated, ends in `Stage = Ready to Send`
- **Phase C — Send Confirmation + History Log** (Steps 16-19): user confirms send, log appended, advance

---

## Step 0: Phase A — Queue Hygiene Pre-Scan

Run ONCE per skill invocation, BEFORE entering Phase B on any prospect.

### Procedure

1. Query CRM via `notion-query-database-view` against the default view URL
2. Filter results to: `Prioirty=High` AND (`Outreach Draft` empty/null) AND `Stage NOT IN [Outreach Sent, Passed, Ready to Send]`
3. For each filtered candidate, call `notion-fetch` on the page ID and extract the `<content>` body block
4. Build a numbered summary listing each prospect's name + body content verbatim
5. Present to user with this prompt format:

   ```
   Phase A — queue hygiene check. N candidates with body notes from prior sessions.
   Confirm disposition for each before research begins:

   1. <Name>: "<body content verbatim>"
   2. <Name>: "<body content verbatim>"
   ...

   Reply per prospect: SKIP (mark Passed), REDIRECT-TO-<person> (e.g., REDIRECT-TO-KERI), or PROCEED.
   ```

6. **Wait for user's batch response.** This is a real gate — do not advance without it.
7. Apply confirmed updates in parallel:
   - `SKIP` → `Stage = Passed`, append Notes: "DEFERRED [date]: [user reason or 'queue hygiene confirmation']"
   - `REDIRECT-TO-<person>` → `Stage = Researched`, fill `Outreach Draft` with placeholder `[REDIRECTED to <person> on <date> — reason: <if given>]`
   - `PROCEED` → no update, candidate enters Phase B
8. **Append every Phase A disposition to the history log** at `Fundraising/angel-outreach-loop-history.md`
9. Output: clean GO list of remaining `PROCEED` candidates → enter Phase B Step 1 with the first

### Why Step 0 exists

Body content is where decisions live. Structured fields lag. Reading the body at queue-scan time prevents wasted per-prospect research on prospects already dispositioned in prior sessions.

Today's session (2026-04-30) is the precedent: 4 of 5 High candidates had body comments expressing soft-pass decisions, and the skill re-surfaced all of them because the queue filter only checked Stage and Outreach Draft.

### Anti-pattern

Never enter Phase B without running Step 0 first, even if the user says "next prospect" or "start <name>." The body might contain a fresh decision the user wrote since the last loop.

### Edge cases

- Empty body → safe to proceed without confirmation
- Body = enrichment-agent output (starts with `[BATCH-ENRICH ...]` or similar) → safe to proceed (auto-generated, not a user decision)
- Body = positive note + caveat (like Laine's "solid angel... no clear overlap") → surface anyway, let user decide
- Body length > 50 chars and not auto-generated → surface for confirmation regardless of sentiment

---

## Step 1: Fetch Prospect from Notion CRM

Use `mcp__claude_ai_Notion__notion-fetch` with the prospect's Notion page ID.

If only the name is given, search first with `mcp__claude_ai_Notion__notion-search` against `data_source_url: collection://170c7a68-da78-46be-bf70-9ba05ed47334`.

**MANDATORY — read the full page body, not just properties.** The page body is where Andres drops inline research notes, article links, context about the conversation angle, and CRM comments. These are the most important inputs to your research pass. Do not skip the body and do not treat empty properties as "no context available" if the body has content.

Capture ALL of the following — do not move to Step 2 until you have read and noted each one:
- Properties: Name, LinkedIn, `Company / Background` (exact field name), Angle, Prioirty, Notes, Personalization Hook
- Page body content — copy it verbatim into your working notes before proceeding. If the body has content, it surfaces in Step 2 before any of your own research.

---

## Step 2: Echo User's CRM Comment

Put Andres's CRM body-content comment at the TOP of the raw material presentation, verbatim, in a quote block. This is his pre-research framing and must be surfaced before any of your own research.

Format:
```
## Your CRM Comment
> *"[exact text from page body]"*
```

---

## Step 3: Competitor Risk Check

Scan the prospect's current and recent roles for direct music-education competitors. Triggers:

- Currently operates a music school (brick-and-mortar or online)
- Currently runs a music lesson marketplace or teacher platform
- Currently builds music teacher software/SaaS
- Holds senior role at any of the above
- Advisor or board member at a direct competitor

**If triggered:**
1. Flag at the TOP of the raw material (before angles, before articles)
2. Recommend deferral as default
3. Do NOT draft language for flagged prospects
4. Update CRM: Stage → `Passed`, Notes → `DEFERRED [date]: Competitor risk. [reason].`

Exception: prospect exited the competitor 3+ years ago AND is now purely an investor, or Andres explicitly overrides.

Full rule: `memory/feedback_competitor_risk_flag.md`

---

## Step 4: LinkedIn Current-Role Verification

**MANDATORY. Added 2026-05-18 after catching 3 stale prospects in a single session.** CRM Company/Background fields, Crunchbase, Tracxn, RocketReach, AeroLeads, and The Org all lag LinkedIn by 6–18 months on role changes. LinkedIn is the only ground-truth source.

**How to run:**
1. Call `mcp__exa__linkedin_search_exa` with a query like `"{prospect name} {known company} current role 2026"`.
2. Read the FIRST result's "Current" role section. Compare to CRM Company/Background.

**Decision tree based on what you find:**

| Finding | Action |
|---|---|
| LinkedIn current role matches CRM | Note "no staleness" and proceed to Step 5 |
| LinkedIn shows a different current role | Refresh CRM Company/Background field in Step 16 (verified write). Update Send Path if email tied to old company. |
| LinkedIn shows a role change <6 months old | Flag "fresh-exit/transition" — the angle may shift (post-exit timing window, capacity flag, or new competitor risk). |
| Prospect pivoted out of EdTech entirely | Flag tier-mismatch. Default disposition: Pass (parallel to Sebastian Thrun, Lynda Weinman 2026-05-18 cases). |
| CRM has email at old company domain | Treat as stale. Clear it in Step 16. Route to LinkedIn DM instead. |

**Example failures caught in 2026-05-18 session:**
- **Dan Johnston:** CRM said "CEO of WorkStep" → LinkedIn showed VP Sales at Learning Pool (Apr 2026, post-acquisition). Email `dan@workstep.com` was dead. Send path switched to LinkedIn DM.
- **Sidharth Kakkar:** CRM said "co-founder Freckle" → LinkedIn showed CEO of Woodrow (Mar 2026, 2 months in). Freckle → Subscript → Woodrow trajectory entirely missed by CRM.
- **Lynda Weinman:** CRM said "on hiatus" → actually President of Santa Barbara International Film Festival + co-founded Maker House ceramics studio. Pivoted out of EdTech entirely. Tier-mismatch pass.

**Full rule:** `memory/feedback_linkedin_current_role_check.md`

---

## Step 5: Fact Verification Check

Compare the CRM-listed background against public sources. Mass-scraper data is often wrong:

- Exit multiples (X ARR) — verify in press releases; they're rarely disclosed
- Team sizes — often inflated from district/school counts
- "Two-time exited" — check if companies are same legal entity, pivoted vs. separate
- Current title — check LinkedIn headline vs. CRM field
- "Active investor" claims — check for portfolio list in public sources

**If unverified:**
- Flag the specific claim
- Provide the verified alternative
- Recommend skipping the unverified specific in the draft

Full rule: `memory/feedback_no_file_sourced_specifics.md`

---

## Step 6: Email Hunt

Use `mcp__exa__web_search_exa` and `mcp__exa__people_search_exa` to find the prospect's work email. Search queries:

- `"[Name] [Current Company] email contact"`
- `"[Name] LinkedIn profile"` (may reveal contact info)
- `"[Current Company] contact team"`
- Check speaking/press pages on personal website

**If found in a public source:** label as `Verified via [source]`.

**If not found:** provide 3-5 candidate patterns based on the prospect's current company domain:
1. `first@company.com`
2. `first.last@company.com`
3. `flast@company.com`
4. `firstl@company.com`
5. `first_last@company.com`

Check RocketReach, Wiza, Apollo (if available) for masked patterns that hint at format.

Flag explicitly: "Verified" vs "Candidates — try in order."

---

## Step 7: Light Research Pass

Three deliverables:

**A. Verified Facts (3-5 bullet points):**
- Current role + company + start date
- 1-2 prior relevant roles
- Education (notable degrees only)
- Location
- LinkedIn URL

**B. 1-2 Articles / Interviews / Podcasts / LinkedIn Posts:**
- Prefer items where the prospect speaks in their own words
- Pull 1-3 verbatim quotes per article
- Include source URL and publication date
- Summarize each in 1-2 sentences

**C. Company / Foundation Briefing:**
- One paragraph per company they're actively connected to
- Mission statement or founding belief (verbatim if available)
- Key metrics (founding year, team size, funding, notable customers)
- Recent news if material

**DO NOT produce:**
- Heavy multi-hook analyses like the early Paul/Emily/Raphael/Christina deep research
- Positioning angles written in AI-style parallel structures
- Throughline narratives

Keep the total raw material under ~800 words.

---

## Step 7.7: Similarity Lookup (OPTIONAL — only when one obviously fits)

**When:** Between Step 7 (light research) and Step 8 (angles). The full VOICE read of `example-drafts.md` is mandatory (Step 8 pre-step); this *similarity match* is optional — do it only when a prior draft or pattern obviously fits this prospect's shape.

**Purpose:** Reuse proven language when it genuinely fits, without forcing a fit. Most prospects are new-pattern cases — write fresh. (The mandatory two-source citation was removed 2026-05-18 because forcing a match produced clinical drafts — see `feedback_outreach_skill_loosen_opener_closer.md`.)

### Two sources to scan (when relevant)

**Source 1 — `references/example-drafts.md`:** Does a sent draft share this prospect's profile (prospect type, career shape, connection angle)? If one obviously matches, note it.

**Source 2 — `references/approved-patterns.md`:** Is there an approved opener/closer pattern for this prospect type (`instructor-marketplace`, `family-marketplace`, `learning-platform`, `music-industry`, `edtech-operator`, `thesis-investor`, `serial-founder-mentor`)? If yes and it fits, pull the shape.

### Output (only if a match was found)

> **Similarity reference:** closest match is [Name] ([company/type]).
> - **What transfers:** [opener/closer shape worth reusing]
> - **Where it diverges:** [what's different for this prospect]

If nothing obviously fits, say so in one line and write fresh in Step 8. Do NOT force a match.

### What this balances

- Reuse proven language when it fits → avoid formula drift
- Don't force a template onto a prospect who doesn't fit → avoid clinical drafts

---

## Step 8: Angle Suggestions (NOT drafted copy)

### REQUIRED PRE-STEP: Read example-drafts.md in full — for VOICE

Before listing any angles, read `references/example-drafts.md` end-to-end **every prospect, every time.** This file contains 7 sent drafts that landed (6 operator-angel + 1 VC-nature) plus a shared template skeleton. **Read it to absorb the VOICE — cadence, warmth, sentence rhythm — so this draft sounds like Andres.** This is calibration, NOT mechanical matching: you are not selecting a template to clone, and you do NOT have to cite which variant you matched (the mandatory-citation rule was removed 2026-05-18 because it produced clinical drafts — see `feedback_outreach_skill_loosen_opener_closer.md`). Skipping this read is the most common protocol violation and produces drafts that drift toward cold, clinical phrasings.

### Canonical variants (reference vocabulary — NOT a required citation)

These labels are useful shorthand for talking about shapes. Pull one ONLY when a prospect genuinely fits it. Do NOT force a match and do NOT label every draft with a variant:

- **Carlos pattern** — simple founder-to-founder + advisor add. Geographic warm hook + broad advice ask. Use when prospect lacks a public thesis but has a warm geographic/founder-type connection.
- **Goldman pattern** — thesis connection via published interview/podcast. Quote their public belief, connect it to Thoven's value prop. Use when prospect has a recent podcast/article expressing a clear thesis.
- **Herman pattern** — career arc + Keri parallel + thesis paraphrase. Use when prospect's unusual career arc (e.g., teacher → founder) parallels Andres or Keri.
- **Brayden pattern** — multi-angle weave (3 angles in single draft, user picks the order). Use when prospect has multiple distinct hooks (e.g., serial founder + teacher-led + technology adoption).
- **Wenger-VC pattern** — thesis-hook + thesis-wrap paragraph + investor-and-founder closer + larger raise size ($300k/$50k). Use when prospect is a fund GP/VC, not an operator-angel.
- **Aaron-rescued pattern** — opener was flat agreement, rescued with audience-insight evidence. Use as recovery pattern when initial draft trips weak-draft indicators.

### Canonical operator-angel closer cadence (verbatim shape)

> *"As a founder early in my journey in EdTech, I'd love to connect and [prospect-specific ask], get your perspective and advice, and just to be able to learn from your journey."*

This warm peer-positioning frame is the default for ALL operator-angel drafts (Carlos / Goldman / Herman / Brayden patterns). Variations from this cadence are allowed (per `feedback_outreach_hook_specificity.md` — closers cannot recycle phrases verbatim across prospects), but the warmth, founder-peer positioning, and "learn from your journey" energy must remain. Cold/clinical closers like *"Your read would be especially valuable"* or *"Would mean a lot to get your read"* drift away from this and are protocol violations unless the prospect-specific context demands a different shape.

### Procedure

1. List 2-4 possible angles with a short "why it could work" for each, framed around this prospect's actual reality
2. If a canonical variant or an `approved-patterns.md` shape genuinely fits, you MAY name it as shorthand — but this is optional, not required. Most prospects are new-pattern cases; write fresh.

**Acceptable angle formats (variant labels optional):**
- "Career arc reference — they went from X to Y to Z, similar to your path."
- "Thesis connection — they wrote publicly about [belief]; Thoven [how it relates]."
- "Geographic hook — both [city]-based."
- "Audience evidence — they care about [audience]; you have [audience insight]."
- "Multi-hook weave — combine [angle 1] + [angle 2] + [angle 3]."

**DO NOT produce:**
- Draft sentences with quote marks
- "Here's what the opener could say..."
- Parallel structures or mirror constructions
- Sample paragraphs

If tempted to write a sentence, stop and describe the move abstractly instead.

Full rules: `memory/feedback_no_ai_style_outreach_writing.md`, `references/example-drafts.md`

---

## Step 9: Weak-Draft Pre-Check

Scan for these indicators before user invests time drafting:

1. **No thesis post** — no manifesto, no LinkedIn thought leadership, no substantive public piece
2. **No specific hook material** — fallback to generic agreement risk
3. **Vague-ask tendency** — prospect's background only supports broad advice ask
4. **Template-y product paragraph risk** — no prospect-specific angle for opener or closer
5. **Missing audience evidence leverage** — no Thoven-specific hook to audience insight

If 2+ indicators trigger, label the prospect `WEAK DRAFT RISK` in the assessment. Surface the specific weakness AND suggest rescue approaches (audience evidence, specific product decisions, warm intro gating).

Full rule: `memory/feedback_weak_outreach_draft_indicators.md`

---

## Step 10: Wait for User's Raw Draft

**Stop and wait.** Do not proceed to polishing or drafting until the user provides their raw draft text.

Acceptable user inputs:
- Raw draft text (even with voice-to-text errors)
- "Draft it" / "you draft it since you have enough context" — permission to draft
- "Skip this one" — move to step 16 as deferred
- Edit instructions for raw material re-presentation

If the user gives permission to draft, proceed but still preserve their stated substance over your own phrasings.

---

## Step 11: Light Polish Only

Take the user's raw draft and fix:
- Typos and voice-to-text errors
- Grammatical issues
- Double words ("reinvent music education, but specifically music education")
- Tighten wordy phrases (`I felt I wanted to reach out` → `I wanted to reach out`)

**DO NOT:**
- Add new paragraphs
- Restructure the order of ideas
- Replace the user's phrasing with "better" phrasing
- Introduce framings the user didn't mention

**Diff discipline:** for every change you're about to make, ask "did the user ask for this or am I improving it?" If they didn't ask, revert.

**Specific-challenge closer check (after polish, before humanizer):**
Read the closer paragraph. If it contains only generic framing like "I'd love to learn from your journey" with no specific Thoven problem reference, upgrade it:

1. Identify the prospect's primary relevant experience (instructor marketplace, family trust, async learning, music industry distribution, etc.)
2. Reason: "What Thoven problem would they have the most insight on, given that experience?"
3. Add ONE specific challenge reference: *"I'm currently working through [Thoven problem] and I think your time building [anchor] would give you a lot of perspective on it."*

Reference the challenge-reasoning chain in `references/approved-patterns.md` for starting points by prospect type. Do not invent challenges — reason from the prospect's actual background.

**Do NOT apply this upgrade if:** the prospect is VC/GP (use thesis-wrap paragraph instead), or the opener already grounds in a founder's-journey variant (Eran Egozy pattern — see approved-patterns.md).

Full rule: `memory/feedback_outreach_draft_polish.md`

---

## Step 12: Humanizer Pass

Invoke the `humanizer` skill on the polished draft. The humanizer skill is located at `/Users/andresmartinez/.claude/skills/humanizer/` and removes AI tells:

- Em dashes (replace with commas/periods)
- AI vocabulary (`however`, `moreover`, `additionally`, `delve`, `pivotal`, `crucial`, `testament`, `stands as`, `serves as`, `underscore`, `highlight`, `interplay`, `tapestry`, `landscape`)
- Rule-of-three padding (unless the list is genuinely three real things)
- Parallel structures ("Not only X, but Y")
- Throughline / mirror framings ("X is to Y what Z is to W")
- Sycophantic / servile tone
- Knowledge-cutoff disclaimers

The humanizer output IS the final draft. Do not re-edit after humanizer.

---

## Step 13: Traction Verification

Before saving, confirm the traction numbers with Andres in session:

- `X teachers onboarded` — current number
- `Y musicians/music teachers applying to teach last month` — current number (NOT MAU)
- `$Z angel round` — current raise size
- `$W committed` — current committed amount

**Never pull these numbers from memory files, prior drafts, or CRM notes.** They drift. Always confirm in-session.

If the draft uses a specific number that hasn't been confirmed this session, stop and ask: "Should this still say $150k angel round with $50k committed, or have the numbers moved?"

Full rule: `memory/feedback_no_file_sourced_specifics.md`

---

## Step 14: Fundraising Hint Placement Check

Ensure the draft includes a one-line fundraising status line immediately after the traction sentence in the product paragraph.

**Correct placement:**
```
We've onboarded [X] teachers so far, with over [Y] more musicians and music teachers applying to teach with us in just the last month, and we're being advised by people from the Chan Zuckerberg Initiative, Khan Academy, and Clever. We're raising a $[Z] angel round, with $[W] already committed.
```

**Incorrect placements:**
- In the opener (reads like a pitch from word one)
- As a P.S. (reads like afterthought)
- In the closer / ask (confuses the advice frame)

If the user's draft doesn't have the hint, ask if they want it added. Do not silently insert.

Full rule: `memory/feedback_fundraising_hint_placement.md`

---

## Step 15: ESA Toggle Check

Check whether ESA traction line should be in the draft based on the prospect type:

**Drop ESA when the prospect is:**
- Thesis-driven Silicon Valley exited operator
- Published EdTech manifesto or product philosophy
- Care publicly about product-shape or outcomes, not GTM/regional-moat evidence
- Example: Gagan Biyani, Christina Yu-Eisenberg, George Kane, Mandela Dixon

**Keep ESA when the prospect is:**
- Impact-focused angel (SWAN Impact, TIGER21 family office, women-founder-focused network)
- Cares publicly about regional traction or policy tailwinds
- Asks "does this work in the real world"
- Example: Heather Gilker, Keri-routed prospects

When uncertain, default to dropping ESA for exited EdTech operators.

Full rule: `memory/feedback_esa_toggle_rule.md`

---

## Step 16: Save to Notion CRM

Use `mcp__claude_ai_Notion__notion-update-page` with `update_properties` command. Update:

```json
{
  "Email": "verified@company.com",
  "Stage": "Ready to Send",
  "Personalization Hook": "1-line summary of hook used",
  "Outreach Draft": "Subject: [Canonical subject]\n\n[full humanized draft]\n\n[Sources: URL1, URL2. Quality: STRONG/MEDIUM/WEAK. Angle: ...]",
  "Notes": "Source: W[X] | [letter] | [high/medium] | [existing flags] | [any new flags from this research pass]"
}
```

**Stage = Ready to Send is the new terminal state for Phase B.** This signals: draft locked, Gmail draft created, awaiting user's actual send confirmation in Phase C. Old workflow flipped to `Researched` here, which was ambiguous (Researched also meant "enriched but not drafted yet").

Include in Notes any flags:
- `WEAK DRAFT (flagged [date]) — rescued with [strategy]` if applicable
- `3x exited founder, not 2x` if fact-check correction was made
- `Current role: [accurate title]` if CRM was outdated

After Notion save, also create the Gmail draft via `mcp__claude_ai_Gmail__create_draft` with the verified email + canonical subject + locked body. The Gmail draft sits in the user's drafts folder until they send.

Append to history log: `READY-TO-SEND` row with date + prospect + email + 1-line angle note.

---

## Step 17: Phase C Gate — Wait for "Sent" Confirmation

The gate has shifted from "accept" (v1) to **"sent"** (v2). The user must actually send the email from Gmail before this step completes.

**Why the change:** v1 marked Stage=Outreach Sent on accept, but actual sending could lag hours or days, creating a window where CRM said "sent" but the email hadn't gone out. v2 separates the two states cleanly.

Acceptable user signals to advance:
- "sent" / "I sent it" / "out the door"
- "marked sent" / "fire" / "shipped"

If user says "edit X" after Step 16 save:
- Revise the specific part
- Re-save to Notion (Stage stays Ready to Send)
- Re-create / update Gmail draft if needed
- Wait again for sent confirmation

If user says "skip" / "actually defer this one" after Step 16 save:
- Update CRM `Stage = Passed`, append Notes with reason
- Append history log row: `PASSED-AFTER-DRAFT` with reason
- Move to next prospect on GO list

---

## Step 18: Mark Sent + Set Follow-up

Do NOT advance to the next prospect until the user says "accept" or equivalent ("looks good", "save it", "approved").

If user says "edit X":
- Revise the specific part
- Re-present the updated draft
- Wait again for accept

If user says "skip":
- Mark the task `completed` with deferred note
- Update CRM Stage → `Passed` (or keep as `Researched` with deferred flag)
- Move to next prospect

Valid task state transitions:
- `pending` → `in_progress` (at Phase B Step 1)
- `in_progress` → `completed` (at Phase A skip with deferred note)
- `in_progress` → `completed` (at Phase C "sent" confirmation)
- `in_progress` → `completed` (at "actually skip" after Step 16 save with reason)

On send confirmation — **ONE atomic Notion write** (the post-send write contract):
- Update Notion in a single `notion-update-page` patch, ALL of these together:
  - `Stage = Outreach Sent`
  - `Delivery Method = Email` (this path always sends by email)
  - `date:Last Contact:start` = the **actual Gmail send date** — parse the `Date` header of the most-recent `andres@thoven.co → prospect` sent message (fetch via Gmail at confirmation time). **NOT `today`, NOT the user-claimed date.** (Stale-`today` was the Joe Lu drift bug.)
  - `Email` = the address actually sent to (correct the CRM value if the real `To` differs from the research-time guess — e.g. Mak → `mak@notey.co`)
  - `Next Action = "Touch 1 follow-up: <send-date+6 days> (Day 6, reply-to-thread, 35-80 words, no re-pitch)"`
- **INVARIANT: never flip `Stage → Outreach Sent` without `Delivery Method` + `Last Contact` in the same patch.** A blank `Delivery Method` on an `Outreach Sent` record is a data-integrity smell and breaks the `outreach-followup` channel filter. If you cannot determine the real send date from Gmail, PAUSE — do not flip Stage.
- Re-fetch the page; confirm `Stage`, `Delivery Method`, and `Last Contact` ALL landed. If verification fails, log `WRITE-FAILED` to history and surface before continuing.
- Append history log: `SENT` row with date + prospect + verified email + 1-line angle note
- Mark TaskUpdate `status: completed`

---

## Step 19: Append to History Log

Append-only file: `Fundraising/angel-outreach-loop-history.md`

Format: markdown table sorted newest-first by session date.

```markdown
## YYYY-MM-DD

| Time | Prospect | Disposition | Email | Note |
|------|----------|-------------|-------|------|
| HH:MM | <Name> | <DISPOSITION> | <email or —> | <1-line angle/reason> |
```

**Disposition values:**
- `PASSED` — Phase A skip OR Phase C "actually skip" after draft
- `REDIRECTED-<TARGET>` — Phase A redirect (e.g., `REDIRECTED-KERI`, `REDIRECTED-WARM-INTRO`)
- `READY-TO-SEND` — Phase B complete, draft locked, Gmail draft sitting (interim state, gets replaced by `SENT` on Phase C completion)
- `SENT` — Phase C complete, email actually sent, Last Contact stamped
- `WARM-INTRO-PATH` — special variant of redirect, for active warm-intro requests with Notes about the connector

**When to append:**
- Phase A: append every disposition (every prospect Andres triages, regardless of outcome)
- Phase B: append `READY-TO-SEND` row at Step 16
- Phase C: append `SENT` row at Step 18 (overwrite/update the Step 16 row, OR append new row — depends on file convention)

**File convention:** create the file with frontmatter and a date-grouped table format. New session = new top-level `## YYYY-MM-DD` heading. Within a date, append rows in time order.

**Why this exists:** Notion CRM is the primary source of truth, but it can drift (permission issues, integration swaps, view query failures). The 2026-04-28 followup-run incident showed the cost of relying on a single state path. The history log is a recovery tool — append-only, plain text, never authoritative on its own but always cross-checkable against Notion.

**Don't read the log to determine state.** Always read Notion. The log is for cross-session recall ("did we already pitch X last month?") and integrity check ("Notion says we passed Y but the log says we sent — investigate").

---

## Step 20: Move to Next Prospect on GO List

Default order: alphabetical within the GO list produced by Phase A.

### Queue Filter (Phase A produces this list, Step 20 walks it)

A prospect is on the GO list if Phase A returned `PROCEED` for them. Step 20 just advances through that list.

If the GO list is exhausted:
- Print session summary (count of SENT / PASSED / REDIRECTED + remaining queue state)
- Suggest natural pause (e.g., "next batch-enrich runs tomorrow 8am ET — restart loop after that")
- End skill invocation

User may override default order with:
- "Start [name]" (specific pick within GO list)
- "Skip to [name]" (jump ahead within GO list)

Before starting the next prospect, mark the next `Outreach: [Name]` task as `in_progress` and restart at Phase B Step 1.

**Never auto-advance without the user's explicit signal.** The gate is user-driven, not assistant-driven.

**Never re-enter Phase A mid-session** unless the user explicitly requests it ("re-pull the queue") or returns after a major gap (e.g., overnight with new batch-enrich data).

---

## Step 20 (continued): Post-5 Pattern Extraction

**Trigger:** Immediately after the 5th, 10th, 15th (etc.) SENT confirmation in the current session.

### Extraction procedure

1. Query Notion CRM for the 5 most recently sent pages (Stage = `Outreach Sent`, sorted by `Last Contact` descending). Pull `Outreach Draft`, `Personalization Hook`, and `Angle` for each.
2. Read each draft fully. Identify patterns not yet catalogued in `references/approved-patterns.md`:
   - **New opener patterns:** anything where Andres rewrote the opener himself, or confirmed a non-formula phrasing (high signal)
   - **Specific-challenge closers:** closers that referenced a real Thoven problem rather than generic "learn from your journey"
   - **New angle types:** profile-specific hooks that don't fit the current canonical variants (Carlos / Goldman / Herman / Brayden / Wenger-VC / Aaron-rescued)
3. For each new pattern, format as:
   ```
   ### [Prospect Type Tag] — [Date]
   **Reference prospect:** [Name] ([company])
   **Opener:**
   > "[approved opener text]"
   **Closer specific ask:**
   > "[approved closer text]"
   **When to use:** [1-line description of profile match condition]
   ```
4. Append to `references/approved-patterns.md` under the appropriate prospect type section.
5. Report: *"Added [N] new patterns from the last 5 drafts to approved-patterns.md: [brief list]."*

### What counts as a new pattern worth cataloguing

- Andres wrote the opener himself after rejecting AI options (highest priority — preserve exact phrasing)
- Closer had a specific challenge reference that wasn't in a prior pattern
- New prospect type encountered (e.g., first music-industry angel, first consumer mobile founder)
- Angle structure that mixes two canonical patterns in a new way

### What to skip

- Drafts that are routine executions of an existing pattern (no need to duplicate)
- Drafts where the opener or closer was changed by Andres to something generic (don't catalogue regressions)

---

## Anti-Patterns to Avoid

- **Skipping Phase A** — entering Phase B without queue hygiene wastes per-prospect research
- **Researching ahead** — only the current prospect in flight (Phase B is one-at-a-time)
- **Drafting lines for the user** — unless explicit permission
- **Polishing before flagging weaknesses** — flags come first
- **Auto-closing tasks** — wait for "sent" gate, not "accept" gate
- **Citing unverified facts in drafts** — even if they're in the CRM
- **Re-running humanizer after it's done** — its output is final
- **Over-structuring the response** — tight beats comprehensive, especially after user has signaled "too long"
- **Recycling closer phrases across prospects** — see `feedback_outreach_hook_specificity.md`
- **Logging to history before Phase A confirmation** — the log captures decisions, not proposals
- **Skipping the example-drafts.md voice read** — reading the 7 sent drafts in full BEFORE listing angles is mandatory every prospect, every time (Step 8 pre-step). Skipping it is the most common protocol violation and produces clinical, peer-cold closers that drift away from the canonical *"As a founder early in my journey in EdTech, I'd love to connect and... get your perspective and advice, and just to be able to learn from your journey."* cadence. Read it for VOICE — you do NOT have to cite which variant you matched (forced citation was removed 2026-05-18 because it made drafts mechanical). Reading it AFTER the user complains is too late.
