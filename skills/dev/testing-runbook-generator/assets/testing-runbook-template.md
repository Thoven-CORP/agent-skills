# [Feature Name] - Testing Runbook

**Quick Reference:** How to test [Feature Name] from code to production

---

## Testing Phases Overview

```
Phase 1: Automated Tests (5-10 min)
         ↓ (must pass)
Phase 2: Developer Smoke Test (15-30 min)
         ↓ (must work)
Phase 3: QA Testing (4-7 hours)
         ↓ (no P0 blockers)
Phase 4: Staging Validation (30 min)
         ↓ (stakeholder approval)
Phase 5: Production Rollout (3 days gradual)
         ↓ (monitor metrics)
Phase 6: Post-Launch Monitoring (2 weeks)
```

---

## Phase 1: Automated Tests

**Who:** Developer
**Environment:** Local
**Time:** 5-10 minutes

### Run These Commands:

```bash
# Frontend unit tests
npm run test

# Backend unit tests
bundle exec rspec

# Linting
npm run lint

# Type checking
npm run type-check
```

### Pass Criteria:
✅ All tests pass (0 failures)
✅ No regressions
✅ No linting errors
✅ No TypeScript errors

### If Fails:
🔴 Fix bugs → Re-run tests → Must pass before continuing

---

## Phase 2: Developer Smoke Test

**Who:** Developer
**Environment:** Local or Dev
**Time:** 15-30 minutes

### Quick Checklist:

**Setup:**
- [ ] Enable feature flag: `[feature_flag_name] = true`
- [ ] Frontend running: `npm run dev`
- [ ] Backend running: `rails server`
- [ ] Open DevTools → Network tab

**Happy Path Test:**
[Primary user flow - extract from spec and convert to checklist]
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
- [ ] See expected outcome

**Analytics Check:**
- [ ] Network tab shows ~[N] [Analytics Platform 1] requests
- [ ] Network tab shows ~[N] [Analytics Platform 2] requests (if applicable)
- [ ] No console errors

**Edge Case Test:**
[1-2 key edge cases from spec]
- [ ] Edge case scenario
- [ ] Expected behavior shown

### Pass Criteria:
✅ Happy path works end-to-end
✅ Analytics events fire
✅ [Email/notification] delivers (if applicable)
✅ Edge case works
✅ No console errors

### If Fails:
🔴 Fix bugs → Re-run smoke test → Must pass before QA

---

## Phase 3: QA Testing (Comprehensive)

**Who:** QA Team or You
**Environment:** Staging ([staging_url])
**Time:** 4-7 hours
**Document:** Use `[Feature Name] - QA Checklist.md`

### QA Process:

**1. Setup (15 min)**
- [ ] Read QA checklist
- [ ] [Create test accounts / Seed test data]
- [ ] Open [Analytics Platform] dashboard(s)
- [ ] Prepare devices (desktop + iPhone + Android)

**2. Systematic Testing (3-5 hours)**

**Priority 1: Critical Flows (MUST work)**
[Extract from spec - primary flow + key capabilities]
- [ ] Happy path ([brief flow description])
- [ ] Analytics validation (all [N] events)
- [ ] [Email/notification] delivery + rendering (if applicable)
- [ ] [Other critical capability]

**Priority 2: Edge Cases**
[Extract from spec - edge cases and error handling]
- [ ] Edge case 1
- [ ] Edge case 2
- [ ] API error handling
- [ ] [Other edge cases]

**Priority 3: Cross-Platform**
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Desktop browsers (Chrome, Safari, Firefox)
- [ ] [Email] rendering (Gmail, Outlook, mobile) (if applicable)

**3. Bug Reporting (30 min)**
- Document each bug found:
  - Severity: P0 (blocker) / P1 (high) / P2 (low)
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots

**4. Re-test Fixes (1-2 hours)**
- Developer fixes P0 bugs
- QA re-tests only fixed areas
- Sign off when P0 bugs resolved

### Pass Criteria:
✅ **Zero P0 blockers**
✅ Happy path works completely
✅ All [N] analytics events fire correctly
✅ [Email/notification] delivers and renders properly (if applicable)
✅ Works on mobile (iOS + Android)
⚠️ P1/P2 bugs documented (can fix later)

### If Fails:
🔴 Document P0 blockers → Developer fixes → Re-test → Must pass before staging validation

---

## Phase 4: Staging Validation (Stakeholder Sign-Off)

**Who:** Product Manager / Stakeholder / You
**Environment:** Staging ([staging_url])
**Time:** 30 minutes

### What to Validate:

**Business Logic:**
[Extract from spec - key business requirements]
- [ ] [Business requirement 1]
- [ ] [Business requirement 2]
- [ ] Copy/messaging aligns with brand

**UX/Design:**
- [ ] [Interactions/animations] feel premium
- [ ] Mobile experience delightful
- [ ] Colors/fonts match brand
- [ ] "Feels ready" for customers

**Analytics Readiness:**
- [ ] Log into [Analytics Platform] → See test events
- [ ] Verify [Funnel/Dashboard] can be built
- [ ] Check events in all platforms

### Pass Criteria:
✅ Stakeholder approves for production
✅ UX meets quality bar
✅ Analytics instrumented correctly

### If Fails:
⚠️ Address feedback → Re-test → Get sign-off

---

## Phase 5: Production Rollout (Gradual)

**Who:** Developer (monitored by PM)
**Environment:** Production
**Time:** 3 days (gradual rollout)

### Deployment Strategy:

**Step 1: Deploy Code (0% traffic)**
```bash
# Deploy backend
git push production main
RAILS_ENV=production rails db:migrate

# Deploy frontend
npm run build && npm run deploy:production

# Feature flag: OFF (disabled for all users)
```

**Step 2: Day 1 - 10% Rollout**
- [ ] Enable feature flag for 10% of users
- [ ] **Monitor for 4-6 hours:**
  - [ ] Error rate: < 5%
  - [ ] [Key metric 1]: Trending toward [target]
  - [ ] [Key metric 2]: [threshold]
  - [ ] No customer complaints

**Step 3: Day 2 - 50% Rollout** (if Day 1 stable)
- [ ] Increase feature flag to 50%
- [ ] **Monitor for 24 hours:**
  - [ ] Same metrics as Day 1

**Step 4: Day 3 - 100% Rollout** (if Day 2 stable)
- [ ] Enable for all users (100%)
- [ ] **Monitor for 48 hours:**
  - [ ] All metrics stable
  - [ ] No spike in errors or complaints

### Rollback Procedure (If Issues Found):
```bash
# Immediately disable feature flag
set_feature_flag('[feature_flag_name]', false)

# Or rollback deployment
git revert [commit] && git push production main
```

**Rollback Triggers:**
- 🔴 Error rate > 10%
- 🔴 [Critical metric] < [threshold]
- 🔴 Multiple customer complaints

---

## Phase 6: Post-Launch Monitoring

**Who:** Product Manager + Developer
**Environment:** Production
**Time:** 15 min/day for 2 weeks

### Daily Checks (First 2 Weeks):

**[Analytics Platform] Dashboard:**
[Extract success metrics from spec]
- [ ] [Metric 1]: ___% (target: [target])
- [ ] [Metric 2]: ___% (target: [target])
- [ ] Top drop-off point: ___ (investigate if > 30% drop)

**Error Monitoring:**
- [ ] Backend API errors: ___% (target: < 5%)
- [ ] Frontend console errors: None critical

**[Email/Notification] Performance:** (if applicable)
- [ ] [Email service] delivery rate: ___% (target: > 95%)
- [ ] Open rate: ___% (baseline tracking)
- [ ] Click rate: ___% (baseline tracking)

**[Feature-Specific Metric]:** (if applicable)
[Extract from spec - any feature-specific monitoring]
- [ ] [Metric]: ___% (target: [target])

### Success Criteria (After 2 Weeks):

**✅ Feature Succeeds If:**
[Extract from spec - success metrics]
- [Metric 1] ≥ [target]
- [Metric 2] ≥ [target]
- Error rate < 5%
- Positive or neutral customer feedback

**→ Action:** [Next phase plan from spec]

**⚠️ Feature Underperforms If:**
[Metric ranges showing partial success]

**→ Action:** Optimize weak points (UX tweaks, copy changes, etc.)

**🔴 Feature Fails If:**
[Metric thresholds showing failure]

**→ Action:** Investigate root cause, major changes needed or pivot

---

## Quick Reference Card

### Testing Sequence Cheat Sheet:

```
1. npm run test           (5 min)   → Must pass
2. Smoke test happy path  (15 min)  → Must work
3. QA checklist           (4 hours) → Zero P0 bugs
4. Stakeholder review     (30 min)  → Approval
5. Deploy 10% → 50% → 100% (3 days) → Monitor metrics
6. Daily monitoring       (2 weeks) → Hit targets
```

### When to Stop and Fix:

| Phase | Stop If... | Fix Then... |
|-------|------------|-------------|
| Automated Tests | Any test fails | Fix → Re-run → Must pass |
| Smoke Test | Happy path broken or no analytics | Fix → Re-run |
| QA | P0 blockers found | Fix → Re-test P0s |
| Staging | Stakeholder says no | Address feedback |
| Production | Error rate > 10% or [metric] < [threshold] | Rollback → Fix → Re-deploy |

---

## Tools You'll Need

**Development:**
- Local frontend: `npm run dev`
- Local backend: `rails server`
- Feature flag control: [Admin panel / env var / method]

**Analytics:**
[List from spec - with URLs if known]
- [Platform 1]: [URL or description]
- [Platform 2]: [URL or description]
- Browser DevTools: Chrome → F12 → Network tab

**[Email/Notifications]:** (if applicable)
- [Email service]: Delivery rates
- Test accounts: [Gmail, Outlook, etc.]

**Monitoring:**
- Error tracking: [Sentry / equivalent]
- Logs: Backend logs (`rails logs`)

---

**Created:** [Date]
**Owner:** Andres Martinez
**Related Docs:**
- PRD: `PRD's & Technical Specs/[Feature Name] Spec.md`
- QA Checklist: `PRD's & Technical Specs/[Feature Name] - QA Checklist.md`
- Notion Epic: [Link if available]
