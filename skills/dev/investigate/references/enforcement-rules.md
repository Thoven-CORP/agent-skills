# Enforcement Rules

Detailed enforcement rules for the investigate skill. The Iron Law in SKILL.md is the summary — this file has the full lists for when you need to self-check.

---

## NEVER Do This

- NEVER attempt to debug without launching at least ONE subagent
- NEVER skip Phase 1 agent investigation for any bug
- NEVER proceed to Phase 3 without explicit user approval
- NEVER claim root cause without evidence from agent investigation
- NEVER say "I think the issue is..." without agent findings to support it
- NEVER read code directly and propose fixes (use agents to investigate)
- NEVER say "let me quickly check" and investigate manually

## ALWAYS Do This

- ALWAYS launch `bug-hunter` OR `feature-dev:code-explorer` (or both) in Phase 1
- ALWAYS wait for agent results before diagnosing
- ALWAYS present a diagnostic report with "Investigation Sources" section
- ALWAYS ask user to choose a fix option before implementing
- ALWAYS cite specific file:line references from agent findings

---

## Red Flags — STOP and Follow Process

If you catch yourself thinking any of these, STOP and launch an agent instead:

| Thought | Reality |
|---------|---------|
| "Quick fix for now, investigate later" | Iron Law violation. Investigate first. |
| "Just try changing X and see if it works" | Shotgun debugging. Use agents. |
| "I can see the issue, let me just fix it" | You see a symptom, not root cause. Launch agents. |
| "It's probably X, let me fix that" | "Probably" = guessing. Agents confirm. |
| "This is too simple for agents" | Simple bugs have root causes too. Launch at least 1 agent. |
| "Let me read the code real quick" | That's manual investigation. Launch an agent instead. |
| "One more fix attempt" (after 2+ failures) | 3 strikes = architectural problem. Stop fixing. |
| "I already know this codebase well enough" | Familiarity breeds assumptions. Agents verify. |
| "The user wants a fast answer" | Fast wrong answer wastes more time than systematic investigation. |

---

## Common Rationalizations for Skipping Agents

| Excuse | Reality |
|--------|---------|
| "It's a one-line fix" | One-line fixes still need root cause confirmation. Agent takes 30 seconds. |
| "I just need to check one file" | Checking one file = manual investigation = skipping Phase 1. |
| "Agents are overkill for this" | Overkill is better than wrong diagnosis. |
| "I'll use agents if my first guess is wrong" | First guess sets anchoring bias. Agents prevent this. |
| "The error message tells me exactly what's wrong" | Error messages show symptoms, not root causes. Agents trace deeper. |
| "This is the same bug I saw before" | Similar symptoms ≠ same root cause. Verify with agents. |
