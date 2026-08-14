# Thoven Component Patterns

Standard design patterns for the Thoven music education platform.

## Contents
- 3D Button Pattern (primary, color variants, secondary)
- Floating Panel Animation
- Card Patterns (feature, lesson, empty state)
- Modal Pattern
- Form Patterns (fields, errors, checkboxes)
- Loading States (button, skeleton)
- Responsive Patterns
- Error State Patterns (general, info, form validation)
- Accessibility Patterns
- Third-Party Integration Pill (Google Calendar, Zoom, Stripe, etc.)
- Design Anti-Patterns (battle-tested from real sessions)

---

## 3D Button Pattern

The signature Thoven button style with depth and press animation.

### Primary Button (Thoven Orange)

```tsx
<button
  className="bg-amber-500 hover:bg-amber-600 text-white font-sans font-semibold
    rounded-xl px-6 py-2.5
    shadow-[0_4px_0_0_rgb(217,119,6)]
    hover:shadow-[0_2px_0_0_rgb(217,119,6)]
    active:shadow-[0_1px_0_0_rgb(217,119,6)]
    active:translate-y-1 transition-all duration-200
    focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
>
  Book Lesson
</button>
```

### Key Rules

| Rule | Description |
|------|-------------|
| Geometry | `rounded-xl` · `px-6 py-2.5` |
| Font | `font-sans font-semibold` (Montserrat) |
| Border | **NONE** - No borders on solid 3D buttons |
| Shadow depth | 4px default → 2px hover → 1px active, always `rgb()` |
| Translation | `translate-y-1` on active state |
| Transition | `transition-all duration-200` |

### Color Variants (Filled Secondary)

Any tertiary hue, one step lighter than primary: `bg-[hue]-400` / `hover:bg-[hue]-500`, ledge `[hue]-600`, `text-white`.

```tsx
// Emerald
className="bg-emerald-400 hover:bg-emerald-500 text-white font-sans font-semibold
  rounded-xl px-6 py-2.5
  shadow-[0_4px_0_0_rgb(5,150,105)]
  hover:shadow-[0_2px_0_0_rgb(5,150,105)]
  active:shadow-[0_1px_0_0_rgb(5,150,105)]
  active:translate-y-1 transition-all duration-200"

// Sky
className="bg-sky-400 hover:bg-sky-500 text-white font-sans font-semibold
  rounded-xl px-6 py-2.5
  shadow-[0_4px_0_0_rgb(2,132,199)]
  hover:shadow-[0_2px_0_0_rgb(2,132,199)]
  active:shadow-[0_1px_0_0_rgb(2,132,199)]
  active:translate-y-1 transition-all duration-200"

// Rose
className="bg-rose-400 hover:bg-rose-500 text-white font-sans font-semibold
  rounded-xl px-6 py-2.5
  shadow-[0_4px_0_0_rgb(225,29,72)]
  hover:shadow-[0_2px_0_0_rgb(225,29,72)]
  active:shadow-[0_1px_0_0_rgb(225,29,72)]
  active:translate-y-1 transition-all duration-200"
```

### Secondary Button (Outline)

```tsx
<button
  className="bg-white border-2 border-amber-300 text-amber-700 font-sans font-semibold
    rounded-xl px-6 py-2.5
    shadow-[0_4px_0_0_rgb(251,191,36)]
    hover:bg-amber-50 hover:shadow-[0_2px_0_0_rgb(251,191,36)]
    active:shadow-[0_1px_0_0_rgb(251,191,36)] active:translate-y-1
    transition-all duration-200
    focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
>
  Learn More
</button>
```

---

## Thoven 3D Button — White Outline Variant

A calmer 3D button for "calm grid of options" surfaces — square cards in a 2x2 or 4-up grid where every choice has equal weight. Solid amber on 4 equal cards reads as too heavy and the grid loses hierarchy because every tile shouts. This variant stays neutral at rest, hints at clickability with a grey 3D shadow, and only commits to amber on the click itself.

### When To Use

- 4 equal-weight choices in a grid (e.g., SubmissionPanel format picker: Record Video / Record Audio / Photo or File / Type a Message)
- Secondary affordances where multiple options share the screen and none should outshine the others
- Square-tile pickers where icon + label live inside the card and the card *is* the button
- Surfaces where the primary CTA already lives elsewhere — this variant must never compete with an amber 3D button on the same screen

### When NOT To Use

- Primary CTAs (Book Lesson, Submit, Continue) → use the solid amber 3D button
- Single hero buttons → use solid amber, the calm grey reads as disabled when alone
- Anywhere the amber 3D button is already on screen as the call to action — adding white outline tiles steals visual weight from the brand action
- Destructive actions (Delete, Cancel, Remove) → use semantic color variants

### Default / Hover / Active / Focus / Disabled

```tsx
// DEFAULT — calm white tile, soft grey outline, standard 3D ledge.
// Commits to the selected hue on :active — amber shown; any tertiary hue works.
className="bg-white border-2 border-gray-300 text-gray-700 font-sans font-semibold
  rounded-xl
  shadow-[0_4px_0_0_rgb(156,163,175)]
  hover:bg-gray-50
  hover:shadow-[0_2px_0_0_rgb(156,163,175)]
  hover:translate-y-0.5
  active:bg-amber-500 active:text-white active:border-amber-500
  active:shadow-[0_1px_0_0_rgb(217,119,6)]
  active:translate-y-1
  focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none
  disabled:opacity-60 disabled:cursor-not-allowed
  disabled:hover:bg-white disabled:hover:shadow-[0_4px_0_0_rgb(156,163,175)] disabled:hover:translate-y-0
  transition-all duration-200"
```

### State-by-State Breakdown

| State | Background | Border | Text | Shadow | Translate |
|-------|-----------|--------|------|--------|-----------|
| Default | `bg-white` | `border-2 border-gray-300` | `text-gray-700` | `shadow-[0_4px_0_0_rgb(156,163,175)]` | none |
| Hover | `bg-gray-50` | `border-gray-300` | `text-gray-700` | `shadow-[0_2px_0_0_rgb(156,163,175)]` | `translate-y-0.5` |
| Active (pressed / selected) | `bg-amber-500`* | `border-amber-500`* | `text-white` | `shadow-[0_1px_0_0_rgb(217,119,6)]`* | `translate-y-1` |

\* or any tertiary hue — the picker commits to the selected hue's `-500` body + `-700` ledge on `:active`.
| Focus-visible | (default bg) | (default border) | (default text) | (default shadow) | none + amber ring |
| Disabled | `bg-white` | `border-gray-300` | `text-gray-700` | (default shadow) | none, `opacity-60` |

### Key Rules

| Rule | Description |
|------|-------------|
| Shape | Square — preserves `aspect-square` when used as grid tile |
| Font | `font-sans font-semibold` (Montserrat) — the standard button weight |
| Border | `border-2 border-gray-300` — solid grey at rest, commits to the selected hue on `:active` |
| Shadow depth | 4px default → 2px hover → 1px active (the standard ledge) |
| Shadow color | Grey at rest (`rgb(156,163,175)`); the selected tertiary hue's `-700` on active (e.g. amber `rgb(217,119,6)`) |
| Active = brief feedback | The amber "click" state is a momentary press indicator, NOT a persistent selected state. For persistent selection use a separate `aria-pressed` / `data-selected` style (e.g., solid amber 3D button) |
| Touch target | Minimum 44x44px (kid target rule) — works naturally because cards are square and grid sizing already exceeds 44px in production layouts |

### Reference Component

```tsx
import { ReactNode } from 'react'

interface WhiteOutlineButtonProps {
  onClick: () => void
  'aria-label': string
  children: ReactNode
  disabled?: boolean
  className?: string
}

/**
 * Thoven 3D Button — White Outline Variant
 *
 * Square tile button for calm grids of equal-weight options.
 * Stays neutral at rest, escalates to amber on press.
 *
 * Use when 4+ choices share the same screen with equal weight.
 * For primary CTAs use the solid amber 3D button instead.
 */
export function WhiteOutlineButton({
  onClick,
  'aria-label': ariaLabel,
  children,
  disabled = false,
  className = '',
}: WhiteOutlineButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`aspect-square min-h-[44px] min-w-[44px]
        flex flex-col items-center justify-center gap-2 p-4
        bg-white border-2 border-gray-300 text-gray-700 font-sans font-semibold
        rounded-xl
        shadow-[0_4px_0_0_rgb(156,163,175)]
        hover:bg-gray-50
        hover:shadow-[0_2px_0_0_rgb(156,163,175)]
        hover:translate-y-0.5
        active:bg-amber-500 active:text-white active:border-amber-500
        active:shadow-[0_1px_0_0_rgb(217,119,6)]
        active:translate-y-1
        focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none
        disabled:opacity-60 disabled:cursor-not-allowed
        disabled:hover:bg-white disabled:hover:shadow-[0_4px_0_0_rgb(156,163,175)] disabled:hover:translate-y-0
        transition-all duration-200
        ${className}`}
    >
      {children}
    </button>
  )
}

// Usage — caller supplies icon + label as children
// <WhiteOutlineButton onClick={onPickVideo} aria-label="Record video submission">
//   <VideoIcon className="w-8 h-8" />
//   <span className="text-sm">Record Video</span>
// </WhiteOutlineButton>
```

### Accessibility (WCAG 2.1 AA)

| Concern | Status | Notes |
|---------|--------|-------|
| Visible boundary contrast (WCAG 1.4.11, 3:1) | **Borderline** | `border-gray-300` (#d1d5db) on `bg-white` is ~1.6:1 alone. The 3D shadow `rgb(156,163,175)` (gray-400) provides ~2.85:1 — together the perceived edge clears 3:1, but if a screen needs strict single-token compliance, upgrade the border to `border-gray-400` (~2.85:1) with the same shadow. Production callers requiring zero-doubt WCAG should use `border-gray-400`. |
| Text contrast (WCAG 1.4.3, 4.5:1) | Pass | `text-gray-700` (#374151) on `bg-white` = 10.3:1; on `bg-gray-50` (#f9fafb) = 9.9:1 |
| Active-state contrast | **FAIL (corrected 2026-07-10)** | `text-white` on `bg-amber-500` (#f59e0b) computes to **2.15:1** — fails AA (4.5:1 text, 3:1 UI). The 4.86:1 previously stated here was wrong (it is gray-500-on-white's ratio) and was propagated into feature a11y matrices before the Class Materials critique caught it. Affects every solid-amber 3D CTA app-wide; system-wide re-evaluation (e.g. `text-gray-900` on amber ≈ 8.1:1) tracked as workspace tech debt. New surfaces should prefer the Secondary Outline pattern (`text-amber-700` on white ≈ 5.02:1) where AA is required |
| Focus indicator (WCAG 2.4.7) | Pass | Amber ring at 2px + 2px offset is fully visible against grey + white |
| Touch target (WCAG 2.5.5) | Pass | Reference component enforces `min-h-[44px] min-w-[44px]`; `aspect-square` keeps it square |
| Keyboard activation | Pass | Native `<button>` — Enter and Space both trigger `onClick`. Active styling fires on `:active` which keyboard activation honors |
| Reduced motion | OK | Translate is small (4-6px max). Wrap in `motion-safe:` if used in dense grids and motion-sensitivity reports come in |

**Recommendation:** ship default `border-gray-300` for kid-friendly soft edges, and override to `border-gray-400` on any surface that fails an a11y audit (the 3D shadow already pushes perceived edge above 3:1 in our internal QA, but the 1.4.11 measurement tools score the border in isolation).

### Amber 3D vs White Outline 3D — When Each Fits

| Situation | Use | Why |
|-----------|-----|-----|
| Single primary CTA on screen (Book, Submit, Continue) | Amber 3D | Brand action deserves brand color |
| 1-2 buttons total, one is primary | Amber 3D + neutral text link | Hierarchy is already clear |
| 4-up grid of equal options (format pickers, mode selectors) | White Outline 3D | Calm grid, no false hierarchy |
| Grid of 2 options where one is "primary" | Amber 3D + Secondary Outline | Use existing secondary outline pattern, not white outline |
| Empty state with one suggested action | Amber 3D | Single action, owns the moment |
| Modal footer with Cancel + Confirm | Text link Cancel + Amber 3D Confirm | Standard modal hierarchy |
| Per-tile picker where each tile is its own action card | White Outline 3D | This is exactly what the variant is for |
| Persistent selected state (toggled chip, active filter) | Solid amber 3D (`bg-amber-500` resting) | Selection ≠ press; use the resting amber pattern, not this variant's `:active` |

---

## Label Pill (outline)

Small status/identity affordance for short labels — "NEW", category tags, badge-style metadata. The outline treatment keeps the pill visible without competing with the amber 3D primary CTA on the same surface, and inherits the same amber-400 border + amber-600 text family used by the marketplace card's "View Full Profile" secondary button — so the brand voice is consistent across pill and button surfaces.

### Standard Pattern

```tsx
<span className="inline-flex items-center border-2 border-amber-400 text-amber-600 bg-white font-sans font-semibold rounded-xl px-3 py-1 text-xs uppercase tracking-wide">
  NEW
</span>
```

### Key Rules

| Rule | Description |
|------|-------------|
| Shape | `rounded-xl` (button-shaped) |
| Border | `border-2 border-amber-400` — same border family as Secondary Button (Outline) |
| Text | `text-amber-600` + `font-sans font-semibold` |
| Background | `bg-white` (never `bg-amber-100` — that's the legacy filled badge style) |
| Size | `text-xs uppercase tracking-wide`, `px-3 py-1` |
| Use for | Short status/identity labels — "NEW", "BETA", category tag names |
| Do NOT use for | Primary CTAs (use 3D button), filled badges (use filter chip), persistent selection state (use solid amber 3D button) |

### Reference Instances

- `components/marketplace/TeacherListCard.tsx` (~line 248) — canonical outline pattern (View Full Profile secondary button — same amber-400/amber-600 family rendered as a button)
- `components/announcements/AnnouncementScreen.tsx` — Phase 4.7 Gate A pill below the headline of the Teach Mode launch modal

### Filter Chip vs Label Pill — When Each Fits

| Situation | Use | Why |
|-----------|-----|-----|
| Short status/identity label ("NEW", "BETA") | Label Pill (outline) | Visible without competing with the amber 3D primary CTA |
| Selectable category filter ("Piano", "Guitar") | Filter Chip (`bg-amber-100 text-amber-800` filled) | Filled state signals selectability; toggled chips need a heavier resting weight |
| Persistent active state (toggled on) | Solid amber 3D button | Selection ≠ press; resting amber pattern, not the outline |

---

## Floating Panel Animation

Spring-physics animation for modals and floating panels.

### Animation Parameters

```typescript
const springConfig = {
  type: "spring",
  stiffness: 500,
  damping: 35,
  mass: 0.6
}
```

### Complete Implementation

```tsx
import { motion, AnimatePresence } from 'framer-motion'

function FloatingPanel({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
            mass: 0.6
          }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
            bg-white rounded-xl shadow-xl border border-gray-200 p-6"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Key Rules

| Rule | Description |
|------|-------------|
| Backdrop | **NO dark backdrop overlay** |
| Spring type | `type: "spring"` |
| Stiffness | `500` |
| Damping | `35` |
| Mass | `0.6` |

---

## Card Patterns

### Feature Card

```tsx
<div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg
  border border-gray-200 transition-shadow duration-200">
  <div className="flex items-center gap-3 mb-4">
    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
      <Icon className="w-5 h-5 text-amber-600" />
    </div>
    <h3 className="font-display font-bold text-lg text-gray-800">
      Card Title
    </h3>
  </div>
  <p className="font-sans text-gray-600">
    Card description text goes here.
  </p>
</div>
```

### Lesson Card

```tsx
<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
  {/* Date badge */}
  <div className="bg-amber-50 px-4 py-2 border-b border-amber-100">
    <span className="font-sans font-semibold text-amber-600">
      Monday, Jan 15
    </span>
  </div>

  {/* Content */}
  <div className="p-4">
    <h4 className="font-display font-semibold text-gray-800">
      Piano Lesson
    </h4>
    <p className="font-sans text-sm text-gray-600 mt-1">
      3:00 PM - 4:00 PM
    </p>
    <p className="font-sans text-sm text-gray-500 mt-2">
      with Sarah Johnson
    </p>
  </div>
</div>
```

### Empty State Card

```tsx
<div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4
    flex items-center justify-center">
    <Icon className="w-8 h-8 text-gray-400" />
  </div>
  <h3 className="font-display font-semibold text-gray-700 mb-2">
    No Items Yet
  </h3>
  <p className="font-sans text-gray-500 mb-4">
    Get started by adding your first item.
  </p>
  <button className="bg-amber-500 hover:bg-amber-600 text-white font-sans font-semibold
    rounded-xl px-6 py-2.5
    shadow-[0_4px_0_0_rgb(217,119,6)]
    hover:shadow-[0_2px_0_0_rgb(217,119,6)]
    active:shadow-[0_1px_0_0_rgb(217,119,6)]
    active:translate-y-1 transition-all duration-200">
    Add Item
  </button>
</div>
```

---

## Modal Pattern

### Basic Modal Structure

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function ExampleModal({ open, onOpenChange, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl">
            Modal Title
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Modal body - use font-sans for all content */}
          <p className="font-sans text-gray-600">
            Modal content goes here.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="font-sans font-medium text-gray-600 px-4 py-2
              hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            className="bg-amber-500 hover:bg-amber-600 text-white font-sans font-semibold
              rounded-xl px-6 py-2.5
              shadow-[0_4px_0_0_rgb(217,119,6)]
              hover:shadow-[0_2px_0_0_rgb(217,119,6)]
              active:shadow-[0_1px_0_0_rgb(217,119,6)]
              active:translate-y-1 transition-all duration-200"
          >
            Confirm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Form Patterns

### Form Field with Label

```tsx
<div className="space-y-1.5">
  <label
    htmlFor="email"
    className="font-sans font-medium text-sm text-gray-700"
  >
    Email Address
  </label>
  <input
    id="email"
    type="email"
    className="font-sans w-full px-3 py-2
      border border-gray-200 rounded-lg
      focus:ring-2 focus:ring-amber-300 focus:border-amber-300 focus:outline-none
      placeholder:text-gray-400"
    placeholder="you@example.com"
  />
  <p className="font-sans text-xs text-gray-500">
    We'll never share your email.
  </p>
</div>
```

### Form Field with Error

```tsx
<div className="space-y-1.5">
  <label
    htmlFor="password"
    className="font-sans font-medium text-sm text-gray-700"
  >
    Password
  </label>
  <input
    id="password"
    type="password"
    className="font-sans w-full px-3 py-2
      border border-red-300 rounded-lg
      focus:ring-2 focus:ring-red-300 focus:border-red-300 focus:outline-none
      bg-red-50"
  />
  <p className="font-sans text-xs text-red-500">
    Password must be at least 8 characters.
  </p>
</div>
```

### Checkbox Group

```tsx
<fieldset className="space-y-3">
  <legend className="font-sans font-medium text-sm text-gray-700 mb-2">
    Select Instruments
  </legend>

  {instruments.map(instrument => (
    <label
      key={instrument.id}
      className="flex items-center gap-3 cursor-pointer"
    >
      <input
        type="checkbox"
        className="w-4 h-4 rounded border-gray-300
          text-amber-500 focus:ring-amber-300"
      />
      <span className="font-sans text-gray-700">
        {instrument.name}
      </span>
    </label>
  ))}
</fieldset>
```

---

## Loading States

### Button Loading

```tsx
<button
  disabled
  className="bg-amber-500 text-white font-sans font-semibold
    rounded-xl px-6 py-2.5 opacity-75 cursor-not-allowed
    shadow-[0_4px_0_0_rgb(217,119,6)]"
>
  <span className="flex items-center gap-2">
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    Loading...
  </span>
</button>
```

### Skeleton Card

```tsx
<div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
  <div className="h-3 bg-gray-200 rounded w-2/3" />
</div>
```

---

## Responsive Patterns

### Grid Layout

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} />
  ))}
</div>
```

### Stack to Row

```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <div className="flex-1">Content 1</div>
  <div className="flex-1">Content 2</div>
</div>
```

---

## Error State Patterns

User-friendly error handling. See [error-messaging.md](error-messaging.md) for complete guidelines.

### General Error Container

```tsx
<div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center">
  <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
    <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </div>
  <h3 className="text-lg font-bold text-gray-900 mb-2 font-display">
    Something went wrong
  </h3>
  <p className="text-gray-600 mb-4 font-sans">Please try again in a second.</p>
  <button className="...thoven-3d-button...">Try Again</button>
  <p className="mt-4 text-sm text-gray-500 font-sans">Still not working? Try refreshing.</p>
</div>
```

### Info Notice (Non-Blocking)

```tsx
<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
  <div className="flex items-center">
    <div className="bg-blue-100 p-2 rounded-xl">
      <InfoIcon className="w-5 h-5 text-blue-600" />
    </div>
    <p className="ml-3 text-sm text-blue-800 font-sans">
      <span className="font-semibold">Quick note:</span> Your session timed out, but you can still browse!
    </p>
    <button className="ml-auto text-blue-400 hover:text-blue-600">
      <XIcon className="w-5 h-5" />
    </button>
  </div>
</div>
```

### Color Rules for Errors

| Type | Background | Use For |
|------|------------|---------|
| General failure | `bg-amber-50` | API errors, server issues |
| Informational | `bg-blue-50` | Session notices, tips |
| Form validation | `bg-red-50` | Field-level errors only |

**Key Rule:** Use amber (not red) for most errors to reduce user anxiety.

---

## Accessibility Patterns

### Focus Visible

```tsx
className="focus-visible:ring-2 focus-visible:ring-amber-500
  focus-visible:ring-offset-2 focus-visible:outline-none"
```

### Screen Reader Only

```tsx
<span className="sr-only">Close modal</span>
```

### ARIA Labels

```tsx
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="menu-panel"
>
  <XIcon className="w-5 h-5" />
</button>
```

---

## Third-Party Integration Pill

For displaying external service data (Google Calendar events, Zoom links, Stripe payments, etc.) inline within Thoven UI. Uses a soft pill shape with the service's icon to signal "this came from elsewhere" without competing with Thoven's amber brand elements.

### Standard Pattern

```tsx
// Inline pill — use in lists, calendar cells, compact spaces
<div className="flex items-center gap-1 rounded-full bg-blue-50 hover:bg-blue-100 px-2 py-0.5 transition-colors">
  <img src="/icons/google-g.svg" alt="" aria-hidden="true" className="w-2.5 h-2.5 flex-shrink-0" />
  <span className="text-[10px] text-slate-600 font-sans truncate">
    Team Meeting
  </span>
  <span className="text-[9px] text-slate-400 font-sans flex-shrink-0">
    10:00 AM
  </span>
</div>
```

### Positioned Block — for time grids (week/day views)

```tsx
// Absolutely positioned block in a time grid
<div className="absolute rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors overflow-hidden cursor-pointer px-3 py-1.5">
  <div className="flex items-center gap-1.5">
    <img src="/icons/google-g.svg" alt="" aria-hidden="true" className="w-4 h-4 flex-shrink-0" />
    <span className="text-xs font-sans font-medium text-slate-600 truncate">
      Team Meeting
    </span>
  </div>
  <p className="text-[10px] font-sans text-slate-500 mt-0.5">
    10:00 AM - 11:00 AM
  </p>
</div>
```

### Key Rules

| Rule | Description |
|------|-------------|
| Shape | `rounded-full` for inline pills, `rounded-lg` for positioned blocks |
| Background | `bg-blue-50` (light blue tint — signals "external") |
| Hover | `hover:bg-blue-100` with `transition-colors` |
| Icon | Service's own logo/icon (12-16px), `flex-shrink-0` |
| Text | `font-sans`, `text-slate-600` for title, `text-slate-400` for time |
| No borders | No `border-*` classes — background tint is sufficient |
| No accent bars | No `border-l-*` — this is a Thoven anti-pattern |
| No shadows | These are background indicators, not interactive cards |

### Adapting for Other Services

Replace the icon and optionally the tint color:

| Service | Icon | Background |
|---------|------|------------|
| Google Calendar | `/icons/google-g.svg` | `bg-blue-50` |
| Zoom | Zoom icon | `bg-blue-50` |
| Stripe | Stripe icon | `bg-violet-50` |
| Generic external | `ExternalLink` lucide icon | `bg-gray-100` |

### Reference Implementation

- Inline pill: `components/teacher/ModernCalendar.tsx` (month view, ~line 568)
- Positioned block: `components/teacher/GoogleEventBlock.tsx`

---

## Design Anti-Patterns (Battle-Tested)

Patterns that look wrong in Thoven, learned from real implementation sessions.

### 1. 3D Shadows Inside Containers (Centering Issue)

When a 3D button sits inside a pill/container, the bottom shadow extends beyond the button's box, making it look vertically off-center.

```tsx
// WRONG — shadow eats into bottom padding, button looks lower than centered
<div className="bg-amber-100 rounded-full p-1">
  <button className="shadow-[0_4px_0_0_rgb(217,119,6)]">Label</button>
</div>

// CORRECT — extra bottom padding compensates for shadow height
<div className="bg-amber-100 rounded-full px-1.5 pt-1.5 pb-2.5">
  <button className="shadow-[0_2px_0_0_rgb(217,119,6)]">Label</button>
</div>
```

**Rule:** Bottom padding = top padding + max shadow height.

### 2. Unselected States Competing with Selected

When both selected and unselected states use 3D shadows and amber colors, nothing stands out.

```tsx
// WRONG — both states have amber 3D shadows, no hierarchy
selected:   "bg-amber-500 shadow-[0_2px_0_0_rgb(217,119,6)]"
unselected: "bg-white shadow-[0_4px_0_0_rgb(217,119,6)] text-amber-700"

// CORRECT — selected pops, unselected recedes
selected:   "bg-amber-500 text-white shadow-[0_2px_0_0_rgb(217,119,6)]"
unselected: "bg-white text-gray-600 hover:bg-gray-50"
```

**Rule:** Only the active/selected state gets 3D treatment. Unselected = neutral.

### 3. Wrong Amber Shade for Selected State

`amber-600` is for hover states only. The resting selected state uses `amber-500`.

```tsx
// WRONG
"bg-amber-600 shadow-[0_2px_0_0_rgb(180,83,9)]"

// CORRECT
"bg-amber-500 shadow-[0_2px_0_0_rgb(217,119,6)]"
```

### 4. Left-Hand Colored Accent Bars

A vertical colored stripe on the left edge of a card. This is a generic SaaS/dashboard pattern, not Thoven.

```tsx
// WRONG — clinical, not warm
<div className="relative">
  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl" />
  <div className="pl-4">Card content</div>
</div>

// CORRECT — let the content carry the card
<div className="bg-white rounded-2xl p-6 border-2 border-amber-100 shadow-lg">
  Card content
</div>
```

### 5. Icons on Every Card

AI-generated designs love putting an icon on every single card, section header, and list item. Thoven uses icons selectively.

```tsx
// WRONG — icon for decoration, adds nothing
<div className="flex items-center gap-3">
  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
    <ShieldCheck className="w-5 h-5 text-amber-600" />
  </div>
  <h3>Background Checked</h3>
</div>

// CORRECT — text speaks for itself
<h3 className="font-sans font-bold text-lg text-gray-900">
  Background Checked
</h3>
```

**Test:** Remove the icon. Does the design still work? If yes, you didn't need it.

**When an icon IS warranted, pick the tier (Iconography Hierarchy):**

- **Tier 1 — large / primary / hero → custom icons + OpenMoji.** Use `<Emoji char="…" />` (`components/ui/emoji.tsx`) / `lib/openmoji.ts` / `OpenMojiIcon`, or a custom asset from `components/icons/` · `public/icons/` · `lib/instrument-icons.ts`, for anchor-weight icons (empty states, onboarding, value props, the focal icon on a card).
- **Tier 2 — small / secondary / utility → Phosphor (`@phosphor-icons/react`).** For the small inline icons inside buttons, controls, pills, and metadata.

**Emoji nuance:** the "no emoji" rule means **no raw/literal OS emoji used lazily as decoration** (`🎵` typed straight into JSX). It does **not** ban **OpenMoji**, which IS the sanctioned Tier-1 system rendered as color SVGs via `<Emoji>`. Literal OS emoji = bad; OpenMoji = correct. Do not read this as "Phosphor only."

### 6. Colored Badge Pills Everywhere

Adding `bg-blue-50 text-blue-700` subtitle pills to every card when the subtitle doesn't communicate real status.

```tsx
// WRONG — decorative badge adds no information
<span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full text-xs">
  Personal Verification
</span>
<h3>Video Call Interviews</h3>

// OK — badge communicates actionable status
<span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs">
  Online
</span>
```

**Rule:** Badge pills are for status (Active, Verified, Online) and filtering categories (instrument, format). NOT for decorative subtitles.

### 7. Left Accent Bars on External Service Indicators

Using `border-l-*` on third-party integration elements (Google Calendar blocks, Zoom links, etc.). This is a generic dashboard pattern that conflicts with Thoven's warm, rounded aesthetic.

```tsx
// WRONG — clinical left stripe
<div className="bg-blue-50 border-l-4 border-l-blue-400 px-3 py-1.5">
  <span>Team Meeting</span>
</div>

// CORRECT — soft pill with service icon (see Third-Party Integration Pill section)
<div className="rounded-full bg-blue-50 hover:bg-blue-100 px-2 py-0.5 transition-colors">
  <img src="/icons/google-g.svg" className="w-2.5 h-2.5" />
  <span>Team Meeting</span>
</div>
```

**Rule:** External service data uses soft pills with the service's own icon. No bars, no borders.

### 8. Rainbow Card Grids

Each card in a grid gets a different accent color (amber, teal, blue, emerald). Creates visual chaos.

```tsx
// WRONG — 4 cards, 4 colors, fights brand
card1: "bg-amber-500"
card2: "bg-teal-500"
card3: "bg-blue-500"
card4: "bg-emerald-500"

// CORRECT — consistent amber or neutral
All cards: "border-2 border-amber-100" or plain "border border-gray-200"
```
