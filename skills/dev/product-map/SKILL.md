---
name: product-map
description: Refresh or build the Thoven Product Map, the Paper file of every audience's real screens and journeys. Use for "refresh the product map", "refresh the teacher map" (or parent, student, adult student), "rebuild the map page", or adding a journey to the map.
---

# Product map

The **Thoven Product Map** is a Paper file with one page per audience: Teacher, Parent, Student,
Adult student. Each page opens with Row 0 (the rooms), then one row per journey: steps left to
right in user order, each step the 1440 shot with the 390 shot beside it, arrows labelled with the
button text, and `route · date · commit` under each step. Decisions: Linear THV-1672 (PM1-PM17).

Everything runs from a **frontend checkout** that has `scripts/product-map/` (main, or the branch
being mapped), with its paired backend checkout beside it as `../backend` or named by
`PRODUCT_MAP_BACKEND`. The Paper file id and page ids are in `scripts/product-map/paper.json`.

## Refresh one audience

1. **Shoot.** On the MacBook: `bash scripts/product-map/refresh.sh <audience>` (`teacher`,
   `parent`, `student`, `adult-student`; add `lane,lane` to reshoot only those rows). It rebuilds
   the showcase world on the mini, shoots every step at 1440 and 390, and copies the shots to
   `~/.cache/thoven-product-map/<audience>/shots/`. A lane-only run replaces just those rows and
   keeps the rest. If it prints `still running on the mini`, collect with
   `bash scripts/product-map/refresh.sh --fetch <audience> [lane,lane]` (the same lanes).
   Done when it prints the `shots:` line. Each
   `STEP FAILED` line has a failure shot in `~/.cache/thoven-product-map/<audience>/failures/`;
   read the shot, and fix the journey script when the selector is ours, or record the product
   defect as a Noticed line when the app is wrong. Never fix product code from this skill.
2. **Open Paper.** The Paper desktop app must be open. Load the Paper tools and read
   `get_guide paper-mcp-instructions` once per session. Touch only the Thoven Product Map file.
   One writer at a time: if another session is writing to it, wait.
3. **Plan.** `node scripts/product-map/paper.mjs refresh <audience>` prints `images` (an
   `update_styles` call each), `captions` (`set_text_content` each) and `missing`.
4. **Swap in place.** Apply every `images` entry with `update_styles` (the node keeps its id and
   position; files are named by content, so only changed shots appear) and every `captions` entry
   with `set_text_content`. A non-empty `missing` means the page lacks those steps: run **Build**
   for their rows.
5. **Check and release.** `get_screenshot` each row artboard you touched and look at it, then
   `finish_working_on_nodes`, then `node scripts/product-map/paper.mjs applied <audience>`.
   Done when every row you touched shows the new shots and `applied` has run.

## Build a page or a row

For a new audience page, a new row, or a row whose steps changed in the spec.

1. Shoot as in Refresh step 1, and open Paper as in step 2.
2. `node scripts/product-map/paper.mjs build <audience>` prints, per row, the artboard to create
   (`name`, `styles`) and the `write_html` calls in order. A row that already exists on the page:
   delete only that artboard first.
3. Per row: `create_artboard` on the audience's `pageId`; then each write in order with
   `write_html` mode `insert-children`, into the artboard when `into` is `artboard`, otherwise
   into the node whose layer name is `into` (the row container, from the previous result's
   `createdNodes`).
4. **Record the node ids.** Each `write_html` result lists `createdNodes` with their layer names.
   Pipe a JSON object of every name ending in `/1440`, `/390` or `/caption`, plus the artboard
   name, mapped to its node id into `node scripts/product-map/paper.mjs record <audience>`.
   Refresh finds nodes only through this map (`get_tree_summary` rebuilds it if the cache is
   lost). Done when `record` reports one node per step and slot.
5. Review each row with `get_screenshot` against the Paper guide's checkpoints, then
   `finish_working_on_nodes` and `paper.mjs applied <audience>`.

## Change what the map shows

The journeys are approved per audience by Andres (PM8); a new or cut journey is his call.

- The rows and steps: `scripts/product-map/specs/<audience>.json` (`via` is the button text into
  a step; `note` prints under it, for what the picture cannot say).
- How each step is reached: `scripts/product-map/journeys/<audience>.mjs`, one function per row.
- The world it shoots: backend `rake product_map:seed` (`lib/product_map/showcase_seed.rb`).
  Names are Andres Martinez or real fixtures, never invented.

Then run Build for the changed rows.

## Pitfalls

- Live lessons use a stubbed Daily room and a test camera (no Daily key on the mini); those
  cards carry a "Stubbed video" note.
- Shots stay out of git and live only in the cache; Paper is the place to look.
