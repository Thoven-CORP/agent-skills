# Motion layer decision tree (full)

Seeded from the capability matrix in `docs/Design_Specifications/2026-05-11-motion-audit-and-prototype-spec.md` and the CSS-first escalation principle (Josh Comeau, MIT-adjacent ideas; vercel-labs/open-agents, MIT).

## The escalation ladder (cheapest first)
Always escalate only when the cheaper layer genuinely can't do the job.

1. **CSS transition** — state changes, hover, color, simple enter/exit that doesn't need interruption. GPU-friendly (`transform`/`opacity`).
2. **CSS keyframe** (`globals.css`: `.animate-fade-in`, `.animate-float`, `.animate-pulse-glow`) — ambient loops. No JS library for a loop.
3. **Framer Motion (motion-react)** — anything React-stateful: enter/exit with `AnimatePresence`, `layout`/`layoutId` morphs, gestures, drag, interruptible microinteractions, `whileInView` one-shot reveals.
4. **GSAP** — scroll-*scrubbed*/pinned/parallax (`gsap-scrolltrigger`) and complex multi-element sequenced timelines (`gsap-timeline`).
5. **Lottie / Rive** — pre-produced animation *files* (vector playback / interactive state-machine art), not hand-coded motion.

**Novel-functionality test** (Comeau): if a JS library would only wrap a CSS feature you could use directly, use CSS. Escalate to JS only for behavior CSS can't express (interruption, gesture-tracking, scroll-scrub, layout morph).

## The scroll distinction (most common mis-route)
- **One-shot reveal** — element fades/slides in *once* as it enters the viewport → **motion-react `whileInView`** (or IntersectionObserver). Matches Thoven's existing reveals on `/for-teachers`. **Do not reach for GSAP.**
- **Scroll-scrubbed / pinned / parallax** — animation progress is *tied to* scroll position, or a section pins while content animates → **gsap-scrolltrigger**.

## The Lenis / smooth-scroll gate
Page-wide smooth-scroll (Lenis, Locomotive v5) is **gated**, not a casual add. It hijacks native scroll and regresses: anchor pills, in-page links, sticky/fixed nav, iframes/embeds (e.g. the `/summer-academy` Instagram embed), scroll-snap, and Safari/iOS touch. Per the motion audit it stays evaluation-only until a GSAP prototype proves enough value. **Default recommendation: don't add it.** If asked, surface the regression surface and the gate.

## The Rive flag
Rive's React runtime (`@rive-app/react-canvas`) is **not installed** and has no official agent resource (their MCP is deprecated/editor-side). For interactive character/state-machine art, **flag it as an adoption decision**, don't silently scaffold it.

## Worked examples
- "Pin the pricing section and scrub an illustration as you scroll" → `gsap-scrolltrigger` (scrub + pin).
- "Fade each card in as it enters view (one-shot)" → `motion-react` `whileInView` — NOT GSAP.
- "Animate the XP bar filling" → `motion-react`, width/scaleX, `springs.snappy`, `getTransition`.
- "Loading dots that loop forever" → CSS keyframe.
- "Hero choreographs in on load" → `gsap-timeline` (+ `gsap-react`), `matchMedia` reduced-motion.
- "Celebration animation file on level-up" → Lottie pointer (`lottie-react`).
- "Smooth-scroll the whole page" → Lenis **gated** — recommend not now.
- "Pulse a badge on every count update (constant)" → frequency gate → minimal/none.
