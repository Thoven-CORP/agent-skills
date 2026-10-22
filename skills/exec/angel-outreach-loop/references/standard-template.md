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

> My name is Andres Martinez, and a couple months ago I started building Thoven, a digital-native music academy with the mission of making learning music online more inspiring and accessible for families while making it easier for any musician and music teacher to teach and share their passion. We've onboarded [X] teachers so far, with over [Y] more musicians and music teachers applying to teach with us in just the last month, and we're being advised by people from the Chan Zuckerberg Initiative, Khan Academy, and Clever. We're raising a $[Z] angel round, with $[W] already committed.

**Default phrasing (locked 2026-05-19):** "digital-native music academy" — replaced "AI-native" globally (too buzzwordy for operator-angels; "digital-native" maps to the why-now argument that the academy model was built pre-digital). See `feedback_strict_outreach_template.md`.

**Supply/demand framing — NOT MAU (locked 2026-06-15, reconfirmed by Andres).** The traction metric is the two-sided supply story: teachers onboarded ([X]) + musicians/teachers *applying to teach* last month ([Y]). Do NOT revert to "[Y] MAU" or any active-user metric, and do NOT revert "angel round" to "pre-seed." See `feedback_strict_outreach_template.md` (updated 2026-06-09).

**Note:** Numbers ([X], [Y], [Z], [W]) must be confirmed with Andres in session every time. Do NOT pull from memory files or prior drafts.

## Hook Pattern — Updated 2026-05-20

**Structure:** WHY (the connection anchor) + WHAT (general overlap — NEVER describe Thoven, middle paragraph already does) + ASK setup ("so I wanted to reach out").

```
I came across [one specific anchor about prospect], and [it resonates with / there's overlap with / a lot of it connects to] what I'm working on. So I wanted to reach out.
```

Keep it plain. The anchor + a natural "this overlaps with what I'm building" is enough — do NOT add a flourish about how impressive or rare the prospect's achievement is. **Vary the WHAT phrasing across a batch** — do not ship "there's a lot of overlap" on every draft. Natural variants: "it resonates with what I'm building," "a lot of it connects to what I'm working on," "there's real overlap with what I'm building," or a learn-from framing: "I wanted to reach out and learn from someone who's [done the genuine thing]."

**Personal-experience hook variant — STRONGEST when it applies.** Use when Andres personally used the prospect's product. Confirmed products Andres has used (as of 2026-05-20): **MasterClass** (electronic music production course), **Quizlet** (growing up), **Codecademy** (learning to code); plus plausibly Desmos, Khan Academy. In Auto Mode the drafter cannot confirm new ones — it returns a `personal-use-candidate` flag for any consumer product Andres plausibly used, and the main agent asks Andres at kickoff. Never invent personal history.

```
I used [product] a lot growing up / when I was learning to code, and it was a big part of [how I studied / my education]. Now that I'm building in education myself, I wanted to reach out to someone whose product I actually learned from.
```

**Anti-patterns to remove from every opener:**
1. Describing Thoven in the hook (middle paragraph already does)
2. Describing the prospect's company/background back to them
3. Citing specific research artifacts ("I found your 2019 podcast")
4. Surgical parallels ("you built X, I build Y")
5. **Rarity / achievement inflation (added 2026-05-20).** No "you're one of the few people who actually did X," "that combination is hard to find," "one of the rare founders who...," "which is genuinely rare." Name the connection plainly; reaching out already signals respect. This flourish reads as performative flattery and as AI-generated. See `memory/feedback_no_rarity_inflation_opener.md`.

**Compact-reference rule (2026-05-20).** A brief, high-level nod to what they built is allowed, but it must be ONE short clause, e.g. *"you built a platform that millions of parents used."* Banned: (a) explaining the mechanics of their accomplishment (e.g. "getting the supply side to show up and stay engaged before demand justifies it" — that regurgitates their company back to them), and (b) any rarity flourish (#5 above). When in doubt, cut it — the plain *"I came across what you built at X, and it resonates with what I'm working on"* is always safe.

Full rules: `memory/feedback_hook_structure_why_what_ask.md`, `memory/feedback_personal_experience_hook.md`, `memory/feedback_no_rarity_inflation_opener.md`.

---

## Standard Closer Pattern — LOCKED 2026-05-18 (Collapsed Closer + Ask)

**Locked pattern (Greg / Sidharth / Pramod / Eli — all approved 2026-05-18):** The closer and the canonical ask line collapse into ONE paragraph.

```
I think you'd have great insights into what I'm building and could provide a ton of value and advice. If you have time in the next couple of weeks, I'd love to connect, show you what we're building, and get your feedback.
```

**Then verbatim website + sign-off:**

```
In the meantime, you can check out what we're building at thoven.co. Thanks!

Best,
Andres Martinez
```

**Critical closer rules:**
- **ONE ask only (added 2026-05-20).** Do not stack two asks (e.g. "I'd love to connect and get your perspective" AND "if you have time in the next couple of weeks, I'd love to show you..."). Pick one. Andres-approved tight default (2026-05-20): *"I think you'd have great insights on [specific topic], and I'd love to connect when you have time."* Keep it to one sentence — the topic + the connect ask. No "one thing I keep coming back to is..." stem, no over-explaining the mechanics of the topic.
- **NO "Given your background" prefix** or any "Given..." opener. Drop fluff. Start with substance. See `memory/feedback_drop_given_your_background.md`.
- **NO "chat" — use "connect"**. See `memory/feedback_no_chat_use_connect.md`.
- **Intentional deviation from old verbatim ask line** ("20-30 minutes... connect" replaced with "connect, show you what we're building, and get your feedback").
- **Per-prospect Notes stamp:** When saving, note `"Intentional deviation from verbatim template: ask line modified per locked 2026-05-18 pattern."`

### Optional closer variants (use ONLY when a real Thoven challenge maps to the prospect's specific experience):

If the prospect has specific experience that maps to a real Thoven challenge (e.g., marketplace cold-start for someone who actually solved it), you can replace the generic closer with a specific question. Do NOT manufacture a challenge just to add depth — generic is fine. See `references/approved-patterns.md` for examples.

**The closer is NOT deterministic (updated 2026-05-20).** Don't apply a fixed stem to every prospect. **HARD BAN (reinforced 2026-05-20 review): never write "one thing I keep coming back to is…" or "one thing I'm working through is [X]" in any form — Andres dislikes the construction outright, even reworded. DEFAULT to the tight form: "I think you'd have great insights on [specific topic], and I'd love to connect when you have time."** If you name a Thoven challenge, keep it to five or six words ("keeping students engaged long-term"), not a clause explaining the mechanics. Write the closer with judgment, in Andres's tone, following one of the approved *shapes*:

- **Founder-journey + topic:** *"I'm still early in my founder journey, and given your background I'd love the chance to connect. I think you'd have great insights on getting the supply side going early."*
- **Topic-value + connect:** *"I think you'd have great insights on building the demand side, and I'd love to connect and get your perspective."*
- **Collapsed generic** (no specific topic stands out): the locked collapsed closer above.

Tone principles that always hold: humble, peer-to-peer founder voice; name a real specific topic the prospect could speak to (supply cold-start, demand gen, retention, school adoption, marketplace trust); "connect" not "chat"; no em dashes or "--" asides; vary across the batch. "given your background" is fine inside the founder-journey shape, not as a bare leading prefix. Run the `humanizer` skill over every closer.

### Founder's journey variant (when opener already named their work):

When the opener already anchors to the prospect's company/work, use the founder's journey closer instead of repeating it:
> "I'm still early in my founder's journey and looking for people who can give us real perspective and insight. I think your background puts you in a rare position to do that. I'd love to get your take on what we're building."

See Eran Egozy example in `references/approved-patterns.md`.

---

## DEPRECATED — OLD Closer Patterns (DO NOT USE)

The Pattern A/B/C templates that previously lived here ("Specifically, we're building for...", "As a founder early in my journey...", "Since [specific connection]...") were **removed 2026-05-18** as part of the skill loosening — they were over-prescriptive and produced sameness across drafts. The old standard sign-off (`"would love to chat"`) **violates the no-chat rule** and must never be used.

See `memory/feedback_outreach_skill_loosen_opener_closer.md` for the loosening rationale.

---

## What Changes Per Prospect

- **Hook/opener:** The specific anchor + the rare-combo plant tailored to THIS prospect
- **Middle paragraph:** Only the four numbers ([X], [Y], [Z], [W]) — everything else verbatim
- **Closer specifics:** Generic collapsed-pattern is the default; substitute a specific Thoven challenge ONLY if it maps cleanly to the prospect's actual experience

## What NEVER Changes

- The mission statement ("a digital-native music academy with the mission of...")
- The advisor list (CZI, Khan Academy, Clever)
- The website line + sign-off
- The "connect" word choice (never "chat")
