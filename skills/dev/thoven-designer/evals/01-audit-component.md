# Scenario 01 — Audit a built component against the system

The most common in-the-wild use. Tests whether the skill makes the agent audit against the
**binding** layer rather than against prose or memory, and whether it keeps "violation" and
"the system doesn't say" apart.

Rewritten 2026-08-16 when `thoven-designer` became the index and the build ceremony moved to
`building-thoven-ui`. The previous version of this scenario asserted specific colour values
(`orange-500`, `rgb(217,119,6)`); it now asserts **sourcing behaviour**, because a value baked
into an eval rots exactly like a value baked into the skill.

## Prompt

> Audit the `components/teacher/classroom/MaterialsSlideOver.tsx` file against the Thoven design
> system. Tell me what's compliant, what's drifted, and what's a hard violation.

## Setup

- Fresh session in `~/thoven/frontend`, no prior context
- `thoven-designer` available; the target file exists and is readable

## MUST — all required to pass

- [ ] Reads the actual file before commenting. No "it probably uses…" claims
- [ ] Opens at least one **Tier 0 binding source** (a `lib/*-tokens.ts`, `tools/build-palette.mjs`,
      or the `GENERATED:palette` region of `app/globals.css`) — **not only** `design/*.md`
- [ ] Sorts findings into the three buckets the skill defines: **hard violation** (contradicts an
      enforced lock), **drift** (contradicts a declared lock), **unruled** (the system does not
      settle it)
- [ ] Does **not** score an unruled value as a violation
- [ ] Every finding carries `file:line` **and** the source that makes it a finding
- [ ] States which tier each judgement came from, so the reader knows what is enforced vs advisory

## SHOULD — ≥80% required to pass

- [ ] Quotes the exact className verbatim when flagging
- [ ] Runs at least one silent-failure check rather than reading class names only — e.g. confirms a
      hue appears in `PALETTE`, or that an arbitrary value occurs elsewhere in the repo
- [ ] If it finds a hard violation that the suite is not catching, says the test has a gap
- [ ] Names an unruled question as needing a decision + decision log, rather than ruling on it
- [ ] Final summary with counts per bucket
- [ ] Proposes fixes that cite the canonical source rather than pasting a literal value

## Automatic FAIL

- ❌ Audits without reading the file
- ❌ Answers only from `design/*.md` or from memory, never opening a binding source
- ❌ Reports a value with no citation
- ❌ Decides an unruled question itself and presents it as the system's answer
- ❌ Asserts on `className` as proof of rendered output (see the skill's silent-failure section)
- ❌ Recommends a hue without checking it is a generated ramp

## Notes for the grader

A correct run may legitimately conclude that part of the file is **unruled**. That is a pass, not
a hedge — the failure mode this scenario exists to catch is an agent inventing a ruling to sound
decisive. Compare against the pre-skill baseline: 22 tool calls, ~90k tokens, and the agent
declining to load the skill at all.
