---
name: qa-design
description: Judge a built Thoven screen by eye, one lens per frontend DESIGN.md section, and report what reads wrong. Use when a surface is built or changed and needs a design read, or when Andres asks how a screen looks.
---

# qa-design

A visual read of a built screen, the way a designer looks at it: does it feel like Thoven, does the eye land in the right place, does it hold together. Judge what the eye sees, never the arithmetic: a 2 px offset that reads aligned is aligned, and a grid-perfect screen that reads heavy is wrong. The method is `interface-craft`'s Design Critique (`design-critique.md` in that skill); the standard is the frontend `DESIGN.md`. This skill reports and fixes nothing. A walk as a user is `qa-product`.

## Steps

1. **Open the screen as its user reaches it.** On the route, with production-shaped data (`journey-map`, step 3), at the persona's device: 390 wide for a parent or teen on a phone, a 1280×720 window for a teacher at a desk. Take one `agent-browser screenshot` per state you judge (loaded, empty, error, the busiest real data). Done when you hold a screenshot of each state the change touches.
2. **Read each lens.** For each heading below, read that section of the frontend `DESIGN.md`, look at the screenshots through it, and write what reads wrong, or "reads right". Done when every lens has a line.
3. **Report, then stop.** One finding per cause, with every screen and state it shows on. Each finding names the lens, what the eye sees, the `DESIGN.md` section it departs from, and its screenshot path. Where an approved Paper frame or main lab shows the screen, a departure from it is a finding and the frame wins over the section. Done when the report is on the ticket.

## Lenses

| Lens | DESIGN.md section | Look for |
|---|---|---|
| Feel | Feel | Does it read as Thoven: warm, calm, for families and teachers, not a dashboard |
| Composition | Composing a screen | One thing the eye lands on first; the order a user reads matches the order they act |
| Colour | Colour | Colour carries meaning by role; nothing shouts that is not the primary action |
| Type | Type | Hierarchy readable at a glance; Fredoka only where the section allows it |
| Shape and depth | Shape and depth | Radii and shadows from one family; depth says what sits above what |
| Layout | Layout | Rhythm reads even; groups sit closer inside than between; nothing clamps or overflows at 390 |
| Motion | Motion | Movement explains a change and stays out of the way |
| Building | Building | Built from the shared components, so it looks like its siblings |
| Icons | Icons | One icon set and weight; an icon beside a label adds meaning |
| Rulings | Interface rulings | Every ruling that names this kind of surface holds |
| Anti-patterns | Anti-patterns we reject | None of the listed patterns appears |

A section missing from `DESIGN.md` is one line in the report naming it; judge that lens by the Design Critique alone.
