---
name: email-writing
description: Write and send emails in Andres's voice. Use when user says "write email", "draft email", "email to [person]", or needs to compose professional emails. Supports investors, advisors and partners, and product-update emails to Thoven teachers and families (use Andres's earlier update emails as the template for tone). Can compose directly in Gmail using browser automation.
---

# Email Writing

Write emails matching Andres's tone and style, organized by audience type.

## Trigger Phrases

- "write email", "draft email", "send email"
- "email to [person/group]"
- "investor update", "bi-weekly update"
- "reach out to [advisor]"
- "respond to [partner]"

## Workflow

### Step 1: Identify Audience Type

Ask if not clear:

> "Who is this email for?"
> 1. **Investors** - Bi-weekly updates, formal progress reports
> 2. **Advisors** - 1:1 outreach, seeking feedback/advice
> 3. **Partners/Vendors** - Professional outreach, scheduling, logistics

### Step 2: Identify Recipient

Get the specific recipient(s):
- Name(s)
- Email address(es) if sending via Gmail

### Step 3: Gather Content Context

**Critical step** - Ask before drafting:

> "What should this email cover? Give me a blurb, draft, or goal/context."

**Audience-specific prompts:**

| Audience | Ask About |
|----------|-----------|
| Investors | Progress highlights? Key metrics? Challenges? Next steps? |
| Advisors | What question/feedback are you seeking? What context do they need? |
| Partners | What's the purpose? What action do you want from them? |

**Product-update email** (to Thoven teachers or families): write from what changed, not from what Thoven does.
1. Find the last update email in Gmail and its send date.
2. Read both repos' CHANGELOGs (`~/thoven/frontend/CHANGELOG.md`, `~/thoven/backend/CHANGELOG.md`) since that date.
3. Lead with the biggest user-visible change, and describe each feature by what the user can now do.
4. Illustrate with screenshots of the current shipped UI.

Done when every feature in the draft traces to a CHANGELOG line since the last update.

### Step 4: Draft Email

**CRITICAL**: Before drafting, READ the email language guide to initialize context:

```
Read: /Users/andresmartinez/Vaults/Executive-Assistant/Agent Knowledge/Guides/email-language-guide.md
```

Use the guide to understand:
- Tone and structure for the identified audience type
- Example emails to match Andres's style
- Greeting/closing conventions
- Key contacts and their context

After reading the guide, draft the email matching the appropriate tone and referencing relevant examples.

**Rules that hold for every email (they win over any older guide example):**
- **No em dashes.** Use a comma, a period, or two sentences. Scan the finished draft for "—" and "--" before presenting it.
- **"connect", never "chat"** ("I'd love to connect", not "I'd love to chat").
- **Scheduling replies propose one specific open slot.** Find it with Google Calendar `suggest_time` (`mcp__claude_ai_Google_Calendar__suggest_time`) and offer that one time, for example "Does Tuesday at 2:00 PM ET work?". Never send a list of availability windows: the 2026-08-05 list-of-times email to Jonas Tempel went unanswered. When a booking link fails (the 2026-06-24 Calendly error), fall back to the same one-slot proposal.
- **Warm replies to an advisor or partner** open by referencing the last call or conversation. Cut hard metrics, role titles, recaps of what they built, location references, "one-on-one", and any line that could read as snark. (2026-07-16, 07-17 and 07-18, when Acton Main needed two rounds of live edits.)
- **Biweekly updates** (investor, teacher or parent) follow [references/biweekly-update.md](references/biweekly-update.md). Read it before drafting any biweekly.

### Step 5: Review & Refine

Present the draft and ask:

> "Here's the draft. Would you like me to adjust the tone, length, or content?"

Refine as needed.

### Step 6: Send (Optional - Browser Automation)

If user wants to send via Gmail:

**Setup:**
1. Navigate to `mail.google.com/mail/u/0/#inbox` (go to inbox first)
2. Click "Compose" button to open a **fresh** compose window
3. Use `read_page` with `filter: interactive` to get element references

**Fill fields using `form_input` tool (NOT click + type):**
1. Find the To field (textbox with recipients)
2. Use `form_input` with `ref` and `value` to set the email address
3. Find the Subject field
4. Use `form_input` to set the subject
5. Find the Message Body field
6. Use `form_input` to set the body content

**Verify before sending:**
1. Take a screenshot
2. Confirm To, Subject, and Body are correct
3. Ask user: "Email is ready in Gmail. Should I send it?"
4. Only click Send after explicit confirmation

**Common issues:**
- If compose opens from a thread, close it and click Compose from inbox
- Always verify the To field shows only the intended recipient
- If "X more" appears in To field, there may be extra recipients - check and remove

## Quick Reference

| Audience | Greeting | Tone | Close |
|----------|----------|------|-------|
| Investors | "Hi everyone," | Formal, structured, metrics | "Best, Andres Martinez, Co-Founder & CEO" |
| Advisors | "Hi [Name]," | Warm, inquisitive | "Best," |
| Partners | "Hi [Name]," | Professional, efficient | "Best, Andres Martinez" |

## Browser Tools

When sending via Gmail, use `mcp__claude-in-chrome__*` tools:
- `navigate` to go to Gmail inbox
- `read_page` with `filter: interactive` to get element refs
- `form_input` with `ref` and `value` to fill fields (preferred over click + type)
- `computer` with `action: left_click` and `ref` to click buttons
- `computer` with `action: screenshot` to verify before sending
- Always confirm with user before clicking Send
