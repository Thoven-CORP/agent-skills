---
name: linkedin-assisted-send
description: >-
  Sends the Thoven angel CRM's "Ready to Send" outreach drafts over LinkedIn (InMail or connected DM), one prospect at a time, with composer-based dedup, character-exact paste-verify, a mutual-connection / warm-intro check, InMail-credit budgeting, verified Notion writes, and a supervisor log. Use when the user asks to send the ready-to-send angels on LinkedIn, run or resume a LinkedIn send batch, or invokes /linkedin-assisted-send. Runs assisted (user clicks send) by default, or autonomous (Claude clicks) only with explicit per-run authorization — never auto-sends otherwise. Manual-only since 2026-10-22: angel work is dormant (Grok Angel owns it); invoke by name.
disable-model-invocation: true
---

# LinkedIn Assisted Send

Delivers the angel CRM's `Ready to Send` drafts over LinkedIn via the **claude-in-chrome** browser tools, then records the outcome. The drafts already exist (written by `angel-outreach-loop`); this skill only sends and logs.

> **Canonical CRM contract:** `Fundraising/automation-playbook/crm-contract.md`. **Mandatory:** write `Fundraising/linkedin-send-runs/YYYY-MM-DD-*.md` the same day as any send (the 2026-08-06 batch was missing a log until backfilled 2026-08-10 — `reconcile_linkedin` went blind).

**Default to ASSISTED.** Sending investor messages is irreversible. Switch to autonomous (Claude clicks send) only on Andres's explicit in-session "yes" — see Send modes.

CRM: data source `170c7a68-da78-46be-bf70-9ba05ed47334` (DB `4fa3de45-9f8a-4ae2-8a1a-dc404fac5f24`). Property IDs, fallback chains, and recovery steps are in `references/field-notes.md`.

## How a run flows (goal-driven)

A batch send is long, interruptible, and freeze-prone, so wrap it in **goal mode** — that's what makes it persist across pauses, Chrome freezes, and even a new session, and auto-stop when finished.

1. **Curate scope.** Query `Ready to Send`; pin the exact page IDs in scope (exclude prior-run leftovers).
2. **Confirm mode + flag mutuals.** Confirm assisted-vs-autonomous (default assisted) and surface the up-front picture (mutual connections, candidate emails, InMail-credit count) so Andres pulls warm-intro candidates before anything sends.
3. **Set the goal.** Run `/goal run drive the linkedin-assisted-send skill for the <N> pinned Ready-to-Send angels until none of them remain at Stage "Ready to Send"`. This installs a Stop-hook on that condition — it keeps pulling you back to "work the send queue" and auto-clears when met. (Skip the goal only for a tiny ad-hoc send of 1–2.)
4. **Execute the per-prospect loop** (below) until the condition holds. Verify with a final query; the goal auto-clears. Do **not** tell Andres to `/goal clear` on success.

**Goal-mode caveat (learned 2026-05-21):** in **assisted** mode the Stop-hook fires every time you stop to wait for Andres's click — that is expected, not a failure. Hold at the human gate and restate status briefly; **never auto-send to satisfy the hook.** The hook's value is persistence/anti-drift during the autonomous stretch. If Andres pauses the run before completion, tell him he can `/goal clear` to stop the hook (that's the one time clearing is right).

## Run-start (once)

1. **Confirm scope.** Default = current `Ready to Send` batch. Pin to specific page IDs so leftovers from prior runs aren't pulled in.
2. **Stop Kimi:** `~/.kimi-webbridge/bin/kimi-webbridge stop` (collides with claude-in-chrome on CDP).
3. **Browser up:** `tabs_context_mcp` first; create a fresh tab; open `linkedin.com/feed` and confirm it's logged in as Andres (no auth wall). **Keep Chrome in the foreground the whole run** — backgrounded Chrome throttles and freezes screenshots (this halted the 2026-05-21 run).
4. **Pull drafts + URLs.** Query the scoped pages' `Outreach Draft` (use `filter_properties`; the payload can exceed the token cap and spill to a file). Run `scripts/parse_crm_drafts.py <results.json>` to get, per prospect: paste-body (Subject + footer stripped), LinkedIn URL (from the `[Sources: …]` footer, NOT the structured field), email, and contact note. (Mutual connections aren't in the CRM — read them off the live profile during the loop.)
5. **Report the up-front picture before sending:** per prospect — mutual connection? candidate email? draft-staleness (`Drafted At`)? — plus the live InMail-credit count. This is where Andres pulls warm-intro candidates and you flag credit exposure and rotted drafts.

**Draft-staleness gate (`Drafted At`).** Pull each scoped page's `Drafted At` (the drafter's stamp; `angel-outreach-loop` writes it at Ready to Send). Per the canonical date-stamp contract, no skill sends a Ready-to-Send draft whose `Drafted At` is empty or more than 30 days old. For any such prospect, **flag it to Andres and do NOT send** — surface it for re-draft (route back to `angel-outreach-loop`) rather than shipping a draft with stale traction numbers. Fresh-drafted cards (`Drafted At` ≤ 30 days) send normally.

**Middle-paragraph diff gate (every draft, regardless of age).** A fresh `Drafted At` does not mean a current middle paragraph: on 2026-06-01 drafts still said "100+" after the number moved to 120, on 2026-06-10 May-21 drafts went out with old numbers, and on 2026-07-27 the school-pilot clause was added mid-batch. At run start, read the canonical middle from `angel-outreach-loop/references/standard-template.md` § Standard Middle Paragraph and confirm its five variables (teachers, applying, pilot students, raise, committed) with Andres in session. Then diff each draft's middle paragraph against that confirmed text, word for word. Any mismatch: fix the middle in the paste body and in the CRM `Outreach Draft` (verified write) before sending, and say which drafts changed. Never send a middle you have not diffed.

## Per-prospect loop

Copy this checklist per prospect and check off as you go (it prevents skipping a gate on a long run):

```
{Name}: [ ] identity verified  [ ] mutual-check (pause if mutuals)  [ ] composer open + dedup
        [ ] channel resolved  [ ] middle diffed vs canonical  [ ] pre-filled (transform applied)  [ ] paste-verified (body + subject)
        [ ] sent + corroborated top-of-inbox  [ ] Notion write  [ ] logged
```

For each prospect, in score order:

1. **Navigate + verify identity** (name/company match the opener). If the footer URL 404s → stale-URL fallback chain (`references/field-notes.md`). If this card was flagged stale by the `Drafted At` gate (empty or > 30 days), do NOT send — surface for re-draft and move on.
2. **Mutual-connection / warm-intro check — BEFORE sending.** Read the "X is a mutual connection" / "followed by" line. **If mutuals exist, do NOT cold-send — surface to Andres** for a warm-intro decision (warm intro > cold InMail, saves a credit). A mutual is a lead, not a confirmed intro; Andres decides. *(Ben Kornell was cold-InMailed despite warm paths, 2026-05-21 — don't repeat it.)*
3. **Open composer (Message button) + dedup.** If a prior Andres→prospect thread exists → already-sent → `Outreach Sent`, log, **do not resend**. Use the composer, NEVER inbox scroll (inbox lazy-loads ~10 threads and hides the rest).
4. **Resolve channel:** connected → free DM (no Subject field); 2nd/3rd-degree w/ Message button → **InMail** (Subject field, costs a credit); **Connect-only** (only "Connect", no Message) → can't InMail even on Premium → email fallback or `On Hold`.
5. **Pre-fill + paste transform.** Use the middle paragraph that passed the diff gate. CRM draft is an email. **InMail:** canonical subject in Subject field; body = `Hi {First},` → `Andres Martinez`, dropping the `Subject:` line and `[Sources…]` footer. **DM:** no subject, same body. **Type line breaks with `shift+Return` — a raw Enter SENDS.**
6. **Paste-verify (copy-error guard).** Screenshot; confirm body matches the draft character-for-character AND the Subject field is populated. The window can resize mid-type and shift coordinates → a missed Subject click; re-click + retype if empty.
7. **Send.** Assisted: Andres clicks. Autonomous: click send yourself.
8. **Corroborate + record.** Confirm the thread is top-of-inbox with a timestamp → verified Notion write (below) → append to supervisor log.

## Send modes

- **Assisted (default):** you dedup + open + pre-fill + paste-verify; Andres clicks send.
- **Graduate:** after the first ~3 verify clean, ask Andres — keep clicking each, or authorize you to click for the rest. Autonomous needs that **explicit in-session yes** (overrides never-auto-send for this batch only). Dedup + paste-verify still run on every one.
- **Email is a separate channel.** Never auto-send email even under autonomous LinkedIn authorization — create a **Gmail draft** for Andres to send.
- **Email-send dedup (MANDATORY before any Gmail draft).** LinkedIn dedup uses the composer; email has no equivalent guard, so check it explicitly. Before creating a Gmail draft, run `mcp__claude_ai_Gmail__search_threads` with `in:sent <recipient-email>` **AND** `in:sent "<Full Name>"`. Both. Every time.

  **The name search is not optional.** It used to read "if the address is uncertain" — but "uncertain" was never a queryable fact, so it never fired, and a cold opener nearly went out to Greg Bybee, who had already replied declining a year earlier. The CRM held `greg@avela.org`; his real address is `greg.bybee@avela.org`. One wrong character silently defeated the entire guard.

  `Email Verified` now makes uncertainty queryable. When it is `Candidate` (a pattern-derived address nobody confirmed) or `Unknown`, the surname search is the only guard that works — treat an address-only clean result as no result at all. Even faster: run `python3 Fundraising/automation-playbook/reconcile_sent.py` first, which dedups the whole CRM by address, display name, and address-variant in one pass.

  If a prior outreach to that person exists → **do NOT draft a new cold email.** Flag it to Andres ("already emailed {name} on {date}") and either skip or treat as a follow-up via the `outreach-followup` skill. Without this, the same prospect gets cold-emailed twice (Shailu Tipparaju got two cold emails a day apart, 2026-05-21 + 2026-05-22). One batched `in:sent` query covering all recipients up front is the efficient form.

## Verified Notion write (per sent prospect)

**ONE atomic patch**, written only after the thread is corroborated top-of-inbox: `Stage` → `Outreach Sent`; `Delivery Method` → `LinkedIn`; `date:Last Contact:start` → the send date (the run day — corroborated by the timestamped top-of-inbox thread); structured `LinkedIn` URL set (additive — never overwrite a non-null one). The patch echo is the confirmation. Leave `Notes` untouched when it holds long batch-enrich blocks (re-pasting risks transcription errors; Stage + supervisor log are the audit trail).

**INVARIANT: never flip `Stage → Outreach Sent` without `Delivery Method` + `Last Contact` in the same patch.** Channel-blind, undated sends are exactly what made the CRM drift (LinkedIn sends were invisible to the channel filter and had no date) — `Delivery Method = LinkedIn` is what tells `outreach-followup` to skip the record instead of false-flagging it `no_thread_found`. Only flip to `Outreach Sent` after the thread is confirmed sent.

**Disposition vocabulary (real CRM stages — there is no "Skipped"):**
- Sent / dedup-hit → `Outreach Sent` + `Delivery Method = LinkedIn` (+ `Last Contact` = send date; on a dedup-hit, the existing thread's date if determinable, else the run day)
- No reachable channel (Connect-only + no email; unresolvable profile) → `On Hold` + `Hold Until` (+21d) + reason in `Next Action`
- Email fallback drafted → Gmail draft created (only after the email-send dedup check passes); `On Hold` + note "Gmail draft created, Andres to send → flip to Outreach Sent on send"
- Email-send dedup hit (already emailed before) → no new draft; `Outreach Sent` left as-is (or route to `outreach-followup`); note "already emailed {date}, skipped to avoid double-send"

## InMail credit budgeting

Credits are the binding constraint (~26 on Premium; one per non-connection). Spend on **LinkedIn-ONLY prospects first**; route prospects who have a candidate email to the **email fallback** when credits run low, so no reachable LinkedIn-only prospect gets stranded. Read the live count from each composer ("Use 1 of N InMail credits").

## Completion

Done when none of the scoped pages remain at `Stage = Ready to Send` (all `Outreach Sent` or `On Hold`). Verify with a final query; out-of-scope leftovers staying at Ready to Send is expected.

## Supervisor log

Append-only at `Fundraising/linkedin-send-runs/<date>-run.md`: run header, one block per prospect (channel, dedup, paste-verify, corroboration, disposition), and a lessons section.

## On replies

When Andres reports a reply, set that page's `Stage` → `Replied` and capture the reply (preview verbatim if that's all you saw — don't invent the full text) + a next action in `Next Action`.

See `references/field-notes.md` for Notion property IDs, the stale-URL fallback chain, browser-freeze recovery, and the full gotcha list.
