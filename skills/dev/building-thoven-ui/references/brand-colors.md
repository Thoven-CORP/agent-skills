# Thoven Brand Colors

Complete color palette for the Thoven music education platform.

---

## Primary Brand Color (Thoven Orange)

**CRITICAL:** Thoven Orange is `amber-500`, NOT `orange-500`.

| Property | Value |
|----------|-------|
| Tailwind Class | `amber-500` |
| Hex | `#f59e0b` (Tailwind stock — this is what `bg-amber-500` renders in production) |
| 3D Shadow RGB | `rgb(217,119,6)` |

### Button States

| State | Background | Shadow |
|-------|-----------|--------|
| Default | `bg-amber-500` | `shadow-[0_4px_0_0_rgb(217,119,6)]` |
| Hover | `hover:bg-amber-600` | `hover:shadow-[0_2px_0_0_rgb(217,119,6)]` |
| Active | `active:bg-amber-700` | `active:shadow-[0_1px_0_0_rgb(217,119,6)]` |

### Complete Button Pattern

```typescript
className="bg-amber-500 hover:bg-amber-600 text-white font-sans font-semibold
  rounded-xl px-6 py-2.5
  shadow-[0_4px_0_0_rgb(217,119,6)]
  hover:shadow-[0_2px_0_0_rgb(217,119,6)]
  active:shadow-[0_1px_0_0_rgb(217,119,6)]
  active:translate-y-1 transition-all duration-200
  focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
```

---

## Amber Palette (Primary Family)

| Class | Usage |
|-------|-------|
| `amber-50` | Light backgrounds, cards, form input backgrounds |
| `amber-100` | Slightly darker backgrounds, date badges |
| `amber-200` | Borders, subtle accents |
| `amber-300` | Focus rings, hover borders |
| `amber-400` | Gradients, decorative elements, stars |
| `amber-500` | **PRIMARY CTAs, buttons** |
| `amber-600` | Hover states, accent text, income displays |
| `amber-700` | Active/pressed button states |

---

## Yellow Palette (Secondary Accents)

| Class | Usage |
|-------|-------|
| `yellow-50` | Search input backgrounds |
| `yellow-100` | Resource button backgrounds |
| `yellow-200` | Borders, hover states |
| `yellow-300` | Instrument button borders, musical notes |
| `yellow-400` | Hover border states |

---

## Neutral Palette

| Class | Usage |
|-------|-------|
| `white` | Main backgrounds, cards |
| `gray-50` | Subtle backgrounds, error state backgrounds |
| `gray-100` | Cards, loading placeholders, video backgrounds |
| `gray-200` | Borders, dividers, skeleton placeholders |
| `gray-300` | Footer dividers |
| `gray-500` | Placeholder text, secondary text |
| `gray-600` | Body text, descriptions, helper text |
| `gray-700` | Medium text, icon colors |
| `gray-800` | Section headings, button text (non-primary) |
| `gray-900` | Primary headings (h1, h2, h3) |

---

## Status Colors

Status = tertiary hue + soft recipe (`bg-[hue]-50 / text-[hue]-700 / border-[hue]-200`):

| Status | Background | Border | Text |
|--------|-----------|--------|------|
| Success | `bg-emerald-50` | `border-emerald-200` | `text-emerald-700` |
| Error | `bg-red-50` | `border-red-200` | `text-red-700` |
| Warning | `bg-amber-50` | `border-amber-200` | `text-amber-700` |
| Info | `bg-sky-50` | `border-sky-200` | `text-sky-700` |

---

## Feature Card Gradients

Used in landing page feature cards (BouncyCards):

### Learner Features
| Feature | Gradient |
|---------|----------|
| Find Perfect Teachers | `from-violet-400 to-indigo-400` |
| Flexible Scheduling | `from-amber-400 to-orange-400` |
| Progress Tracking | `from-green-400 to-emerald-400` |
| Gamified Learning | `from-pink-400 to-rose-400` |

### Teacher Features
| Feature | Gradient |
|---------|----------|
| Keep More Earnings | `from-emerald-400 to-green-400` |
| Save Time on Admin | `from-blue-400 to-cyan-400` |
| Build Parent Trust | `from-amber-400 to-orange-400` |
| Grow Your Studio | `from-violet-400 to-purple-400` |
| Professional Tools | `from-slate-400 to-gray-400` |
| Flexible Teaching | `from-pink-400 to-rose-400` |

### Gradient Text Colors
Match these with the gradients for readability:
- Violet/Indigo gradient: `text-indigo-50`
- Amber/Orange gradient: `text-orange-50`
- Green/Emerald gradient: `text-emerald-50`
- Pink/Rose gradient: `text-rose-50`
- Blue/Cyan gradient: `text-cyan-50`
- Slate/Gray gradient: `text-gray-50`
- Violet/Purple gradient: `text-purple-50`

---

## Decorative Accents

### Musical Notes
| Class | Usage |
|-------|-------|
| `text-teal-300` | Musical note decorations (learner) |
| `text-teal-400` | Musical note decorations (learner) |
| `text-amber-300` | Musical note decorations (teacher) |
| `text-amber-400` | Musical note decorations (teacher) |

---

## 3D Shadow System

Shadow RGB values for different button colors:

| Button Color | Shadow RGB |
|--------------|------------|
| Amber (primary) | `rgb(217,119,6)` |
| Yellow | `rgb(250,204,21)` |
| Light Yellow | `rgb(251,191,36)` or `rgb(245,158,11)` |
| Gray | `rgb(209,213,219)` |
| Soft-white outline ledge | `[hue]-400` at the standard `4→2→1px` depth — e.g. neutral gray-400 `rgb(156,163,175)`, amber-400 `rgb(251,191,36)`, sky-400 `rgb(56,189,248)`. The selection-grid picker flips to the selected hue's ledge on `:active`. See component-patterns.md → "Thoven 3D Button — White Outline Variant" |
| Green | `rgb(21,128,61)` |
| Blue | `rgb(29,78,216)` |
| Red | `rgb(185,28,28)` |

---

## Page & Dashboard Backgrounds

**Rule:** All dashboard/page-level backgrounds MUST use `bg-amber-50`. Never `bg-orange-50` for full-page backgrounds.

| Context | Class | Status |
|---------|-------|--------|
| Dashboard page background | `bg-amber-50` | **Required** |
| Loading/error state background | `bg-amber-50` | **Required** |
| Card/component background | `bg-white` | Standard |

**Reference:** `app/teacher/page.tsx` uses `bg-amber-50` — all teacher sub-pages must match.

---

## Color Usage Beyond Amber

Amber anchors the brand, but Thoven uses many colors for contrast, hierarchy, and semantic meaning. These 5 contexts MUST use amber — everything else follows the patterns below:

| Context | Required | Never use |
|---------|----------|-----------|
| Primary CTA buttons | `bg-amber-500` | `bg-orange-500` |
| 3D button shadows | `rgb(217,119,6)` | `rgb(194,65,12)` |
| Page/dashboard backgrounds | `bg-amber-50` | `bg-orange-50` |
| Loading spinners | `border-amber-500` | `border-orange-500` |
| Selected/active states | `bg-amber-500` | `bg-orange-500` |

### Semantic Status Colors

Use color to communicate meaning. These are established across the codebase:

| Meaning | Colors | Example |
|---------|--------|---------|
| Online/digital | `bg-sky-50 text-sky-700 border border-sky-200` | Teaching format pill on TeacherCard |
| In-person/local | `bg-emerald-50 text-emerald-700 border border-emerald-200` | Teaching format pill on TeacherCard |
| Hybrid/both | `bg-purple-50 text-purple-700 border border-purple-200` | Combined format pill on TeacherCard |
| Verified/trusted | `bg-sky-400 text-white` | Background check badge on teacher image |
| Active/success | `text-emerald-600` | Active class count, enrolled student indicator |
| Warning | `bg-amber-50 border-amber-200 text-amber-700` | Profile completion warning on dashboard |
| Error | `bg-red-50 border-red-200 text-red-700` | API error messages |
| Archive action | `text-amber-600 hover:bg-amber-50` | Archive button in class dropdown |
| Restore action | `text-sky-600 hover:bg-sky-50` | Restore button in class dropdown |
| Delete action | `text-red-600 hover:bg-red-50` | Delete button in class dropdown |
| Links/navigation | `text-sky-600 hover:underline` | Profile completion link |

### Feature Card Gradients

Landing page cards use vivid gradients to distinguish features. Each card gets a unique color pair:

| Feature | Gradient | Text color |
|---------|----------|------------|
| Find Teachers | `from-violet-400 to-indigo-400` | `text-indigo-50` |
| Scheduling | `from-amber-400 to-orange-400` | `text-orange-50` |
| Progress | `from-green-400 to-emerald-400` | `text-emerald-50` |
| Gamified Learning | `from-pink-400 to-rose-400` | `text-rose-50` |
| Earnings | `from-emerald-400 to-green-400` | `text-green-50` |
| Admin Tools | `from-blue-400 to-cyan-400` | `text-cyan-50` |
| Growth | `from-violet-400 to-purple-400` | `text-purple-50` |
| Pro Tools | `from-slate-400 to-gray-400` | `text-gray-50` |

**Reference:** `components/landing/BouncyCardsFeatures.tsx`, `components/landing/TeacherBouncyCards.tsx`

### Warm Decorative Accents (Orange family)

Orange is used for warm decorative elements that complement amber without competing:

| Context | Colors | Reference |
|---------|--------|-----------|
| Empty state dashed borders | `border-orange-200 hover:border-orange-300` | Classes page empty state |
| Icon ring accents | `ring-1 ring-orange-200` | Stacking icons in empty state |
| Subtle hover tints | `hover:bg-orange-50/30` | Empty state card hover |
| Musical note decorations | `text-teal-300`, `text-amber-300` | Landing page floating notes |
| Highlighted lesson border | `border-blue-300 bg-blue-50/30 hover:border-blue-400` | Upcoming lesson widget |
| Normal lesson border | `border-orange-100 hover:border-orange-300` | Standard lesson card |

### Tertiary Palette (Categorical)

Source of truth: `lib/student-colors.ts` exports `STUDENT_COLORS` — an 8-element readonly tuple covering these hue families: **amber, sky, emerald, purple, rose, indigo, red, teal**.

| Family | Light bg (100) | Solid bg (400) | Text (800) | Border (400) |
|---|---|---|---|---|
| amber | `bg-amber-100` | `bg-amber-400` | `text-amber-800` | `border-amber-400` |
| sky | `bg-sky-100` | `bg-sky-400` | `text-sky-800` | `border-sky-400` |
| emerald | `bg-emerald-100` | `bg-emerald-400` | `text-emerald-800` | `border-emerald-400` |
| purple | `bg-purple-100` | `bg-purple-400` | `text-purple-800` | `border-purple-400` |
| rose | `bg-rose-100` | `bg-rose-400` | `text-rose-800` | `border-rose-400` |
| indigo | `bg-indigo-100` | `bg-indigo-400` | `text-indigo-800` | `border-indigo-400` |
| red | `bg-red-100` | `bg-red-400` | `text-red-800` | `border-red-400` |
| teal | `bg-teal-100` | `bg-teal-400` | `text-teal-800` | `border-teal-400` |

**Rule:** Any hue from this 8-family palette is permitted at any Tailwind shade level when used **categorically** — status pills, per-student differentiation, identity dots, semantic badges, decorative accents. Index-based deterministic assignment via `getStudentColor(index)`.

**Used by:** `components/parent/StudentColorLegend.tsx`, `components/parent/ParentCalendarFilters.tsx`, `components/teacher/classroom/{ClassPickerGrid,ClassroomWorkspace,SmartClassSwitcher,WorkspaceContextBar,SessionCalendarPicker}.tsx`.

**Not a violation:** `bg-sky-400` on a student dot, `bg-purple-100` on a category badge, `border-rose-400` on a profile ring. These follow the categorical rule.

**Still a violation:** `bg-orange-500` on a primary CTA button (orange isn't in this palette AND CTAs are an amber-mandatory context). The 5 amber-required contexts above always win.

### Class & Code Display Colors

| Context | Colors | Reference |
|---------|--------|-----------|
| Class code container | `bg-amber-50 border-amber-200` | ClassCard code section |
| Code text | `text-amber-800` (value), `text-amber-600` (label) | ClassCard |
| Share button | `text-blue-600 hover:text-blue-700 hover:bg-blue-50` | ClassCard share action |

---

## Common Mistakes to Avoid

| Mistake | Correct |
|---------|---------|
| `orange-500` for buttons/CTAs | `amber-500` |
| `bg-orange-50` for full-page dashboard backgrounds | `bg-amber-50` |
| `rgb(194,65,12)` shadow | `rgb(217,119,6)` |
| Adding borders to 3D buttons | NO borders on Thoven buttons |
| Flagging `orange-*` in gradients/accents | These are fine — only flag interactive elements |
| Flagging tertiary palette (`bg-sky-400`, `bg-purple-100`, `border-rose-400`, etc.) on categorical surfaces | These are fine — see "Tertiary Palette (Categorical)" above |

---

## Focus States

Standard focus ring for all interactive elements:

```typescript
className="focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
```
