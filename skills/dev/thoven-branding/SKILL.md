---
name: thoven-branding
description: Use for Thoven emails, parent notices, in-app and component text, buttons, headlines, public pages, ads and social posts, and before any Thoven copy reaches Andres even when better-writing or no-ai-slop already loaded. Writes or reviews the copy, or a diff that changes it, in Thoven's voice.
---

# Thoven branding

Every line a family reads says what Thoven is. Write it **clear over clever**. `BRANDING.md` holds what Thoven is, the voice, the words and their reasons; the lint holds the word list, so draft from `BRANDING.md` alone.

**Branches.**
- **Write** runs steps 1, 2, 3, 4.
- **Review** (existing copy or a diff) runs step 1, then 3, then 2 as a review, then 4.

## Open the reference before you act

| Copy for | Open |
| --- | --- |
| Any Thoven copy | `BRANDING.md` at the frontend worktree root, or `~/thoven/frontend/BRANDING.md` (step 1) |
| A signed-in product screen: dashboard, flow, dialog, notice, empty or error state | [plain copy](references/plain-copy.md) |
| Public pages, emails, ads, social | `BRANDING.md` alone |

Open every row the copy touches. Product-screen copy opens both.

## 1. Read BRANDING.md

It is the brand context for every later step. Where section 9 lists an item as open, use its working version.

Done when the whole file is in context, from its Status line to section 9.

## 2. Write or review through better-writing

Invoke the Skill tool with skill `better-writing`. Hand it `BRANDING.md` as the product's voice and vocabulary: the words tables are the inventory it builds, and section 4 sets the tone.

- **Write:** draft the copy. A headline on the homepage or an instrument page uses the locked header. Copy that tells a family what to do (which button, what happens next) comes from the shipped route: open it and follow the steps in their real order before you write them (2026-11-05: a Day 0 email listed the purchase steps out of order).
- **Review:** run better-writing's review over the copy, with the step 3 findings beside it.
- **Product screens:** write or review every line by [plain copy](references/plain-copy.md).

Done when, writing, every piece of copy the request names is drafted, or, reviewing, better-writing's findings table and its Block or Approve verdict are written. Product-screen copy is also done when every line has passed plain copy's three questions.

## 3. Lint the words

Run from this skill's folder. Pass copy by path, or pipe it on stdin:

```bash
python3 scripts/word_lint.py path/to/copy.md path/to/page.tsx
python3 scripts/word_lint.py - <<'EOF'
<the drafted copy>
EOF
```

For a dialog, notice or any single screen block, put one text node per line and add `--once`. It flags a word that sits on 3 or more lines, which is a fact stated more than once. A fact shown twice is the defect Andres sees first.

```bash
python3 scripts/word_lint.py --once - <<'EOF'
<one text node per line>
EOF
```

Each finding names the line, the matched words, what to say instead and the rule. For a diff, lint each changed file and act on findings in the lines the diff adds. Exit 0 is clean, 1 has findings. Exit 2 means it read nothing it could lint: read stderr, fix the input, run it again.

Done when the lint has exited 0 or 1 and every finding line is in context.

## 4. Fix and report

Take each lint finding and each better-writing finding in turn. Rewrite the line with the finding's `say` and the rule behind it, or keep it with a one-line justification (copy written for teachers, a quoted rejected option, a word naming something other than Thoven, a name that legitimately repeats). Run the lint again on the final copy.

Report the final copy, then two tables:

| Line | Before | After | Rule |
| --- | --- | --- | --- |

| Line | Kept | Justification |
| --- | --- | --- |

Cite each rule by section and name, as in "3 Clear over clever".

**Done when** the last lint run exits 0, or every finding it still prints has a row in the Kept table, and the report ends with one line per reference you opened, in this shape:

`Used: <path> § <heading>: "<one sentence copied verbatim from that section>"`

`<heading>` is the exact text of a markdown heading in that file. A copied sentence proves you read the section. A reference opened and not quoted counts as not read.
