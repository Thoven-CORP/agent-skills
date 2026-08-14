---
name: thoven-notion-workflow
description: Automate Thoven's development workflow. Create customized Notion Dev Tracker tasks from specs, generate Replit handoff prompts for phase transitions, and update task status automatically. Use when user says "Create Notion task for [Feature]", "Just finished [phase]", "Moving to [next phase]", or "Set up workflow for [Feature]".
---

# Thoven Notion Workflow

Automates the complete development workflow connecting Obsidian (prompts) → Notion (status tracking) → Replit (execution).

## When to Use This Skill

**Scenario A: Initial Setup**
- "Create Notion task for [Feature Name]"
- "Set up workflow for Get Matched AI Flow"
- "Prepare [Feature] for development"

**Scenario B: Phase Transitions**
- "Just finished backend work"
- "Moving to Phase 1 tests"
- "Completed frontend, ready for testing"
- "Backend dev done, what's next?"

## What This Skill Does

### Scenario A: Create Notion Task (Initial Setup)

1. **Parse technical spec** to identify feature components:
   - Frontend work (UI, components, flows)
   - Backend work (APIs, database, business logic)
   - Analytics (events, tracking)
   - Email (templates, service integration)

2. **Generate customized task content** with only needed checklists:
   - Skip frontend section if no frontend work
   - Skip backend section if no backend work
   - Skip analytics if no tracking needed
   - Skip email if no email integration

3. **Create Notion task** with:
   - Title: Feature name
   - Status: "📋 Spec & Planning"
   - Epic: Extracted from spec
   - Priority: Extracted from spec
   - Link to PRD: Path to spec file
   - Body: Customized checklist template

### Scenario B: Phase Transition (Reality Check)

1. **Generate Replit handoff prompt** that asks Replit Claude Code to:
   - Review what was actually done vs planned
   - Identify checklist items to REMOVE (work not needed)
   - Identify checklist items to ADD (new work discovered)
   - Update the Notion task to reflect reality

2. **Automatically update Notion task**:
   - Check off completed items
   - Remove unnecessary items
   - Add new items discovered
   - Move Status to next phase

## Usage

### Scenario A: Create Notion Task

```
User: "Create Notion task for Get Matched AI Flow"

Claude:
1. Looks for spec at: PRD's & Technical Specs/Get Matched AI Flow Spec.md
2. Parses spec to identify components:
   - has_frontend: true
   - has_backend: true
   - has_analytics: true
   - has_email: true
3. Generates customized task content with all sections
4. Creates Notion task in Dev Tracker
5. Returns task URL and summary
```

### Scenario B: Phase Transition

```
User: "Just finished backend work"

Claude:
1. Identifies current status: "🔧 Backend Dev"
2. Identifies next status: "🎨 Frontend Dev"
3. Generates Replit handoff prompt:
   - Reviews actual backend work done
   - Asks Replit to add/remove checklist items
   - Prepares for frontend phase
4. Automatically moves Notion task to "🎨 Frontend Dev"
5. Returns handoff prompt to give to Replit
```

## Implementation Steps

### For Scenario A (Create Notion Task)

1. **Find the spec file**:
```python
spec_path = f"PRD's & Technical Specs/{feature_name} Spec.md"
```

2. **Parse the spec**:
```bash
python3 scripts/parse_spec.py "{spec_path}"
```

Returns JSON with:
```json
{
  "feature_name": "Get Matched AI Flow",
  "epic": "Integration",
  "priority": "High",
  "has_frontend": true,
  "has_backend": true,
  "has_analytics": true,
  "has_email": true,
  "spec_path": "..."
}
```

3. **Build task content**:
```bash
python3 scripts/notion_task_builder.py '{JSON from step 2}'
```

Returns customized markdown checklist.

4. **Create Notion task** using `notion-workspace-executor` skill:
```
- parent: Dev Tracker database
- properties:
  - Feature / Item: {feature_name}
  - Epic: {epic}
  - Status: "📋 Spec & Planning"
  - Priority: {priority}
  - Link to PRD: {spec_path}
- content: {task content from step 3}
```

### For Scenario B (Phase Transition)

1. **Detect current phase** from user's statement:
   - "just finished backend" → current: "🔧 Backend Dev"
   - "completed frontend" → current: "🎨 Frontend Dev"
   - "tests passing" → current: "🤖 Phase 1: Automated Tests"

2. **Look up next status** in progression map:
```python
STATUS_PROGRESSION = {
    "📋 Spec & Planning": "🔧 Backend Dev",
    "🔧 Backend Dev": "🎨 Frontend Dev",
    "🎨 Frontend Dev": "🤖 Phase 1: Automated Tests",
    "🤖 Phase 1: Automated Tests": "🧪 Phase 2-3: QA & Staging",
    "🧪 Phase 2-3: QA & Staging": "🚀 Phase 4-5: Production Rollout",
    "🚀 Phase 4-5: Production Rollout": "✅ Phase 6: Post-Launch Monitoring",
    "✅ Phase 6: Post-Launch Monitoring": "🎯 Completed",
}
```

3. **Find Notion task** for the feature:
```
Use notion-find or notion-search to get task URL
```

4. **Generate handoff prompt**:
```bash
python3 scripts/replit_handoff_generator.py "{current_status}" "{feature_name}" "{notion_task_url}"
```

Returns detailed prompt for Replit Claude Code.

5. **Update Notion task Status**:
```
Use notion-workspace-executor to update Status property to next status
```

6. **Return handoff prompt** to user:
"Here's the handoff prompt for Replit Claude Code. Copy this and give it to Replit to complete the reality check and prepare for {next_status}."

## Status Progression Map

```
📋 Spec & Planning
  ↓
🔧 Backend Dev
  ↓
🎨 Frontend Dev
  ↓
🤖 Phase 1: Automated Tests
  ↓
🧪 Phase 2-3: QA & Staging
  ↓
🚀 Phase 4-5: Production Rollout
  ↓
✅ Phase 6: Post-Launch Monitoring
  ↓
🎯 Completed
```

## Key Files

### Scripts
- `parse_spec.py` - Extract feature info from technical spec
- `notion_task_builder.py` - Generate customized task content
- `replit_handoff_generator.py` - Create phase transition prompts

### References
- See `references/` folder for workflow guide and status definitions

## Integration with Other Tools

**Notion MCP Tools:**
- `notion-create-page` - Create Dev Tracker tasks
- `notion-find` - Find existing tasks
- `notion-update-page` - Update task Status

**Obsidian Vault:**
- Reads specs from: `PRD's & Technical Specs/`
- References workflow guide: `Agent Knowledge/Guides/notion-dev-tracker-workflow.md`

**Replit Claude Code:**
- Receives handoff prompts for each phase
- Updates Notion task based on reality checks

## Error Handling

**Spec file not found:**
- Ask user for spec file path
- Or offer to create task manually without parsing

**Notion task not found:**
- Search by feature name
- Or ask user for Notion task URL

**Invalid status transition:**
- Show status progression map
- Ask user to confirm current and next status

## Examples

### Example 1: Frontend-Only Feature

```
User: "Create Notion task for Profile Picture Uploader"

Spec has:
- has_frontend: true
- has_backend: false (reusing existing upload API)

Generated task includes:
✅ 📋 Spec & Planning section
✅ 🎨 Frontend Dev section
✅ 🤖 Phase 1: Automated Tests (frontend tests only)
✅ 🧪 Phase 2-3: QA section
❌ 🔧 Backend Dev section (SKIPPED)
```

### Example 2: Backend-Only Feature

```
User: "Create Notion task for Rate Limiting API"

Spec has:
- has_frontend: false
- has_backend: true

Generated task includes:
✅ 📋 Spec & Planning section
✅ 🔧 Backend Dev section
✅ 🤖 Phase 1: Automated Tests (backend tests only)
✅ 🧪 Phase 2-3: QA section
❌ 🎨 Frontend Dev section (SKIPPED)
```

### Example 3: Phase Transition with Reality Check

```
User: "Just finished backend work for Get Matched"

Generated Replit prompt asks:
- What APIs were actually built?
- What existing code was reused?
- Were any APIs not needed?
- Any new endpoints discovered?

Replit responds:
- Reused existing email API (remove "Email API implementation" checklist item)
- Added rate limiting (add "Rate limiting implemented" checklist item)
- All other backend items completed

Notion task updated:
- "Email API implementation" removed
- "Rate limiting implemented" added
- Status moved to "🎨 Frontend Dev"
```

## Tips

- Always parse the spec first - it contains all the info needed
- For phase transitions, trust Replit's reality check - specs change during implementation
- If unsure about current status, check the Notion task directly
- Frontend-only features skip Backend Dev entirely
- Backend-only features skip Frontend Dev entirely

## Related Skills

- `notion-workspace-executor` - Creates and updates Notion tasks
- `technical-spec-generator` - Generates specs that this skill parses
- `testing-runbook-generator` - Generates testing docs referenced in tasks
