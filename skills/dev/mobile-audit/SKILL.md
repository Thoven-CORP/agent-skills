---
name: mobile-audit
description: "Use when the user asks to audit, review, or check mobile responsiveness, touch targets, breakpoints, viewport issues, or tablet layout for a component or page."
---

# Mobile Responsiveness Audit

Run this checklist against the target component or page file.

## Pitfalls

- Before asking Andres any phone or narrow-width question, run this audit with a width budget computed from the surface's token module, bring its findings and a recommendation, and record his ruling in the parent issue and the owning ticket before dispatch. (LEARNINGS 2026-10-09)

## MANDATORY First Action

Before ANY other action, you MUST create a todo checklist:

TaskCreate for each:
- [ ] Step 1: Identify target component/page to audit
- [ ] Step 2: Audit Touch Targets (WCAG 2.5.5 — 44x44px minimum)
- [ ] Step 3: Audit Breakpoints (mobile-first, sm/md/lg fallbacks)
- [ ] Step 4: Audit Text and Input Sizing (iOS zoom prevention)
- [ ] Step 5: Audit Overflow and Scroll (320px viewport test)
- [ ] Step 6: Audit Fixed/Sticky Positioning (safe areas, spacers)
- [ ] Step 7: Audit Modals and Panels (mobile widths, close button)
- [ ] Step 8: Audit Tap vs Hover Interactions (touch alternatives)
- [ ] Step 9: Audit Images and Media (responsive classes, aspect ratios)
- [ ] Step 10: Present findings report with all violations and fixes
YOU CANNOT SKIP THE CHECKLIST. CREATE IT NOW.

**CRITICAL - YOU MUST FOLLOW THESE RULES:**

### NEVER Do This:
- ❌ NEVER audit only 2-3 categories and declare the component mobile-ready
- ❌ NEVER skip a checklist category — ALL 8 areas must be checked
- ❌ NEVER report "responsive design looks good" without reading the actual code
- ❌ NEVER suggest fixes without citing specific line numbers

### ALWAYS Do This:
- ✅ ALWAYS create the TaskCreate checklist before any other action
- ✅ ALWAYS check ALL 8 audit categories (Touch, Breakpoints, Text, Overflow, Fixed, Modals, Tap, Images)
- ✅ ALWAYS mark each TaskCreate step as completed as you finish it
- ✅ ALWAYS include line numbers in violation reports
- ✅ ALWAYS provide the Tailwind fix pattern alongside each violation

---

## Quick Reference

| Issue | Fix | Tailwind Pattern |
|-------|-----|-----------------|
| Touch target too small | Min 44x44px | `min-h-[44px] min-w-[44px]` |
| Input zoom on iOS | Min 16px font | `text-base` (not `text-sm`) on inputs |
| Horizontal overflow | Constrain widths | `max-w-full overflow-x-hidden` |
| Desktop-only hover | Add tap alternative | `active:` alongside `hover:` |
| Hidden mobile content | Check breakpoint hiding | `hidden md:block` needs mobile alternative |
| Fixed element overlap | Test on 320px viewport | `fixed bottom-0` with safe area |

## Checklist

### 1. Touch Targets (WCAG 2.5.5)
- [ ] All buttons, links, and interactive elements are at least 44x44px
- [ ] Spacing between adjacent targets prevents mis-taps (min 8px gap)
- [ ] Icon-only buttons have sufficient padding: `p-2.5` or larger

### 2. Breakpoint Audit (Mobile-First)
- [ ] Default styles (no prefix) define the mobile layout
- [ ] `sm:` (640px), `md:` (768px), `lg:` (1024px) add progressive enhancements
- [ ] No layout relies solely on `md:` or `lg:` without a mobile fallback
- [ ] `hidden md:block` elements have a mobile alternative or are non-essential
- [ ] Grid columns collapse: e.g., `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

### 3. Text and Input Sizing
- [ ] Body text is at least `text-sm` (14px) on mobile
- [ ] All `<input>`, `<select>`, `<textarea>` use `text-base` (16px) to prevent iOS auto-zoom
- [ ] Headings scale down: `text-2xl md:text-3xl` pattern
- [ ] Long text truncates or wraps: `break-words` or `truncate`

### 4. Overflow and Scroll
- [ ] No horizontal scroll on 320px viewport width
- [ ] Tables use `overflow-x-auto` wrapper
- [ ] Fixed-width elements use `max-w-full` or `w-full`
- [ ] Images use `max-w-full h-auto`

### 5. Fixed and Sticky Positioning
- [ ] Fixed elements do not overlap content (add spacer div if needed)
- [ ] Bottom-fixed CTAs use `pb-safe` or manual padding for iOS home indicator
- [ ] Sticky headers work with mobile scroll and do not consume excessive viewport height
- [ ] Modals/panels are scrollable when content exceeds viewport: `max-h-screen overflow-y-auto`

### 6. Modals and Panels
- [ ] Panels use `w-full` or `max-w-full` on mobile (not fixed pixel widths)
- [ ] Close button is accessible and within thumb reach
- [ ] Panel does not break layout on screens under 375px
- [ ] Background scroll is locked when modal is open (`overflow-hidden` on body)

### 7. Tap vs Hover Interactions
- [ ] Hover-only tooltips have a tap/click alternative
- [ ] Dropdown menus work on touch (not hover-triggered only)
- [ ] `active:` states exist alongside `hover:` for press feedback
- [ ] No content is only accessible via `:hover` CSS

### 8. Images and Media
- [ ] Images use responsive classes: `w-full h-auto` or `object-cover`
- [ ] Large hero images have mobile-appropriate sizing
- [ ] Aspect ratios are preserved: `aspect-video` or `aspect-square`

## Common Mistakes

1. **Using `text-sm` on inputs** -- causes iOS Safari to auto-zoom the page on focus. Always use `text-base` (16px+) for form inputs.
2. **Fixed pixel widths** -- `w-[400px]` breaks on 320px screens. Use `w-full max-w-[400px]` instead.
3. **Missing mobile grid fallback** -- `grid-cols-3` without a `grid-cols-1` default creates tiny columns on mobile.
4. **Hover-only dropdowns** -- touch devices have no hover. Use click/tap handlers.
5. **Forgetting `md:hidden` spacers** -- when using fixed bottom bars on mobile (pattern: `<div className="h-24 md:h-0" />`), ensure a spacer prevents content from hiding behind the bar.

## Anti-Patterns (DON'T DO THESE)

### ❌ The "Partial Audit" Skip
```
"I checked breakpoints and touch targets, looks mobile-ready!"
[Skipped Overflow, Fixed positioning, Modals, Tap interactions, Images]
```
**Why it's wrong:** All 8 categories are mandatory. Partial audits miss critical mobile issues.

### ❌ The "Looks Responsive" Shortcut
```
"The component uses Tailwind responsive classes, should be fine on mobile."
[Didn't actually check for specific issues like iOS zoom, 320px overflow, etc.]
```
**Why it's wrong:** Having responsive classes doesn't mean they're correct. Must verify each category.

### ❌ The "Generic Fix" Report
```
"Add responsive classes to fix mobile layout"
[No line numbers, no specific elements identified]
```
**Why it's wrong:** Reports must cite specific file:line references and the exact Tailwind fix.

---

## How to Run

1. Create the MANDATORY TaskCreate checklist (see top of this skill)
2. Open the target file
3. Walk through each checklist section, marking tasks as completed
4. Flag violations with the line number and specific issue
5. Suggest a fix using the Tailwind pattern from the Quick Reference table
