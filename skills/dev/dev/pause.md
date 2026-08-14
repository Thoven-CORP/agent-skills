---
name: dev-pause
description: Use when explicitly pausing feature development mid-pipeline. Captures full context for resumption — current phase, sub-step, completed work, remaining work, blockers, decisions, and context that would be lost. Triggers on /dev:pause, "pause feature", "stop for now", "pick this up later".
---

# /dev:pause — Explicit Pause with Handoff

## Purpose

Capture the full state of in-progress feature development so it can be resumed in a future session with zero context loss. Creates a detailed handoff document in MANIFEST.

**This is NOT automatic session end** — this is an explicit user-initiated pause that creates a rich resumption context.

---

## WHEN TO INVOKE

- User says "pause", "stop for now", "pick this up later"
- User selects "Pause" at any phase gate
- Auto-invoked by BUILD when 3-strikes escalation triggers
- Context window running low mid-phase

---

## PROCESS

### Step 1: Capture Current State

Gather all of the following:

```markdown
pause_context:
  paused_at: "[YYYY-MM-DD HH:MM]"
  current_phase: [INTAKE|DISCOVER|PLAN|DOCUMENT|BUILD|VALIDATE|HANDOVER|SHIP]
  sub_step: "[Specific sub-step within the phase]"
  # Examples:
  #   "DISCOVER: Standard brainstorm, question 3 of 5"
  #   "BUILD: Wave 2, TASK_04 in progress (service 60% done)"
  #   "VALIDATE: Step 3 security review running"
```

### Step 2: Document Session Progress

```markdown
  completed_this_session:
    - "[Specific accomplishment 1]"
    - "[Specific accomplishment 2]"
    # Be concrete: "Wave 1 complete (migration + model + factory)"
    # NOT vague: "Made progress on database work"

  remaining:
    - "[Specific next action 1]"
    - "[Specific next action 2]"
    # Be actionable: "Finish TASK_04 credit hold service — webhook handler remaining"
    # NOT vague: "Continue building"
```

### Step 3: Document Blockers and Context

```markdown
  blockers:
    - "[Blocker description + what's needed to unblock]"
    # Or "none" if no blockers

  decisions_this_session:
    - "[D0X: decision summary — locked/deferred]"
    # Only decisions made THIS session, not all decisions

  context_for_next_session:
    - "[Critical context that would be lost without this note]"
    - "[Key insight discovered during this session]"
    - "[Reference to check: 'See COMMON_ERRORS.md #7 for the race condition pattern']"
    # This is the most important field — what does the next session NEED to know?
```

### Step 4: Write to MANIFEST

Update `docs/[feature]/.dev/MANIFEST.md`:

1. Set `**Status:** Paused`
2. Set `**Current Phase:**` to current phase
3. Replace the `## Pause Context` section with the full pause_context above

### Step 5: Update CURRENT_STATUS.md

```markdown
# [Feature Name] — PAUSED

**Status:** Paused at [phase], [sub-step]
**Paused:** [date/time]
**Last completed:** [most recent accomplishment]
**Next action:** [first item from remaining list]
**Blockers:** [blockers or "None"]

Resume with: `/dev` (will auto-detect paused feature)
```

### Step 6: Commit Work in Progress

```bash
git add -A
git commit -m "wip: [feature-name] paused at [phase]

Paused at: [phase], [sub-step]
Completed: [summary of session work]
Next: [first remaining item]

Publication Status: Not Published

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 7: Confirm to User

```
Feature development paused.

  Feature: [name]
  Paused at: [phase] — [sub-step]
  Completed this session: [count] items
  Remaining: [count] items
  Blockers: [count or "None"]

  Resume with: `/dev`
  (Will auto-detect this feature and pick up where you left off)
```

---

## RESUMPTION

When `/dev` is invoked and finds a paused MANIFEST, it auto-detects and resumes. See `SKILL.md` routing logic for full resumption details.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Vague completed/remaining items | Be specific: file names, task IDs, percentages |
| Missing context_for_next_session | This is the most valuable field — don't skip it |
| Not committing WIP | Always commit before pausing — uncommitted work can be lost |
| Forgetting to update CURRENT_STATUS.md | This is the quick-glance file for resumption |
| Not updating MANIFEST Status to Paused | `/dev` routing depends on this field |
