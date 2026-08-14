---
name: thoven-coppa-vpc-contracts
description: Review Thoven backend COPPA/VPC changes and contracts for consent lifecycle, mailers, activation gates, serializers, frontend redirects, and parent-facing compliance drift. Use with Warden for VPC and COPPA backend work.
---

# Thoven COPPA VPC Contracts

Review backend COPPA and Verifiable Parental Consent work for complete, frontend-compatible, and legally honest contracts.

## Required Checks

1. **Consent lifecycle**
   - Verify under-13 student creation no longer auto-stamps final consent before verification.
   - Check pending, verified, grandfathered, revoked, expired, and archived states are explicit.
   - Confirm idempotency for double-clicked confirm links and repeated resend/revoke requests.
   - Verify stale tokens are invalidated when resend updates the request timestamp.

2. **API contract completeness**
   - Check endpoint names, methods, request shapes, response shapes, error shapes, and status codes.
   - Require explicit fields for `parent_consent_verified`, `coppa_consent_at`, `coppa_consent_method`, and `coppa_consent_requested_at` when raw fields are part of the contract.
   - Require gated endpoint errors to include a stable `{ error: "coppa_consent_required" }` code plus any agreed student id/message fields.
   - Flag contract drift from frontend asks in `docs/Security/COPPA_PHASE_2_MASTER_PLAN.md`.

3. **Mailer and redirect safety**
   - Verify consent email links are signed, time-limited, single-use or effectively invalidated on resend, and not guessable.
   - Check backend confirm endpoints redirect only to configured frontend URLs.
   - Ensure mailer templates do not expose unnecessary child PII and include the agreed data-practice notice owner/status.

4. **Activation gates**
   - Check enrollment, booking, simple booking, student login, and student portal access all enforce pending-consent gates consistently.
   - Verify grandfathered students pass gates and pending students fail gates.
   - Ensure parent support paths for resend/revoke remain available while gated.

5. **Audit, retention, and operations**
   - Check consent changes have durable evidence through PaperTrail/UserConsent/explicit audit records as defined by the phase.
   - Verify expiry jobs are bounded and safe.
   - Flag backfills without dry-run counts, safety caps, and rollback/abort behavior.

## Evidence Standard

Every finding must include:

- Exact file, endpoint, or document section.
- Which VPC lifecycle or frontend contract element is missing or unsafe.
- Which phase or acceptance criterion it blocks.
- Concrete fix and RSpec/manual QA proof.

Do not require frontend implementation inside backend-only contract work; instead identify the required frontend handoff.
