---
name: vault-link
description: Link-graph maintenance for the Executive Assistant vault. Builds and maintains Concepts/ entity hub notes and weaves [[wikilinks]] across the vault so notes stop being orphans. Use when user says "link the vault", "vault lint", "fix orphans", "unlinked mentions", "vault graph", or monthly alongside vault-cleanup.
---

# vault-link: Vault Link-Graph Maintenance

Adapted from claude-obsidian's wiki-lint + wiki-ingest patterns (Karpathy LLM Wiki) for the Executive Assistant vault at `/Users/andresmartinez/Vaults/Executive-Assistant/`. The vault is an operational system, not a fresh wiki — work WITH its existing structure, never restructure it.

## Vault conventions (must hold)

- **`Concepts/` is the only hub folder.** Flat, no subfolders. One note per recurring entity: people, companies, channels, tools, strategies.
- **Wikilinks match filenames exactly**: `[[Jared Simon]]` → `Concepts/Jared Simon.md`. Filenames must be unique vault-wide so links work without paths.
- **First mention per section gets the link** (per CLAUDE.md). Subsequent mentions in the same section stay plain text.
- Use alias syntax when prose differs from the filename: `[[Jared Simon|Jared]]`.

## Three modes

### 1. `scan` — read-only health report
Run checks in order, write report (see Report section), change nothing:
1. **Orphan notes** — no inbound wikilinks from anywhere.
2. **Dead links** — `[[Target]]` where no `Target.md` exists.
3. **Missing concept pages** — a person/company/channel mentioned by name in **3+ notes** with no `Concepts/` page. These are the highest-value fixes.
4. **Unlinked mentions** — existing `Concepts/` page names appearing as plain text in other notes.
5. **Frontmatter gaps** — Research/PRD/Prompts files missing the CLAUDE.md frontmatter schema (date, category, status, tags).

### 2. `retrofit` — one-time batch linking pass
1. Run `scan` first; present the report and the proposed entity list. **Get explicit approval before any bulk edit.**
2. `git add -A && git commit` checkpoint in the vault BEFORE editing (obsidian-git auto-commits; a named checkpoint makes rollback trivial).
3. Create missing `Concepts/` stubs (template below). Check for existing pages first, including name variants ("Jared Simon" vs "Jared" vs "J. Simon") — never create duplicates.
4. Sweep notes for unlinked mentions of every `Concepts/` page; convert first-mention-per-section to `[[wikilinks]]`.
5. Work in batches of ~50 files; report progress per batch. For parallel agents, use a Workflow with file-list partitioning (no two agents touch the same file).
6. Append a summary entry to the report file when done.

### 3. `maintain` — incremental (monthly, or after heavy weeks)
Same as retrofit but scoped to files modified since the last report (`find -mtime`), plus a scan for NEW entities that crossed the 3-mention threshold. No approval gate needed for ≤20 files; above that, show the list first.

## Entity harvesting (where candidates come from)

- `Meetings/` filenames — every "X Call Prep" name is a person.
- `Fundraising/angel-outreach-loop-history.md` and outreach docs — prospect names.
- `Daily Work/` — recurring names and projects.
- Frequency rule: an entity needs **3+ note mentions** to earn a Concepts/ page; below that, linking adds noise.
- People in the Notion CRM who never appear in vault notes do NOT get pages — the vault graph reflects vault content.

## Concept stub template

```markdown
---
type: person | company | channel | tool | strategy
status: Active
tags: []
---

# {Name}

One-to-three lines: who/what this is and why it matters to Andres/Thoven.
Role/relationship: (investor prospect | partner | advisor | teacher | tool | channel)

> Backlinks panel shows every note mentioning this entity. Keep this page short — it's a hub, not a dossier.
```

Facts in stubs follow the CLAUDE.md drafting rules: only what existing notes state; no invented specifics.

## Linking rules (the mechanical part)

- Link ONLY exact name matches (case-insensitive, word-boundary). Never fuzzy-match.
- Never link inside: YAML frontmatter, code blocks, URLs, headings, existing `[[links]]`, tables of raw data, or quoted email text (outbound drafts must stay clean — no wikilinks in anything that gets sent).
- Skip ambiguous short names ("Sam", "Chris") unless surrounding context names them fully in the same note.

## Exclusions (never auto-edit)

- `Transcripts/` — raw sources are immutable.
- `Agent Knowledge/Memory/` — memory files are managed by the /memory skill; don't churn them.
- `.obsidian/`, `.claude/`, `.agent-state/`, `todo.md`, `CLAUDE.md`.
- `Email Templates/` and any file that is itself an outbound draft body.

## Safety posture (from wiki-lint, kept verbatim in spirit)

Safe to auto-fix after report approval:
- Adding wikilinks for unlinked mentions
- Creating stub Concepts/ pages
- Adding missing frontmatter with placeholder values

Needs human review, never auto-fix:
- Deleting orphan notes (may be intentionally standalone)
- Merging suspected duplicate pages
- Renaming files (breaks external references)

## Report

Write to `Agent Knowledge/Vault Health/lint-report-YYYY-MM-DD.md`:

```markdown
# Vault Link Report — YYYY-MM-DD
## Summary
- Notes scanned / orphans / dead links / missing concept pages / unlinked mentions
## Missing Concept Pages (3+ mentions)
- "Name" — mentioned in [[A]], [[B]], [[C]] → create Concepts/Name.md
## Unlinked Mentions
- [[Existing Concept]] — plain-text in N notes
## Dead Links
- [[Target]] referenced in [[Source]] — create stub or remove
## Actions taken (retrofit/maintain only)
```

## Cadence

Monthly, paired with `vault-cleanup` (archival). vault-cleanup moves files; vault-link keeps the graph connected. Run vault-cleanup FIRST so links are woven into final locations.
