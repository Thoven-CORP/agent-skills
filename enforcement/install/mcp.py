#!/usr/bin/env python3
"""Renders config/mcp.json into each tool's user-level MCP list.

    mcp.py            dry run: per tool, per server, what would happen
    mcp.py --apply    write the safe updates (FILE.bak-thv969 made first, once)

Only servers already present in a tool are rendered; a server the tool lacks
is printed as proposal-add and never written. mcp.json holds secrets as
${VAR}; a tool that cannot resolve a reference in that field keeps its
existing entry (skipped-secret). An update that references a VAR unset in
this shell is held (blocked-env-unset), because the tool would start it with
an empty credential. Values of env and headers are never printed.
"""
import argparse
import json
import os
import re
import shutil
import sys
import tomllib
from pathlib import Path

ENFORCEMENT_DIR = Path(__file__).resolve().parent.parent
CANON = ENFORCEMENT_DIR / "config" / "mcp.json"
HOME = Path.home()
REF = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")
SECRET_FIELDS = {"env", "environment", "headers", "http_headers", "env_http_headers", "bearer_token_env_var", "env_vars"}


class Skip(Exception):
    pass


def refs(obj):
    if isinstance(obj, dict):
        return {v for x in obj.values() for v in refs(x)}
    if isinstance(obj, list):
        return {v for x in obj for v in refs(x)}
    return set(REF.findall(obj)) if isinstance(obj, str) else set()


def subst(obj, fmt):
    if isinstance(obj, dict):
        return {k: subst(v, fmt) for k, v in obj.items()}
    if isinstance(obj, list):
        return [subst(v, fmt) for v in obj]
    return REF.sub(lambda m: fmt.format(m.group(1)), obj) if isinstance(obj, str) else obj


def plain(s):
    """command/args/env or url/headers, the shape Cursor and Devin share."""
    keys = ("command", "args", "env") if s["transport"] == "stdio" else ("url", "headers")
    return {k: s[k] for k in keys if k in s}


def to_cursor(s):
    return subst(plain(s), "${{env:{}}}")


def to_devin(s):
    if refs(s):
        raise Skip("Devin CLI documents no env interpolation for mcp_config.json")
    return plain(s)


def to_opencode(s):
    if s["transport"] == "stdio":
        e = {"type": "local", "command": [s["command"], *s.get("args", [])]}
        if "env" in s:
            e["environment"] = s["env"]
    else:
        e = {"type": "remote", "url": s["url"]}
        if "headers" in s:
            e["headers"] = s["headers"]
    return subst(e, "{{env:{}}}")


def to_codex(s):
    if s["transport"] == "stdio":
        e = {"command": s["command"], "args": s.get("args", [])}
        env, passthrough = {}, []
        for k, v in s.get("env", {}).items():
            if not REF.search(v):
                env[k] = v
            elif v == "${%s}" % k:
                passthrough.append(k)
            else:
                raise Skip(f"env {k} is not a same-name passthrough; Codex env_vars cannot rename")
        if env:
            e["env"] = env
        if passthrough:
            e["env_vars"] = passthrough
        return e
    e = {"url": s["url"]}
    for k, v in s.get("headers", {}).items():
        bearer = re.fullmatch(r"Bearer \$\{(\w+)\}", v)
        whole = REF.fullmatch(v)
        if not REF.search(v):
            e.setdefault("http_headers", {})[k] = v
        elif bearer and k.lower() == "authorization":
            e["bearer_token_env_var"] = bearer.group(1)
        elif whole:
            e.setdefault("env_http_headers", {})[k] = whole.group(1)
        else:
            raise Skip(f"header {k} embeds a reference Codex cannot express")
    return e


STDIO_HTTP = {"command", "args", "env", "url", "headers"}
TOOLS = {
    "codex": (HOME / ".codex/config.toml", "toml", "mcp_servers", to_codex,
              {"command", "args", "env", "env_vars", "url", "http_headers", "bearer_token_env_var", "env_http_headers"}),
    "cursor": (HOME / ".cursor/mcp.json", "json", "mcpServers", to_cursor, STDIO_HTTP),
    "opencode": (HOME / ".config/opencode/opencode.jsonc", "jsonc", "mcp", to_opencode,
                 {"type", "command", "environment", "url", "headers"}),
    "devin": (HOME / ".config/devin/mcp_config.json", "json", "mcpServers", to_devin, STDIO_HTTP),
}


def strip_jsonc(text):
    out, i, in_str = [], 0, False
    while i < len(text):
        c = text[i]
        if in_str:
            out.append(text[i:i + 2] if c == "\\" else c)
            i += 2 if c == "\\" else 1
            in_str = in_str and c != '"'
            continue
        if text.startswith("//", i):
            i = text.find("\n", i) if "\n" in text[i:] else len(text)
        elif text.startswith("/*", i):
            i = text.index("*/", i) + 2
        else:
            in_str = c == '"'
            out.append(c)
            i += 1
    return re.sub(r",(\s*[}\]])", r"\1", "".join(out))


def load(path, fmt):
    text = path.read_text()
    if fmt == "toml":
        return text, tomllib.loads(text)
    return text, json.loads(strip_jsonc(text) if fmt == "jsonc" else text)


def merge(existing, rendered, managed):
    new = {}
    for k, v in existing.items():
        if k not in managed or (k not in rendered and v in ({}, [])):
            new[k] = v
        elif k in rendered:
            new[k] = rendered[k]
    new.update({k: v for k, v in rendered.items() if k not in new})
    return new


def diff(old, new):
    out = []
    for k in dict.fromkeys([*old, *new]):
        a, b = old.get(k), new.get(k)
        if a == b:
            continue
        if isinstance(a, dict) or isinstance(b, dict) or k in SECRET_FIELDS:
            a, b = a if isinstance(a, dict) else {}, b if isinstance(b, dict) else {}
            subs = [s for s in dict.fromkeys([*a, *b]) if a.get(s) != b.get(s)]
            out += [f"{k}.{s}" + ("(removed)" if s not in b else "") for s in subs] or [k]
        elif b is None:
            out.append(f"{k}(removed)")
        else:
            out.append(f"{k}={json.dumps(b)}")
    return out


def toml_key(k):
    return k if re.fullmatch(r"[A-Za-z0-9_-]+", k) else json.dumps(k)


def toml_val(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, list):
        return "[" + ", ".join(toml_val(x) for x in v) + "]"
    return json.dumps(v, ensure_ascii=False)


def toml_block(name, entry):
    head = f"mcp_servers.{toml_key(name)}"
    lines = [f"[{head}]"] + [f"{toml_key(k)} = {toml_val(v)}" for k, v in entry.items() if not isinstance(v, dict)]
    for k, v in entry.items():
        if isinstance(v, dict):
            lines += ["", f"[{head}.{toml_key(k)}]"] + [f"{toml_key(a)} = {toml_val(b)}" for a, b in v.items()]
    return [line + "\n" for line in lines]


def toml_replace(text, name, entry):
    lines = text.splitlines(keepends=True)
    header = re.compile(r"^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*(#.*)?$")

    def path(i):
        m = header.match(lines[i])
        return [p.strip('"') for p in re.findall(r'"[^"]*"|[A-Za-z0-9_-]+', m.group(1))] if m else None

    start = next((i for i in range(len(lines)) if path(i) == ["mcp_servers", name]), None)
    if start is None:
        raise Skip(f"no [mcp_servers.{name}] header to replace")
    end = next((i for i in range(start + 1, len(lines)) if path(i) and path(i)[:2] != ["mcp_servers", name]), len(lines))
    while end > start and not lines[end - 1].strip():
        end -= 1
    if any(line.lstrip().startswith("#") for line in lines[start:end]):
        raise Skip(f"[mcp_servers.{name}] contains comments a rewrite would drop")
    return "".join(lines[:start] + toml_block(name, entry) + lines[end:])


def render_text(fmt, text, data, container, updates):
    if fmt == "toml":
        for name, entry in updates.items():
            text = toml_replace(text, name, entry)
        return text
    if fmt == "jsonc" and strip_jsonc(text) != text:
        raise Skip("file has comments or trailing commas a JSON rewrite would drop")
    data[container].update(updates)
    return json.dumps(data, indent=2, ensure_ascii=False) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    canon = json.loads(CANON.read_text())
    servers, unmanaged = canon["servers"], canon.get("unmanaged", {})

    for tool, (path, fmt, container, translate, managed) in TOOLS.items():
        print(f"== {tool}  {path.relative_to(HOME) if path.is_relative_to(HOME) else path}")
        if not path.exists():
            print("  (no config file)")
            continue
        text, data = load(path, fmt)
        existing = data.get(container, {})
        updates = {}
        for name in sorted({*existing, *servers}):
            if name in unmanaged.get(tool, []):
                status = "unmanaged (tool-owned)"
            elif name not in existing:
                status = "proposal-add (not written)"
            elif name not in servers:
                status = "not in mcp.json"
            else:
                try:
                    new = merge(existing[name], translate(servers[name]), managed)
                except Skip as e:
                    print(f"  {name:16} skipped-secret: {e}")
                    continue
                changes = diff(existing[name], new)
                unset = sorted(v for v in refs(servers[name]) if v not in os.environ)
                if not changes:
                    status = "unchanged"
                elif unset:
                    status = f"blocked-env-unset {','.join(unset)}: would update {', '.join(changes)}"
                else:
                    status = f"would update {', '.join(changes)}"
                    updates[name] = new
            print(f"  {name:16} {status}")

        if not (args.apply and updates):
            continue
        try:
            out = render_text(fmt, text, data, container, dict(updates))
            reparsed = tomllib.loads(out) if fmt == "toml" else json.loads(out)
            _, expected = load(path, fmt)
            expected[container].update(updates)
            if reparsed != expected:
                raise Skip("re-parsed output differs from the intended change")
        except Skip as e:
            print(f"  NOT WRITTEN: {e}")
            continue
        backup = path.with_name(path.name + ".bak-thv969")
        if not backup.exists():
            shutil.copy2(path, backup)
        path.write_text(out)
        print(f"  wrote {len(updates)} server(s); backup {backup.name}")

    claude = HOME / ".claude.json"
    if claude.exists():
        names = sorted(json.loads(claude.read_text()).get("mcpServers", {}))
        print(f"== claude (names only, never rendered): {', '.join(names)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
