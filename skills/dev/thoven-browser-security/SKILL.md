---
name: thoven-browser-security
description: Review Thoven frontend browser security changes for PII logging, auth-cache bypasses, storage lifetime, privacy-copy drift, and analytics exposure. Use with Warden during Phase 1 Browser + Contracts work.
---

# Thoven Browser Security

Review frontend changes for security regressions in browser-observable behavior. Focus on exploitable or compliance-relevant issues, not style.

## Required Checks

1. **PII logging and bundle exposure**
   - Flag new or retained `console.log`, diagnostic dumps, raw API responses, tokens, emails, phone numbers, addresses, child names, or profile objects in production-reachable code.
   - Confirm any logger abstraction is production-gated and does not retain sensitive payloads.
   - Check canary scripts or tests cover known leak strings where applicable.

2. **Auth cache behavior**
   - Flag any path where missing, deleted, expired, or invalid tokens still produce authenticated state from `localStorage`, `sessionStorage`, cached profiles, or in-memory fallbacks.
   - Verify logout clears auth-bearing caches across parent, teacher, student, and admin surfaces.
   - Check `token` and `student_token` handling separately.

3. **Browser storage minimization**
   - Flag persistent storage of email, phone, address, child PII, full profile objects, raw backend responses, or consent records beyond the minimum field set needed for UX.
   - Prefer session-scoped storage for student session data unless the feature has an explicit reason to persist longer.
   - Verify removed fields have either no consumers or a fresh on-demand API source.

4. **Privacy and consent honesty**
   - Flag copy that claims Verifiable Parental Consent when the current implementation only captures acknowledgment.
   - Flag analytics, advertising, or tracking behavior that contradicts privacy policy language or student-route isolation.

5. **Analytics and third-party exposure**
   - Flag pathnames, query params, student IDs, child names, email, phone, address, or profile identifiers sent to Mixpanel, GA4, Google Ads, Meta Pixel, Daily, or other browser-side vendors.

## Evidence Standard

Every finding must include:

- Exact file and line when possible.
- Why the behavior is production reachable.
- The sensitive data or auth property at risk.
- A concrete fix or test that would prove the issue is closed.

Do not report purely theoretical issues without a reachable path.
