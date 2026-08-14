#!/usr/bin/env python3
"""
Generate Replit handoff prompts for phase transitions.

Creates prompts that ask Replit Claude Code to:
1. Review what was actually done vs planned
2. Identify checklist items to ADD (new work discovered)
3. Identify checklist items to REMOVE (work not needed)
4. Update the Notion task to reflect reality
"""

import sys
import json


# Status progression map
STATUS_PROGRESSION = {
    "📋 Spec & Planning": "🔧 Backend Dev",
    "🔧 Backend Dev": "🎨 Frontend Dev",
    "🎨 Frontend Dev": "🤖 Phase 1: Automated Tests",
    "🤖 Phase 1: Automated Tests": "🧪 Phase 2-3: QA & Staging",
    "🧪 Phase 2-3: QA & Staging": "🚀 Phase 4-5: Production Rollout",
    "🚀 Phase 4-5: Production Rollout": "✅ Phase 6: Post-Launch Monitoring",
    "✅ Phase 6: Post-Launch Monitoring": "🎯 Completed",
}


def generate_handoff_prompt(current_status: str, feature_name: str, notion_task_url: str) -> str:
    """
    Generate Replit handoff prompt for phase transition.

    Args:
        current_status: Current Notion task status
        feature_name: Name of the feature
        notion_task_url: URL to the Notion task

    Returns:
        Markdown prompt for Replit Claude Code
    """
    next_status = STATUS_PROGRESSION.get(current_status)

    if not next_status:
        return f"ERROR: Unknown status '{current_status}' or no next status available."

    # Get phase-specific instructions
    phase_instructions = get_phase_instructions(current_status, next_status, feature_name)

    prompt = f"""# Phase Transition: {current_status} → {next_status}

## Goal
Review what was actually done in "{current_status}" phase, update the Notion task to reflect reality, and prepare for "{next_status}" phase.

## Your Task

### Step 1: Reality Check for Completed Phase
Review the work that was actually done in "{current_status}" phase:

{phase_instructions['review']}

**Compare to original checklist in Notion:**
→ Notion task: {notion_task_url}

### Step 2: Update Notion Checklist

**Items to REMOVE** (work that wasn't needed):
- Identify checklist items for work that:
  - Was already done (reused existing code)
  - Wasn't necessary (simpler approach found)
  - Was out of scope (deferred to later)

**Items to ADD** (new work discovered):
- Identify work that was done but not in original checklist:
  - New endpoints/APIs created
  - Additional components built
  - Extra configuration needed
  - Security/validation added

### Step 3: Update the Notion Task

Use the Notion API to:
1. Check off completed items in "{current_status}" section
2. Remove unnecessary items (add strikethrough or delete)
3. Add new items discovered during implementation
4. Move task Status to "{next_status}"

### Step 4: Prepare Next Phase

{phase_instructions['prepare']}

## Output Format

Provide:
1. **Reality Check Summary:**
   - What was actually done (vs planned)
   - Items to remove (and why)
   - Items to add (and why)

2. **Updated Notion Checklist:**
   - Show the updated checklist for "{current_status}" section
   - Mark completed items with ✓

3. **Next Phase Checklist:**
   - Show the checklist for "{next_status}"
   - Flag any items that may not be needed based on what you learned

4. **Notion API Calls:**
   - Provide the specific API calls to update the task

---

**Feature:** {feature_name}
**Current Status:** {current_status}
**Next Status:** {next_status}
**Notion Task:** {notion_task_url}
"""

    return prompt


def get_phase_instructions(current_status: str, next_status: str, feature_name: str) -> dict:
    """Get phase-specific review and preparation instructions."""

    instructions = {
        "📋 Spec & Planning": {
            "review": """- Was the spec complete and clear?
- Were all prompts generated?
- Is the Notion task properly set up?""",
            "prepare": f"""Review the spec one more time before starting implementation.
Confirm which phase to start with (Backend or Frontend).
If {feature_name} is frontend-only, skip Backend Dev and go straight to Frontend Dev."""
        },
        "🔧 Backend Dev": {
            "review": """- What APIs/endpoints were actually built?
- What database changes were made?
- What existing code was reused (APIs, services)?
- What business logic was implemented?
- Were there any unexpected complexities?""",
            "prepare": """Review backend code committed.
Identify any frontend dependencies (API contracts, data structures).
Flag any APIs that need frontend testing."""
        },
        "🎨 Frontend Dev": {
            "review": """- What UI components were built?
- What user flows were implemented?
- Were designs followed or adjusted?
- What API integrations were completed?
- Is it mobile-responsive?""",
            "prepare": """Review frontend code committed.
Identify what needs automated testing (components, API calls, validation).
Note any edge cases discovered during implementation."""
        },
        "🤖 Phase 1: Automated Tests": {
            "review": """- Which tests were run?
- Did all tests pass?
- Were new tests written for this feature?
- Were any tests skipped (and why)?""",
            "prepare": """Confirm all tests passed before moving to QA.
DO NOT proceed if any tests are failing.
Document any test gaps for manual QA."""
        },
        "🧪 Phase 2-3: QA & Staging": {
            "review": """- Was smoke test completed?
- Was full QA checklist completed?
- Were P0 bugs found and fixed?
- Did stakeholder approve?""",
            "prepare": """Confirm ZERO P0 blockers before production.
Review deployment checklist.
Verify feature flag is ready."""
        },
        "🚀 Phase 4-5: Production Rollout": {
            "review": """- Was 10% → 50% → 100% rollout completed?
- Were metrics monitored at each stage?
- Were there any rollback triggers?
- Are error rates acceptable?""",
            "prepare": """100% rollout is live.
Set up daily monitoring dashboards.
Prepare to track success metrics for 2 weeks."""
        },
        "✅ Phase 6: Post-Launch Monitoring": {
            "review": """- Were daily metrics tracked for 2 weeks?
- Did the feature meet success criteria?
- Were there any post-launch issues?
- Was user feedback positive?""",
            "prepare": """Feature is complete and validated.
Archive the Notion task.
Document learnings for future features."""
        },
    }

    return instructions.get(current_status, {
        "review": "Review what was done in this phase.",
        "prepare": "Prepare for the next phase."
    })


def main():
    if len(sys.argv) < 4:
        print("Usage: replit_handoff_generator.py <current_status> <feature_name> <notion_task_url>")
        print("Example: replit_handoff_generator.py '🔧 Backend Dev' 'Get Matched AI Flow' 'https://notion.so/...'")
        sys.exit(1)

    current_status = sys.argv[1]
    feature_name = sys.argv[2]
    notion_task_url = sys.argv[3]

    prompt = generate_handoff_prompt(current_status, feature_name, notion_task_url)
    print(prompt)


if __name__ == "__main__":
    main()
