# Agent Prompt Templates

Copy and customize these prompts when launching agents in Phase 3 (INVESTIGATE).

## debug-specialist

```
Investigate this bug in the Thoven frontend codebase:

SYMPTOM:
[Exact description of what's happening]

ERROR MESSAGE (if any):
[Exact error text]

USER FLOW:
[What steps led to this]

AUTH STATE:
[Logged in/out, user type: Parent/Teacher/Student]

INVESTIGATE:
1. Find the root cause (not just the symptom)
2. Identify ALL affected files with line numbers
3. Check git log for recent changes in affected area
4. Document the execution path that leads to the error
5. Propose 2-3 fix approaches with trade-offs

CODEBASE CONTEXT:
- Authentication: Parents/Teachers use localStorage 'token', Students use 'student_token'
- API: lib/*-api.ts files, uses Rails backend
- State: Mix of React Context (contexts/) and Redux (store/)
- Styling: Tailwind CSS 4.1, Thoven Orange = amber-500 (NOT orange-500)
```

## code-explorer

```
Trace this code path in the Thoven frontend codebase:

ENTRY POINT:
[Component or function where the flow starts]

USER ACTION:
[What the user was doing]

MAP THE FOLLOWING:
1. Full execution path from entry to the point of failure
2. All files and components involved (with line numbers)
3. State management flow (which Context or Redux slice?)
4. API calls made and their handlers
5. Dependencies between components

RELEVANT DIRECTORIES:
- Pages: app/[role]/
- Components: components/[role]/
- API layer: lib/*-api.ts
- State: contexts/, store/slices/
```

## Domain Specialist Prompts

### react-specialist (State bugs)

```
Analyze this React state management bug in the Thoven codebase:

SYMPTOM: [description]

FOCUS ON:
1. Stale closures in useEffect/useCallback
2. Missing or incorrect dependency arrays
3. Context provider value stability (unnecessary re-renders)
4. Race conditions between state updates
5. useRef vs useState misuse
```

### next-js-developer (SSR/Hydration bugs)

```
Analyze this SSR/hydration issue in the Thoven Next.js 14.2 App Router codebase:

SYMPTOM: [description]

FOCUS ON:
1. Server/client rendering mismatches (window/document access)
2. 'use client' boundary placement
3. Server Component vs Client Component data flow
4. Metadata export in client components
5. Route handler vs server action confusion
```

### api-designer (API bugs)

```
Analyze this API integration issue in the Thoven frontend:

SYMPTOM: [description]

FOCUS ON:
1. Request URL construction (API_BASE_URL correctness)
2. Auth headers (getAuthenticatedRailsHeaders())
3. Payload structure (Rails wrapper key: { resource_name: {...} })
4. Response parsing (correct nesting level)
5. Error handling for 4xx/5xx responses
```

### typescript-pro (TypeScript bugs)

```
Analyze this TypeScript issue in the Thoven codebase:

SYMPTOM: [description]

FOCUS ON:
1. Strict mode type narrowing gaps
2. Generic type inference failures
3. Discriminated union exhaustiveness
4. API response type mismatches (runtime vs compile-time)
5. Module augmentation or declaration file issues
```

### performance-analyzer (Performance bugs)

```
Analyze this performance issue in the Thoven Next.js frontend:

SYMPTOM: [description]

FOCUS ON:
1. Unnecessary re-renders (missing memo, unstable references)
2. Bundle size (large imports, missing code splitting)
3. API call patterns (N+1, missing pagination, no caching)
4. Image optimization (unoptimized, missing lazy loading)
5. Core Web Vitals impact (LCP, CLS, INP)
```

### accessibility-tester (Accessibility bugs)

```
Audit this accessibility issue in the Thoven frontend:

SYMPTOM: [description]

FOCUS ON:
1. WCAG 2.1 AA compliance
2. Keyboard navigation and focus management
3. Screen reader compatibility (ARIA attributes)
4. Color contrast ratios
5. COPPA compliance for under-13 student interfaces
```

## CRITICAL Mode: Devil's Advocate

For bugs classified as CRITICAL (data loss risk, auth bypass, production down), add a devil's advocate agent AFTER the primary agents return:

```
Task tool:
  subagent_type: "general-purpose"
  model: "sonnet"
  prompt: |
    You are the Devil's Advocate. Your job is to poke holes in this diagnosis.

    DIAGNOSIS: [paste the proposed root cause and fix]

    Challenge it:
    1. What if the root cause is actually somewhere else?
    2. What edge cases would make this fix fail?
    3. Could this fix introduce new bugs?
    4. Is there a simpler explanation?
    5. What evidence would DISPROVE this diagnosis?

    Be skeptical. The goal is to find weaknesses before the fix ships.
```
