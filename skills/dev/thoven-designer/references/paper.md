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
- **A frame is one window.** A page taller than the window is drawn as a top frame and a scrolled
  frame, never one tall frame, so the frames show what the person sees and how the page scrolls
  (Andres, 2026-11-18: "the way it's setup is misleading").
- **Name each frame for what it designs**, the screen and its state, never A, B or C.
- **One source of truth.** Keep the file clean: few lookalike static screens, each tied to the shared
  tokens. Andres, 2026-11-12: "to prevent multiple screens and multiple components changing as we
  design". Paper edits are cheap, so edit a frame in place; copy one only to show a before and
  after in an explanation. Once an option is picked, mark the losing frames "Superseded ·" and
  delete them when Andres confirms the pick (Andres, 2026-11-18: "remove any scratch and
  superseded items").
