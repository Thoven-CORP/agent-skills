#!/usr/bin/env python3
"""
Build customized Notion task content based on feature components.

Generates checklist sections only for needed components:
- Skips frontend if has_frontend=False
- Skips backend if has_backend=False
- Skips analytics if has_analytics=False
- Skips email if has_email=False
"""

import sys
import json
from pathlib import Path


def build_task_content(feature_info: dict) -> str:
    """
    Build customized Notion task content.

    Args:
        feature_info: Dict from parse_spec.py with component flags

    Returns:
        Markdown content for Notion task body
    """
    feature_name = feature_info.get("feature_name", "[Feature Name]")
    has_frontend = feature_info.get("has_frontend", True)
    has_backend = feature_info.get("has_backend", True)
    has_analytics = feature_info.get("has_analytics", False)
    has_email = feature_info.get("has_email", False)
    spec_path = feature_info.get("spec_path", "PRD's & Technical Specs/[Feature Name] Spec.md")

    sections = []

    # Always include Spec & Planning
    sections.append(f"""## 📋 Spec & Planning
- [ ] Technical spec written
   → Spec location: {spec_path}
- [ ] Notion Dev Tracker task created with this template
- [ ] Prompts generated for implementation phases
   → Prompt folder: Prompts/Prompt History/YYYY-MM-DD-{feature_name.lower().replace(' ', '-')}-*.md

---
""")

    # Backend section (conditional)
    if has_backend:
        sections.append(f"""## 🔧 Backend Dev
- [ ] Database schema/models implemented
- [ ] API endpoints implemented
- [ ] Business logic implemented
- [ ] Backend code committed to git

**Replit Prompt:**
→ Prompts/Prompt History/YYYY-MM-DD-{feature_name.lower().replace(' ', '-')}-backend-implementation.md

---
""")

    # Frontend section (conditional)
    if has_frontend:
        sections.append(f"""## 🎨 Frontend Dev
- [ ] UI components implemented
- [ ] User flows implemented
- [ ] Mobile-responsive design verified
- [ ] Frontend code committed to git

**Replit Prompt:**
→ Prompts/Prompt History/YYYY-MM-DD-{feature_name.lower().replace(' ', '-')}-frontend-implementation.md

---
""")

    # Phase 1: Automated Tests (customize based on components)
    test_items = []
    if has_frontend:
        test_items.append("- [ ] Frontend unit tests (npm test) - ALL PASS ✓")
    if has_backend:
        test_items.append("- [ ] Backend unit tests (bundle exec rspec) - ALL PASS ✓")

    # Always include linting and type-check
    test_items.append("- [ ] Linting (npm run lint) - NO ERRORS ✓")
    test_items.append("- [ ] Type checking (npm run type-check) - NO ERRORS ✓")

    sections.append(f"""## 🤖 Phase 1: Automated Tests
{chr(10).join(test_items)}

**Replit Prompt:**
→ Prompts/Prompt Templates/automated-testing-phase1-template.md

**Testing Runbook Reference:**
→ PRD's & Technical Specs/{feature_name} - Testing Runbook.md (Phase 1)

---
""")

    # QA & Staging section
    qa_items = ["### Phase 2: Developer Smoke Test (15-30 min)",
                "- [ ] Happy path works end-to-end"]

    if has_analytics:
        qa_items.append("- [ ] Analytics events fire correctly")

    qa_items.append("- [ ] No console errors")
    qa_items.append("")
    qa_items.append("### Phase 3: Comprehensive QA (4-7 hours)")
    qa_items.append("- [ ] Happy path testing complete")
    qa_items.append("- [ ] Edge case testing complete")
    qa_items.append("- [ ] Cross-browser testing complete (Chrome, Safari, Firefox)")
    qa_items.append("- [ ] Mobile testing complete (iOS Safari, Android Chrome)")

    if has_analytics:
        qa_items.append("- [ ] Analytics validation complete")

    qa_items.append("- [ ] Zero P0 blockers found")
    qa_items.append("")
    qa_items.append("### Phase 4: Stakeholder Sign-Off")
    qa_items.append("- [ ] Stakeholder approval received")

    sections.append(f"""## 🧪 Phase 2-3: QA & Staging

{chr(10).join(qa_items)}

**QA Checklist:**
→ PRD's & Technical Specs/{feature_name} - QA Checklist.md

**Testing Runbook Reference:**
→ PRD's & Technical Specs/{feature_name} - Testing Runbook.md (Phases 2-4)

---
""")

    # Production Rollout
    sections.append(f"""## 🚀 Phase 4-5: Production Rollout

### Deploy & Rollout
- [ ] Code deployed to production (feature flag OFF)
- [ ] Day 1: 10% rollout - monitoring (4-6 hours)
- [ ] Day 2: 50% rollout - monitoring (24 hours)
- [ ] Day 3: 100% rollout - monitoring (48 hours)

**Rollback Triggers:** Error rate >10%, completion <20%, email delivery <80%

**Testing Runbook Reference:**
→ PRD's & Technical Specs/{feature_name} - Testing Runbook.md (Phase 5)

---
""")

    # Post-Launch Monitoring
    sections.append(f"""## ✅ Phase 6: Post-Launch Monitoring (2 weeks)

### Daily Metrics Checks (15 min/day)
- [ ] Day 1: Metrics tracked
- [ ] Day 2: Metrics tracked
- [ ] Day 3: Metrics tracked
- [ ] Day 4: Metrics tracked
- [ ] Day 5: Metrics tracked
- [ ] Day 7: Week 1 review complete
- [ ] Day 14: Week 2 review complete - SUCCESS CRITERIA MET ✓

**Success Criteria:**
[Copy from spec - e.g., "Completion rate ≥60%, Match click rate ≥40%"]

**Testing Runbook Reference:**
→ PRD's & Technical Specs/{feature_name} - Testing Runbook.md (Phase 6)

---
""")

    # Completion
    sections.append("""## 🎯 Completion
- [ ] Feature shipped and validated
- [ ] Metrics meet success criteria
- [ ] Task moved to "Completed" status
""")

    return "".join(sections)


def main():
    if len(sys.argv) < 2:
        print("Usage: notion_task_builder.py <feature_info_json>")
        print("Example: notion_task_builder.py '{\"feature_name\": \"Get Matched\", \"has_frontend\": true}'")
        sys.exit(1)

    # Parse JSON input
    feature_info = json.loads(sys.argv[1])

    # Build task content
    task_content = build_task_content(feature_info)

    print(task_content)


if __name__ == "__main__":
    main()
