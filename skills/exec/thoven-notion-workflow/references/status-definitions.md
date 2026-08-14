# Status Definitions - Dev Tracker Workflow

Quick reference for status meanings and progression.

## Status Pipeline

```
📋 Spec & Planning → 🔧 Backend Dev → 🎨 Frontend Dev → 🤖 Phase 1: Automated Tests → 🧪 Phase 2-3: QA & Staging → 🚀 Phase 4-5: Production Rollout → ✅ Phase 6: Post-Launch Monitoring → 🎯 Completed
```

## When to Move Forward

| From Status | Move When | Typical Duration |
|-------------|-----------|------------------|
| 📋 Spec & Planning | Spec complete + Notion task created with checklists | 1-3 days |
| 🔧 Backend Dev | All backend checklists ✓ + code committed | 2-5 days |
| 🎨 Frontend Dev | All frontend checklists ✓ + code committed | 2-5 days |
| 🤖 Phase 1: Automated | All tests pass (npm test, rspec, lint, type-check) | 5-10 min |
| 🧪 Phase 2-3: QA | Zero P0 blockers + stakeholder approval | 1-2 days |
| 🚀 Phase 4-5: Production | 100% rollout + metrics stable for 48 hours | 3 days |
| ✅ Phase 6: Monitoring | 2 weeks complete + success criteria met | 2 weeks |

## Phase-Specific Notes

### 📋 Spec & Planning
- Write technical spec
- Create Notion task with this workflow
- Generate prompts for implementation

### 🔧 Backend Dev
- Build APIs, database, business logic
- Skip if feature is frontend-only
- Commit code when done

### 🎨 Frontend Dev
- Build UI, components, flows
- Skip if feature is backend-only
- Ensure mobile-responsive

### 🤖 Phase 1: Automated Tests
- Run all tests (frontend + backend)
- DO NOT move forward if any tests fail
- Fix bugs, re-run until ALL pass

### 🧪 Phase 2-3: QA & Staging
- Smoke test (15-30 min)
- Full QA (4-7 hours)
- Stakeholder approval
- DO NOT move forward if P0 blockers exist

### 🚀 Phase 4-5: Production Rollout
- Gradual rollout: 10% → 50% → 100%
- Monitor metrics at each stage
- Rollback if error rate >10%

### ✅ Phase 6: Post-Launch Monitoring
- Daily metrics checks for 2 weeks
- Validate success criteria
- Document learnings

### 🎯 Completed
- Feature shipped and validated
- Archive for reference
