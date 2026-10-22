# Standard Outreach Template (Operator-Angel Variant)

**This file covers the operator-angel template only.** For the thesis-hook variant (Template C, current best-performing format) and the follow-up sequence (Templates 4-6), read the full text in:
`/Users/andresmartinez/Vaults/Executive-Assistant/Fundraising/outreach-templates.md`

Template C has a different middle paragraph structure (no advisor line, different fundraising hint placement). Do NOT use the standard middle paragraph below for thesis-hook emails — it will be wrong.

---

The middle paragraph below is FIXED for the operator-angel standard template only. Only the hook (opener) and closer change per prospect.

## Structure

```
[HOOK — changes per prospect]

[STANDARD MIDDLE — always the same, numbers confirmed in session]

[CLOSER — changes per prospect]

[Name]
```

## Standard Middle Paragraph

**This is the one canonical copy.** Every other copy of the middle paragraph (in `example-drafts.md`, `workflow-steps.md`, the `angel-outreach-drafter` agent, `Fundraising/outreach-templates.md`, old memory files) is history. Drafters, the Auto Mode audit and the send-time diff in `linkedin-assisted-send` all read the middle from here and nowhere else. Andres 2026-04-30: *"I have said many times the middle paragraph never changes just the opener and the bottom."*

> My name is Andres Martinez, and a couple months ago I started building Thoven, a digital-native music academy with the mission of making learning music online more inspiring and accessible for families while making it easier for any musician and music teacher to teach and share their passion. We've onboarded [X] teachers so far, with over [Y] more musicians and music teachers applying to teach with us in just the last month, and this fall we're launching a pilot with a school for over [P] students. We're being advised by people from the Chan Zuckerberg Initiative, Khan Academy, and Clever. We're raising a $[Z] angel round, with $[W] already committed.

`[VERIFY: pilot clause wording — confirm with Andres]` The pilot clause *"and this fall we're launching a pilot with a school for over [P] students."* was added by Andres on 2026-07-27 during the LinkedIn send batch (source: the Grok copy of `feedback_strict_outreach_template.md`, `Agent Knowledge/Agents/grok/skills/angel/`, modified 2026-07-27). It names the Path of Life school pilot. That copy says to keep the future tense until the pilot is live, and Drive showed the pilot live on 2026-08-19, so the tense and the wording are likely stale. Confirm the clause at kickoff before any draft uses it.

**The five variables (and only these):**
- `[X]` teachers onboarded
- `[Y]` musicians and music teachers applying to teach in the last month
- `[P]` students in the school pilot
- `[Z]` raise size
- `[W]` committed amount

Confirm all five with Andres in session every time (Auto Mode: once at kickoff). Do NOT pull them from memory files, prior drafts, CRM notes, or this file's history.

**Sentence split:** the traction sentence ends at "…over [P] students." The advisors start their own sentence. Do not merge them back into one run-on.

**Default phrasing (locked 2026-05-19):** "digital-native music academy" — replaced "AI-native" globally (too buzzwordy for operator-angels; "digital-native" maps to the why-now argument that the academy model was built pre-digital).

**Supply/demand framing — NOT MAU (locked 2026-06-15, reconfirmed by Andres).** The traction metric is the two-sided supply story: teachers onboarded ([X]) + musicians/teachers *applying to teach* last month ([Y]). Do NOT revert to "[Y] MAU" or any active-user metric, and do NOT revert "angel round" to "pre-seed."

**History:** 2026-06-15 line had four variables and no pilot clause (120 / 1,500). 2026-07-01 line had 140 / 1,800, no pilot clause. 2026-07-27 added the pilot clause. On 2026-08-06 all five Auto Mode drafts dropped or misplaced the pilot clause because this file still taught the four-number version.

Everything else is verbatim: do not rephrase the mission, do not add a business-model line ("we take 8% per lesson"), do not swap the advisors (CZI, Khan Academy, Clever).

## Hook Pattern — Updated 2026-05-20

**Structure:** WHY (the connection anchor) + WHAT (general overlap — NEVER describe Thoven, middle paragraph already does) + ASK setup ("so I wanted to reach out").

**Default opener shape:**

```
I came across [one thing: a company, a product, their work], and it resonates with what I'm building, so I wanted to reach out.
```

Name the one thing once and never describe it. For a household-name company, swap the lead-in for a known-company one ("I saw what you built at [Company]", see `approved-patterns.md`). Keep it plain: do NOT add a flourish about how impressive or rare the prospect's achievement is. **Vary the WHAT phrasing across a batch:** "it resonates with what I'm building," "a lot of it connects to what I'm working on," "there's real overlap with what I'm building," or a learn-from framing: "I wanted to reach out and learn from someone who's [done the genuine thing]."

**"built" / "founded" / "co-founded" need a confirmed founder role.** Check LinkedIn or a primary source first. Without one, write "your work on [Company]" or "early at [Company]". (2026-08-06: Garrett Smallwood's draft said he "built Redbeacon and Pillow"; he was a PM and ops lead there. Six more drafts made the same overclaim.)

**Personal-experience hook variant — STRONGEST when it applies.** Use when Andres personally used the prospect's product. Confirmed products Andres has used (as of 2026-05-20): **MasterClass** (electronic music production course), **Quizlet** (growing up), **Codecademy** (learning to code); plus plausibly Desmos, Khan Academy. In Auto Mode the drafter cannot confirm new ones — it returns a `personal-use-candidate` flag for any consumer product Andres plausibly used, and the main agent asks Andres at kickoff. Never invent personal history.

```
I used [product] a lot growing up / when I was learning to code, and it was a big part of [how I studied / my education]. Now that I'm building in education myself, I wanted to reach out to someone whose product I actually learned from.
```

**Anti-patterns to remove from every opener:**
1. Describing Thoven in the hook (middle paragraph already does)
2. Describing the prospect's company, background or career path back to them (the bio recap). "I saw your journey from co-founding X to joining Y and now building Z" is a bio recap.
3. Citing specific research artifacts ("I found your 2019 podcast")
4. Surgical parallels ("you built X, I build Y")
5. **Rarity / achievement inflation (added 2026-05-20).** No "you're one of the few people who actually did X," "that combination is hard to find," "one of the rare founders who...," "which is genuinely rare," "puts you in a rare position." Name the connection plainly; reaching out already signals respect. This flourish reads as performative flattery and as AI-generated.

**Compact-reference rule (2026-05-20).** A brief, high-level nod to what they built is allowed, but it must be ONE short clause, e.g. *"you built a platform that millions of parents used."* (and only with a confirmed founder role). Banned: (a) explaining the mechanics of their accomplishment (e.g. "getting the supply side to show up and stay engaged before demand justifies it" — that regurgitates their company back to them), and (b) any rarity flourish (#5 above). When in doubt, cut it: the default opener shape above is always safe.

---

## Standard Closer — default since 2026-07-15

**Default closer sentence:**

```
I think you'd have a great perspective about what I am building.
```

Andres applied it to every draft in the 2026-07-15 LinkedIn send batch, replacing the AI-flavored "I think you'd have great insights on [topic]". Use it unless a real, specific Thoven challenge maps to this prospect's experience.

The closer and the ask sit in ONE paragraph. Follow the closer with the single ask sentence:

```
If you have time in the next couple of weeks, I'd love to connect, show you what we're building, and get your feedback.
```

**Then verbatim website + sign-off:**

```
In the meantime, you can check out what we're building at thoven.co. Thanks!

Best,
Andres Martinez
```

**Critical closer rules:**
- **ONE ask only (added 2026-05-20).** Do not stack two asks (e.g. "I'd love to connect and get your perspective" AND "if you have time in the next couple of weeks, I'd love to show you..."). Pick one.
- **NO "Given your background" prefix** or any "Given..." opener. Drop fluff. Start with substance.
- **NO "chat" — use "connect"**.
- **No rarity claims** ("puts you in a rare position", "one of the few"). The rarity ban in the opener applies to the closer too.
- **Intentional deviation from old verbatim ask line** ("20-30 minutes... connect" replaced with "connect, show you what we're building, and get your feedback").
- **Per-prospect Notes stamp:** When saving, note `"Intentional deviation from verbatim template: ask line modified per locked 2026-05-18 pattern."`

### Optional closer variants (use ONLY when a real Thoven challenge maps to the prospect's specific experience):

If the prospect has specific experience that maps to a real Thoven challenge (e.g., marketplace cold-start for someone who actually solved it), you can replace the default closer sentence with a specific one. Do NOT manufacture a challenge just to add depth; the default is fine.

**HARD BAN (2026-05-20): never write "one thing I keep coming back to is…" or "one thing I'm working through is [X]" in any form.** Andres dislikes the construction outright, even reworded. If you name a Thoven challenge, keep it to five or six words ("keeping students engaged long-term"), not a clause explaining the mechanics. Shapes:

- **One specific topic:** *"I think you'd have a great perspective on getting the supply side going early."*
- **Founder-journey:** *"I'm still early in my founder journey, and given your background I'd love the chance to connect."*

Tone principles that always hold: humble, peer-to-peer founder voice; "connect" not "chat"; no em dashes or "--" asides; vary across the batch. "given your background" is fine inside the founder-journey shape, not as a bare leading prefix. Run the `humanizer` skill over every closer.

### Founder's journey variant (when opener already named their work):

When the opener already anchors to the prospect's company/work, use the founder's journey closer instead of repeating it:
> "I'm still early in my founder's journey and looking for people who can give us real perspective and insight. I'd love to get your take on what we're building."

See Eran Egozy example in `references/approved-patterns.md` (its old "rare position" sentence is retired).

---

## DEPRECATED — OLD Closer Patterns (DO NOT USE)

The Pattern A/B/C templates that previously lived here ("Specifically, we're building for...", "As a founder early in my journey...", "Since [specific connection]...") were **removed 2026-05-18** as part of the skill loosening — they were over-prescriptive and produced sameness across drafts (forced canonical-variant matching made the Fritz Lanman draft take three edit cycles). The old standard sign-off (`"would love to chat"`) **violates the no-chat rule** and must never be used. The 2026-05-18 collapsed closer ("I think you'd have great insights into what I'm building and could provide a ton of value and advice...") and the 2026-05-20 tight default ("I think you'd have great insights on [specific topic]...") are superseded by the 2026-07-15 default above.

---

## What Changes Per Prospect

- **Hook/opener:** The one anchor for THIS prospect, in the default shape or a truer one
- **Middle paragraph:** Only the five variables ([X], [Y], [P], [Z], [W]) — everything else verbatim
- **Closer specifics:** The default closer sentence; substitute a specific Thoven challenge ONLY if it maps cleanly to the prospect's actual experience

## What NEVER Changes

- The mission statement ("a digital-native music academy with the mission of...")
- The pilot clause wording, once Andres confirms it
- The advisor list (CZI, Khan Academy, Clever)
- The website line + sign-off
- The "connect" word choice (never "chat")
