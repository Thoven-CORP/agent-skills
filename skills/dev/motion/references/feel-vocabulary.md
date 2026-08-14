# Feel vocabulary — plain English → motion

Turns a described *feel* into concrete, Thoven-grounded parameters. Distilled (adapted, not copied) from: emilkowalski/skill (no license — ideas only), kylezantos/design-motion-principles (MIT), vercel-labs/open-agents (MIT), LottieFiles/motion-design-skill (MIT). See `docs/Motion_Skills/research/community-patterns.md` for attribution.

## Gate 0 — should it animate at all?
- **Frequency:** 100+/day → none (≤100ms opacity at most); 10+/day → minimal; occasional → standard; rare/first-time → can delight.
- **Purpose:** must serve spatial continuity, state change, feedback, or explanation. No purpose → no animation.

## Three-lens taxonomy (which "feel" does the surface want?)
Adapted from kylezantos/design-motion-principles (MIT). Weight by Thoven context:
- **Restraint lens** (speed, minimalism) → **teacher operator surfaces** (dashboard, marketplace builder, classroom tools). Default here. Fast, no bounce.
- **Polish lens** (subtle, refined) → parent/marketing surfaces. Smooth settles, tasteful.
- **Expressive lens** (playful, delight) → **student/practice surfaces** (XP, celebrations, level-up). Bounce allowed, sparingly.

## Feel words → preset (lib/motion-config.ts) + timing
| Feel | Preset | ~Duration | Notes |
|---|---|---|---|
| snappy / punchy / responsive | `springs.snappy` | ~250ms | buttons, hero, feedback; no overshoot |
| elegant / premium / refined | `springs.smooth` | ~400ms | reveals, text; tiny overshoot |
| weighty / cinematic / grand | `springs.gentle` | ~600ms | large images, illustrations |
| playful / celebratory / bouncy | `springs.bounce` | ~500ms | celebrations, icon pops — **sparingly**; never on modals |
| calm / reassuring / quiet | opacity fade > movement | longer settle | trust-forward; minimal translate |
| hover lift | `cardHover` (y:-6) / `subtleHover` (y:-2) | hoverSpring | cards / small cards & links |
| staggered cascade | `staggers.tight` (.06) / `normal` (.08) / `relaxed` (.15) | — | decorative; never block interaction |
| inert | none / opacity only | — | reduced-motion or high-frequency |

## Emotion → motion archetypes
Adapted from LottieFiles/motion-design-skill (MIT):
- Energetic/urgent → fast in, snappy out, minimal overshoot (`snappy`).
- Elegant/premium → slower settle, `ease`, **no bounce** (`smooth`/`gentle`).
- Playful/friendly → spring with visible bounce + stagger (`bounce`, sparingly).
- Calm/trustworthy → opacity fades preferred over movement.

## Easing matrix (when hand-writing CSS/Framer easing)
- Entering / exiting: `ease-out`.
- On-screen movement / morph: `ease-in-out`.
- Hover / color: `ease`.
- Drawer / side panel: `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Never** `ease-in` for UI (sluggish exactly when watched); **never** `linear` except loaders/marquees.

## Timing table
button 100–160ms · tooltip 125–200ms · dropdown 150–250ms · modal/drawer 200–500ms (exit ~20% faster than entrance) · **UI ceiling < 300ms**.

## Verify by tracing, never by reading
A timing in a class string is a claim, not a behaviour. Only a trace tells you the browser moved between the endpoints. Drive real input, sample computed style over time, assert intermediate states exist — `e2e/button-press-motion.spec.ts` is the pattern.

Two traps that read as correct:
- **Tailwind v4** emits `translate`/`scale`/`rotate` as standalone properties and leaves `transform: none`. A transition list naming only `transform` animates nothing.
- **Perception beats the suite.** "It feels faster" and "the bottom disappears" are precise reports of a 0ms transition and a desynced shadow. If the code reads correct and a human says it is wrong, trace it before you argue.

## Reduced-motion contract
Drop movement/position; keep opacity/color that aids comprehension. Gate hover behind `@media (hover: hover) and (pointer: fine)`. In Thoven: `getTransition(springs.x)` (Framer) or `gsap.matchMedia()` (GSAP).

## Anti-slop checklist
Adapted from kylezantos (MIT) + emilkowalski (ideas): no `transition: all` (name properties); entrance from `scale(0.95)` not `scale(0)`; no `ease-in` on UI; **no animation on keyboard-triggered actions**; nothing > 300ms for a UI interaction; hover needs the pointer-media guard; exits faster than entrances; stagger simultaneous appearances; animate only `transform`/`opacity`, never `height`/`width`/`margin`/`padding`.
