#!/usr/bin/env bash
# Take a Sentry issue only if it is unassigned or the factory-claim-lock is stale.
# Fresh locks cannot be stolen. Stale locks (older than claim_lock_hours) can.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
issue=""
actor="${FACTORY_CLAIM_ACTOR:-factory-bot}"
org="thoven-gy"
shim="${FACTORY_SENTRY_SHIM:-}"
ttl_hours="${FACTORY_CLAIM_LOCK_HOURS:-}"
now_iso="${FACTORY_NOW:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --issue) issue="$2"; shift 2 ;;
    --actor) actor="$2"; shift 2 ;;
    --org) org="$2"; shift 2 ;;
    --shim) shim="$2"; shift 2 ;;
    --ttl-hours) ttl_hours="$2"; shift 2 ;;
    --now) now_iso="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$issue" ]] || { echo "usage: claim-lock.sh --issue ID [--actor NAME] [--ttl-hours N]" >&2; exit 2; }

if [[ -z "$ttl_hours" ]]; then
  skills_git="${FACTORY_SKILLS_GIT:-}"
  if [[ -z "$skills_git" ]]; then
    skills_git="$(git -C "$DIR/../../../.." rev-parse --show-toplevel 2>/dev/null || true)"
  fi
  rules_ref="${FACTORY_RULES_REF:-origin/main}"
  caps_tmp="$(mktemp)"
  if [[ -n "$skills_git" ]] && git -C "$skills_git" show "${rules_ref}:skills/factory/factory-rules/RULES.md" >"$caps_tmp" 2>/dev/null; then
    ttl_hours="$(python3 "$DIR/../../factory-rules/scripts/parse-caps.py" --rules "$caps_tmp" --print claim_lock_hours | sed -n 's/^claim_lock_hours=//p')"
  fi
  rm -f "$caps_tmp"
fi
ttl_hours="${ttl_hours:-24}"
if ! [[ "$ttl_hours" =~ ^[0-9]+$ ]]; then
  echo "FAIL  claim_lock_hours must be an integer" >&2
  exit 1
fi

sentry() {
  if [[ -n "$shim" ]]; then
    "$shim" "$@"
    return
  fi
  echo "FAIL  FACTORY_SENTRY_SHIM is required (Sentry assign-if-unassigned + comments)" >&2
  exit 1
}

raw_file="$(mktemp)"
if ! sentry get-issue --org "$org" --issue "$issue" >"$raw_file"; then
  echo "FAIL  cannot read Sentry issue $issue" >&2
  exit 1
fi

parsed="$(mktemp)"
python3 - "$raw_file" "$parsed" "$ttl_hours" "$now_iso" <<'PY'
import json, sys
from datetime import datetime, timezone, timedelta

data = json.load(open(sys.argv[1]))
out = sys.argv[2]
ttl = int(sys.argv[3])
now_s = sys.argv[4].strip() if len(sys.argv) > 4 else ""

def parse_ts(s):
    if not s:
        return None
    s = s.replace("Z", "+00:00")
    return datetime.fromisoformat(s)

now = parse_ts(now_s) if now_s else datetime.now(timezone.utc)
if now.tzinfo is None:
    now = now.replace(tzinfo=timezone.utc)

assignee = data.get("assignee") or ""
lock_actor = ""
lock_ts = None
for c in data.get("comments") or []:
    text = (c.get("text") if isinstance(c, dict) else str(c)) or ""
    if "factory-claim-lock:" not in text:
        continue
    rest = text.split("factory-claim-lock:", 1)[1].strip().split()
    if not rest:
        continue
    lock_actor = rest[0]
    lock_ts = parse_ts(rest[1]) if len(rest) > 1 else None

stale = False
if lock_actor and lock_ts is not None:
    if lock_ts.tzinfo is None:
        lock_ts = lock_ts.replace(tzinfo=timezone.utc)
    stale = now - lock_ts >= timedelta(hours=ttl)
# Undated lock is fail-closed (treated as fresh).

with open(out, "w") as fh:
    fh.write(f"{assignee}\n{lock_actor}\n{stale}\n")
PY
rm -f "$raw_file"
assignee="$(sed -n '1p' "$parsed")"
lock_actor="$(sed -n '2p' "$parsed")"
stale="$(sed -n '3p' "$parsed")"
rm -f "$parsed"

if [[ -n "$lock_actor" && "$lock_actor" != "$actor" && "$stale" != "True" ]]; then
  echo "FAIL  issue $issue already claimed by $lock_actor (fresh lock)" >&2
  exit 1
fi
if [[ -n "$assignee" && "$assignee" != "$actor" && "$stale" != "True" ]]; then
  echo "FAIL  issue $issue already assigned to $assignee" >&2
  exit 1
fi

stamp="${now_iso:-}"
if [[ -z "$stamp" ]]; then
  stamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi

if [[ -z "$assignee" ]]; then
  if ! sentry assign-if-unassigned --org "$org" --issue "$issue" --actor "$actor"; then
    echo "FAIL  assign-if-unassigned lost the race on $issue" >&2
    exit 1
  fi
elif [[ "$assignee" != "$actor" && "$stale" == "True" ]]; then
  if ! sentry reassign --org "$org" --issue "$issue" --actor "$actor"; then
    echo "FAIL  stale reassign failed on $issue" >&2
    exit 1
  fi
fi

if [[ -z "$lock_actor" || "$stale" == "True" ]]; then
  if ! sentry add-comment --org "$org" --issue "$issue" --text "factory-claim-lock:$actor $stamp"; then
    echo "FAIL  could not write factory-claim-lock comment" >&2
    exit 1
  fi
fi

echo "ok    claim lock issue=$issue actor=$actor org=$org ttl_hours=$ttl_hours stale=$stale"
