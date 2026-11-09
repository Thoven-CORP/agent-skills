#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cat >"$tmp/shim" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
state="${FACTORY_SENTRY_STATE}"
cmd="$1"; shift
issue=""
actor=""
text=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --org) shift 2 ;;
    --issue) issue="$2"; shift 2 ;;
    --actor) actor="$2"; shift 2 ;;
    --text) text="$2"; shift 2 ;;
    *) shift ;;
  esac
done
case "$cmd" in
  get-issue)
    cat "$state/$issue.json"
    ;;
  assign-if-unassigned)
    python3 - "$state/$issue.json" "$actor" <<'PY'
import json, sys
path, actor = sys.argv[1], sys.argv[2]
data = json.load(open(path))
cur = data.get("assignee") or ""
if cur and cur != actor:
    raise SystemExit(1)
data["assignee"] = actor
json.dump(data, open(path, "w"))
PY
    ;;
  reassign)
    python3 - "$state/$issue.json" "$actor" <<'PY'
import json, sys
path, actor = sys.argv[1], sys.argv[2]
data = json.load(open(path))
data["assignee"] = actor
json.dump(data, open(path, "w"))
PY
    ;;
  add-comment)
    python3 - "$state/$issue.json" "$text" <<'PY'
import json, sys
path, text = sys.argv[1], sys.argv[2]
data = json.load(open(path))
data.setdefault("comments", []).append({"text": text})
json.dump(data, open(path, "w"))
PY
    ;;
  *)
    echo "unknown shim cmd $cmd" >&2
    exit 2
    ;;
esac
EOF
chmod +x "$tmp/shim"

export FACTORY_SENTRY_STATE="$tmp/state"
mkdir -p "$FACTORY_SENTRY_STATE"
printf '%s\n' '{"assignee":"","comments":[]}' >"$FACTORY_SENTRY_STATE/123.json"

"$DIR/claim-lock.sh" --issue 123 --actor bot-a --shim "$tmp/shim" \
  --ttl-hours 24 --now 2026-10-21T12:00:00Z
python3 - "$FACTORY_SENTRY_STATE/123.json" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
assert data["assignee"] == "bot-a", data
assert any("factory-claim-lock:bot-a" in c["text"] for c in data["comments"]), data
print("ok    first bot took the lock")
PY

set +e
"$DIR/claim-lock.sh" --issue 123 --actor bot-b --shim "$tmp/shim" \
  --ttl-hours 24 --now 2026-10-21T18:00:00Z >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'already claimed by bot-a (fresh lock)' "$tmp/err"
echo "ok    fresh lock cannot be retaken"

"$DIR/claim-lock.sh" --issue 123 --actor bot-b --shim "$tmp/shim" \
  --ttl-hours 24 --now 2026-10-22T13:00:00Z
python3 - "$FACTORY_SENTRY_STATE/123.json" <<'PY'
import json, sys
data = json.load(open(sys.argv[1]))
assert data["assignee"] == "bot-b", data
assert any("factory-claim-lock:bot-b" in c["text"] for c in data["comments"]), data
print("ok    expired lock can be retaken")
PY

printf '%s\n' '{"assignee":"human","comments":[]}' >"$FACTORY_SENTRY_STATE/9.json"
set +e
"$DIR/claim-lock.sh" --issue 9 --actor bot-a --shim "$tmp/shim" \
  --ttl-hours 24 --now 2026-10-21T12:00:00Z >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'already assigned to human' "$tmp/err"
echo "ok    assigned-if-unassigned refuses a taken issue"

echo "all claim-lock checks passed"
