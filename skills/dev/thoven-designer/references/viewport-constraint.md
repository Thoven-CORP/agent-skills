# Viewport Constraint Pattern

The single most common Thoven design failure: **components grow past the viewport**, the page body scrolls to compensate, and critical actions (confirm buttons, dismiss handles, primary content) end up below the fold. This document codifies the structural rules that prevent this.

If you're designing a new page, modal, overlay, drawer, popover, dashboard, or sheet — you MUST follow these patterns. If you're auditing a feature, you MUST check this section against every overlay and shell screen.

## Contents

- The principle — viewport owns the height, component does not
- Rule 1 — Overlays (modal / dialog / drawer / popover / sheet) cap at `max-h-[90vh]`
  - Required structure
  - Reference Tailwind (full code example)
  - Body-scroll lock
  - Mobile bottom-sheet variant
  - Anti-patterns that fail audit
- Rule 2 — Dashboards / app shells use `h-[100dvh] overflow-hidden`
  - Required structure
  - Reference Tailwind (full code example)
  - Tables: sticky thead pattern
  - Anti-patterns that fail audit
- Rule 3 — Document-like exceptions (marketing, blog, public profile, /resources)
- Rule 4 — Definition of done (smoke tests at 800×600 + 375×667)
- Audit checklist (paste into Phase 4 review)
- Why this rule exists

---

## The principle

**The viewport owns the height. The component does not.**

Overlays interrupt — they pull focus, and every action in them must be reachable without scrolling the page. Dashboards orient — they should feel like a control panel where regions scroll independently, not like a document that scrolls top-to-bottom.

Failure mode (in both cases): the component is allowed to grow with its content. When content exceeds the viewport, the page body scrolls. Buttons end up below the fold. Users — kids especially — read this as broken, not as "scroll for more."

For students under 13, this isn't a polish issue. A modal with a hidden confirm button stalls them. A dashboard with a half-rendered table reads as a bug. Solve for them first.

---

## Rule 1 — Overlays never control their own height

Overlays = modal, dialog, drawer, popover, right-side sheet, bottom-sheet, command-K, action-sheet, anything that floats above the page.

### Required structure

```
fixed full-screen backdrop (locks body scroll)
└── flex column container, max-h-[90vh] (or h-[100vh] / inset-0 for full-screen overlays)
    ├── header — flex-shrink-0          (always visible: title, close X)
    ├── body — flex-1 min-h-0 overflow-y-auto
    │   └── (content here scrolls if too long)
    └── footer — flex-shrink-0          (always visible: confirm / cancel / primary CTA)
```

The `min-h-0` on the body is non-negotiable. Without it, the flex child claims its full content height and the column breaks. With it, the body shrinks to fill the remaining space and scrolls internally.

### Reference Tailwind

```tsx
// Backdrop + container
<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
  <div className="flex flex-col w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden">

    {/* Header — anchored */}
    <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <h2 className="font-display text-xl font-bold text-gray-900">Modal title</h2>
      <button aria-label="Close">×</button>
    </header>

    {/* Body — scrolls if content overflows */}
    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
      {/* long content */}
    </div>

    {/* Footer — anchored, actions always visible */}
    <footer className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
      <button>Cancel</button>
      <button>Confirm</button>
    </footer>

  </div>
</div>
```

### Body-scroll lock

When an overlay opens, the page underneath must NOT scroll. Add `overflow: hidden` to `<body>` while the overlay is mounted (Radix Dialog does this automatically; if you're rolling your own, do it explicitly).

### Mobile bottom-sheet variant

On phones, full-screen-centered overlays often feel cramped. The same structural rule applies — replace `max-h-[90vh]` with `h-[100vh]` or `h-[100dvh]` (dynamic viewport height that respects mobile browser chrome) and shift to a bottom-sheet shape (`rounded-t-2xl`, anchored bottom). Header + body + footer pattern unchanged.

### Anti-patterns — fail audit

- ❌ Overlay container without `max-h-[90vh]` (or equivalent cap)
- ❌ `overflow-y-auto` on the entire overlay container — scrolls the footer too, hiding actions
- ❌ Body slot without `min-h-0` — content blows out the column
- ❌ Footer without `flex-shrink-0` — gets pushed off-screen by long body
- ❌ Multiple actions split across modal body and footer (only the footer is anchored)
- ❌ No body-scroll lock — page underneath scrolls beneath the overlay

---

## Rule 2 — Dashboards never page-scroll

Dashboard / app shells = teacher dashboard, student dashboard, parent dashboard, classroom view, settings shell, admin shell, marketplace search shell. Anywhere that's "the app" rather than "a document".

### Required structure

```
root shell — h-[100dvh] overflow-hidden    (the shell never scrolls)
└── flex column
    ├── top nav — flex-shrink-0            (always visible)
    ├── (optional) sub-nav / breadcrumbs — flex-shrink-0
    └── content — flex-1 min-h-0 overflow-hidden
        └── inner regions (table | list | card grid | sidebar+main split)
            └── each region: overflow-y-auto with min-h-0
            └── tables: sticky thead inside the scroll region
```

Same `min-h-0` rule. Without it, the flex-1 content claims its content height and the page scrolls. With it, content fills the remaining space and individual regions scroll inside their own boxes.

### Reference Tailwind

```tsx
// Shell
<div className="h-[100dvh] overflow-hidden flex flex-col">

  {/* Top nav — anchored */}
  <nav className="flex-shrink-0 h-16 bg-white border-b border-gray-100">
    {/* nav contents */}
  </nav>

  {/* Content area — fills remaining height, no page scroll */}
  <main className="flex-1 min-h-0 overflow-hidden flex">

    {/* Sidebar (if any) */}
    <aside className="w-64 flex-shrink-0 border-r border-gray-100 overflow-y-auto min-h-0">
      {/* sidebar contents — sidebar scrolls inside its column */}
    </aside>

    {/* Main panel */}
    <section className="flex-1 min-h-0 overflow-y-auto p-6">
      {/* main panel contents — scrolls inside the section */}
    </section>

  </main>

</div>
```

### Tables: sticky header

Inside any scrolling region that contains a table, the `<thead>` must stick at the top so the user never loses column context.

```tsx
<div className="overflow-y-auto min-h-0 flex-1">
  <table className="w-full">
    <thead className="sticky top-0 bg-white z-10 shadow-sm">
      {/* header row */}
    </thead>
    <tbody>
      {/* rows */}
    </tbody>
  </table>
</div>
```

### Anti-patterns — fail audit

- ❌ Shell without `h-[100dvh]` (or `h-screen`) + `overflow-hidden`
- ❌ Top nav without `flex-shrink-0` — gets squeezed away
- ❌ Content area without `flex-1 min-h-0` — flex column collapses, page scrolls
- ❌ Data regions without their own `overflow-y-auto` — scroll bubbles up to page
- ❌ Tables without `sticky thead` — user loses column context
- ❌ Long forms or paginated lists rendered with no overflow constraint — page-scroll guaranteed
- ❌ Using `min-h-screen` instead of `h-[100dvh]`/`h-screen` — `min-h` lets content blow past viewport

---

## Rule 3 — Document-like exceptions

These pages SHOULD scroll the page itself. Don't apply Rule 2 here:

- Public marketing pages (`/`, `/for-parents`, `/for-teachers`, `/about`)
- Blog post body (`/blog/<slug>`)
- Public teacher profile (`/teacher/<id>`)
- `/resources` article pages
- Help center / docs articles
- Lesson notes archives (long-form reading)

These are documents. Reading is the activity. The browser's native scroll is the right behavior — DO NOT cap their height or trap scroll in inner regions.

If you're not sure whether a page is a document or a dashboard: **does the user come here to read, or to act?** Documents read. Dashboards act.

---

## Rule 4 — Definition of done

A new overlay or dashboard is not done until it passes this check:

> Open at **800×600 viewport** (the smallest realistic laptop). Nothing critical is below the fold. All actions are reachable without page-scroll.

Plus the standard mobile pass at 375×667 (iPhone SE portrait) — if the overlay is full-screen / bottom-sheet on mobile, every action must still be reachable inside its scrollable body without the footer escaping the viewport.

If either check fails, the component fails the audit.

---

## Audit checklist (paste into Phase 4 review)

For each overlay shipped:
- [ ] Container has `max-h-[90vh]` (or `h-[100dvh]` for full-screen)
- [ ] Container is `flex flex-col`
- [ ] Header carries `flex-shrink-0`
- [ ] Body carries `flex-1 min-h-0 overflow-y-auto`
- [ ] Footer carries `flex-shrink-0`
- [ ] Body scroll is locked while overlay is open (Radix Dialog handles this; verify if custom)
- [ ] Smoke test: at 800×600 viewport, header + footer both visible, body scrolls if content overflows
- [ ] Smoke test: at 375×667 viewport, all actions reachable

For each dashboard / app shell:
- [ ] Shell uses `h-[100dvh] overflow-hidden flex flex-col` (or `h-screen`)
- [ ] Top nav has `flex-shrink-0`
- [ ] Content area has `flex-1 min-h-0 overflow-hidden`
- [ ] Each scrollable region inside content uses `overflow-y-auto` + `min-h-0`
- [ ] Tables have `sticky thead`
- [ ] Smoke test: at 800×600, no `<body>` scrollbar appears
- [ ] Smoke test: at 375×667, top nav remains visible, primary content fills the remaining space

---

## Why this rule exists

Andres has hit this class of bug repeatedly across modals, dashboards, and side panels. Every time, the cause is the same: a component allowed to grow with its content, no viewport cap. Documenting the constraint here so the thoven-designer skill defaults to it on new work, and so design-audit checklists catch it on existing work.

If you're tempted to "just let it scroll a little" because the design is mostly fitting — STOP. Add the cap. The future you who is debugging why the confirm button is hidden on a 13-inch laptop will thank present you.
