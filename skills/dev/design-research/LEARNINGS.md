# Learnings — design-research

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-09 — Variants stay in one hue

> reflect · 2026-10-09 · memory:feedback_variants_one_hue · correction · applied · seen 1

**What happened.** On the passport cover (THV-1244) a sky "hue swap" variant sat beside the amber ones. Andres said variants should not vary by a whole different colour.
**Why.** The colour system supplies other hues later by swapping the ramp. A hue swap hides whether the layout itself is better.
**What changed.** Pitfall line: every variant brief carries a single-hue constraint; variants differ on layering, contrast, layout, slight copy changes and details, and hue is its own later pass.

## 2026-10-09 — Inspiration starts from his picks

> reflect · 2026-10-09 · memory:feedback_inspiration_matches_his_picks · correction · applied · seen 1

**What happened.** The first pass for the Music Passport board (THV-1237) pulled museum stamps, real passports, Hogwarts and sports crests and Simply Piano onboarding screens, and left Andres's own references off the board. He said: "Design inspirations do not match the actual fucking design inspirations I gave you first... You didn't add anything that I gave you."
**Why.** Researchers searched the topic instead of the brief. His reference images are the brief.
**What changed.** Pitfall line: read his references and DESIGN.md "Brand atmosphere" first, put his picks on the board first, and brief each researcher with what the picks share, banned categories, and a rule to open and judge every image. Pasted screenshots live in temp folders that vanish; recover them from the session transcript JSONL (base64 image blocks).

## 2026-09-03 — A dump-driven design track edits components, fast

> reflect · 2026-09-03 · memory:feedback_design_track_executes_dump · correction · applied · seen 1

**What happened.** The agent re-sequenced a design session around a frame fold and per-item gates. Andres: "We haven't even fixed the most important part, which is inside the components. You're thinking about this from too high of a level. The dump was literally that I hate how it looks and I'm trying to redesign it quickly."
**Why.** A dump is a list of concrete UI cuts and moves with numbers, and its value is speed. Meta-loops, token passes, frame extraction, folds, loading states and performance are design engineering and belong to the architecture track after the design closes.
**What changed.** Pitfall line: execute every item of the dump's design sections as edits inside the component files, one commit per section, no questions back, then post one short list and wait for his word.
