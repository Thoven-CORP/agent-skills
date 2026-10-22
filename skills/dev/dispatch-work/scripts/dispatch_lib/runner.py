"""The one place dispatch starts a subprocess. Tests pass a fake with the same signature."""
from __future__ import annotations

import subprocess
from dataclasses import dataclass
from typing import Callable, Sequence


@dataclass(frozen=True)
class Result:
    rc: int
    out: str
    err: str

    @property
    def ok(self) -> bool:
        return self.rc == 0


Runner = Callable[..., Result]


def run(argv: Sequence[str], input: str | None = None, timeout: float = 30) -> Result:
    try:
        p = subprocess.run(list(argv), input=input, capture_output=True, text=True, timeout=timeout)
        return Result(p.returncode, p.stdout, p.stderr)
    except FileNotFoundError as e:
        return Result(127, "", str(e))
    except subprocess.TimeoutExpired:
        return Result(124, "", f"timed out after {timeout}s: {argv[0]}")
    except OSError as e:
        return Result(126, "", str(e))
