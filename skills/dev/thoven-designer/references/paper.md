# Working in Paper

Use when creating or editing a Paper file, or importing a frame into code. Comparing a built screen
with its frame is [visual parity](visual-parity.md).

- **A new file starts with its system.** Export the reusable components, tokens and colour system
  into it first, and build its screens from them.
- **Import by Paper's own export guide** (`get_guide`): values through `get_jsx` and
  `get_computed_styles`, images from the originals in the file's assets.
- **Build editable layouts**, nested so each part can be changed on its own, rather than static
  frames.
- **A part that exists in code is copied, never redrawn.** Take it from its live page or the frame
  it already has in Paper, values and all, because a lookalike drifts and "this is why it looks
  poor" (Andres, 2026-11-18, on a marketplace card drawn from memory, said several times).
- **Frame size** follows the law's "Desktop frames are a 1280×720 window" (`enforcement/rules/thoven-law.md`).
- **A frame is one window.** A page taller than the window is drawn as a top frame and a scrolled
  frame, never one tall frame, so the frames show what the person sees and how the page scrolls
  (Andres, 2026-11-18: "the way it's setup is misleading").
- **Name each frame for what it designs**, the screen and its state, never A, B or C.
- **One source of truth.** Keep the file clean: few lookalike static screens, each tied to the shared
  tokens. Andres, 2026-11-12: "to prevent multiple screens and multiple components changing as we
  design". Paper edits are cheap, so edit a frame in place; copy one only to show a before and
  after in an explanation. Once an option is picked, mark the picked frame "Finalized ·" as you mark
  the losing frames "Superseded ·", and delete the losers when Andres confirms the pick (Andres,
  2026-11-18: "remove any scratch and superseded items"). Before building from or comparing
  against a frame, name it and its status; a frame with no status is a question to Andres, because
  builds kept starting from an old version ("brought back v1 as v3").
- **Thoven art is the real asset.** Anything that has Thoven art, such as the Passport cover, uses
  its real image, exported from its Paper file or taken from `design/art`, and greyed out when it is
  not made yet. Never draw a stand-in, because it hides how the real art reads at that size
  (inferred reason, approved 2026-11-21; Andres, 2026-11-20: "Use the actual passport artwork").
- **Check the frame before handing it back.** Code linters cannot see Paper, and two `DESIGN.md`
  rules broke in Paper with nothing to catch them (Andres, 2026-11-20: "Piano · Classical, which is
  not how we display it anywhere"; 2026-11-18: "the radius is too wide for an internal block").
  Before a frame goes back to Andres:
  1. Search its text nodes for " · " and expect none outside a list of same-kind items
     (`DESIGN.md`, "never join metadata with a middle dot").
  2. Read each nested container's radius with `get_computed_styles` and confirm it equals the outer
     radius minus the inset between them (`DESIGN.md`, "Nested radii are concentric").
  3. For a dialog frame, pipe its text nodes, one per line, into `python3 ~/.agents/skills/thoven-branding/scripts/word_lint.py --once -`
     and expect exit 0: a fact in two slots or an unlabelled string of facts is a defect in the frame
     too ([dialogs](dialogs.md), "Each fact once"). Also confirm its secondary button is neutral.

