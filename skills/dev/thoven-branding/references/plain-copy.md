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
- One name per thing everywhere, and counts that agree from screen to screen.
- A sentence that sums up the parent's answers names the kind of answer, "Andres's needs" or
  "the times you chose", and never lists the picks, because a parent can pick five needs and a
  diagnosis and the line no longer fits (Andres, 2026-11-18, said several times).

## Voice

- Ask directly, with no softener such as "Please".
- Name the real channel: "email thovie@thoven.co", not "contact the team".
- Fold a stray word or date into its sentence, or drop it, so it never sits on a line of its own.
- Reuse the platform's lexicon (frontend `design/lexicon/LEXICON.md`) and the sentence shapes the
  nearby screens already use. Keep the voice warm and helpful, never technical or robotic.
- A title stands on its own, with no eyebrow label (the small all-caps line above it).
- A badge with room reads as a whole phrase with its verb, "Reviewed to teach diverse learners",
  because a clipped label like "Reviewed for diverse learners" is "not a proper phrase" (Andres,
  2026-11-18).
- Text a teacher or parent wrote shows as plain body text, with no quotation marks or quote
  styling, because nothing else on the screen is quoted (Andres, 2026-11-18: "drop the quotes
  everywhere").
