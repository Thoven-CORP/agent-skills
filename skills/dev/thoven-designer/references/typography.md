# Thoven Typography Guide

Font usage rules for the Thoven music education platform.

---

## Font Families

| Font | Class | Usage |
|------|-------|-------|
| **Fredoka** | `font-display` | Display/decorative, headers only |
| **Montserrat** | `font-sans` | Primary UI font, everything else |
| **Monospace** | `ui-monospace` | Code and technical content |

### Available Weights
Both fonts support: 400, 500, 600, 700

---

## The Golden Rule

**Fredoka is for headers, titles, and secondary labels that carry meaning. Everything else uses Montserrat.**

---

## Fredoka (`font-display`) Usage

Use Fredoka for:
- Page titles (`<h1>`, `<h2>`)
- Section headers (`<h3>`, `<h4>`)
- Card titles
- Modal/panel headers (title text only, NOT descriptions)
- Navigation menu labels (top-level only)
- **Accent labels and meaningful tags** — Fredoka works well on small labels that carry identity or significance beyond plain UI chrome. Use it when the label is something the user should *notice* and *feel*, not just read. Examples:
  - Credential type pills (`DEGREE`, `AWARD`, `CERTIFICATION`)
  - Instrument tags on teacher cards
  - Achievement/milestone labels (e.g., "5-Year Veteran", "Top Rated")
  - Category labels that define what something *is* (not status or state)
  - Year/date accents on cards where the date is part of the identity (e.g., credential year)
  - **When NOT to use**: status badges (Active/Inactive), notification counts, error/warning labels, filter chips, form validation — these are functional UI and stay `font-sans`
  - **When in doubt**: If a label falls in a gray area between identity and utility — ask the founder using `AskUserQuestion` before deciding. Frame it as: "This label feels like it could go either way — should [element] use Fredoka (warm/personality) or Montserrat (clean/functional)?" Never guess on font choice for ambiguous cases.

### Examples

```tsx
// Decorative accent badge (credentials, awards, qualifications)
<span className="font-display font-semibold text-[10px] uppercase tracking-wider
  px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
  DEGREE
</span>

// Page title
<h1 className="font-display font-bold text-3xl text-gray-900">Dashboard</h1>

// Section header
<h2 className="font-display font-semibold text-2xl text-gray-800">Your Classes</h2>

// Card title
<h3 className="font-display font-bold text-xl">Upcoming Lesson</h3>

// Modal header
<DialogTitle className="font-display font-bold text-xl">Edit Profile</DialogTitle>
```

---

## Montserrat (`font-sans`) Usage

Use Montserrat for EVERYTHING else:
- **ALL buttons** (primary, secondary, outline, ghost, etc.)
- **ALL form inputs** (text fields, textareas, selects)
- **ALL labels** (form labels, input labels, field descriptions)
- Body text and paragraphs
- Lists (ordered and unordered)
- Table content
- Badge and tag text (except decorative accent badges — see Fredoka section)
- Tooltips and popovers
- Error messages and validation text
- Descriptions and subtitles (even in headers)
- Navigation subtext
- ALL interactive elements (links, tabs, dropdown items)

### Examples

```tsx
// Button - ALWAYS font-sans
<button className="font-sans font-bold bg-amber-500 text-white">
  Save Changes
</button>

// Form label - ALWAYS font-sans
<label className="font-sans font-medium text-sm text-gray-700">
  Email Address
</label>

// Input - ALWAYS font-sans
<input className="font-sans text-gray-900" placeholder="Enter email" />

// Body text
<p className="font-sans text-gray-600">
  Welcome to your dashboard. Here you can manage your classes.
</p>

// Badge
<Badge className="font-sans text-xs">New</Badge>

// Error message
<span className="font-sans text-sm text-red-500">This field is required</span>
```

---

## Header with Description Pattern

When a header has a subtitle or description, the title uses Fredoka but the description uses Montserrat:

```tsx
// CORRECT
<div>
  <h2 className="font-display font-bold text-2xl text-gray-900">
    Booking Requests
  </h2>
  <p className="font-sans text-sm text-gray-600">
    View and manage your lesson requests
  </p>
</div>
```

---

## Anti-Patterns (DO NOT DO THIS)

### Button with Fredoka
```tsx
// WRONG
<button className="font-display font-bold">Click Me</button>

// CORRECT
<button className="font-sans font-bold">Click Me</button>
```

### Form Label with Fredoka
```tsx
// WRONG
<label className="font-display">Email Address</label>

// CORRECT
<label className="font-sans font-medium">Email Address</label>
```

### Input with Fredoka
```tsx
// WRONG
<input className="font-display" />

// CORRECT
<input className="font-sans" />
```

### Description with Fredoka
```tsx
// WRONG
<p className="font-display text-gray-600">Some description text</p>

// CORRECT
<p className="font-sans text-gray-600">Some description text</p>
```

---

## Complete Component Examples

### Primary Button
```tsx
<button className="bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold
  rounded-lg px-4 py-2
  shadow-[0_4px_0_0_rgb(217,119,6)]
  hover:shadow-[0_2px_0_0_rgb(217,119,6)]
  active:shadow-[0_1px_0_0_rgb(217,119,6)]
  active:translate-y-1 transition-all duration-200">
  Book Lesson
</button>
```

### Form Field
```tsx
<div className="space-y-1">
  <label className="font-sans font-medium text-sm text-gray-700">
    Student Name
  </label>
  <input
    type="text"
    className="font-sans w-full px-3 py-2 border border-gray-200 rounded-lg
      focus:ring-2 focus:ring-amber-300 focus:outline-none"
    placeholder="Enter student name"
  />
  <p className="font-sans text-xs text-gray-500">
    This will appear on lesson certificates
  </p>
</div>
```

### Section with Cards
```tsx
<section>
  <h2 className="font-display font-bold text-2xl text-gray-900 mb-4">
    Your Students
  </h2>

  <div className="grid gap-4">
    {students.map(student => (
      <div key={student.id} className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-display font-semibold text-lg text-gray-800">
          {student.name}
        </h3>
        <p className="font-sans text-sm text-gray-600 mt-1">
          {student.instrument} - {student.level}
        </p>
        <button className="font-sans font-medium text-amber-600 hover:text-amber-700 mt-2">
          View Progress
        </button>
      </div>
    ))}
  </div>
</section>
```

---

## Quick Reference Table

| Element | Font | Weight |
|---------|------|--------|
| h1, h2 | `font-display` | `font-bold` |
| h3, h4 | `font-display` | `font-semibold` |
| Card titles | `font-display` | `font-bold` |
| Modal titles | `font-display` | `font-bold` |
| **Buttons** | `font-sans` | `font-bold` |
| **Labels** | `font-sans` | `font-medium` |
| **Inputs** | `font-sans` | (default) |
| Body text | `font-sans` | (default) |
| Descriptions | `font-sans` | (default) |
| Links | `font-sans` | `font-medium` |
| Badges (functional/status) | `font-sans` | `font-medium` |
| Labels (identity/accent) | `font-display` | `font-semibold` |
| Error text | `font-sans` | (default) |
