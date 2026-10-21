#!/usr/bin/env bash
set -euo pipefail
file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --file) file="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$file" && -f "$file" ]] || { echo "usage: check-card.sh --file PATH" >&2; exit 2; }
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/../../thoven-verify/scripts/check-station-output.sh" --kind card --file "$file"
if ! grep -qiE 'Decision' "$file"; then
  echo "missing Decision" >&2
  exit 1
fi
if ! grep -qiE '\b(go|bounce|ask Andres)\b' "$file"; then
  echo "Decision must be go, bounce, or ask Andres" >&2
  exit 1
fi
echo "ok    decision card"
