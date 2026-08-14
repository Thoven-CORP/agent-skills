# Anchor file template

When the user pins a `★ Design Reference` result, write (or append to) `docs/superpowers/anchors/<feature>-anchors.md` using the structure below.

If the file already exists, append a new `## Anchor: ...` section. Do not overwrite earlier anchors.

---

```markdown
# Design Anchors — <feature-slug>

Pinned design references for the <feature-slug> feature in thoven-designer.
Phase 1.5 (wireframe) and Phase 2 (ui-designer / design spec) read this file as visual context.

## Anchor: <app-name> — <screen-or-flow-name>

**Pinned:** YYYY-MM-DD
**Source:** Mobbin · app=<name> · screen=<id> · flow=<name>
**URL:** <mobbin-url>
**Image:** ./img/<feature-slug>/<screen-id>.png
**Why this resonates:** <one-line note from user, prompted at pin time>

### Colors observed
- #hex / #hex / #hex (dominant via Mobbin)

### Pattern observed
- <bullet>
- <bullet>

### Brand verdict — ✅ / ⚠️ / ❌
- ✅ <what matches Thoven>
- ⚠️ <what needs transformation>
- ❌ <what conflicts and must be replaced>

### Thoven transformation
- <how to apply this pattern in Thoven>
- <color/typography/animation swaps>
- <what to keep, what to drop>
```

## Multi-anchor feature

A feature can accumulate several anchors over a session — each pin appends a new `## Anchor: ...` section. Phase 2/3 reads the entire file and treats each anchor as one of the variant seeds.

## File location convention

- `docs/superpowers/anchors/<feature-slug>-anchors.md` — the markdown
- `docs/superpowers/anchors/img/<feature-slug>/<screen-id>.png` — downloaded screenshots

`<feature-slug>` derivation order:
1. Active `dev-pipeline-frontend` feature MANIFEST `feature_slug` field
2. thoven-designer current feature name (kebab-cased)
3. Prompt user with a sensible default
