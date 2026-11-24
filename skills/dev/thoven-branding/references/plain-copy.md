# Plain copy on product screens

For copy on a signed-in product screen: a dashboard, a flow, a dialog, an empty or error state.
Public and marketing pages keep `BRANDING.md`'s rules. These rules guide judgement; they are not
measurements. Andres, 2026-11-12: "remember these are guides and not exact measurements, it's
about feeling and design".

## Plain

Write plain English for people who don't like reading. Use whole sentences, and say the outcome of
each action. Copy guides, describes, and tells people what to expect or what to do. It informs,
prevents mistakes and builds understanding; how the product works stays out of it. Assume people
want the least time on the screen.

## Tight

Tight means cutting verbose and repeated statements, not shortening words. Ask of every line:

1. Do we need to say this?
2. Can it be said more simply?
3. Can the layout show it instead? (frontend `DESIGN.md`, "Calm screens")

Andres, 2026-11-12: "Excessive explanation copy is cope for bad UI and causes more confusion." A
long explanation is a layout problem: fix it there. Judge a line by whether it is clean and
concise, never by a word count; a count games the copy into short phrases nobody can read.

## Once

- A screen names each thing once. Read the title, header, filter, toolbar and buttons together;
  copy below them adds only what they leave out. Example: with the diverse-learners filter on,
  "Teaches diverse learners" on every card repeats the filter, so it comes off the cards. The
  same goes for any fact the list was matched on: recommended teachers drop the age range,
  because "that's why they were shown" (Andres, 2026-11-18).
- A dialog states each fact once. The title says what happened, one line says what it means or what comes next, and a fact list holds only the facts those two do not. Reschedule Denied said the outcome in its title, a red subtitle, a summary sentence, a "Reschedule Response" table and the quoted reason. Andres, 2026-11-24: "the header says what happened, then under it a summary, then a table with the same information". The slots are `~/.agents/skills/thoven-designer/references/dialogs.md`; the catch is `word_lint.py --once`.
- One name per thing everywhere, and counts that agree from screen to screen.
- A sentence that sums up the parent's answers names the kind of answer, "Andres's needs" or
  "the times you chose", and never lists the picks, because a parent can pick five needs and a
  diagnosis and the line no longer fits (Andres, 2026-11-18, said several times).

## Facts

A fact sits in a sentence or in a labelled row ("Student: Emma"). Never string unlabelled facts together with dashes or middle dots ("Emma piano — Emma — Wed, Nov 25"): a reader cannot tell what each value is. Andres, 2026-11-24: "Emma piano — Emma — date and time with no context". Each metadata fact gets its own row or line (frontend `DESIGN.md`, "Copy — never join metadata with a middle dot"). The lint reports `dash-chain`.

## Voice

- Ask directly, with no softener such as "Please".
- Name the real channel: "email thovie@thoven.co", not "contact the team".
- Fold a stray word or date into its sentence, or drop it, so it never sits on a line of its own.
- Reuse the sentence shapes the nearby screens already use. Keep the voice warm and helpful, never technical or robotic.
- A title stands on its own, with no eyebrow label (the small all-caps line above it).
- A badge with room reads as a whole phrase with its verb, "Reviewed to teach diverse learners",
  because a clipped label like "Reviewed for diverse learners" is "not a proper phrase" (Andres,
  2026-11-18).
- Text a teacher or parent wrote shows as plain body text, with no quotation marks or quote
  styling, because nothing else on the screen is quoted (Andres, 2026-11-18: "drop the quotes
  everywhere").

## Lexicon

Use the platform's nouns from frontend `design/lexicon/LEXICON.md`. A makeup is a missed session the teacher gives back. Never call it a refund or a credit. Andres, 2026-11-24: "a makeup ... a new primitive, terms and semantic meaning". The lint reports `makeup-refund`.
