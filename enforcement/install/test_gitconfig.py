#!/usr/bin/env python3
"""Runs gitconfig.py against two throwaway repos under a temp dir; never touches ~/thoven."""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "gitconfig.py"
WANTED = {"fetch.prune": "true", "push.autoSetupRemote": "true", "branch.autoSetupMerge": "simple"}

tmp = Path(tempfile.mkdtemp(prefix="thv974.", dir="/tmp"))
env = dict(os.environ, GIT_CONFIG_GLOBAL=str(tmp / "gitconfig"), GIT_CONFIG_NOSYSTEM="1")
repos = [tmp / "frontend", tmp / "backend"]


def run(*args):
    return subprocess.run([sys.executable, str(SCRIPT), *args, *map(str, repos)],
                          capture_output=True, text=True, env=env, check=True).stdout


def local(repo, key):
    got = subprocess.run(["git", "-C", str(repo), "config", "--local", "--get", key],
                         capture_output=True, text=True, env=env)
    return got.stdout.strip()


def config(repo):
    return (repo / ".git" / "config").read_bytes()


def backup(repo):
    return repo / ".git" / "config.bak-thv974"


try:
    for repo in repos:
        subprocess.run(["git", "init", "-q", str(repo)], check=True, env=env)
    subprocess.run(["git", "-C", str(repos[1]), "config", "--local", "fetch.prune", "false"], check=True, env=env)
    originals = {repo: config(repo) for repo in repos}

    out = run()
    assert f"{repos[1]}: fetch.prune: false -> true" in out, out
    for repo in repos:
        assert config(repo) == originals[repo], f"dry run wrote {repo}"
        assert not backup(repo).exists(), f"dry run backed up {repo}"

    run("--apply")
    for repo in repos:
        for key, value in WANTED.items():
            assert local(repo, key) == value, f"{repo} {key}={local(repo, key)!r}"
        assert backup(repo).read_bytes() == originals[repo], f"{backup(repo)} is not the original config"

    applied = {repo: config(repo) for repo in repos}
    out = run("--apply")
    for repo in repos:
        assert config(repo) == applied[repo], f"second --apply changed {repo}"
        assert backup(repo).read_bytes() == originals[repo], f"second --apply rewrote {backup(repo)}"
    assert "Set " not in out, out
finally:
    assert tmp.name.startswith("thv974.") and str(tmp.parent) == "/tmp", tmp
    shutil.rmtree(tmp)

print("test_gitconfig: all passed")
