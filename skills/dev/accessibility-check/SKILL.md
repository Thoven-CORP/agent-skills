---
name: accessibility-check
description: >-
  Use when the user asks to review, audit, or fix accessibility (a11y) in
  components, pages, or forms. Also use when the user mentions WCAG compliance,
  ARIA attributes, screen reader support, keyboard navigation, focus management,
  color contrast, or COPPA accessibility requirements.
---

# Accessibility Check

Audit and fix WCAG 2.1 AA compliance for Thoven components. This platform is COPPA-compliant and serves students under 13, making accessibility a legal and ethical requirement.

## MANDATORY First Action

Before ANY other action, you MUST create a todo checklist:

TaskCreate for each:
- [ ] Step 1: Identify target component/page to audit
- [ ] Step 2: Audit Keyboard Navigation
- [ ] Step 3: Audit Focus Management
- [ ] Step 4: Audit ARIA attributes
- [ ] Step 5: Audit Forms (labels, errors, required fields)
- [ ] Step 6: Audit Visual (contrast, alt text, color-only info)
- [ ] Step 7: Audit Semantic HTML (headings, landmarks, lists)
- [ ] Step 8: Audit Motion/Animation (reduced-motion, auto-play)
- [ ] Step 9: Present findings report with all violations and fixes
YOU CANNOT SKIP THE CHECKLIST. CREATE IT NOW.

**Agent Dispatch:** For comprehensive audits, dispatch the `accessibility-tester` agent (dedicated WCAG specialist with COPPA context) instead of performing the audit inline. Use the agent for Steps 2-8 in parallel where possible.

**CRITICAL - YOU MUST FOLLOW THESE RULES:**

### NEVER Do This:
- ❌ NEVER audit only 2-3 categories and declare the component accessible
- ❌ NEVER skip a checklist category — ALL 7 areas must be checked
- ❌ NEVER report "no issues found" without reading the actual component code
- ❌ NEVER suggest fixes without citing specific line numbers

### ALWAYS Do This:
- ✅ ALWAYS create the TaskCreate checklist before any other action
- ✅ ALWAYS check ALL 7 audit categories (Keyboard, Focus, ARIA, Forms, Visual, Semantic, Motion)
- ✅ ALWAYS mark each TaskCreate step as completed as you finish it
- ✅ ALWAYS include line numbers in violation reports
- ✅ ALWAYS provide the Tailwind/code fix alongside each violation

---

## Quick Reference

| Area | Radix Handles | Developer Must Add |
|------|--------------|-------------------|
| Modal focus trap | Yes (Dialog) | Nothing extra |
| Modal Escape-to-close | Yes (Dialog) | Nothing extra |
| Dropdown keyboard nav | Yes (DropdownMenu, Select) | Nothing extra |
| Tab panel switching | Yes (Tabs) | Nothing extra |
| Accordion expand/collapse | Yes (Accordion) | Nothing extra |
| Icon-only button labels | No | `aria-label` on every icon-only button |
| Image alt text | No | `alt` attribute on all `<img>` tags |
| Form label association | No | `htmlFor`/`id` pairing or wrapping `<label>` |
| Error announcements | No | `aria-live="polite"` or `role="alert"` on error messages |
| Color contrast | No | 4.5:1 normal text, 3:1 large text (18px+ bold or 24px+) |
| Heading hierarchy | No | Sequential `h1` > `h2` > `h3`, no skipped levels |
| Landmarks | No | `<main>`, `<nav>`, `<header>`, `<footer>` |
| Reduced motion | No | `prefers-reduced-motion` media query on animations |
| Focus ring visibility | Partial (Radix adds focus styles) | Ensure `focus-visible:ring-2` on custom interactive elements |

## Checklist

### Keyboard Navigation
- [ ] All interactive elements reachable via Tab in logical order
- [ ] Escape closes modals, panels, and popovers
- [ ] Enter/Space activates buttons and links
- [ ] Arrow keys navigate within groups (Radix handles this for its components)
- [ ] No keyboard traps outside of modals

### Focus Management
- [ ] Modals trap focus (Radix Dialog does this automatically)
- [ ] Focus returns to trigger element when modal closes (Radix handles this)
- [ ] Visible focus ring on all interactive elements (`focus-visible:ring-2 focus-visible:ring-amber-500`)
- [ ] Custom floating panels (Framer Motion) must implement focus trap manually

### ARIA
- [ ] Icon-only buttons have `aria-label` (e.g., `<button aria-label="Close"><X /></button>`)
- [ ] Loading states use `aria-busy="true"` on the container
- [ ] Dynamic content updates use `aria-live="polite"` (or `"assertive"` for errors)
- [ ] Form inputs have `aria-describedby` pointing to help/error text
- [ ] Toggle buttons use `aria-pressed` or `aria-expanded`

### Forms
- [ ] Every input has an associated `<label>` via `htmlFor`/`id` or wrapping
- [ ] Required fields marked with `aria-required="true"`
- [ ] Validation errors appear in elements with `role="alert"` or `aria-live="polite"`
- [ ] Error text linked to input via `aria-describedby`
- [ ] Disabled inputs have `aria-disabled="true"` (not just visual styling)

### Visual
- [ ] Color contrast meets 4.5:1 for normal text, 3:1 for large text
- [ ] Information not conveyed by color alone (add icons, text, or patterns)
- [ ] All images have descriptive `alt` text (or `alt=""` for decorative)
- [ ] Text resizable to 200% without loss of content

### Semantic HTML
- [ ] One `<h1>` per page, headings in sequential order
- [ ] Page uses landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`
- [ ] Lists use `<ul>`/`<ol>`, not styled `<div>` sequences
- [ ] Tables use `<th>` with `scope` attribute

### Motion
- [ ] Framer Motion animations respect `prefers-reduced-motion`:
  ```tsx
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Or use Tailwind: motion-safe:animate-bounce, motion-reduce:animate-none
  ```
- [ ] No auto-playing animations that cannot be paused
- [ ] Transitions under 5 seconds

## Anti-Patterns (DON'T DO THESE)

### ❌ The "Partial Audit" Skip
```
"I checked ARIA and keyboard navigation, looks good!"
[Skipped Forms, Visual, Semantic, Motion categories]
```
**Why it's wrong:** All 7 categories are mandatory. Partial audits miss critical issues.

### ❌ The "No Issues" Shortcut
```
"I reviewed the component, no accessibility issues found."
[Didn't actually read the code or check specific line numbers]
```
**Why it's wrong:** Every component has SOMETHING to check. At minimum, verify and report on each category.

### ❌ The "Generic Fix" Report
```
"Add aria-labels to buttons"
[No line numbers, no specific elements identified]
```
**Why it's wrong:** Reports must cite specific file:line references and the exact fix.

---

## Common Mistakes

1. **Forgetting aria-label on icon buttons.** Every `<button>` with only an icon (no visible text) needs `aria-label`. This is the most common issue in the codebase.

2. **Using `<div onClick>` instead of `<button>`.** Divs with click handlers are not keyboard accessible. Use `<button>` or add `role="button"`, `tabIndex={0}`, and `onKeyDown` for Enter/Space.

3. **Missing form label association.** Inputs without `htmlFor`/`id` pairing render unlabeled to screen readers even if a visual label exists nearby.

4. **Custom panels without focus trap.** Radix Dialog auto-traps focus, but Framer Motion floating panels (used extensively in Thoven) do not. Add `react-focus-lock` or manual trap logic.

5. **Skipping heading levels.** Going from `<h1>` to `<h3>` breaks screen reader navigation. Always use sequential levels.

6. **Assuming Radix handles everything.** Radix provides keyboard nav and focus management for its primitives, but developers must still add `aria-label`, error announcements, color contrast, alt text, and semantic structure.

7. **Animation without reduced-motion check.** Framer Motion spring animations (used in panels) should check `prefers-reduced-motion` and simplify or disable accordingly.

8. **Color-only status indicators.** Assignment status badges (Completed/Overdue/Incomplete) must include text or icons, not rely solely on green/red/yellow colors.
