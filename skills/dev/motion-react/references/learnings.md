# motion-react — Learnings Log

Feedback log to improve this skill over time. When motion is implemented wrong (invented springs, missed reduced-motion, animated layout-triggering props, copied API that drifted), log it here. Periodically fold recurring entries into `SKILL.md`. Both a correction record and a learning surface.

## Entry format
```
### YYYY-MM-DD — <short title>
- **Asked:** <the request>
- **Code did:** <what was implemented>
- **Should have done:** <correct pattern>
- **Fix:** applied to <file> | deferred
```

## Entries

### 2026-05-28 — Seed
- Rule #1 is the whole point: reach for `lib/motion-config.ts` presets, never hand-roll `{ stiffness, damping }` or `{ duration }`. The most likely regression is an inline `transition={{ duration: 0.x }}` slipping in — log every instance here.
- Second watch item: animating `height`/`width` instead of `transform`/`opacity` (layout thrash). Prefer `layout` or `scaleY`.

### 2026-05-28 — cardHover + reveal transition collision
- **Asked:** hover lift + tap + scroll-reveal on one card.
- **Risk found (eval spot-check):** spreading `cardHover` AND an explicit `transition={getTransition(...)}` on the *same* `motion` element — the reveal's `transition` clobbers cardHover's baked-in `hoverSpring`, silently running hover/tap on the wrong spring.
- **Should do:** split — outer element owns the reveal transition, inner element owns `{...cardHover}`. Each behavior owns its own transition.
- **Fix:** folded a one-line caution into `SKILL.md` Core patterns (2026-05-28).
