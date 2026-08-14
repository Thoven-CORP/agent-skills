# Thoven Brand Identity & Design Philosophy

What makes a design feel "Thoven" — beyond just using the right color tokens.

---

## Brand Personality

Thoven is a **music education marketplace for families**. The design should feel:

- **Warm and inviting** — Parents are trusting us with their kids. The UI should feel safe, friendly, and approachable.
- **Playful but not childish** — Duolingo-inspired energy without being a kids' app. Parents are the buyers.
- **Confident and clear** — Clean layouts, strong visual hierarchy, no visual clutter.
- **Handcrafted, not templated** — Every component should feel intentional. Avoid generic SaaS/dashboard aesthetics.

### The Thoven Feeling

When you look at a Thoven page, it should feel like a well-designed children's book cover — warm colors, bold typography, tactile depth (3D buttons), and breathing room. NOT like a B2B dashboard or a generic AI-generated landing page.

---

## Design Language: 3D Depth

Thoven's signature is **tactile 3D buttons** — they look like physical objects you can press. This comes from Duolingo's playful depth.

**Where 3D works:**
- Primary CTA buttons (Book Lesson, Get Started, Sign Up)
- Interactive toggles and role switchers (the selected state)
- Gamified elements (student XP, achievements)

**Where 3D does NOT work:**
- Non-interactive cards and containers
- Text badges and labels
- Navigation links
- Informational notices

The 3D shadow is reserved for elements that **respond to interaction**. Don't put depth on static content.

---

## Skeuomorphic Play: Real-World & Musical References

This is Thoven's secret weapon. The best edtech apps make learning feel tangible by borrowing from the physical world — and since this is a *music education* platform, there's a rich visual vocabulary to draw from.

### The Principle

Occasionally mimic real-world educational and musical objects in the UI. This creates delight, makes the app feel handcrafted, and reinforces the music learning context. But it must be done with **taste and restraint** — one or two per page, not everything.

### Existing Examples in the Codebase

| Component | Real-World Reference |
|---|---|
| Student calendar date badges | Look like a physical tear-off calendar page |
| Homework assignments panel | Styled like notebook paper with lines |
| Student XP thermometer | Mimics a real thermometer filling up |

### Musical & Educational Ideas to Consider

When designing new features, consider whether a musical or educational metaphor could make it more delightful:

- **Progress tracking** → Sheet music staff where notes fill in as lessons complete
- **Achievement badges** → Gold records, treble clefs, musical note shapes
- **Lesson scheduling** → Metronome-inspired tempo/rhythm for recurring patterns
- **Practice logs** → Piano keys as progress bars (keys light up as minutes add up)
- **Student profiles** → Backstage pass or concert ticket aesthetic
- **Loading states** → Musical notes bouncing, tuning fork vibrating
- **Empty states** → "Your stage is empty — book your first lesson!" with a spotlight illustration
- **Notifications** → Sheet music snippet: "You have a new note from your teacher"

### Consumer EdTech Inspiration

Look at how the best consumer education apps create delight:

| App | What They Do Well |
|---|---|
| **Duolingo** | Streak flames, celebration confetti, character reactions, lesson completion feels like a game level |
| **Khan Academy** | Energy points with avatar customization, mastery progress as a growing tree |
| **Yousician** | Guitar neck visualization, real-time feedback with musical staff, instrument-specific UI |
| **Simply Piano** | Piano roll interface that mirrors real sheet music, satisfying note-hit animations |
| **Fender Play** | Chord diagrams that look like real fretboards, warm photography, backstage aesthetic |
| **Playground Sessions** | Split-screen piano view, real-time note tracking on staff paper |

### Rules for Skeuomorphic Design

1. **One per feature, max.** A calendar that looks like a real calendar is charming. A calendar on notebook paper with piano key borders and a treble clef header is chaos.
2. **It must be functional.** The notebook paper lines on homework aren't just decorative — they reinforce "this is an assignment." If the metaphor doesn't add meaning, skip it.
3. **Taste over novelty.** The idea should make someone smile, not wince. When in doubt, go clean.
4. **Pitch it, don't force it.** When the skill presents design options (Phase 2), include one option with a creative skeuomorphic touch alongside a clean standard option. Let the founder decide.
5. **Mobile-first.** Skeuomorphic details that work on desktop may be too small or cluttered on mobile. Always check.

### When Presenting Design Options

When the skill reaches Phase 2 (design specification) and the context allows for creative expression, present options like:

- **Option A (Clean):** Standard Thoven design — amber accents, white cards, clean layout
- **Option B (Creative):** Same layout but with a musical/educational metaphor — e.g., "What if the lesson schedule looked like a concert setlist?"

The founder picks. Don't default to the creative option — pitch it as a possibility.

---

## Visual Hierarchy Principles

### 1. Selected vs Unselected States
When one element is "active" and another is "inactive" (tabs, toggles, filters):
- **Selected**: Strong visual presence — `bg-amber-500 text-white`, 3D shadow, confident
- **Unselected**: Recedes — `bg-white text-gray-600`, no shadow, no competing color
- **Never** give both states the same visual weight. The whole point is contrast.

### 2. Less is More with Decoration
- Don't decorate every card with accent bars, icons, and colored badges
- One decorative element per card maximum
- White space is a design choice, not emptiness to fill

### 3. Color Restraint
- Amber is the primary accent — use it sparingly so it pops
- Most of the page should be white/gray neutral
- Multi-colored elements (different colors per card) should be rare and intentional

---

## AI-Generated Design Anti-Patterns

These patterns scream "an AI made this." Avoid them.

### 1. Icons on Everything
AI loves adding an icon to every card, every section header, every list item. Thoven is selective with icons.

**When to use icons:**
- Navigation (sidebar, menus)
- Empty states (one large icon as visual anchor)
- Inline with action buttons (small, supporting)
- How-it-works steps (one icon per step is fine)

**When NOT to use icons:**
- Every card in a feature grid (the text should speak for itself)
- Next to every heading
- Decorative icon circles above section titles
- When you're adding an icon just because a space "feels empty"

**Test:** Remove the icon. Does the design still work? If yes, you didn't need it.

**Which icon system (Iconography Hierarchy):** Thoven uses **two** systems, chosen by size/prominence:

- **Tier 1 — large / primary / hero → custom icons + OpenMoji.** The big, expressive anchor icons (empty states, onboarding, value props, celebratory peaks, the focal icon on a card). Render OpenMoji through the `<Emoji char="…" />` primitive (`components/ui/emoji.tsx`); use `lib/openmoji.ts` / `OpenMojiIcon` for codepoint cases; custom brand/instrument assets live in `components/icons/`, `public/icons/`, `lib/instrument-icons.ts`.
- **Tier 2 — small / secondary / utility → Phosphor (`@phosphor-icons/react`).** Inline icons inside buttons, controls, status pills, and metadata.

**Emoji nuance — do NOT read this as "no emoji at all" or "Phosphor only":** the anti-pattern is **raw/literal OS emoji dropped in as lazy decoration** (typing `🎵` straight into JSX as a substitute for a real icon). **OpenMoji is explicitly allowed** — it *is* the sanctioned Tier-1 system, rendered as consistent color SVGs via `<Emoji>`. Literal OS emoji = bad; OpenMoji = correct.

### 2. Left-Hand Colored Accent Bars
A vertical colored stripe on the left side of a card (`absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500`). This is a generic SaaS/dashboard pattern, not Thoven. It looks clinical, not warm.

**Instead:** Use the card's overall background, a subtle border, or nothing. Let the content carry the card.

### 3. Colored Badge Pills Everywhere
Adding `bg-blue-50 text-blue-700` or `bg-amber-50 text-amber-700` pills to every card. This is fine when the badge communicates real status (Online/In-Person on teacher cards), but becomes noise when every card has a decorative subtitle badge.

**Rule:** Only use colored badge pills for:
- Status indicators (Active, Pending, Verified)
- Category labels that help users filter/scan (instrument type, lesson format)
- NOT for decorative subtitles or card categories that are obvious from context

### 4. Rainbow Card Grids
Each card in a grid having a different accent color (card 1 = amber, card 2 = teal, card 3 = blue, card 4 = emerald). This creates visual chaos and fights with the amber brand color.

**Instead:** Use consistent amber accents, or use neutral styling with amber as the single pop of color.

### 5. Overly Structured Cards
Every card having: icon circle → badge pill → title → description → button. Not every card needs all five elements. Match the structure to the content.

### 6. Gradient Text on Everything
`bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent` on headings. This is overused in AI designs. Use solid `text-gray-900` for headings, with amber only on specific accent words via `<span className="text-amber-500">`.

---

## Inspiration Sites — What to Take from Each

### Duolingo (`duolingo.com`)
**Take:** 3D button depth, playful micro-interactions, celebration moments (confetti), progress visualization, rounded shapes
**Avoid:** The green-heavy palette, overly gamified everything, mascot-driven design

### Preply (`preply.com`)
**Take:** Teacher card layout (avatar + rating + price + CTA), search/filter UX, booking flow structure, how they present teacher credentials
**Avoid:** Dense information layouts, small text, corporate feel

### Airbnb (`airbnb.com`)
**Take:** Card design (image + clean info + price), whitespace usage, search UX, how listings balance info density with readability, the booking confirmation flow
**Avoid:** Photo-heavy layouts (we don't have listing photos), the neutral/minimal color palette

### Notion (`notion.so`)
**Take:** Clean spacing, sidebar navigation patterns, content hierarchy, how they handle empty states
**Avoid:** Monochrome aesthetic, developer-oriented density, minimal color

### Linear (`linear.app`)
**Take:** Crisp typography, keyboard shortcuts, subtle hover animations, command palette pattern
**Avoid:** Dark mode aesthetic, technical density, developer-focused UX

### Anthropic (`anthropic.com`)
**Take:** Typography hierarchy, section spacing, how they use one accent color effectively, sophisticated simplicity
**Avoid:** Corporate/institutional feel, muted palette, text-heavy layouts

---

## Quick Decision Framework

When designing a new element, ask:

1. **Would a parent feel comfortable seeing this?** — Warm, trustworthy, not flashy
2. **Does it feel handcrafted or templated?** — If you've seen this exact layout on 10 SaaS sites, rethink it
3. **Is amber earning its presence?** — Every amber element should have a reason
4. **Could I remove a decoration and improve it?** — Probably yes
5. **Does the selected state clearly win over the unselected?** — Contrast, not competition
