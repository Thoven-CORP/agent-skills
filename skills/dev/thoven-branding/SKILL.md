---
name: thoven-branding
description: Use for Thoven emails, parent notices, in-app and component text, buttons, headlines, public pages, ads and social posts, and before any Thoven copy reaches Andres even when better-writing or no-ai-slop already loaded. Writes or reviews the copy, or a diff that changes it, in Thoven's voice.
---

# Thoven branding

Every line a family reads says what Thoven is: an online music **academy** built around each kid's
**journey**, where starting is an **adventure** and the teacher is the **right fit**. Write it
**clear over clever**. `BRANDING.md` holds the voice, the words and their reasons. This skill holds
the steps, and the lint brings its own word list at step 3, so draft from BRANDING.md alone.

**Branches.**
- **Write** runs steps 1, 2, 3, 4.
- **Review** (existing copy or a diff) runs step 1, then step 3, then step 2 as a review, then step 4.

## 1. Read BRANDING.md

Open `BRANDING.md` at the root of the frontend worktree you are in, or `~/thoven/frontend/BRANDING.md`
outside one. It is the brand context for every later step. Where section 9 lists an item as open, use
its working version.

Done when the whole file is in context, from its Status line to section 9.

## 2. Write or review through better-writing

Invoke the Skill tool with skill `better-writing`. Hand it BRANDING.md as the product's voice and
vocabulary: the words tables are the inventory it builds, and section 4 sets the tone.

- **Write:** draft the copy. A headline on the homepage or an instrument page uses the locked header. Copy that tells a family what to do (which button, what happens next) comes from the shipped route: open it and follow the steps in their real order before writing them. (2026-11-05: a Day 0 email listed the purchase steps out of order.)
- **Review:** run better-writing's review over the copy, with the step 3 findings beside it.
- **One screen names each thing once.** Read the header, subheader, toolbar and buttons together; when two of them say the same phrase, keep it in the one that carries it and cut it from the rest.

Done when, writing, every piece of copy the request names is drafted, or, reviewing, better-writing's
findings table and its Block or Approve verdict are written.

## 3. Lint the words

Run the lint from this skill's folder. Pass copy files by path, or pipe drafted copy on stdin:

```bash
python3 scripts/word_lint.py path/to/copy.md path/to/page.tsx
python3 scripts/word_lint.py - <<'EOF'
<the drafted copy>
EOF
```

Each finding names the line, the matched words, what to say instead and the BRANDING.md rule. For a
diff, lint each changed file and act on findings in the lines the diff adds. Exit 0 is clean, 1 has
findings. Exit 2 means it read nothing it could lint: read stderr, fix the input, and run it again.

Done when the lint has exited 0 or 1 and every finding line is in context.

## 4. Fix and report

Take each lint finding and each better-writing finding in turn. Rewrite the line with the finding's
`say` and the BRANDING.md rule behind it, or keep it with a one-line justification (copy written for
teachers, a quoted rejected option, a word naming something other than Thoven). Run the lint again
on the final copy.

Report the final copy, then two tables:

| Line | Before | After | BRANDING.md rule |
| --- | --- | --- | --- |

| Line | Kept | Justification |
| --- | --- | --- |

Cite the rule by section and name, as in "3 Clear over clever".

Done when the last lint run exits 0, or every finding it still prints has a row in the Kept table.
