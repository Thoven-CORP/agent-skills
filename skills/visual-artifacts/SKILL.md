---
name: visual-artifacts
description: HTML artifact for Andres to read. Use for explainers, architecture and flow pages, decision pages, workbooks and dashboards, and whenever show-me, teach or dataviz output becomes an HTML file.
---

# Visual artifacts

An artifact is one self-contained HTML file Andres reads to understand something. What he decides from it moves to Linear or tldraw, so the file is a view, never the source of truth.

## Steps

1. **Folder.** Write to `~/.thoven-artifacts/<area>/<topic>/<slug>.html`. The areas are:
   - `dev`: code, architecture, builds.
   - `product`: specs, flows, brainstorms, positioning.
   - `research`: outside research and comparisons.
   - `misc`: anything else.

   Reuse a topic folder that already exists. The folders already at the root stay where they are.
2. **Recipe.** Pick one from [references/recipes.md](references/recipes.md) and copy [assets/shell.html](assets/shell.html) to the file.
3. **Compose.** Build the page from [references/components.md](references/components.md). Write each diagram as `<pre class="mermaid">`. A chart takes its form from the dataviz skill and its colours from the tokens.
4. **Finish.** Run `node scripts/finish.mjs <file>` from this skill's directory. It inlines the stylesheet, renders every diagram to SVG with Pele, and inlines the workbook script for a page marked `data-workbook`. Fix any diagram it names, then rerun it.
5. **Open.** Run `open <file>` in the same turn and put the path in the reply.

Done when: `finish.mjs` printed its line with every diagram rendered, the file opened, and the path is in the reply.

## The look

`assets/artifact.css` is the design. Compose with its classes rather than writing new styles.

- **Monochrome chrome.** Background, text, borders, nav, buttons, chips and inputs are black and white. Emphasis comes from weight, size and contrast. Colour lives in diagrams, charts, status chips, and `.stage` mini-stages that show real product UI, and it comes from the Thoven palette tokens (amber, sky, emerald, rose, purple, teal, indigo).
- **Skimmable.** The lede states the point. Each heading is a claim. Tables and short bullets carry the detail, with real labels and data.
- **Built up.** A structure with three or more moving parts gets a series of diagrams, each adding one part, the way the teach skill builds a picture.
- **Fit the job.** Use only the components the content needs. A two-section page is fine.
- **Workbook.** A page that asks questions carries no pre-filled answers. Mark `<html data-workbook="<key>">`, and `finish.mjs` adds autosave and Copy as Markdown.

Keep every artifact until Andres says to delete it.
