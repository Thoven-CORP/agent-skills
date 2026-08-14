---
name: apollo-enrich
description: Batch-find verified work emails for prospects via Apollo's people bulk_match API, then log them to the Notion Angel CRM and route misses to LinkedIn. Use when the user says "enrich emails", "find emails for the ready-to-send angels", "apollo enrich", "batch find emails", "/apollo-enrich", or when angel-outreach-loop has Ready-to-Send prospects with no email that need a deliverable address before an email send. Reads name + company + LinkedIn URL, returns found/locked/unmatched per prospect. Apollo is the accurate source; never fabricate or pattern-guess an address.
---

# Apollo Enrich

Turn a batch of prospects (name + company, ideally + LinkedIn URL) into verified work emails via Apollo's `bulk_match` API, write the hits to the Notion Angel CRM, and leave the misses on LinkedIn. One Apollo call handles up to 10 people.

## When to use

- An angel-outreach batch is at **Ready to Send** but LinkedIn-only (no email), and the user wants to send by email instead.
- Any time the user asks to find/verify emails for a list of CRM prospects.

Do NOT use this to invent emails. Apollo returns a real match or nothing. A miss stays a miss → LinkedIn.

## Prerequisite: the API key (one-time)

The script reads the key **only** from the `APOLLO_API_KEY` env var. It is never a CLI argument and never printed.

1. The user generates a key in Apollo: Settings → Integrations → API.
2. Store it out of shell history / git. Recommended: macOS Keychain.
   ```bash
   # one-time store (user runs this; key not in your transcript)
   security add-generic-password -a "$USER" -s APOLLO_API_KEY -w
   ```
3. Load it into the env for the run (this does NOT print the key):
   ```bash
   export APOLLO_API_KEY="$(security find-generic-password -a "$USER" -s APOLLO_API_KEY -w)"
   ```
If the key isn't set, the script exits with a clear message — surface it and ask the user to set it. Never ask the user to paste the key into chat.

## Workflow

### 1. Build the batch JSON

One object per prospect. Include `page_id` (the Notion page id) so you can map results back. `linkedin_url` is the strongest match key — always include it when the CRM has it. `domain` and `organization_name` sharply improve match rate.

```json
[
  {"page_id":"<notion-id>","name":"Mark Angel","organization_name":"Amira Learning","domain":"amiralearning.com","linkedin_url":"https://www.linkedin.com/in/mark-angel-amira"}
]
```

Write it to a scratch file (e.g. `/tmp/apollo_batch.json`).

### 2. Run the enrichment

```bash
export APOLLO_API_KEY="$(security find-generic-password -a "$USER" -s APOLLO_API_KEY -w)"
python3 ~/.claude/skills/apollo-enrich/scripts/apollo_enrich.py /tmp/apollo_batch.json
```

Add `--reveal-personal` only if the user explicitly wants personal emails as a fallback (costs credits; Apollo withholds personal emails for GDPR-region people). Default is work email only.

Output is a JSON array, one row per input, each with `status`:
- **`found`** — `email` is a real deliverable address. Use it.
- **`locked`** — Apollo matched the person but the email is gated (`email_not_unlocked@…`). Treat as no email → LinkedIn. (Usually means out of credits or the contact is restricted.)
- **`unmatched`** — Apollo has no record. → LinkedIn.
- **`error`** — API/network problem (see `note`). Fix and retry; do not guess.

### 3. Present results, then write to CRM (verified write)

Show the user a found/missed table before writing. For each `found`:
- Patch the CRM page: set `Email` = the found address, `Delivery Method` = `Email`.
- Append a Notes stamp: `--- APOLLO-ENRICH {date} --- email {addr} (status: {email_status}) via bulk_match`.
- Re-fetch and confirm the write landed (verified-write protocol).

For each `locked` / `unmatched`: leave `Delivery Method` = `LinkedIn`, append a Notes stamp noting Apollo had no deliverable email. Do not change the draft.

### 4. Hand back

Report: N found (with addresses), N locked, N unmatched, and which stay LinkedIn. If this run feeds an email send, the found set is now ready for the user's send-approval step — never auto-send (that gate belongs to the calling workflow, e.g. angel-outreach-loop Phase C).

## Guardrails

- **Never fabricate or pattern-guess an email.** Only `status: found` addresses are real. `locked`/`unmatched` → LinkedIn, full stop.
- **Key never in args/logs/chat.** Env var only.
- **Verified writes only** to the CRM; re-fetch to confirm.
- **Date-stamp contract — stay in your lane.** The CRM has two date columns owned by other skills: `Drafted At` (draft stamp, owned by the drafter, `angel-outreach-loop`) and `Last Contact` (send stamp, owned by the sender, `angel-outreach-loop` / `linkedin-assisted-send`). Apollo-enrich touches ONLY `Email`, `Delivery Method`, and `Notes` — it NEVER writes `Stage`, `Last Contact`, or `Drafted At`.
- **Credits:** each matched reveal consumes ~1 Apollo credit; `bulk_match` is capped at 10 people/call and 600 calls/hour. The script already chunks to 10 and paces.
