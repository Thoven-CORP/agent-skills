---
name: outreach-followup
description: Batch-create Gmail draft replies for stale cold investor outreach. Queries the Notion Angel CRM using the Follow-up Date formula (Stage=Outreach Sent + Intro Path=Cold + Email valid + Delivery Method not LinkedIn + Follow-up Date past today), self-heals empty Last Contact fields from Gmail thread state, and drafts Touch 1 (soft bump) at Day +6 or Touch 3 (door-open close) at Day +20 as a reply in the original thread. Drafts only — Andres reviews and sends manually. Use when user says "follow-up batch", "draft follow-ups", "send follow-up batch", or "outreach followup".
---

# Cold Outreach Follow-Up Automation

> **Canonical CRM contract:** `Fundraising/automation-playbook/crm-contract.md` (wins on conflict). Schema validate against the **data source** `170c7a68-…`, not the database object. Stage is a **select**. Gmail via `gws` / `mcp__gws__gmail`.

Generates Gmail draft replies for stale cold investor outreach using Template 4 (Touch 1, soft bump) and Template 6 (Touch 3, door-open close) from `Fundraising/outreach-templates.md`. Touch 2 is deliberately skipped — pure bump → door-close cadence per Andres's decision 2026-04-27.

**Cadence:** Day 0 cold send → Day +6 Touch 1 → Day +20 Touch 3 → Pass.

**Output: drafts only.** Never sends. Andres opens Gmail Drafts, reviews each, and sends manually.

Manual invocation only. Cloud routine path was evaluated 2026-04-27 and ruled out — `mcp__claude_ai_Gmail__create_draft` does not support `threadId`, so a remote agent cannot create threaded reply drafts. Local-only `mcp__gws__gmail` is the load-bearing dependency.

Default batch cap: **25 prospects per run** (hard limit, prevents first-run flood).

## MCP server used

**`mcp__gws__gmail`** for ALL Gmail reads + writes. It supports `threadId` for draft creation and is the only Gmail MCP that produces correctly-threaded reply drafts. Do NOT mix with `mcp__claude_ai_Gmail__*` — use one source of truth.

`mcp__claude_ai_Notion__*` for all CRM reads + writes.

---

## Phase 0: Startup validation (FAIL LOUDLY)

Before any work, confirm the right CRM:

1. Database ID **MUST** be `4fa3de45-9f8a-4ae2-8a1a-dc404fac5f24`. Hard-coded. Do not accept any other.
2. Validate schema via the **data source** `170c7a68-da78-46be-bf70-9ba05ed47334` (Notion API `2025-09-03`: the database object returns **zero** properties). Confirm properties named `Stage`, `Intro Path`, `Email`, `Last Contact`, `Follow-up Date`, `Notes`, `Name`. If any are missing, ABORT with error: "CRM schema mismatch — wrong database or schema drift."
3. Stage field type is **select** (patch with `{"select":{"name":"..."}}`), not status.

---

## Phase 0.5: Pause-flag check

If the file `/Users/andresmartinez/Vaults/Executive-Assistant/Fundraising/followup-paused.flag` exists, write a "paused" run report (with timestamp + the flag's contents) and exit cleanly. Do not draft anything.

This is the kill switch for holidays / frozen pipelines.

---

## Phase 1: Query CRM for eligible prospects

Use the **paginated** `mcp__notion__API-query-data-source` on data source `170c7a68-da78-46be-bf70-9ba05ed47334` (`page_size: 100`, loop while `has_more == true` passing the prior `next_cursor` as `start_cursor`, accumulate ALL pages). Do **NOT** use `mcp__claude_ai_Notion__notion-query-data-sources` in rows or sql mode (rows mode returns at most 100 rows with no cursor; it replaced the retired `notion-query-database-view`, which had the same cap), which is what made the same prospects resurface and hid everything past row 100. This is the paginated pattern the `angel-outreach-loop` skill standardizes on (see its canonical query contract).

Filter (apply client-side after accumulating all pages):

- `Stage` = "Outreach Sent"
- `Intro Path` = "Cold"
- `Delivery Method` ≠ "LinkedIn" (keep `Email` and blank — exclude LinkedIn-channel records). A LinkedIn send has no Gmail thread by definition, so it can never be threaded into an email follow-up; including it only produces false `no_thread_found` noise. This is the structured channel signal that the send skills now write atomically at send time (`linkedin-assisted-send` sets `Delivery Method = LinkedIn`).
- `Email` matches `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` (real email format only — excludes "LinkedIn DM only" / contact-form text)
- `Follow-up Date <= today` **OR** `Last Contact` is empty (the empty case triggers self-heal in Phase 2)

Sort: `Follow-up Date` ascending (oldest stragglers surface first), then by `Name`.

Cap to first 25 results. Anything past 25 rolls to tomorrow's run automatically (Notion query naturally re-surfaces them since their Follow-up Date stays past-due).

For each prospect, capture: `name`, `email`, `last_contact`, `followup_date`, `notes`, `notion_page_id`, `linkedin`.

---

## Phase 2: Self-heal Last Contact (one-time per record)

For each eligible prospect where `Last Contact` is empty:

1. Search Gmail via `mcp__gws__gmail`: `resource: "users.threads"`, `method: "list"`, `params: {userId: "me", q: "to:{prospect.email} from:andres@thoven.co", maxResults: 5}`
2. If 0 threads, skip (falls into `no_thread_found` in Phase 3)
3. Pick the **most-recent** thread (highest `internalDate` in returned list)
4. Fetch full thread: `mcp__gws__gmail` `users.threads.get` with `format: "full"`
5. Find the **earliest** message where `From: andres@thoven.co` — that's the original outreach
6. Take its `Date` header (parse to ISO YYYY-MM-DD)
7. Write to Notion: `mcp__claude_ai_Notion__notion-update-page` on `notion_page_id`, set `Last Contact` to that date

This makes the `Follow-up Date` formula recalculate.

**After backfill, three outcomes per record:**

| New Follow-up Date | Action |
|---|---|
| In the past or today | Stays in this run, proceed to Phase 3 |
| In the future | Drop from this run. Add to report under `backfilled_not_yet_eligible` (proves self-heal worked) |
| Still empty after write | Notion API error. Add to `errors[]`, retry next run. |

**Important:** Do NOT update `Last Contact` after creating a draft. Only on actual send (manual). This is intentional — keeps the nag signal honest.

---

## Phase 3: Per-prospect skip checks (in order)

For each remaining eligible prospect, run these checks. First failed check = skip + log.

### 3a. Do-not-draft markers (CRM Notes field)

If `Notes` contains `[DO NOT DRAFT]` or `[COMPETITOR]` (case-insensitive), skip with reason `do_not_draft`. Per `feedback_competitor_risk_flag.md`.

### 3b. Find Gmail thread

`mcp__gws__gmail` `users.threads.list` with `q: "to:{email} from:andres@thoven.co"`. Take **most-recent** thread. If 0 results, skip with reason `no_thread_found`.

### 3c. Reply check

Fetch full thread. If ANY message has `sender != andres@thoven.co` AND `sender != mailer-daemon@googlemail.com`, the prospect (or someone) replied. Skip with reason `replied_but_crm_stale`.

**Then WRITE it — do not only report it.** Set `Stage` = `Replied` and prepend to `Next Action`:

```
[followup {YYYY-MM-DD}] Reply received {reply date}: "{verbatim snippet, ≤300 chars}"
```

Re-fetch the page to confirm both landed, exactly as the `angel-outreach-loop` Phase C contract requires. Skip the write only when `Stage` is already `Replied` or is terminal (`Meeting Booked` / `Meeting Done` / `Committed` / `Passed`) — never regress a stage a human moved forward.

Detecting a reply and writing nothing durable is what left Jonas Tempel parked at `Ready to Send` for three weeks after he answered "I'd love to learn more about your project." The system knew and told no one. Specced 2026-05-04 (Task 2.2), built 2026-07-28.

### 3d. Bounce check

If ANY message has `sender == mailer-daemon@googlemail.com` or `postmaster@`, the email bounced. Skip with reason `bounced_email_invalid`.

**Then WRITE it:** set `Email Verified` = `Bounced` (verified write) and surface the prospect in the report. Do **not** auto-Pass — a bounce means the address is wrong, not that the prospect is dead; Andres decides whether to hunt a new address or close them out. Specced 2026-05-04 (Task 2.3), built 2026-07-28.

### 3e. Idempotency — Gmail draft already exists in thread

Use `mcp__gws__gmail` `users.drafts.list` with `params: {userId: "me", q: "in:drafts"}` (or thread-scoped equivalent). For any draft message in the same `threadId` that was created by `andres@thoven.co`, skip with reason `draft_already_exists`.

### 3f. Staleness cap (skip the canned bump for cold-storage threads)

Compute days-since-**original**-send (the earliest `andres@thoven.co` message in the thread, not the most recent). If **> 90 days**, skip with reason `too_stale_to_bump` regardless of message count.

A "just bumping this in case it got buried" reply months later reads as out-of-touch, and the original email's traction/framing is stale by then. To re-engage, send a fresh current-traction draft (often already on the CRM card) or mark Passed — do **not** send the frozen bump. Still backfill `Last Contact` in Phase 2 so the CRM is honest. Per Andres 2026-05-22 (Rajen Sheth, 310-day thread); cutoff set at 90 days. See `feedback_followup_staleness_cap.md`.

**Stale underlying draft:** do not draft a follow-up on top of a rotted draft. This 90-day original-send cap is the follow-up analog of the canonical > 30-day `Drafted At` draft-staleness rule (see `angel-outreach-loop`'s canonical date-stamp contract): once the underlying outreach draft is stale, re-draft with current traction rather than bumping the old thread.

### 3g. Touch level routing

Count messages where `sender == andres@thoven.co`. Compute days-since-last-andres-msg.

| Andres msg count | Days since last | Action |
|---|---|---|
| 1 | ≥ 6 | Proceed to Phase 4 — draft **Touch 1** (Template 4) |
| 1 | < 6 | Skip with reason `too_soon_for_touch_1` |
| 2 | ≥ 14 | Proceed to Phase 4 — draft **Touch 3** (Template 6, door-open close) |
| 2 | < 14 | Skip with reason `too_soon_for_touch_3` |
| 3+ | any | Skip with reason `final_touch_already_sent`. Append a `[followup {date}] Touch 3 sent {date}, no reply — candidate for Passed` line to `Next Action` (verified write) so the flag survives the run report. Do **not** auto-Pass; Andres decides. Specced 2026-05-04 (Task 2.4), built 2026-07-28. |

### 3h. Eligible — proceed to draft creation

---

## Phase 4: Build draft (Touch 1 or Touch 3)

Pick the body based on Phase 3f routing.

### First-name extraction

```python
def first_name(full_name):
    HONORIFICS = {"Dr.", "Dr", "Mr.", "Mr", "Ms.", "Ms", "Mrs.", "Mrs", "Prof.", "Prof"}
    tokens = full_name.strip().split()
    if tokens and tokens[0] in HONORIFICS:
        tokens = tokens[1:]
    return tokens[0] if tokens else full_name
```

### Body — Touch 1 (Template 4, frozen)

```
Hi {first_name},

I hope everything is well! Just wanted to bump this back up in case it got buried. I know you're busy — even 15 minutes would be valuable on my end.

Thanks in advance!

Best,
Andres Martinez
```

### Body — Touch 3 (Template 6, frozen)

```
Hi {first_name},

Wanted to give it one more bump in case it got buried. I'll leave it here for now. If anything around music education, tutoring, or the future of education comes up down the road, would love to connect.

Thanks either way!

Best,
Andres Martinez
```

### Get original Message-ID + Subject

`mcp__gws__gmail` `users.messages.get` with `format: "full"` on the **earliest Andres-sent message** in the thread. Extract:
- `Message-ID` header (the `<...>` string)
- `Subject` header (decoded plain string)

### Build RFC822

```python
import base64, email.message

msg = email.message.EmailMessage()
msg["To"] = prospect.email
msg["From"] = "Andres Martinez <andres@thoven.co>"
subj = original_subject if original_subject.lower().startswith("re:") else f"Re: {original_subject}"
msg["Subject"] = subj
msg["In-Reply-To"] = original_message_id
msg["References"] = original_message_id
msg.set_content(body_text)

raw = base64.urlsafe_b64encode(msg.as_bytes()).decode().rstrip("=")
```

### Create draft

```
mcp__gws__gmail
  resource: "users.drafts"
  method: "create"
  params: { userId: "me" }
  body: {
    message: {
      threadId: <thread.id>,
      raw: <base64url RFC822>
    }
  }
```

Capture returned `draft.id` and `draft.message.id` for the report.

If creation errors, log under `errors[]` with prospect name + error message. Continue with next prospect.

---

## Phase 5: Run report (ALWAYS WRITE)

Path: `Fundraising/followup-runs/YYYY-MM-DD-batch-N.md`

Determine `N` by listing existing files matching today's date in that dir and incrementing. First run of the day is N=1.

**Always write the report — even on 0-draft days.** A 0-draft report is observability: it proves the system ran. If reports stop appearing for 3+ days, something is broken.

### Report template

```markdown
# Follow-Up Batch Run — {YYYY-MM-DD} #{N}

**Trigger:** {scheduled / manual}
**Drafts created:** {count}
**Skipped:** {count}
**Errors:** {count}
**Last Contact backfilled:** {count}

---

## Drafts created (review in Gmail Drafts)

| Name | Email | Original sent | Touch | Draft ID |
|---|---|---|---|---|
| ... | ... | ... | 1 | ... |

(empty section header preserved if 0 drafts)

---

## Skipped — replied but CRM stale (UPDATE NOTION STAGE)

| Name | Email | Last reply date | Notion page |

---

## Skipped — bounced email (FIX EMAIL OR MARK PASSED)

| Name | Email | Notion page |

---

## Skipped — final touch already sent (mark Passed in CRM)

Already received Touch 1 + Touch 3. Time to close them out.

| Name | Email | Touch 3 sent date | Notion page |

---

## Skipped — too soon (will be eligible later)

| Name | Email | Days since last Andres msg | Eligible on |

---

## Skipped — draft already exists

| Name | Email | Existing draft ID |

---

## Skipped — do not draft (Notes flag)

| Name | Email | Marker found |

---

## Skipped — no Gmail thread found

| Name | Email | Notion page |

---

## Last Contact backfilled this run (now eligible later)

Records that had empty Last Contact, were backfilled from Gmail, and the new Follow-up Date is in the future. Proves self-heal worked.

| Name | Backfilled to | New Follow-up Date |

---

## Next eligible (informational)

| Name | Eligible on |

---

## Errors

(if any)

---

## Verification

If 0 drafts: this is normal on most days. Confirm next-eligible list is accurate.
If drafts created: open Gmail → Drafts. Each should appear in the correct existing thread (NOT as a new top-level message).
```

---

## Final summary to user (chat output, manual mode only)

After the batch completes in interactive mode, send:

```
Batch run complete.
Drafts: {N} | Skipped: {count} | Errors: {count}
- Replied (Stage auto-set to Replied): {n_replied}
- Touch 3 pending review: {n_touch3}
- Draft already exists: {n_dup}
- Bounced (Email Verified set to Bounced): {n_bounced}
- No thread: {n_nothread}

Last Contact backfilled: {n_backfilled} records

Report: Fundraising/followup-runs/{YYYY-MM-DD}-batch-{N}.md
Open Gmail Drafts to review.

{N} drafts staged in Gmail. After sending, run:
  python3 Fundraising/automation-playbook/reconcile_sent.py --refresh   # dry run
  python3 Fundraising/automation-playbook/reconcile_sent.py --apply
```

In scheduled mode, no chat output — the report file is the only artifact.

**Why the reconciler line is mandatory.** This skill creates drafts and never sends, which is correct — but a draft sent by hand from the Gmail Drafts folder reaches no CRM write path at all. `reconcile_sent.py` reads Gmail as the source of truth and writes back `Stage` / `Delivery Method` / `Last Contact`, so the cadence stays honest no matter how the message left. Print the command; don't rely on anyone remembering it.

---

## Constants

| Name | Value |
|---|---|
| CRM Database ID | `4fa3de45-9f8a-4ae2-8a1a-dc404fac5f24` |
| CRM View ID | `4df68df7-63f3-40f8-b75e-f9a648ed2e68` |
| Pause flag path | `/Users/andresmartinez/Vaults/Executive-Assistant/Fundraising/followup-paused.flag` |
| Run report dir | `/Users/andresmartinez/Vaults/Executive-Assistant/Fundraising/followup-runs/` |
| Sender address | `andres@thoven.co` |
| Per-run cap | 25 prospects |

---

## Out of scope

- Sending emails (drafts only)
- Touch 2 (skipped per design)
- Updating `Last Contact` after drafting — that happens on send, via `reconcile_sent.py`.
  (Stage **is** now written for the replied / bounced / final-touch cases; see Phase 3c–3g.)
- LinkedIn DM follow-ups for prospects without valid emails
- New cold outreach to "Researched" prospects (use `prospect-finder` + `angel-outreach-loop`)
- Marking prospects as Passed after Touch 3 with no reply (manual; flagged in `Next Action` and surfaced in the report under `final_touch_already_sent`)
- Reconciling sends the skill didn't make — that's `reconcile_sent.py` (Gmail) and `reconcile_linkedin.py` (LinkedIn)

## References

- `references/templates.md` — frozen Touch 1 body
- `Fundraising/outreach-templates.md` — full template library
- Memory: `feedback_cold_outreach_followup_voice.md` — voice rules
- Memory: `feedback_competitor_risk_flag.md` — `[DO NOT DRAFT]` / `[COMPETITOR]` semantics
- Plan: `~/.claude/plans/create-a-plan-in-witty-quill.md` — full architecture rationale
