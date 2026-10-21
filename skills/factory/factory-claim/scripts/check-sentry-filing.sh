#!/usr/bin/env bash
# One Sentry alert yields at most one DEP Triage issue.
# Search Linear by Sentry issue id before filing.
set -euo pipefail

issue=""
project="DEP Triage"
shim="${FACTORY_LINEAR_SHIM:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --issue) issue="$2"; shift 2 ;;
    --project) project="$2"; shift 2 ;;
    --shim) shim="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$issue" ]] || { echo "usage: check-sentry-filing.sh --issue SENTRY_ID [--project 'DEP Triage']" >&2; exit 2; }

linear() {
  if [[ -n "$shim" ]]; then
    "$shim" "$@"
    return
  fi
  echo "FAIL  FACTORY_LINEAR_SHIM is required (search DEP Triage by Sentry id)" >&2
  exit 1
}

hits_file="$(mktemp)"
if ! linear search --project "$project" --sentry-issue "$issue" >"$hits_file"; then
  echo "FAIL  Linear search for Sentry $issue failed" >&2
  rm -f "$hits_file"
  exit 1
fi
python3 - "$issue" "$hits_file" <<'PY'
import json, sys
issue, path = sys.argv[1], sys.argv[2]
raw = open(path).read().strip() or "[]"
try:
    rows = json.loads(raw)
except Exception as e:
    raise SystemExit(f"Linear search returned invalid JSON: {e}")
if not isinstance(rows, list):
    raise SystemExit("Linear search must return a JSON array")
if rows:
    ids = []
    for row in rows:
        if isinstance(row, dict):
            ids.append(str(row.get("identifier") or row.get("id") or row))
        else:
            ids.append(str(row))
    print(f"FAIL  Sentry {issue} already filed as {', '.join(ids)}", file=sys.stderr)
    raise SystemExit(1)
print(f"ok    no DEP Triage ticket for Sentry {issue}")
PY
rm -f "$hits_file"
