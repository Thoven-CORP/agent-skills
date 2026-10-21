#!/usr/bin/env bash
# Take a Sentry issue only if it is unassigned and has no factory-claim-lock.
# Two bots cannot claim the same alert.
set -euo pipefail

issue=""
actor="${FACTORY_CLAIM_ACTOR:-factory-bot}"
org="thoven-gy"
shim="${FACTORY_SENTRY_SHIM:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --issue) issue="$2"; shift 2 ;;
    --actor) actor="$2"; shift 2 ;;
    --org) org="$2"; shift 2 ;;
    --shim) shim="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$issue" ]] || { echo "usage: claim-lock.sh --issue ID [--actor NAME] [--org thoven-gy]" >&2; exit 2; }

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
python3 - "$raw_file" "$parsed" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
out = sys.argv[2]
assignee = data.get("assignee") or ""
lock_actor = ""
for c in data.get("comments") or []:
    text = (c.get("text") if isinstance(c, dict) else str(c)) or ""
    if "factory-claim-lock:" in text:
        lock_actor = text.split("factory-claim-lock:", 1)[1].strip().split()[0]
        break
with open(out, "w") as fh:
    fh.write(f"{assignee}\n{lock_actor}\n")
PY
rm -f "$raw_file"
assignee="$(sed -n '1p' "$parsed")"
lock_actor="$(sed -n '2p' "$parsed")"
rm -f "$parsed"

if [[ -n "$lock_actor" && "$lock_actor" != "$actor" ]]; then
  echo "FAIL  issue $issue already claimed by $lock_actor" >&2
  exit 1
fi
if [[ -n "$assignee" && "$assignee" != "$actor" ]]; then
  echo "FAIL  issue $issue already assigned to $assignee" >&2
  exit 1
fi

if [[ -z "$assignee" ]]; then
  if ! sentry assign-if-unassigned --org "$org" --issue "$issue" --actor "$actor"; then
    echo "FAIL  assign-if-unassigned lost the race on $issue" >&2
    exit 1
  fi
fi

if [[ -z "$lock_actor" ]]; then
  if ! sentry add-comment --org "$org" --issue "$issue" --text "factory-claim-lock:$actor"; then
    echo "FAIL  could not write factory-claim-lock comment" >&2
    exit 1
  fi
fi

echo "ok    claim lock issue=$issue actor=$actor org=$org"
