---
name: call-prep
description: Prepare for networking calls with founders, investors, advisors, or partners. Use when user says "prep for call with [person]", "call with [company] tomorrow", or "help me prepare for meeting". Automates research, creates structured prep document, and emails it.
---

# Call Prep

Comprehensive preparation workflow for networking and business calls.

## Trigger Phrases

- "prep for call with [person]"
- "call with [company/person] tomorrow"
- "help me prepare for meeting with [person]"
- "meeting prep for [person]"

## Workflow

### Step 1: Gather Context

Ask the user:

> **Call Prep Questions:**
> 1. Who is the call with? (Name, company, role)
> 2. When is the call? (Date/time)
> 3. What's the primary goal? (networking, fundraising intel, partnership, learning, recruiting)
> 4. How did you connect? (warm intro, cold outreach, event, mutual connection)
> 5. What do you already know about them?

If user provides limited info, proceed with what you have and research the rest.

### Step 2: Research

Use WebSearch to gather:
- Current role, background, recent news
- Company product, stage, traction, funding
- Podcast/interview appearances (use youtube-transcript skill if found)
- Personal story or founding journey

### Step 3: Create Prep Document

Save to: `Meetings/YYYY-MM-DD - [Person Name] Call Prep.md`

Include:
- Call objective and success metrics
- Quick background on person/company
- Your elevator pitch and "why" story
- 8-10 prioritized must-ask questions (with strategic reasoning)
- Prepared answers to likely questions they'll ask
- Call flow with timing
- Post-call action plan with follow-up email template
- Key reminders (DO/DON'T lists)
- Research sources

### Step 4: Email the Prep Doc

Send to `keri@thoven.co`:

**Subject:** `Call Prep: [Person Name] ([Company]) - [Date]`

**Body:** Brief summary with key highlights, questions, and link to full doc.

Use email-writing skill + browser automation to send via Gmail.

### Step 5: Confirm Completion

Summarize what was created and ask if user needs refinements.

## Call Type Customization

**Founder Networking:** Focus on growth, product decisions, fundraising journey. Emphasize peer learning.

**Investor Calls:** Focus on portfolio, investment thesis. Prepare traction metrics.

**Advisor Calls:** Focus on specific problem. Ask tactical questions about expertise.

**Partner/Vendor:** Focus on mutual value. Define clear next steps.

## Tools Used

- WebSearch (research)
- youtube-transcript (podcast insights)
- Write (prep document)
- email-writing (send prep email)
- Chrome browser tools (Gmail automation)
