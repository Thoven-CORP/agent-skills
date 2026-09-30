"""Helpers every installer shares: the deny list, one-time backups, copies."""
import json
import shutil
import stat
from pathlib import Path

ENFORCEMENT_DIR = Path(__file__).resolve().parent.parent
GUARD = ENFORCEMENT_DIR / "hooks" / "thoven-guard-bash"
DENY_JSON = ENFORCEMENT_DIR / "config" / "deny.json"
BACKUP_SUFFIX = ".bak-thv969"


def load_denies() -> list:
    """The guard's unconditional denies, as [{"argv": [...], "why": "..."}]."""
    return json.loads(DENY_JSON.read_text())["commands"]


def backup_once(path: Path) -> None:
    if not path.exists():
        return
    backup = path.with_name(path.name + BACKUP_SUFFIX)
    if backup.exists():
        return
    shutil.copy2(path, backup)
    print(f"Backed up {path} to {backup}")


def needs_copy(src: Path, dest: Path) -> bool:
    return not dest.exists() or dest.read_bytes() != src.read_bytes()


def copy_file(src: Path, dest: Path, executable: bool = False) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    backup_once(dest)
    shutil.copy2(src, dest)
    if executable:
        dest.chmod(dest.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    print(f"Copied {src} -> {dest}")


def read_json(path: Path, default):
    return json.loads(path.read_text()) if path.exists() else default


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    backup_once(path)
    path.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Wrote {path}")


def add_missing(items: list, wanted: list) -> list:
    """Appends each wanted entry not already in items. Returns what was added."""
    added = [w for w in wanted if w not in items]
    items.extend(added)
    return added
