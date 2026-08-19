# Anthropic Best Practices Audit — /dev Skill Pipeline
## Date: 2026-03-10

## Fixes Already Applied (from master verifier)
1. plan.md: Removed sql-pro inconsistency
2. build.md: Added /tech-debt invocation
3. discover.md: Fixed expert-team Common Mistakes entry
4. SKILL.md: Added Common Mistakes section
5. ship.md: Added schema drift check
6. build.md: Added superpowers:executing-plans reference

## Remaining Fixes Needed

### Item 1: Fix ALL descriptions (CSO anti-pattern — HIGH IMPACT)
Descriptions summarize workflow steps. Should ONLY describe triggering conditions.

Current → Fixed:
- SKILL.md: "Unified feature development pipeline. Routes to the correct phase..." → "Use when developing features end-to-end, resuming paused feature work, or starting new feature pipelines. Triggers on /dev, start feature, build feature, resume feature."
- intake.md: "Classify feature scope, create MANIFEST..." → "Use when starting a new feature in the /dev pipeline or when /dev routes to classification. Triggers on /dev:intake."
- discover.md: "PM-to-technical translation phase. Runs /brainstorm at tier-appropriate depth, with TeamCreate debate for NOVEL tier." → "Use when exploring the solution space for a feature after INTAKE classification. Triggers on /dev:discover or pipeline advancement past INTAKE."
- plan.md: "Ground the design in reality — deep agent research, architecture decisions get LOCKED..." → "Use when grounding a feature design with codebase research and locking architecture decisions. Triggers on /dev:plan or pipeline advancement past DISCOVER."
- document.md: Already good — starts with "Use when..."
- build.md: "Execute wave plans — tier-driven task execution with subagents..." → "Use when executing approved wave plans to build a feature. Triggers on /dev:build or pipeline advancement past DOCUMENT."
- validate.md: "Comprehensive verification — tests, security review, QA checklist..." → "Use when verifying a completed feature build before shipping. Triggers on /dev:validate or pipeline advancement past BUILD."
- handover.md: "Hand completed backend to frontend — optional frontend design phase..." → "Use when a completed backend feature needs frontend implementation. Conditional phase, only runs if feature has frontend component. Triggers on /dev:handover."
- ship.md: "Publish to production — invokes /publish for changelog, version, test suite..." → "Use when shipping a validated feature to production. Final phase of the /dev pipeline. Triggers on /dev:ship or pipeline advancement past VALIDATE/HANDOVER."
- pause.md: Already good — starts with "Use when..."

### Item 4: Fix nested reference in build.md
build.md says "see SKILL.md domain-agent map" — should reference codebase-context-block.md directly instead.

### Item 5: Standardize terminology across ALL files
- "subagent" everywhere (not "Agent tool", "agent", "simple subagents")
- Always "/prompt-generator" with slash
- Always "wave execution plan" (not "wave plan" or "WAVE_NN_PLAN")
- Always "GATE" in headers, "gate" in prose
- Always "implementation status" (not "status tracker")

### Item 7: Remove resumption duplication from pause.md
Lines 130-151 duplicate SKILL.md routing logic. Replace with "See SKILL.md routing logic for resumption."

### Item 8: Simplify document.md ASCII box gate
Replace 34-line ASCII box with plain markdown gate format matching other files.

### Item 9: Add explicit defaults for conditional decisions
- validate.md: "DEFAULT: Run security review. SKIP ONLY IF no security domains in MANIFEST."
- handover.md: "DEFAULT: Skip. RUN ONLY IF MANIFEST domains include frontend."
- build.md: "DEFAULT: COMBINATION tier wave-parallel. Override based on MANIFEST tier."

### Item 10: Ship.md schema drift script
Already addressed in previous fix round — bash script added. Could reference a rake task instead for robustness.

## References Files to Create (from design doc section 12)

### references/manifest-template.md
Extract the MANIFEST template from intake.md (the full markdown template ~40 lines).
Source: intake.md DOCUMENT section, "Write to docs/[feature-slug]/.dev/MANIFEST.md"

### references/wave-plan-template.md
Extract the wave plan template from document.md (~35 lines).
Source: document.md Step 3, the "Wave plan template:" section

### references/agent-prompt-template.md
Extract the agent prompt template from plan.md (~15 lines).
Source: plan.md RESEARCH section, "Agent prompt template:"

### references/codebase-context-block.md
Create shared Thoven context block for subagent prompts.
Content: Rails 7.2.2, dual auth, profile types, soft deletes, services, check ARCHITECTURE.md and COMMON_ERRORS.md.
Referenced by: build.md, plan.md

## Work Units for Batch Fix

### Unit 1: Fix all 10 descriptions (item 1)
Files: ALL 10 files in .claude/skills/dev/
Change: Replace description field in YAML frontmatter

### Unit 2: Terminology standardization (item 5)
Files: ALL 10 files
Change: Find-replace terminology inconsistencies

### Unit 3: Quick edits (items 4, 7, 8, 9)
Files: build.md, pause.md, document.md, validate.md, handover.md
Changes:
- build.md: Fix nested reference
- pause.md: Remove resumption duplication
- document.md: Simplify ASCII gate
- validate.md + handover.md + build.md: Add explicit defaults

### Unit 4: Create 4 references files (item 3)
Files to create:
- references/manifest-template.md
- references/wave-plan-template.md
- references/agent-prompt-template.md
- references/codebase-context-block.md
Then update source files to reference them instead of inlining.

### Unit 5: Slim SKILL.md (item 2)
File: SKILL.md
Change: Remove duplicated content (tiers table, domain-agent map, phase pattern, error handling) — defer to sub-files with brief references.
