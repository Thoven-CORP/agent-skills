---
name: andres-dev-evaluation
description: "Audit why a skill, hook, or tool is not firing, then close the gap. Use for /andres-dev-evaluation, \"why didn't it run X\", \"evaluate my setup\", or a stretch of work that felt like it fought you. Reads real transcripts from whichever harness wrote them."
---

# Andres dev evaluation

A setup is a graph of named references, and a *dangling* one resolves to nothing while erroring nowhere. A router names a skill this harness does not have. A rule names a tool the model may not invoke. An MCP server's tools sit in context uncalled. The run quietly does less than the config claims, and the only symptom is work that felt like it fought you.

This measures that graph against what actually happened, then routes each gap to whatever can hold it.

It owns measurement and routing. The **retro** skill owns environment improvement candidates and the **automate-me** skill owns capturing conventions into a personal `-mode` skill. Both are user-invoked (`retro` carries `disable-model-invocation: true`), so the report names `/retro` and `/automate-me` as the next commands for the user to type rather than calling them.

## Where things live per harness

Detect before reading. Three harnesses, different layouts, and a glob that is right for one leaks across the others.

Transcripts. Claude Code writes one JSONL per session under `~/.claude/projects/`. Cursor writes the active workspace's `agent-transcripts/`, and reading only that directory keeps unrelated private chats in other workspaces out of scope. Codex writes `~/.codex/sessions/`.

Skills. `~/.claude/skills`, `~/.agents/skills`, `~/.agents/skills-on-demand`, `~/.cursor/skills`, `~/.codex/skills`. `~/.agents` is the shared tree the others symlink into, so one edit there can cover several harnesses, and a fix applied to one tree is shadowed in whichever harness reads another.

Two files keep a fix alive through `npx skills update`. A whole-file rewrite goes in `~/.claude/skill-overrides/`. A skill that must stay model-invocable goes in `~/.claude/skills-invocable.txt`.

## Step 1. Measure

```
DAYS=14 bash ~/thoven/agent-skills/scripts/dev-evaluation-audit.sh
```

`DAYS` sets the window, `THRESH` the edit count that counts as a heavy session. Raw tables land in `/tmp/dev-evaluation/`.

Read all four sections before writing anything. The script reports counts and names. Which gap matters is yours to decide.

## Step 2. Diagnose

Account for every lever with a nonzero finding. Each one lands on a named cause or on "no cause found", and a lever you skipped is not diagnosed.

**Lever A. A skill was asked for and its mandated follow-ons never ran.** A router like `poteto-mode` names the skills it requires. Take these in order, because the first three are mechanical and the fourth is the only one that is really about attention.

1. Does the named skill exist in this harness? A router naming an absent skill is *dangling*.
2. Does its frontmatter carry `disable-model-invocation: true`? A blocked skill cannot be auto-invoked, so any line telling the model to use it is unreachable by construction.
3. Does its description end with a clause like "only runs when explicitly invoked"? That is a second, prose-level block, and no frontmatter check finds it.
4. Only once those three pass is the trigger's wording the cause.

**Lever B. The model may choose it and never does.** A skill typed often and self-invoked never has a description that misses how the ask gets phrased. Compare its triggers against how the request actually lands, in `prompts.tsv`. Front-load the words that trigger, and keep one trigger per branch, since synonyms for one case are one branch written twice.

**Lever C. Heavy edit sessions with no cleanup pass.** Subagent sessions are excluded, because the parent owns the diff. A main session that edits thirty files and runs nothing after means the follow-through is advisory, and advisory loses in a long session.

**Lever D. Carried in context and never called.** Every configured MCP server spends context every turn. One never called is the wrong tool or a missing pointer. Remove it, or name it where the work happens.

## Step 3. Route each gap to a layer that holds it

Every diagnosed gap gets exactly one layer and one file path. A gap you cannot place is a finding, so report it as one.

The **context layer** is CLAUDE.md, skills, and descriptions. The model reads it and decides, compliance thins across a long session, and text inside a file the agent opens can argue with it. Right for a fact that stays true, or a procedure carrying real judgment.

The **execution layer** is hooks, agent frontmatter, and exit codes. The harness runs it and the model never sees it. Right for anything that has to happen every time.

Pick the cheapest layer that closes the gap. A rule already written and already skipped is evidence the context layer will not hold it, so encode it instead of writing it twice, per **principle-encode-lessons-in-structure**.

## Step 4. Hand off

Route findings rather than fixing all of them here.

Environment findings, meaning navigation, missing automated checks, tool economy, and no-ops in steering files, go to the **retro** skill, which owns that taxonomy. Name `/retro` in the report as the next command to run.

Conventions that repeated across sessions go to the **automate-me** skill. It is user-invoked by design, so name it in the report as the next command to run. Forward a convention only when you can point at two occurrences of it.

Anything mechanical enough to check every run becomes a hook or a script here.

## Step 5. Report

One table, one row per diagnosed gap. Lever, the finding with its count, the layer, the exact file, and the owner. Close with what you left unfixed and why.

Every count comes from the script's output. Apply the **unslop** skill to the report.
