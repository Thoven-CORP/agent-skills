---
name: thoven-art
description: Pictures in Thoven's art family, from the art library in design/art. Use when planning, listing, or scheduling art for a design, page, or feature (stickers, stamps, instruments, icons, marks, hand-drawn outlines and boxes, frames, photos, Thovie), before the plan names a new asset, and before generating any image or icon (QuiverAI, Paper). Read design/art/INDEX.md first. Also use when adding or reviewing assets.
---

# Thoven art

Every picture a family sees belongs to one **family**: the six homepage instruments, the Music Passport marks and the genre stickers. Flat vector, no outlines, bold flat colour, a highlight and a shadow side. The **library** is `design/art/` in the frontend repo, and its `INDEX.md` has one row per asset. Reuse comes first; generation fills a real gap only, and every new piece goes back into the library. `thoven-branding` owns words; this skill owns pictures.

**Branches.**
- **Use** (a design needs art) runs steps 1, 2, then 5 for anything placed.
- **Make** (step 2 found a gap) runs steps 1, 2, 3, 4, 5.
- **Review** (an asset or a design's art) runs step 1, then step 4 as the review.

## Open the reference before you act

| Task | Open |
| --- | --- |
| Any art task | `design/art/INDEX.md` in the frontend worktree you are in, else `~/thoven/frontend/design/art/` (step 1) |
| Make an icon, mark, instrument or sticker | `design/art/palette/art-palette.json`, and the INDEX rows named as references (step 3) |
| Make a frame, box or hand-drawn UI mark | `design/art/frames/make_frames.py` and the design-system colour tokens (step 3) |
| Add an asset to the library | `scripts/check_index.py` (step 5) |

Open every row the task touches.

## 1. Read the library

Read the whole index, header lines included: the kinds, the statuses and the colour rule.

Done when the whole index is in context and your report quotes one sentence from its header.

## 2. Map each need to a row

Name each need as a kind and a meaning ("an icon for learns by ear", "a frame for a box"). Find the row whose meaning a parent reads at a glance. Use `locked` and `chosen` rows, never `superseded`. A row with rules in its Notes column (sticker placement, stamp anatomy) brings those rules with it.

Never plan a new asset before this step finds a gap. The first kit planned twelve new icons while the passport marks already covered three, and Andres asked: "Why did you create the assets when we had some from the original stickers and stuff."

Done when every need has a row, or is written down as a gap with its kind and meaning.

## 3. Make the gap from its kind's references

Generation spends Andres's Paper usage. It runs only when he has asked for new art in this session, and a batch states its budget first. Read `get_guide({ topic: "image-generation" })`.

| Kind | Make it with | References and colour |
| --- | --- | --- |
| icon, mark, instrument | `quiver-arrow-edit` in Paper | `reference_nodes` = the six instruments, four passport marks and two or three genre stickers, together: instruments alone came out flatter than the marks. Art palette. |
| sticker | `quiver-arrow-edit` | Three or more stickers as references, then the white die-cut border. Art palette. |
| stamp | The locked stamp design system (its Paper node is in the index) | Never generated freehand. |
| frame, box, hand-drawn UI mark | A script that writes SVG (`design/art/scribbles/scribble.py` is the pattern) | Design-system tokens: fills at 100 and 200, accents at 300 to 600 of the same hue. Pale tints read washed out and the art palette looked wrong on UI, so frames never use it. |
| photo | `google-nano-banana-2-1` image-to-image | Two library photos as references; the first one's shape sets the output's, since `aspect_ratio` is ignored. No logos, no text, no unshipped feature on screen. |
| mascot | Reuse only | Thovie is never generated. |

- A batch opens with a three-piece trial. The rest waits until the trial passes step 4.
- Run Quiver calls one at a time: 4 of 9 parallel calls errored.
- Illustration colour comes from `design/art/palette/art-palette.json`. Rerun `design/art/palette/art_palette.py` after the instruments or stickers change. Existing art keeps its own colours and is never recoloured.
- A frame is a small accent on a box, never the object itself: a full-width tuner band was "way too much of an object".
- Export every icon, mark and sticker tight to its glyph. Alignment is judged on the visible edge ([thoven-designer check](../thoven-designer/references/check.md)), so transparent padding becomes a misalignment the size of the padding. No check measures padding yet (gap, ticket THV-2134).

Done when every gap has a candidate, or its failure is written down with the usage it spent.

## 4. Judge it beside the family

Screenshot each candidate beside the instruments, the passport marks and the stickers. It passes when it has the same flat style with a highlight and a shadow side, takes its colours from the art palette (or tokens, for a frame), and reads at 48px. A frame also passes only when the box still reads as a plain box. Regenerate a failure once with a sharper prompt, within the budget.

Done when every candidate has a pass or fail with its reason.

## 5. Add it to the library

Copy each new or newly placed file into `design/art/<kind folder>/` and add its `INDEX.md` row: name, kind, file, Paper node, source (reused from where; generated with the model and its references; hand-built with the script; sampled), status, and notes with any rule it carries. Mark a replaced row `superseded` and keep it. Then run the check:

```bash
python3 ~/.agents/skills/thoven-art/scripts/check_index.py <frontend worktree>/design/art
```

Exit 0 is clean, 1 lists findings to fix, 2 means it found nothing to check.

**Done when** the check exits 0 and the library change is committed on the ticket's branch, and the report ends with one line per markdown reference you opened (a script or JSON file you opened is named in the report, with no `Used:` line), in this shape:

`Used: <path> § <heading>: "<one sentence copied verbatim from that section>"`

`<heading>` is the exact text of a markdown heading in that file (`INDEX.md`'s header sits under "Thoven art library"). A copied sentence proves you read the section. A reference opened and not quoted counts as not read.
