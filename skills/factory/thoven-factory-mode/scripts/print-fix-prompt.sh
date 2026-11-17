#!/usr/bin/env bash
# Print the station 6 cloud-agent prompt for pasting.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sed -n '/^```$/,/^```$/p' "$DIR/../references/station-6-fix-prompt.md" | sed '1d;$d'
