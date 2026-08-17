# Learnings — thoven-designer

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-08-16 — Split. The skill was two jobs, and described only one

**What happened.** Andres: *"that's not what the skill should be doing… we changed it to be the
mapping for the design system."* He was right, and the change had been made — just not in this
file. `design-system-guide.md`'s routing table already assigned `thoven-designer` the lookup role
("checking one component against `components/ui/` + the library tables + the lexicon"), and
`design-workflow-outline` pointed single-component work here. But `SKILL.md` still opened with
*"Designs and implements…"* and a mandatory five-phase build ceremony, and mentioned neither the
lexicon, the guide, the library tables, nor the Tier 0–3 map.

**Why it mattered more than a stale description.** `frontend/DESIGN.md:79-81` says *"that skill is
a detailed build guide, not the design system, and this file does not govern it."* So the repo's
own hub doc disowned the skill that the routing table was sending design-system questions to. A
competent agent asked such a question **correctly routes around the skill.**

**Measured, not assumed.** A baseline agent was asked one status-pill question with the old setup:

| | Old (baseline) | New (mapper) |
|---|---|---|
| Invoked the skill | **No — declined**, as "a competing voice" | **Yes**, first action, before repo access |
| Tool calls | 22 | 14 |
| Tokens | ~90k | ~77k |
| Unsourced value in the answer | **Yes** — picked a hue by judgement | **No** — named it unruled, routed to Andres |
| Citations | partial | `file:line` for every value |

**What changed.**
- The build ceremony moved out verbatim to `building-thoven-ui` (`git mv`, history and
  `references/` intact). This file became the **index**.
- **The index states no values.** Any number here becomes the sixth contradicting document — the
  frontend already survived five docs in a citation cycle with 21 contradictions. Pointers and
  procedures only.
- The map names the binding layer per question, including two the guide's own map omitted:
  `tools/build-palette.mjs` and `thovenButtonTokens` at `lib/live-lesson-tokens.ts:53`.
- "If nothing binds it, say so" earned its place immediately: the baseline invented a ruling for a
  missed-lesson hue; the mapper run refused and sent it to a decision log.
- The silent-failure checks earned theirs too — they are what made the GREEN run catch that
  `success-pill.tsx` ships `green-*`, a hue absent from `PALETTE`, silently falling through to
  stock Tailwind.
- The audit scenario moved here from the builder, because the eval itself said the standalone
  audit is *"the most common in-the-wild use of the skill"* — that is a checking job, not a
  building one. Its value-specific assertions were rewritten as sourcing assertions, for the same
  reason the skill carries no values.

**Not yet done.**
1. `frontend/DESIGN.md:79-81` still points at `.claude/skills/thoven-designer/references/`, which
   moved to `building-thoven-ui/`. The frontend repo had uncommitted work, so it was left alone.
2. `references/brand-colors.md` and `references/typography.md` went with the builder, but they
   duplicate `docs/design/color.md` and `docs/design/typography.md`. That duplication *is* the
   citation-cycle disease and wants a real cleanup, not a move.
3. The GREEN run was one scenario. The audit eval has not been run against a cold agent.

**Deployment note that caused the original loss.** `~/.agents/skills/` is a **copy**, not the
source — `npx skills update` re-copies from `Thoven-CORP/agent-skills` and overwrites it. Every
skill dir in the store shares one `Aug 15 01:12` timestamp from a single bulk re-copy. An earlier
version of this rewrite almost certainly died that way. **Edit upstream, then sync down.**
