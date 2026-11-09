---
name: thoven-designer
description: Design, critique, or polish a Thoven surface; compare its rendered implementation with a Paper or approved design reference; find existing components and system decisions; or check implementation compliance.
---

# Thoven Designer

Design for the person's task and the whole rendered composition. Thoven's frontend `DESIGN.md` governs the house system; this skill points to its sources rather than restating design values. Token modules and tests prevail where documentation and implementation disagree. Check rulings made in this session too, and hand them to `workspace` `capture`.

The named surface is the scope. Fit a component into its slot; resizing the shell, grid, or neighbouring cards needs Andres (`feature-ledger` rule 16). Before a variant of a shipped surface or attached mockup, a ticket on one, a system audit, or a proposed token or shared component, open the live route and global component, inspect shipped code, and list what already shipped. State what stays and what changes; propose the gap.

For a screen that has never existed, design in Paper first and give it a polish round before lab or code, unless the task chooses a medium. Storyboard only the moving part. During design, “build” means Paper unless the turn names code.

## Design and critique

1. Establish the task, audience, context, scope, and what must remain from shipped or approved work. Inspect the actual rendered surface or supplied artifact in context, including relevant states and responsive behavior. If it cannot be inspected, say what is missing and qualify the review. For house atmosphere read frontend `DESIGN.md` “Brand atmosphere” and `BRANDING.md`, and inspect a relevant approved composition. For component treatments inspect `docs/design-system.html`; for typography read `design/typography.md` and its named code owners. When Paper or another approved design is the implementation reference, follow [visual parity](references/visual-parity.md) to compare both rendered surfaces.
2. State what the person should notice first, understand next, and be able to do. Compare that intended reading order with the rendered composition: visual weight, grouping, density, alignment and affordances. Identify consequential mismatches and preserve strengths. Assess visual balance and Thoven's warmth and clarity in context. Compare typography across its layout: headings against content, labels against values, and text against available space. Examine measure, wrapping, alignment, weight and proportion together; a valid type role can still read poorly in its setting. Consider long content and available widths where relevant.
3. Explain each consequential observation as what is visible → what in the composition causes it → how it affects the person's task → a concrete change and tradeoff. Separate observation from inferred feeling. For example, if a secondary card title visually competes with the section heading, inspect their relative weight and surrounding space, then adjust their hierarchy using existing roles and check the result in the whole layout. A dense data view may benefit from separators; a selectable unit may need containment. Choose by the relationship the treatment communicates.
4. Propose or make a coherent, scoped change, preserving what works. Inspect the result at the relevant size and states, including text growth and interaction where applicable, and recheck the reference when parity applies. Complete the review when consequential findings have a proposed or verified resolution and remaining uncertainties are explicit. A visual finding is not proven merely by a token match. Use specialist skills when a specific concern needs deeper work, while keeping ownership of the whole composition here.

When existing components cannot express the needed relationship, explain the gap and propose the missing composition or primitive through its purpose, visual role and states. Check what already exists before hand-rolling it. Use established roles, components and interaction states when resolving the design; consult [lookup and implementation compliance](references/implementation.md) for their sources and checks. An exploratory choice without a settled source may be proposed as provisional; do not present it as a lock. Changes to enforced standards, new hues or type roles, and scope outside the named surface need Andres's decision. When a proto and shipped work differ, distinguish enforced standards from emerging primitives; bring the conflict to Andres rather than treating every emerging choice as fixed.

## Output

For design and critique, lead with the overall judgment and its consequence for the person's task. Name what should stay, then prioritize the few changes that matter most. Use the observation → cause → impact → change reasoning above, with a tradeoff where material. A sound composition can be reported as such. Close with what was actually inspected, what changed or is proposed, and what remains provisional or unverified. Scale the answer to the request; headings and counts are optional. When parity applies, include the reference and the discrepancy dispositions from [visual parity](references/visual-parity.md).

For a lookup, give the direct answer, owning source and authority. For compliance, report deviations with their location, governing source and consequence. Keep technical compliance evidence distinct from visual judgment.

## Lookup and compliance

For a component existence question, a specific design value or lock, a system audit, or code-level implementation verification, follow [lookup and implementation compliance](references/implementation.md). It contains the classifier, source map, lock tiers, implementation pitfalls, and standing checks. Consult it as needed during design; a full token audit is a separate task from assessing the composition.
