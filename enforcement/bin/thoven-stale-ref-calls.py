#!/usr/bin/env python3
"""Report current callers of paths and exports removed since a base revision."""
import posixpath
from pathlib import Path
import re
import subprocess
import sys


EXCLUDED = re.compile(r"/(?:archive|_archive|audit|audits|history|tests|node_modules|\.git|\.next|coverage|tmp|log|vendor|storage|public)/")
SOURCE_EXTS = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".rb")
EXPORT = re.compile(r"^\s*-\s*export\s+(?:(?:declare|default|async)\s+)*(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)")
IMPORT = re.compile(r"\bimport\s+([\s\S]*?)\s+from\s*['\"]([^'\"]+)['\"]|\brequire\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", re.M)
IMPORT_NAME = re.compile(r"\b([A-Za-z_$][\w$]*)\b")


def git(root: Path, *args: str) -> str:
    result = subprocess.run(["git", "-C", str(root), *args], text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def merge_base(root: Path, base: str) -> str:
    return git(root, "merge-base", base, "HEAD").strip()


def changes(root: Path, base: str):
    merge = merge_base(root, base)
    records = []
    for args in (("diff", "--name-status", "--find-renames", "-z", f"{merge}...HEAD"),
                 ("diff", "--name-status", "--find-renames", "-z", "HEAD")):
        fields = git(root, *args).split("\0")
        i = 0
        while i < len(fields) - 1:
            status = fields[i]
            i += 1
            if not status:
                continue
            if status.startswith("R") or status.startswith("C"):
                old, new = fields[i], fields[i + 1]
                i += 2
                records.append((status[0], old, new))
            else:
                path = fields[i]
                i += 1
                if status[0] in ("A", "M", "D"):
                    records.append((status[0], path, ""))
    return merge, records


def current_files(root: Path):
    files = git(root, "ls-files", "-co", "--exclude-standard", "-z").split("\0")
    for rel in files:
        path = root / rel
        if rel and path.is_file() and not EXCLUDED.search("/" + rel):
            try:
                if path.stat().st_size <= 2_000_000:
                    yield rel, path.read_text(errors="ignore")
            except OSError:
                continue


def patch_for(root: Path, merge: str, path: str):
    for args in (("diff", "-U0", f"{merge}...HEAD", "--", path), ("diff", "-U0", "HEAD", "--", path)):
        result = subprocess.run(["git", "-C", str(root), *args], text=True, capture_output=True)
        if result.returncode == 0:
            yield from result.stdout.splitlines()


def removed_exports(root: Path, merge: str, old_path: str):
    found = set()
    for line in patch_for(root, merge, old_path):
        match = EXPORT.match(line)
        if match:
            found.add((match.group(1), False))
        if re.match(r"^\s*-\s*export\s+default\b", line):
            found.add(("", True))
    return found


def target_matches(specifier: str, old_path: str, importer: str) -> bool:
    spec = specifier.replace("\\", "/")
    old = old_path.replace("\\", "/")
    if old.endswith(SOURCE_EXTS):
        old = old.rsplit(".", 1)[0]
    if spec.startswith(("./", "../")):
        normalized = posixpath.normpath(posixpath.join(posixpath.dirname(importer), spec))
    else:
        normalized = spec.removeprefix("@/")
    return normalized == old or normalized.endswith("/" + old) or old.endswith("/" + normalized)


def declared_in_target(files, old_path: str, name: str) -> bool:
    """Ignore a removal only when the same module still exports that symbol."""
    if not name:
        return False
    target = old_path.rsplit(".", 1)[0] if old_path.endswith(SOURCE_EXTS) else old_path
    decl = re.compile(r"\bexport\s+(?:(?:declare|default|async)\s+)*(?:function|class|const|let|var|interface|type|enum)\s+" + re.escape(name) + r"\b")
    named = re.compile(r"\bexport\s*\{[^}]*\b" + re.escape(name) + r"\b[^}]*\}")
    return any(
        (rel.rsplit(".", 1)[0] if rel.endswith(SOURCE_EXTS) else rel) == target
        and (decl.search(text) or named.search(text))
        for rel, text in files
    )


def callers(files, old_path: str, name: str, is_default: bool):
    for rel, text in files:
        for match in IMPORT.finditer(text):
            bindings = match.group(1) or ""
            spec = match.group(2) or match.group(3) or ""
            if target_matches(spec, old_path, rel) and (is_default or re.search(r"\b" + re.escape(name) + r"\b", bindings)):
                line = text.count("\n", 0, match.start()) + 1
                yield f"{rel}:{line}: imports removed {'default export' if is_default else 'export ' + name} from {spec}"


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: thoven-stale-ref-calls.py <base> <git-root>", file=sys.stderr)
        return 2
    base, root_arg = sys.argv[1:]
    root = Path(root_arg).resolve()
    if not root.is_dir() or subprocess.run(["git", "-C", str(root), "rev-parse", "--git-dir"], capture_output=True).returncode:
        print(f"thoven-stale-ref-calls: not a git root: {root}", file=sys.stderr)
        return 2
    try:
        merge, records = changes(root, base)
        files = list(current_files(root))
    except RuntimeError as error:
        print(f"thoven-stale-ref-calls: {error}", file=sys.stderr)
        return 2
    found = set()
    for kind, old_path, _new_path in records:
        if not old_path:
            continue
        if kind in ("D", "R"):
            for rel, _text in files:
                if rel == old_path:
                    continue
                for line_no, line in enumerate(_text.splitlines(), 1):
                    if re.search(r"\b(?:from|import|require)\b[^\n]*['\"](?:\.{1,2}/|@/)?[^'\"]*" + re.escape(old_path.rsplit(".", 1)[0]) + r"(?:\.[A-Za-z0-9]+)?['\"]", line):
                        found.add(f"{rel}:{line_no}: references removed path {old_path}")
        for name, is_default in removed_exports(root, merge, old_path):
            if name and declared_in_target(files, old_path, name):
                continue
            found.update(callers(files, old_path, name, is_default))
    for finding in sorted(found):
        print(finding)
    return 1 if found else 0


if __name__ == "__main__":
    raise SystemExit(main())
