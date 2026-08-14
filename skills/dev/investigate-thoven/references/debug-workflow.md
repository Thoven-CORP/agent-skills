# Debug Workflow Reference

Detailed procedures for the 7-phase investigation workflow with mandatory agent dispatch.

---

## Why Agents Are Mandatory

The investigate skill requires agent usage for these reasons:

1. **Prevents confirmation bias** — You won't accidentally fixate on the wrong cause
2. **Comprehensive search** — Agents search broadly, you might miss related files
3. **Evidence-based diagnosis** — Forces you to cite sources, not guess
4. **Context management** — Agents work in their own context, freeing yours

**If you find yourself thinking "I can figure this out myself" — STOP. Launch the mandatory agents.**

---

## Pattern Check Quick Reference

Before launching agents, scan `common-errors.md` by category:

| Bug Category | Scan These Sections |
|-------------|-------------------|
| Simple UI | UI / Component Communication |
| API/Backend | API Integration |
| State | React Hooks / State |
| SSR/Hydration | Next.js App Router, UI / Component Communication |
| Performance | React Hooks / State |
| TypeScript | TypeScript / Build |
| Authentication | Authentication |
| Intermittent | React Hooks / State |
| SEO | SEO / Structured Data |

If a pattern matches, present it before dispatching agents. User decides: apply known fix or investigate.

---

## Agent Selection (Mandatory — Not a Choice)

Classification determines the roster. Reference the table in SKILL.md Phase 1.

### debug-specialist
**Used for:** Root cause analysis, race conditions, memory leaks, performance, API issues
**Mandatory in:** API/Backend, State, SSR/Hydration, Performance, TypeScript, Intermittent, Unknown

### code-explorer (feature-dev:code-explorer)
**Used for:** Code path tracing, architecture understanding, dependencies, UI bugs
**Mandatory in:** Simple UI, Accessibility, Intermittent, Unknown

### react-specialist
**Used for:** Hooks, Context, re-renders, stale closures, state flow
**Mandatory in:** State

### next-js-developer
**Used for:** SSR, hydration, RSC boundaries, App Router, metadata
**Mandatory in:** SSR/Hydration

### api-designer
**Used for:** API contract mismatches, payload structure, response parsing
**Mandatory in:** API/Backend

### typescript-pro
**Used for:** Type system issues, strict mode, generics, inference
**Mandatory in:** TypeScript

### performance-analyzer
**Used for:** Bundle size, Core Web Vitals, re-render analysis
**Mandatory in:** Performance

### accessibility-tester
**Used for:** WCAG 2.1 AA, keyboard nav, screen readers, COPPA
**Mandatory in:** Accessibility

---

## Investigation Strategies by Bug Type

### UI / Component Bugs
**Mandatory agent:** code-explorer

**Agent prompt additions:**
- Component props and their sources
- State hooks (useState, useContext, useSelector)
- Effect hooks and their dependencies
- CSS/styling (Tailwind classes, specificity)
- Hydration boundaries (client/server mismatch)

**Common causes:** Missing props/callbacks, incorrect state updates, CSS specificity, hydration mismatches

### API / Backend Integration Bugs
**Mandatory agents:** debug-specialist + api-designer

**Agent prompt additions:**
- Request URL construction (API_BASE_URL)
- Headers (getAuthenticatedRailsHeaders())
- Payload structure (Rails wrapper key)
- Response parsing (correct nesting level)
- Error handling (4xx/5xx)

**Common causes:** Wrong backend URL, missing auth token, payload missing wrapper key, response nesting mismatch

### State Management Bugs
**Mandatory agents:** debug-specialist + react-specialist

**Agent prompt additions for debug-specialist:**
- Race conditions in state updates
- Stale closures in callbacks
- Missing dependencies in useEffect
- Optimistic updates without rollback

**Agent prompt additions for react-specialist:**
- Where is state initialized?
- What components update it?
- What components consume it?
- Context vs Redux vs local state?

**Common causes:** Stale closure, missing useEffect deps, cleanup not running, Context value instability

### Authentication Bugs
**Mandatory agent:** debug-specialist

**Agent prompt additions:**
- Check BOTH auth systems:
  - Parent/Teacher: `localStorage.token`, `userData`, `profilesData`, `AuthContext.tsx`
  - Student: `localStorage.student_token`, `student_data`, `student-dashboard-api.ts`
- Token format: `Bearer {token}` (not `Bearer Bearer {token}`)
- Token expiry (decode JWT)
- Correct auth system for user type

### Performance Bugs
**Mandatory agents:** debug-specialist + performance-analyzer

**Agent prompt additions:**
- Component re-renders (missing memo, incorrect deps)
- API calls (N+1 queries, missing pagination)
- Bundle size (large imports, missing code splitting)
- Memory (event listeners not cleaned up)
- Images (unoptimized, missing lazy loading)
- Core Web Vitals (LCP, CLS, INP)

### SSR / Hydration Bugs
**Mandatory agents:** debug-specialist + next-js-developer

**Agent prompt additions:**
- Server/client rendering differences
- `use client` boundary placement
- Browser API access during SSR (window, document, localStorage)
- Metadata exports in client components
- Route handler vs server action

---

## After Agent Results: Synthesis

### Step 1: Extract Key Findings

From each agent, pull:
- File:line references
- Root cause hypothesis
- Affected components list
- Proposed fixes

### Step 2: Cross-Reference

Check if agents found:
- Same root cause? → High confidence
- Different but related issues? → Investigate further
- Contradicting findings? → Need targeted follow-up

### Step 3: Fill Gaps

If agents missed something specific, use focused Glob/Grep/Read to find exact locations. This supplements — never replaces — agent findings.

---

## Fix Delegation Reference

| Tier | When | Action |
|------|------|--------|
| Simple | 1 file, known pattern, CSS, missing prop | Fix inline |
| Medium | 2-3 files, clear root cause | Launch domain agent with diagnosis |
| Complex | 3-strikes, architectural, cross-concern | Invoke feature-orchestrator |

---

## Diagnostic Report Checklist

Before presenting to user, verify:

- [ ] **Classification** section with category, complexity, context
- [ ] **Investigation Sources** section names which agents were used
- [ ] **Affected Files** have line numbers, not just file paths
- [ ] **Root Cause** cites evidence from agent findings
- [ ] **Fix Options** list specific files to modify with complexity tier
- [ ] **Recommendation** explains why that option is best

**If any checkbox fails, go back to agents for more info.**
