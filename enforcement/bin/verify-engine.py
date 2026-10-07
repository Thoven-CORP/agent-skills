#!/usr/bin/env python3
"""Run focused checks for changed agent-skills tooling and issue a local receipt."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time


def run(args: list[str], *, cwd: Path, check: bool = False) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True, timeout=10)
    if check and result.returncode:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or f"{args!r} failed")
    return result


def git(root: Path, *args: str, check: bool = True) -> str:
    return run(["git", "-C", str(root), *args], cwd=root, check=check).stdout.strip()


def find_root() -> Path:
    return Path(git(Path.cwd(), "rev-parse", "--show-toplevel")).resolve()


def merge_base(root: Path, base: str) -> str:
    return git(root, "merge-base", base, "HEAD")


def fingerprint(root: Path, base: str, merge: str) -> str:
    digest = hashlib.sha256()
    for value in (str(root), base, merge, git(root, "rev-parse", "HEAD"),
                  git(root, "diff", "--binary", merge, "--"),
                  git(root, "diff", "--cached", "--binary", "--"),
                  git(root, "ls-files", "--stage", "-z")):
        digest.update(value.encode())
        digest.update(b"\0")
    names = set(git(root, "ls-files", "-z").split("\0"))
    names.update(git(root, "ls-files", "--others", "--exclude-standard", "-z").split("\0"))
    for name in sorted(names - {""}):
        path = root / name
        digest.update(name.encode() + b"\0")
        if not path.exists() and not path.is_symlink():
            digest.update(b"deleted")
            continue
        digest.update(str(path.lstat().st_mode).encode())
        if path.is_symlink():
            digest.update(os.readlink(path).encode())
            target = path.resolve()
            if not target.is_relative_to(root):
                raise RuntimeError(f"external symlink requires review: {name}")
        if path.is_file():
            digest.update(path.read_bytes())
    return digest.hexdigest()


def changed_paths(root: Path, base: str, merge: str) -> list[str]:
    names = set()
    for args in (("diff", "--name-only", "-z", merge, "HEAD", "--"),
                 ("diff", "--name-only", "-z", "HEAD", "--"),
                 ("ls-files", "--others", "--exclude-standard", "-z")):
        names.update(filter(None, git(root, *args).split("\0")))
    return sorted(names)


def evidence_path(root: Path) -> Path:
    path = Path(git(root, "rev-parse", "--git-path", "thoven-verify.json"))
    return (root / path).resolve() if not path.is_absolute() else path


def write_receipt(path: Path, receipt: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix="thoven-verify-", dir=path.parent)
    try:
        with os.fdopen(fd, "w") as stream:
            json.dump(receipt, stream, sort_keys=True)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def check_evidence(root: Path, supplied: dict) -> int:
    try:
        stored = json.loads(evidence_path(root).read_text())
        base = git(root, "rev-parse", f"{stored['baseRef']}^{{commit}}")
        merge = merge_base(root, base)
        expected = checks_for(root, changed_paths(root, base, merge))
        rows = stored["rows"]
        valid = (stored == supplied and stored["version"] == 1
                 and stored["repo"] == str(root) and stored["base"] == base
                 and stored["head"] == git(root, "rev-parse", "HEAD")
                 and stored["mergeBase"] == merge
                 and stored["fingerprint"] == fingerprint(root, base, merge)
                 and stored["status"] == "PASS" and bool(expected)
                 and isinstance(stored["seconds"], (int, float))
                 and isinstance(rows, list)
                 and [(r["id"], r["command"]) for r in rows] == expected
                 and all(r["status"] == "PASS" and isinstance(r["seconds"], (int, float)) for r in rows))
    except (OSError, ValueError, KeyError, TypeError, RuntimeError):
        valid = False
    if not valid:
        print("bin/verify: evidence is missing, stale, or mismatches required checks", file=sys.stderr)
    return 0 if valid else 1


def checks_for(root: Path, paths: list[str]) -> list[tuple[str, list[str]]]:
    if not paths:
        return []
    existing = [p for p in paths if (root / p).is_file()]
    checks: list[tuple[str, list[str]]] = [("diff-check", ["git", "diff", "--check", "HEAD"])]

    if any(p.startswith("herdr/plugins/thoven-workflow/verify/") and p.endswith(".py") for p in existing):
        checks.append(("done-verifier-tests", [sys.executable, "-m", "unittest", "discover", "-s", "herdr/plugins/thoven-workflow/verify", "-p", "test_*.py"]))
    for path in existing:
        first = (root / path).read_text(errors="replace").splitlines()[:1]
        if path.endswith(".py") or (first and "python3" in first[0] and first[0].startswith("#!")):
            checks.append((f"py-compile:{path}", [sys.executable, "-c", "import pathlib,sys; compile(pathlib.Path(sys.argv[1]).read_text(),sys.argv[1],'exec')", path]))
        if path.endswith(".sh") or ("/" in path and ("/bin/" in f"/{path}" or "/hooks/" in f"/{path}") and first and first[0].startswith("#!") and ("bash" in first[0] or "sh" in first[0])):
            checks.append((f"shellcheck:{path}", ["shellcheck", path]))
    if any(path.endswith(("thoven-stale-refs", "thoven-stale-refs-test", "thoven-stale-ref-calls.py")) for path in paths):
        checks.append(("stale-refs-canaries", ["enforcement/bin/thoven-stale-refs-test"]))
    if any(path in ("bin/verify", "enforcement/bin/verify-engine.py", "enforcement/bin/test-verify.py") for path in paths):
        checks.append(("verify-receipt-canaries", [sys.executable, "enforcement/bin/test-verify.py"]))
    if any(path.endswith(("thoven-track-edits", "test-track-edits.py")) for path in paths):
        checks.append(("edit-tracker-canaries", [sys.executable, "enforcement/bin/test-track-edits.py"]))
    return checks


def terminate(child):
    try:
        os.killpg(child.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        child.wait(timeout=2)
    except subprocess.TimeoutExpired:
        os.killpg(child.pid, signal.SIGKILL)
        child.wait()
    try:
        os.killpg(child.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass


def execute(command, root):
    fd = os.environ.get("THOVEN_VERIFY_LOCK_FD")
    with tempfile.TemporaryFile(mode="w+") as output:
        child = subprocess.Popen(command, cwd=root, stdout=output, stderr=output,
                                 start_new_session=True, pass_fds=(int(fd),) if fd else ())
        try:
            code = child.wait(timeout=300)
        finally:
            terminate(child)
        output.seek(0)
        return code, output.read()


def verify(root: Path, base: str) -> int:
    base_ref = base
    started_all = time.monotonic()
    receipt_file = evidence_path(root)
    receipt_file.unlink(missing_ok=True)
    rows = []
    status = "BLOCKED"
    initial_fingerprint = None
    merge = None
    head = git(root, "rev-parse", "HEAD")
    try:
        base = git(root, "rev-parse", f"{base}^{{commit}}")
        merge = merge_base(root, base)
        paths = changed_paths(root, base, merge)
        initial_fingerprint = fingerprint(root, base, merge)
        plan = checks_for(root, paths)
        if not plan:
            raise RuntimeError("no changed paths; no verification claim")
        for row_id, command in plan:
            started = time.monotonic()
            code, output = execute(command, root)
            rows.append({"id": row_id, "command": command, "status": "PASS" if code == 0 else "FAIL",
                         "seconds": round(time.monotonic() - started, 3)})
            if code:
                print(f"FAIL {row_id} (exit {code})\n{output}", file=sys.stderr)
        if fingerprint(root, base, merge) != initial_fingerprint or changed_paths(root, base, merge) != paths:
            raise RuntimeError("repository changed during verification")
        status = "PASS" if all(row["status"] == "PASS" for row in rows) else "FAIL"
    except (OSError, RuntimeError, subprocess.TimeoutExpired, KeyboardInterrupt) as error:
        print(f"BLOCKED: {error}", file=sys.stderr)
    receipt = {"version": 1, "repo": str(root), "head": head, "base": base, "baseRef": base_ref, "mergeBase": merge,
               "fingerprint": initial_fingerprint, "seconds": round(time.monotonic() - started_all, 3),
               "status": status, "rows": rows}
    if status == "PASS":
        write_receipt(receipt_file, receipt)
    print("THOVEN_VERIFY_BEGIN")
    print(json.dumps(receipt, separators=(",", ":"), sort_keys=True))
    print("THOVEN_VERIFY_END")
    return 0 if status == "PASS" else 1 if status == "FAIL" else 2


def interrupted(_signal, _frame):
    raise KeyboardInterrupt


def main() -> int:
    signal.signal(signal.SIGTERM, interrupted)
    root = find_root()
    if len(sys.argv) == 2 and sys.argv[1] == "--check-evidence":
        try:
            supplied = json.load(sys.stdin)
        except json.JSONDecodeError:
            print("bin/verify: evidence input is not JSON", file=sys.stderr)
            return 2
        if not isinstance(supplied, dict):
            return 2
        return check_evidence(root, supplied)
    if len(sys.argv) > 3 or (len(sys.argv) > 1 and sys.argv[1] != "--base") or (len(sys.argv) > 1 and len(sys.argv) != 3):
        print("usage: bin/verify [--base <ref>] | bin/verify --check-evidence", file=sys.stderr)
        return 2
    base = sys.argv[2] if len(sys.argv) == 3 else os.environ.get("THOVEN_VERIFY_BASE", "origin/main")
    return verify(root, base)


if __name__ == "__main__":
    raise SystemExit(main())
