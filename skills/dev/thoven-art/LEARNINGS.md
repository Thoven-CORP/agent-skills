# Learnings — thoven-art

Running log of what went wrong in real use and what changed. **Read before editing SKILL.md.**
New entries on top. Each one: what happened, why, what changed.

---

## 2026-10-26 · Homepage sections asset kit (THV-1455, THV-1468)

> reflect · 2026-10-26 · 95c4b104 · broken-rule · applied · seen 2

- **The description now fires when art is planned.** 2026-10-31, 95c4b104: the kit was scheduled before the skill loaded. Planning, listing, or scheduling art loads it, and `design/art/INDEX.md` is read first.
- **Generated before reusing.** The first kit planned twelve new icons while the passport marks
  already covered three (metronome, headphones, bolt). Andres: "Why did you create the assets when we
  had some from the original stickers and stuff." Step 2 now maps every need to a library row first.
- **References were too narrow.** Quiver got only the six instruments, so its icons came out flatter
  than the passport marks. Step 3 now names instruments, passport marks and stickers together.
- **Frames in the wrong palette, twice.** Pale tints read as washed out; the darker art palette
  "doesn't really look good". Frames are UI and take the design-system 100 and 200 fills (AL3).
- **Frame as object.** A full-width tuner band was "way too much of an object". Step 3 and step 4 keep
  a frame to a small accent on a plain box.
- **Parallel Quiver calls errored** (4 of 9). Step 3 runs them one at a time.
- **Photo shape.** Image-to-image ignores `aspect_ratio` and follows the first reference's shape.
