---
name: product-fundamentals
description: Andres's product thinking for brainstorms and grills. It settles what matters, then where it lives, the flow, the moments, then the details, in that order. Use when brainstorming or grilling a new feature, mapping a user journey or flow, asking what we optimise for or what matters most, deciding where a feature slots into the product, hardening a flow before build, or designing delight and first-time moments.
---

# Product fundamentals

AI product grills lose **altitude**. They dive ten steps ahead, into the acceptance email or four success states, before anyone has settled what matters or where the feature lives. Assumptions pile up, and the finished flow solves something nobody chose. This skill holds altitude: a question is asked at the highest level still open, and the assumptions stay in view every round. It runs in brainstorms and grills only, not during a build. Read `LEARNINGS.md` before editing this file.

## The ladder

| Level | Settles | Closed when |
|---|---|---|
| 1. What matters | What we care about most and for whom. The **instinct** under today's idea. What we won't chase. | One line Andres accepts: "We care most about X for Y. We won't chase Z." |
| 2. Where it lives | Where it slots into the product journey. Which screens exist and which are new. | A slot map: one box per real screen, existing marked apart from new, and every new destination justified. |
| 3. The flow | From blank page to end goal: the steps, how many, where it forks. | Every flow's gates are settled, one flow at a time, in the order the user meets them. |
| 4. Moments and feel | The peak, the end, the failure end, and what it should look and feel like. | One peak and one end per flow, with the chosen rung costed and an operator named. |
| 5. Details | States, copy, emails, edge cases. | Every gate in the flow has its states, and every ask has its payoff. |

**Assumptions** run beside every level: `A1 · we assume … · checked (record) | unchecked (cheapest check)`. Work that rests only on unchecked assumptions goes to Defer until the check runs.

The moves that generate each level's questions live in `references/sources/chesky.md`, `references/sources/pincus.md` and `references/sources/jobs.md`. Every quote there is verified against a primary source. Quote only from those files. For Thoven work, read `references/thoven.md` too.

## Steps

1. **Evidence pass.** Read the Project board, the Linear parent, the prior handoff, and every source linked from the brief or the Project. Pull one real record or count through a read-only subagent. Print a coverage table (source · how it was opened · or why it wasn't); sources unopened for the same reason share one row. Done when every linked source is accounted for.
2. **Entry point.** A new feature enters at level 1. A journey pass enters at level 3. Hardening a designed flow enters at level 4. On a later entry, the first round re-checks each level above in one line ("Level 1: we care most about X. Still true?").
3. **Rounds.** Invoke `grilling` and run its rounds. This skill supplies the tree: only the open level's questions are on the frontier. A question from a lower level goes to a visible **Later** list, one line per item with its level, and waits there. The frameworks are drafted only to ask about them, and their names stay out of chat.
   - Level 1 questions show the evidence and two or three readings, with no recommendation. Andres's intent comes first. From level 2 down, each fork carries a recommendation, so a yes accepts it.
   - Each round opens with the recap of the settled levels and the assumptions list.
   - In a brand or generative exercise, collect Andres's answer before showing yours.
4. **Close a level.** The next round opens with "Level N settled: …". Answering the round accepts it, and a no reopens that level.
5. **Direction check, every round.** Flag in one line when a question polishes something that doesn't move toward what matters, when the work drifts from level 1, or when it leans on an unchecked assumption. Name the cheapest check. The call is Andres's.
6. **Brief.** When the frontier is empty, or Andres stops, write the brief in chat. Copy it to the board frame on his go.

## What each level checks

- **Level 1.**
  - When an idea is challenged or defended, ask what instinct it serves, and whether a different idea serves that instinct better.
  - Name the actor whose decision makes the feature worth building. Walk every other actor too.
- **Level 2.**
  - Ask which storyboard frame of the user's journey this serves, and which high-emotion frames sit empty.
  - The slot map comes from a read-only explorer over the frontend routes, not from Andres. Fewer new destinations feel native.
- **Level 3.**
  - Tag each part Proven, Better or New. New gets one bet.
  - Split new users from existing ones.
  - Count every ask and email across flows, and never ask for the same thing twice.
  - Frame each ask by the payoff the user wants.
- **Level 4.**
  - Run the 11-star ladder on one moment. Climb past the impossible, then come back to the rung that feels reasonable in hindsight. Each rung carries its cost and who operates it.
  - Run a down-ladder (1 to 4 stars) for the worst and the abandoned end.
  - Trust pass: the stranger's worst thought, and the proof that answers it.
  - **Gimmick gate:** who sees it, would they notice and understand it, what it teaches or confirms, and what removing it costs.
  - Privacy pass when one actor would learn what another searched for or declared about a child.
- **Level 5.**
  - A new symbol is taught once, in place, and the cue then fades.
  - A blocked state names who can unblock it.
  - Every ask shows a payoff the user can preview.
  - Proof of completion is real behaviour, not a checkbox.
  - Engineering error paths go to `product-advisor` HOLD SCOPE.

## The brief

```
WHAT MATTERS   We care most about … for … · We won't chase …
WHERE IT LIVES <slot map, ASCII> · new destinations: N
THE FLOW       <per flow: gates in order, forks>
MOMENTS        peak … · end … · failure end … · rung chosen (cost, operator)
DETAILS        <only what was settled>
ASSUMPTIONS    A1 … checked/unchecked …
KEEP / CUT / DEFER   one line each, with the reason
LATER          questions parked below the level we reached
```

Mermaid does not render in this terminal, so draw in ASCII. Rulings reach Linear only through the usual ruling flow, after Andres confirms.

## Neighbours

`product-advisor` owns scope modes and engineering edge cases. `wireframe` and `prototype` own screens and variants. `feature-ledger` owns decision rows. `qa-flow` proves the built path.
