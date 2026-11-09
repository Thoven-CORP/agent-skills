---
name: visual-artifacts
description: HTML artifact for Andres to read. Use for feature walkthroughs, explainers, architecture and flow pages, decision pages, workbooks and dashboards, and whenever show-me, teach or data visualisation becomes an HTML file.
---

# Visual artifacts

An artifact is a reading view. Decisions move to Linear or tldraw. The default deliverable is one self-contained HTML file; updating it preserves its path.

## Steps

1. **Frame.** State the reader's question and the answer in one sentence each. Pick a recipe from [references/recipes.md](references/recipes.md); omit sections that repeat another section's job. Execution plans and progress updates go in chat.
2. **Locate.** Reuse `~/.thoven-artifacts/<area>/<topic>/<slug>.html`, where area is `dev`, `product`, `research` or `misc`. Search the topic before creating another file. Start new pages from [assets/shell.html](assets/shell.html).
3. **Compose.** Use the [page rhythm and components](references/components.md). Choose each visual by what the reader needs to understand:
   - Layout, spatial relationship or human journey → Excalidraw-style drawing, including rough.js SVG.
   - Precise branches, ownership, dependencies or message order → Mermaid rendered by the bundled Pele finisher.
   - Actual appearance → real screenshot; interaction → a recorded flow. For capture, read [QA capture](../dev/qa-flow/references/flow-mapping-and-evidence.md#7-capture-screenshots-and-recorded-flows).
   - Quantities, trends or distributions → [references/data-visualisation.md](references/data-visualisation.md).
   - Exact records or repeated fields → a compact table. Explanations use a diagram, short prose or a list.
4. **Keep it current.** Use the latest approved decisions and existing evidence. Correct stale copy or media you notice; label illustrative or outdated content where it matters. Use [references/delivery.md](references/delivery.md) for freshness and live-session proposals.
5. **Finish lightly.** Run `node scripts/finish.mjs <file>` once from this skill's directory; rerun only after fixing an actual failure. It embeds CSS, renders Mermaid through Pele, and adds workbook support for `data-workbook`. Fix obvious wording or rendering problems as you work. Internal artifacts do not require a separate browser audit, capture run, verifier agent or multi-pass checklist. Go deeper only for a concrete problem or when Andres asks. Reuse existing feature QA; making the artifact does not restart it.
6. **Deliver.** Follow [references/delivery.md](references/delivery.md): open a new completed artifact once; update an existing artifact in its known tab when control is available. Give its stable path and a short account of what changed in the reply.

Done when: the file compiles, is saved at its canonical path, and is delivered. Keep the checks proportional to an internal document.

## The look

`assets/artifact.css` owns chrome. Compose its classes; keep any new visual-specific styles inside that visual's stage.

- **Hierarchy.** Use short, concrete headings with some character, a one-sentence lede, one main visual per section and brief captions. Put the main demonstration immediately after the overview. Explain a fact once and refer back to it.
- **Draw to explain.** A drawing should clarify an arrangement or transition. Add progressive diagrams only when each reveals a new relationship; a wall of diagrams is also hard to read.
- **Show the product.** Real phone captures inside drawn phone frames are a preferred walkthrough format. Preserve screen proportions and readable text. Label constructed UI as an illustration or prototype.
- **Monochrome chrome.** Background, text, borders, navigation and inputs stay monochrome. Colour in diagrams, charts, status chips and product stages comes from Thoven's palette; real product UI keeps its own treatment.
- **One scroll.** Let boxes grow; wrap long content and fit diagrams to their column. The page is the scrolling surface.
- **Fit the job.** A two-section page is fine. Use before/after only when comparison answers the current question; a finished-feature walkthrough shows its current state.
- **Workbook.** Keep answers blank. Mark `<html data-workbook="<key>">` for autosave and Copy as Markdown.

Keep every artifact until Andres says to delete it.
