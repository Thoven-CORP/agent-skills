---
name: design-research
description: Fetches external brand assets, UI patterns, and tagged screen flows from Mobbin (600k+ app screens) or Context.dev (any public website). Use when you need to study competitor UI ("how does Duolingo do streaks"), match an integration partner's visual style ("daily.co overlay"), pull design system specs ("shadcn buttons"), or hunt for tagged patterns ("checkout flows in fintech apps"). Trigger on "/design-research [target]", "how does X do Y", "I wonder how X does Y", "reference X's style", or when thoven-designer Phase 0 identifies an external reference.
---

# Design Research Skill

Fetches structured brand data, UI patterns, and tagged screen flows from external sources, annotates them against Thoven's brand, and curates insights for your current design task.

## Pitfalls

- Start inspiration research from Andres's reference images and DESIGN.md "Brand atmosphere", put his picks on the board first, and open and judge every pulled image against them before keeping it. (LEARNINGS 2026-10-09)
- Keep every variant of a surface in one hue, amber first; vary layering, contrast, layout, copy and details, and make hue a later pass. (LEARNINGS 2026-10-09)
- When the design work is a dump of UI cuts and moves, skip research and edit the components directly, one commit per dump section, with no engineering steps added. (LEARNINGS 2026-09-03)

## Backends

This skill has two backends. The agent picks one per query.

| Backend | Best for | Tools |
|---|---|---|
| **Mobbin** | Tagged screens & flows from 600k+ real apps. Use when target is an app name, or when you want patterns by UI element, action (onboarding, checkout), or visible text. | `mcp__mobbin__*` |
| **Context.dev** | Brand colors, fonts, scraped page markdown, screenshots from any public URL. Use for design systems, integration partners, or marketing sites. | `mcp__context_dev_api__*` |

## Usage

**Slash command:**
```
/design-research duolingo                          → Mobbin (named app)
/design-research how does Calm do daily streaks    → Mobbin (app + screen concept)
/design-research checkout flows in fintech         → Mobbin (broad pattern)
/design-research daily.co video overlay UI         → Context.dev (URL/site)
/design-research shadcn button and form patterns   → Context.dev (design system)
```

**Curiosity trigger inside thoven-designer Phase 0:**
> "I wonder how Notion does empty states."

The skill fires automatically. The agent picks the backend.

## Routing summary

The dispatched agent picks the backend per query. High-level rule:

- **Named app or tagged screen/flow concept** → Mobbin
- **URL, domain, or design system specs** → Context.dev
- **Ambiguous** → agent asks one disambiguating question before fetching

The agent file (`.claude/agents/design-researcher.md`) holds the full query-shape decision table.

## Output format

Always inline. Mobbin results carry an annotated brand verdict (`✅ / ⚠️ / ❌`); Context.dev results keep the original schema.

```
★ Design Reference: Calm — Daily Streak Panel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE  Mobbin · app=Calm · screen=#a8f3 · flow=onboarding-day-3
COLORS  #1B3A5C / #FFFFFF / #FFD53D (dominant via Mobbin)

PATTERN OBSERVED
  • Streak counter as oversized numeral, breath-glow animation
  • Below-the-fold "Don't break the chain" copy

BRAND VERDICT  ⚠️ Partial fit
  ✅ Oversized numeral + glow — matches Thoven's playful 3D depth
  ⚠️ Cool blue palette — needs transformation to amber-500/amber-100
  ❌ Modal-style dark backdrop — Thoven uses spring panels, no backdrop

THOVEN TRANSFORMATION (only renders when verdict ⚠️ or ❌)
  • Replace blue (#1B3A5C) → amber-500 + amber-50 background
  • Drop modal backdrop, render as floating panel with spring(500/35/0.6)
  • Keep numeral hierarchy + glow; map glow to rgb(217,119,6) shadow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ Pin as anchor for "<feature>"? Reply "pin" or "skip" ]
```

The agent derives verdicts from `.claude/skills/thoven-designer/references/brand-identity.md` (anti-pattern checklist: rainbow cards, icon overload, dark backdrops, left accent bars, gradient text, badge-pill noise, etc.).

## Pinning workflow

- **Default:** the ★ block prints in chat. No file written. Conversation continues.
- **Pin:** when user replies `pin` / `save this` / `use for spec`, the skill writes (or appends to) `docs/superpowers/anchors/<feature>-anchors.md` using `references/anchor-template.md`. It downloads the screen image to `docs/superpowers/anchors/img/<feature>/<screen-id>.png` (Q2=C: pinned only).
- **Feature slug:** auto-detect from active dev-pipeline MANIFEST or thoven-designer feature name. If neither is present, prompt the user with a default.

## thoven-designer integration

- **Phase 0:** This skill fires on "I wonder how X does Y" or when an external reference is named. Mobbin is the inspiration backbone for tagged screens; the curated 6-site list (Duolingo/Preply/Airbnb/Notion/Linear/Anthropic) remains the **primary taste filter** — Mobbin fills gaps and replaces WebFetch when looking up curated apps.
- **Phase 1.5 (wireframe):** before generating layout variants, read `docs/superpowers/anchors/<feature>-anchors.md` if present and seed each variant with a pinned anchor.
- **Phase 2 (design spec):** include anchor file content in the ui-designer agent prompt as visual context alongside the approved wireframe.

## Setup (one-time)

> **STALE SETUP REMOVED (2026-07-10):** the `mobbin-mcp` npm package does not exist (npm ETARGET — never published). The only registry alternative (`@aos-engineer/mobbin-mcp`) is a week-old anonymous package that would hold the user's Mobbin session cookie — do not install without a source review and explicit user sign-off.
>
> **Current Mobbin access path:** use **claude-in-chrome** on the user's logged-in mobbin.com session — browse/search patterns, screenshot screens, and assemble annotated galleries (Playwright `channel:'chrome'` capture + side-by-side `gallery.html`, see improvement `fi-t36o0`). Everywhere this skill says "Mobbin backend / `mcp__mobbin__*` tools", route through claude-in-chrome instead until a legitimate Mobbin MCP exists.

Context.dev MCP is already configured (key can deplete — on `401 credits depleted`, fall back to WebFetch/Playwright captures).

## Multiple references in one session

Run them sequentially, printing each result block before the next fetch.

```
/design-research duolingo gamification XP
/design-research khan-academy student progress
/design-research calm daily streak panel
```

## How to run

Dispatch the `design-researcher` agent with:
- `target`: app name, URL, or design system
- `context` (optional): what you're currently designing

The agent picks the backend, calls the right MCP tools, applies the brand verdict, prints inline. Do NOT save to a file unless the user pins.

## References

- [anchor-template.md](references/anchor-template.md) — file template for pinned anchors
- `.claude/skills/thoven-designer/references/brand-identity.md` — anti-pattern source-of-truth for verdicts
