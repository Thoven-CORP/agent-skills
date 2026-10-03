#!/usr/bin/env python3
"""The one reader of config/agents.toml: which CLI, model and effort a tier or a pick resolves to (THV-1077).

  agents.py tiers                         tier, cli, model, effort, and a label per line (TSV)
  agents.py resolve <tier>                cli, model, effort for one tier (TSV)
  agents.py launch <cli> <model> [effort] NUL-separated arguments for `herdr agent start ... --`
  agents.py launch-line <tier>            the `herdr agent start` line for a tier, for a human or a brief
  agents.py meta <cli> <model> [effort]   kind, label, skill prefix (TSV)
  agents.py clis                          cli, state (ready, unwired, missing), label (TSV)
  agents.py models <cli>                  model id and label per line (TSV), config first, then live
  agents.py efforts <cli> <model>         effort number and word per line (TSV)
  agents.py check                         exit 1 when a tier names a model or effort its CLI lacks
  agents.py set-tier <n> <cli> <model> [effort]   rewrite tier n in agents.toml (checked first)
  agents.py add-cli <name> <block.toml>           append a checked [cli.<name>] block

effort is a number from 1, the lowest level in the model's list. The config is found at
$THOVEN_AGENTS_CONFIG, else ~/thoven/agent-skills/config/agents.toml, else the checkout this
script sits in.
"""
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import tomllib

HERE = os.path.dirname(os.path.abspath(__file__))


def config_path():
    for path in (
        os.environ.get("THOVEN_AGENTS_CONFIG", ""),
        os.path.expanduser("~/thoven/agent-skills/config/agents.toml"),
        os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", "config", "agents.toml")),
    ):
        if path and os.path.exists(path):
            return path
    sys.exit("agents.py: no agents.toml (set THOVEN_AGENTS_CONFIG)")


def load():
    with open(config_path(), "rb") as f:
        return tomllib.load(f)


def cli_spec(cfg, cli):
    spec = cfg.get("cli", {}).get(cli)
    if not spec:
        sys.exit(f"agents.py: no [cli.{cli}] in {config_path()}")
    return spec


def live_models(spec):
    """[(id, label, efforts or None)] from the CLI's live list, or [] when it has none or fails."""
    source = spec.get("models_from")
    if source == "codex-cache":
        try:
            with open(os.path.expanduser("~/.codex/models_cache.json")) as f:
                rows = json.load(f).get("models", [])
        except (OSError, ValueError):
            return []
        return [
            (m["slug"], m.get("display_name", m["slug"]),
             [lvl["effort"] for lvl in m.get("supported_reasoning_levels", [])] or None)
            for m in rows if m.get("slug") and m.get("visibility") != "hide"
        ]
    if isinstance(source, dict):
        try:
            out = subprocess.run(shlex.split(source["cmd"]), capture_output=True, text=True, timeout=20).stdout
        except (OSError, subprocess.SubprocessError):
            return []
        lines = out.splitlines()
        rows_from = lines
        if source.get("after"):
            # Only the block under a heading: help text has other indented lines the pattern would catch.
            start = next((i + 1 for i, line in enumerate(lines) if line.strip() == source["after"]), len(lines))
            end = next((i for i in range(start, len(lines)) if not lines[i].strip()), len(lines))
            rows_from = lines[start:end]
        levels = {}
        if source.get("efforts_pattern"):
            ep = re.compile(source["efforts_pattern"])
            for m in filter(None, map(ep.match, lines)):
                levels[m.group(1).strip()] = [w.strip() for w in m.group(2).split(",") if w.strip()] or None
        pattern = re.compile(source["pattern"])
        return [(m.group(1), m.group(2).strip(), levels.get(m.group(2).strip()))
                for m in map(pattern.match, rows_from) if m]
    return []


def models(cfg, cli):
    """[(id, label, efforts or None)]: the config's ids first, then live ids it lacks."""
    spec = cli_spec(cfg, cli)
    live = {m[0]: m for m in live_models(spec)}
    rows = [live.get(i, (i, i, None)) for i in spec.get("models", [])]
    seen = {r[0] for r in rows}
    return rows + [m for i, m in live.items() if i not in seen]


def efforts(cfg, cli, model):
    for mid, _, levels in models(cfg, cli):
        if mid == model and levels:
            return levels
    return cli_spec(cfg, cli).get("efforts", [])


def effort_word(cfg, cli, model, effort):
    levels = efforts(cfg, cli, model)
    if not levels:
        return ""
    n = int(effort) if str(effort or "").isdigit() else 0
    if not 1 <= n <= len(levels):
        sys.exit(f"agents.py: effort {effort!r} for {cli} {model}; pick 1 to {len(levels)} ({', '.join(levels)})")
    return levels[n - 1]


def label(cfg, cli, model, effort):
    word = effort_word(cfg, cli, model, effort)
    return f"{cli_spec(cfg, cli).get('label', cli)}  {model}" + (f"  {effort} {word}" if word else "")


def launch(cfg, cli, model, effort):
    spec = cli_spec(cfg, cli)
    word = effort_word(cfg, cli, model, effort)
    line = spec["launch"].replace("{model}", model).replace("{effort}", word)
    if "{settings_file}" in line:
        # A CLI that takes its model only from a settings file (Droid): write one per pick.
        body = spec["settings"].replace("{model}", model).replace("{effort}", word)
        folder = os.path.expanduser("~/.cache/thoven/agents")
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, f"{cli}.{model}.{word or 'default'}.json")
        with open(path, "w") as f:
            f.write(body + "\n")
        line = line.replace("{settings_file}", path)
    return shlex.split(line)


def add_cli(cfg, name, block_path):
    """Append a [cli.<name>] block from a file, after checking it parses and has the required keys."""
    block = open(block_path, encoding="utf-8").read().strip()
    try:
        spec = tomllib.loads(block).get("cli", {}).get(name)
    except tomllib.TOMLDecodeError as e:
        sys.exit(f"agents.py: the block is not valid TOML: {e}")
    if not spec:
        sys.exit(f"agents.py: the block has no [cli.{name}] table")
    missing = [k for k in ("kind", "label", "skill_prefix", "launch") if k not in spec]
    if missing:
        sys.exit(f"agents.py: [cli.{name}] lacks {', '.join(missing)}")
    if name in cfg.get("cli", {}):
        sys.exit(f"agents.py: [cli.{name}] is already in agents.toml")
    path = config_path()
    text = open(path, encoding="utf-8").read().rstrip("\n")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text + "\n\n" + block + "\n")
    return name


def set_tier(cfg, n, cli, model, effort):
    """Rewrite tier n's line in agents.toml in place, keeping every other line and comment."""
    t = {"cli": cli, "model": model, **({"effort": int(effort)} if effort else {})}
    problem = tier_problem(cfg, t)
    if problem:
        sys.exit(f"agents.py: tier {n}: {problem}")
    path = config_path()
    text = open(path, encoding="utf-8").read()
    value = f'{n} = {{ cli = "{cli}", model = "{model}"' + (f", effort = {int(effort)}" if effort else "") + " }"
    line = re.compile(rf"^{re.escape(str(n))} = \{{.*\}}[ \t]*$", re.M)
    if line.search(text):
        text = line.sub(value, text, count=1)
    else:
        text = text.replace("[tiers]\n", f"[tiers]\n{value}\n", 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return label(cfg, cli, model, effort)


def tier(cfg, n):
    t = cfg.get("tiers", {}).get(str(n))
    if not t:
        sys.exit(f"agents.py: no tier {n} in {config_path()}")
    return t["cli"], t["model"], str(t.get("effort", ""))


def herdr_installed():
    """Integration names herdr reports as installed, or None when herdr cannot be asked."""
    try:
        out = subprocess.run([os.environ.get("HERDR_BIN_PATH", "herdr"), "integration", "status"],
                             capture_output=True, text=True, timeout=10).stdout
    except (OSError, subprocess.SubprocessError):
        return None
    names = set()
    for line in out.splitlines():
        m = re.match(r"^([a-z0-9-]+)(?: \(experimental\))?: (.+)$", line.strip())
        if m and not m.group(2).startswith("not installed"):
            names.add(m.group(1))
    return names


def clis(cfg):
    """[(cli, state, label)]: configured CLIs (ready, or missing when not on PATH), then herdr-only ones (unwired)."""
    configured = cfg.get("cli", {})
    rows = []
    for name, spec in configured.items():
        binary = spec.get("bin", "cursor-agent" if name == "cursor" else name)
        rows.append((name, "ready" if shutil.which(binary) else "missing", spec.get("label", name)))
    for name in sorted((herdr_installed() or set()) - set(configured)):
        rows.append((name, "unwired", name))
    return rows


def tier_problem(cfg, t):
    cli, model = t.get("cli"), t.get("model")
    if cli not in cfg.get("cli", {}):
        return f"no [cli.{cli}]"
    if model not in [m[0] for m in models(cfg, cli)]:
        return f"{cli} does not offer {model}"
    levels, e = efforts(cfg, cli, model), str(t.get("effort", ""))
    if levels and not (e.isdigit() and 1 <= int(e) <= len(levels)):
        return f"effort {e or '(none)'} for {model}; pick 1 to {len(levels)} ({', '.join(levels)})"
    return None


def check(cfg):
    bad = 0
    for n, t in sorted(cfg.get("tiers", {}).items()):
        problem = tier_problem(cfg, t)
        if problem:
            bad += 1
            print(f"PROBLEM tier {n}: {problem}")
        else:
            print(f"tier {n}  {label(cfg, t['cli'], t['model'], str(t.get('effort', '')))}")
    for name, state, _ in clis(cfg):
        if state == "unwired":
            print(f"cli {name}: installed in herdr, add [cli.{name}] to agents.toml to dispatch it")
        elif state == "missing":
            print(f"cli {name}: in agents.toml but not on PATH")
    return 1 if bad else 0


def main(argv):
    cfg = load()
    cmd, args = (argv[0], argv[1:]) if argv else ("", [])
    if cmd == "tiers":
        for n in sorted(cfg.get("tiers", {})):
            cli, model, effort = tier(cfg, n)
            print("\t".join([n, cli, model, effort, label(cfg, cli, model, effort)]))
    elif cmd == "resolve" and len(args) == 1:
        print("\t".join(tier(cfg, args[0])))
    elif cmd == "launch" and len(args) in (2, 3):
        sys.stdout.write("\0".join(launch(cfg, args[0], args[1], args[2] if len(args) == 3 else "")) + "\0")
    elif cmd == "launch-line" and len(args) == 1:
        cli, model, effort = tier(cfg, args[0])
        spec = cli_spec(cfg, cli)
        print(f"herdr agent start <name> --kind {spec['kind']} --pane <pane> -- {shlex.join(launch(cfg, cli, model, effort))}")
    elif cmd == "meta" and len(args) in (2, 3):
        cli, model, effort = args[0], args[1], args[2] if len(args) == 3 else ""
        spec = cli_spec(cfg, cli)
        print("\t".join([spec["kind"], label(cfg, cli, model, effort), spec.get("skill_prefix", "/")]))
    elif cmd == "clis":
        for row in clis(cfg):
            print("\t".join(row))
    elif cmd == "models" and len(args) == 1:
        for mid, lbl, _ in models(cfg, args[0]):
            print(f"{mid}\t{lbl}")
    elif cmd == "efforts" and len(args) == 2:
        for i, word in enumerate(efforts(cfg, args[0], args[1]), 1):
            print(f"{i}\t{word}")
    elif cmd == "set-tier" and len(args) in (3, 4):
        print(f"tier {args[0]}  {set_tier(cfg, args[0], args[1], args[2], args[3] if len(args) == 4 else '')}")
    elif cmd == "add-cli" and len(args) == 2:
        print(f"added [cli.{add_cli(cfg, args[0], args[1])}]")
    elif cmd == "check":
        return check(cfg)
    else:
        sys.stderr.write(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
