# DialKit

**Part of [Interface Craft](SKILL.md) by Josh Puckett**

Generate DialKit configurations — live control panels for tuning animation and style values, saved versions you can compare, and a scrubbable timeline for tuning choreography and reversible state changes. Written against DialKit **2.2.1**; upstream docs are `docs/reference.md` and `docs/timeline.md` in [joshpuckett/dialkit](https://github.com/joshpuckett/dialkit). Examples use React + Motion; panels and Timeline also run on Solid, Svelte 5, Vue 3 and plain JavaScript.

---

## When to use

- User mentions DialKit, dials, sliders, controls, tune, tweak
- User wants a live UI to adjust animation parameters
- User says "add controls for..." or "let me tune..."
- User wants to compare tuned variations ("versions") of the same surface
- User wants to tune clip timing, sequences, loops, or event-driven playback
- User wants a timed layer, visibility, interaction, or other discrete state change
- User asks for a timeline, playhead, or scrubbing

## Choose Panels or Timeline

Use `useDialKit` when the user wants to tune individual parameters:

- Spring physics or easing curves
- Scale, opacity, blur, color, spacing, or layout
- Toggles, selects, text, images, XY pads, or actions
- A single animation's transition values

Use `useDialTimeline` when the user wants to tune when animation happens:

- Clip start times and durations
- Coordinated entrances and exits
- Multi-step sequences or independently timed properties
- Loops or intro-then-loop behavior
- Scrubbing and playhead control
- Event-driven animations that need replaying
- Declarative timeline markers such as a `tuck`, layer switch, or visibility boundary

Use both when the task needs appearance controls and choreography. For any Timeline task, read and follow [dialkit-timeline.md](dialkit-timeline.md) before generating code.

## Mode Detection

### Direct Mode
Triggers when user describes what they want with context:
- "use DialKit to give me sliders for blur and opacity"
- "add dialkit controls for scale, rotation, and a spring"
- "I need toggles and sliders for my card animation"

In direct mode, generate the config immediately based on the request.

If the request mentions timeline, clips, markers, timed events, playhead, scrubbing, sequence timing, loops, or replayable animation, route to [dialkit-timeline.md](dialkit-timeline.md).

### Guided Mode
Triggers when user invokes without specific context or asks for help:
- `/interface-craft dialkit`
- "help me set up dialkit"
- "walk me through adding dialkit"

In guided mode, ask 2-3 concise questions then generate.

## Setup Check

1. Inspect project instructions, `package.json`, and the lockfile for `dialkit`. This guidance is written for 2.2.1; a project on an older 2.x or 1.x release lacks some of the controls and options below (versions gallery, `useDialKitController`, `persist`, color formats, image and pad controls), so check the installed `dist/index.d.ts` before using one.
2. Never add or upgrade dependencies silently. If the user authorizes an npm change, preserve the exact version:
```bash
npm install --save-exact dialkit@2.2.1 motion
```
Peer requirements: React 18+ and `motion` 11+ (Vue also needs `motion-v`; Solid needs `motion`; Svelte and vanilla need nothing else).

3. Check for the authoring surface required by the task:

- Parameter panels use `DialRoot`.
- Timelines use `DialTimeline`.
- A project using both should mount both once as siblings of the application content.

If either required surface is missing, remind the user:
```tsx
import { DialRoot, DialTimeline } from 'dialkit'
import 'dialkit/styles.css'

// Add the surfaces the project uses to the root layout:
<DialRoot position="top-right" />
<DialTimeline />
```

`DialRoot` and `DialTimeline` are independent. Do not require `DialRoot` for a timeline-only task. Import from the framework's entry: `dialkit`, `dialkit/solid`, `dialkit/svelte`, `dialkit/vue` or `dialkit/vanilla` (vanilla styles: `dialkit/vanilla/styles.css`; Svelte's `DialRoot` injects its own styles). In Next.js App Router, use DialKit in a client component.

Two things that bite in app projects:

- Mount **one** root and import `useDialKit` from the same module instance as `DialRoot`. A dynamically imported root from a second module copy has its own store and shows no panels.
- `dialkit/styles.css` pulls Geist Mono from `fonts.googleapis.com`. A strict `style-src` CSP blocks it, so allow that origin in development only.

## Guided Flow Questions

Keep it fast - 2-3 questions max:

1. **Component context**: "What component are you adding controls to? Share the code or describe what you're building."

2. **Property selection**: "What properties do you want to tweak? Common options:
   - **Visual**: blur, opacity, scale, borderRadius
   - **Position**: offsetX, offsetY, rotation
   - **Animation**: spring (with visualDuration/bounce controls)
   - **Interaction**: action buttons, toggles"

3. Generate with smart defaults - don't ask about ranges.

## Smart Defaults

Use these defaults for common properties (users can adjust in the panel):

| Property | Default | Min | Max | Step |
|----------|---------|-----|-----|------|
| blur | 0 | 0 | 100 | 1 |
| opacity | 1 | 0 | 1 | 0.01 |
| scale | 1 | 0.5 | 2 | 0.1 |
| rotation | 0 | -180 | 180 | 1 |
| offsetX | 0 | -100 | 100 | 1 |
| offsetY | 0 | -100 | 100 | 1 |
| borderRadius | 0 | 0 | 50 | 1 |
| shadowBlur | 16 | 0 | 48 | 1 |
| shadowOffsetY | 8 | 0 | 24 | 1 |
| gap | 16 | 0 | 48 | 1 |
| padding | 16 | 0 | 48 | 1 |

## Control Types

See [references/config-patterns.json](references/config-patterns.json) for the schema of the original control set. Keys become labels (camelCase becomes words); nested objects become folders and keep their paths in the returned values. Summary:

### 1. Slider (explicit range)
```tsx
blur: [24, 0, 100]       // [default, min, max]
radius: [24, 0, 64, 2]   // [default, min, max, step]
```
Without a step, DialKit uses 0.01 up to a range of 1, 0.1 up to 10, 1 up to 100, and 10 above. Values clamp to the range.

### 2. Slider (auto-inferred)
```tsx
scale: 1.18  // 0–1 → range 0–1; above 1 → 0 to value × 3; negative → value × 3 to −value × 3
```
Prefer an explicit tuple for anything the user will tune: an inferred range from the starting value is rarely the range they want.

### 3. Toggle
```tsx
visible: true
```

### 4. Spring (Time mode - simpler)
```tsx
spring: {
  type: 'spring',
  visualDuration: 0.3,
  bounce: 0.2,
}
```

### 5. Spring (Physics mode - more control)
```tsx
spring: {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1,
}
```

### 6. Easing (Bézier curve)
```tsx
ease: { type: 'easing', duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
```
Spring and easing definitions open the same editor with Easing, Time and Physics modes, and the user can switch between them. The returned type is `TransitionConfig` (a `SpringConfig` or an `EasingConfig`), so pass it to `transition` as is.

### 7. Action Button
```tsx
reset: { type: 'action' }
next: { type: 'action', label: 'Next Slide' }
```
Actions call `onAction` with their full dot path (`'shadow.reset'` inside a folder). They hold no value.

### 8. Select Dropdown
```tsx
theme: {
  type: 'select',
  options: ['light', 'dark', 'system'],   // or [{ value, label }]
  default: 'system',
}
```
The default is the first option when omitted.

### 9. Color Picker
```tsx
backgroundColor: { type: 'color', default: '#3b82f6' }
// or auto-detected from a color string:
accentColor: '#3b82f6'
highlight: 'oklch(0.7 0.2 145 / 0.8)'
```
Hex (3, 4, 6 or 8 digits), RGB, HSL, OKLCH and Display P3 strings are detected automatically. Use the explicit form for `transparent`, and for any string that must stay text. Named colors, CSS variables, relative colors and `calc()` are not parsed.

### 10. Text Input
```tsx
title: { type: 'text', default: 'Hello', placeholder: 'Enter title...' }
// or auto-detected from a plain string:
label: 'Click me'
```
A string that looks like a color becomes a color control; use the explicit `text` form to keep it text.

### 11. Image
```tsx
cover: {
  type: 'image',
  options: [
    { value: '/images/coast.jpg', label: 'Coast' },
    { value: '/images/mountains.jpg', label: 'Mountains' },
  ],
}
avatar: { type: 'image' }   // starts empty; uploads up to 10 MB stay in the browser
```
Returns a URL or data URL; removing the image returns `''`.

### 12. XY Pad
```tsx
position: { type: 'pad' }   // x and y default to [0, -1, 1, 0.01]
timing: {
  type: 'pad',
  x: [0.3, 0.1, 1, 0.01],   // [default, min, max, step?]
  y: [0.2, 0, 1, 0.01],
  labels: { x: 'Duration', y: 'Bounce' },
}
```
Returns `{ x, y }` whatever the labels say. X grows right, Y grows up.

### 13. Folder (nested grouping)
```tsx
shadow: {
  _collapsed: true,       // starts closed; metadata, not a returned value
  offsetY: [8, 0, 24],
  blur: [16, 0, 48],
  opacity: [0.2, 0, 1],
}
```

## Panel Options

```tsx
useDialKit(name, config, options)
```

| Option | Purpose |
|--------|---------|
| `id` | Stable panel ID; registrations with the same `id` share values across mounts |
| `persist` | `true` saves values, versions and the active version to `localStorage` as `dialkit:${id}`; the object form takes `key`, `storage: 'sessionStorage'` and `presets: false` |
| `defaultCollapsed` | `true` starts this panel closed, overriding the root's `defaultOpen` |
| `onAction` | Receives the dot path of a clicked action |
| `shortcuts` | Assign keys to sliders and toggles by control path |

Always pass a stable `id` with `persist`. Without one DialKit falls back to `dialkit:${name}` and warns, because generated IDs change with the component tree. Keep configs consistent across registrations of one `id`: the latest wins and a difference logs a warning. Change a config by passing a new object, not by mutating one.

### Shortcuts

```tsx
{
  shortcuts: {
    radius: { key: 'r', mode: 'fine' },
    'shadow.blur': { key: 'b', modifier: 'alt', interaction: 'drag' },
    visible: { key: 'v' },
  },
}
```

`interaction` is `'scroll'` (default), `'drag'`, `'move'` or `'scroll-only'` (needs no key); `mode` is `'fine'` (1% of range), `'normal'` (the step) or `'coarse'` (10%); `modifier` is `'alt'`, `'shift'` or `'meta'`. Shortcuts pause while a field or keyboard-operated control has focus. A duplicate key and modifier keeps the first registration and warns.

### Updating values from code

`useDialKitController` (React, Vue) or `createDialKitController` (Solid, Svelte, vanilla) returns a controller instead of bare values:

```tsx
const dial = useDialKitController('Card', {
  radius: [24, 0, 64],
  shadow: { blur: [12, 0, 40] },
})

dial.setValue('radius', 32)                          // dot path; clamps and snaps like the control
dial.setValues({ radius: 16, shadow: { blur: 8 } })  // nested partial, one update; fires no actions
dial.setValue('position', { x: 0.5, y: -0.25 })      // an XY pad is set as a pair
dial.resetValues()                                   // config defaults; clears the active version
dial.setOpen(false)
dial.getValues(); dial.getOpen(); dial.values
```

A value of the wrong type is ignored with a console warning. Programmatic edits go to the active version, or to the base values when V1 is selected. Use a controller for presets and "load this layout" buttons, not `useDialKit` plus extra state.

## Root Options

```tsx
<DialRoot position="top-right" theme="dark" />
<aside style={{ width: 300 }}><DialRoot mode="inline" /></aside>
```

| Prop | Default | Options |
|------|---------|---------|
| `position` | `'top-right'` | `'top-right'`, `'top-left'`, `'bottom-right'`, `'bottom-left'` |
| `theme` | `'system'` | `'system'`, `'light'`, `'dark'` |
| `mode` | `'popover'` | `'popover'`, `'inline'` (fills its container, ignores `position`) |
| `versions` | `'thumbnails'` | `'thumbnails'`, `'menu'` |
| `defaultOpen` | `true` | Initial state; a panel's `defaultCollapsed` wins |
| `onOpenChange` | — | Root open-state callback |
| `productionEnabled` | `false` | Framework roots render nothing in production builds unless `true`; this hides the editor, not the code that reads its values |

Several registered panels appear as sections of the one root.

## Versions

Every panel can hold saved versions. **Save version** captures the page as a thumbnail, selects the new version, and takes the edits made since you selected the current one; the current version keeps what it had. **V1** is the editable base. A thumbnail click switches, a double-click on its name renames it, hover deletes it, and the grid button zooms the page out to every version. **Copy** puts the values and an instruction for applying them to the config on the clipboard.

- Captures run in the browser and never leave it. WebGL canvases work; web fonts fall back to system fonts. Mark an element `data-dialkit-ignore` to leave it out of captures.
- `versions="menu"` on the root swaps thumbnails for the classic menu. Timelines always use the menu.
- Pasted or requested configs are versions: save each as a named version rather than replacing the last (see Pitfalls in [SKILL.md](SKILL.md)).
- For a custom preset UI, use `DialStore.savePreset`, `loadPreset`, `deletePreset`, `renamePreset`, `getPresets`, `getActivePresetId`, `clearActivePreset`, `hasEdits` and `keepEdits`. `DialStore.setPanelOpen(id, open)`, `togglePanelOpen` and `getPanelOpen` drive panel state by ID.

## Output Format

For Timeline work, follow the output and production-handoff rules in [dialkit-timeline.md](dialkit-timeline.md).

For regular panels, always generate complete, copy-paste ready code:

```tsx
import { useDialKit } from 'dialkit'
import { motion } from 'motion/react'

function ComponentName() {
  const params = useDialKit('ComponentName', {
    // Generated config here
  })

  return (
    <motion.div
      style={{
        // Apply params
      }}
      animate={{
        // Animate params
      }}
      transition={params.spring}
    />
  )
}
```

For a config declared outside the call, use `satisfies DialConfig` to keep the types: `ResolvedValues<typeof config>` gives the returned shape. Types (`DialConfig`, `TransitionConfig`, `DialKitController`, `PanelConfig`, `Preset`, `TimelineConfig`) come from the same entry as the adapter.

## Example Generations

### Request: "sliders for blur and opacity"
```tsx
const params = useDialKit('Effects', {
  blur: [0, 0, 100],
  opacity: [1, 0, 1],
})

// Usage:
style={{
  filter: `blur(${params.blur}px)`,
  opacity: params.opacity,
}}
```

### Request: "spring animation with scale"
```tsx
const params = useDialKit('Animation', {
  scale: [1, 0.5, 2],
  spring: {
    type: 'spring',
    visualDuration: 0.3,
    bounce: 0.2,
  },
})

// Usage:
animate={{ scale: params.scale }}
transition={params.spring}
```

### Request: "card with shadow controls"
```tsx
const params = useDialKit('Card', {
  borderRadius: [16, 0, 50],
  shadow: {
    offsetY: [8, 0, 24],
    blur: [16, 0, 48],
    opacity: [0.2, 0, 1],
  },
})

// Usage:
style={{
  borderRadius: params.borderRadius,
  boxShadow: `0 ${params.shadow.offsetY}px ${params.shadow.blur}px rgba(0,0,0,${params.shadow.opacity})`,
}}
```

### Request: "controls with actions"
```tsx
const params = useDialKit('Slideshow', {
  autoPlay: true,
  interval: [3, 1, 10],
  next: { type: 'action' },
  prev: { type: 'action' },
  reset: { type: 'action' },
}, {
  onAction: (path) => {
    if (path === 'next') goNext()
    if (path === 'prev') goPrev()
    if (path === 'reset') reset()
  },
})
```

### Request: "keep my tuning after a reload"
```tsx
const params = useDialKit('Hero', {
  radius: [24, 0, 64],
  spring: { type: 'spring', visualDuration: 0.4, bounce: 0.15 },
}, { id: 'hero', persist: true })
```

## Keyboard

Controls work without assigned shortcuts: Tab to a slider and use the arrow keys (Shift or Page Up/Down moves ten steps, Home/End the bounds), or press Enter to type a number. Menus open on Enter, Space or Up/Down and close on Escape. Bézier handles move 0.01 per arrow key, 0.1 with Shift. The full map is in upstream `docs/reference.md`, "Keyboard".

## Tips for Generation

1. **Infer panel name** from component name or context
2. **Group related controls** in nested objects (folders)
3. **Use Time mode springs** by default (simpler for most users)
4. **Include usage comments** showing how to apply each param
5. **Match user's coding style** if they shared code
6. **Route timing work to Timeline** instead of recreating a timeline with ordinary sliders
7. **Model reversible timed events as markers** and derive UI state from `started`, `active`, or `progress`; do not replace them with timers
8. **Give every panel you want to keep a stable `id`**, and add `persist` only for tuning that should survive a reload
