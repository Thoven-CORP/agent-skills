#!/usr/bin/env python3
"""Re-apply local fixes to third-party skills in ~/.agents/skills and ~/.claude/skills.

`npx skills` installs each skill into BOTH directories; Claude Code reads
~/.claude/skills first, so a fix applied to only one copy is shadowed.

`npx skills update` overwrites those trees whenever upstream changes, silently
reverting anything fixed by hand. This runs at SessionStart and puts the fixes
back. It is idempotent and stays quiet unless it changed something or a patch
went stale.

Four parts:
  A. Names — a skill whose frontmatter `name:` is not kebab-case gets it
     rewritten to its directory name. Claude Code resolves skills by directory,
     but the slash-command picker filters on the frontmatter name, so a name
     like "Poteto Mode" makes /poteto-mode unfindable.
  B. Text patches — string replacements for skills that reference leaf skills
     under a name that does not resolve here. Applied to SKILL.md and to every
     playbook and reference file beside it, because a router's real routing
     table is spread across those.
  C. Model invocation — a router skill can only route to skills the model is
     allowed to invoke on its own. Upstream ships most leaf skills with
     `disable-model-invocation: true`, which turns every line that says "use the
     X skill" into a dead reference. This reads the router's own text each run
     and clears that flag on exactly the skills it names, so an upstream update
     that adds a route unblocks that route too.
  D. Resolution — report a name the router points at that no longer exists.
     Upstream renaming a leaf skill is otherwise a silent failure: the router
     keeps telling the model to use a skill that is not there.

A targeted patch that matches neither its old nor its new text is reported as
STALE: upstream rewrote the line and the patch needs re-authoring.
"""

import re
import sys
from pathlib import Path

# Every skill tree on this machine. Claude Code reads ~/.claude/skills, Cursor
# reads ~/.cursor/skills, Codex reads ~/.codex/skills, and ~/.agents is the
# shared tree the other two symlink into. `npx skills` writes several of them,
# so a fix applied to one copy is shadowed in whichever harness reads another.
SKILL_DIRS = [
    Path.home() / ".agents" / "skills",
    Path.home() / ".agents" / "skills-on-demand",
    Path.home() / ".claude" / "skills",
    Path.home() / ".cursor" / "skills",
    Path.home() / ".codex" / "skills",
]
KEBAB = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

# (skill, old, new) — `old` is upstream's text, `new` is what we want locally.
PATCHES = [
    (
        "poteto-mode",
        "the `deslop` skill from the `cursor-team-kit` plugin (`/deslop`)",
        "the **deslop** skill (`/deslop`)",
    ),
    (
        "poteto-mode",
        "the **create-skill** skill (Cursor's built-in for authoring SKILL.md files)",
        "the **writing-for-agents** skill (for authoring SKILL.md files)",
    ),
    (
        "poteto-mode",
        "[the Claude Code adapter](../../docs/harness/claude-code.md)",
        "[the Claude Code adapter](~/thoven/agent-skills/enforcement/config/pstack-claude-code.md)",
    ),
    (
        "poteto-help",
        "[the Claude Code adapter](../../docs/harness/claude-code.md)",
        "[the Claude Code adapter](~/thoven/agent-skills/enforcement/config/pstack-claude-code.md)",
    ),
    (
        "poteto-help",
        "- No `~/.cursor/rules/pstack-models.mdc` means `/setup-pstack` hasn't run for this user, so every role uses its default model.",
        "- Models come from `~/.claude/pstack-models.md`, which Andres sets by hand. Point a model or budget question at that file, not at `/setup-pstack`.",
    ),
    (
        "poteto-help",
        "Rerun `/setup-pstack` and pick a smaller budget or cheaper models.",
        "Lower the budget or the tiers in `~/.claude/pstack-models.md`.",
    ),
    (
        "poteto-help",
        "it also installs in Claude Code with `/plugin marketplace add cursor/plugins`, then `/plugin install pstack@cursor-plugins`. There, each command takes a `pstack:` prefix, such as `/pstack:poteto-mode`. The [Claude Code adapter](../../docs/harness/claude-code.md)",
        "on this machine `npx skills` installs each pstack skill on its own, so a command has no `pstack:` prefix, such as `/poteto-mode`. The [Claude Code adapter](~/thoven/agent-skills/enforcement/config/pstack-claude-code.md)",
    ),
    (
        "poteto-help",
        "- `/loop` and `/create-skill` are Cursor built-ins.",
        "- `/loop` is a Claude Code skill here. In place of Cursor's `/create-skill`, use the **writing-for-agents** skill.",
    ),
    (
        "ketchup",
        "a Mermaid diagram, a chart or diagram from `/visualize`, or a generated image",
        "an HTML page built with the **visual-artifacts** skill, a chart from the **dataviz** skill, or a generated image",
    ),
    (
        "ketchup",
        "Draw diagrams and charts from facts you have: a Mermaid diagram for how things connect and a `/visualize` chart for numbers.",
        "Draw diagrams and charts from facts you have: one HTML page built with the **visual-artifacts** skill for how things connect, and a **dataviz** chart for numbers. Mermaid does not render in this terminal.",
    ),
    (
        "deslop",
        "description: Remove AI-generated code slop and clean up code style",
        "description: Remove AI-generated slop from the current branch's diff vs main — stray/over-explanatory comments, defensive try/catch on trusted paths, `any` casts that only silence types, needless deep nesting. Surgical and behavior-preserving. Use right after generating code, before review; pair with `thermo-nuclear-code-quality-review` for a structural pass.",
    ),
    (
        "show-me",
        "Match the product's colors, type, spacing, and components; use real labels and data; support desktop and mobile.",
        "Build it with the **visual-artifacts** skill and use real labels and data.",
    ),
    (
        "teach",
        "A mermaid diagram fits a flow or structure where the labels carry the meaning.",
        "A mermaid diagram fits a flow or structure where the labels carry the meaning. Mermaid does not render in the terminal, so put the series in one HTML page built with the **visual-artifacts** skill.",
    ),
]

# Routers whose named skills must stay model-invocable. Each entry is a skill
# whose own text is the source of truth for what it routes to.
ROUTERS = ["poteto-mode"]

# Skills invoked directly and often enough that the model should be able to
# reach them without being asked. Everything not listed and not named by a
# router stays blocked, which is what keeps the always-loaded description list
# small. The list is a plain file so it can be edited without touching code.
ALWAYS_INVOCABLE_FILE = Path.home() / ".claude" / "skills-invocable.txt"

# Whole-file local rewrites. A string patch cannot restore a skill that was
# rewritten end to end, and `npx skills update` overwrites the file wholesale.
# Each <slug>.SKILL.md here replaces that skill's SKILL.md in every tree
# whenever upstream's copy comes back.
OVERRIDE_DIR = Path.home() / ".claude" / "skill-overrides"


def apply_overrides(skills):
    restored = []
    if not OVERRIDE_DIR.is_dir():
        return restored
    for src in sorted(OVERRIDE_DIR.glob("*.SKILL.md")):
        slug = src.name[: -len(".SKILL.md")]
        dest = skills / slug / "SKILL.md"
        if not dest.is_file():
            continue
        want = src.read_text(encoding="utf-8")
        if dest.read_text(encoding="utf-8") == want:
            continue
        dest.write_text(want, encoding="utf-8")
        restored.append(slug)
    return restored


def always_invocable():
    """Names Andres curates by hand. One per line, # for comments."""
    if not ALWAYS_INVOCABLE_FILE.is_file():
        return set()
    return {
        line.strip()
        for line in ALWAYS_INVOCABLE_FILE.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    }

# Names a router points at that are another harness's built-ins, not skills.
# Reporting these every session would be noise, so they are excluded from part D.
KNOWN_EXTERNAL = {"goal", "loop", "create-skill"}

# `**name** skill`, `the **name** skill`, `/name`, and bare `principle-*`.
ROUTE_PATTERNS = [
    re.compile(r"\*\*([a-z][a-z0-9-]{2,})\*\*\s+skill"),
    re.compile(r"`/([a-z][a-z0-9-]{2,})`"),
    re.compile(r"\b(principle-[a-z-]+)\b"),
]

BLOCK_LINE = re.compile(r"^disable-model-invocation:[ \t]*true[ \t]*\r?\n", re.M)


def router_files(skill_dir):
    """SKILL.md plus the playbooks and references beside it."""
    files = [skill_dir / "SKILL.md"]
    for sub in ("playbooks", "references"):
        files.extend(sorted((skill_dir / sub).glob("*.md")))
    return [f for f in files if f.is_file()]


def normalize_names(skills):
    changed, failed = [], []
    for skill_md in sorted(skills.glob("*/SKILL.md")):
        slug = skill_md.parent.name
        if not KEBAB.match(slug):
            continue
        try:
            text = skill_md.read_text(encoding="utf-8")
        except OSError as err:
            failed.append(f"{slug}: {err}")
            continue
        match = re.search(r"^name:[ \t]*(.+?)[ \t]*$", text, re.M)
        if not match or KEBAB.match(match.group(1)):
            continue
        patched = text[: match.start()] + f"name: {slug}" + text[match.end() :]
        try:
            skill_md.write_text(patched, encoding="utf-8")
        except OSError as err:
            failed.append(f"{slug}: {err}")
            continue
        changed.append(f"{slug}: name {match.group(1)!r} -> {slug!r}")
    return changed, failed


def apply_patches(skills):
    changed, stale = [], []
    for slug, old, new in PATCHES:
        skill_dir = skills / slug
        if not skill_dir.is_dir():
            continue
        targets = router_files(skill_dir)
        if any(new in f.read_text(encoding="utf-8") for f in targets):
            continue
        hits = [f for f in targets if old in f.read_text(encoding="utf-8")]
        if not hits:
            stale.append(f"{slug}: neither old nor new text present -> {old[:60]}...")
            continue
        for f in hits:
            f.write_text(f.read_text(encoding="utf-8").replace(old, new), encoding="utf-8")
            changed.append(f"{slug}/{f.name}: {old[:46]}... -> patched")
    return changed, stale


def routed_names(trees):
    """Every skill name the routers point at, read from the routers themselves.

    Computed once across all trees and applied to all of them, so a harness
    whose tree has no copy of the router still gets the leaf skills unblocked.
    """
    names = always_invocable()
    for skills, router in ((s, r) for s in trees for r in ROUTERS):
        skill_dir = skills / router
        if not skill_dir.is_dir():
            continue
        names.add(router)
        for f in router_files(skill_dir):
            text = f.read_text(encoding="utf-8")
            for pattern in ROUTE_PATTERNS:
                names.update(pattern.findall(text))
    return names


def ensure_model_invocable(skills, names):
    """Clear disable-model-invocation on the named skills. Frontmatter only."""
    unblocked = []
    for name in sorted(names):
        skill_md = skills / name / "SKILL.md"
        if not skill_md.is_file():
            continue
        text = skill_md.read_text(encoding="utf-8")
        if not text.startswith("---"):
            continue
        end = text.find("\n---", 3)
        if end == -1:
            continue
        head, body = text[: end + 1], text[end + 1 :]
        patched = BLOCK_LINE.sub("", head)
        if patched == head:
            continue
        skill_md.write_text(patched + body, encoding="utf-8")
        unblocked.append(name)
    return unblocked


def check_resolution(skills, names):
    """A routed name with no skill directory is a dead reference."""
    return [
        n
        for n in sorted(names)
        if n not in KNOWN_EXTERNAL and not (skills / n / "SKILL.md").is_file()
    ]


def main():
    renamed, failed, patched, stale, unblocked, dead, overridden = [], [], [], [], [], [], []
    trees = [d for d in SKILL_DIRS if d.is_dir()]
    names = routed_names(trees)
    for skills in trees:
        tag = f"{skills.parent.name}/{skills.name}"
        r, f = normalize_names(skills)
        p, s = apply_patches(skills)
        o = apply_overrides(skills)
        u = ensure_model_invocable(skills, names)
        renamed += [f"{tag}: {x}" for x in r]
        failed += [f"{tag}: {x}" for x in f]
        patched += [f"{tag}: {x}" for x in p]
        stale += [f"{tag}: {x}" for x in s]
        unblocked += [f"{tag}: {x}" for x in u]
        overridden += [f"{tag}: {x}" for x in o]
        if skills.parent.name == ".claude":
            dead = check_resolution(skills, names)

    if renamed or patched or unblocked or overridden or failed or stale:
        print("Skill patches re-applied (upstream had reverted them):")
        for line in renamed + patched:
            print(f"  fixed      {line}")
        for line in unblocked:
            print(f"  unblocked  {line}")
        for line in overridden:
            print(f"  restored   {line} (local rewrite, upstream had replaced it)")
        for line in failed + stale:
            print(f"  STALE      {line}")
        if stale:
            print("  -> a STALE patch means upstream rewrote that line; re-author it in")
            print("     ~/.claude/hooks/reapply-skill-patches.py")
    if dead:
        print(f"Routed skills that do not exist ({len(dead)}): {', '.join(dead)}")
        print("  -> a router points at these; either upstream renamed them or they")
        print("     are another harness's built-ins. Patch the router or ignore.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
