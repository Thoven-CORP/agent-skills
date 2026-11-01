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
PY_FROM = re.compile(r"(?m)^\s*from\s+([.\w]+)\s+import\s+(.+)$")
PY_DECL = re.compile(r"^\s*-\s*(?:async\s+)?(?:def|class)\s+([A-Za-z_]\w*)\b")
RB_DECL = re.compile(r"^\s*-\s*(?:def(?:\s+self\.)?|class\s+|module\s+)([A-Za-z_]\w*)\b")
RB_REQUIRE = re.compile(r"\brequire_relative\s*\(?\s*['\"]([^'\"]+)['\"]\s*\)?")
JS_EXTS = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")
IMPORT_KEYWORD = re.compile(r"\b(?:from|import|require)\b")
# TypeScript resolves `./x.js` to x.ts, so an explicit JS-family extension also tries these.
JS_TO_TS = {".js": (".ts", ".tsx"), ".jsx": (".tsx",), ".mjs": (".mts",), ".cjs": (".cts",)}


def git(root: Path, *args: str) -> str:
    result = subprocess.run(["git", "-C", str(root), *args], text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def in_string_literal(text: str, pos: int) -> bool:
    """True when `pos` sits inside a '...', "..." or `...` literal opened earlier on its line.

    Used for JS-family sources only: `plant: "import x from './gone'"` is a fixture that names a
    module, not an import. A literal spanning lines is not tracked."""
    quote = ""
    escaped = False
    for char in text[text.rfind("\n", 0, pos) + 1:pos]:
        if escaped:
            escaped = False
        elif char == "\\" and quote:
            escaped = True
        elif quote:
            if char == quote:
                quote = ""
        elif char in "'\"`":
            quote = char
    return bool(quote)


def module_key(path: str) -> str:
    """The module a path names: no extension, and `x/index` is `x`, as TypeScript resolves it."""
    stem = target_path(path)
    return stem[:-len("/index")] if stem.endswith("/index") else stem


def resolves(specifier: str, importer: str, paths) -> bool:
    """True when the specifier still names an existing file or directory index at HEAD."""
    spec = specifier.replace("\\", "/")
    if spec.startswith(("./", "../")):
        base = posixpath.normpath(posixpath.join(posixpath.dirname(importer), spec))
    else:
        base = spec.removeprefix("@/")
    candidates = [base]
    for ext, replacements in JS_TO_TS.items():
        if base.endswith(ext):
            candidates += [base[:-len(ext)] + new for new in replacements]
    candidates += [base + ext for ext in SOURCE_EXTS]
    candidates += [f"{base}/index{ext}" for ext in SOURCE_EXTS]
    return any(candidate in paths for candidate in candidates)


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
    language = "python" if old_path.endswith(".py") else "ruby" if old_path.endswith(".rb") else "javascript"
    for line in patch_for(root, merge, old_path):
        if language == "javascript":
            match = EXPORT.match(line)
            if match:
                found.add((match.group(1), False, language))
            if re.match(r"^\s*-\s*export\s+default\b", line):
                found.add(("", True, language))
        else:
            match = (PY_DECL if language == "python" else RB_DECL).match(line)
            if match:
                found.add((match.group(1), False, language))
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


def target_path(path: str) -> str:
    return path.rsplit(".", 1)[0] if path.endswith(SOURCE_EXTS) else path


DEFAULT_EXPORT = [re.compile(r"(?m)^\s*export\s+default\b"), re.compile(r"\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}")]


def declared_in_target(files, old_path: str, name: str, language: str) -> bool:
    """Ignore a removal only when that same module still declares the symbol.

    A removed `export default` line counts as removed only if the module has no default export at
    HEAD: wrapping a page in Suspense deletes the line and re-adds it lower in the same file."""
    target = module_key(old_path)
    if not name:
        return language == "javascript" and any(
            module_key(rel) == target and any(pattern.search(text) for pattern in DEFAULT_EXPORT)
            for rel, text in files)
    patterns = {
        "javascript": [
            re.compile(r"\bexport\s+(?:(?:declare|default|async)\s+)*(?:function|class|const|let|var|interface|type|enum)\s+" + re.escape(name) + r"\b"),
            # Covers `export { X }`, `export type { X }`, and the `... from '...'` re-export forms.
            re.compile(r"\bexport\s*(?:type\s*)?\{[^}]*\b" + re.escape(name) + r"\b[^}]*\}"),
        ],
        "python": [re.compile(r"(?m)^\s*(?:async\s+)?(?:def|class)\s+" + re.escape(name) + r"\b")],
        "ruby": [re.compile(r"(?m)^\s*(?:def(?:\s+self\.)?|class\s+|module\s+)" + re.escape(name) + r"\b")],
    }[language]
    return any(module_key(rel) == target and any(pattern.search(text) for pattern in patterns)
               for rel, text in files)


def python_target_matches(specifier: str, old_path: str, importer: str) -> bool:
    leading = len(specifier) - len(specifier.lstrip("."))
    module = specifier[leading:]
    if leading:
        base = posixpath.dirname(importer)
        for _ in range(max(0, leading - 1)):
            base = posixpath.dirname(base)
        normalized = posixpath.normpath(posixpath.join(base, module.replace(".", "/")))
    else:
        normalized = module.replace(".", "/")
    old = target_path(old_path)
    return normalized == old or normalized.endswith("/" + old) or old.endswith("/" + normalized)


def python_imports(text: str):
    for match in PY_FROM.finditer(text):
        module, names = match.groups()
        imported = {item.strip().split(" as ", 1)[0].strip().split(".")[-1]
                    for item in names.strip().strip("()").split(",") if item.strip()}
        yield module, imported, match.start()


def callers(files, old_path: str, name: str, is_default: bool, language: str):
    if language == "javascript":
        for rel, text in files:
            for match in IMPORT.finditer(text):
                if rel.endswith(JS_EXTS) and in_string_literal(text, match.start()):
                    continue
                bindings = match.group(1) or ""
                spec = match.group(2) or match.group(3) or ""
                if target_matches(spec, old_path, rel) and (is_default or re.search(r"\b" + re.escape(name) + r"\b", bindings)):
                    line = text.count("\n", 0, match.start()) + 1
                    yield f"{rel}:{line}: imports removed {'default export' if is_default else 'export ' + name} from {spec}"
    elif language == "python":
        for rel, text in files:
            for spec, imported, offset in python_imports(text):
                if python_target_matches(spec, old_path, rel) and name in imported:
                    line = text.count("\n", 0, offset) + 1
                    yield f"{rel}:{line}: imports removed Python name {name} from {spec}"
    else:
        for rel, text in files:
            for match in RB_REQUIRE.finditer(text):
                spec = match.group(1)
                if not target_matches(spec, old_path, rel):
                    continue
                line = text.count("\n", 0, match.start()) + 1
                code = "\n".join(part.split("#", 1)[0] for part in text.splitlines())
                if re.search(r"\b" + re.escape(name) + r"\b", code):
                    yield f"{rel}:{line}: requires removed Ruby name {name} from {spec}"


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
        paths = {rel for rel in git(root, "ls-files", "-co", "--exclude-standard", "-z").split("\0")
                 if rel and (root / rel).is_file()}
    except RuntimeError as error:
        print(f"thoven-stale-ref-calls: {error}", file=sys.stderr)
        return 2
    found = set()
    for kind, old_path, _new_path in records:
        if not old_path:
            continue
        if kind in ("D", "R"):
            stale = re.compile(r"['\"]((?:\.{1,2}/|@/)?[^'\"]*" + re.escape(old_path.rsplit(".", 1)[0]) + r"(?:\.[A-Za-z0-9]+)?)['\"]")
            for rel, _text in files:
                if rel == old_path:
                    continue
                for line_no, line in enumerate(_text.splitlines(), 1):
                    for keyword in IMPORT_KEYWORD.finditer(line):
                        if rel.endswith(JS_EXTS) and in_string_literal(line, keyword.start()):
                            continue
                        match = stale.search(line, keyword.end())
                        if match and not resolves(match.group(1), rel, paths):
                            found.add(f"{rel}:{line_no}: references removed path {old_path}")
                            break
        for name, is_default, language in removed_exports(root, merge, old_path):
            if declared_in_target(files, old_path, name, language):
                continue
            found.update(callers(files, old_path, name, is_default, language))
    for finding in sorted(found):
        print(finding)
    return 1 if found else 0


if __name__ == "__main__":
    raise SystemExit(main())
