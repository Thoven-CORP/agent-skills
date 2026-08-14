# DialKit timelines

For choreography one `useDialKit` config can't express: several elements entering in sequence,
a scrubbable playhead, looping property tracks.

Same loop as the panel — **dial it, land it, strip it.** The timeline is a tuning surface, not
a runtime.

## Mount

```tsx
import { useDialTimeline, DialTimeline } from 'dialkit/timeline'
```

`<DialTimeline />` is a separate dock from `<DialRoot />`, behind the same
`process.env.NODE_ENV === 'development'` guard. Props: `theme`, `defaultVisible`, `visible`,
`onVisibilityChange`, `defaultOpen`.

```tsx
const tl = useDialTimeline(name, config, options?)
```

Options: `id`, `persist`, `autoplay` (default `true`), `loop` (`boolean | { from: number }`).

## Clips

```tsx
card: {
  at: 0.45,                                   // start time, seconds
  duration: 0.7,
  from: { y: 44, scale: 0.95, opacity: 0 },
  to:   { y: 0,  scale: 1,    opacity: 1 },
  transition: { type: 'spring', bounce: 0.25 },
}
```

Each clip exposes `at` · `duration` · `started` · `active` · `done` · `progress` (0–1) ·
`current` (interpolated at the playhead) · `animate` · `transition` · `css`.

Transport: `tl.time` · `tl.playing` · `tl.duration` · `play()` · `pause()` · `replay()` ·
`seek(1.2)`.

## Sequences

Several `to`s off one `from`:

```tsx
path: {
  at: 0,
  from: { x: -70, y: 0 },
  transition: { type: 'easing', duration: 0.8, ease: [0.65, 0, 0.35, 1] },
  steps: [
    { duration: 0.8, to: { x: 0,  y: 36 } },
    { duration: 0.8, to: { x: 70, y: 0  } },
    { duration: 0.8, to: { x: -70 } },
  ],
}
```

## Property tracks

Per-property timing inside one clip — each property gets its own steps, transition, and
`delay`. This is how `scale` lags behind `y` without splitting the clip:

```tsx
float: {
  at: 0,
  loop: true,
  props: {
    y:     { from: -9,   transition: { type: 'easing', duration: 0.6, ease: [0.45, 0, 0.55, 1] },
             steps: [{ duration: 0.6, to: 9 }, { duration: 0.6, to: -9 }] },
    scale: { from: 0.94, delay: 0.12,
             transition: { type: 'easing', duration: 0.6, ease: [0.8, 0, 0.2, 1] },
             steps: [{ duration: 0.6, to: 1.06 }, { duration: 0.6, to: 0.94 }] },
  },
}
```

## Landing a timeline

Three moves, in order.

**1 · Tune against `current`,** so the playhead drives the element directly:

```tsx
<div style={{
  opacity: tl.card.current.opacity,
  transform: `translateY(${tl.card.current.y}px)`,
}} />
```

**2 · Copy** from the dock toolbar. The export is normalised — defaults and editor-only fields
are dropped, and a `TODO(production)` breadcrumb marks each site to replace.

**3 · Swap the sampled binding for a real animation,** then replace `tl.card.*` with the landed
token values:

```tsx
<motion.div animate={tl.card.animate} transition={tl.card.transition} />
```

A `current` binding samples a dev-only playhead, so it reads as `undefined` in production —
which is why the strip check in the parent skill greps for `.current.`.

Whatever lands runs through `getTransition()` from `lib/motion-config.ts`. A timeline is more
motion than usual, so it earns the reduced-motion fallback twice over.

## When this is the wrong tool

Scroll-*scrubbed* or pinned sequences are driven by scroll position rather than time — that is
`gsap-scrolltrigger`'s job. See the layer table in the `motion` skill.
