---
name: session-memory
description: Use when the user says "log work", "log the session", "continue later", "pick this up next session", "save session context", "session continuity", "where did we leave off", or at end-of-session wrap-up; also routes from the workspace `log` verb. Appends to the global STATE Log (not mem0).
---

# Session Memory — Global Log Skill

This skill is the implementation behind the `workspace log` verb. When invoked, it
summarizes the session, conditionally clarifies if needed (Q3 rule), and appends a
dated entry to the global work-state store — `~/thoven/.workspace/STATE.md` under
the `## Log` heading. Both FE and BE sessions route here.

## Storage Target

**Two homes.** Both hold session *reasoning*, at different scopes:

| Writes | Scope |
|---|---|
| `~/thoven/.workspace/STATE.md` → `## Log` | **cross-feature** — what this session did, where it stopped |
| `<feature>/CONTINUE_HERE.md` | **one feature** — the thread of thought: what was tried and failed, what to be careful of |

**Never write status into either.** No "Phase 4 done, Phase 5 next", no in-flight tables, no
status tables. Linear owns that, and a second copy is the only thing that can disagree with it. A
`CONTINUE_HERE.md` carries a `THV-` **pointer, never a copy**.

Never write to:
- `MEMORY.md` or `.claude/memory/`
- mem0 (this skill does not touch mem0)

The `## Map` zone of STATE.md must not be touched — only the `## Log` zone.

### `CONTINUE_HERE.md` — the shape

Records only. Every heading below is a record (which cannot go stale); anything that is a *state*
(which can) belongs in Linear.

```markdown
# CONTINUE HERE — <feature>

Linear: THV-42          ← a pointer, never a copy
Branch: THV-42-slug

## What I was doing
## What I tried that didn't work     ← the field Linear does not have
## Careful of
```

## When to Invoke

The `workspace log` verb delegates here. Also invoke directly on any of:

- "log work", "log the session"
- "continue later", "pick this up next session"
- "save session context", "save where we are"
- "session continuity", "where did we leave off"
- End-of-session wrap-up

## Conditional Clarify-First (Q3 Rule)

Before writing, assess whether the save intent is clear:

**Intent is clear** (e.g., "pick up the admin audit on X next round", user described
the stopping point in the same message) → capture immediately, echo the entry once.
No questions needed.

**Intent is ambiguous** (topic unclear, stopping point vague, no sense of what "next
session" should start on) → ask 1–2 targeted questions, one at a time (one
question, wait for the answer, then the next):

- "What's the topic / what were we working on?"
- "Where exactly did we stop — what's the first thing next session should do?"

Wait for answers before writing. Do **not** invoke the `brainstorming` skill for
this — it is heavy and unnecessary. Ask inline.

## Entry Format

Every entry is **ONE single-line bullet** — one `- ` line, however long. Do NOT
hard-wrap across multiple lines: the append recipe re-collects existing entries by
matching `- ` lines, so a wrapped continuation line would be silently dropped on the
next trim. Use `;` to separate clauses within the one line.

The single line encodes what was worked on, where we left off, key decisions, and
how to resume:

```
- YYYY-MM-DD — <topic>: <what was done>; left off at <stopping point>; <key decision(s)>; resume via <skill + file>.
```

**The entry must be substantive.** A one-liner like "worked on auth" is not enough.
The next session must cold-start without re-exploration. Pack into the one line:

- Which files / docs were the main working surface
- The exact stopping point (what action or decision comes next)
- Any locked decisions made this session
- The concrete resume instruction (which skill to invoke, which file to read first)

### Good Example (one physical line)

```
- 2026-06-19 — Teach Mode HW Submission refactor: surfaced 42 decisions + 15 BE asks; locked 3-actor model + `submission_required` bool on HW model; FE Wave 1 spec at docs/Teach_Mode/Wave_G_HW_Hardening/WAVE1_SPEC.md; resume via `superpowers:subagent-driven-development` after Andres answers the 4 open BE questions in the spec's Open Questions section.
```

### Poor Example (do not do this)

```
- 2026-06-19 — HW work: did some refactoring, need to continue.
```

## Append Mechanism

After drafting the entry text, insert it into STATE.md using this Node recipe.
Run it from any working directory — it uses the absolute path.

```bash
node -e "
const fs = require('fs');
const path = require('path');
const file = path.join(process.env.HOME, 'thoven/.workspace/STATE.md');
const content = fs.readFileSync(file, 'utf8');

// Set this to the actual drafted entry text
const newEntry = '- YYYY-MM-DD — TOPIC: SUMMARY. Resume via HOW.';

// Insert directly after the '## Log' heading line
const logHeading = '## Log\n';
const idx = content.indexOf(logHeading);
if (idx === -1) { console.error('## Log heading not found'); process.exit(1); }

const insertAt = idx + logHeading.length;
const before = content.slice(0, insertAt);
const after = content.slice(insertAt);

// Collect existing '- ' bullets in the Log zone (stop at next '## ' heading)
const nextSection = after.search(/^## /m);
const logZone = nextSection === -1 ? after : after.slice(0, nextSection);
const rest = nextSection === -1 ? '' : after.slice(nextSection);

const bullets = logZone.match(/^- .+$/gm) || [];
// Keep newest-first: new entry at top, trim to 10 total
const trimmed = [newEntry, ...bullets].slice(0, 10);

const newLog = trimmed.join('\n') + '\n';
fs.writeFileSync(file, before + newLog + (rest ? '\n' + rest : ''));
console.log('Log entry appended.');
"
```

The key invariant: insert **after** `## Log`, keep **newest-first**, trim to **~10
bullets**, and entries are **single-line** so the `- ` match round-trips without
dropping content.

## Workflow

1. **Receive the save request** (from `workspace log` delegate, or direct invocation).

2. **Apply Q3 rule** — is intent clear? If not, ask one targeted question at a time
   until you have: topic, stopping point, key decisions.

3. **Draft the entry** using the format above. The entry is prose — concise but
   substantive. It must enable cold-start in the next session.

4. **Show the draft to the user** and ask for confirmation or corrections. Skip
   only if the user's message itself IS the complete entry verbatim.

5. **Append via the Node recipe** — insert after `## Log`, newest-first, trim to 10.

6. **Echo the inserted entry** so the user can see what was saved.

## Continuing a Session (Resume Mode)

When the user says "where did we leave off" or "resume":

1. Read `~/thoven/.workspace/STATE.md` — entries under `## Log` are newest-first, so the first bullet is the most recent session.
2. Read the most recent entry (first bullet under `## Log`).
3. Follow the "Resume via" instruction verbatim — invoke the named skill, read the
   named files, pick up from the stated stopping point.
4. Do not re-explore what the entry says was already done.

## Continuation Prompt Requirements

The "Resume via" clause in an entry is a cold-start instruction. It must name:

1. Which skill to invoke (e.g., `superpowers:subagent-driven-development`, `workspace resume`)
2. Which files to read first (by absolute or repo-relative path)
3. The first action to take (not a vague "continue working on X")

If the entry is for the FE repo, paths are relative to `~/thoven/frontend/`.
If for the BE repo, paths are relative to `~/thoven/backend/`.
Cross-repo entries include the repo prefix.

## Rules

- **Two homes:** `~/thoven/.workspace/STATE.md` `## Log` (cross-feature) and `<feature>/CONTINUE_HERE.md` (one feature). Nothing else.
- **Records, never status:** no phase lines, no in-flight tables, in either file. `CONTINUE_HERE.md` points at `THV-<id>`; it never copies its state.
- **Newest-first:** new entry goes directly under `## Log`, pushing older entries down.
- **Trim to ~10:** never let the Log section grow beyond ~10 bullets.
- **Substantive:** if the entry can't cold-start the next session, it's too vague — rewrite it.
- **No duplicates on same day + topic:** if an entry for today's topic already exists,
  update it rather than adding a second one.
- **Do not touch `## Map`:** the Map zone is managed by `workspace resume` only.
- **No mem0, no MEMORY.md, no `.claude/memory/`.**
