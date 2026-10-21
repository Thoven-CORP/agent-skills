# Claim record

```
## Sentry
org: thoven-gy
issue: <id or URL>

## Issue
<short title>

## Sha
fe: <fe-version sha>
be: <health revision sha>

## Prod version
RESULT: PASS
<paste factory-version-read prod stdout>

## Approval
Andres approved resolve on <date>

## Claim lock
factory-claim-lock:<actor> <utc>
assign-if-unassigned: <actor>
ttl_hours: <from RULES.md claim_lock_hours>
```
