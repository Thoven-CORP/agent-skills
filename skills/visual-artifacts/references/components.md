# Components

Copy a snippet into a `<section>` of `assets/shell.html`. Every class is defined in `assets/artifact.css`. Do not add a page-level `<style>` for chrome. Colour belongs only in diagrams, status chips and `.stage` contents.

## Section with eyebrow and h2
Use for: every top-level block. Its `id` is the target of a `.bar` link.
```html
<section id="map">
  <span class="eyebrow">01 · The map</span>
  <h2>Eleven slices, one chain that sets the pace</h2>
  <p class="sub">One line on what this section shows.</p>
</section>
```

## Lede
Use for: the two or three sentences under h1, or the opening of a section. `<b>` marks the one thing to notice.
```html
<p class="lede">The finish date hangs on <b>PL7-S2 → PL8-S3</b>. Everything else can start today.</p>
```

## Meta pills
Use for: the source, date, status and owner under the title.
```html
<ul class="pills">
  <li class="pill"><b>Source</b>Linear THV-1160</li>
  <li class="pill"><b>Fetched</b>Oct 22</li>
</ul>
```

## Sticky section nav
Use for: any page with more than three sections. Put it right after the title `<header>`. `.end` holds right-aligned tools.
```html
<nav class="bar" aria-label="Sections">
  <a href="#map">Map</a><a href="#contract">Contract</a>
  <span class="end"><span class="saved" data-saved></span></span>
</nav>
```

## Card panels: `.grid2`, `.grid3` (`.grid4`)
Use for: parallel things of equal weight. Use `.k` for a kicker, `.num` for a big figure, `.outline` for a secondary card, `.strong` for the one inverted card.
```html
<div class="grid3">
  <div class="panel"><p class="k">Backend</p><h3>Room visits</h3><p>One row per join, written by the webhook.</p></div>
  <div class="panel"><p class="k">Open slices</p><p class="num">11</p><p class="muted small">3 blocked on drawings</p></div>
  <div class="panel outline"><h3>Out of scope</h3><ul><li>Recap emails</li></ul></div>
</div>
```

## Callout: note, decision, risk
Use for: one thing the reader must not miss. A decision's first paragraph is the decision itself.
```html
<div class="callout note"><span class="label">Note</span><p>The staging copy is from Oct 20.</p></div>
<div class="callout decision"><span class="label">Decision</span><p>Ticks lock after the lesson ends.</p><p>Why: a child never presses a box that will not respond.</p></div>
<div class="callout risk"><span class="label">Risk</span><p>The recap job has no retry. A Mailgun outage drops a month.</p></div>
```

## Comparison table
Use for: options or recipes compared on the same columns. `td.yes` / `td.no` mark a cell, `tr.grp` heads a group, and `.pick` shades the chosen column.
```html
<div class="tablewrap">
  <table>
    <thead><tr><th>Field</th><th>Today</th><th class="pick">Proposed</th></tr></thead>
    <tbody>
      <tr class="grp"><td colspan="3">Payload</td></tr>
      <tr><td>xp_awarded</td><td class="no">missing</td><td class="pick yes">integer, always present</td></tr>
    </tbody>
  </table>
</div>
```

## Before / after pair
Use for: a change in copy, behaviour or shape.
```html
<div class="ba">
  <div class="before"><span class="label">Before</span>“Book a teacher near you”</div>
  <div class="arrow">→</div>
  <div class="after"><span class="label">After</span>“Find your teacher”</div>
</div>
```

## Steps list
Use for: a procedure. Each step holds one action.
```html
<ol class="steps">
  <li><div><b>Copy the shell</b><p>cp assets/shell.html ~/.thoven-artifacts/&lt;topic&gt;/page.html</p></div></li>
  <li><div><b>Run the finisher</b><p>node scripts/finish.mjs page.html</p></div></li>
</ol>
```

## Definition list
Use for: glossaries, field meanings, and "what each part is".
```html
<dl class="defs">
  <dt>Slice</dt><dd>One thing true at every layer at once, shipped as one issue.</dd>
  <dt>Stage</dt><dd>A mini mock of real product UI, in product colours.</dd>
</dl>
```

## Status chips
Use for: state. These are the only coloured chips. `.dot` adds a leading dot, a plain `.chip` is grey, and `.solid` is inverted.
```html
<span class="chip ok dot">locked</span>
<span class="chip risk dot">at risk</span>
<span class="chip blocked dot">blocked</span>
<span class="chip info dot">new</span>
<span class="chip">closed</span>
<span class="chip solid">PL7-S2</span>
```

## Stage (product UI)
Use for: depicting a real screen or email. The contents keep product colours in both themes. `s-card`, `s-row`, `s-btn`, `s-ghost`, `s-muted`, `s-eyebrow` and `s-owed` are the helpers; inline styles are fine inside a stage.
```html
<div class="stage-wrap">
  <div class="stage">
    <div class="s-eyebrow">This week · Maya</div>
    <div class="s-card" style="max-width:420px">
      <div class="s-row"><b style="flex:1">Scales in G major</b><span class="s-muted">10 min</span></div>
      <div class="s-row"><span class="s-muted" style="flex:1">2 of 3 done</span><span class="s-btn">Mark done</span></div>
    </div>
  </div>
  <p class="cap">Student practice card, as shipped.</p>
</div>
```

## Diagram
Use for: flows, sequences, state, ER, gantt and charts. Write Mermaid in a `<pre class="mermaid">`; `finish.mjs` turns it into `<figure class="diagram" data-mermaid="…">SVG</figure>`. To change a finished diagram, edit `data-mermaid` and rerun. Colour nodes with the themed classes `ok risk blocked info accent strong dim`, never with a `classDef` hex:
```html
<pre class="mermaid">
flowchart LR
  a[Draft] --> b[Review]:::accent --> c([Merged]):::ok
  b -->|changes| d[Fix]:::risk --> b
  a -.-> e[Later]:::dim
</pre>
<div class="legend"><span style="--c:var(--accent)">the gate</span><span style="--c:var(--ok)">done</span></div>
<p class="cap">One line saying what to look at.</p>
```

## Code block
Use for: commands, payloads and snippets. Escape `<` as `&lt;`. Wrap comments in `.c` and keywords in `.k` if they help.
```html
<pre class="code"><code><span class="c"># finish the page</span>
node scripts/finish.mjs page.html</code></pre>
```

## Quote
Use for: a ruling, a user's words, or a line from a source.
```html
<blockquote class="quote"><p>“Fun to me can say Chuck E. Cheese.”</p><cite>Isaac, advisor call, Oct 9</cite></blockquote>
```

## Workbook question card
Use for: anything Andres answers. Add `data-workbook="<unique-key>"` to `<html>`, and `finish.mjs` inlines `workbook.js`. Every control inside a `[data-q]` card autosaves. A radio group needs a `name`, and a control with more than one part needs a `data-k`. `.lab` labels a part in the Markdown, and `data-other` on a text input inside an option ticks that option as you type. Put each round's cards inside a `<section>` with an `h2`, since that h2 becomes the round's `##` heading in the Markdown.
```html
<article class="q" data-q="2.1">
  <div class="qh"><span class="qid">2.1</span><h3>Which wave do we lead with?</h3><span class="pill">Zag 4</span></div>
  <p class="qp">Pick one.</p>
  <div class="parts">
    <div><div class="lab">Wave</div><div class="opts">
      <label class="opt"><input type="radio" name="wave" value="ESA funding"><span>ESA funding</span></label>
      <label class="opt"><input type="radio" name="wave" value="homeschool"><span>homeschool</span></label>
      <label class="opt"><input type="radio" name="wave" value="other"><span>other</span><input class="in" type="text" data-other aria-label="Other wave"></label>
    </div></div>
    <div><div class="lab">Why this one</div><textarea class="in" data-k="why"></textarea></div>
    <div><div class="lab">One-line pitch</div><input class="in" type="text" data-k="pitch" placeholder="Thoven is…"></div>
    <div><div class="lab">Also true</div><div class="chips pick">
      <label><input type="checkbox" data-k="also" value="online-first"><span>online-first</span></label>
      <label><input type="checkbox" data-k="also" value="neurodivergent"><span>neurodivergent</span></label>
    </div></div>
    <div class="slider"><span class="l">Playful</span><input type="range" min="0" max="10" value="5" data-k="tone"><span class="r">Serious</span><output></output></div>
  </div>
</article>
```
Toolbar: put it in the nav's `.end`. `data-progress` shows answered/total, `.progress > i` fills, and `data-saved` shows the save time. Reset takes two clicks. Copy falls back to a textarea modal when the clipboard is blocked.
```html
<nav class="bar" aria-label="Sections"><a href="#r1">Round 1</a><span class="end">
  <span class="saved" data-saved></span><span data-progress></span><span class="progress"><i></i></span>
  <button class="btn small" type="button" data-reset>Reset</button>
  <button class="btn small primary" type="button" data-copy-md>Copy as Markdown</button>
</span></nav>
```
`window.__toMarkdown()` returns the same Markdown: `**<id> <h3>** — <part>: <answer> · …`, grouped under each section's h2.

## Option card grid
Use for: a decision between two to four options. `.rec` marks the recommendation, and `li.con` is a downside. Inside a workbook the radio saves like any other answer.
```html
<div class="options" data-q="D1" data-label="Where the tick lives">
  <label class="option rec"><input type="radio" name="D1" value="A"><span class="tag">A</span><h3>On the card</h3>
    <p>The tick sits on the practice card itself.</p><ul><li>One tap</li><li class="con">Crowds the card on phones</li></ul></label>
  <label class="option"><input type="radio" name="D1" value="B"><span class="tag">B</span><h3>In “What to do”</h3>
    <p>The tick sits at the end of the steps.</p><ul><li>Reads in order</li><li class="con">Two taps</li></ul></label>
</div>
```

## Footer
Use for: links to sources and the files this page was built from.
```html
<footer class="foot"><a href="…">Linear parent</a><span>Generated Oct 22</span></footer>
```
