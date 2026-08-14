---
name: future-improvements
description: Use when deferring a technical improvement identified during development, brainstorming, or debugging for later implementation — logged to the global improvement store with enough context for a cold-start reader. Triggers on "add improvement", "defer this", "future improvement", "not now but later", "backlog this", "too complex for now", or when a brainstorm surfaces an idea beyond current scope.
---

# Future Improvements — Deferred Enhancement Registry

## Overview

Log deferred technical improvements to the **global store** `~/thoven/.workspace/FUTURE_IMPROVEMENTS.md` with enough context that someone can pick them up cold and start brainstorming solutions. Both the rich brief and the one-line workspace tracker live in that single file (repo-tagged), so there is no two-homes split.

**Core Principle:** If it's worth mentioning, it's worth writing down properly. Vague notes become forgotten notes.

## When to Use

- During **brainstorming**: idea surfaces that's too complex for current scope
- During **feature development**: enhancement identified but not in current requirements
- During **debugging**: root cause fix is larger than the immediate patch
- During **code review**: improvement spotted but not blocking the PR
- Anytime you think "we should do this… but not now"

## When NOT to Use

- It's a **bug or workaround** that needs tracking — use `TECH_DEBT.md` instead
- It's an **active task** for this session — use `todo-manager` instead
- It's a **quick fix** you can do right now — just do it

---

## Process

### Step 1: Identify the Category

Check existing `##` category headers in `~/thoven/.workspace/FUTURE_IMPROVEMENTS.md`:

| Category | Examples |
|----------|----------|
| Email & Communications | Unsubscribe flow, notification templates |
| Authentication & Security | Password reset, RBAC improvements |
| Performance & Scaling | Query optimization, caching, queue scaling |
| Booking & Scheduling | Availability integration, recurring patterns |
| Data Integrity & Consistency | Normalization, validation, limits |
| Observability & Monitoring | Error logging, alerting, dashboards |
| Infrastructure | Upgrades, deployment, environment |
| Frontend UX | Component patterns, accessibility, animation |

If no existing category fits, create a new `## Category` header.

### Step 2: Determine Priority

All entries here are deferred — priority is **relative urgency for when this area is next worked**, not "drop everything now" (a true blocker belongs in `TECH_DEBT.md`, not here):

| Priority | Meaning |
|----------|---------|
| **P0** | Highest — gates the next major feature in this area; do first when picked up |
| **P1** | Important — schedule deliberately |
| **P2** | Nice to have |
| **P3** | Low priority — someday / maybe |

### Step 3: Context Quality Check

Before writing the entry, verify the Context field can answer at least 4 of these 6 questions:

- [ ] What problem does this solve?
- [ ] How did we discover this need?
- [ ] What's the current workaround (if any)?
- [ ] Why is the proposed solution better?
- [ ] What's the implementation approach?
- [ ] Any considerations or gotchas?

**If you can't answer at least 4 of these, gather more context first.** A title without context is useless — write for a cold-start reader. Do not self-certify: uncertain counts as a miss, and four genuine answers beat six partial ones.

### Step 4: Write the Rich Brief

Append the `### Title` block under the correct `##` category in `~/thoven/.workspace/FUTURE_IMPROVEMENTS.md`:

```markdown
### [Improvement Title]
- **What:** [One sentence — what would we build?]
- **Why Deferred:** [Why not now — be specific]
- **Context:**
  - **Problem discovered:** [What triggered this — the moment you realized it was needed]
  - **Current state:** [How it works today / what the workaround is]
  - **Why this is better:** [Benefits of the improvement]
  - **Implementation approach:** [How to build it — enough to prime a brainstorm]
  - **Considerations:** [Gotchas, dependencies, related tech debt items]
- **Priority:** P[0-3]
- **Target:** [Q? | Backlog | TBD]
- **Repo:** [frontend | backend]
- **Added:** [Today's date YYYY-MM-DD]
```

Cross-reference where helpful:
- If related to a tech debt item: `Related: TD-XXX in TECH_DEBT.md`
- If spawned from a brainstorm: `Origin: Brainstorm session YYYY-MM-DD`
- If both repos are affected, note the other repo in Considerations

### Step 5: Staple the Tracker Line

Immediately after the rich brief block, generate and append the one-line workspace tracker using `serialize` (never hand-format — the `fi-` id must be minted fresh):

```bash
node -e '
const {mint}=require(process.env.HOME+"/.claude/skills/workspace/tools/ids.js");
const {serialize}=require(process.env.HOME+"/.claude/skills/workspace/tools/item.js");
const [text,repo=""]=process.argv.slice(1);
const id=mint("improvement");
console.log(serialize({text,status:"open",fields:{id,type:"improvement",status:"open",links:"",git:"",repo,"last-synced":""}}));
' "<Improvement Title>" "<repo>"
```

This prints the tracker line. Append it to the file right after the rich brief. Echo the `fi-` id to the user.

**The resulting file structure looks like:**

```markdown
## <Category>

### <Improvement Title>
- **What:** ...
- **Why Deferred:** ...
- **Context:**
  - **Problem discovered:** ...
  - **Current state:** ...
  - **Why this is better:** ...
  - **Implementation approach:** ...
  - **Considerations:** ...
- **Priority:** P2
- **Target:** Backlog
- **Repo:** frontend
- **Added:** 2026-06-19
- [ ] <Improvement Title> <!-- id:fi-xxxx type:improvement status:open links: git: repo:frontend last-synced: -->
```

The `- **What:** …` bullets have no checkbox, so the workspace Map regenerator ignores them. Only the `- [ ]` tracker line (with `id:`) is picked up — brief and tracker coexist safely in one file.

---

## After Implementation

When an improvement is implemented:
1. Add an entry to `CHANGELOG.md` describing what shipped (the rich brief stays — do not delete it).
2. Close its workspace tracker so the `resume` Map drops it:

   Use the workspace `close-item` verb (flips to `[x]` / `status:done`):
   ```
   workspace close-item <fi-id>
   ```

   The rich brief stays in `~/thoven/.workspace/FUTURE_IMPROVEMENTS.md` as historical context — the tracker's `status:done` is the single status home.

---

## Integration with Brainstorming

When a brainstorming session surfaces an idea beyond current scope, log it here BEFORE the session ends so it isn't lost:

> "This is a great idea but beyond our current scope. Let me log it as a future improvement so we don't lose it."

(If you're in `superpowers:brainstorming`, capture deferred ideas during its design/transition steps — before moving to a plan.)

---

## Common Mistakes

- **Vague Context** ("would be nice to have caching") — be specific enough to prime a brainstorm
- **Skipping Implementation Approach** — the whole point is someone can pick this up cold
- **Not cross-referencing** related tech debt items — they often go together
- **Adding bugs/workarounds** — those belong in `TECH_DEBT.md`
- **Forgetting Priority** — makes sprint planning harder
- **Hand-formatting the tracker line** — always use the `serialize` recipe to mint a fresh `fi-` id

---

## Example Entry

```markdown
## Email & Communications

### Server-Side Meta Conversions API for Signup Tracking
- **What:** Implement Meta Conversions API (server-side) to send `CompleteRegistration` events from the backend instead of relying solely on client-side Meta Pixel
- **Why Deferred:** Current sendBeacon fix addresses immediate Safari issue; server-side requires backend changes and Meta Business Manager setup
- **Context:**
  - **Problem discovered:** `signup_completed` events weren't firing on Safari mobile because Safari aggressively cancels client-side requests during page transitions
  - **Current state:** We implemented `sendBeacon` transport for Mixpanel which survives page unload, but Meta Pixel still relies on client-side `fbq('track', 'CompleteRegistration')`
  - **Why this is better:**
    - Immune to ad blockers (30%+ of users)
    - Immune to Safari/browser request cancellation
    - Immune to client-side JavaScript failures
    - Better attribution accuracy for Meta Ads
    - Can include server-side data (user ID, LTV) not available on client
  - **Implementation approach:**
    - Backend sends event to Meta Conversions API after successful user creation in `POST /api/v1/auth/register`
    - Requires: Meta Pixel ID, Conversions API access token, event deduplication with client-side pixel
    - Meta docs: https://developers.facebook.com/docs/marketing-api/conversions-api
  - **Considerations:**
    - Need to hash PII (email, phone) per Meta requirements
    - Should implement for all conversion events: CompleteRegistration, Lead, Purchase
    - Event deduplication: use `event_id` parameter matching client + server events
- **Priority:** P2
- **Target:** Q3 2026
- **Repo:** backend
- **Added:** 2026-01-23
- [ ] Server-Side Meta Conversions API for Signup Tracking <!-- id:fi-0001 type:improvement status:open links: git: repo:backend last-synced: -->
```
