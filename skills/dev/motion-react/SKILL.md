---
name: motion-react
description: Implement React UI motion in the Thoven frontend with Framer Motion and CSS — enter/exit, hover, layout, gestures, microinteractions, reveals, modals, XP/progress fills. RULE #1, always — use lib/motion-config.ts presets (springs.snappy/smooth/gentle/bounce, staggers, cardHover/subtleHover) and getTransition() for reduced motion; never invent spring or duration values. Links to motion.dev for deep API rather than reproducing it; routes scroll-scrubbed/pinned and complex timelines to the gsap-* skills. For the decision of which tool or feel to use, see the motion skill.
license: MIT
---

# motion-react — implement React UI motion (Thoven)

## Rule #1 — use Thoven's motion vocabulary (never hand-roll values)
Import from `lib/motion-config.ts`. Do **not** write raw `{ stiffness, damping }` or `{ duration }`.

```tsx
import { springs, staggers, cardHover, subtleHover, getTransition } from '@/lib/motion-config'
```
- **springs**: `snappy` (~250ms; buttons, hero, feedback) · `smooth` (~400ms; reveals, text) · `gentle` (~600ms; large images) · `bounce` (~500ms; celebrations — sparingly, **never on modals**)
- **staggers**: `tight` 0.06 · `normal` 0.08 · `relaxed` 0.15
- **cardHover** (lift y:-6 / tap y:-2) · **subtleHover** (y:-2) — spread onto a `motion` element
- **getTransition(springs.x)** → returns `{ duration: 0 }` under `prefers-reduced-motion`. Wrap transitions with it.

**If none of them fit, do not invent a number in the component.** The route is
frontend `design/STACK.md` → **REFERENCE** (transitions.dev) → `dialkit` on the real component →
a token module with a test → import it here like any other preset. A value that never makes that
trip is a value the next person will guess at again.

## Imports
Thoven imports from `framer-motion` (matching the existing components). The npm package is now `motion` (`motion/react`) — the same library, modern alias. **Match the file/area you're editing; do not mass-migrate.**

## Scope
Use for React component motion. For *which tool / what feel*, see **motion**. For scroll-*scrubbed*/pinned/parallax or sequenced multi-element timelines, use **gsap-scrolltrigger** / **gsap-timeline**. For deep Framer API, link to `motion.dev/docs` — don't paste reproduced reference here (it rots).

## Core patterns (as used in Thoven)
```tsx
// One-shot reveal as it enters view — whileInView, NOT GSAP
<motion.section initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }} transition={getTransition(springs.smooth)} />

// Enter/exit (modal, toast) — AnimatePresence; exit ~20% faster; no bounce on modals
<AnimatePresence>{open && <motion.div initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
  transition={getTransition(springs.smooth)} />}</AnimatePresence>

// Hover lift — spread the preset
<motion.div {...cardHover} />

// Stagger children
const parent = { animate: { transition: { staggerChildren: staggers.normal } } }

// XP / progress fill — animate scaleX/width with snappy (see components/teacher/sessions/XPBar.tsx,
// components/student/XpThermometer.tsx)
<motion.div initial={{ scaleX: 0 }} animate={{ scaleX: pct }} style={{ originX: 0 }}
  transition={getTransition(springs.snappy)} />
```
- Layout morph: `layout` / `layoutId`.
- Entrance scale floor: start `scale(0.95)`, never `scale(0)`.
- **Don't** combine `cardHover` with an explicit reveal `transition` on the *same* element — `cardHover` carries its own `hoverSpring`; a sibling `transition` prop clobbers it. Put the reveal and the hover on separate `motion` elements.

## CSS / Tailwind motion (cheaper layers)
- Simple state/hover/color → CSS `transition-*`.
- Ambient loop → `globals.css` keyframes: `.animate-fade-in` / `.animate-float` / `.animate-pulse-glow`. No JS for loops.
- Thoven 3D button = CSS box-shadow depth (`0 2px 0` hover → `0 1px 0` active, `var(--shadow-color)`), not a JS animation.

## Reduced motion (required, every time)
- Framer: wrap with `getTransition(...)`, or branch on `useReducedMotion()`.
- GSAP: `gsap.matchMedia()` — gold standard in `components/landing/HomepageConductorMotion.tsx`.
- Drop movement/translate; keep opacity/color. Gate hover behind `@media (hover: hover) and (pointer: fine)`.

## Performance
- Animate only `transform` / `opacity`. **Never** `height` / `width` / `margin` / `padding` (layout thrash) — for size use `layout` or `scaleY`.
- Under heavy load, prefer CSS for predetermined sequences; Framer for interruptible/dynamic.

## Easing & timing (only when not using a spring preset)
Enter/exit → `ease-out`; movement → `ease-in-out`; hover/color → `ease`; never `ease-in`/`linear` for UI. Button 100–160ms · tooltip 125–200 · dropdown 150–250 · modal 200–500 (exit faster). UI ceiling < 300ms. Full taste layer lives in **motion**'s `feel-vocabulary.md`.

## Tailwind v4: name the property that moves
v3 compiled `translate-*`/`scale-*`/`rotate-*` into `transform`. **v4 emits them as standalone CSS properties and leaves `transform: none`.** A list naming only `transform` animates nothing — the element still moves, instantly, with no easing. Write `transition-[translate,scale,transform,…]`. Explicit lists are escape hatches, so no codemod fixed them at the v4 upgrade.

## Verify motion by tracing, never by reading
A class string gives you two endpoints. Only a trace tells you whether the browser moved between them. Drive real input, sample computed style every ~4ms, assert intermediate states exist — see `e2e/button-press-motion.spec.ts`. Screenshots, source scans and jsdom unit tests are all blind to this: a teleporting element and a correct one produce identical stills and identical classes. Assert **movement**, not milliseconds; timings belong in the token module.

## Lottie / Rive
- **Lottie**: `lottie-react` is available — for a pre-made file, render a minimal `<Lottie animationData={data} />`; see LottieFiles docs. Pointer only; don't build deep tooling.
- **Rive**: not installed — flag as an adoption decision, don't scaffold.

## Before edge cases
Check `references/learnings.md`; log new mistakes there.

## Related
motion (decision/feel) · gsap-scrolltrigger · gsap-timeline · gsap-react
