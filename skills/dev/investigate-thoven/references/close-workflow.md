# Phase 8: CLOSE — Workflow + Pattern Logging

Conditional close workflow based on context classification (Standalone / Feature Dev / Production Incident). Pattern logging is mandatory with a quality gate.

## Contents
- Close workflow by context
- Mandatory pattern logging quality gate
- Pattern entry template
- log_error.py helper script
- Phase 8 checkpoint

---

## Close Workflow by Context

### Standalone Bug Fix
*(user reported a bug, not part of feature work)*

1. **Log pattern:** Run mandatory pattern quality gate (see below)
2. **Commit:** Stage and commit the fix with descriptive message
3. **Summarize:** Brief summary of what was fixed and why

### During Feature Dev
*(bug found while building a feature)*

1. **Log pattern:** Run mandatory pattern quality gate (see below)
2. **No separate commit:** Fix is part of the feature work, will be committed with the feature
3. **Summarize:** Brief note of what was fixed, reference it in feature docs if relevant

### Production Incident
*(something is broken in prod)*

1. **Log pattern:** Run mandatory pattern quality gate (see below)
2. **Commit and push:** Stage, commit, and push immediately
3. **CHANGELOG:** none. PRs do not edit `CHANGELOG.md`; `/publish` writes it from the merged PRs and their Linear tickets
4. **Deploy reminder:** Tell user: "Fix pushed. Deploy with `/publish`; the branch picks the path."
5. **Summarize:** Full incident summary — symptom, root cause, fix, files changed

---

## Mandatory Pattern Logging (Quality Gate)

**This is NOT optional.** After every fix, you MUST evaluate whether to log a new pattern to `common-errors.md`.

**Quality gate — answer all three:**

1. **Is it generalizable?** Will this help with FUTURE bugs, not just document this one?
   - ❌ "Mixpanel CSP blocked at api-js.mixpanel.com" → too specific
   - ✅ "CSP Missing Required Subdomain" → applies to ANY SDK

2. **Does it have prevention guidance?** Not just "how to fix" but "how to avoid next time"?
   - ❌ "Add X to file Y"
   - ✅ "When adding any third-party SDK, check Network tab for all domains"

3. **Can you name it without mentioning specific files/services?**
   - ❌ "TeacherProfile handleSubmit bug"
   - ✅ "Stale Derived State After Partial Save"

**If all three pass:** Log to `common-errors.md` using the template below.

**If any fail:** State which criterion failed and why it's not worth logging. Example: "Not logging — this was a one-off typo in a component name, not a generalizable pattern."

---

## Pattern Entry Template

When logging, use this exact format:

```markdown
### Error: [Generalizable Pattern Name]
- **Symptom:** [What the user/developer sees — be specific]
- **Root Cause:** [WHY this happens — the underlying principle, not the incident]
- **Fix:** [How to resolve it]
- **Prevention:** [How to avoid this in the future — the most important field]
- **Applies to:** [What other situations this pattern covers]
- **Files:** [Common file locations, use "any X" for broad patterns]
- **Date Added:** [YYYY-MM-DD]
- **Reference:** [Brief description of the original incident that surfaced this pattern]
```

You can also use the helper script:

```bash
python .claude/skills/investigate-thoven/scripts/log_error.py \
  "Category" \
  "Generalizable Pattern Name" \
  "Symptom description" \
  "Root cause (the principle, not the incident)" \
  "Fix + Prevention guidance"
```

---

## Phase 8 Checkpoint

- [ ] User confirmed bug is fixed (Phase 7 gate passed)
- [ ] Pattern quality gate evaluated
- [ ] Pattern logged if it passed the gate (or reason stated for skipping)
- [ ] Commit made (standalone/production) or noted for feature commit (feature-dev)
- [ ] CHANGELOG updated (production incidents only)
- [ ] Deploy reminder given (production incidents only)
