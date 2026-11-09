#!/usr/bin/env bash
# K scored failures on one station: draft improvement PR for Andres. Never merge.
set -euo pipefail

station=""
failures=""
k="${FACTORY_STATION_FAIL_K:-3}"
merge="no"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --station) station="$2"; shift 2 ;;
    --failures) failures="$2"; shift 2 ;;
    --k) k="$2"; shift 2 ;;
    --merge) merge="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[[ -n "$station" && -n "$failures" ]] || {
  echo "usage: improve-pr.sh --station NAME --failures N [--k N]" >&2
  exit 2
}
if ! [[ "$failures" =~ ^[0-9]+$ && "$k" =~ ^[0-9]+$ ]]; then
  echo "FAIL  failures and k must be integers" >&2
  exit 1
fi
if [[ "$merge" != "no" ]]; then
  echo "FAIL  bot must not merge the improvement PR" >&2
  exit 1
fi

if [[ "$failures" -lt "$k" ]]; then
  echo "ok    no improvement PR ($failures / $k on $station)"
  exit 0
fi
echo "action: draft PR for Andres covering $station ($failures failures, k=$k)"
echo "Do not mark ready. Do not merge. PENDING ANDRES open decision 4."
exit 0
