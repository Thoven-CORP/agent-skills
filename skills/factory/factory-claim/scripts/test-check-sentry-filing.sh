#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cat >"$tmp/shim" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cmd="$1"; shift
sentry=""
project=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) project="$2"; shift 2 ;;
    --sentry-issue) sentry="$2"; shift 2 ;;
    *) shift ;;
  esac
done
[[ "$cmd" == search ]]
[[ "$project" == "DEP Triage" ]]
cat "${FACTORY_LINEAR_STATE}/${sentry}.json"
EOF
chmod +x "$tmp/shim"

export FACTORY_LINEAR_STATE="$tmp/linear"
mkdir -p "$FACTORY_LINEAR_STATE"
printf '%s\n' '[]' >"$FACTORY_LINEAR_STATE/555.json"
"$DIR/check-sentry-filing.sh" --issue 555 --shim "$tmp/shim"
echo "ok    first filing allowed"

printf '%s\n' '[{"identifier":"THV-99","id":"99"}]' >"$FACTORY_LINEAR_STATE/555.json"
set +e
"$DIR/check-sentry-filing.sh" --issue 555 --shim "$tmp/shim" >"$tmp/out" 2>"$tmp/err"
code=$?
set -e
[[ "$code" -ne 0 ]]
grep -q 'already filed as THV-99' "$tmp/err"
echo "ok    second filing for same alert refused"

echo "all check-sentry-filing checks passed"
