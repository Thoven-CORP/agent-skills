# Baseline Test Results - Research Orchestration

**Date**: 2026-02-05
**Test Type**: RED phase - observing natural behavior WITHOUT skill

## Scenario

User requested: "can you launch some subagents to research each" (referring to 4 legal compliance topics)

Topics:
1. Tax compliance & 1099 filing
2. Work authorization for independent contractors
3. Worker classification (AB2857, California ABC test)
4. Foreign corporation registration

## What Actually Happened (From Real Session)

### Agent Behavior
I launched 4 parallel legal-advisor subagents:

```
Task #1: legal-advisor for Tax/1099
Task #2: legal-advisor for Work Authorization
Task #3: legal-advisor for Worker Classification
Task #4: legal-advisor for Foreign Corporation Registration
```

### File Creation Results
**4 SEPARATE FILES CREATED:**

1. `Research/Tax Compliance - 1099 Filing Requirements for Thoven.md`
2. `Research/Independent Contractor Work Authorization - Legal Research & Compliance Guide.md`
3. `Research/Worker Classification - Music Teacher Marketplace Legal Analysis.md`
4. `Research/Foreign Corporation Registration - Multi-State Compliance Guide for Marketplace Platforms.md`

Each file: ~10,000 words

**Total**: 4 files, ~40,000 words across separate documents

### User Feedback (Verbatim)

> "okay lets compile into one research document. and then lets also create a either a memory or a skill that when we launch multiple agents to do research we 1) ensure proepr orchestration for segmentation of differnet parts fo the ask 2) the researhc comes back and stores into one file. This has happen d a couple iof times where i have to be explicity andtell what each agent should do what and then you come back and add a research file for each subagent which is causing way to many documents to be created"

## Problem Identified

### What Went Wrong
1. **No orchestration guidance**: Each agent decided independently where to save
2. **Default to separate files**: Each agent created its own document
3. **No consolidation step**: No instruction to merge results
4. **Pattern has repeated**: User says "This has happen d a couple iof times"

### User's Pain Points
- "causing way to many documents to be created"
- Has to "be explicity andtell what each agent should do"
- Wants research to "stores into one file"

### What User Wants
1. **Proper orchestration**: Clear segmentation of who researches what
2. **Single output file**: All research consolidated into ONE document
3. **Automatic behavior**: Shouldn't have to explicitly instruct this every time

## Rationalizations Observed

None explicitly stated, but implied behavior:
- "Each topic deserves its own file" (default thinking)
- "Separate files = easier to work on in parallel" (optimization for agents, not user)
- "User can consolidate later if needed" (pushing work to user)

## Success Criteria for Skill

After skill is created, running same scenario should result in:
- ✅ 4 agents launched with clear topic segmentation
- ✅ All agents instructed to contribute to SINGLE consolidated file
- ✅ 1 file created (not 4)
- ✅ File has clear sections for each topic
- ✅ No manual consolidation step needed

## Next Step

GREEN phase: Write skill that prevents this multi-file creation pattern
