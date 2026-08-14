# Routing requests to skills

Classifies user requests and routes to the correct skill. Domain skills take priority over universal skills. **This skill names destination skills only — it never describes their internal modes, phases, or counts** (those drift). When invoked, the destination skill speaks for its own structure.

## When to Use

- User gives an ambiguous or multi-part request
- Starting a new task and unsure which skill applies
- Need to chain multiple skills in sequence

## When NOT to Use

- User explicitly names a skill (e.g., "/investigate", "/verify") — just use it
- Simple question that doesn't need a workflow
- Already mid-execution of another skill

---

## Design Stack Architecture (read before routing design work)

Design work routes through a layered stack — pick the entry point that matches the request's scope:

1. **`thoven-designer`** — brand meta-enforcer. Entry point for any *new* component, page, or redesign. Owns dedup check, wireframe gate, design spec, brand compliance.
2. **`/impeccable <verb>`** — opt-in domain quality. Entry point for verbs the user explicitly says: `critique`, `audit`, `polish`, `clarify`, `harden`, `onboard`, `animate`, `bolder`, `quieter`, `distill`, `colorize`, `typeset`, `layout`, `delight`, `overdrive`, `adapt`, `optimize`. Reads PRODUCT.md + DESIGN.md as context. Use when the request is about *quality* on existing work, not building new.
3. **`motion`** — motion decision + feel vocabulary. Entry point when the user is unsure *which* animation approach to use, or describes a *feel*. Routes to **`motion-react`** (Framer Motion + CSS, default for React UI motion) or the **`gsap-*`** skills (scroll-scrubbed/pinned + complex timelines: `gsap-core`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-plugins`, `gsap-performance`, `gsap-frameworks`, `gsap-utils`). Load the specific implementation skill once the layer is chosen.
4. **`wireframe` / `design-research`** — UX exploration. Use inside thoven-designer Phase 1.5 or for external pattern hunting.

If the request straddles two layers (e.g. "design a new animated card"), route to thoven-designer first — it will recommend impeccable / GSAP as opt-in layers inside its own phases.

## Classification Table

| Category | Signal Words | Route To |
|----------|-------------|----------|
| **Feature Development** | "build", "create", "add feature", "new page", "implement", multi-file, 3+ concerns | `/dev` |
| **Quick Design/Ideation** | "redesign", "what if", brainstorm-only (no implementation) | `superpowers:brainstorming` |
| **Planning Only** | "plan", "break down", "scaffold", "spec" (no build needed) | `superpowers:writing-plans` |
| **Bug/Debug** (runtime) | "bug", "broken", "not working", "crash", "throws", "500", "doesn't render", "race condition" | `investigate-thoven` |
| **Verification** | "check", "verify", "review", "ready to commit" (NOT design craft — see Design Quality Review below) | `verify` |
| **Session** | "where was I", "continue", "resume", "start session" | `session-management` |
| **Commit/Deploy** | "commit", "push", "publish", "release", "deploy", "stage" | `publish` |
| **Design System / Component** (NEW work) | "design", "component", "thoven style", "brand", "new card", "new panel", "scaffold component", "redesign" | `thoven-designer` |
| **Design Quality Review** (existing work) | "critique", "audit [design/UX/craft]", "does this hold up", "is this on-brand", "review the visual" | `/impeccable critique` (UX heuristics) or `/impeccable audit` (a11y + perf + responsive technical pass) |
| **Design Polish** (pre-ship) | "polish", "final pass", "before we ship the look", "tighten this up" | `/impeccable polish` |
| **Voice / Copy / Tone** | "copy feels off", "tone is jarring", "rewrite this error", "label is confusing", "error messages feel SaaS-y" | `/impeccable clarify` (or `thoven-designer` if visual treatment also changes) |
| **Motion / Animation** | "add animation", "scroll effect", "parallax", "fade up", "spring", "GSAP", "stagger", "motion design", "what animation should I use", "make this feel snappy/elegant/playful" | `motion` (decides the layer, then routes to `motion-react`, `gsap-*`, or gated Lenis) |
| **Make it bolder / quieter / more delightful** | "too bland", "too loud", "more personality", "feels safe", "amp it up", "tone it down" | `/impeccable bolder`, `/impeccable quieter`, `/impeccable delight`, `/impeccable distill` |
| **Production hardening** | "edge cases", "error states", "first-run", "empty states", "i18n", "harden this" | `/impeccable harden` (edge cases) or `/impeccable onboard` (first-run) |
| **Strategic design context (PRODUCT.md)** | "design principles", "what's our register", "set up PRODUCT.md", "what does the brand stand for" | `/impeccable teach` |
| **Strategy** | "strategy", "pricing", "growth", "fundraise", "board" | `thoven-boardroom` |
| **Market Research** | "market", "TAM", "competitors", "investors", "pitch" | `market-research-vc-intelligence` |
| **Product Ideas** | "feature ideas", "prioritize", "RICE", "roadmap" | `product-strategy-brainstorming` |
| **First Principles** | "should we", "pivot", "focus", "stage-appropriate" | `founder-first-principles-framework` |
| **Learning Science** | "pedagogy", "learning", "practice", "curriculum" | `edtech-learning-science` |
| **Customer Obsession** | "user experience", "11-star", "NPS", "referral", "peak moments", "delight strategy" | `customer-obsession-design-thinking` |
| **Pre-ship QA gate** | "qa", "test the site", "find bugs", "pre-ship test", "health score" | `/qa --diff-aware` (feature branches) or `/qa --standard` (pre-publish) |
| **QA Runbook** | "testing runbook", "manual test", "smoke test", "walkthrough" | `manual-qa` |
| **Accessibility (deep)** | "a11y audit", "WCAG audit", "screen reader pass", "deep accessibility review" | `/impeccable audit` (default — deeper technical pass) |
| **Accessibility (lightweight)** | "quick a11y check", "is this WCAG AA", narrow focused-scope a11y question | `accessibility-check` (lightweight alternate) |
| **Mobile** | "mobile", "responsive", "touch", "breakpoints" | `mobile-audit` or `/impeccable adapt` (for cross-device redesign) |
| **SEO** | "SEO", "resource page", "organic", "content" | `seo-resource-page` |
| **Email** | "write email", "draft email" | `email-writing` |
| **API** | "new endpoint", "API function", "fetch wrapper" | `api-endpoint` |

---

## Full Skill Inventory

Claude Code injects every available skill and agent with its description into each session — that injected list is the complete inventory, and duplicating it here causes drift.

For **which one to pick when several match**, see `.claude/docs/SKILL_AND_AGENT_ROUTING.md` — disambiguation of ambiguous phrases ("audit the codebase", "write a plan", "review the code"), skill-vs-skill "NOT for X" notes, `workspace` work-state verbs, and agent model tiers.

---

## Skill Chains (Common Patterns)

| Pattern | Chain |
|---------|-------|
| New feature (full lifecycle) | `/dev` (handles INTAKE → SHIP internally) |
| Bug report | `investigate-thoven` → `verify` |
| Feature complete | `/qa --diff-aware` → `verify` → `publish` |
| Complex design with planning | `superpowers:brainstorming` → `feature-orchestrator` |
| Strategy session | `thoven-boardroom` → `product-strategy-brainstorming` |
| New page/component | `thoven-designer` → `verify` |
| New page/component with motion | `thoven-designer` (Phase 2 design) → `motion` (pick layer + preset) → `motion-react` or `gsap-*` (Phase 3 implementation) → `verify` |
| Design quality review at GATE 2 | `thoven-designer` Phase 2 → `/impeccable critique` (opt-in) → resume GATE 2 |
| Pre-ship design pass | `/impeccable polish` → `/impeccable audit` (deep a11y/perf) → `/qa --standard` → `publish` |
| Bland or templated design | `/impeccable bolder` or `/impeccable delight` (existing surface, no rebuild) |
| Voice/tone rewrite | `/impeccable clarify` (copy only) or `thoven-designer` (if visual also changes) |
| First-run / activation polish | `/impeccable onboard` (empty states, first lesson, signup) |
| Production hardening | `/impeccable harden` (edge cases, errors, i18n) → `verify` |

---

## Model Selection Guidance

| Complexity | Model | Examples |
|-----------|-------|---------|
| Complex reasoning, architecture, multi-file | Opus | `feature-orchestrator`, `investigate-thoven` (CRITICAL severity), `superpowers:brainstorming` (Deep) |
| Standard implementation, single concern | Sonnet | Most tasks, standard `verify`, component work |
| Quick lookups, simple generation | Haiku | Quick `verify`, simple questions, formatting |

---

## Rules

- Domain skills ALWAYS take priority over universal skills
- If user names a specific skill, use it directly — don't re-route
- If task spans multiple categories, recommend the FIRST skill in the chain
- Present routing as a suggestion, not a mandate — user can override
- For ambiguous requests, ask one clarifying question before routing
- Keep this simple: classify -> route -> done. Don't over-think.
