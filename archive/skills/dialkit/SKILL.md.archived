---
name: dialkit
description: Dial a value live in the running app instead of guessing it, then land it as a locked token. Use when the number has to be felt — shadow depth, blur, radius, stagger, spring, easing — or when no `lib/motion-config.ts` preset fits. Colour, type ramp and spacing live as CSS variables in `globals.css`; those route to `better-colors` and `better-typography`.
license: MIT
---

# DialKit — dial it, then land it

A dev-only panel of knobs bound to real values in the running app. Drag until it looks right,
hit **Copy**, and the values land in source as a token.

**The landing is the work.** A value left in a dial is a value nothing can enforce.

## Which values dial

| The value is… | Where it goes |
|---|---|
| **Felt** — shadow depth, blur, radius, stagger, spring, easing | here |
| A CSS variable — colour, type ramp, spacing | `better-colors` · `better-typography`. DialKit reads and writes JS values only |
| Already locked in `lib/*-tokens.ts` or `docs/design-system.html` | it stays. Moving a lock needs sign-off |

Dial the **real component in the running app**. Values dialled in a standalone HTML file on a
CDN get copied into the build as numbers instead of as the system — that gap is why the
LessonSpace implementation diverged from its own locked spec.

If `dialkit` is absent from `package.json`, install it first:
[`references/setup.md`](references/setup.md).

## The loop

```
useDialKit() on the real component
        ↓  drag until it feels right
   Copy  →  JSON on the clipboard
        ↓
   token module + unit test          ← the lock
        ↓
   strip the dial
```

```tsx
const p = useDialKit('ThovenButton rest', {
  shadow: { blur: [4, 0, 24], y: [2, 0, 12], opacity: [0.25, 0, 1], _collapsed: true },
  press:  { type: 'spring', stiffness: 500, damping: 35, mass: 0.6 },
})
```

Bind the values straight into the component while tuning — inline styles, or
`transition={p.press}`. The thing on screen *is* the component.

### Control types

| Write this | You get |
|---|---|
| `[default, min, max, step?]` | slider — `blur: [24, 0, 100]` |
| `1.2` | auto-slider |
| `true` | toggle |
| `'#ff5500'` | colour picker |
| `'Hello'` | text |
| `{ type: 'select', options: ['stack','fan'], default: 'stack' }` | dropdown |
| `{ type: 'spring', stiffness: 200, damping: 25, mass: 1 }` | spring editor |
| `{ type: 'easing', duration: 0.3, ease: [0.4, 0, 0.2, 1] }` | cubic-bezier editor |
| `{ type: 'action' }` | button → fires `options.onAction(path)` |
| `{ nested: {…}, _collapsed: true }` | folder |

Options: `id` (stable across remounts), `persist` (`true` → `localStorage` under
`dialkit:${id}`, or `{ key, storage, presets }`), `onAction`, `shortcuts`.

Shortcuts bind a key to a control — `{ key: 'b', mode: 'fine' }`, where `fine` is step ÷ 10 and
`coarse` is step × 10. Reach for them when separating two nearly-identical values.

Presets: **+** in the toolbar snapshots the current state. One preset per candidate when
choosing between options; one set of dials when converging on one.

`useDialKitController(name, config, options?)` returns the same values plus `setValue`,
`setValues`, `resetValues`, `getValues` — for when something outside the panel drives the dials.

## Landing

DialKit's own docs stop at "paste the values into source." Here they go one step further,
because **a lock is only real if a test enforces it.**

The shapes already line up — a DialKit spring is a Thoven spring, a DialKit easing is an
entry-morph token:

```
{ type: 'spring', stiffness, damping, mass }   →  springs.* in lib/motion-config.ts
{ type: 'easing', duration, ease: [...] }      →  lib/entry-morph-tokens.ts  (seconds → ms)
```

Where the Copy output lands:

- **A reusable feel** → a preset in `lib/motion-config.ts` beside `snappy` / `smooth` /
  `gentle` / `bounce`. Earn it with a second use — a fifth preset serving one component is a
  token, not a preset.
- **One component's locked params** → its own token module, shaped like
  `lib/entry-morph-tokens.ts`: the values, a comment naming them LOCKED, and a unit test
  importing that same module so component and test can never drift.

Whatever lands still runs through `getTransition()` from `lib/motion-config.ts`, so
reduced-motion users get an instant cut.

## Strip the dials before merge

The Copy output carries a `TODO(production)` breadcrumb marking every site. Clear them, then
confirm the repo is clean:

```bash
grep -rn "useDialKit\|useDialTimeline\|DialRoot\|DialTimeline\|\.current\." app components lib
```

**Done when that returns nothing** (bar unrelated `.current.` ref reads). A dial that survives
merge is an unlocked value — the panel hiding itself in production is a different thing from
the dial being gone.

## Timelines

Multi-step choreography — a clip per element, a scrubbable playhead, sequences, looping
property tracks — is a heavier branch: [`references/timeline.md`](references/timeline.md).
Reach for it when one `useDialKit` config can't express the sequencing.

## Related

`motion` decides whether and how to animate, and routes here when no preset fits ·
`motion-react` implements · `thoven-designer` for single-component work
