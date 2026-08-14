---
name: testing-runbook-generator
description: Generate comprehensive testing documentation (Testing Runbook + QA Checklist) from feature specs. Use when feature spec/PRD is complete and ready to plan testing strategy.
---

# Testing Runbook Generator

Generate comprehensive testing documentation for new features by reading the PRD/spec and creating:
1. **Testing Runbook** - 6-phase workflow (automated tests → production monitoring)
2. **QA Checklist** - Detailed test cases covering functional, edge cases, analytics, cross-platform

## When to Use

✅ **Use when:**
- Feature spec/PRD is complete
- Ready to plan testing strategy
- Moving from implementation → testing phase

❌ **Don't use when:**
- Spec doesn't exist yet (use `/technical-spec-generator` first)
- Simple bug fix (doesn't need full testing workflow)
- Feature already has testing docs

---

## Workflow

### Phase 1: Locate & Read Spec

**Ask user:** "What's the feature name? I'll look for the spec in `PRD's & Technical Specs/`"

**Search for spec:**
- Look in `PRD's & Technical Specs/[Feature Name] Spec.md`
- If not found, ask user for exact filename

**Extract from spec:**
- Success metrics (completion rates, targets)
- Analytics events (Mixpanel, Meta Pixel, etc.)
- User flows (primary, supporting, edge cases)
- Key capabilities
- Error handling requirements
- Performance constraints
- Systems involved (email, payments, notifications)

---

### Phase 2: Gather Testing Context

Use `AskUserQuestion` with multiple choice:

**Testing Environment:**
- Staging URL (e.g., `staging.thoven.com`)
- Feature flag name (e.g., `get_matched_ai_flow_enabled`)

**Test Accounts & Data:**
- Do test accounts exist? (Yes / No / Need to create)
- Test data needed? (e.g., "Seed 5 teachers in NYC for Piano")

**Analytics Setup:**
- Analytics platforms used? (Mixpanel / Google Analytics / Meta Pixel / Other)
- Dashboard setup needed? (Yes / No)

**Special Considerations:**
- Critical edge cases beyond spec?
- Known integration risks? (APIs, payment processors, email)

---

### Phase 3: Check for Notion Epic (Optional)

**Ask:** "Is there a Notion Dev Tracker task for this feature?"

**If yes:**
- Get Notion page ID or URL
- Read epic for implementation status
- Extract testing notes or blockers

**If no:** Skip Notion integration

---

### Phase 4: Generate Testing Runbook

**Read template:** `assets/testing-runbook-template.md`

**Customize template by replacing placeholders:**
- `[Feature Name]` - From Phase 1
- `[feature_flag_name]` - From Phase 2
- `[staging_url]` - From Phase 2
- `[Primary user flow]` - Extract from spec, convert to checklist
- `[N Mixpanel events]` - Count from spec
- `[N Meta Pixel events]` - Count from spec
- `[Key edge cases]` - Extract from spec
- `[Success metrics]` - Extract from spec (e.g., "60% completion, 40% click rate")
- `[Metric thresholds]` - Extract from spec
- `[Analytics platforms]` - From Phase 2
- `[Date]` - Current date (YYYY-MM-DD)

**Save to:** `PRD's & Technical Specs/[Feature Name] - Testing Runbook.md`

---

### Phase 5: Generate QA Checklist

**Read template:** `assets/qa-checklist-template.md`

**Customize template by replacing placeholders:**
- `[Feature Name]` - From Phase 1
- `[feature description]` - Brief summary from spec
- `[staging_url]` - From Phase 2
- `[feature_flag_name]` - From Phase 2
- `[Primary flow steps]` - Extract from spec, each step = checkbox
- `[Supporting flows]` - Extract from spec
- `[Edge cases]` - Extract from spec with expected behaviors
- `[Platform] Events` - List all analytics events from spec
- `[Performance constraints]` - Extract from spec (API response times, load times)
- `[Email/notification details]` - Extract if feature sends emails
- `[A/B test details]` - Extract if feature has A/B tests
- `[Security requirements]` - Extract from spec
- `[Date]` - Current date (YYYY-MM-DD)

**Sections to include/exclude based on feature:**
- Email Testing: Only if feature sends emails
- A/B Test Validation: Only if feature has A/B tests
- Performance Testing: Always include
- Accessibility: Always include
- Security: Always include

**Save to:** `PRD's & Technical Specs/[Feature Name] - QA Checklist.md`

---

### Phase 6: Update Notion Dev Tracker (Optional)

**If Notion epic exists from Phase 3:**

Fetch the page, then use `insert_content_after` to add testing workflow section after "Development Workflow" section (or at end of content before ## PRD).

**Section to add:**

```markdown
## Testing & Deployment Workflow

**Testing Runbook:** `PRD's & Technical Specs/[Feature Name] - Testing Runbook.md`
**QA Checklist:** `PRD's & Technical Specs/[Feature Name] - QA Checklist.md`

### Phase 1: Automated Tests (5-10 min)
[Brief summary with pass criteria]

### Phase 2: Developer Smoke Test (15-30 min)
[Happy path + analytics check + edge case]

### Phase 3: QA Testing (4-7 hours)
[Priority 1: Critical flows, Priority 2: Edge cases, Priority 3: Cross-platform]

### Phase 4: Staging Validation (30 min)
[Business logic + UX + analytics readiness]

### Phase 5: Production Rollout (3 days)
[10% → 50% → 100% with rollback triggers]

### Phase 6: Post-Launch Monitoring (2 weeks)
[Daily checks + success criteria]
```

Update page properties:
- `date:Last Updated:start` - Today's date
- `date:Last Updated:is_datetime` - 0

---

### Phase 7: Confirm Completion

**Show user:**
> "Generated:
> 1. Testing Runbook: `[filename]`
> 2. QA Checklist: `[filename]`
> [If Notion] 3. Updated Notion Dev Tracker
>
> Documents saved successfully!"

---

## Key Principles

1. **Extract, don't invent** - Pull details from spec, don't fabricate test cases
2. **Consistent structure** - Always 6 phases (runbook), 11 sections (QA checklist)
3. **Feature-specific** - Replace ALL placeholders with actual values
4. **Complete coverage** - Functional, analytics, edge cases, cross-platform, accessibility
5. **Actionable** - Every item should be clear checkbox or command

---

## Integration with Other Skills

**Workflow:**
1. `/technical-spec-generator` → Creates feature spec
2. [Implementation happens]
3. `/testing-runbook-generator` → Creates testing docs ← YOU ARE HERE
4. QA executes using generated docs
5. `/memory` → Update minor_memory with testing outcomes

---

## Templates

This skill uses two template files in `assets/`:
- `testing-runbook-template.md` - 6-phase testing workflow template
- `qa-checklist-template.md` - Comprehensive QA checklist template

Templates contain placeholders (e.g., `[Feature Name]`, `[staging_url]`) that get replaced with values extracted from the spec and user input.
