#!/usr/bin/env python3
"""Part E of reapply-skill-patches.py against a throwaway skill tree under /tmp."""
import importlib.util
import shutil
import tempfile
from pathlib import Path

HOOK = Path(__file__).resolve().parents[1] / "hooks" / "reapply-skill-patches.py"
spec = importlib.util.spec_from_file_location("reapply", HOOK)
hook = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hook)

FLAG = "disable-model-invocation: true"

tmp = Path(tempfile.mkdtemp(prefix="skill-blocks.", dir="/tmp"))


def skill(name, front="", body="Body.\n"):
    d = tmp / name
    d.mkdir()
    (d / "SKILL.md").write_text(f"---\nname: {name}\ndescription: x\n{front}---\n{body}", encoding="utf-8")
    return d / "SKILL.md"


try:
    open_kept = skill("workspace")
    stray = skill("stray", body=f"This body mentions {FLAG} in prose.\n")
    already = skill("already", front=f"{FLAG}\n")
    snapshot = {p: p.read_text() for p in (open_kept, stray, already)}

    # Empty curated list: refuse, write nothing.
    assert hook.ensure_blocked(tmp, set(), set()) == []
    assert hook.ensure_blocked(tmp, {"workspace"}, set()) == []
    assert all(p.read_text() == t for p, t in snapshot.items()), "empty list must block nothing"

    # Curated list present: only the unlisted, unblocked skill gains the flag, in its frontmatter.
    assert hook.ensure_blocked(tmp, {"workspace"}, {"workspace"}) == ["stray"]
    head = stray.read_text().split("\n---", 1)[0]
    assert FLAG in head, "flag goes in the frontmatter"
    assert stray.read_text().count(FLAG) == 2, "body text is left alone"
    assert open_kept.read_text() == snapshot[open_kept]
    assert already.read_text() == snapshot[already]

    # Idempotent.
    assert hook.ensure_blocked(tmp, {"workspace"}, {"workspace"}) == []

    # Part C undoes it for a name that joins the list.
    assert hook.ensure_model_invocable(tmp, {"stray"}) == ["stray"]
    assert FLAG not in stray.read_text().split("\n---", 1)[0]
    print("ok")
finally:
    shutil.rmtree(tmp)
