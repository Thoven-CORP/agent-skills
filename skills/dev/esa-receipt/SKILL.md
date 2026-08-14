---
name: esa-receipt
description: Generate a branded Thoven payment receipt (PDF) for an ESA / scholarship marketplace order — Utah Fits All via Odyssey or any future ESA channel. Use this whenever Andres pastes an ESA/Odyssey/scholarship order detail, mentions a new ESA payment, needs a receipt number to save in a vendor portal, or asks for a receipt for a parent/student order — even if he doesn't say "receipt" explicitly (e.g. "we got a new Utah payment", "I need to fill out the receipt field by Friday"). Works generic (family not on Thoven yet, no teacher) or enriched (pulls live enrollment: teacher, class, credits, intro call).
---

# ESA Receipt Generator

Produce a branded payment receipt (HTML + PDF) for an ESA marketplace order and a
receipt number for the vendor portal's "Receipt Number" field. Built from the two
real cases: Questereit (enriched, orders 1380406/07) and Osmond (generic, THV-TS5GF4R).

## Core rules (why they exist)

- **Never fabricate.** ESA receipts are compliance documents a state program may audit.
  Anything not confirmed by the order detail or prod data is left blank/"To be assigned"
  and flagged — the script enforces this, don't work around it.
- **PII stays out of git.** The skill + script are committed; family data is not. Every
  per-run config and output goes to `.scratch/esa-receipts/` (gitignored). Never put a
  family's name/email/address in this skill, the script, or any committed file.
- **PAID badge only when the channel has actually paid.** A pasted "Order Detail" from
  the portal after payment counts; a quote or pending order does not — ask if unclear.
- **Receipt numbers are traceable, not invented:** explicit `receipt_no` >
  `THV-<numeric order ID>` > `THV-<last 7 chars of the line-item ULID>`. If only a ULID
  is visible, mention that a numeric order ID from the portal URL is a one-field swap.
- Vendor block is locked in the script: Thoven CORP, **1555 Plasentia Ave** (the `s` is
  correct — do not "fix" it), billing andres@thoven.co, support thovie@thoven.co.

## Workflow

### 1. Parse the order detail
From the pasted portal data collect: parent (name/email/phone/address), student,
instrument, offering title + cadence, amount, quantity, and every identifier shown
(order ID, line item ID, offer ID, SKU). Ask for whatever is missing rather than guessing.
Identify the ESA channel — it sets `program` and `paid_label` (reference values below).

### 2. Check prod (read-only) to pick the mode
```bash
set -a && source .env && set +a && psql "$PROD_DATABASE_URL" -c "
SELECT p.id, p.first_name, p.last_name, u.email FROM profiles p
JOIN users u ON u.id = p.user_id WHERE lower(u.email) = '<parent email>';" -c "
SELECT id, first_name, last_name, archived_at FROM students
WHERE lower(first_name) = '<first>' AND lower(last_name) = '<last>';"
```
- Student exists **and** has an active enrollment with a teacher → **enriched** mode.
- No account / no teacher selected yet → **generic** mode. Don't wait for enrollment —
  vendor portals have receipt deadlines; a generic receipt now beats a perfect one late.

### 3. Write the config
Save to `.scratch/esa-receipts/<RECEIPT_NO>.config.json`:

```json
{
  "receipt_no": null,
  "program": "Utah Fits All Scholarship — Odyssey Marketplace",
  "program_short": "Utah Fits All Scholarship via the Odyssey marketplace",
  "paid_label": "PAID · Utah Fits All Scholarship (ESA)",
  "order": { "order_id": null, "line_item_id": "01KW...", "offer_id": "14a8...",
             "sku": "THV-DRUMS-BEG", "ordered_on": null },
  "esa_holder": { "name": "...", "email": "...", "phone": "(801) 555-5555",
                  "address": "street, city, ST zip" },
  "student": { "first_name": "...", "last_name": "...", "location": "City, ST" },
  "instrument": "Drums",
  "line": { "title": "Drums Lessons — Beginner", "cadence": "4 × 30-minute sessions / month",
            "amount_cents": 21000, "qty_label": "1 month" },
  "enrich": false,
  "enrollment_note": null,
  "out_dir": ".scratch/esa-receipts"
}
```
Format phone numbers `(801) 635-5785`; amounts are integer cents. Leave unknown fields
`null` — the script omits them rather than inventing values.

### 4. Generate
```bash
# generic:
ruby .claude/skills/esa-receipt/scripts/generate_receipt.rb .scratch/esa-receipts/<NO>.config.json
# enriched (must be rails runner against prod, read-only):
set -a && source .env && set +a && DATABASE_URL="$PROD_DATABASE_URL" bundle exec rails runner \
  .claude/skills/esa-receipt/scripts/generate_receipt.rb .scratch/esa-receipts/<NO>.config.json
```
The script writes `<RECEIPT_NO>.html` + `.pdf` and prints any enrichment fields it could
not find. Enriched mode pulls: teacher + class, Thoven account holder (may differ from
the ESA order holder — e.g. Questereit: father on Odyssey, mother on Thoven), wallet
credits loaded, enrollment date, first intro/session slot.

### 5. Verify, then hand over
Read the PDF (the Read tool renders it) and check: receipt number, parties, amount,
instructor line matches the mode, no unintentionally blank fields, single page.
Then give Andres: the receipt number to paste into the portal, the PDF path, and any
missing-field flags. Remind him the portal step is Confirmed → Receipt Added.

## After the receipt (human-gated — do NOT execute unprompted)
Receipt done ≠ order fulfilled. Mention as next steps when relevant, but each needs
Andres's explicit go-ahead: load wallet credits, apply the locked ESA pricing model
($210 order → Thoven keeps $10 flat, $200 teacher pool, 5 lessons at the $40
platform-average rate, bonus lesson for the family), teacher payouts
($40/delivered lesson via AdminTeacherPayoutService), and parent/teacher emails
(drafts only — Andres sends manually).

## Channel reference
| Channel | Portal | program / paid_label |
|---|---|---|
| Utah Fits All (Odyssey) | ufa-vendors.withodyssey.com | values in the example above |
| New channel | — | derive from the portal's own naming; add a row here after first use |

Prior art (real PII, gitignored): `.scratch/odyssey-receipts/` — original one-off
generators, the Questereit follow-up doc (pricing-model rationale), and shipped receipts.
