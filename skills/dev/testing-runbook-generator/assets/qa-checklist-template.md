# [Feature Name] - QA Checklist

**Comprehensive testing checklist for [feature description]**

---

## Testing Information

**Feature:** [Feature Name]
**PRD:** `PRD's & Technical Specs/[Feature Name] Spec.md`
**Testing Runbook:** `PRD's & Technical Specs/[Feature Name] - Testing Runbook.md`
**Staging URL:** [staging_url]
**Feature Flag:** `[feature_flag_name] = true`

**Estimated Time:** 4-7 hours
**Priority:** Focus on P1 (Critical) items first

---

## Section 1: Functional Testing - Happy Path

**Priority:** P1 (Critical)

[Extract primary user flow from spec - convert each step to checkbox with expected outcomes]

### Step 1: [Action/Page]
- [ ] [Verification checkpoint 1]
- [ ] [Verification checkpoint 2]
- [ ] [Expected behavior]

### Step 2: [Action/Page]
- [ ] [Verification checkpoint 1]
- [ ] [Verification checkpoint 2]
- [ ] [Expected behavior]

[Continue for all steps in primary flow]

**Validation:**
- [ ] End-to-end flow completes without errors
- [ ] User sees expected final state
- [ ] [Confirmation email/notification sent] (if applicable)

---

## Section 2: Supporting Flows

**Priority:** P1 (Critical)

[Extract supporting flows from spec]

### Flow A: [Flow Name]
- [ ] [Step with expected outcome]
- [ ] [Step with expected outcome]
- [ ] [Validation point]

### Flow B: [Flow Name]
- [ ] [Step with expected outcome]
- [ ] [Step with expected outcome]
- [ ] [Validation point]

---

## Section 3: Edge Cases & Error Handling

**Priority:** P1 (Critical)

[Extract edge cases from spec]

### Input Validation
- [ ] Invalid [field] → [expected error message]
- [ ] Missing required field → [expected behavior]
- [ ] [Boundary case] → [expected behavior]

### Network & API Errors
- [ ] Slow network (throttle to 3G) → [loading states shown]
- [ ] API returns 500 error → [user-friendly error message shown]
- [ ] API returns 429 (rate limit) → [rate limit message shown]
- [ ] API timeout → [timeout handling behavior]

### Boundary Conditions
[Extract from spec - limits, constraints, edge values]
- [ ] [Boundary case 1] → [expected behavior]
- [ ] [Boundary case 2] → [expected behavior]

---

## Section 4: Analytics Validation

**Priority:** P1 (Critical)

[Extract analytics events from spec]

### [Analytics Platform 1] Events (e.g., Mixpanel)
Test each event fires correctly with proper properties:

- [ ] Event 1: `[event_name]`
  - Properties: `[property1]`, `[property2]`, `[property3]`
  - Fires when: [trigger condition]
  - Verify in: Network tab → Filter "[platform]"

- [ ] Event 2: `[event_name]`
  - Properties: `[property1]`, `[property2]`
  - Fires when: [trigger condition]

[List all events from spec]

### [Analytics Platform 2] Events (e.g., Meta Pixel)
- [ ] PageView
  - Fires when: [trigger condition]
- [ ] [Custom event 1]
  - Parameters: [list parameters]
  - Fires when: [trigger condition]
- [ ] [Custom event 2]
  - Parameters: [list parameters]
  - Fires when: [trigger condition]

### Dashboard Verification
- [ ] Log into [Analytics Platform] dashboard
- [ ] See all test events in real-time
- [ ] Properties are populated correctly
- [ ] No duplicate events firing
- [ ] Session IDs consistent across events
- [ ] Variant properties correct (if A/B test)

---

## Section 5: Performance Testing

**Priority:** P2

[Extract performance constraints from spec]

### Load Times
- [ ] API response < [threshold from spec] (measure with DevTools Network tab)
- [ ] Page load < [threshold] on desktop
- [ ] Page load < [threshold] on mobile
- [ ] [Animation/interaction] runs smoothly (60fps - check DevTools Performance)

### Stress Testing
- [ ] Rapid clicks don't break UI
- [ ] Multiple submissions handled correctly (idempotency)
- [ ] [Concurrent usage scenario if applicable]

---

## Section 6: Cross-Browser & Cross-Device

**Priority:** P1 (Critical for mobile features, P2 otherwise)

### Desktop Browsers
- [ ] Chrome (latest) - Windows
- [ ] Chrome (latest) - macOS
- [ ] Safari (latest) - macOS
- [ ] Firefox (latest)
- [ ] Edge (latest)

### Mobile Devices
- [ ] iOS Safari (iPhone) - iOS [version]
- [ ] Android Chrome (Android phone) - Android [version]
- [ ] Tablet (iPad or Android tablet)

### Responsive Design
- [ ] 320px width (smallest mobile)
- [ ] 375px width (iPhone SE)
- [ ] 768px width (tablet portrait)
- [ ] 1024px width (tablet landscape)
- [ ] 1920px width (desktop)
- [ ] Elements don't overflow at any breakpoint
- [ ] Text is readable at all sizes
- [ ] Touch targets ≥ 44x44px on mobile

---

## Section 7: [Email/Notification] Testing

**Priority:** P1 (if feature sends emails/notifications)

[Extract email/notification details from spec - INCLUDE ONLY IF APPLICABLE]

### Delivery
- [ ] Email arrives within [expected time]
- [ ] Subject line: "[expected subject]"
- [ ] From address: [expected sender]
- [ ] Reply-to works correctly
- [ ] No spam folder placement

### Rendering
- [ ] Gmail (desktop web)
- [ ] Gmail (mobile app - iOS)
- [ ] Gmail (mobile app - Android)
- [ ] Outlook (desktop)
- [ ] Outlook (web)
- [ ] Outlook (mobile app)
- [ ] Apple Mail (macOS)
- [ ] Apple Mail (iOS)
- [ ] Dark mode (if supported)

### Content & Links
- [ ] All text displays correctly
- [ ] Images load (no broken images)
- [ ] CTA buttons are clickable
- [ ] All links go to correct destinations
- [ ] Unsubscribe link works
- [ ] Plain text fallback exists and renders correctly
- [ ] Personalization tokens replaced (no {{placeholders}} visible)

---

## Section 8: A/B Test Validation

**Priority:** P1 (if feature has A/B tests - INCLUDE ONLY IF APPLICABLE)

[Extract A/B test details from spec]

### Variant Assignment
- [ ] Users assigned to correct variant
- [ ] Assignment persists across sessions (same user always sees same variant)
- [ ] Assignment is random (roughly 50/50 split)
- [ ] Variant stored correctly (check localStorage/sessionStorage/backend)

### Variant Behavior
- [ ] Variant A shows [expected difference from spec]
- [ ] Variant B shows [expected difference from spec]
- [ ] No users seeing mixed variants within same session

### Event Tagging
- [ ] All analytics events include `variant` property
- [ ] Variant value is "control" or "treatment" (or as defined in spec)
- [ ] Events tagged correctly for each variant

### Traffic Split
- [ ] Check analytics dashboard: ~50% in each variant
- [ ] Check over multiple test sessions (at least 10 sessions)

---

## Section 9: Security & Bot Protection

**Priority:** P1

[Extract security requirements from spec]

### Input Sanitization
- [ ] XSS attempt blocked: Enter `<script>alert('xss')</script>` in text fields
  - Expected: Text is escaped/sanitized, script doesn't execute
- [ ] SQL injection blocked (if backend involves SQL): Enter `'; DROP TABLE--` in text fields
  - Expected: Input rejected or safely escaped
- [ ] Special characters handled: Test with `<>&"'` in all inputs

### Bot Protection
- [ ] Honeypot field (if implemented) → Bot submissions rejected
  - Test: Fill hidden "website" field → Submission should fail silently
- [ ] Rate limiting → [N] requests/min enforced
  - Test: Make [N+1] rapid requests → Expect 429 error
- [ ] CAPTCHA (if implemented) required after [N] failed attempts
  - Test: Fail [N] times → CAPTCHA appears

### Data Privacy
- [ ] Sensitive data not in URLs (no PII in query params)
- [ ] Sensitive data not in console logs (check DevTools Console)
- [ ] Sensitive data not in localStorage (check DevTools Application)
- [ ] [GDPR/compliance requirement] met (if applicable)

---

## Section 10: Accessibility

**Priority:** P2

### Keyboard Navigation
- [ ] Tab order is logical (follows visual flow)
- [ ] All interactive elements reachable by keyboard (no keyboard traps)
- [ ] Focus indicators visible (can see which element is focused)
- [ ] Enter/Space triggers buttons and links
- [ ] Escape closes modals/dialogs (if applicable)

### Screen Reader
- [ ] [Screen reader - NVDA/JAWS/VoiceOver] announces all content
- [ ] Form labels read correctly (label associated with input)
- [ ] Error messages announced when they appear
- [ ] [Key interaction] accessible (e.g., "Submit button" announced)
- [ ] Images have alt text
- [ ] ARIA labels present where needed

### Visual
- [ ] Color contrast meets WCAG AA (use DevTools Lighthouse or Axe)
  - Text: 4.5:1 minimum
  - Large text: 3:1 minimum
- [ ] Text resizable to 200% without breaking layout
- [ ] No content relies only on color (e.g., red error needs icon too)
- [ ] Focus states visible for all interactive elements

---

## Section 11: Post-Launch Monitoring Setup

**Priority:** P2 (setup before launch)

### Dashboards
- [ ] [Analytics Platform] dashboard created
- [ ] [Funnel/Report name] configured
- [ ] Metrics tracked: [list key metrics from spec]
- [ ] Alert thresholds set: [metric] < [threshold]

### Error Monitoring
- [ ] [Error tracking tool - e.g., Sentry] configured for this feature
- [ ] Error notifications routed to [Slack channel / email / person]
- [ ] Source maps uploaded (for frontend JS errors)

### Metrics Baseline
- [ ] Record pre-launch [baseline metric] (e.g., current conversion rate)
- [ ] Set success targets: [metric] = [target]
- [ ] Set failure thresholds: [metric] < [threshold]

---

## Bug Reporting Template

When you find a bug, document it like this:

**Bug #[N]: [Brief title]**
- **Severity:** P0 (blocker) / P1 (high) / P2 (low)
- **Steps to Reproduce:**
  1. Step 1
  2. Step 2
  3. Step 3
- **Expected Behavior:** [What should happen]
- **Actual Behavior:** [What actually happened]
- **Environment:** [Browser, device, OS, staging/prod]
- **Screenshots:** [Attach]

**Severity Definitions:**
- **P0 (Blocker):** Feature completely broken, data loss, security issue
- **P1 (High):** Major functionality broken, affects most users, bad UX
- **P2 (Low):** Minor issue, edge case, cosmetic, affects few users

---

## Sign-Off

**QA Tester:** _______________
**Date Completed:** _______________
**P0 Bugs Found:** ___ (must be 0 to pass)
**P1 Bugs Found:** ___ (documented for follow-up)
**P2 Bugs Found:** ___ (documented for follow-up)

**Ready for Production:** ☐ Yes ☐ No

**Notes:**
[Any additional context, observations, or recommendations]

---

**Created:** [Date]
**Owner:** Andres Martinez
**Related Docs:**
- PRD: `PRD's & Technical Specs/[Feature Name] Spec.md`
- Testing Runbook: `PRD's & Technical Specs/[Feature Name] - Testing Runbook.md`
