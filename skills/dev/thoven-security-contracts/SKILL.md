---
name: thoven-security-contracts
description: Review Thoven security contract docs and cross-repo frontend/backend surfaces for VPC, COPPA gates, ActionCable/CD-8, and parent-facing compliance drift. Use with Warden during Phase 1 contract work.
---

# Thoven Security Contracts

Review contract and integration changes that affect security-sensitive frontend/backend coordination. Focus on whether the contract is complete enough to build safely later.

## Required Checks

1. **VPC contract completeness**
   - Check endpoint names, HTTP methods, request shapes, response shapes, error shapes, and rate-limit behavior.
   - Require explicit handling for `parent_consent_verified`, raw VPC fields, `coppa_consent_required`, resend, revoke, confirm success, and confirm error flows.
   - Flag contracts that omit whether `parent_consent_ack` is accepted, ignored, deprecated, or removed.

2. **COPPA UX and legal-copy consistency**
   - Flag docs or copy that imply a shipped VPC implementation when the current phase is contract-only.
   - Check that privacy honesty copy has a re-update condition for the later VPC implementation.
   - Flag missing ownership for legal/disclosure text when it blocks implementation.

3. **ActionCable/CD-8 contract completeness**
   - Check frontend origin list, deployed Replit origin, production apex origin, local dev origin, and any preview/staging origin.
   - Require explicit token transport decisions for `/cable?token=`, auth failure behavior, reconnect behavior, and whether cookie-based auth is in scope.
   - Require channel and payload compatibility coverage for messaging, teacher notifications, parent booking, and booking notifications.

4. **Cross-repo dependency clarity**
   - Flag docs that label backend-owned work as frontend-only or frontend-owned work as backend-only.
   - Flag implementation steps that should be contract-first because they can break runtime behavior across repos.

5. **Issue slicing readiness**
   - Check whether future `$to-issues` slices are vertical, independently verifiable, and clear about HITL versus AFK.
   - Flag slices that are too broad, mix unrelated risk domains, or lack acceptance criteria.

## Evidence Standard

Every finding must include:

- Exact document or code path.
- Missing or contradictory contract element.
- Which later phase or user story it blocks.
- A concrete wording, contract row, or acceptance criterion that would close the gap.

Do not ask for implementation inside a contract-only phase unless the document claims implementation is already in scope.
