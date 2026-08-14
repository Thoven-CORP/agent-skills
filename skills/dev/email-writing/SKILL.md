---
name: email-writing
description: Write and send emails in Andres's voice. Use when user says "write email", "draft email", "email to [person]", or needs to compose professional emails. Supports investors, advisors, and partners. Can compose directly in Gmail using browser automation.
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

### Step 4: Draft Email

**CRITICAL**: Before drafting, READ the email language guide to initialize context:

```
Read: /Users/andresmartinez/Vaults/Executive Assistant/Agent Knowledge/Guides/email-language-guide.md
```

Use the guide to understand:
- Tone and structure for the identified audience type
- Example emails to match Andres's style
- Greeting/closing conventions
- Key contacts and their context

After reading the guide, draft the email matching the appropriate tone and referencing relevant examples.

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
