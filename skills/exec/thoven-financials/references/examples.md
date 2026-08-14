# Thoven Financials - Usage Examples

## Adding Expenses

### Example 1: Ad Spend
```
User: "Add $150 Meta Ads spend for lead gen campaign"

Process:
1. Parse: category="Meta Ads", amount=150, description="lead gen campaign"
2. Call: add_expense("Meta Ads", 150, "lead gen campaign")
3. Response:
   ✓ Added $150 to Meta Ads
   Meta Ads spend this month: $150 / $500 budget (30%)
   Cash balance: $2,950
```

### Example 2: SaaS Subscription
```
User: "Log $200 Claude Code payment"

Process:
1. Parse: category="Claude Code", amount=200
2. Call: add_expense("Claude Code", 200, "Monthly subscription")
3. Response:
   ✓ Added $200 to Claude Code
   Claude Code spend this month: $200 / $200 budget (100%) ⚠️
   Cash balance: $2,750
```

### Example 3: Travel Expense
```
User: "Record $500 MTNA conference registration"

Process:
1. Parse: category="Travel", amount=500, description="MTNA conference registration"
2. Call: add_expense("Travel", 500, "MTNA conference registration")
3. Response:
   ✓ Added $500 to Travel
   Travel spend this month: $500 / $0 budget ⚠️ OVER BUDGET
   Cash balance: $2,250
```

## Adding Funding

### Example 1: Parent Funding
```
User: "Received $1000 from Keri's dad"

Process:
1. Parse: source="Keri's dad", amount=1000
2. Call: add_funding("Keri's dad", 1000)
3. Response:
   ✓ Added funding: $1,000 from Keri's dad
   Old balance: $2,250
   New balance: $3,250
   Runway: 2.7 months
```

### Example 2: General Funding
```
User: "Log funding $500"

Process:
1. Parse: source="Funding", amount=500
2. Call: add_funding("Funding", 500, "General funding")
3. Response:
   ✓ Added funding: $500
   New balance: $3,750
```

## Checking Status

### Example 1: Burn Rate Check
```
User: "What's my burn rate?"

Process:
1. Call: get_status()
2. Response:
   Cash Balance: $3,100
   Avg Monthly Burn: $1,200
   Runway: 2.6 months
```

### Example 2: Budget Review
```
User: "Show budget vs actual"

Process:
1. Call: get_budget_status()
2. Response:
   Budget vs Actual (Month-to-Date)

   Meta Ads:      $150 / $500  (30%)
   Google Ads:    $0 / $375    (0%)
   Claude Code:   $200 / $200  (100%) ⚠️
   Metabase:      $100 / $100  (100%) ⚠️
   Canva:         $67 / $67    (100%) ⚠️
   Contractors:   $0 / $225    (0%)
   Travel:        $500 / $0    OVER BUDGET ⚠️
   Other SaaS:    $0 / $0      (-)

   Total: $1,017 / $1,467 (69%)
```

### Example 3: Quick Balance Check
```
User: "Current cash balance?"

Process:
1. Call: get_status()
2. Response:
   Cash Balance: $3,100
```

## Managing Budgets

### Example 1: Update Existing Budget
```
User: "Update Meta Ads budget to $600"

Process:
1. Parse: category="Meta Ads", new_amount=600
2. Call: update_budget("Meta Ads", 600)
3. Response:
   ✓ Updated Meta Ads budget: $500 → $600
```

### Example 2: Adjust for New Initiative
```
User: "Increase Google Ads budget to $500"

Process:
1. Parse: category="Google Ads", new_amount=500
2. Call: update_budget("Google Ads", 500)
3. Response:
   ✓ Updated Google Ads budget: $375 → $500
   Note: This increases total monthly budget to $1,592
```

## Multi-Step Workflows

### Example: Weekly Expense Logging Session
```
User: "Let me log this week's expenses"
Claude: "Ready. What expenses do you want to log?"

User: "Add $50 Meta Ads"
Claude: ✓ Added $50 to Meta Ads. Cash: $3,050

User: "Add $67 Canva"
Claude: ✓ Added $67 to Canva. Cash: $2,983

User: "Add $200 Claude Code"
Claude: ✓ Added $200 to Claude Code. Cash: $2,783

User: "Show budget vs actual"
Claude: [Displays full budget status]
```

### Example: Monthly Review
```
User: "Show me a financial summary"

Process:
1. Call: get_status() + get_budget_status()
2. Response:
   === Financial Summary ===

   Cash: $2,783
   Monthly Burn: $1,200
   Runway: 2.3 months ⚠️

   Top Spend Categories:
   1. Meta Ads: $500 / $500 (100%)
   2. Contractors: $225 / $225 (100%)
   3. Claude Code: $200 / $200 (100%)

   Recommendation: Need additional funding in next 60 days
```

## Error Handling

### Example 1: Invalid Category
```
User: "Add $100 Office Supplies"

Process:
1. Parse: category="Office Supplies" (not in budget)
2. Error: ValueError
3. Response:
   ✗ Unknown category: Office Supplies
   Valid categories: Meta Ads, Google Ads, Claude Code, Metabase, Canva, Contractors, Travel, Other SaaS

   Did you mean "Other SaaS"?
```

### Example 2: Negative Amount
```
User: "Add -$50 Meta Ads"

Process:
1. Parse: amount=-50 (invalid)
2. Error: ValueError
3. Response:
   ✗ Amount must be positive
```

## Natural Language Variations

The skill should handle various phrasings:

### Adding Expenses
- "Add $X to [category]"
- "Log $X [category] expense"
- "Record $X for [category]"
- "Spent $X on [category]"
- "$X [category] payment"

### Adding Funding
- "Received $X from [source]"
- "Got $X from [source]"
- "Log funding $X"
- "[source] sent $X"
- "Add $X funding"

### Status Checks
- "What's my runway?"
- "Show burn rate"
- "Current balance?"
- "How much cash do I have?"
- "Budget status"
- "Financial summary"

### Budget Updates
- "Update [category] budget to $X"
- "Change [category] budget to $X"
- "Set [category] budget at $X"
- "Increase/decrease [category] budget to $X"
