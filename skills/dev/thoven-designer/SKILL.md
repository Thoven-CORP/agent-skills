---
name: Designing Thoven UI
description: Designs and implements Thoven-branded UI components with consistent branding, design system compliance, and anti-pattern avoidance. Runs deduplication check, creates design specs via ui-designer agent, and implements via frontend-developer agent. Triggers on design, new page, new section, new component, scaffold, style guide, brand, UI, card, panel, modal, page, redesign.
---

# Thoven Designer Skill

Ensures consistent Thoven branding across all new UI work through deduplication checks, design specifications, and implementation.

> **Visual source of truth:** `docs/design-system.html` — open it in a browser to see every token, button family, color, and pill rendered live. The reference docs below are its written companions.

## MANDATORY First Action

Before ANY other action, create a todo checklist:

- [ ] Step 0: Gather design requirements + ASCII layout sketch
- [ ] Step 1: Quick deduplication check (with visual descriptions)
- [ ] GATE 1: User confirms approach (reuse, extend, or create new)
- [ ] Step 1.5: Wireframe options (2-3 layouts via /wireframe or Excalidraw CLI)
- [ ] GATE 1.5: User approves layout direction
- [ ] Step 2: Design specification (ui-designer agent with approved wireframe)
- [ ] GATE 2: User approves design before implementation
- [ ] Step 3: Implementation (frontend-developer agent)
- [ ] Step 4: Design system review checklist

**CRITICAL RULES:**

### NEVER:
- Skip the deduplication check and jump to implementation
- Proceed past gates without explicit user approval
- Use `orange-500` for primary CTAs/buttons or `orange-50` for full-page dashboard backgrounds (amber required for those 5 specific contexts — see [brand-colors.md](references/brand-colors.md))
- Flag tertiary palette colors (`amber/sky/emerald/purple/rose/indigo/red/teal` from `lib/student-colors.ts`) as violations — they are permitted for categorical/identity/decorative usage (status pills, per-student differentiation, semantic badges)
- Flag decorative orange-family usage (empty-state borders, icon rings, hover tints, musical notes, lesson borders) — these are permitted per [brand-colors.md](references/brand-colors.md) "Warm Decorative Accents"
- Add borders to 3D buttons
- Use `font-display` on buttons (use `font-sans font-semibold`)
- Use dark backdrop on floating panels
- Add left-hand colored accent bars on cards
- Put Lucide icons on every card/section (see [brand-identity.md](references/brand-identity.md))
- Use different accent colors per card in a grid (rainbow cards)
- Give unselected states 3D shadows (only selected/active gets depth)
- Use `amber-600` for resting selected state (that's hover-only; use `amber-500`)
- **Let an overlay (modal / dialog / drawer / popover / sheet) grow with its content past the viewport** — see [viewport-constraint.md](references/viewport-constraint.md) Rule 1. Caused buttons-below-the-fold bugs repeatedly; always cap `max-h-[90vh]` with anchored `flex-shrink-0` header + footer and a `flex-1 min-h-0 overflow-y-auto` body.
- **Let a dashboard / app shell page-scroll** — see [viewport-constraint.md](references/viewport-constraint.md) Rule 2. Shells fill `h-[100dvh] overflow-hidden`; data regions inside scroll independently with their own `overflow-y-auto` + `min-h-0`. Document-like pages (blog, marketing, public profiles, /resources articles) are the only exception.

### ALWAYS:
- Create the todo checklist before any other action
- Run deduplication check before creating new components
- Wait for user approval at BOTH gates
- Validate against design system in review step
- Read [brand-identity.md](references/brand-identity.md) for design philosophy
- Cite specific Thoven design tokens (amber-500, font-display, spring params)
- **Default to viewport constraint** when designing any overlay or dashboard / app shell — read [viewport-constraint.md](references/viewport-constraint.md) BEFORE laying out the structure. The smoke test for done: open at 800×600 viewport, nothing critical is below the fold; at 375×667 mobile, every action reachable. If you can't pass both, the component fails. This is the most common Thoven design failure — default to the cap, not to "let it grow."

---

## Workflow

```
Phase 0: UNDERSTAND + ASCII Sketch → Phase 1: DEDUP CHECK (visual) → [GATE 1] → Phase 1.5: WIREFRAME OPTIONS → [GATE 1.5] → Phase 2: DESIGN → [GATE 2] → Phase 3: IMPLEMENT → Phase 4: REVIEW
```

---

## Phase 0: Understand

Ask questions ONE AT A TIME. Prefer multiple choice. Skip what's obvious from context. Max 5 questions.

1. **What?** — New page / New section / New component / Redesign existing
2. **Where?** — Parent dashboard / Teacher dashboard / Student / Landing / Admin
3. **Who?** — Parents / Teachers / Students (under 13) / Public visitors
4. **References?** — Screenshots/URLs / Similar codebase feature / Design from scratch
5. **Interactions?** — What data and interactions does this need?

### External Design Research (run before dedup check if applicable)

After gathering requirements, ask:
> "Any external products, brands, or design systems you want me to reference? (e.g. Duolingo, Daily.co, shadcn, Linear)"

If yes → invoke the `design-research` skill with the target + current design context before proceeding to the layout sketch. This surfaces brand data and curated takeaways you can use to inform the design.

### Layout Sketch (MANDATORY after questions)

After gathering requirements, MUST produce an ASCII layout sketch and confirm via AskUserQuestion with preview:

```
"Here's my understanding of the layout:"

┌─────────────────────────────┐
│  Header / Title             │
├──────────┬──────────────────┤
│ Sidebar  │ Main Content     │
│ - Nav    │ ┌──────┐ ┌─────┐│
│ - Items  │ │Card 1│ │Card2││
│          │ └──────┘ └─────┘│
└──────────┴──────────────────┘
```

This validates layout understanding BEFORE the dedup check. If the user corrects the sketch, update understanding and re-sketch. Do not proceed to Phase 1 until the user confirms the layout direction.

### Design Inspiration Sites

When designing, identify which reference has the closest UX pattern. The curated list below is the **primary taste filter** — these six are pre-vetted for Thoven brand fit. See [brand-identity.md](references/brand-identity.md) for detailed guidance on what to take from each site.

| Site | Best For |
|------|----------|
| **Duolingo** | 3D button depth, gamified progress, playful micro-interactions |
| **Preply** | Teacher marketplace cards, booking flows, profile layouts |
| **Airbnb** | Card design, whitespace, search UX, booking confirmation |
| **Notion** | Clean spacing, sidebar nav, empty states |
| **Linear** | Crisp typography, subtle animations, keyboard UX |
| **Anthropic** | Typography hierarchy, section spacing, sophisticated simplicity |

#### Mobbin (gap-fill + curated drill-down)

For tagged screens from 1,100+ apps — patterns the curated list can't cover, or screens from one of the curated apps — say:

> "I wonder how [app] does [feature]"  *or*  "show me [pattern] in [domain] apps"

The `design-research` skill fires automatically, picks the Mobbin backend, and returns a brand-annotated `★ Design Reference` block with ✅ / ⚠️ / ❌ verdicts derived from this skill's [brand-identity.md](references/brand-identity.md) anti-patterns. Reply `pin` to graduate a result into a persistent anchor at `docs/superpowers/anchors/<feature>-anchors.md` — those anchors are read by Phase 1.5 and Phase 2 below.

---

## Phase 1: Deduplication Check

**Goal:** Avoid building something that already exists. This is a quick check, not a blocker.

The point is to prevent creating a second `CardStack` when `SwipeableCardFan` already does the job. It's NOT about forcing reuse when you need something genuinely new. Innovation is encouraged — just don't duplicate.

### Quick Search

Launch an Explore agent to scan for similar components:

```
Task tool with subagent_type: "Explore"
Prompt: "Search for existing components similar to [description]:
1. Check components/ui/, components/shared/, components/landing/
2. Search by type: *Card*.tsx, *Panel*.tsx, *Modal*.tsx, etc.
3. For each found: name, path, similarity level, can it be reused?"
```

### Codebase Reference Components

Known patterns worth checking before building similar:

| Pattern | Reference Component |
|---------|-------------------|
| 3D button | `components/unified-navigation.tsx` |
| Floating panel | `components/teacher/class-materials/ClassMaterialsPanel.tsx` (shared across teacher/student/parent) |
| Teacher card | `components/marketplace/TeacherCard.tsx` |
| Dashboard section | `components/teacher/CalendarSection.tsx` |
| Lesson card | `components/student/CalendarLessonCard.tsx` |
| Modal with form | `components/teacher/BookingModal.tsx` |
| 3D workspace button | `app/student/dashboard/page.tsx` |

### Visual Comparison (MANDATORY for matches)

For each candidate component with >50% similarity, MUST include a visual description or ASCII sketch showing its layout:

```
Found: SwipeableCardFan (75% match)
  Layout: Horizontal scrolling card stack
  ┌────┐ ┌────┐ ┌────┐
  │Card│→│Card│→│Card│  (swipe to navigate)
  └────┘ └────┘ └────┘
  States: default, swiping, settled

Found: TeacherCard (60% match)
  Layout: Vertical card with image + info
  ┌──────────┐
  │  Avatar   │
  │ Name      │
  │ ★★★★☆    │
  │ [Book]    │
  └──────────┘
```

This helps the user visually compare candidates instead of reading component names.

### Decision Framework

After the search, recommend ONE of:

| Recommendation | When |
|---|---|
| **Reuse directly** | An existing component does exactly what's needed |
| **Extend existing** | An existing component is 70%+ there, needs minor additions |
| **Create new** | Nothing similar exists, or the design need is genuinely different |

**Default to "create new"** when in doubt. Don't force-fit an existing component.

### GATE 1: User Approval

Present findings and recommendation. Ask: "Should I proceed with [approach], or would you prefer a different direction?"

---

## Phase 1.5: Wireframe Options (MANDATORY before Design Spec)

Before dispatching the ui-designer agent, generate 2-3 layout wireframe options for user approval. This prevents "great spec, wrong layout" rework.

**Anchor read (MANDATORY):** before generating layouts, check for `docs/superpowers/anchors/<feature>-anchors.md`. If it exists, read every `## Anchor: ...` section and seed each wireframe variant with one of the pinned references — explicitly cite which anchor inspired each option (e.g., "Option A — anchored on Calm's daily streak panel"). If no anchor file exists, proceed with curated-list inspiration only.

**Option A (preferred): Use `/wireframe` skill** if available — generates 5 interactive HTML prototypes with B&W wireframes in ~60 seconds.

**Option B: Use Excalidraw CLI** for quick PNG sketches:
```bash
excalidraw-cli create --dsl "Header -> [Sidebar | Content] -> Footer" --output /tmp/wireframe-option-1.png
```

**Option C: ASCII wireframe** (fallback if tools unavailable) — render 2-3 layout variations inline with AskUserQuestion preview.

Present options via AskUserQuestion:
```
"Here are 2-3 layout directions. Which feels right for this feature?"

Option A: Vertical stack (mobile-first)
[wireframe preview]

Option B: Sidebar + content (desktop-first)
[wireframe preview]

Option C: Card grid layout
[wireframe preview]
```

**GATE 1.5: User MUST approve a layout direction before Phase 2 proceeds.** The approved wireframe is passed to the ui-designer agent as visual context.

---

## Phase 2: Design Specification

Launch ui-designer agent with requirements from Phase 0, reuse decision from Phase 1, and **approved wireframe from Phase 1.5**.

Include in the prompt:
- Requirements gathered in Phase 0
- Reuse decision from Phase 1
- **Approved wireframe layout from Phase 1.5** (reference image or description)
- **Pinned anchors** from `docs/superpowers/anchors/<feature>-anchors.md` if the file exists — paste each `## Anchor: ...` section verbatim into the prompt as visual context, including the Brand Verdict and Thoven Transformation lines. The ui-designer agent must apply the transformations, not copy the source pattern as-is.
- Reference to design system: [brand-identity.md](references/brand-identity.md), [brand-colors.md](references/brand-colors.md), [typography.md](references/typography.md), [component-patterns.md](references/component-patterns.md)

The ui-designer should deliver:
- Visual specification with all states (default, hover, active, disabled, selected)
- Color usage with exact Tailwind classes
- Typography with exact font classes
- Animation specifications — use the `motion` skill to pick the layer + preset (springs from `lib/motion-config.ts`)
- Responsive behavior (mobile/tablet/desktop)
- Accessibility requirements (ARIA, focus states, touch targets)

**Creative option:** When the context allows, include one design option with a musical or educational skeuomorphic touch (e.g., calendar dates that look like real calendar pages, homework on notebook paper). See the "Skeuomorphic Play" section in [brand-identity.md](references/brand-identity.md). Present it alongside a clean standard option — let the founder choose. Don't force it on every design.

### GATE 2: Design Approval

Present the design spec. Ask: "Please review and confirm before I proceed with implementation."

> **Optional domain-quality layer:** Before closing this gate, consider running `/impeccable critique <component-name>`. It runs a domain-level UX review (hierarchy, clarity, emotional resonance) that goes beyond Thoven brand rules. Not required — invoke when the design surface is complex or you want an independent quality signal. Its output is addendum notes only; it does not modify the spec.

---

## Phase 3: Implementation

Launch frontend-developer agent with the approved design spec.

Include in the prompt:
- Approved design spec from Phase 2
- Components to reuse from Phase 1
- Standards: TypeScript strict, existing API layer from `lib/`, WCAG 2.1 AA, proper ARIA
- Motion: implement via `motion-react` (Framer + `lib/motion-config.ts` presets) or `gsap-*` for scroll/timeline; see the `motion` skill for the layer decision

---

## Phase 4: Design System Review

Validate the implementation against this checklist:

**Colors:**
- [ ] Primary CTA uses `amber-500` (NOT `orange-500`, NOT `amber-600`)
- [ ] 3D shadows use `rgb(217,119,6)` for amber
- [ ] Page/dashboard backgrounds use `bg-amber-50` (NOT `bg-orange-50`)
- [ ] Non-amber colors follow established patterns (semantic status, gradients, accents — see [brand-colors.md](references/brand-colors.md))
- [ ] Tertiary categorical colors drawn from `lib/student-colors.ts` 8-family palette (amber/sky/emerald/purple/rose/indigo/red/teal) — permitted at any shade for status/identity/decorative usage; **do NOT flag these as violations**
- [ ] No rainbow card grids (multiple accent colors per grid)

**Typography:**
- [ ] Headers/titles use `font-display` (Fredoka)
- [ ] Buttons use `font-sans font-semibold` (Montserrat)
- [ ] Body text uses `font-sans` (Montserrat)

**Patterns:**
- [ ] 3D buttons have NO borders
- [ ] Floating panels have spring animation, NO dark backdrop
- [ ] Selected states clearly dominate unselected (contrast, not competition)
- [ ] No left-hand colored accent bars on cards
- [ ] Icons used selectively, not on every card/element
- [ ] Badge pills only for real status/categories, not decorative subtitles

**Viewport constraint** (full audit checklist + rationale in [viewport-constraint.md](references/viewport-constraint.md)):
- [ ] Overlays cap `max-h-[90vh]` with `flex flex-col` + `flex-shrink-0` header & footer + `flex-1 min-h-0 overflow-y-auto` body (never `overflow-y-auto` on the whole container — that scrolls actions out of view)
- [ ] Dashboards / app shells use `h-[100dvh] overflow-hidden flex flex-col`; data regions scroll independently via `overflow-y-auto` + `min-h-0`
- [ ] Tables inside scrolling regions use `sticky thead` so column context never disappears
- [ ] Smoke test at 800×600 viewport: no `<body>` scrollbar appears; all CTAs reachable
- [ ] Smoke test at 375×667 (iPhone SE portrait): top nav stays anchored; primary content fills the rest
- [ ] Document-like pages (blog, marketing, public profile, /resources article) are exempt from the shell rule — they SHOULD page-scroll

**Accessibility:**
- [ ] Color contrast meets 4.5:1
- [ ] Touch targets are 44x44px minimum
- [ ] Focus states are visible
- [ ] ARIA labels present on interactive elements

**Error Handling:**
- [ ] Follows [error-messaging.md](references/error-messaging.md) patterns
- [ ] Amber background for errors (not red), except field validation
- [ ] All errors have retry/recovery actions

> **Optional deep audit:** After completing this checklist, run `/impeccable audit <component-name>` for a technical quality pass (a11y depth, performance signals, responsive edge cases). Invoke when the component has a large viewport/a11y surface or before shipping to production. Not required on every design.

---

## External Reference Transformation

When user provides external designs (screenshots, URLs, code):

1. **Analyze** — Identify visual patterns, colors, component structure
2. **Map to Thoven** — Apply transformation table below
3. **Store** — Save to `references/transformed/[name].md`
4. **Apply standards** — Replace colors, typography, add spring animations

| External | Thoven Equivalent |
|----------|-------------------|
| Primary color | `amber-500` |
| Secondary color | `amber-100` or `yellow-100` |
| Sans-serif font | `font-sans` (Montserrat) |
| Display font | `font-display` (Fredoka) |
| Flat buttons | 3D buttons with shadow |
| Modal backdrop | No backdrop (spring panel) |
| Left accent bars | Remove — use border or nothing |
| Icon on every card | Remove most — keep only where functional |

---

## Quick Reference

### Thoven 3D Button

```tsx
className="bg-amber-500 hover:bg-amber-600 text-white font-sans font-semibold
  rounded-xl px-6 py-2.5
  shadow-[0_4px_0_0_rgb(217,119,6)]
  hover:shadow-[0_2px_0_0_rgb(217,119,6)]
  active:shadow-[0_1px_0_0_rgb(217,119,6)]
  active:translate-y-1 transition-all duration-200
  focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
```

### Spring Animation

```typescript
transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.6 }}
```

### Common Mistakes

| Mistake | Fix |
|---------|-----|
| `orange-500` on buttons | `amber-500` |
| `amber-600` for resting selected | `amber-500` (600 is hover-only) |
| `font-display` on buttons | `font-sans font-semibold` |
| Borders on 3D buttons | Remove all borders |
| Dark backdrop on panels | No overlay; panel floats freely |
| Shadow RGB `rgb(194,65,12)` | `rgb(217,119,6)` |
| Shadow RGB `rgb(180,83,9)` | `rgb(217,119,6)` |
| Left accent bar on cards | Remove — not Thoven style |
| Icon on every card | Remove unless functional |
| Unselected state with 3D shadow | Neutral: `bg-white text-gray-600` |
| 3D button inside pill looks off-center | Add extra bottom padding for shadow clearance |
| Rainbow card grid (4 colors) | Consistent amber or neutral |
| Decorative badge pills | Only for real status/categories |

---

## References

- [brand-identity.md](references/brand-identity.md) - Design philosophy, personality, AI anti-patterns, inspiration sites
- [brand-colors.md](references/brand-colors.md) - Complete color palette and 3D shadow system
- [typography.md](references/typography.md) - Font usage rules and examples
- [component-patterns.md](references/component-patterns.md) - Standard patterns and battle-tested anti-patterns
- [error-messaging.md](references/error-messaging.md) - User-friendly error patterns
- [reusable-inventory.md](references/reusable-inventory.md) - Component catalog
- [transformed/](references/transformed/) - Transformed external references
