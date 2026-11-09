# Visual parity with a design reference

Use when Paper or another approved design is the reference for an implementation. This compares
the rendered product with the frame it was built from. Paper is the build source and the design
system is reference (`andres-mode`, Parity): the frame's own values are the target.

## Establish the reference

Identify the named file, page, artboard and relevant approval or later ruling; state whether the
reference is approved or exploratory. Open the Paper
reference through the available Paper connection and inspect its rendered frame. The foreground
canvas alone does not establish which version was approved. Use an identified export when direct
access is unavailable, and state its provenance and limits. Keep the reference intact during review.

## Compare the rendered surfaces

Open the real product route and compare it beside the reference at each frame's width, desktop
and phone frames both, matching content and state where possible. Record differences in data, loaded fonts or state that affect the
comparison. Use the project's existing parity capture workflow for its required widths, states and
motion evidence. A component showcase explains a treatment; the whole product surface shows how
it fits. A static frame supports appearance claims, while interaction claims require exercising
the implementation and checking the specified behavior.

Start with composition: reading order, relative visual weight, grouping, proportions, density,
alignment and action prominence. Examine typography in that layout, then spacing, containment,
colour, imagery and interaction treatments where they affect the result. For each consequential
difference, identify the reference treatment, the rendered treatment and its effect on the task.
Read the frame's values with Paper `get_computed_styles` beside the build's computed styles to
name each difference and its cause.

Judge fidelity and design quality separately. A faithful implementation may still have a composition
problem; report that as a proposed design improvement, preserving the approved reference. Conversely,
passing token checks does not establish that the implementation matches the intended design.

## Explain discrepancies

Write MATCH, or NO with its differences, for each state at each width you opened. Each difference
left belongs in the Discrepancies table (`dispatch-work` brief.md, REPORT, Parity).

- **Approved difference:** cite the decision or user instruction that supersedes the reference.
- **Unintended or unconfirmed difference:** flag the discrepancy and recommend the scoped fix.
  When a responsive or content constraint motivates a difference, explain the constraint, how the
  adaptation preserves the design intent, and whether it is approved or still a proposal. A layout,
  spacing, height, veil or colour difference is a question to main before it is built.
- **Reference/system conflict:** the frame's value is the build target. Name the token or shared
  component that cannot express it and the change that would; a scan that refuses the value gets one
  allowlist entry naming the Paper node and the reason.

Report meaningful matches and preserve strengths. Distinguish a sourced system discrepancy from
a design recommendation, which needs a visual cause and task impact rather than an invented rule.
Show the comparison with findings located on the relevant frame and product capture. State which
widths and states were inspected and any unavailable evidence. Close only the findings actually
rechecked; leave uninspected surfaces and unresolved differences explicit.
