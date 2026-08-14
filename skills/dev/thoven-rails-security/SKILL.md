---
name: thoven-rails-security
description: Review Thoven Rails backend security changes for dual auth, authorization, serializers, parameter filtering, logging, webhooks, ActionCable, rate limiting, and sensitive-data exposure. Use with Warden for backend security work.
---

# Thoven Rails Security

Review backend changes for exploitable Rails security issues and COPPA-relevant data exposure. Focus on reachable behavior, not style.

## Required Checks

1. **Dual authentication boundaries**
   - Flag any mix-up between `User`/`Profile` auth and `Student` auth.
   - Verify parent access to students goes through guardianships or equivalent ownership checks.
   - Verify student endpoints use `authenticate_student!` and never trust parent/user tokens.
   - Flag any body-param user or student id that replaces `current_user`, `current_student`, or ownership-scoped lookup.

2. **Authorization and object access**
   - Flag IDOR risks in controllers, services, channels, jobs, and serializers.
   - Verify teacher, parent, admin, and student scopes are explicit and stable.
   - Check soft-deleted records honor `archived_at` or `.active` where user-visible.

3. **Sensitive data exposure**
   - Flag serializers, JSON responses, logs, Sentry breadcrumbs, mailers, and errors that expose child PII, guardian contact data, tokens, temp passwords, payment identifiers, or raw third-party payloads.
   - Verify parameter filters cover sensitive and COPPA-relevant fields such as date of birth, names, address, phone, tokens, OAuth credentials, and temp passwords.

4. **Webhook, third-party, and token safety**
   - Flag missing signature verification for Stripe, Twilio, SendGrid, Daily, Google, and other inbound webhooks.
   - Check JWT/JTI validation is not bypassed by manual decode helpers.
   - Flag open redirects and unvalidated callback URLs.

5. **ActionCable and realtime security**
   - Check allowed origins, forgery protection, `/cable?token=` handling, channel authorization, and payload minimization.
   - Verify any channel or notification payload changes preserve frontend contract compatibility unless explicitly versioned.

6. **Rate limiting and abuse controls**
   - Check auth, password reset/change, COPPA confirm/resend/revoke, booking/reschedule/cancel, and webhook-like endpoints for Rack::Attack or equivalent abuse limits.
   - Flag new unauthenticated endpoints without rate limits, audit trail, and safe error shapes.

## Evidence Standard

Every finding must include:

- Exact file and line when possible.
- Production-reachable path or attacker/user scenario.
- Security property violated.
- Concrete fix and deterministic test that would close it.

Do not report style-only issues or speculative risks without a reachable path.
