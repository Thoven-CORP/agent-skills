# Common Errors

Known error patterns for this project. Check here first when debugging.

---

## Third-Party SDKs (Meta Pixel, PostHog, Stripe)

### Error: SDK Not Initialized
- **Symptom:** `fbq is not defined`, `posthog is not defined`, tracking calls fail silently
- **Root Cause:** SDK function called before script loaded, or called inside async callback
- **Fix:** Move tracking to separate useEffect with useRef guard, check if SDK exists before calling
- **Files:** `lib/meta-pixel/`, `lib/posthog.ts`, tracking components
- **Date Added:** 2026-01-08

### Error: Environment Variable Not Available on Client
- **Symptom:** Feature works in SSR but fails on client, `undefined` values
- **Root Cause:** Using server-side env var (like `REPLIT_DEPLOYMENT`) in client code
- **Fix:** Use `NEXT_PUBLIC_*` prefix for client-accessible env vars, or check in useEffect
- **Files:** `lib/env-config.ts`, any file checking environment
- **Date Added:** 2026-01-08

### Error: CSP Blocking Third-Party Scripts
- **Symptom:** Script blocked by Content Security Policy, pixel/analytics not loading
- **Root Cause:** Dynamic script injection without CSP nonce
- **Fix:** Load via Next.js `<Script>` component with automatic nonce handling
- **Files:** `app/layout.tsx`, `middleware.ts`
- **Date Added:** 2026-01-07

### Error: CSP Missing Required Subdomain
- **Symptom:** CSP error blocking requests, SDK fails to initialize, analytics not working
- **Root Cause:** Third-party services often use multiple subdomains (e.g., Mixpanel uses both `api.mixpanel.com` AND `api-js.mixpanel.com`). CSP only allows one.
- **Fix:** Check SDK documentation for ALL required domains. Add missing subdomains to `connect-src` in `middleware.ts`
- **Prevention:** When adding any third-party SDK, check Network tab for all domains it contacts during initialization
- **Examples:** Mixpanel (`api-js.`), Stripe (`hooks.`, `js.`), Google (`www.`, `maps.`), tldraw (`cdn.tldraw.com` for translations, fonts, icons — needs both `connect-src` AND `font-src`)
- **Files:** `middleware.ts`
- **Date Added:** 2026-01-16

### Error: SDK Re-Initialization / Duplicate Instance
- **Symptom:** "Duplicate ID" warnings, inflated event counts, memory leaks, slower performance
- **Root Cause:** Calling SDK `init()` function multiple times - often in event handlers or on every render
- **Fix:** Initialize SDK ONCE in a top-level provider. Use a guard flag (`window._sdkInitialized`) to prevent re-init. Never call init() inside event tracking functions.
- **Prevention:** Separate initialization (provider/layout) from usage (event functions). Search codebase for `init(` calls - should be exactly ONE per SDK.
- **Applies to:** Meta Pixel (`fbq('init')`), Mixpanel (`mixpanel.init`), PostHog (`posthog.init`), GA4 (`gtag('config')`)
- **Files:** Provider files, event tracking files
- **Date Added:** 2026-01-16

### Error: Consent-Gated Analytics Silent Event Loss
- **Symptom:** Conversion events (signup, purchase) not appearing in analytics dashboard, but only for NEW users. Returning users track correctly.
- **Root Cause:** Consent-gated analytics (GDPR/CCPA) only initialize AFTER user accepts cookies. Events fired BEFORE consent are silently dropped with `if (!canTrack()) return` pattern.
- **Fix:** Implement event queue that stores events when SDK not ready, then flushes after initialization. See `lib/meta-pixel/event-queue.ts` for reference implementation.
- **Prevention:** When implementing consent-gated analytics, ALWAYS ask: "What happens to events fired before consent?" Never use silent `return` - queue or warn instead.
- **Applies to:** Meta Pixel, Mixpanel (consent mode), GA4 (consent mode), PostHog (consent mode), any GDPR-compliant analytics
- **Files:** Analytics provider files, event tracking functions
- **Date Added:** 2026-01-23
- **Reference:** Meta Pixel Event Queue implementation

### Error: Over-Scoped Compliance Gate Kills All Analytics
- **Symptom:** Analytics events drop 70-100% overnight across ALL platforms (Mixpanel, GA4, Google Ads). Chart shows cliff-edge drop coinciding with a compliance commit. Events only appear for users who explicitly click "Accept" on a cookie banner.
- **Root Cause:** Compliance work (COPPA, GDPR) gated SDK initialization behind cookie consent for ALL users, when the regulation only required gating for a subset (e.g., children under 13 on `/student` routes). The `if (getConsent()) { initSDK() }` pattern means the SDK never loads for users who don't interact with the consent banner. The X/close button on the banner was wired to "Decline" (permanent opt-out), not "Dismiss".
- **Fix:** Gate analytics by route (e.g., `/student` check), not by cookie consent. For US platforms, COPPA only requires blocking children under 13. Adults don't need opt-in consent for analytics. Each SDK's own consent API (e.g., Meta's `fbq('consent', 'revoke')`) is the correct layer for consent, not blocking initialization.
- **Prevention:** When implementing compliance gating, always ask: (1) WHO does this regulation apply to? (2) What's the narrowest gate that satisfies the requirement? A route check is narrower than a cookie consent check. Never gate all users when only a subset needs protection.
- **Applies to:** Any analytics SDK (Mixpanel, GA4, Google Ads, Meta Pixel) gated behind consent checks
- **Files:** `app/providers.tsx`, `app/layout.tsx` inline scripts, any analytics provider
- **Date Added:** 2026-03-30
- **Reference:** COPPA Wave 2 (commit 4876ea3, March 26) gated all analytics behind cookie consent. Fixed by removing consent gate and keeping only the `/student` route check.

### Error: SDK Stub Flag Prevents Real Script Bootstrap
- **Symptom:** Third-party tracking script loads (visible in Network tab, no errors) but never sends any data. Events queue up silently. Other tracking systems (e.g., Google Ads) work fine, making it look like tracking is working.
- **Root Cause:** The "stub + script" initialization pattern creates a lightweight queue function first, then loads the vendor's real script to replace it. A flag on the stub (e.g., `fbq.loaded`) tells the real script whether bootstrap is needed. Setting this flag to `true` on the stub tells the real script "I'm already the real tracker, skip bootstrap" — so the real script sits idle, the stub queue becomes a dead end, and no events ever reach the vendor's servers.
- **Fix:** Set the bootstrap flag to `false` on the stub. The stub is NOT the real tracker — the flag must reflect that so the real script knows to activate.
- **Prevention:** When implementing any stub + script pattern, audit every property on the stub object against the vendor's documentation. Flags like `loaded`, `initialized`, `ready` are handshake signals — their values on the stub must tell the real script "I'm just a placeholder, please take over." Copy-pasting stub code from tutorials/StackOverflow is risky; the official SDK snippet is the source of truth.
- **Applies to:** Meta Pixel (`fbq.loaded`), and potentially any analytics SDK using the stub + script pattern (GA4, LinkedIn Insight, TikTok Pixel, Pinterest Tag)
- **Files:** `lib/meta-pixel/pixel-core.ts`, any SDK initialization file using stub pattern
- **Date Added:** 2026-03-09
- **Reference:** `fbq.loaded = true` in pixel-core.ts:88 blocked ALL Meta Pixel tracking in production. Zero requests to facebook.com/tr/ despite pixel loading successfully. Fixed in v1.10.5.

### Error: Image Loading Without Fallback
- **Symptom:** Broken image icon, teacher profile picture not loading, blank avatar
- **Root Cause:** Next.js `<Image>` component without `onError` handler, image URL returns 404
- **Fix:** Replace with `<img>` + `onError` fallback, or add error state to handle broken images
- **Files:** `components/parent/TeacherSummaryCard.tsx`, any component with profile images
- **Date Added:** 2026-01-16
- **Reference:** CHANGELOG [1.0.18] - Teacher Profile Picture Not Loading

### Error: Currency/Number Formatting Missing
- **Symptom:** Numbers display without currency symbol, commas, or decimal places (e.g., `2450` instead of `$2,450.00`)
- **Root Cause:** Raw number interpolation `${value}` without `Intl.NumberFormat`
- **Fix:** Use `formatCurrency()` from `lib/format-utils.ts` or create formatter with `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`
- **Files:** `lib/format-utils.ts`, dashboard components displaying prices/earnings
- **Date Added:** 2026-01-16
- **Reference:** CHANGELOG [1.0.25] - Teacher Earnings Currency Formatting

### Error: Analytics Events Lost on Safari Mobile During Navigation
- **Symptom:** Analytics events (signup_completed, purchase, etc.) fire in code but never reach analytics dashboard. Works on Chrome, fails on Safari mobile.
- **Root Cause:** Safari mobile aggressively cancels in-flight XHR requests during page transitions. When you call `track()` then immediately trigger state changes (`setState`) or navigation (`router.push`), Safari may abort the network request before it completes.
- **Fix:** Use `navigator.sendBeacon()` transport instead of XHR for "fire and forget" analytics. Add small delay (100ms) before state changes as defensive measure.
- **Prevention:** For any analytics event that fires immediately before navigation or major state changes (signup completion, form submit, checkout), use sendBeacon transport. Test on actual Safari iOS device, not just Chrome DevTools mobile emulation.
- **Applies to:** Mixpanel (`{transport: 'sendBeacon'}`), GA4, PostHog, any analytics SDK with XHR default
- **Files:** Analytics tracking files, signup/checkout components
- **Date Added:** 2026-01-23
- **Reference:** CHANGELOG [1.0.35] - Safari Mobile Analytics Fix

---

## React Hooks / State

### Error: Stale Closure in useEffect
- **Symptom:** State value is outdated inside callback, timer shows old value
- **Root Cause:** Closure captures variable at creation time, not updated on re-render
- **Fix:** Add dependency to array, use functional state updates `setState(prev => ...)`, or use useRef
- **Files:** Any component with useEffect + callbacks
- **Date Added:** 2026-01-08

### Error: Missing useEffect Dependency
- **Symptom:** Effect doesn't re-run when expected, stale data displayed
- **Root Cause:** Dependency array missing required values
- **Fix:** Add all referenced variables to dependency array, use ESLint exhaustive-deps rule
- **Files:** Any component with useEffect
- **Date Added:** 2026-01-08

### Error: useEffect Cleanup Not Running
- **Symptom:** Memory leaks, duplicate event listeners, React 18 StrictMode double-mount issues
- **Root Cause:** Missing cleanup function in useEffect
- **Fix:** Return cleanup function from useEffect, remove listeners/timers/subscriptions
- **Files:** Components with subscriptions, timers, or event listeners
- **Date Added:** 2026-01-08

### Error: useRef Not Reset After React Strict Mode Double-Invoke
- **Symptom:** `useRef(true)` value is `false` from the start, async operations abort silently via `if (!ref.current) return`, component appears stuck/frozen mid-flow
- **Root Cause:** React 18 Strict Mode (enabled by default in Next.js dev) double-invokes effects: mount → cleanup → mount. If cleanup sets `ref.current = false`, the ref stays `false` because `useRef(initialValue)` only sets the value on first creation, not on remount. The second mount's effect body never resets it.
- **Fix:** Set `ref.current = true` in the effect body, not just via `useRef(true)`: `useEffect(() => { ref.current = true; return () => { ref.current = false } }, [])`
- **Prevention:** Any `isMountedRef` or similar guard ref MUST be reset in the effect body, not just initialized via `useRef()`. Search for `useRef(true)` paired with cleanup-only effects — they're all broken under Strict Mode.
- **Applies to:** Any `isMountedRef`, `isActiveRef`, `isRunningRef`, or similar boolean ref used to guard async operations, with cleanup that sets it to `false`
- **Files:** Components with async operations guarded by mount-tracking refs
- **Date Added:** 2026-02-02
- **Reference:** Signup flow stuck at loading step — isMountedRef was false from start, silently aborting API calls

### Error: Missing Optimistic Update for Async Backend Operations
- **Symptom:** User performs an action (approve, submit, purchase), the action succeeds, but the UI value doesn't change. Even after re-fetching from the backend, the value is still stale. Works correctly after waiting 30+ seconds or doing a hard refresh much later.
- **Root Cause:** The action triggers an asynchronous backend process (Stripe payment capture, webhook processing, third-party API call, background job) that takes seconds to minutes to complete. The frontend re-fetches the data, but the backend hasn't finished processing yet, so it returns the old value. Delayed re-fetches (e.g., at 3s, 8s) help but often aren't long enough.
- **Fix:** Optimistically update the UI using data already available from the action. The API response from the action (or the request data itself) typically contains the values needed to compute the new UI state. Apply the change locally first, then keep delayed re-fetches as an eventual consistency mechanism to correct any discrepancies (e.g., platform fees).
- **Prevention:** When building any UI that displays a value affected by an asynchronous backend operation, ask: "What data do I already have from the action to update this immediately?" The action's API response or the request payload almost always has the amount/count/status needed. Never rely solely on re-fetching for user feedback when the backend involves external services (Stripe, SendGrid, webhooks). Pattern: `setLocalState(optimisticValue)` immediately, then `refetchFromBackend()` on a delay for eventual consistency.
- **Applies to:** Earnings/balance displays after payment capture, credit/wallet balances after purchases, status badges after async state transitions, any UI value computed by a backend background job or external API
- **Files:** Dashboard components displaying computed values, wallet/balance components, any UI reflecting async backend state
- **Date Added:** 2026-02-23
- **Reference:** Teacher earnings stayed stale after purchase approval — Stripe capture takes seconds, 3s/8s re-fetch still returned old value. Fixed with optimistic increment from `total_cost_cents` in the approval response (v1.3.2)

### Error: Overloaded Init Ref Causes Stale-Closure Double-Fetch
- **Symptom:** URL param filter (e.g., `?instruments=guitar`) appears applied in the UI but results are unfiltered. Works correctly after manually removing and re-adding the filter.
- **Root Cause:** A single `useRef` flag serves two purposes: "SSR data loaded" and "URL params loaded." A searchParams `useEffect` sets the flag and calls `loadTeachers(params)` correctly. A second `activeTab` effect sees the flag, enters an if-block, and schedules `setTimeout(() => loadTeachers(), 0)`. That setTimeout holds a **stale closure** of `loadTeachers` captured before the `setFilters` state update committed (`filters = {}`). When the timeout fires, it aborts the correct in-flight request and fetches with no filters. UI filter chips still show the param value because `setFilters` state committed correctly.
- **Fix:** Add a separate `urlParamsTriggeredLoad` ref. In the searchParams effect, set it to `true` before calling `loadTeachers`. In the activeTab effect's init-flag block, check this second ref and `return` early (skip the setTimeout entirely). The SSR branch can still schedule its refresh — the two paths are now distinguished.
- **Prevention:** When a single boolean ref guards multiple distinct initialization paths (SSR vs URL params), split it into per-path refs. Any `useEffect` with `deps = [activeTab]` that also captures a `useCallback` depending on state will have a stale closure if that state is set by a sibling effect on the same render cycle. Use refs as an escape hatch or ensure the effect re-runs when the callback changes.
- **Applies to:** Any page with both SSR prefetch and URL-param-driven filter initialization that shares an init guard ref across `useEffect`s with different dep arrays.
- **Files:** `app/marketplace/MarketplacePageClient.tsx`
- **Date Added:** 2026-04-01
- **Reference:** Landing page instrument buttons navigated to `/marketplace?instruments=guitar` — filter chip appeared but results were unfiltered because a stale-closure setTimeout fetch aborted the correct filtered request

### Error: External State Read at Mount Instead of Action Time
- **Symptom:** Feature uses stale data, step doesn't appear, works on refresh but not dynamically
- **Root Cause:** Reading external state (sessionStorage, localStorage, URL params, cookies) in useEffect on mount - captures value at mount time, doesn't react to changes
- **Fix:** Read external state at action time (in event handlers like `handleSubmit`) OR use state + effect to sync
- **Prevention:** Ask "When does this value change?" If during user flow, read it when needed, not at mount.
- **Applies to:** sessionStorage, localStorage, URL search params, cookies, window properties
- **Files:** Multi-step wizards, signup flows, any cross-component state
- **Date Added:** 2026-01-16

### Error: Stale Derived State After Partial Save
- **Symptom:** UI checklist/progress/summary doesn't update after saving, even though the save succeeded. Works after full page refresh.
- **Root Cause:** The save endpoint updates one resource (e.g., individual packages) but the response doesn't include derived data (e.g., completion status) that depends on the saved resource. The frontend falls back to stale derived state: `completion: response?.completion || prev.completion` — since response is null, prev (stale) wins.
- **Fix:** After saves that don't return derived data, explicitly re-fetch the derived data from its own endpoint. Wrap in try/catch so fetch failure doesn't block save success.
- **Prevention:** When writing save handlers, ask: "Does this save affect any derived/computed data shown in the UI?" If yes, either (a) ensure the save endpoint returns the derived data, or (b) re-fetch it after save. Watch for comments like "you'd want to refetch here" — they indicate known gaps.
- **Applies to:** Profile completion checklists, progress bars, computed summaries, any UI that aggregates data from multiple sources
- **Files:** Components with multi-endpoint save handlers, tab-based editors
- **Date Added:** 2026-01-29
- **Reference:** Profile completion stale state bug — package visibility save didn't refresh completion checklist

### Error: Safari Mobile sessionStorage Unreliable
- **Symptom:** Feature works on Chrome but fails on Safari iOS. Cross-page state lost, user redirected to wrong place, multi-step flow breaks.
- **Root Cause:** Safari Mobile can lose sessionStorage data due to: (1) Private Browsing mode clears storage unpredictably, (2) WebKit Bug 199929 causes storage loss, (3) Low memory conditions evict storage. Chrome doesn't have these issues.
- **Fix:** Never rely solely on sessionStorage for critical flow state. Use dual-storage: sessionStorage (primary) + URL params (backup). Check both on read.
- **Prevention:** For any cross-page state that MUST survive navigation (signup context, checkout state, wizard progress), always implement fallback: `sessionStorage || URLSearchParams`. Test on actual Safari iOS in Private mode.
- **Applies to:** Multi-step flows, signup/checkout wizards, any state passed between pages
- **Files:** Cross-page flow components, signup panels, checkout flows
- **Date Added:** 2026-01-23
- **Reference:** CHANGELOG [1.0.35] - Safari Mobile Signup Redirect Bug

### Error: Silent Field Drop in Context State-Seed Spread
- **Symptom:** UI renders a hardcoded placeholder or falsy fallback where a real backend value is expected. The field IS on the wire (non-optional in the TS type, confirmed via curl or test fixture) but never appears in state. Works on other adjacent fields (`teacherName` populates) but one specific field (`lessonTitle`, `enrollmentId`, etc.) is always empty string or undefined.
- **Root Cause:** When state-seed code destructures fields from an API response via explicit key assignment instead of spread (`{...prev, teacherName: data.teacher_name}` style), any field NOT listed is silently discarded. Adding a new field to the API response type does NOT automatically surface it in state — the setState call must be updated to include the new field. TypeScript doesn't catch this: extra fields on `data` are allowed, and the absent key in state defaults to the initial value.
- **Fix:** Grep every setState spread that consumes the relevant response type for drift. Add the missing `fieldName: data.field_name,` line. If the field is non-optional in the TS type, no `?? ''` needed. If nullable on the wire, defensively default it.
- **Prevention:** When widening a response type with a new field, treat it as a two-part change: (1) update the TS type, (2) grep every state-seed site (`contexts/`, `store/`) that reads that response type and audit whether the new field needs to be threaded through. Add a regression test in the context's test suite that asserts the field is seeded from a representative fixture. Don't rely on TS to catch field drops — it won't.
- **Applies to:** React Context state-seed patterns (`refetchRoom`, `fetchUser`, any API-response-to-state mapper), Redux slices that set state from API responses, any setState that spreads a response DTO with explicit key assignment.
- **Files:** `contexts/*Context.tsx`, `store/slices/*Slice.ts`, anywhere `setState(prev => ({...prev, field: data.field}))` pattern exists
- **Date Added:** 2026-04-21
- **Reference:** B-29 (student LiveLessonShell hardcoded "Music Lesson" / "Your Teacher" — `data.lesson_title` dropped in SyncContext student branch despite non-optional TS type). Same species as B-30 (teacher-side equivalent where `student_name`/`lesson_title` aren't even on the backend response yet). Fix commit: `757ba2b7`.

### Error: Fixed-Duration Loading Theater Races In-Flight Request
- **Symptom:** A timed loading/celebration animation ("theater") that plays while an async request runs sometimes ends in the failure/fallback branch even though the request succeeds — but only sometimes, and disproportionately for users with `prefers-reduced-motion` (whose theater finishes near-instantly) or on fast animations / slow backends. Downstream steps receive empty IDs and the flow silently dead-ends.
- **Root Cause:** The completion effect treats "theater finished AND result not yet present" as failure. The animation duration and the request latency are independent clocks; whichever finishes first wins. A null/absent result mid-flight is AMBIGUOUS — it means "not yet" or "failed", and the code collapsed both into "failed". Reduced-motion users hit it almost every time because their theater duration approaches zero.
- **Fix:** Never infer failure from absence. Track failure as an explicit state set only by the request's catch/exhausted-retries branch (e.g., a `creationFailed` flag or a `'pending' | 'created' | 'failed'` tri-state). The completion effect requires `theaterDone && (result || failed)` — if neither, it simply waits.
- **Prevention:** Any time a fixed-duration animation gates a transition that also depends on an async result, enumerate the three terminal states (success / failure / still-pending) and make sure pending is representable. Test the race both ways: artificially slow the request, and run with reduced-motion emulation (which compresses animation time to ~0 and exposes the race deterministically).
- **Applies to:** Signup/checkout "creating your account..." theaters, celebration screens that gate navigation, splash/min-display-time loaders, any `setTimeout`-or-animation-complete callback that reads async state.
- **Files:** Any component pairing `theaterDone`/`animationComplete` state with in-flight request results
- **Date Added:** 2026-06-11
- **Reference:** `ParentSignupFlow.tsx` — reduced-motion theater (~600ms) beat `createStudent`; the fallback effect read `!studentId` as "student creation failed", fired `onSuccess` with an empty studentId, and invite enrollments dead-ended at `/parent/dashboard` (student created but never enrolled). Hit a11y users in prod. Fixed with an explicit `studentCreationFailed` flag set only on exhausted retries.

---

## UI / Component Communication

### Error: Responsive Double-Render Duplicates Content in the DOM (phantom duplicates)
- **Symptom:** A bug report claims records/items appear "duplicated" on a page, naming specific entities. Users cannot reproduce it visually in any browser. The API returns each record exactly once. But greps, scrapers, SEO crawlers, view-source, or an AI agent reading the page all report every item exactly 2× (or N×).
- **Root Cause:** The component renders the *same* content twice — once in a mobile block (`flex sm:hidden`) and once in a desktop block (`hidden sm:flex`) — and lets CSS hide one. `display:none` removes an element from *paint*, not from the *DOM*. So every consumer that reads markup rather than pixels sees the content N times, where N = number of breakpoint variants. The multiplier is a dead giveaway: if the DOM has exactly 2× the headings/names of the visible item count, this is it. It is NOT a data or pagination bug, and time spent hunting the data layer is wasted.
- **Fix:** Render the content **once** and let CSS reposition it. Use a single element with responsive utilities (`text-lg sm:text-xl`, `sm:flex sm:items-baseline`) instead of two sibling blocks. When the two breakpoints need different *ordering*, keep one DOM node per field and reorder with flex `order-*` utilities rather than duplicating the markup.
- **Prevention:** Never solve a responsive layout difference by rendering the same text twice under complementary `hidden`/`sm:hidden` classes. Before doing so, ask: "will this duplicate content in the HTML?" A quick check on any list page: `curl <url> | grep -o '<h2' | wc -l` and compare against the visible item count — if it's an exact multiple, you have a double-render. When triaging *any* "duplicates" report, **first establish whether the duplication was seen with human eyes or derived from markup/tooling** — the two have completely different root causes.
- **Applies to:** Any responsive component with parallel mobile/desktop blocks — cards, list rows, headers, nav, tables. Also causes duplicate `<h1>`/`<h2>` SEO warnings and inflated word counts.
- **Files:** Any component using paired `flex sm:hidden` / `hidden sm:flex` blocks containing the same text
- **Date Added:** 2026-07-13
- **Reference:** "Duplicate profiles on the marketplace (Noah Gunn, Marissa Ruiz and more)." The API returned 91 teachers / 91 unique IDs across every sort and page size; live browsers showed zero duplicate cards. `TeacherListCard.tsx` rendered the name in two `<h2>`s (mobile `:156`, desktop `:180`) → SSR HTML carried 40 `<h2>` for 20 teachers. Fixed by collapsing to one header block (name/instruments/location/age rendered once) with flex `order-*` handling the per-breakpoint ordering: 20 teachers → 20 `<h2>`.

### Error: Server Pagination Guarantee ≠ Client Merge Safety
- **Symptom:** An infinite-scroll list can show the same row twice. A code comment asserts it cannot — e.g. `// APPEND new items (cursor guarantees no duplicates)` — directly above a blind `setItems(prev => [...prev, ...response.data])`.
- **Root Cause:** A cursor guarantees the **server** won't repeat a row *for a given cursor*. It guarantees nothing about the **client** requesting the same cursor twice, or appending a page keyed to a stale boundary. Three ways it breaks: (1) the in-flight guard is React **state** (`if (isLoading) return`), so two callbacks in the same tick both read the stale `false` and both fetch; (2) SSR fetches a different `per_page` than the client, so the SSR cursor points at a different page boundary than the list the client actually holds, and a load-more on it returns overlapping rows; (3) `AbortController.abort()` is a no-op on a promise that *already resolved* — the async tail still runs and commits.
- **Fix:** (1) Dedupe by id at the merge: build a `Set` of existing ids and filter the incoming page — makes duplicates impossible by construction. (2) Use a `useRef` in-flight lock, checked and set **synchronously before any `await`**; keep the state flag only for the spinner. (3) Re-check `controller.signal.aborted` *after* the `await`, before committing. (4) Keep SSR and client `per_page` identical.
- **Prevention:** Treat any comment asserting an invariant you did not enforce in code as a bug waiting to happen — especially "X guarantees no duplicates." Guard concurrency with a **ref**, never with state: state is not atomic across callbacks in the same tick. Dedupe at every append into an accumulating list, even when you "know" the source is clean; it costs one `Set` and removes a whole class of race. Note a `disabled={isLoading}` prop is useless if the button is also conditionally *unmounted* while loading.
- **Applies to:** Any cursor/offset infinite scroll, "load more" list, paginated feed, or accumulating fetch (search results, notifications, chat history)
- **Files:** Any client component that appends paginated API responses into a list
- **Date Added:** 2026-07-13
- **Reference:** `MarketplacePageClient.tsx:531` appended blind under the comment "cursor guarantees no duplicates"; SSR asked `per_page=12` while the client got the backend default of 20, so a load-more on the SSR cursor would fetch rows 13–32 onto rows 1–20 (8 duplicates). Proven by sabotage test: removing the ref lock made two same-tick clicks fire two fetches for the same cursor.

### Error: tldraw Custom Shape Pointer-Events Block
- **Symptom:** Custom tldraw shape renders correctly but clicking interactive children (buttons, piano keys, toggles) does nothing. React `onPointerDown` handlers are registered but never fire. Drag and resize work. Tests pass. Two fix attempts adding `HTMLContainer` + `canEdit()` + `stopPropagation()` had no effect.
- **Root Cause:** Two compounding CSS gates block pointer events in tldraw v4. (1) `<HTMLContainer>` renders a `<div class="tl-html-container">` with `pointer-events: none` baked into `editor.css:1219`. It is a sizing/positioning primitive, NOT an "enable clicks" primitive — the opposite of what its name suggests. (2) Shapes without a `fill` prop in their schema get `data-shape-is-filled='false'` on the `.tl-shape` wrapper, which excludes them from the CSS rule (`tldraw.css:868-877`) that gives selected/editing shapes `pointer-events: all`. React `onPointerDown` handlers on children are registered but unreachable because the browser's hit test stops at the `pointer-events: none` ancestor. Tests don't catch this because they mock `HTMLContainer` as a pass-through Fragment.
- **Fix:** (1) Add `pointerEvents: isEditing ? 'all' : ('none' as const)` as an inline style on the innermost wrapper div inside `HTMLContainer`. (2) Add `fill: T.literalEnum('solid')` to the shape's schema props and `fill: 'solid' as const` to `getDefaultProps()`. (3) Call `useIsEditing(shapeId as TLShapeId)` to drive the conditional. This is the exact pattern tldraw's own `VideoShapeUtil` and `EmbedShapeUtil` use.
- **Prevention:** When creating any custom tldraw ShapeUtil with interactive children: (a) always add `fill: T.literalEnum('solid')` to the schema, (b) always add `pointerEvents: isEditing ? 'all' : 'none'` on the interactive wrapper inside `HTMLContainer`, (c) reference `VideoShapeUtil` in `node_modules/tldraw/src/lib/shapes/video/VideoShapeUtil.tsx:171-178` as the canonical pattern. Never assume `HTMLContainer` alone enables pointer events.
- **Applies to:** Any custom tldraw ShapeUtil with interactive React children — widgets, embedded controls, form elements, audio/video players, timers
- **Files:** Custom shape files in `components/shared/whiteboard/shapes/`, tldraw CSS at `node_modules/@tldraw/editor/editor.css:1219` and `node_modules/tldraw/tldraw.css:868`
- **Date Added:** 2026-04-15
- **Reference:** Metronome + Piano shapes unclickable through 3 fix cycles. Root cause: `HTMLContainer` = `pointer-events: none` + missing `fill` schema prop = `data-shape-is-filled='false'`. Fixed by mirroring VideoShapeUtil pattern.

### Error: flex-1 Has No Effect on Non-Flex Parent
- **Symptom:** Element has `flex-1` but renders with 0 height. Container appears empty despite correct child content.
- **Root Cause:** `flex-1` (Tailwind's `flex: 1 1 0%`) only works when the parent is a flex container (`display: flex` or `display: inline-flex`). If the parent gets its dimensions from positioning context (e.g., the parent is a flex child itself but not a flex container), `flex-1` on the child has no effect — the child collapses to 0 height.
- **Fix:** Use `w-full h-full` instead of `flex-1` when the parent has dimensions from the flex chain but is not itself a flex container. Or add `flex flex-col` to the parent.
- **Prevention:** When using `flex-1`, verify the immediate parent has `flex`, `flex-col`, or `flex-row`. If the parent only has `flex-1` (making it a flex child but not a flex container), the child needs `w-full h-full` instead.
- **Applies to:** Any dynamically-imported component (tldraw, map embeds, video players) that requires explicit container dimensions
- **Files:** Any component wrapping a third-party library with dimension requirements
- **Date Added:** 2026-04-08
- **Reference:** ThovenCanvasInner used `flex-1` but parent `canvas-slot` div was not a flex container — tldraw rendered at 0 height

### Error: Inconsistent Empty-Content Detection Across Rich-Text Renderers
- **Symptom:** A surface that should show "no content yet" instead renders a single visible space or a blank prose block. Empty-state filtering on one screen disagrees with empty-state rendering on another (e.g., a record is filtered out of a list but its detail view still shows it as having content).
- **Root Cause:** Rich-text editors like TipTap save "empty" content as `<p>&nbsp;</p>` or `<p></p>`, not `''`. A naive emptiness check that only strips HTML tags (`html.replace(/<[^>]*>/g, '').trim()`) leaves `&nbsp;` intact (which trim won't catch), reporting a blank note as non-empty. Multiple components reimplement this check with subtly different rules — one strips `&nbsp;`, another doesn't — so the same payload is classified differently across screens.
- **Fix:** Decode common HTML entities (`&nbsp;`, `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`) before stripping tags and trimming. Better: extract a single `hasRichTextContent(html)` helper and import it everywhere a "has content" check happens.
- **Prevention:** When you see two components computing "is this empty?" on the same data shape, that's a missing helper, not a copy-paste opportunity. For any TipTap/ProseMirror/Quill output, the canonical empty test must decode `&nbsp;` — test with `<p>&nbsp;</p>` explicitly, not just `''` and `<p></p>`.
- **Applies to:** Any feature reading rich-text HTML produced by TipTap or similar editors (session notes, lesson plans, comments, descriptions)
- **Files:** `components/teacher/classroom/SessionNotepad.tsx`, `HistoryMode.tsx`, `CanvasBottomStrip.tsx`, `SessionHistoryDetailModal.tsx`, any future modal/list/preview that renders editor output
- **Date Added:** 2026-04-25
- **Reference:** Session History detail modal initially showed blank notes as a visible space because `hasNotes` stripped tags but didn't decode `&nbsp;`; HistoryMode's `stripHtml()` did, creating filter-vs-render disagreement

### Error: Null Value Passed to String Formatter
- **Symptom:** `TypeError: Cannot read properties of null (reading 'replace')` inside `Array.map` during render
- **Root Cause:** A utility formatter calls string methods (`.replace`, `.toUpperCase`, etc.) directly on its argument, but the API returns `null` for that field on some records. TypeScript types may be optimistically typed as `string` when the backend column is actually nullable.
- **Fix:** Add a null guard at the top of the formatter function: `if (!s) return '—'`
- **Prevention:** All formatter utilities that accept API data should accept `string | null | undefined` and return a fallback. Never assume a string field from the backend is non-null without a DB constraint to back it up.
- **Applies to:** Any `lib/*-utils.ts` or `lib/format-utils.ts` formatter receiving data from API responses
- **Files:** `lib/admin-utils.ts`, `lib/format-utils.ts`, any custom formatter utility
- **Date Added:** 2026-04-01
- **Reference:** `formatLabel()` crashed on `/admin/matches` when `lesson_format` was null in some match records

### Error: Modal/Panel Not Switching
- **Symptom:** Clicking button does nothing, panel doesn't open from modal
- **Root Cause:** Missing callback prop (e.g., `onSignUpClick` not passed)
- **Fix:** Add hidden trigger pattern - close modal, setTimeout, trigger hidden button
- **Files:** `components/teacher/TeacherProfile.tsx`, modal components
- **Date Added:** 2026-01-08

### Error: Hardcoded Display Value Ignoring Backend Conditional Field
- **Symptom:** UI shows incorrect information for a specific subtype. For example, "Credit refunded: 1 lesson" appears for free intro calls (which have no credits), or a dollar amount appears for partner-covered purchases (which have no payment).
- **Root Cause:** The frontend hardcodes a display value (text, badge, amount) that is only correct for one variant of the data. The backend provides a conditional field (e.g., `credit_refunded: boolean`, `payment_amount: number | null`) that distinguishes variants, but the frontend ignores it and always renders the same thing.
- **Fix:** Read the backend's conditional field and render accordingly. Use conditional rendering (`{field && <Component />}`) or a switch/map for multiple variants. Never hardcode values that depend on the data type.
- **Prevention:** When building UI for notifications, badges, or status displays, ask: "Are there subtypes where this text/value doesn't apply?" Check the API response for fields that distinguish subtypes (booleans, nullable fields, enum values). Common subtypes: free vs paid, regular vs partner, intro vs lesson, trial vs subscription.
- **Applies to:** Notification text, refund/credit displays, payment badges, any UI rendering contextual information about a record that has multiple subtypes
- **Files:** Notification popup components, badge/status components, card components rendering dynamic text
- **Date Added:** 2026-02-23
- **Reference:** BookingNotificationPopup hardcoded "Credit refunded: 1 lesson" for all teacher-cancelled notifications including free intro calls. Backend provides `credit_refunded` boolean. (v1.3.0)

### Error: Hydration Mismatch
- **Symptom:** "Text content did not match" warning, UI flickers on load
- **Root Cause:** Server renders different content than client (Date, Math.random, window access)
- **Fix:** Use useEffect for client-only values, guard with `typeof window !== 'undefined'`
- **Files:** Any component using Date, random values, or browser APIs
- **Date Added:** 2026-01-08

### Error: State Machine Transition Skipped / Wrong Order
- **Symptom:** Wrong screen shows, intermediate step skipped, user sees flash of previous state
- **Root Cause:** Direct state jump (e.g., `setStep(5)`) bypasses required intermediate states. Or calling `setShowX(false)` triggers re-render before navigation.
- **Fix:** Define explicit state transitions. Show intermediate states (success screens) BEFORE navigation. Don't hide current state until after navigation completes.
- **Prevention:** Draw the state machine. Verify each transition path. Use delays (`setTimeout`) for user feedback before transitions.
- **Applies to:** Multi-step wizards, signup flows, checkout flows, onboarding tours
- **Files:** Any component with sequential steps or modal flows
- **Date Added:** 2026-01-16

### Error: Parent Unmounts Child Mid-State-Transition (React 18 Batching)
- **Symptom:** Child component flips to a new internal state (e.g., a "success" celebration) but the user never sees it — the screen jumps directly past the new state. Unit tests of the child in isolation pass; the bug only manifests in the integrated parent-child tree.
- **Root Cause:** Child fires a callback (e.g., `onSubmitSuccess?.()`) synchronously after `setMode('success')`. The parent's handler calls `setSomeState(null)` which gates the child's mount via a conditional (`{condition ? <Child /> : ...}`). React 18 automatic batching collapses both updates into one render flush. Top-down reconciliation re-renders the parent first, the conditional culls the child from the tree, the child's new state is committed to fiber but never reaches the DOM.
- **Fix:** Strip the unmount logic from the parent's success/done callback. Make the callback a pure data-refresh hook (e.g., refetch list, fire analytics). Closing the child should be triggered by an explicit user action — typically a "Back / Done" button inside the child that calls `onBack` (a separate prop). Avoid `setTimeout` workarounds that try to defer the unmount; they're brittle against animation-duration changes.
- **Prevention:** When a child has a success/done state with its own UI (celebration, confirmation), audit every callback the child fires on entry to that state. If the parent's handler closes the panel/modal/conditional, decouple closing from data-refresh: a `data-only` callback (refetch, analytics) and an explicit `onBack` for closing. Add a parent-level integration test that drives child success → asserts child stays mounted → asserts close happens only on `onBack`. Unit tests of the child alone CANNOT catch this — the parent's conditional must be in the test tree.
- **Applies to:** Panels with celebration / confirmation / success-summary states; multi-step wizards where the final step has its own UI; any modal where the done callback also triggers close
- **Files:** Any parent that conditionally renders a child based on state, where the child has terminal "success" branches
- **Date Added:** 2026-05-03
- **Reference:** Surface 1 student homework submission ceremony Variants A/C/D never rendered live despite shipping Iteration 2C celebration animations and 51 passing unit tests. `StudentAssignmentsPanel`'s `onSubmitSuccess={() => { setActiveAssignment(null); fetchAssignments() }}` collapsed with `SubmissionPanel`'s `setMode('success')` in the same React 18 batch, unmounting the panel before the ceremony could paint. Fix: dropped `setActiveAssignment(null)` from `onSubmitSuccess`; closing now flows through `onBack` (which the variants' "Back to assignments" buttons already call).

### Error: Image Preview Backdrop Hides Transparent Content
- **Symptom:** User-uploaded image submission renders as a solid black (or solid white) box even though the network request succeeds, content-type is correct, and opening the same URL in a new tab displays the image fine. No fallback card, no broken-image icon, no console error.
- **Root Cause:** The image preview component wraps `<img>` inside a container with a solid backdrop (typically `bg-black`, copy-pasted from a video letterbox branch). Transparent PNGs with dark line-art (or any image whose content matches the backdrop color) become 100% invisible against that backdrop — black-on-transparent over `bg-black` has zero visual contrast. The image IS loading; you just can't see it.
- **Fix:** Replace the solid-color backdrop with a transparency-aware checkerboard pattern (CSS gradient — the universal "this image has transparency" affordance used by Figma/Photoshop/GIMP). Solid black is correct only for VIDEO containers (legitimate letterbox color); IMAGE containers must be transparency-friendly.
- **Prevention:** When designing image preview UIs, always test with: (a) a fully opaque photo, (b) a transparent PNG with dark content, (c) a transparent PNG with light content. If any of the three becomes visually invisible, the backdrop is wrong. Don't copy container chrome from video branches into image branches without re-evaluating — they have different visual requirements.
- **Diagnostic shortcut:** Before chasing CORB / CORS / token-expiry / content-type hypotheses for "image renders black," DOWNLOAD THE IMAGE BYTES (`curl > /tmp/x.png; file /tmp/x.png; open /tmp/x.png`) and look at it. If it's transparent or matches the backdrop color, you've found the bug in 30 seconds instead of 30 minutes.
- **Applies to:** Any user-uploaded image preview (homework submissions, profile avatars, materials thumbnails, message attachments) — anywhere the user controls the image content and the backdrop is solid.
- **Files:** `components/shared/files/FileAttachmentPreview.tsx` (and any future image preview component)
- **Date Added:** 2026-05-03
- **Reference:** Teacher review panel showed solid black for a transparent PNG icon submission. Image was a 512×512 RGBA pencil-and-signpost icon with black line-art on transparent background. Original code had `bg-black aspect-video` container (line 136) copy-pasted from the video branch (line 159). Fix: swapped to a 20px gray-100 checkerboard over white. Bug affected three surfaces simultaneously (teacher pending review, teacher locked-completed review, parent approval panel — all share `SubmissionFilePreview` → `FileAttachmentPreview`). Student upload preview was unaffected because it uses local `blob:` URI from File API, not the shared renderer. Commit `9d424a2d`.

### Error: `<img>` onError Misses Silent Failures (CORB / 0×0 / Corrupt)
- **Symptom:** Image preview shows a blank container with no image and no fallback UI. The network request succeeded (or appeared to). `onError` handler never fires.
- **Root Cause:** Browsers do NOT fire `onError` for several silent-failure modes: Cross-Origin Read Blocking (CORB) of responses with `X-Content-Type-Options: nosniff` and a wrong/JSON content-type, 0×0 dimension images, corrupt image bytes, or ad-blocker subresource cancellation. In all these cases the browser fires `onLoad` (not `onError`) but with `naturalWidth === 0`. An onError-only fallback chain misses every one of these cases.
- **Fix:** Pair the existing `onError` handler with an `onLoad` handler that checks `e.currentTarget.naturalWidth === 0` and triggers the same fallback. Three lines, defensive, no behavioral change for healthy images.
- **Prevention:** Any `<img>` rendering a remote / signed / dynamic preview URL should use BOTH `onError` AND an `onLoad` naturalWidth check. Single-handler chains are insufficient because the silent-failure modes (CORB, 0-dim, corrupt) bypass `onError` entirely.
- **Applies to:** Any cross-origin image, signed-preview-URL image, user-uploaded image, or image whose source might be served by a controller that returns JSON on errors (auth/expiry/permission gates).
- **Files:** `components/shared/files/FileAttachmentPreview.tsx` (canonical pattern)
- **Date Added:** 2026-05-03
- **Reference:** Companion defensive fix shipped alongside the transparent-PNG-backdrop bug above. Even though that specific case had naturalWidth=512 (real image data, just visually invisible), the onLoad guard hardens the renderer against future genuine load failures (token expiry, CORB block from FilePreviewsController error responses, corrupt uploads). Commit `3c3b7135`.

### Error: Creation Action Gated By Its Own Precondition
- **Symptom:** A "Create X" / "Add X" / "New X" button sits inside a tool group, nav, or menu that gets disabled when `!hasX`. Users who don't yet have an X literally cannot create one from that surface — the only action that would satisfy the precondition is itself blocked by the precondition. Often compounded by container-level `pointer-events-none` or an early `if (!hasX) return` in the click handler.
- **Root Cause:** Disabling logic is applied at the container level (a whole nav or section), lumping the creation action in with everything else that legitimately requires the precondition. The creation action should be the ONE exception.
- **Fix:** Move gating from container-level to per-button. Exclude the creation action from the precondition check. In click handlers, check `tool.id !== 'create-action' && !hasX` instead of `!hasX`. Replace `opacity-40 pointer-events-none` on the parent with a `disabled` prop computed per-button. Also lift any state the creation action needs into a parent that renders regardless of the precondition.
- **Prevention:** When gating any tool group, menu, or nav by `hasX / hasUser / hasProfile / hasClass`, ask: "Is there a creation action in this group?" If yes, it MUST be excluded from the gate. Also check for hidden click-handler early returns, not just visual disabling. The rule: **never let a precondition check trap its own escape hatch.**
- **Applies to:** ToolsRails, sidebars, action menus, FAB clusters, context menus, onboarding empty states, any surface that conditionally disables based on the presence of the thing the user is trying to create
- **Files:** `components/**/*Rail.tsx`, `components/**/*Menu.tsx`, `components/**/*Sidebar.tsx`, any component with a `disabled`/`!hasX` pattern on a parent wrapper
- **Date Added:** 2026-04-13
- **Reference:** `ToolsRail.tsx` disabled the entire tool nav when `selectedClassId === null`, including the "Add Class" button that would have made `hasClass` true. A teacher landing in `ClassPickerGrid` with 10+ classes but none selected had no path to create a new class. Fixed by per-button gating + lifting `isAddClassOpen` state to `ClassroomLayout`.

### Error: Optional Callback Prop With No Default Handler In Shared Layout
- **Symptom:** An action button in a shared layout/navigation/header component works on some pages and is dead on others. Clicking it does nothing — no modal, no navigation, no error. The button renders identically in both places, and there are no type errors. New marketing/landing pages silently ship broken.
- **Root Cause:** A shared layout component (nav, header, footer, sidebar) declares a callback prop as `optional` (e.g., `onBecomeTeacher?: () => void`) and passes it through to a button as `onClick={onCallback}` or calls it with optional chaining (`onCallback?.()`). Pages that forget to pass the prop render `onClick={undefined}`, which is a silent no-op. The TypeScript `?` makes the wiring invisible — the compiler never complains. Each page is expected to own some local state or modal that the callback triggers, so the shared component cannot define a "right" default at the type level — but it *can* define a sensible fallback at runtime.
- **Fix:** Inside the shared component, hoist the common state and render the target modal/panel as a fallback. Use `??` to prefer the page-provided callback: `const resolved = onCallback ?? defaultHandler`. Guard the fallback UI with `{onCallback === undefined && <Modal ... />}` so pages that already own their own modal don't get a duplicate instance mounted. Pages that need custom behavior (custom tracking, inline rendering, different destination) continue to pass their own handler and bypass the fallback entirely.
- **Prevention:** When adding a new optional callback prop to a shared layout component, ask: "What should happen if a page doesn't pass this?" If the answer is "the action should still work in some default way" → provide a runtime fallback. If the answer is "this is truly optional and the button shouldn't render" → conditionally render the button on truthiness of the prop. Never leave `onClick={undefined}` to pass silently — that is the failure mode. Treat `onClick={optionalProp}` and `optionalProp?.()` as red flags in shared components.
- **Applies to:** `UnifiedNavigation`, `MarketingNavbar`, any shared header/sidebar/layout component with action buttons that trigger modals, drawers, or panels. Also applies to any "slot-like" prop pattern where a page is expected to provide both state and JSX.
- **Files:** `components/unified-navigation.tsx`, `components/nav/*.tsx`, any `components/**/Layout*.tsx` or shared wrapper with optional `on*` callback props
- **Date Added:** 2026-04-14
- **Reference:** "Become a Teacher" button in `UnifiedNavigation` was dead on 10 marketing pages (`summer-academy`, `about`, `for-parents`, `faq`, `marketplace`, `resources`, `trust-center`, `arizona-esa`, `ArticleLayout`, `teacher/TeacherProfile`). Only home and how-it-works passed the `onBecomeTeacher` prop because they owned their own `TeacherApplicationV2` modal state. Fixed by mounting a fallback `<TeacherApplicationV2 />` inside `UnifiedNavigation` with `{onBecomeTeacher === undefined && ...}` guard so the 2 pages with custom handlers don't get a duplicate modal.

### Error: Shared Component Copy Gated on Data Presence Instead of Intent
- **Symptom:** A shared multi-entry-point component (signup flow, checkout, wizard) shows the WRONG variant's copy/UI on one entry path — e.g., an enrollment path displays booking language — while mechanics (API calls, redirects) still work. The regression typically appears when a new entry point is unified onto an existing component and "mostly works".
- **Root Cause:** Variant selection is derived from whether some context DATA happens to be present (`teacherContext != null` → "must be booking") instead of from an explicit intent passed by the caller. Two different journeys that carry the same data shape (a teacher) are indistinguishable, so the component picks the variant that existed first. Each new entry point silently inherits the oldest path's framing.
- **Fix:** Introduce an explicit discriminant prop (`intent: 'a' | 'b' | ...`) resolved once into a discriminated union, and derive ALL variant-dependent strings/flags from an exhaustive switch with no default branch and a declared return type — a new intent member without a copy entry then fails compilation instead of leaking the wrong variant.
- **Prevention:** When unifying a new entry point onto a shared component, grep the component for every conditional keyed on context-data truthiness (`someContext &&`, `someContext ?`) and ask "is this really 'data present' or is it 'journey X'?" If two callers can pass the same data with different meaning, presence-gating is already wrong. Centralize variant copy in one exhaustive table rather than scattering ternaries.
- **Applies to:** Any shared flow with 2+ entry points whose UI framing differs by journey: signup flows, booking/checkout wizards, onboarding sequences, confirmation screens.
- **Files:** Shared flow components consumed by multiple routes; look for `context ? variantA : variantB` ternaries
- **Date Added:** 2026-06-11
- **Reference:** v2.10.0 unified the invite-link signup onto `ParentSignupFlow`, which inferred "booking" from `teacherContext` presence — invitees enrolling in a class saw "Sign up to book your free intro call" / "Booking with {teacher}". Fixed with `signupIntent` prop + `signup-copy.ts` exhaustive copy table (general/booking/enrollment/review).

### Error: Capability Advertised by One Layer, Rendered by Another (Blank Tab / Dead Route)
- **Symptom:** A navigable UI element (tab, menu item, route, card) appears and is clickable/enabled, but selecting it renders a completely empty content area — no data, no error, no loading spinner, no "coming soon". Often surfaces after a backend ships ahead of the frontend, or a feature is paused mid-build.
- **Root Cause:** Availability (whether the element is shown/enabled) is owned by a DIFFERENT layer than rendering (whether a consumer exists to display it). One side advertises the capability as ready — a BE registry flag `available: true`, a route table entry, a feature list — while the FE only has render branches/components for a subset. The advertised-but-unbuilt entries enable, fetch a valid payload, and then silently drop it because no branch consumes it. A `list.map(render)` shell that trusts a single "available" gate has no way to distinguish "data exists" from "a UI for it exists".
- **Fix:** Gate the navigable element on the INTERSECTION of both facts: backend-available AND a frontend renderer exists. Make the two un-driftable by deriving one from the other — a single registry mapping key→render function, with the "implemented" set computed via `Object.keys(registry)`, and the render collapsed to `registry[active]?.(payload)`. Then "advertised but no renderer" shows a "(coming soon)"/disabled affordance instead of a blank, and "renderer added without registering" is structurally impossible.
- **Prevention:** When a shell renders navigable items from a backend-owned list, ask: "can this list contain something I have no component for?" If yes, availability is an INTERSECTION, not a single flag — never let one layer's readiness flag solo-gate a tab. Any per-key `switch`/ternary chain of render branches that must stay in sync with a separate "enabled" list is a drift trap: collapse them into one source of truth. Add a test for the advertised-but-unimplemented case (it renders coming-soon, does not fetch, does not blank) — a bug that only appears when BE leads FE is invisible to tests that only feed fully-implemented fixtures.
- **Applies to:** Admin/dashboard shells driven by a backend feature/registry list, dynamic tab bars, route tables with lazy panels, menu builders, plugin/extension host UIs — anywhere "is it offered" and "can it be shown" live in different layers.
- **Files:** Shell/host page mapping a fetched list to nav items (`app/**/page.tsx`), the backend registry/feature list, the per-key render branches
- **Date Added:** 2026-07-06
- **Reference:** Admin Feature Analytics — BE `Analytics::FeatureRegistry` shipped revenue/learning/teacher_ops as `available: true` (v2.27.0) while their FE panels were paused work; the shell gated tabs on BE `available` alone, so three tabs enabled and rendered blank panes. Fixed by building the three panels + a FE `PANELS` registry whose keys derive `IMPLEMENTED_FEATURES` (intersection guard → "coming soon" for any future BE-ahead feature).

---

## API Integration

### Error: API Payload Missing Wrapper Key
- **Symptom:** 422 Unprocessable Entity, save fails silently
- **Root Cause:** Rails expects `{ resource_name: { ...data } }` wrapper
- **Fix:** Wrap payload in correct key (e.g., `{ teacher_marketplace_profile: {...} }`)
- **Files:** `lib/*-api.ts` files
- **Date Added:** 2025-12-02

### Error: Unconditional API Call Before Null-Check Branch
- **Symptom:** API returns 422/500 with null or empty required fields, even though the UI correctly handles the null case afterward
- **Root Cause:** An API call is placed before a conditional branch that checks for null/empty data. The branch correctly dispatches different UI states (e.g., "result" vs "no match"), but the API call fires unconditionally before the branch, sending invalid data.
- **Fix:** Move the API call inside the conditional branch so it only fires when the data is valid. Keep the null/empty branch as a separate path that skips the API call.
- **Prevention:** When writing flows with optional results (search, matching, lookups), structure as: `if (result) { persist(result); showSuccess() } else { showEmpty() }`. Never place side effects (API calls, emails) before the null-check.
- **Applies to:** Search results, matching flows, optional data persistence, any flow where "no result" is a valid outcome
- **Files:** Flow/wizard components that persist results to backend
- **Date Added:** 2026-02-02
- **Reference:** Get Matched flow — `createMatch` called before `result.match` null-check, sending null teacher fields

### Error: Boolean "Must Be Answered" Mistaken For a Gate
- **Symptom:** Investigating whether a yes/no field "blocks" a user (e.g. "is reliable transportation required to apply?"). The field looks required, but it's unclear if any *specific* answer is enforced.
- **Root Cause:** Two different validations look identical at a glance. "Must be answered" ≠ "must be true." Rails idioms: `validates :field, inclusion: { in: [true, false] }` means *answer either way* (NOT a gate — `false` passes); `validates :field, acceptance: true` (or `inclusion: { in: [true] }`) is the real gate (only `true` passes). Frontend mirror: `z.boolean()` = answer either way; `z.literal(true)` / `.refine(v => v === true)` = real gate. A NOT NULL column with `default:` further means an omitted field never even errors — it silently saves the default.
- **Fix:** To answer "is it gated?", read the *validation rule*, not the field's presence. Find a known-gated boolean in the same model (e.g. a consent checkbox using `acceptance: true`) and compare — the contrast reveals intent.
- **Prevention:** When asked "is field X gated / required?", always distinguish (a) required to have a value vs (b) required to equal a specific value. Check both the form schema (Zod) AND the server validation (Rails) AND the column default — gating can live at any layer, and a frontend `*` asterisk often signals "required" perception even when nothing is enforced. Also verify the *submission path*: a Next.js API route between the form and Rails may run its own Zod `.parse()` that rejects an omitted field before the request ever reaches the backend.
- **Applies to:** Any boolean/enum "requirement" investigation — consent flags, eligibility questions, survey fields, opt-ins.
- **Files:** Rails models (`validates`), Zod schemas (`lib/*-validation.ts`, `components/**/schema/*.ts`), Next.js route handlers (`app/api/**/route.ts`)
- **Date Added:** 2026-05-20
- **Reference:** Teacher v2 "reliable transportation" — `inclusion: { in: [true, false] }` + `z.boolean()` proved it was a non-gated survey field; removing it from v2 UX required defaulting the *shared* Next-route Zod schema to `true` so field-less payloads still validated.

### Error: Case Mismatch Across System Boundaries
- **Symptom:** API returns empty results, filter doesn't match, feature works in one flow but not another (e.g., marketplace shows Piano teachers but Get Matched finds none)
- **Root Cause:** Different parts of the system define the same concept with different casing. One system uses lowercase identifiers (`'piano'`, `'in_person'`) while another expects capitalized or formatted names (`'Piano'`, `'In Person'`). The backend does case-sensitive matching and returns zero results.
- **Fix:** Normalize at the boundary where one system calls another. Capitalize/transform the value before passing it to the API that expects a specific format.
- **Prevention:** When two systems share a concept (instruments, categories, statuses), define a single canonical format and normalize at every boundary. Check: does System A's enum match System B's expected values? Test with the actual API, not just the UI.
- **Applies to:** Instrument names, teaching formats, experience levels, any enum/category shared between quiz flows, marketplace filters, and backend APIs
- **Files:** API integration files (`lib/*-api.ts`), type definitions, filter/query builders
- **Date Added:** 2026-02-02
- **Reference:** Get Matched flow sent `instruments[]=piano` (lowercase) to marketplace API expecting `Piano` (capitalized), returned 0 teachers

### Error: AboutTab Save Failed (Malformed Credentials or Unsupported Genre)
- **Symptom:** Console shows `AboutTab save failed:` with a stack trace but often no error message in Sentry; teacher sees the About tab save chip flip to **Failed** after Save or autosave on tab switch (`/teacher/settings` → Marketplace → About).
- **Root Cause (two independent paths):** (1) `PUT /api/v1/teachers/settings/marketplace` returned `credentials` as a non-array (e.g. `{}`); `updateMarketplaceSettings` called `.map()` on it and threw `TypeError: ... map is not a function`. (2) Frontend validation allowed `Musical Theatre` in `AboutTab` while the backend genres allowlist has only 8 values; `PATCH /api/v1/teachers/marketplace/profile` returned 422 when that genre was in `genres_taught`. Autosave on tab switch could trigger (2) even when the teacher only edited text fields.
- **Fix:** Normalize credentials with `Array.isArray` before mapping (`mapBackendCredentialsToFrontend` in `lib/teacher-marketplace-api.ts`). Align genre validation with `lib/marketplace-profile-genres.ts`, sanitize on profile load (`sanitizeMarketplaceGenres`), and filter before the genres PATCH in `saveMarketplaceAboutSection`.
- **Prevention:** When mapping API array fields, always guard with `Array.isArray` — Rails/serializer drift can return `{}` or `null`. When adding a new enum value to a selector, confirm the backend allowlist accepts it before exposing it in validation; keep selector, validator, and PATCH payload in sync.
- **Applies to:** Marketplace Profile Builder About tab, any dual-endpoint save (`settings/marketplace` + `marketplace/profile`), genre/subject allowlists shared between FE and BE.
- **Files:** `lib/teacher-marketplace-api.ts`, `lib/marketplace-profile-persistence.ts`, `lib/marketplace-profile-genres.ts`, `components/teacher/marketplace/{AboutTab,MarketplaceProfileTabs}.tsx`
- **Date Added:** 2026-07-29
- **Reference:** Production Sentry/console report on `thoven.co` teacher settings page; fix `298a5b05`; verified by `lib/marketplace-profile-persistence.regression.test.ts`.

### Error: API Response Nesting Mismatch
- **Symptom:** Feature shows fallback/empty state even though the API returns correct data. Works in one code path (e.g., in-browser) but fails in another (e.g., email link, deep link, refresh).
- **Root Cause:** Frontend response parser expects data at the wrong nesting level. The API returns `{ wrapper: { field: value } }` but the parser reads `body.field` instead of `body.wrapper.field`. Often happens when the POST payload shape differs from the GET response shape — the parser was written to match the format the frontend *sends*, not what the backend *returns*.
- **Fix:** Pass the correctly nested object to the parser (e.g., `parse(body.teacher)` not `parse(body)`). Add defensive fallback for both shapes: `parse(body.wrapper || body)`.
- **Prevention:** When writing API response parsers, verify the response shape with the API contract or a real API call — don't assume it matches the request payload shape. Different HTTP methods (POST vs GET) often return different structures for the same resource. Add a `console.log` of the raw response during development.
- **Applies to:** Any API response with nested objects, especially when POST creates a resource and GET retrieves it in a different format. Common with Rails APIs that wrap responses in resource keys.
- **Files:** `lib/*-api.ts` response parsing functions
- **Date Added:** 2026-02-16
- **Reference:** Get Matched email link — `fromBackendTeacher(body)` should have been `fromBackendTeacher(body.teacher)`, caused waitlist screen for valid matches

### Error: Authentication Token Not Sent
- **Symptom:** 401 Unauthorized on authenticated routes
- **Root Cause:** Token not included in headers, or wrong header format
- **Fix:** Use `getAuthenticatedRailsHeaders()`, check token in localStorage
- **Files:** `lib/rails-headers.ts`, API files
- **Date Added:** 2025-10-01

### Error: CORS / Network Error
- **Symptom:** Network request failed, CORS policy blocked
- **Root Cause:** Wrong backend URL, missing CORS headers, or blocked by CSP
- **Fix:** Verify `NEXT_PUBLIC_API_BASE_URL`, check backend CORS config
- **Files:** `lib/api-config.ts`, `.env.local`
- **Date Added:** 2025-10-01

### Error: Backend URL Exposure via Direct File Navigation
- **Symptom:** Users see the raw backend infrastructure URL (hosting provider, framework, storage paths) in the browser address bar when downloading or previewing files
- **Root Cause:** Backend returns absolute URLs for file attachments (e.g., Active Storage signed URLs). Frontend passes these directly to `window.open(backendUrl, '_blank')` or `<a href={backendUrl}>`, navigating the browser to the backend domain instead of keeping the user on the frontend domain.
- **Fix:** Replace `window.open(url)` with either: (a) embedded viewer for previewable types (`<img>`, `<audio>`, `<video>`, `<iframe>` for PDFs), or (b) blob download for non-previewable types (`fetch(url) → response.blob() → URL.createObjectURL → anchor.click()`). For large files (>25MB), use a Next.js API route proxy with streaming.
- **Prevention:** Never pass raw backend URLs to `window.open()` or browser navigation. Always consume backend file URLs through an intermediary — embedded viewer, blob download, or server-side proxy. Treat backend URLs as internal implementation details that should never reach the browser address bar.
- **Applies to:** Any file download, media preview, or attachment link where the backend provides the file URL
- **Files:** Components with download handlers, API modules that return `file.url` / `file_url` / `download_url` fields
- **Date Added:** 2026-04-05
- **Reference:** Homework and class materials downloads exposed `thovenbackend-am-andres234.replit.app` Active Storage URLs across 8 components (teacher/parent/student)

### Error: No Graceful Degradation for Auth-Optional Features
- **Symptom:** Feature fails intermittently, works on refresh, "Error fetching X" when authenticated
- **Root Cause:** Authenticated endpoint fails (500/401/403) with no fallback to public endpoint
- **Fix:** Wrap auth API in try/catch, fall back to public API. User sees data either way.
- **Prevention:** For any feature that works both logged-in and logged-out, always implement fallback chain: auth endpoint → public endpoint → cached data → empty state
- **Applies to:** Marketplace, search, any browsable content
- **Files:** Pages with auth-optional data fetching
- **Date Added:** 2026-01-16

### Error: Profile Hero Aggregate Missing While Reviews Section Is Fresh
- **Symptom:** Public teacher profile hero shows no stars / no review aggregate, but the Reviews section lower on the same page shows real reviews and a `5.0` aggregate. Marketplace search/list cards may also show the rating correctly.
- **Root Cause:** The page consumes two backend surfaces: the hero reads `GET /api/v1/teacher_finder/:id`, while the Reviews section reads `GET /api/v1/teacher_reviews/teachers/:id/reviews`. If the backend show response is cached by `profiles.updated_at` but the review aggregate writer updates `average_rating` / `total_reviews` without bumping `updated_at`, the hero can be stale while Reviews are fresh. Second-level cache keys (`updated_at.to_i`) can also miss same-second aggregate changes.
- **Fix:** Fix backend cache invalidation, not the frontend display fallback: aggregate recompute must bump the profile cache timestamp, and public teacher finder cache keys need subsecond precision or an aggregate-specific fingerprint.
- **Prevention:** Before blaming browser cache or Next.js cache, compare the three public reads:
  ```bash
  curl "$API/api/v1/teacher_finder/$TEACHER_ID"
  curl "$API/api/v1/teacher_reviews/teachers/$TEACHER_ID/reviews?per_page=10"
  curl "$API/api/v1/teacher_finder?search=$TEACHER_NAME"
  ```
  If Reviews/list are fresh but show is stale, keep the fix in backend cache/versioning. Do not add frontend fallback logic that derives hero stars from the Reviews carousel response; that creates another source of truth.
- **Applies to:** Public teacher profile hero aggregates, marketplace card/list aggregates, any page split across cached profile payloads and fresh feature-specific endpoints
- **Files:** Frontend consumer `components/teacher/TeacherProfile.tsx`; backend source `TeacherReviewService`, `Api::V1::TeacherFinderController`
- **Date Added:** 2026-06-08
- **Reference:** Christopher Collier profile showed Reviews section `5.0` / 1 review while `GET /api/v1/teacher_finder/:id` returned `average_rating: null`; fixed by bumping `updated_at` during aggregate recompute and using subsecond teacher finder cache keys.

### Error: Frontend/Backend Validation Drift
- **Symptom:** Form validates on frontend but silently fails on submit, or accepts values backend rejects
- **Root Cause:** Frontend validation limits diverged from backend (e.g., frontend allows 100, backend max is 20)
- **Fix:** Sync frontend validation with backend. Add visible error handling for submission failures (not just validation).
- **Prevention:** Document validation rules in one place. When backend changes limits, grep frontend for hardcoded values.
- **Applies to:** All forms with numeric limits, string lengths, enum values
- **Files:** Form components, API schema definitions
- **Date Added:** 2026-01-16

### Error: API Contract Drift / Deprecated Field Usage
- **Symptom:** Feature shows wrong or partial data, works for old records but not new ones
- **Root Cause:** Using deprecated field (e.g., `online_lessons: boolean`) when API migrated to new field (e.g., `teaching_formats: string[]`)
- **Fix:** Update to use new field. Check API response for both old and new fields during migration.
- **Prevention:** When backend deprecates a field, search frontend for all usages. Add TypeScript types for new fields.
- **Applies to:** Any field that changes type or gets replaced
- **Files:** API files, components consuming API data
- **Date Added:** 2026-01-16

### Error: Hosting Proxy 4xx With Stripped CORS Headers Masquerades As Network Error
- **Symptom:** UI shows a generic "Network error - please check your connection" (or whatever the catch block stringifies a `TypeError: Failed to fetch` as). Backend never sees the request — not in Rails logs, not in error tracking. Failure delay is roughly proportional to request body size, suggesting the body uploaded successfully before the rejection. Backend declared limit (e.g., Rails accepts 100 MB) is much higher than the actual cliff. Network tab shows the request as "cancelled" or with no response body.
- **Root Cause:** A hosting layer (reverse proxy, load balancer, CDN edge) between the browser and the application server has its own undocumented body-size or rate limit. When that limit is hit, the proxy returns a 4xx (typically 413 Payload Too Large or 429 Too Many Requests) WITHOUT the `Access-Control-Allow-Origin` header that the application server normally sets. The browser sees this as an opaque cross-origin response, fails the CORS preflight check on the response, and fires a `TypeError` from `fetch()`. The frontend's catch block — which expects to map status codes to friendly messages — never gets to read the response, only the bare TypeError, which it stringifies as a generic network failure.
- **Fix:** Validate constraints client-side BEFORE calling `fetch()`. The frontend already knows the file size, request size, or request rate; checking against the proxy's known limit and throwing a clear typed error (e.g., `UploadOversizeError`) prevents the request from firing in the first place. Surface a friendly message that names the constraint and offers a workaround (e.g., "Files over 35 MB can't be uploaded directly. Use YouTube or Loom and paste the link instead."). Keep the network-error catch path for actual transport failures.
- **Prevention:** Whenever the frontend posts to an endpoint behind a hosting platform you don't control end-to-end (Replit Autoscale, Cloudflare Workers, AWS Lambda, Vercel Edge), audit for proxy-layer caps: request body size, request rate, request duration, response size. Document known caps as constants in the relevant `lib/*-api.ts` file with a comment explaining the source. Treat the application server's declared limits as the upper bound only — the actual ceiling is `min(application_limit, proxy_limit)`. When you discover a new proxy cap, add an alarm: log to your error tracker any time the API receives a request that *barely* squeaked under the cap (e.g., file 95% of cap size), so you can detect the cliff moving.
- **Applies to:** Any multipart upload, large JSON POST, long-polling endpoint, or rate-limited endpoint when the application server is fronted by a hosting proxy. Also applies to any third-party SDK call where opaque CORS failures are misread as network errors.
- **Files:** API integration files (`lib/*-api.ts`), file upload components, any catch block that converts `TypeError: Failed to fetch` to a user-facing string
- **Date Added:** 2026-04-17
- **Reference:** Class material upload — Replit Autoscale proxy ~40-50 MB cap rejected a 42.5 MB MOV with CORS-stripped 413; frontend's `validateMaterialFile` allowed videos up to 100 MB (above the cliff); patched in TD-021 by lowering the cap to 35 MB and surfacing the YouTube/Loom workaround in the error message. Same pattern previously bit teacher intro video uploads (resolved by hiding the upload UI, which was a worse fix).

### Error: Edge WAF Blocks Image Upload On Embedded Metadata (CORS-stripped 403 → "Failed to fetch")
- **Symptom:** A specific user (often just one) cannot upload an image — profile photo, attachment — while everyone else can. The file is a normal size and format (a 62 KB JPEG can fail). Console shows `TypeError: Failed to fetch` from the upload's `fetch()`; the UI shows a generic error. DevTools Network shows the request as `403`/`(failed)` with `content-type: text/html`, a tiny body, and **no** `Access-Control-Allow-Origin` header — and "Failed to load response data" because the body is denied to the browser. It reproduces 100% with that user's file and never with a dummy/small test image.
- **Root Cause:** An edge WAF (Google Cloud Armor / Google Frontend in front of Replit Autoscale, Cloudflare, AWS WAF, etc.) inspects the multipart request **body** for attack signatures. Images exported from Adobe Photoshop/Lightroom embed a large **XMP/XML metadata block** (`<x:xmpmeta>`, `<rdf:RDF>`, `<photoshop:DocumentAncestors>`, `adobe:docid:` URIs). The WAF's XML/HTML/SQL-injection rules false-positive on that markup and return a `403` **before the request reaches the app** — so the app never logs it, and the edge error page carries no CORS header. The browser fails the response-side CORS check and throws `TypeError: Failed to fetch` (the upload's catch never gets to read a status). It is the file's *metadata bytes*, not its size, format, or pixel content — which is why it's user/file-specific and was never seen before.
- **Fix:** Re-encode the image client-side before upload by drawing it onto a `<canvas>` and exporting via `toBlob('image/jpeg', q)` (or `OffscreenCanvas.convertToBlob`). Canvas re-encode produces a metadata-free image (no EXIF/XMP), so the offending markup never reaches the WAF. Apply EXIF orientation during decode (`createImageBitmap(blob, { imageOrientation: 'from-image' })`) since re-encoding drops EXIF orientation, and cap dimensions while you're at it. Also surface the real upload error instead of a generic banner so the next occurrence isn't a silent dead-end.
- **Prevention:** Normalize any user-supplied image through a canvas re-encode before uploading it through your app server — never ship the raw camera/Photoshop original for an avatar/thumbnail. Diagnostic shortcut for "one user can't upload, everyone else can, `Failed to fetch`": get their actual file and `curl` it **unauthenticated** to the endpoint (an unauth request 401s if it reaches the app, 403s if the edge blocks it — no write risk either way); then `curl` a metadata-stripped copy (`sips -s format jpeg in --out out.jpg`, or ImageMagick `convert -strip`). If stripped→401 and original→403, it's a metadata WAF false-positive in ~60 seconds. Don't chase size/HEIC/CORS-config hypotheses first — check the file's metadata.
- **Applies to:** Any image (or document) uploaded as a multipart body **through your application server** behind a managed edge/WAF — profile photos, attachments, materials sent via Rails (NOT direct-to-GCS/S3 presigned uploads, which bypass the app edge). Especially images from Photoshop/Lightroom/scanners that embed verbose XMP.
- **Files:** Image upload components (`components/**/ProfilePictureUpload.tsx`), a shared re-encode helper (`lib/image-normalize.ts`), any catch block that converts `TypeError: Failed to fetch` to a user-facing string.
- **Date Added:** 2026-06-04
- **Reference:** Teacher Mary Lucchi could not upload a 290×272, 62 KB JPEG profile photo (Adobe Photoshop XMP with `DocumentAncestors`). Multipart `PUT /api/v1/teachers/settings/marketplace` → CORS-less `403 text/html` from Google Frontend; browser saw `Failed to fetch`. Proven by controlled live curl: original → 403, `sips`-restripped copy → 401 (reached Rails). Earlier multi-agent run mis-concluded a "32 MB HEIC inflation cap" by reasoning from unauthenticated text-file probes — the real authenticated request (62 KB) disproved it. Fixed FE-side via `lib/image-normalize.ts` canvas re-encode; verified the exact photo now uploads `200` against prod. Sibling of the CORS-stripped-413 size-cap pattern above — same browser-visible symptom, different edge trigger (body inspection vs body size).

### Error: Frontend Infers Backend Internal State From Display-Field Proxy
- **Symptom:** Feature works for some users and fails for others with no obvious code path difference. Backend rejects with a state-mismatch error (consent revoked, not connected, missing X) for users where the frontend believed the precondition was satisfied. Frontend types declare only the display field; the backend's actual gate is on a paired normalized/internal column.
- **Root Cause:** Backend stores a paired (display, normalized) column couple — e.g., `phone_number` + `phone_e164`, `email` + `email_verified`, `connected` + `is_active`. Frontend types and code only know the display field and use its truthiness as a proxy for whether the precondition is met (`hasPhoneOnFile = !!profile.phone_number`). When historical or partially-migrated rows have the display field populated but the normalized companion empty, the frontend's `if (hasX) skipSendingX` branch withholds the param the backend needs to populate the normalized column — and the user is stuck in a state the frontend can't see or recover from.
- **Fix:** Either (a) have the backend expose a `*_present: boolean` derived from the actual gate column (e.g., `phone_e164_present`) and gate the frontend on that, or (b) backfill the normalized column for legacy rows, or (c) make the backend grant the precondition unconditionally when the normalized column is missing but the display field is populated (auto-normalize-on-touch).
- **Prevention:** When designing any frontend type that mirrors backend profile/account fields, ask the backend explicitly: "is this field the gate, or just a display proxy for a gate column you also store?" If there's a gate column, expose a presence boolean for it on every endpoint that returns the profile. Never let the frontend infer backend internal state from a display field — that's a contract leak waiting to drift. Spot-check by looking for `!!profile.X` patterns in `lib/*-api.ts` consumers and verifying X is the actual backend gate.
- **Applies to:** Any paired display/normalized columns — phone (`phone_number` / `phone_e164`), addresses (raw / geocoded), payment methods (`last4` / `payment_method_id`), integration connections (`connected` / `is_active`), verification states.
- **Files:** Profile/account API types (`lib/profile-api.ts`, `types/auth.ts`), any feature page that gates a request param on a profile field truthiness check.
- **Date Added:** 2026-04-24
- **Reference:** Intro-call SMS consent — `app/parent/book-intro-call/page.tsx:89` used `!!parentProfile?.phone_number` as `hasPhoneOnFile`, then withheld the `phone_number` param when true (`page.tsx:230`). Parents whose `profiles.phone_e164` was NULL despite `phone_number` being set never got `sms_consent_enabled = true`, blocking every teacher → parent message thereafter. Sister-pattern: GCal (`connected` vs `is_active` / `google_email` vs `owner_email`).

### Error: Silent Error Recovery via Hardcoded Demo Data
- **Symptom:** When an API call fails, the page renders fully populated but with obviously fake content — placeholder names like "Demo Teacher" / "Demo User", round-number stats, sample students/classes/messages. The only signal is a small banner the user typically misses while scrolling. Users get confused, eventually reload, and the real data appears. Bug only surfaces when the API actually fails (rare in dev, more common in prod under transient outages).
- **Root Cause:** Early-stage scaffolding pattern: while wiring up a UI, devs ship a `getFallbackData()` function that returns a complete mock payload to keep the design phase unblocked. The catch block in the real fetch handler points at this fallback ("better than a blank page") and never gets replaced. Once the happy path works, nobody re-examines the catch branch — and any explicit error UIs that *were* written end up as unreachable code because the catch always populates the data state.
- **Fix:** Remove the demo-data fallback from production catch handlers. Route to an explicit error state instead: a full-screen "Connection Error" card with a Retry button, or render an empty state + prominent retry banner. Reuse error UIs that already exist in the file but are unreachable because the catch is too eager.
- **Prevention:** Demo/scaffold data must NEVER live in production catch handlers. Acceptable homes for it: MSW handlers (dev-only mock service worker), Storybook stories, a feature-flagged dev-only path, or fixtures imported only in test files. When code-reviewing a catch block, ask: "if this fires in production, will the user know something went wrong?" If the answer is "no, they'll see content that looks real but isn't," reject the PR. Grep `lib/*-api.ts` for `getFallback`, `mock`, `demo`, `sample` exports — any that are imported by `app/**` are red flags.
- **Applies to:** Dashboards, profile pages, list views — any read-heavy surface where fake-but-complete data is mistakable for real data. Especially dangerous in dashboards because users rarely *act* on the data immediately, so the bug doesn't surface as data corruption — it surfaces as quiet UX confusion that automated tests don't catch.
- **Files:** `lib/*-api.ts` (where fallback functions tend to live), page components with try/catch around the primary fetch.
- **Date Added:** 2026-04-25
- **Reference:** Teacher dashboard — `app/teacher/page.tsx:237-285` caught `fetchTeacherDashboard()` failures and called `getFallbackData()` from `lib/teacher-api.ts:497-635`, which returned a "Demo Teacher" with $2,450 fake earnings. Two existing error UIs in the same file (Connection Error full-screen at line 673, "Failed to load dashboard data" at line 715) were unreachable because the demo fallback always populated `dashboardData`. Fixed by routing the catch to `setIsNetworkError(true) + setAuthError(...)` and deleting the 140-line `getFallbackData()`.

### Error: Server-Guessed Viewer Timezone Rendered as "Your Time"
- **Symptom:** A time-picking or time-display surface tells the user times are "in your timezone," but a user whose real timezone differs from the counterparty's (teacher/host) sees the counterparty's wall clock — and any selection they make lands on the wrong instant. Self-consistent everywhere (label, confirmation, dashboard all agree), wrong only against user *intent*, and invisible whenever both parties share a zone — so it surfaces late, on the first real cross-timezone pair.
- **Root Cause:** The backend formats display strings in a timezone it *guesses* server-side (stored profile column, often with a silent fallback to the counterparty's zone or a default), the endpoint accepts no viewer-timezone input, and the frontend renders the guessed strings verbatim. The label and the underlying instant come from one server variable the client can neither supply nor verify. When users select against those labels, a wrong display zone becomes a wrong booking.
- **Fix:** Derive every viewer-facing label client-side from the offset-bearing instant (`formatLessonTime`/`formatLessonDay` on `slot_id`/`datetime_iso`) in the device zone, keeping the backend string only as a fallback for offset-less data. Separately, add a viewer-timezone param to the endpoint (browser `Intl.DateTimeFormat().resolvedOptions().timeZone`) with a divergence warning, and make the server's profile fallback use inference (e.g. state-derived) rather than the counterparty's zone.
- **Prevention:** Any endpoint that formats times *for a viewer* must accept the viewer's timezone as input, and any response that carries formatted time strings must also carry the offset-bearing instant so the client can render honestly. Never write "your timezone" copy sourced from a server-resolved zone the client didn't supply. When a timezone-correctness campaign sweeps display surfaces, grep for remaining consumers of backend-formatted time strings (`parent_time`, `formatted_time*`) — an explicitly deferred surface is a scheduled production incident. Test with the cross-zone pair (device TZ ≠ data TZ); same-zone fixtures mask this class entirely.
- **Applies to:** Booking/scheduling pickers, reschedule flows, confirmation screens, reminder emails/SMS, any marketplace with two parties in different timezones.
- **Files:** any picker/display consuming backend-formatted time strings; `lib/date-utils.ts` primitives; availability endpoints and their contract entries.
- **Date Added:** 2026-07-24
- **Reference:** Intro-call picker showed a Mountain-time parent the teacher's Central labels as "your timezone" (booked 11:15 CT instead of 11:15 MT). Intro-call display had been deferred out of the v2.15.0 timezone overhaul, and `intro_availability` lacked the `parent_timezone` param its sibling `lessons_availability` had; backend nil-tz fallback was the teacher's zone.

### Error: Eligibility Drift — Time-Based Fallback Outliving Action-Based Product Intent
- **Symptom:** A user-facing trigger (popup, email, notification, feature unlock) fires too aggressively for users who haven't taken meaningful actions. PM has stated the rule should be action-based ("only show after they X or Y"), but in practice the trigger keeps firing for users with zero engagement. Frontend code looks like it just calls a backend `/check`-style endpoint and trusts the response — so the eligibility logic must be on the backend.
- **Root Cause:** The backend eligibility predicate has multiple OR-branches: action-based (good) + a time-based fallback (legacy). When product intent moves from "show eventually to everyone" to "show only to engaged users," devs raise the threshold constants (`Day 10 → Day 21`, `2 logins → 5 logins`) but leave the OR-branch intact. The fallback keeps firing, just later. PMs reading the changelog see "increased threshold to Day X" and assume the rule changed; they don't see that the predicate's *shape* is unchanged. Worse, downstream eligibility (e.g., NPS triggered by `pmf_buffer_satisfied?`) can advance users through the funnel even when PMF was only ever shown via the now-stale fallback.
- **Fix:** Drop the time-only OR-branch ENTIRELY from the eligibility predicate. Remove the now-unused threshold constants. Invert the corresponding tests (they were asserting "fallback fires"; rewrite to assert "fallback does NOT fire — no survey returned"). Audit downstream predicates that depend on the same condition (e.g., NPS `nps_trigger_met?`) and apply the same action-only shape — a "lift to consistency" pass. Keep DB enum values like `triggered_by_pathway = 'fallback'` alive for historical rows, but don't keep the code path. Add a frontend `AbortController` and mount-dedup ref as defense-in-depth so a stale `/check` response can't reopen a dismissed modal during the deploy window.
- **Prevention:** When raising a threshold on an eligibility rule, ASK: "Is this the right shape, or just a knob?" If product intent is action-based, the predicate should not have a time-only OR-branch at all. **Audit eligibility services every time their threshold constants change** — the constant change is a smell that the predicate may have drifted from intent. Frontend gates should NEVER mirror backend eligibility business logic — that creates duplicate-source-of-truth drift, and the FE typically lacks the data to evaluate the rule correctly anyway (e.g., FE has `stats.activeClasses` but not `intro_call_booked_at`). Frontend can add concurrency hardening (AbortController, mount-dedup) without owning policy. Run a code-grep for the predicate name before merging — if the only call sites are within the eligibility service itself, the surface is fully under your control; if it's referenced elsewhere, audit those too.
- **Applies to:** Any feature with an eligibility predicate combining action signals (booking, purchase, enrollment) with time-only fallbacks (`signup_age`, `login_count`, `last_seen_at`). Common in onboarding flows, NPS/PMF triggers, re-engagement emails, feature gates, drip campaigns.
- **Files:** `app/services/*_eligibility_service.rb`, `app/services/*_trigger_service.rb`, eligibility predicates in any controller/job, frontend hooks that auto-call `/check`-style endpoints (e.g., `hooks/useSurveyTrigger.ts`)
- **Date Added:** 2026-05-07
- **Reference:** Teacher PMF/NPS surveys firing for low-engagement teachers despite changelog claim of "more action-based" gating. Commit `9d036752` (BE) raised the fallback threshold from Day 10 + 2 logins to Day 21 + 5 logins, but the time-only OR-branch (`pmf_pathway_fallback?`) remained. Fix dropped the OR-branch entirely + dropped the parallel NPS Day-28 OR-branch + paired with frontend AbortController + mount-dedup. Codex consult flagged that a frontend action gate would be the wrong shape (would duplicate BE policy and create drift trap). Codex BE review caught a downstream miss: NPS still required `has_approved_booking?` only, so enrollment-only teachers would never become NPS-eligible despite being PMF-eligible — fixed by mirroring the PMF action gate (booking OR enrollment) on the NPS trigger. Commits: `552525f6`, `550fdc38` (BE), `ba048185`, `9b163b57`, `8f9d743f`, `14fe52e5` (FE).

### Error: Serialized Status Flag Encodes Fewer Guards Than the Action It Predicts
- **Symptom:** A UI banner/badge/button driven by a backend-served boolean (`can_publish`, `can_submit`, `is_eligible`) says the action is available, but performing the action is rejected by the server with a different message. The served flag and the action's guard disagree for a subset of records (often "new" / unmigrated / edge-state rows).
- **Root Cause:** The status flag and the action's enforcement are computed by two different code paths that drifted. The serializer computes the flag from one predicate (e.g. `percentage >= 80%`) while the action endpoint applies that PLUS an extra guard (e.g. a required section, or a grandfather exemption). The flag encodes only the first guard, so it over-reports availability and the UI promises something the action will refuse.
- **Fix:** Route both the serialized flag and the action's guard through ONE canonical predicate (single source of truth). The serializer's flag becomes `threshold_met? && canonical_guard?`; the action delegates its extra guard to the same `canonical_guard?`. If a predicate is *intentionally* split (e.g. a percentage-only method kept so the action can route two distinct error messages), document the split in a code comment so a future reader doesn't "simplify" it away.
- **Prevention:** Whenever the backend serializes a `can_*` / `is_*_eligible` boolean that predicts an action, grep the action's controller/service for its guards and confirm the SAME predicate computes both. If the action has N guards, the served flag must encode all N (minus any guard that only decides *which error message* to show). Add a service spec asserting the rejection payload's own flag is `false` — a cheap consistency tripwire. Beware the inverse over-correction: don't widen the gate to "all fields complete" when the real gate is a subset — that over-blocks legitimate actions.
- **Applies to:** Any served capability/eligibility flag mirroring a multi-guard server action — publish gates, submit gates, checkout-eligible, can-book, can-invite, feature unlocks.
- **Files:** `app/serializers/*`, the paired `app/services/*_service.rb` (action service + completion/flag service), `lib/*-api.ts` consumers that gate UI off the flag.
- **Date Added:** 2026-06-02
- **Reference:** Marketplace `can_publish` — `MarketplaceProfileCompletionService` serialized `can_publish` from percentage-only (`>=80%`) while `MarketplacePublishingService` also required a completed `choice_section` for never-published teachers, so the Profile Builder showed "Ready to publish" for a profile the publish endpoint rejected. Fixed by routing both through a canonical `choice_section_satisfied?` predicate; the public percentage-only `can_publish?` was deliberately left intact (it routes the endpoint's two error messages). Grandfathered teachers + non-choice missing fields unaffected — no over-block. Commits `0ad4f4c0`, `7decc16c` (BE).

---

### Error: Recurring Jobs and Push Events Hostage to Scale-to-Zero Web Traffic
- **Symptom:** A time-triggered feature (scheduled record creation, reminder, rollback, notification) fires 30–90+ minutes late in production but works perfectly in local dev. The delay ends suspiciously close to the next burst of user traffic. Frontend popups/banners driven by WebSocket push also miss the event entirely until a page reload.
- **Root Cause:** The background-job scheduler runs embedded inside the web server process on an autoscale (scale-to-zero) deployment. No HTTP traffic → container reclaimed → scheduler dies → recurring jobs stop until the next request cold-starts the app. Compounding it: WebSocket connections opened before the sleep drop silently, and FE clients without auto-reconnect (or a polling fallback) never hear the broadcast that eventually fires.
- **Fix:** Short-term: a frontend poll on the consuming surface doubles as a keepalive ping (each request wakes the backend) and a display fallback (next tick picks up the record a dropped socket missed). Durable: run the job scheduler in an always-on process independent of web traffic, and add reconnect-with-refetch to WS clients.
- **Prevention:** When designing any feature whose trigger is "a recurring job notices time has passed," ask where the scheduler process lives and whether prod can scale to zero. If it can, the spec's worst-case latency is unbounded, not the job cadence. Never let a popup/banner depend solely on a WS push — pair every push with a mount-fetch plus low-frequency poll or reconnect-refetch. Local dev never reproduces this (the server never sleeps), so test the assumption, not the demo path.
- **Applies to:** Any recurring/delayed job on autoscaled infra (reminders, rollbacks, drip emails, status sweeps); any WS-pushed UI without a poll fallback.
- **Files:** BE job/scheduler config (embedded supervisor initializers, recurring schedule config); FE `lib/websocket/*-channel.ts` clients; any banner/popup fed by push events.
- **Date Added:** 2026-06-11
- **Reference:** OCC intro-call followup fired ~1h late in a live demo — Solid Queue supervisor forked from Puma died on Replit Autoscale scale-to-zero; class was created only when the 11:30 demo traffic woke the container. FE fix: 60s poll in `IntroCallFollowupBanner.tsx`. BE audit tracked as TD-060.

### Error: Non-Idempotent Counter as a Side-Effect of a GET Called Multiple Times Per Visit
- **Symptom:** A teacher/admin-facing 'X clicks/views/opens' metric over-counts wildly (e.g. 1 real visitor shows as 6). The number scales with requests, not humans.
- **Root Cause:** A counter is incremented as a side-effect of a GET endpoint that the frontend legitimately calls many times per visit for NON-tracking reasons — server RSC render (force-dynamic refires on every load/refresh/redirect), a client re-validate effect, and post-auth re-navigation to the same URL. Counting is fused into validation. Gating on 'no Authorization header' does NOT fix it because SSR is always unauthenticated (JWT in localStorage, zero cookies).
- **Fix:** Decouple counting from the GET: dedup by unique VISITOR per resource (auth-state agnostic), or fire one explicit deduped client event. Prevention: never put a non-idempotent write/counter as a side-effect of a GET; a GET must be safe to call N times. When a metric must count 'unique humans', define the dedup key (visitor/session) up front — counting validate/render hits will always inflate. Audit force-dynamic routes + re-validate effects for how many times one human triggers the endpoint.
- **Files:** [Add relevant files]
- **Date Added:** 2026-06-06

### Error: Server-Computed Temporal State Trusted Verbatim (Vanishing / Mislabeled List Items)
- **Symptom:** An item (lesson, booking, notification) vanishes from a list "with no notice," or is labeled past/completed/expired while it's still upcoming — yet FE date-formatting looks correct and no FE error fires. Often two surfaces disagree or fail together.
- **Root Cause:** The FE surfaces are thin consumers of ONE server-side signal — a server-filtered query (rows dropped before the FE ever receives them) and/or a server-computed boolean (`is_future`, `is_expired`) passed through verbatim. The bug is in the backend's compare step (local wall-clock vs UTC now, or strict date-only `>` that excludes today) or store step (wrong instant persisted) — no amount of FE date-math auditing will find it.
- **Fix:** Fix the backend compare/store step; every FE surface inherits the fix. An FE recompute-guard is a trap: it can't restore rows the server never sent, and if the stored instant is wrong it recomputes the same wrong answer.
- **Prevention:** For any "item disappeared / shows as past" report, FIRST answer: does the FE receive the row at all (network tab / endpoint contract), and does the FE ever compare the item's time against "now" (grep the render path)? If the answer is server-filtered + flag-pass-through, pivot to the BE repo immediately: check recent BE commits for a matching fix AND its Publication Status — a committed-but-unpublished fix means prod users still see the bug (Bug 37, fixed same morning, unpublished when the second user report arrived). Beware sibling readers: one fixed comparator doesn't fix per-row flags computed elsewhere (`is_future = slot.date > today` survived the same-day sweep).
- **Applies to:** Any list backed by a server-filtered endpoint or server-computed temporal/status flag — upcoming lessons, expiring credits, pending requests, notification feeds.
- **Files:** any `lib/*-api.ts` that passes through BE booleans (e.g. `attendance-api.ts` `is_future`); BE scopes/controllers computing time classification
- **Date Added:** 2026-07-06
- **Reference:** Teacher Noah Gunn's 4pm ET lesson vanished from schedule (BE Bug 37: wall-clock end vs UTC now) AND showed "already happened" in classroom (sibling `is_future` strict date-only compare, dd-o5m21). Two BE bugs, one email; FE render-only on every surface.

---


## TypeScript / Build

### Error: Source-Scanning Gate False-Negatives on a Benign Refactor (and Trains `--no-verify`)
- **Symptom:** A CI/pre-push gate that inspects source *text* (rather than parsing it) reports something absent that is demonstrably present — "no caller found" for a function called from six places, "link missing" for a link that renders. The gate blocks pushes, so people start using `--no-verify`, and the repo stays red for days.
- **Root Cause:** The gate regex-scans source instead of parsing an AST, so it is precise about the drift class it was built for but brittle against *incidental* code changes that alter text without altering behavior. The specific killer is a matcher that conflates **"contains X"** with **"is X"** — e.g. a path normalizer that collapses any segment *containing* `${` to a wildcard, so `endpoint${query}` (a literal with an interpolated suffix) is misread as a fully dynamic segment.
- **Fix:** Distinguish `startsWith` from `includes`. Keep the static prefix: `if (seg.startsWith('${')) return WILDCARD; const i = seg.indexOf('${'); if (i > 0) return seg.slice(0, i)`.
- **Prevention:** Two rules. (1) **A false-negative gate is worse than no gate** — it not only cries wolf, it usually goes *blind* in the same stroke. The same bug that reported a live caller missing also made `archive${suffix}` a wildcard matching nothing specific, so a genuinely REMOVED endpoint would have passed green. When a gate false-positives, always ask what it has stopped seeing. (2) When a gate must understand code structure, parse it — don't regex it. `typescript` is usually already a dependency; walk `CallExpression` nodes instead of scanning characters. A regex cannot know where a template literal ends (nested backticks in `` `${x ? `?${y}` : ''}` `` truncate the capture into garbage).
- **Applies to:** any contract checker, dependency-cruiser, custom lint, codemod, or "does the code contain X" test.
- **Files:** `scripts/contract-check.mjs` (`normalizePath`); any bespoke source-scanning script.
- **Date Added:** 2026-07-13
- **Reference:** `contract-check` reported "no FE caller found" for `intro_availability`, called via `IntroCallTimePicker` from 6 mount sites. Broke when `5438c9a1` appended `${query}` to the URL. `main` red 2 days; pushed past with `--no-verify` three times before anyone read the failure.

### Error: Extracting a Module Breaks Tests That Assert on a File Path
- **Symptom:** You move a constant/array/component into a new shared module. Everything renders correctly and the browser looks perfect — but CI fails on tests you never touched, claiming content is missing from a file.
- **Root Cause:** Source-scanning tests (`fs.readFileSync(someFile)` + `expect(content).toContain(...)`) assert on *where code lives*, not on *what the app does*. Extraction moves the text; the invariant still holds, but the test's pointer is now stale. **Browser verification is structurally incapable of catching this** — the page is fine; only a file-text assertion can see it.
- **Fix:** Re-point the test at the new home (or, better, assert on behavior — import the module and check its output — so the test survives the next move).
- **Prevention:** Immediately after extracting anything into a new module, grep the test suite for the OLD file path: `grep -rn "old-file-name" __tests__ **/*.test.*`. Also grep for distinctive string literals you moved. Do this before pushing — these tests are invisible to type-check, lint, and any amount of manual QA.
- **Applies to:** any refactor that relocates code; especially SEO/sitemap/nav tests, which are commonly written as file-text scans.
- **Files:** `__tests__/seo/canonicals.test.ts`, `app/sitemap.test.ts`, any `readFileSync` test.
- **Date Added:** 2026-07-13
- **Reference:** Moving the marketing menu from `components/unified-navigation.tsx` into `lib/marketing-nav.ts` broke `canonicals.test.ts` (grepped the old file for "Find Teachers" + "/marketplace"). Separately, adding `/for-schools` to `app/sitemap.ts` tripped `sitemap.test.ts`'s no-orphans allowlist. Both invariants were still TRUE; only the pointers were stale.

### Error: Generated Content Auto-Enrolls Itself Into a Test Its Generator Cannot Satisfy
- **Symptom:** A code/content generator runs, produces output that looks correct, and CI goes red on a test suite nobody edited — failing only on the newly generated items.
- **Root Cause:** The test **discovers its own subjects dynamically** (e.g. "every article whose source contains 'Frequently Asked Questions'"), while the generator emits the *trigger* for enrollment but has no code path to emit the thing the test then demands. The generator is therefore *structurally incapable* of producing a passing artifact — and will re-break the build on every future run.
- **Fix:** Fix the generated artifacts AND close the generator gap in the same pass — teach the emitter to produce the missing piece from the SAME source that produces the trigger (single-source, so schema and prose cannot drift), and add the invariant to the generator's own checker so bad output can't escape.
- **Prevention:** When a generator and a dynamic test suite coexist, ask: *can the generator actually emit everything this test requires?* If a test enrolls subjects by pattern-matching, the generator must be able to satisfy every assertion the pattern triggers. Fixing only the artifacts leaves the trap armed for the next run.
- **Applies to:** content factories, codegen, scaffolders, schema/type generators — any pipeline whose output is graded by a dynamically-scoped test.
- **Files:** `tools/seo-factory/lib/render-page.ts`, `tools/seo-factory/checker/validate-article.mjs`, `components/ArticleLayout.faq.test.ts`.
- **Date Added:** 2026-07-13
- **Reference:** The SEO factory's writer prompt *requires* a visible FAQ section (`llm-writer.mjs:125`), but `render-page.ts`'s prop list has no `faq` field — so every generated article shipped a visible FAQ with zero FAQPage JSON-LD, auto-enrolling into `ArticleLayout.faq.test.ts` and failing 5 assertions. The factory's own 1730-line checker had no rule tying page schema to page prose.

### Error: Null Reference at Runtime
- **Symptom:** "Cannot read property 'x' of null/undefined"
- **Root Cause:** Accessing property without null check despite strict mode
- **Fix:** Use optional chaining (`?.`), nullish coalescing (`??`), or explicit null guards
- **Files:** Any TypeScript file
- **Date Added:** 2026-01-08

### Error: Switch/Lookup on API Enum Without Default Case

- **Symptom:** `TypeError: Cannot read properties of undefined (reading 'X')` when rendering a component that maps an API status/type to UI config (colors, icons, labels). Crash only affects records with a status value the frontend doesn't know about. Other records render fine.
- **Root Cause:** A `switch` statement or object lookup maps API enum values to UI configuration (bgColor, icon, label), but has no `default` case. When the backend adds or returns a new enum value (e.g., a new payment status from a new feature), the lookup returns `undefined`, and the render crashes accessing properties on it.
- **Fix:** Always add a `default` case that returns a safe gray/neutral config. For known new values, add explicit cases with appropriate styling. Use `(string & {})` in TypeScript union types to accept unknown strings while preserving autocomplete for known values.
- **Prevention:** When writing any switch/lookup that maps API values to UI config, ALWAYS include a `default` case — even if TypeScript says the union is exhaustive. API responses are untyped JSON at runtime; TypeScript can't enforce exhaustiveness across the network boundary. Audit pattern: search for `switch.*status` or `switch.*type` without `default:` in components that render API data.
- **Applies to:** Status badges, notification type renderers, role-based UI, any component with a status-to-style mapping fed by API data
- **Files:** Badge components, card components, notification renderers — anywhere a switch maps an API field to visual config
- **Date Added:** 2026-02-22
- **Reference:** PaymentStatusBadge crash — partner referral purchases sent `'no_payment'`/`'partner_credit_covered'` statuses not in the 5-case switch, crashing teacher dashboard. Same pattern found in RescheduleBadge.

### Error: SSR Build Failure - window/document Access
- **Symptom:** Build fails with "window is not defined"
- **Root Cause:** Accessing browser APIs during server-side rendering
- **Fix:** Wrap in `typeof window !== 'undefined'` check or use useEffect
- **Files:** Components using localStorage, window, document
- **Date Added:** 2025-11-01

---

## Authentication

### Error: Dual Auth System Confusion
- **Symptom:** Student login doesn't work, wrong token used
- **Root Cause:** Using parent/teacher auth for student or vice versa
- **Fix:** Students use `student_token`/`student_data`, Parents use `token`/`userData`
- **Files:** `lib/student-dashboard-api.ts`, `contexts/AuthContext.tsx`
- **Date Added:** 2025-10-01

### Error: Token Expired / Invalid
- **Symptom:** Sudden 401 errors, user appears logged out
- **Root Cause:** JWT expired, or token corrupted in localStorage
- **Fix:** Check token expiry, implement refresh logic, clear and re-login
- **Files:** `contexts/AuthContext.tsx`, `lib/auth-api.ts`
- **Date Added:** 2025-10-01

### Error: JWT 401 Despite a Valid-Looking Token (Stale Long-Running Dev Server / Secret Mismatch)
- **Symptom:** A JWT you just minted (in `rails runner` or a script) decodes fine in-process and the user/`jti` all check out, but every HTTP request with it returns 401 — often with NO new lines in the server log (warden rejects at signature verification, before the controller runs). Curl and the browser both fail. The same endpoint may also return data that doesn't match your current code.
- **Root Cause:** A local puma that has been running for days is a frozen snapshot: it holds a boot-time in-memory `secret_key_base`, and effectively serves OLD code too. A token signed with the *current* `Rails.application.secret_key_base` (what a fresh `rails runner` resolves) fails verification against the server's older boot-time secret. The "no log lines" is the tell — rejection happens in middleware, not the controller.
- **Fix:** Restart the backend so it loads current code + a fresh secret. On macOS, launch single-mode to dodge the `objc[...] +[NSCharacterSet initialize] ... fork()` crash that crash-loops cluster workers: `OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES WEB_CONCURRENCY=0 bin/rails s -b 0.0.0.0 -p 3001`. To get a token guaranteed valid for whatever secret the running server holds, don't hand-mint — set a password on the seeded user and `POST /api/v1/auth/login {email,password}`, then use the returned `token`.
- **Prevention:** For any local E2E that injects JWTs, prefer logging in through the real `/api/v1/auth/login` over hand-minting — it sidesteps secret drift entirely. If you must hand-mint, restart the server first and confirm one request returns 200 before scripting the rest. Note: the `create(:profile, :teacher)` factory gives the `User` a different Faker email than the `Profile` — log in with `user.email`, not the profile email.
- **Applies to:** Any local JWT / devise-jwt E2E, seeded-data browser tests, Playwright/automation driven against a long-lived `rails s`.
- **Files:** `config/initializers/devise.rb` (`config.jwt.secret`), `app/controllers/api/v1/auth/sessions_controller.rb`, any `rails runner` seed/token script.
- **Date Added:** 2026-06-02
- **Reference:** Honest-`can_publish` E2E (2026-06-02) — runner-minted teacher tokens 401'd with zero server log lines while decoding fine in-process; the puma on `:3001` had booted days earlier with a different in-memory secret AND was serving the pre-fix `can_publish`. Restarting single-mode + minting via `/auth/login` fixed both, and the fresh server then served the honest flag. See memory `project_stale_longrunning_puma_dev_server`.

---

## Next.js App Router

### Error: Client Component Using Server Features
- **Symptom:** Build error about server-only code in client component
- **Root Cause:** Importing server-only module in 'use client' component
- **Fix:** Move server code to Server Component or API route, pass data as props
- **Files:** Components with 'use client' directive
- **Date Added:** 2026-01-08

### Error: Metadata Export in Client Component
- **Symptom:** "You are attempting to export 'metadata' from a component marked with 'use client'"
- **Root Cause:** metadata/generateMetadata only work in Server Components
- **Fix:** Remove 'use client' or move metadata to parent layout/page
- **Files:** `app/**/page.tsx`, `app/**/layout.tsx`
- **Date Added:** 2026-01-08

### Error: Post-Publish App Router Version Skew (`undefined.call`)
- **Symptom:** Shortly after a production publish, a user who already had a tab open gets a client-side `TypeError` such as `undefined.call` during a route transition. A full browser refresh fixes it. Sentry may group this as `JAVASCRIPT-NEXTJS-9`.
- **Root Cause:** The open tab is running route modules from the prior publish but receives an RSC (React Server Components) payload from the new publish. Its module IDs no longer line up, so the old runtime tries to call a module that is not present.
- **Fix:** Give each published revision an immutable Next.js `deploymentId`, and make that same resolved value available to middleware as `NEXT_DEPLOYMENT_ID`. On an RSC request whose `x-deployment-id` differs, return `409` with `Cache-Control: no-store`. In Next 14.2 this makes the client perform a clean full-page navigation before it parses the mismatched payload. Use the configured release when available; Replit's committed Git revision is the fallback.
- **Prevention:** Keep the deployment ID stable within one publish and different for output-distinct publishes. An environment-only rebuild of the same commit must set a unique `NEXT_DEPLOYMENT_ID`. After changing this path, run the focused middleware/config tests and inspect a production build: `required-server-files.json` and the compiled middleware must contain the same ID.
- **Applies to:** Production App Router navigations after a publish. This protects the reported RSC route-transition failure; Server Actions need separate version-skew recovery behavior.
- **Files:** `next.config.mjs`, `middleware.ts`, `middleware.test.ts`, `__tests__/next-config-deployment-id.test.ts`, `scripts/validate-replit-publish.mjs`
- **Date Added:** 2026-08-11
- **Reference:** Sentry event `eaceb7c09b2b4582bb080e07694a154a` (issue 7666164200)

### Error: Same-Page Navigation No-Op
- **Symptom:** Button click dismisses a modal/popup but nothing else visibly happens. User thinks the button is broken. Developer sees `console.log` in devtools and assumes handler is a stub.
- **Root Cause:** `router.push('/current/path')` is a no-op in Next.js App Router when the user is already on that route. The router detects same-path navigation and skips it — no re-render, no data re-fetch. This commonly happens with notification popups or modals rendered at the layout level: the CTA says "View Dashboard" but the user is already on the dashboard.
- **Fix:** Use `router.refresh()` instead of `router.push()` when the goal is to re-fetch data on the current page. `router.refresh()` invalidates the server component cache and triggers a re-render with fresh data without a full page reload.
- **Prevention:** When writing CTA handlers in popups/modals/notifications that are rendered at the layout level (visible on multiple pages), ask: "Is the user likely already on this page?" If yes, use `router.refresh()`. If the handler needs to work from any page, use both: navigate if on a different page, refresh if already there. Also: name buttons honestly — if there's no calendar page, don't call it "View Calendar."
- **Applies to:** Notification popups, toast CTAs, modal action buttons, any CTA in a layout-level component that navigates to a page the user may already be on
- **Files:** Popup/notification components rendered in layout files, any handler calling `router.push()` to a commonly-visited page
- **Date Added:** 2026-02-23
- **Reference:** "View Calendar" button in BookingNotificationPopup (v1.3.3) + "Schedule Now" in PurchaseNotificationPopup (v1.3.1) — both navigated to the current page with no visible effect

### Error: Dead Route Replaced With Wrong Successor
- **Symptom:** A CTA / link / button (often inside an empty-state popover or onboarding nudge) takes the user to a page that *sounds related* to what they wanted but is actually a different feature. User reports "it doesn't go to the right place" / "the redirect is broken." The link is not 404 — it loads cleanly, but to the wrong UI.
- **Root Cause:** A route was deleted (e.g., `app/x/page.tsx` removed), and a follow-up edit pointed every consumer at a *plausibly related* surviving route — typically chosen by name overlap rather than by verifying the destination's actual component imports. Two components/pages can share a noun ("availability", "schedule", "billing") while editing different fields.
- **Fix:** Identify the canonical destination by reading the candidate page's imports and API calls, not by name matching. Update the consumer's `href` / `router.push` to the canonical route.
- **Prevention:** When deleting or renaming a route: (1) `grep -rn "/old/route" --include="*.tsx" --include="*.ts"` for every active reference and update each one in the same commit as the deletion. (2) Before approving the replacement target, open it and confirm it imports the components the original consumer expected (e.g., a "Set Availability" link's destination should import a weekly-schedule editor, not a marketplace-profile picker). (3) Treat route-deletion PRs as full-stack diffs — the page file, the consumer hrefs, and the layout/nav links all ship together or none ship.
- **Applies to:** Any deleted/renamed route, any popover/CTA pointing at a feature page, any "moved to settings" UX cleanup, any deprecation that splits an old surface across multiple new ones (where consumers must be hand-routed to the right one)
- **Files:** Route consumers — `components/**/*.tsx` with `<a href>` / `<Link>` / `router.push()`, navigation components, empty-state popovers, onboarding flows
- **Date Added:** 2026-05-06
- **Reference:** ToolsRail.tsx Start-Lesson popover "Set your availability" link — `/teacher/schedule` (deleted) was replaced with `/teacher/settings?section=marketplace` (Marketplace Profile tab, only contains a marketplace-visibility picker — not the WeeklySchedule/TimeOff/Duration editor at `/teacher/availability`)

### Error: Unbounded fetch in SSG path hangs deploy build on slow/cold backend
- **Symptom:** `next build` hangs indefinitely at `Generating static pages (0/N)` (zero pages generated). Local `next build` and `npm run validate:publish` work fine. Replit / Vercel / similar deploy environment kills the build after its watchdog timeout (~20 min on Replit Autoscale), then spawns retries that compound the failure (Replit autoscale fires 4 parallel `bun install`s on retry).
- **Root Cause:** Any `fetch()` in a build-time path (`app/sitemap.ts`, `app/**/page.tsx` with `next.revalidate`, `generateStaticParams()`, `app/robots.ts`, `app/**/route.ts` route handlers used during build) without a `signal: AbortSignal.timeout(N)` will hang the entire build if the upstream is slow or cold-starting. The build's `try/catch` does NOT save you — hung TCP connections never throw. Localhost is fast/warm so the bug is invisible until the deploy environment exposes it.
- **Fix:** Add `signal: AbortSignal.timeout(N)` to every build-time `fetch` (typical N: 5–10 s). Keep the existing `try/catch` — on timeout the abort throws a `TimeoutError` which the catch swallows, and the build proceeds with empty/fallback data. `AbortSignal.timeout()` is supported in Node ≥17.3 and bun ≥1.0 — both Replit runners support it.
- **Prevention:** When adding any `fetch` in `app/**`, ask: "does this run at build time (SSG / sitemap / robots / route handler invoked during build)? Could the upstream be cold or slow?" If yes, mandatory `signal: AbortSignal.timeout()`. Add to PR checklist for any SSG-touching change. Pre-commit grep for `fetch(` in `app/sitemap.ts`, `app/robots.ts`, `app/**/page.tsx`, `app/**/route.ts` without a `signal` keyword nearby.
- **Diagnostic shortcut:** Build hangs at `Generating static pages (0/N)` → instantly suspect a build-time fetch without a timeout. Local builds passing while deploy builds hanging is the canonical signal.
- **Applies to:** Any deploy environment fronted by autoscaling/cold-start backends — Replit Autoscale, Vercel ISR, AWS Lambda SSG, Cloudflare Pages. Especially when the frontend and backend are both deployed on the same platform (Replit-on-Replit: shared cold-start surface).
- **Files:** `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts`, any `app/**/page.tsx` that fetches data at build time
- **Date Added:** 2026-05-11
- **Reference:** v2.3.0/v2.3.1 — `app/sitemap.ts:21` `while (page <= 100)` loop introduced in `5b5d4d90 fix(seo): harden GSC crawl contract` (2026-05-10) had no `AbortSignal`. 4 consecutive Replit publishes hung at `(0/88)` and were killed. Fixed in v2.3.2 by adding `signal: AbortSignal.timeout(8000)`. Marketplace and teacher/[id] pages already had AbortController timeouts (15 s and 5 s) — only sitemap was missing one.

### Error: Long-Running Dev Server Serves Stale Compiled CSS
- **Symptom:** Edits to `app/globals.css` (new plain-CSS rules, container queries, custom classes) don't appear in the browser — the new class is simply absent from the served stylesheet. Hot reload appears to work for components, builds are clean, and there's no error anywhere. Dangerously, layout fallbacks (scroll valves, flex sizing) can mask the missing rule so visual checks "pass" while the feature is silently off.
- **Root Cause:** A long-running `next dev` process drops its watcher on `globals.css` (or serves a stale compiled CSS chunk from `.next/cache`). Touching the file and re-requesting the page does NOT recover it — the server keeps serving the old compile across requests and sometimes across soft restarts.
- **Fix:** `rm -rf .next/cache` (ONLY the cache subdir — never the whole `.next`, see the type:module `_document.js` 500 trap) AND fully restart the dev server process. Verify recovery by fetching the served stylesheet and grepping for the new selector, not by eyeballing the page.
- **Prevention:** After ANY `globals.css` change you intend to verify in a browser, first prove the selector is in the served CSS: `curl -s localhost:3000/<page> | grep -o 'href="[^"]*css[^"]*"'` then curl that URL and grep the new class name. Treat "CSS edit has no effect" as this pattern immediately — don't debug the CSS itself first. Probe scripts asserting layout outcomes should also assert the mechanism (e.g., `getComputedStyle(...).containerType`), or fallbacks will mask the dead rule.
- **Applies to:** Next.js dev servers left running for hours/days across many HMR cycles; especially plain-CSS additions outside Tailwind utilities (container queries, keyframes, custom classes).
- **Files:** `app/globals.css`, `.next/cache`
- **Date Added:** 2026-06-11
- **Reference:** `.signup-frame { container: frame / size; ... }` consolidation: probes showed `containerType: 'normal'` and the compression silently off (the scroll valve masked it); the served `layout.css` lacked the selector entirely despite touch + cache clear. Only a full dev-server restart + `.next/cache` clear recovered. Second occurrence this feature — the original `@container frame` rules hit the same wall.

### Error: Stale Dev-Server Chunks — Route Stuck on Infinite Loading
- **Symptom:** A route renders only its loading state forever ("Loading your dashboard…"); DevTools/network collectors show **404 on `/_next/static/chunks/app/<route>/page.js`** plus `ERR_ABORTED` on `main-app.js` and layout chunks. Other routes may still work.
- **Root Cause:** A long-running `next dev` server's served HTML shell references chunk hashes that no longer exist on disk after enough recompiles/file churn — the shell and the chunk store have drifted apart. The page can never hydrate, so client-side loading states never resolve.
- **Fix:** Restart the dev server (`Ctrl+C` → `npm run dev -- --port 3000`). Do NOT `rm -rf .next` in this repo (see DEBUGGING.md type:module/_document trap). After restart, warm-compile the routes you're about to drive (`curl` each once) so first-hit compile latency doesn't masquerade as a timeout.
- **Prevention:** In any automated browser check, collect network 404s and check them BEFORE debugging app code — chunk 404s mean harness-environment problem, not app bug. Suspect this first whenever a previously-working route suddenly never finishes loading on a dev server that's been up for hours.
- **Applies to:** Any long-running Next.js dev server; automated verification runs (Playwright, /preflight) driving local dev.
- **Files:** dev server process, `.next/` (dev)
- **Date Added:** 2026-07-17
- **Reference:** /preflight pilot: `/student/dashboard` stuck on "Loading your dashboard…" with 404 on its `page.js`; server restart + route warming fixed it instantly. First hypothesis (component regression) was wrong — the collector output had the answer.

---

## Automated Browser Verification (Playwright / preflight)

### Error: Overlay Wait Anchored on Ambient Text (settle race)
- **Symptom:** A Playwright script intermittently (or consistently) reports an element missing (button count 0) even though a manual probe with a longer sleep shows it present. Screenshots at the failure moment show the overlay open but its rows/actions not yet rendered.
- **Root Cause:** The "panel is ready" wait targets text that ALSO exists outside the overlay (e.g. the fixture title in a dashboard "next action" card behind the panel). The wait resolves on the ambient copy before the overlay's async fetch renders the actionable rows, so the assertion counts elements too early.
- **Fix:** Anchor readiness on something that only exists inside the overlay (its heading, a panel testid), then give the target selector its own bounded wait with a swallowed timeout (`waitForSelector(sel, {timeout}).catch(() => {})`) so a legitimately-absent element still becomes a clean FAIL, not a throw.
- **Prevention:** Before waiting on any text, ask: can this string appear anywhere else on the page? Prefer testids/headings scoped to the surface under test. Never assert immediately after a text wait resolves.
- **Applies to:** Any overlay/slide-over/modal driven by Playwright or Claude-in-Chrome; any page where fixture names echo in multiple components.
- **Files:** `tests/preflight/*/spine.mjs`, any Playwright script
- **Date Added:** 2026-07-17
- **Reference:** /preflight pilot: SANITY assert red-herring — fixture title matched the dashboard next-action card, Turn In counted 0; anchoring on "Homework & Assignments" + bounded TURN_IN wait made 6+ consecutive runs deterministic.

### Error: Resize-Mid-State Screenshot Artifacts (false responsive bugs)
- **Symptom:** Responsive screenshots show clipped logos, off-canvas drawers, or truncated headers at mobile/tablet widths — but the same surface looks fine when a human opens it on a phone-sized window.
- **Root Cause:** The harness opens a surface at desktop size, then `setViewportSize()` down to capture smaller widths. Fixed-position overlays and some navs compute their layout ON OPEN and do not fully re-layout on resize — the screenshot captures a state no real user can reach.
- **Fix:** Before reporting any responsive Critical/Major from a resized screenshot, VERIFY by opening that exact surface in a fresh context created at the failing viewport. Real bug → reproduces fresh; artifact → renders fine. Exclude artifacts explicitly in the report (say so, don't silently drop).
- **Prevention:** Treat resize-sweep screenshots as a cheap first pass, never as evidence on their own. Document the tradeoff in the harness header so copies inherit the warning.
- **Applies to:** Any screenshot-gallery pipeline that resizes mid-state (preflight checkpoints, visual regression sweeps); fixed/absolute-positioned overlays especially.
- **Files:** `tests/preflight/lib/harness.mjs` (`checkpoint()`), any visual-testing harness
- **Date Added:** 2026-07-17
- **Reference:** /preflight pilot: 390px logo-sliver was a resize artifact (fresh-at-390 rendered fine) — but the 390 Add Homework drawer clip and 768 tab clip both REPRODUCED fresh, i.e. the verification step separates real from fake instead of discarding either.

### Error: Two-Clock Test Rot — Frozen App Clock vs Real External Clock
- **Symptom:** A previously-green spec starts failing on a specific calendar date with a DB constraint violation (e.g. `check_proposed_date_not_past`) or an external-system rejection, blocking every commit via pre-commit hooks. Nothing in the diff touches that spec.
- **Root Cause:** The test freezes the APP clock (`travel_to`, fake timers) and hardcodes near-future dates that satisfy app-level validation against frozen time — but the DATABASE (CHECK constraints on `CURRENT_DATE`) or any external system runs on the REAL clock. The fixture passes until reality crosses the hardcoded date, then rots. Worse, the valid window is bounded on both sides (real clock floor from the DB, frozen-clock ceiling from app validations like "≤90 days out"), so no fixed date is safe forever.
- **Fix:** Derive the date from the real clock at spec-load time (module scope evaluates before `travel_to` engages), e.g. pick the year so the fixture date is always ahead of real today, and freeze time to that derived year. Keep the semantic anchor (a July date stays EDT) by deriving the YEAR, not the season.
- **Prevention:** Any fixture that must satisfy a real-clock validator (DB CHECK, external API) may not hardcode a near-term date, period. When a pre-commit spec fails on a date-shaped constraint the day after a date boundary, suspect rot before suspecting the diff.
- **Applies to:** Rails `travel_to` + Postgres CHECK constraints (this incident); equally Vitest `vi.useFakeTimers` + any real-clock system (server validation, JWT `exp`, third-party API date rules).
- **Files:** backend `spec/**` using `travel_to` with literal dates; any FE test with fake timers hitting a live endpoint
- **Date Added:** 2026-07-17
- **Reference:** BE `simple_booking_slot_serializer_spec.rb` hardcoded `proposed_date: 2026-07-16`; on 2026-07-17 the DB CHECK (real `CURRENT_DATE`) rejected it while `travel_to(2026-07-01)` kept Ruby validation happy — every BE commit blocked. Fixed with a derived `edt_year` (commit `a13af697`).

---

## SEO / Structured Data

### Error: Structured Data Validation Failures
- **Symptom:** "Invalid object type" errors in Google Search Console, rich results not appearing
- **Root Cause:** Using unsupported schema types/properties, or combining types incorrectly (e.g., `Service` with `review`, `@type: "Brand"` instead of `"Organization"`)
- **Fix:** Test with Google Rich Results Test tool before deploying. Use only supported combinations.
- **Prevention:** Start with Google's documented examples. Validate every JSON-LD change. Avoid inventing property combinations.
- **Supported types:** FAQPage, WebPage, Organization, Product, Article, BreadcrumbList, HowTo
- **Avoid:** Custom `@type` values, `review` on unsupported types, nested `@type: "Brand"`
- **Files:** Any page with `<script type="application/ld+json">`
- **Date Added:** 2026-01-16

### Error: UTC Date Column Used Directly for Display (Off-By-One Day)
- **Symptom:** Booking dates show one day ahead for users in evening timezones (e.g., 9 PM EST lesson shows as "Feb 19" instead of "Feb 18"). Bug only affects bookings after ~7 PM local time. Appears correct for morning/afternoon bookings.
- **Root Cause:** Database stores booking dates and times in raw UTC columns (`date: :date`, `start_time: :time`). A 9 PM Eastern booking is stored as `date: Feb 19, start_time: 02:00 UTC`. Rendering `slot.date` directly shows "Feb 19" but the user's local date is "Feb 18". The raw date column is not timezone-aware — it's the UTC calendar date, not the booking's local calendar date.
- **Fix (three-rule system):**
  1. **Pre-formatted backend fields** — render as-is with no manipulation (e.g., `original_formatted_time_with_timezone`). Backend computes the correct local date/time using IANA timezone.
  2. **ISO timestamps + formatInTimeZone** — for fields with an ISO8601 UTC string (e.g., `datetime`, `start_time`), use `formatInTimeZone(new Date(isoString), timezone, 'MMM d, yyyy')` where `timezone` is the booking's IANA timezone (NOT `Intl.DateTimeFormat().resolvedOptions().timeZone` — that's browser TZ, not booking TZ).
  3. **Never use raw date columns directly** for display — `slot.date`, `original_date`, `proposed_date`, `due_date` are UTC date columns. Always use pre-formatted fields or ISO timestamp derivation.
  4. **For YYYY-MM-DD strings without per-row timezone**, use `parseDateSafely(dateString)` from `@/lib/date-utils` — it appends `T00:00:00` so `Date` parses as local midnight, not UTC midnight. Use this for dates that don't have a booking timezone (homework due dates, milestones, deadlines, calendar markers) where the user's browser timezone IS the right interpretation.
- **Prevention:** When a backend field is typed as `date: string // YYYY-MM-DD`, ask: "Is this UTC or local?" If it comes from a Rails `:date` or `:time` column, it's UTC. Use the pre-formatted field from the serializer instead, or request the backend add one if missing. NEVER call `new Date("YYYY-MM-DD")` directly — it parses as UTC midnight and renders one day early in any negative-UTC timezone (most of the Americas).
- **Applies to:** Any booking date/time display (lesson cards, reschedule requests, intro call cards, notification popups, email templates) AND any browser-timezone date display (homework due dates, deadlines, milestones, dashboard widgets).
- **Key distinction:** Browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) ≠ Booking timezone (`slot.timezone`). For calendar date grouping and display, always use the booking's timezone, not the viewer's.
- **Files:** Components rendering booking dates — `IntroCallCard.tsx`, `TeacherRescheduleRequestCard.tsx`, `RescheduleRequestCard.tsx`, `BookingNotificationPopup.tsx`, `app/student/dashboard/page.tsx`
- **Date Added:** 2026-02-18
- **Reference:** Teacher Macy Harrison's intro call email showed Feb 18 instead of Feb 17 — full-stack fix in v1.2.2. Recurred 2026-05-06 on student dashboard HW widget (Berni's "Test 2" assignment due Jun 28 displayed as Jun 27); fixed by swapping inline `new Date(due_date)` for `parseDateSafely(due_date)` at `app/student/dashboard/page.tsx:88` — same helper the working popup at `StudentAssignmentsPanel.tsx:492` already uses.

### Error: Inconsistent UTC/Local Mix in Datetime Construction
- **Symptom:** Time sent to backend is wrong for users outside UTC. Reschedule or booking created at the wrong time for non-UTC teachers. Bug is invisible in testing (developers usually in same timezone as test data) but affects real users.
- **Root Cause:** Mixing `Date.toISOString()` (UTC date) with `Date.toTimeString()` (LOCAL time) when constructing a date+time pair to send to the backend. The date is UTC but the time is local, making the combined value internally inconsistent and incorrect for any timezone other than UTC.
- **Fix:** Use `toISOString()` for BOTH date and time extraction when constructing UTC values for the backend: `date = backupDate.toISOString().split('T')[0]` and `time = backupDate.toISOString().slice(11, 16)`. Confirm with backend what timezone the column expects (Rails `:time` columns store UTC).
- **Prevention:** Never mix `toISOString()` and `toTimeString()` in the same datetime construction. Pick one: if backend expects UTC (`:time` column), use `toISOString()` for everything. If backend expects local time, use `toLocaleDateString()` + `toLocaleTimeString()` consistently.
- **Applies to:** Any feature where frontend constructs a date+time pair from a JavaScript `Date` object to send to the backend — reschedule requests, booking creation, availability slots.
- **Files:** `components/teacher/IntroCallDetailModal.tsx` (`handleRescheduleToBackup`), any component building datetime payloads
- **Date Added:** 2026-02-18

### Error: Hidden Priority Override in Form Pre-Fill (User Sees X, System Sends Y)
- **Symptom:** User types a value into a form field, submits, but the backend receives a different value. The form field appears to show the user's input, but a hidden source (localStorage, sessionStorage, URL param) silently overrides it at submission time.
- **Root Cause:** Priority logic at submit time favors the auto-detected/stored value over the form field value (e.g., `autoDetected || manualInput`). A pre-fill `useEffect` on mount copies the stored value into the form field, so the user sees the stored value — but if they change it, the submit handler still prefers the original stored value. The pre-fill masks the bug because the field shows the "winning" value on initial render.
- **Fix:** Flip priority so the form field (manual input) always wins: `manualInput || autoDetected`. Since pre-fill copies the stored value into the form field on mount, both values match when the user doesn't touch it. When the user does change the field, their input wins.
- **Prevention:** When a form field can be populated from multiple sources (localStorage, URL params, API defaults), always let the form field value win at submit time. The form field is what the user sees and edits — it's the source of truth. Pre-fill is fine for defaults, but never let the pre-fill source silently override user edits. Test: pre-fill a field, change it, submit, and verify the changed value is sent.
- **Applies to:** Referral/promo codes, pre-filled addresses, default selections from URL params, any field with both auto-detection and manual input
- **Files:** Multi-step signup flows, checkout forms, any form with pre-fill from external state
- **Date Added:** 2026-02-18
- **Reference:** Referral code bug — `/ref/keritest` stored in localStorage, user typed "andrestest" in signup form, system sent "keritest" because `autoDetectedCode || manualCode` always preferred localStorage

### Error: Third-Party Geo/Address Parser Assumes a Component Type That Some Valid Inputs Lack
- **Symptom:** A user selects a *valid, complete* address from an autocomplete (Google Places, Mapbox, etc.), most sub-fields populate correctly, but **one field silently comes back empty** — and a downstream "required field" validation then hard-blocks the form. The error message tells the user to "select a complete address from the suggestions," which they already did, so it's unsatisfiable and they abandon. Often invisible in testing because the tester's own address parses cleanly.
- **Root Cause:** The parser extracts a field from a **fixed, too-narrow list of component types**. Real-world inputs from a class of locations don't carry those types. Concrete case: `city = locality || sublocality || postal_town` — but **unincorporated communities** (e.g. Hockley, TX) are returned by Google with the town name typed as `neighborhood` (or `administrative_area_level_3`), never `locality`. So `city` parses to `""`. A second trap compounds it: the form clears the geocoded coordinates whenever **any** address field is edited, so a user who manually types the missing city *also* wipes the lat/lng that the same validation requires — leaving no path to submit.
- **Fix:** (1) Broaden the fallback chain to cover the less-common component types the API actually emits for that class of input (`... || neighborhood || administrative_area_level_3`), deliberately excluding types that would mislabel the value (`administrative_area_level_2` = county). (2) When invalidating derived data (coordinates) on manual edit, only clear it for fields that genuinely change the derived value (street/zip/state/country move the pin; a city *label* does not) — so manual correction of a parser gap remains submittable.
- **Prevention:** Never assume a third-party geo/address response carries a specific component type for all valid inputs — enumerate against real edge cases (rural, unincorporated, military, PO-box, international). **Verify the actual API response** for a failing input (log `address_components`) rather than trusting the parser's happy-path field list. When a "select from suggestions" validation can fail *after* a suggestion was selected, the validation is lying — trace which parsed field is empty. And when editing field A clears derived field B that validation also requires, confirm A actually affects B.
- **Applies to:** Any autocomplete/geocoding integration (Google Places, Mapbox, Algolia Places), and more broadly any parser that maps a rich third-party payload into required form fields via a fixed key list. Also the general "manual edit nukes derived state the gate needs" two-way validation trap.
- **Files:** `lib/teacher-application-validation.ts` (`parseGooglePlace`), `components/teacher-app-v2/ui/AddressSelector.tsx` (`handleFieldEdit`, `isAddressValid`); any `lib/*-validation.ts` parsing a maps API result.
- **Date Added:** 2026-07-06
- **Reference:** Teacher applicant at "23811 Wimble Dr, Hockley, TX 77447" selected the correct suggestion but City came back empty (Google returned `Hockley [neighborhood]`, no `locality`) → "Address Selection Required" hard-block → applicant never applied. Verified against the live Places API: old parser → `""`, fix (`+neighborhood`) → `"Hockley"`. Second trap: editing city cleared lat/lng, which validation also required.

---

## Real-Time Media (WebRTC, Daily.co, Audio/Video)

### Error: WebRTC SDK Missing Audio Sink in Headless / callObject Mode
- **Symptom:** Two peers in a WebRTC session can negotiate the call, both grant microphone permission, no console errors fire, mic indicators show audio levels — but participants cannot reliably hear each other. May present as "audio drops in and out" because browser autoplay heuristics occasionally grant the SDK a brief opportunistic play window before stopping. Bug typically surfaces only after two-real-user testing; solo / single-window walkthroughs never reveal it because there's no remote audio to play.
- **Root Cause:** WebRTC SDKs commonly ship in two modes. **Iframe mode** (e.g. Daily's `DailyIframe`) renders the entire UI including audio elements internally — audio "just works." **Headless / callObject mode** (e.g. Daily's `DailyProvider` + `useDaily()` + the React hooks) delegates rendering to the host app — the SDK delivers remote audio *tracks* on the peer connection but does NOT mount any DOM `<audio>` element to play them. The host app must explicitly mount the SDK's audio-sink component (Daily's `<DailyAudio />`, LiveKit's `<RoomAudioRenderer />`, Agora's `RemoteUser` audio, etc.). Without it, tracks arrive but never reach the speakers. The distinction is invisible in keyword search because there are no errors — the SDK is happy, the OS is happy, the browser is happy. The audio simply has nowhere to play.
- **Fix:** Mount the SDK's audio-sink component inside the provider tree on **every** client that needs to hear remote audio. For Daily: `<DailyAudio onPlayFailed={...} />` inside `<DailyProvider>`. Wire the failure callback to handle browser autoplay restrictions (the user may need to interact before audio plays in cold-start sessions).
- **Prevention:** When integrating ANY WebRTC SDK in headless / callObject / React-hook mode, the FIRST thing to verify is the audio-sink mounting requirement — read the SDK's React-package API contract, not just the iframe docs. The `.d.ts` of a `DailyAudio`-equivalent component is the give-away: if it has a ref handle returning `HTMLAudioElement[]` (e.g. `getAllAudio()`, `getAudioBySessionId()`), the component is the consumer-mounted audio sink and you must render it. Two-user end-to-end audio test BEFORE shipping is mandatory — solo testing of a video-call feature is structurally incapable of catching this class of bug. If the project does not have two-tab/two-machine E2E audio coverage, add a manual test runbook to the per-feature ship gate.
- **Applies to:** Daily.co (`@daily-co/daily-react` + `DailyProvider`), LiveKit (`@livekit/components-react` + `LiveKitRoom`), Agora (`agora-rtc-react`), Twilio Video SDK, any WebRTC SDK with both iframe and headless variants. Also applies to screen-share audio and remote-participant audio metering hooks (`useAudioTrack`, `useParticipantProperty('audioTrack')`) — those expose the track but do not play it.
- **Files:** Any file that mounts a `<DailyProvider>` / `<LiveKitRoom>` / Agora `<AgoraRTCProvider>` tree — typically `app/**/live/page.tsx`, `app/**/live-lesson/page.tsx`, or any page that initiates a video call. Check that an audio-sink sibling (`<DailyAudio />`, `<RoomAudioRenderer />`, etc.) lives inside the same provider subtree.
- **Date Added:** 2026-05-13
- **Reference:** Teach Mode v2.3.9 — `DailyAudio` had never existed in the repo since Teach Mode shipped. Verified via `git log -S "DailyAudio"` returning zero history. Prior QA passes were solo walkthroughs (CEO Pass 2, vitest, etc.) which never exercised remote-audio playback. The bug only surfaced when Andres ran a two-machine smoke test for production verification.

### Error: Same-Room WebRTC Token Churn Causes Media Teardown on Reconnect
- **Symptom:** A live classroom briefly shows a sync-disconnected/retry banner; video/audio may still work at the instant the banner appears, but seconds later WebRTC media elements are torn down and recreated. A self-camera tile can return black/blank even though browser camera permission is granted. Console may show local track retry messages, but no clear sync stack trace.
- **Root Cause:** A real-time sync reconnect path refetches room credentials. If the backend returns the same WebRTC `room_url` with a freshly minted token, React context updates the credentials; the credential bridge propagates the new token into video state; the media bridge has `token` in its join-effect dependencies, so it leaves and rejoins the same call. That unnecessary leave/rejoin churn detaches/recreates local media tracks and can leave the self-view without a stream.
- **Fix:** During active/completed live workspaces, preserve existing WebRTC credentials when reconnect refetch returns the same `room_url`. Still replace credentials when the `room_url` actually changes. Add regression coverage proving same-room token rotation does not change `roomCredentials` object identity, and proving different-room responses still update.
- **Prevention:** Treat real-time sync credentials and media-call credentials as separate stability surfaces. Reconnect/refetch logic should not rotate media credentials for an already-joined same-room call unless the room URL changed, the current token expired with an observed auth failure, or the user explicitly retries video. When diagnosing camera blanks after a sync banner, first check whether a media leave/join happened after a same-room token change.
- **Applies to:** Daily.co callObject/headless integrations where room credentials are stored in React context and passed into a join effect; also applies to other WebRTC SDKs when reconnect metadata changes are wired directly to media-session dependencies.
- **Files:** `contexts/SyncContext.tsx`, credential bridge components, `components/**/DailyEventBridge.tsx`, any WebRTC join-effect bridge.
- **Date Added:** 2026-05-28
- **Reference:** Teach Mode v2.6.0 follow-up — WebBridge live monitor caught `Classroom sync disconnected` first while both video tracks were live; about 13 seconds later the video DOM was torn down/recreated and the teacher self-view had no stream. Fixed by preserving same-room Daily credentials during active/completed lesson reconnects.

### Error: Media Processor WebAssembly Blocked by CSP
- **Symptom:** Production console shows `Uncaught CompileError: WebAssembly.Module(): Compiling or instantiating WebAssembly module violates ... Content Security Policy` with stack frames such as `instantiateSync`, `createWasm`, or `new WorkerProcessor`. Basic speech may still pass, but processor-backed features such as music mode, noise cancellation, background blur, or input processing sound wrong, noisy, or inconsistent.
- **Root Cause:** Some media SDK input processors compile WebAssembly in a worker/processor path. A CSP that allows SDK scripts, blobs, workers, and connect origins can still block `WebAssembly.Module()` unless `script-src` includes the WebAssembly-specific allowance. Production often omits broad `'unsafe-eval'`, so WASM needs the narrower `'wasm-unsafe-eval'` source expression.
- **Fix:** Add `'wasm-unsafe-eval'` to `script-src` while keeping production free of broad `'unsafe-eval'`. Add middleware/security-header tests that assert processor WASM is allowed, SDK origins remain allowed, and production `script-src` does not include broad unsafe eval.
- **Prevention:** For third-party SDKs that use audio/video processors, background blur, noise cancellation, transcription, or other worker-heavy media features, audit CSP for WASM separately from normal script/worker/connect allowances. A passing SDK load does not prove its processor path can instantiate. Live QA should explicitly watch console while toggling processor-backed modes.
- **Applies to:** Daily.co input settings processors (`updateInputSettings({ audio: { processor: { type: 'noise-cancellation' }}})`), video background processors, and any SDK media processor implemented with WebAssembly.
- **Files:** `middleware.ts`, CSP/security-header tests, media input-setting bridge components.
- **Date Added:** 2026-05-28
- **Reference:** Teach Mode music-mode/audio-quality test — production CSP blocked Daily `WorkerProcessor` WASM because `script-src` lacked `'wasm-unsafe-eval'`. Fixed without adding broad production `'unsafe-eval'`.

---

## How to Add New Errors

### Pattern Quality Checklist

Before adding an error, ask:

1. **Is it generalizable?** Will this help with future bugs, or just document one incident?
   - ❌ Bad: "Mixpanel CSP Blocked (api-js.mixpanel.com)" - too specific
   - ✅ Good: "CSP Missing Required Subdomain" - applies to ANY SDK

2. **Does it have prevention guidance?** Not just "how to fix" but "how to avoid next time"
   - ❌ Bad: "Add X to file Y"
   - ✅ Good: "When adding any third-party SDK, check Network tab for all domains"

3. **Does it apply to multiple scenarios?** Include "Applies to:" section
   - ✅ Good: "Applies to: sessionStorage, localStorage, URL params, cookies"

### Required Fields

```markdown
### Error: [Generalizable Pattern Name]
- **Symptom:** [What the user/developer sees - be specific]
- **Root Cause:** [WHY this happens - the underlying principle]
- **Fix:** [How to resolve it]
- **Prevention:** [How to avoid this in the future]
- **Applies to:** [What other situations this pattern covers]
- **Files:** [Common file locations, use "any X" for broad patterns]
- **Date Added:** [YYYY-MM-DD]
```

### Adding via Script

```bash
python .claude/skills/debug/scripts/log_error.py \
  "Category" \
  "Generalizable Pattern Name" \
  "Symptom description" \
  "Root cause (the principle, not the incident)" \
  "Fix + Prevention guidance"
```

### Anti-Patterns to Avoid

- ❌ Logging specific file names as the pattern name
- ❌ Logging one-off bugs that won't recur
- ❌ Missing "Prevention" guidance
- ❌ Symptoms that are too vague ("it doesn't work")
- ❌ Root causes that describe WHAT not WHY
