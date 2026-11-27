#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

fe='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
be='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
printf '[{"name":"prod/2026-10-21-1","sha":"%s"}]\n' "$fe" >"$tmp/fe-tags.json"
printf '[{"name":"prod/2026-10-21-1","sha":"%s"}]\n' "$be" >"$tmp/be-tags.json"

mkdir -p "$tmp/bin"
cat >"$tmp/bin/curl" <<'EOF'
#!/usr/bin/env bash
used_k=0
out="/dev/null"
url=""
args=("$@")
i=0
while [[ $i -lt ${#args[@]} ]]; do
  a="${args[$i]}"
  case "$a" in
    -K) used_k=1; cat >/dev/null; i=$((i+1)) ;;
    -o) i=$((i+1)); out="${args[$i]}"; i=$((i+1)) ;;
    -w) i=$((i+2)) ;;
    -m) i=$((i+2)) ;;
    -sS|-s|-S) i=$((i+1)) ;;
    http*) url="$a"; i=$((i+1)) ;;
    *) i=$((i+1)) ;;
  esac
done
echo "url=$url k=$used_k" >>"${CURL_LOG}"
if [[ "$url" == *"/api/version"* ]]; then
  printf '{"sha":"%s"}\n' "${FAKE_FE_SHA}" >"$out"
else
  printf '{"status":"ok","revision":{"sha":"%s"}}\n' "${FAKE_BE_SHA:0:12}" >"$out"
fi
printf '200'
EOF
chmod +x "$tmp/bin/curl"

export PATH="$tmp/bin:$PATH"
export FAKE_FE_SHA="$fe"
export FAKE_BE_SHA="$be"
export VERCEL_AUTOMATION_BYPASS_SECRET="super-secret-bypass"

CURL_LOG="$tmp/prod.log" \
  "$DIR/version-read.sh" prod "$fe" "$be" "$tmp/fe-tags.json" "$tmp/be-tags.json" >"$tmp/prod.out"
if grep -q 'k=1' "$tmp/prod.log"; then
  echo "FAIL  prod request sent the Vercel bypass secret" >&2
  cat "$tmp/prod.log" >&2
  exit 1
fi
grep -q 'url=https://thoven.co/api/version k=0' "$tmp/prod.log"
echo "ok    prod does not send Vercel bypass secret"

CURL_LOG="$tmp/stg.log" \
  "$DIR/version-read.sh" staging "$fe" "$be" >"$tmp/stg.out"
grep -q 'url=https://staging.thoven.co/api/version k=1' "$tmp/stg.log"
echo "ok    staging may send Vercel bypass secret"

echo "all version-read checks passed"
