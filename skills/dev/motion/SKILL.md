---
name: motion
description: Decide HOW to animate in the Thoven frontend. Use BEFORE writing or changing animation code, or when a request is a *feel* ("make this snappy/elegant/playful", "should this scroll-reveal?", "animate the XP bar"). Picks the layer (CSS / Tailwind keyframe / Framer Motion / GSAP / Lottie / gated Lenis), the right lib/motion-config.ts preset, and timing — and explains why — then routes implementation to motion-react or the gsap-* skills. This is a motion decision tree + feel vocabulary, NOT general skill routing (that is orchestrate).
license: MIT
---

# Motion — decide how to animate

Turn a desired *feel* (or a vague "add some animation here") into a concrete decision: **which layer → which preset → what timing → one-line why.** Then hand off implementation. The "why" is the point — it teaches the requester the reasoning.

## When to use
- Before adding/changing any animation and you're unsure which tool fits.
- When the ask is a feel ("punchy", "elegant", "playful", "calm") that must become code-ready params.
- When deciding CSS vs Framer vs GSAP vs a Lottie file.

This skill **decides and routes**; it does not implement. Hand off to:
- **motion-react** — React UI motion (Framer Motion + CSS). The default for component animation.
- **gsap-scrolltrigger / gsap-timeline / gsap-react** — scroll-*scrubbed*/pinned and complex multi-element timelines.

(For "which skill handles X" across the whole repo, that's `orchestrate`. This is motion-specific judgment.)

## Step 1 — Two gates before any animation
The cheapest decision is often "don't."
1. **Frequency gate.** Fires 100+/day → no animation (≤100ms opacity at most). 10+/day → minimal. Occasional → standard. Rare/first-time → can delight.
2. **Purpose gate.** Every animation needs a why: spatial continuity, state change, feedback, or explanation. "Looks cool" alone fails — skip it.

## Step 2 — Pick the layer
| If the need is… | Use | Why |
|---|---|---|
| Simple state / hover / color | CSS transition, or `cardHover`/`subtleHover` (motion-react) | cheapest; GPU `transform`/`opacity` |
| Ambient loop (float, pulse, spinner) | CSS keyframe — `.animate-float` / `.animate-pulse-glow` / `.animate-fade-in` (`globals.css`) | no JS lib for a loop |
| React enter/exit, layout, gesture, drag, microinteraction | **motion-react** (Framer) | interruptible, component-aware |
| One-shot reveal as it enters view | **motion-react** (`whileInView`) | matches Thoven's existing IntersectionObserver reveals — **NOT GSAP** |
| Scroll-*scrubbed*, pinned, or parallax | **gsap-scrolltrigger** | scroll-linked progress is ScrollTrigger's job |
| Multi-element hero choreography / timeline | **gsap-timeline** (+ gsap-react) | sequenced control (see `HomepageConductorMotion.tsx`) |
| Pre-made designer animation file | **Lottie** — `lottie-react` (installed; pointer only) | vector playback |
| Interactive character / state-machine art | **Rive — FLAG**: not installed, evaluate before adopting | runtime not adopted |
| Page-wide smooth-scroll *feel* | **Lenis / Locomotive — GATED** | high regression risk (anchor pills, embeds, sticky nav, Safari/iOS). Per the 2026-05-11 motion audit, prove value first. **Default: don't.** |

Full triage, escalation logic, and worked examples: `references/decision-tree.md`.

## Step 3 — Pick the feel → preset + timing
Map the plain-English feel to a `lib/motion-config.ts` preset. **Never invent spring values** — that's motion-react's Rule #1.
| Feel | Preset / approach | When |
|---|---|---|
| snappy / punchy / responsive | `springs.snappy` (~250ms) | buttons, hero, interactive feedback |
| elegant / premium | `springs.smooth` (~400ms), `ease`, **no bounce** | reveals, text blocks |
| weighty / cinematic | `springs.gentle` (~600ms) | large images, illustrations |
| playful / celebratory | `springs.bounce` (~500ms) — **sparingly** | celebrations, icon reactions |
| calm / reassuring | opacity fade over movement | trust-forward surfaces |
| hover lift | `cardHover` / `subtleHover` | cards, links |
| inert (reduced-motion / high-freq) | none / opacity only | — |

Full vocabulary (gates, three-lens taxonomy, emotion archetypes, easing matrix, timing table, anti-slop checklist): `references/feel-vocabulary.md`.

## Always
- **Reduced motion:** every recommendation respects `prefers-reduced-motion`. In Thoven, wrap Framer transitions in `getTransition(springs.x)` from `lib/motion-config.ts`; for GSAP use `gsap.matchMedia()` (gold-standard example: `components/landing/HomepageConductorMotion.tsx`). Drop movement, keep opacity/color.
- **Reach for presets**, not hand-rolled springs.
- **When no preset fits, that is not permission to invent one.** Go to `design-system/STACK.md`
  → **REFERENCE** (transitions.dev for the whole transition, svg.guide for SVG technique,
  melt-effect while the motion is still open), dial it on the real component in `dialkit`, and land
  it as a token module with a test. Then it is a preset and the next person reaches for it.

## Output shape
Answer as: **layer → preset/params → ~duration → one-line why.**

## Before deciding edge cases
Check `references/learnings.md` for corrections logged from past mis-routes, and add new ones when you get it wrong.

## Related
motion-react · gsap-core · gsap-scrolltrigger · gsap-timeline · gsap-react · orchestrate
