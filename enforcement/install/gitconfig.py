#!/usr/bin/env python3
"""Sets repo-local git config in the Thoven checkouts: prune on fetch, and a new branch's first
push sets its own upstream.

Dry run by default. Pass --apply to write. Repos default to ~/thoven/frontend and ~/thoven/backend.
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

WANTED = {"fetch.prune": "true", "push.autoSetupRemote": "true", "branch.autoSetupMerge": "simple"}
DEFAULT_REPOS = [Path.home() / "thoven" / "frontend", Path.home() / "thoven" / "backend"]
BACKUP_SUFFIX = ".bak-thv974"


def git(repo: Path, *args) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)


def config_file(repo: Path):
    got = git(repo, "rev-parse", "--path-format=absolute", "--git-common-dir")
    return Path(got.stdout.strip()) / "config" if got.returncode == 0 else None


def local(repo: Path, key: str):
    got = git(repo, "config", "--local", "--get", key)
    return got.stdout.strip() if got.returncode == 0 else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write changes; default is dry run")
    parser.add_argument("repos", nargs="*", type=Path, default=DEFAULT_REPOS)
    args = parser.parse_args()

    failed = False
    for repo in args.repos:
        config = config_file(repo)
        if config is None:
            print(f"{repo}: not a git checkout, skipped")
            failed = True
            continue
        todo = []
        for key, value in WANTED.items():
            have = local(repo, key)
            print(f"{repo}: {key}: {have or '(unset)'} -> {value}" if have != value else f"{repo}: {key}: {value} (already set)")
            if have != value:
                todo.append((key, value))
        if not args.apply or not todo:
            continue
        backup = config.with_name(config.name + BACKUP_SUFFIX)
        if not backup.exists():
            shutil.copy2(config, backup)
            print(f"Backed up {config} to {backup}")
        for key, value in todo:
            if git(repo, "config", "--local", key, value).returncode == 0:
                print(f"Set {key}={value} in {repo}")
            else:
                print(f"{repo}: git config --local {key} {value} failed", file=sys.stderr)
                failed = True

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
