#!/usr/bin/env python3
"""Check that PUBLISH_CHECKLIST.md mirrors the /publish reference files.

Every `**Stop: <name>.**` and every "Done when" in a source section needs exactly
one checklist item, in the same order, named the same. A "Done when" takes the
name of the bold label that opens its step (`3. **CI is green on that SHA.**`).
A checklist item is `- [ ] **<name>.** ...`.

Usage:
  check-publish-checklist.py <publish-skill-dir> <frontend-repo-root>

Prints a unified diff per section (expected from the sources, actual from the
checklist) and exits 1 on any difference.
"""
import difflib
import re
import sys
from pathlib import Path

PROJECT = "docs/Platform/projects/platform-upgrade-and-hosting"

# checklist section -> (source file key, first heading of the range, heading that ends it)
SECTIONS = [
    ("2.0 on staging", "staging", "## Steps", "## Changelog"),
    ("2.0 to production", "production", "## Steps", "## Roll back"),
    ("Deploy a SHA (Render)", "runbook", "## Deploy a SHA", "## When the deploy is refused"),
    ("Roll back the 2.0 backend", "runbook", "## Roll back", None),
    ("Roll back the 2.0 frontend", "production", "## Roll back", "## Changelog"),
    ("1.0 frontend hotfix", "hotfix-frontend", None, None),
    ("1.0 backend hotfix", "hotfix-backend", None, None),
]

STEP_LABEL = re.compile(r"^\s*(?:\d+[a-z]?\.\s+|-\s+)?\*\*([^*]+?)\*\*")
EVENT = re.compile(r"\*\*(Stop(?::[^*]*)?)\*\*|Done when")
ITEM = re.compile(r"^- \[ \] \*\*([^*]+?)\*\*")


def clean(label):
    return label.strip().rstrip(".:").strip()


def section(text, start, end):
    lines = text.splitlines()
    if start is None:
        return lines
    i = next(n for n, line in enumerate(lines) if line.strip() == start)
    j = len(lines)
    if end is not None:
        j = next(n for n, line in enumerate(lines) if n > i and line.strip() == end)
    return lines[i + 1:j]


def expected(lines):
    labels, step, errors = [], None, []
    for number, line in enumerate(lines, 1):
        opener = STEP_LABEL.match(line)
        if opener and not opener.group(1).startswith("Stop"):
            step = clean(opener.group(1))
        for event in EVENT.finditer(line):
            if event.group(1):
                label = clean(event.group(1))
                if label == "Stop":
                    errors.append(f"unnamed **Stop.** at section line {number}")
                labels.append(label)
            elif step is None:
                errors.append(f"'Done when' with no step label at section line {number}")
            else:
                labels.append(step)
    return labels, errors


def actual(checklist, heading):
    lines = checklist.splitlines()
    try:
        i = lines.index(f"## {heading}")
    except ValueError:
        return None
    items = []
    for line in lines[i + 1:]:
        if line.startswith("## "):
            break
        item = ITEM.match(line)
        if item:
            items.append(clean(item.group(1)))
        elif line.startswith("- [ ]"):
            items.append(f"UNNAMED ITEM: {line}")
    return items


def main(skill_dir, fe_root):
    skill, fe = Path(skill_dir), Path(fe_root)
    sources = {
        "staging": skill / "references/staging-2.0.md",
        "production": skill / "references/production-2.0.md",
        "hotfix-frontend": skill / "references/hotfix-1.0-frontend.md",
        "hotfix-backend": skill / "references/hotfix-1.0-backend.md",
        "runbook": fe / PROJECT / "RUNBOOK_RENDER.md",
    }
    checklist = (fe / PROJECT / "PUBLISH_CHECKLIST.md").read_text()
    failed = False
    for heading, key, start, end in SECTIONS:
        want, errors = expected(section(sources[key].read_text(), start, end))
        have = actual(checklist, heading)
        if have is None:
            print(f"MISSING SECTION: ## {heading}")
            failed = True
            continue
        for error in errors:
            print(f"{heading}: {error}")
            failed = True
        diff = list(difflib.unified_diff(want, have, f"{sources[key].name} ({heading})", f"PUBLISH_CHECKLIST.md ({heading})", lineterm=""))
        if diff:
            print("\n".join(diff))
            failed = True
    print("checklist matches sources" if not failed else "checklist drifted")
    return 1 if failed else 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1], sys.argv[2]))
