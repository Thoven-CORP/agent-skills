#!/usr/bin/env python3
"""Extract file-path pointers from skill markdown and test whether they resolve.

See check-skill-pointers.sh for usage. This is the implementation; invoke via
the shell wrapper, not directly, so the interface stays a .sh entry point.
"""
import glob
import os
import re
import sys
from collections import defaultdict

KNOWN_EXTS = {"ts", "tsx", "mjs", "js", "json", "css", "md", "sh", "rb", "yml", "yaml", "html"}

BACKTICK_RE = re.compile(r"`([^`\n]+)`")
MDLINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
TEMPLATE_RE = re.compile(r"<[A-Za-z][A-Za-z0-9_-]*>")


def looks_like_path(tok: str) -> bool:
    if not tok or tok.isspace():
        return False
    if tok.startswith("http://") or tok.startswith("https://"):
        return False
    if "/" in tok:
        return True
    if "." in tok:
        ext = tok.rsplit(".", 1)[-1].lower()
        if ext in KNOWN_EXTS:
            return True
    return False


def clean_candidate(tok: str) -> str:
    tok = tok.strip()
    # markdown links may carry a title: (path "Title")
    if " " in tok and tok.count('"') >= 1:
        tok = tok.split('"')[0].strip()
    # strip trailing anchors/query on link targets
    tok = tok.split("#")[0]
    # strip surrounding quotes/backticks/punctuation
    tok = tok.strip("`'\" ")
    tok = tok.rstrip(").,;:")
    return tok


def extract_candidates(text: str):
    seen = []
    for m in BACKTICK_RE.finditer(text):
        seen.append(m.group(1))
    for m in MDLINK_RE.finditer(text):
        seen.append(m.group(1))
    out = []
    for raw in seen:
        tok = clean_candidate(raw)
        # a backtick span can hold multiple words ("run `npm run build`");
        # only treat the whole span as one candidate if it reads as a single
        # path-shaped token (no internal whitespace), otherwise skip it.
        if " " in tok:
            continue
        if looks_like_path(tok):
            out.append(tok)
    return out


def classify_and_resolve(path: str, repo_roots, home, skill_dir, skills_dir):
    """Return (status, note) where status is one of:
    'resolved', 'dead', 'template'."""
    if TEMPLATE_RE.search(path):
        return "template", None

    is_pattern = any(c in path for c in ("*", "{"))

    bases = []
    if path.startswith("~/"):
        bases.append(os.path.join(home, path[2:]))
    elif path.startswith("/"):
        bases.append(path)
    else:
        # a bare relative path is tried relative to the skill file that
        # names it (its own references/ subdir is the common case),
        # relative to the skills root (a sibling-skill reference like
        # "other-skill/FILE.md"), and relative to each repo root (and that
        # root's parent, since some skills write e.g. "frontend/lib/..."
        # from one level up).
        bases.append(os.path.join(skill_dir, path))
        bases.append(os.path.join(skills_dir, path))
        for root in repo_roots:
            bases.append(os.path.join(root, path))
            bases.append(os.path.join(os.path.dirname(root.rstrip("/")), path))

    # a trailing ":NN" or ":NN-NN" is a line-number reference (common in
    # this codebase's "file.ts:53" citations), not part of the path.
    line_ref = re.search(r":\d+(-\d+)?$", path)
    if line_ref and not is_pattern:
        stripped = path[: line_ref.start()]
        more_bases = []
        if stripped.startswith("~/"):
            more_bases.append(os.path.join(home, stripped[2:]))
        elif stripped.startswith("/"):
            more_bases.append(stripped)
        else:
            more_bases.append(os.path.join(skill_dir, stripped))
            more_bases.append(os.path.join(skills_dir, stripped))
            for root in repo_roots:
                more_bases.append(os.path.join(root, stripped))
                more_bases.append(os.path.join(os.path.dirname(root.rstrip("/")), stripped))
        bases.extend(more_bases)

    for base in bases:
        if is_pattern:
            if glob.glob(base):
                return "resolved", None
        else:
            if os.path.exists(base):
                return "resolved", None

    return "dead", None


def main():
    if len(sys.argv) < 3:
        print("Usage: check-skill-pointers.py <skills-dir> <repo-root> [<repo-root-2> ...]", file=sys.stderr)
        return 2

    skills_dir = os.path.expanduser(sys.argv[1])
    repo_roots = [os.path.expanduser(r) for r in sys.argv[2:]]
    home = os.path.expanduser("~")

    total_pointers = 0
    dead_lines = []
    template_lines = []
    dead_by_skill = defaultdict(int)
    pointers_by_skill = defaultdict(int)

    # many entries under a skills dir are symlinks (e.g. ~/.claude/skills/*
    # -> ~/.agents/skills-on-demand/*); os.walk needs followlinks=True or it
    # silently skips everything inside them. Guard against symlink loops.
    seen_real_dirs = set()
    for dirpath, dirnames, filenames in os.walk(skills_dir, followlinks=True):
        real = os.path.realpath(dirpath)
        if real in seen_real_dirs:
            dirnames[:] = []
            continue
        seen_real_dirs.add(real)
        dirnames.sort()
        for fname in sorted(filenames):
            if not fname.lower().endswith(".md"):
                continue
            fpath = os.path.join(dirpath, fname)
            # skill name = top-level dir under skills_dir, falling back to filename
            rel = os.path.relpath(fpath, skills_dir)
            skill = rel.split(os.sep)[0] if os.sep in rel else fname

            try:
                with open(fpath, "r", errors="ignore") as f:
                    text = f.read()
            except OSError:
                continue

            for cand in extract_candidates(text):
                total_pointers += 1
                pointers_by_skill[skill] += 1
                status, _ = classify_and_resolve(cand, repo_roots, home, dirpath, skills_dir)
                if status == "dead":
                    dead_lines.append((skill, cand))
                    dead_by_skill[skill] += 1
                elif status == "template":
                    template_lines.append((skill, cand))

    for skill, path in dead_lines:
        print(f"{skill}: {path}")

    if template_lines:
        print()
        print("Templates, not checked:")
        for skill, path in template_lines:
            print(f"{skill}: {path}")

    print()
    print("=== Summary ===")
    print(f"Total pointers checked: {total_pointers}")
    print(f"Total dead: {len(dead_lines)}")
    print(f"Total templates (excluded): {len(template_lines)}")
    print()
    print("Per-skill dead-pointer breakdown (sorted by dead count):")
    for skill, count in sorted(dead_by_skill.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"  {count:3d}  {skill}  ({pointers_by_skill[skill]} pointers total)")

    return 1 if dead_lines else 0


if __name__ == "__main__":
    sys.exit(main())
