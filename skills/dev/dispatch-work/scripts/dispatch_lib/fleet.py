"""`dispatch fleet`: the launchd agent that runs `dispatch tick` every 30 seconds."""
from __future__ import annotations

import os
import plistlib
import sys

from . import store
from .runner import Runner

LABEL = "co.thoven.dispatch-tick"


def plist_path() -> str:
    return os.path.expanduser(f"~/Library/LaunchAgents/{LABEL}.plist")


def log_path() -> str:
    return os.path.join(store.home(), "tick.log")


def plist(script: str) -> bytes:
    env = {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "HOME": os.path.expanduser("~")}
    if os.environ.get("THOVEN_DISPATCH_HOME"):
        env["THOVEN_DISPATCH_HOME"] = os.environ["THOVEN_DISPATCH_HOME"]
    # launchd's PATH finds only Apple's python3 3.9; pin the interpreter that installed the job.
    return plistlib.dumps({
        "Label": LABEL,
        "ProgramArguments": [sys.executable, "-I", script, "tick"],
        "StartInterval": 30,
        "RunAtLoad": True,
        "EnvironmentVariables": env,
        "StandardOutPath": log_path(),
        "StandardErrorPath": log_path(),
    })


def domain() -> str:
    return f"gui/{os.getuid()}"


def install(run: Runner, script: str) -> list[str]:
    os.makedirs(os.path.dirname(plist_path()), exist_ok=True)
    os.makedirs(store.home(), exist_ok=True)
    run(["launchctl", "bootout", f"{domain()}/{LABEL}"])
    with open(plist_path(), "wb") as f:
        f.write(plist(script))
    res = run(["launchctl", "bootstrap", domain(), plist_path()])
    if not res.ok:
        return [f"launchctl bootstrap failed: {res.err.strip()}"]
    return [f"installed {plist_path()}", f"log {log_path()}"]


def uninstall(run: Runner) -> list[str]:
    run(["launchctl", "bootout", f"{domain()}/{LABEL}"])
    if os.path.exists(plist_path()):
        os.unlink(plist_path())
        return [f"removed {plist_path()}"]
    return ["not installed"]


def status(run: Runner) -> tuple[bool, list[str]]:
    loaded = run(["launchctl", "print", f"{domain()}/{LABEL}"]).ok
    lines = [f"plist {plist_path()} {'present' if os.path.exists(plist_path()) else 'absent'}",
             f"launchd {LABEL} {'loaded' if loaded else 'not loaded'}",
             f"log {log_path()}"]
    try:
        with open(log_path(), encoding="utf-8") as f:
            lines += ["  " + line.rstrip("\n") for line in f.readlines()[-5:]]
    except OSError:
        pass
    return loaded, lines
