#!/usr/bin/env python3
"""Check that PUBLISH_CHECKLIST.md mirrors the /publish reference files.

Every `**Stop: <name>.**` and every "Done when" in a source section needs exactly
one checklist item, in the same order, named the same. A "Done when" takes the
name of the bold label that opens its step at column 0 (`3. **CI is green on that SHA.**`).
A "Done when" inside a step that opens with a Stop label belongs to that stop.
A checklist item is `- [ ] **<name>.** ...`.

It compares names, order, and the presence of each "Done when". It does not read
the text of a check, so a weakened condition under an unchanged name still passes.

Usage:
  check-publish-checklist.py <publish-skill-dir> <frontend-repo-root> [<git-ref>]

With <git-ref>, the frontend files are read from that ref (`git show`), so a
frontend checkout on another branch works. Prints a unified diff per section
(expected from the sources, actual from the checklist) and exits 1 on any
difference.
"""
import subprocess
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

SOURCE_NAMES = {
    "staging": "staging-2.0.md",
    "production": "production-2.0.md",
    "hotfix-frontend": "hotfix-1.0-frontend.md",
    "hotfix-backend": "hotfix-1.0-backend.md",
    "runbook": "RUNBOOK_RENDER.md",
}

STEP_LABEL = re.compile(r"^(?:\d+[a-z]?\.\s+|-\s+)?\*\*([^*]+?)\*\*")
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
        if opener:
            step = clean(opener.group(1))
        for event in EVENT.finditer(line):
            if event.group(1):
                label = clean(event.group(1))
                if label == "Stop":
                    errors.append(f"unnamed **Stop.** at section line {number}")
                labels.append(label)
            elif step is None:
                errors.append(f"'Done when' with no step label at section line {number}")
            elif not step.startswith("Stop"):
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


def reader(fe, ref):
    if ref is None:
        return lambda path: (fe / path).read_text()
    return lambda path: subprocess.run(
        ["git", "-C", str(fe), "show", f"{ref}:{path}"], check=True, capture_output=True, text=True
    ).stdout


def main(skill_dir, fe_root, ref=None):
    skill, fe = Path(skill_dir), Path(fe_root)
    read_fe = reader(fe, ref)
    sources = {
        "staging": skill / "references/staging-2.0.md",
        "production": skill / "references/production-2.0.md",
        "hotfix-frontend": skill / "references/hotfix-1.0-frontend.md",
        "hotfix-backend": skill / "references/hotfix-1.0-backend.md",
    }
    texts = {key: path.read_text() for key, path in sources.items()}
    texts["runbook"] = read_fe(f"{PROJECT}/RUNBOOK_RENDER.md")
    checklist = read_fe(f"{PROJECT}/PUBLISH_CHECKLIST.md")
    failed = False
    for heading, key, start, end in SECTIONS:
        want, errors = expected(section(texts[key], start, end))
        have = actual(checklist, heading)
        if have is None:
            print(f"MISSING SECTION: ## {heading}")
            failed = True
            continue
        for error in errors:
            print(f"{heading}: {error}")
            failed = True
        diff = list(difflib.unified_diff(want, have, f"{SOURCE_NAMES[key]} ({heading})", f"PUBLISH_CHECKLIST.md ({heading})", lineterm=""))
        if diff:
            print("\n".join(diff))
            failed = True
    print("checklist matches sources" if not failed else "checklist drifted")
    return 1 if failed else 0


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4):
        sys.exit(__doc__)
    sys.exit(main(*sys.argv[1:]))
