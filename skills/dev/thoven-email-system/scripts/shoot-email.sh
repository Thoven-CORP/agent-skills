#!/usr/bin/env bash
# Usage: shoot-email.sh <email.html> [out_dir]
# Writes <name>-640.png and <name>-390.png. Headless Chrome on macOS will not open a window
# narrower than 500px, so a direct 390 shot lays the email out at 500 and crops it. The 390
# shot frames the email in a 390px iframe instead, inside a 640 window.
set -euo pipefail

html="${1:?usage: shoot-email.sh <email.html> [out_dir]}"
[ -s "$html" ] || { echo "shoot-email: $html is missing or empty" >&2; exit 1; }
out="${2:-$(dirname "$html")}"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
name="$(basename "$html" .html)"
src="file://$(cd "$(dirname "$html")" && pwd)/$(basename "$html")"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
frame="$tmp/frame.html"
printf '<body style="margin:0;background:#fff"><iframe src="%s" width="390" height="2400" style="border:0;display:block"></iframe></body>' "$src" > "$frame"

mkdir -p "$out"
shoot() { "$chrome" --headless=new --hide-scrollbars --window-size="$1",2400 --screenshot="$2" "$3" 2>/dev/null; }
shoot 640 "$out/$name-640.png" "$src"
shoot 640 "$out/$name-390.png" "file://$frame"
echo "$out/$name-640.png"
echo "$out/$name-390.png"
