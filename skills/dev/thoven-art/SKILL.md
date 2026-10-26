---
name: thoven-art
description: Pictures in Thoven's art family, from the art library in design/art. Use when a design, page or feature needs art (stickers, stamps, instruments, icons, marks, hand-drawn outlines and boxes, frames, photos, Thovie), before generating any image or icon (QuiverAI, Paper image generation), and when adding or reviewing assets.
---

# Thoven art

Every picture a family sees belongs to one **family**: the six homepage instruments, the Music
Passport marks and the genre stickers. Flat vector, no outlines, bold flat colour, a highlight and a
shadow side. The **library** is `design/art/` in the frontend repo, and its `INDEX.md` has one row per
asset. Reuse comes first. Generation fills a real gap only, and every new piece goes back into the
library. `thoven-branding` owns words; this skill owns pictures.

**Branches.**
- **Use** (a design needs art) runs steps 1, 2, then 5 for anything placed.
- **Make** (step 2 found a gap) runs steps 1, 2, 3, 4, 5.
- **Review** (an asset or a design's art) runs step 1, then step 4 as the review.

## 1. Read the library

Open `design/art/INDEX.md` in the frontend worktree you are in, or `~/thoven/frontend/design/art/`
outside one. Read the header lines: the kinds, the statuses and the colour rule.

Done when the whole index is in context.

## 2. Map each need to a row

Name each need as a kind and a meaning ("an icon for learns by ear", "a frame for a box"). Find the row
whose meaning a parent reads at a glance. Use `locked` and `chosen` rows, never `superseded`. A row
listed with rules in its Notes column (sticker placement, stamp anatomy) brings those rules with it.

Done when every need has a row, or is written down as a gap with its kind and meaning.

## 3. Make the gap from its kind's references

Generation spends Andres's Paper usage, so it runs only when he has asked for new art in this
session, and a batch states its budget first. Read `get_guide({ topic: "image-generation" })`.

| Kind | Make it with | References and colour |
| --- | --- | --- |
| icon, mark, instrument | `quiver-arrow-edit` in Paper | `reference_nodes` = the six instruments, four passport marks and two or three genre stickers. Art palette. |
| sticker | `quiver-arrow-edit` | Three or more stickers as references, then the white die-cut border. Art palette. |
| stamp | The locked stamp design system (its Paper node is in the index) | Never generated freehand. |
| frame, box, hand-drawn UI mark | A script that writes SVG (`scribbles/scribble.py` is the pattern) | Design-system tokens: fills at 100 and 200, accents at 300 to 600 of the same hue. |
| photo | `google-nano-banana-2-1` image-to-image | Two library photos as references; the first one's shape sets the output's. No logos, no text, no unshipped feature on screen. |
| mascot | Reuse only | Thovie is never generated. |

- A batch opens with a three-piece trial. The rest waits until the trial passes step 4.
- Run Quiver calls one at a time. Parallel calls error.
- Illustration colour comes from `palette/art-palette.json`. Rerun `palette/art_palette.py` after the
  instruments or stickers change. Existing art keeps its own colours and is never recoloured.
- A frame is a small accent on a box, never the object itself.

Done when every gap has a candidate, or its failure is written down with the usage it spent.

## 4. Judge it beside the family

Screenshot each candidate beside the instruments, the passport marks and the stickers. It passes
when it has the same flat style with a highlight and a shadow side, colours from the art palette (or
tokens, for a frame), and it reads at 48px. A frame also passes only when the box still reads as a
plain box. Regenerate a failure once with a sharper prompt, within the budget.

Done when every candidate has a pass or fail with its reason.

## 5. Add it to the library

Copy each new or newly placed file into `design/art/<kind folder>/` and add its `INDEX.md` row: name,
kind, file, Paper node, source (reused from where; generated with the model and its references;
hand-built with the script; sampled), status, and notes with any rule it carries. Mark a replaced row
`superseded` and keep it. Then run the check:

```bash
python3 ~/.agents/skills/thoven-art/scripts/check_index.py <frontend worktree>/design/art
```

Exit 0 is clean, 1 lists findings to fix, 2 means it found nothing to check.

Done when the check exits 0 and the library change is committed on the ticket's branch.
