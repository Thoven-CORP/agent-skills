# Learnings — angel-outreach-loop

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-22 — one canonical middle paragraph, five variables, pilot clause included

> reflect · 2026-10-22 · ea-vault · broken-rule · applied · seen 2

**What happened.** On 2026-08-06 all five Auto Mode drafts dropped or misplaced the school-pilot clause, which Andres had added to the fixed middle on 2026-07-27. He had already said on 2026-04-30: "I have said many times the middle paragraph never changes just the opener and the bottom."
**Why.** SKILL.md, `references/standard-template.md`, `workflow-steps.md` Step 14, `example-drafts.md` and the vault `angel-outreach-drafter` agent each held their own copy of the middle, all still the 2026-06-15 four-number version. They named `feedback_strict_outreach_template.md` as canonical, and that file no longer exists in Claude memory (a Grok copy survives in the vault).
**What changed.** `references/standard-template.md` § Standard Middle Paragraph is now the single canonical copy, with five variables (X, Y, P, Z, W) and the pilot clause from the Grok copy, marked `[VERIFY: pilot clause wording — confirm with Andres]`. Kickoff confirms all five. The drafter agent, Step 14, and the example skeleton now point at that file instead of carrying a copy.

## 2026-10-22 — main agent audits every opener for bio recap; default opener shape

> reflect · 2026-10-22 · ea-vault · broken-rule · applied · seen 7

**What happened.** Openers recited the prospect's bio in sessions on 05-14, 05-18, 05-20, 06-23, 07-30 and 08-06. Andres on 07-30: "straight slop". `references/example-drafts.md` #5 (Brayden Wardrop), rated Strong, opened with a career recap, so the voice read taught the failure.
**Why.** No-bio-recap was a rule for the drafter only. In Auto Mode nobody checked returned drafts against it, and the example contradicted it.
**What changed.** Auto Phase B: the main agent audits each returned opener for bio recap before saving and rewrites to the default shape, "I came across X, and it resonates with what I'm building, so I wanted to reach out." Example #5 is downgraded to Medium, with a rewrite, and the example file has a banner saying the rule beats older samples. Approved-patterns examples with "one of the few" are annotated.

## 2026-10-22 — "built" / "founded" only after a confirmed founder role

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 7

**What happened.** 2026-08-06: Garrett Smallwood's opener said he "built Redbeacon and Pillow". He was PM / Director of Ops at Redbeacon and VP Ops / Advisor at Pillow. Six more drafts made the same overclaim before fact-parity caught them.
**Why.** The skill taught "I came across what you built at X" as a stock opener with no role check behind the verb.
**What changed.** Core Rules, Step 4, the Step 11 anti-pattern check, the Auto Mode audit, `standard-template.md` and the vault drafter agent: write built / founded / co-founded only after confirming a founder role; otherwise "your work on X" or "early at X".

## 2026-10-22 — default closer is the 07-15 one; "rare position" removed

> reflect · 2026-10-22 · ea-vault · broken-rule · applied · seen 1

**What happened.** Andres switched the closer on 2026-07-15 to "I think you'd have a great perspective about what I am building." `standard-template.md` still taught the 05-18 collapsed closer and the 05-20 "great insights on [topic]" default. Its founder's-journey variant said "your background puts you in a rare position", which breaks the file's own rarity ban.
**Why.** The 07-15 change lived only in a session log, and the variant predated the rarity ban.
**What changed.** The 07-15 sentence is the default closer in `standard-template.md`, SKILL.md Step 11 and the drafter agent. "Rare position" and the "rare-combo plant" are gone from `standard-template.md` and `approved-patterns.md`.

## 2026-10-22 — pre-batch credit, prior-contact and gating-word checks

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 7

**What happened.** Prior contacts were re-drafted (06-02, 07-22, 08-10). Gating notes were ignored (08-05 "DO NOT SEND until verified"; 08-06 Kopf, whose brother was already in the CRM). On 08-06 a 57-prospect queue sat behind an InMail credit gate nobody checked.
**Why.** Phase A read page bodies but never checked Gmail or LinkedIn history, never scanned the structured fields for gating words, and never checked credits.
**What changed.** Kickoff has pre-batch checks, and Phase A Step 2.5 runs them in every mode: the InMail / Apollo credit check (zero InMail credits means the email-only path); per prospect, a Gmail `to:{email}` plus name search and LinkedIn history, with any hit confirmed by `get_thread` (prior contact goes to Outreach Sent, never a new cold draft); and a scan of Notes / Personalization Hook / Next Action for gating words, resolved or Passed, never carried forward.

## 2026-10-22 — manual-only while angel work is dormant

> reflect · 2026-10-22 · ea-vault · skill-gap · applied · seen 2

**What happened.** Angel skills kept auto-triggering after Grok Angel took over fundraising work.
**Why.** The skill was model-invocable, and its description fires on common fundraising phrases.
**What changed.** Added `disable-model-invocation: true` and a description line: manual-only since 2026-10-22, invoke by name.

## 2026-10-22 — dead feedback-memory pointers removed

> reflect · 2026-10-22 · ea-vault · broken-rule · applied · seen 2

**What happened.** SKILL.md and its references pointed at about 20 `feedback_*.md` memory files. None exist in `~/.claude/projects/*/memory/`. Only `feedback_strict_outreach_template.md` survives, as a Grok copy in the vault.
**Why.** The memory files were cleared, and the skill kept treating them as the authority.
**What changed.** Every pointer is removed. The rule text was already inline next to each pointer; SKILL.md now has a "Rules that used to live in memory files" table saying where each rule lives.

## 2026-10-22 — vault refresh: current Notion tool names, Exa fallback, new vault path

> reflect · 2026-10-22 · vault-refresh · tooling · applied · seen 1

**What happened.** The skill named `notion-query-database-view`, which no longer exists, and relied on `mcp__exa__*` for the mandatory LinkedIn current-role check and the email hunt. Exa is not connected, and the vault path in `references/standard-template.md` still had a space.
**Why.** The Notion connector replaced the view tool with `mcp__claude_ai_Notion__notion-query-data-sources` (rows mode caps at 100 with no cursor; view mode paginates). With Exa disconnected, a mandatory step had no working tool.
**What changed.** The Phase A query now uses the paginated `mcp__notion__API-query-data-source`, with `notion-query-data-sources` view mode as the fallback. The warnings name the current tool. Exa stays optional, with an explicit WebSearch/WebFetch fallback for the role check and email hunt. The vault path is now `Vaults/Executive-Assistant`.
