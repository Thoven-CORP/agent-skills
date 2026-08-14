#!/bin/bash
# Disk space scanner — finds common macOS space hogs and reports sizes
# Output: tab-separated lines of CATEGORY\tSIZE_BYTES\tSIZE_HUMAN\tPATH\tSAFETY\tNOTES
# SAFETY: safe (always deletable), caution (check first), sudo (needs sudo)

set -uo pipefail

size_of() {
  local path="$1"
  if [ -e "$path" ]; then
    du -sk "$path" 2>/dev/null | awk '{print $1}'
  else
    echo "0"
  fi
}

human() {
  local kb=$1
  if [ "$kb" -ge 1048576 ]; then
    echo "$(( kb / 1048576 )).$(( (kb % 1048576) * 10 / 1048576 ))G"
  elif [ "$kb" -ge 1024 ]; then
    echo "$(( kb / 1024 ))M"
  else
    echo "${kb}K"
  fi
}

emit() {
  local category="$1" kb="$2" path="$3" safety="$4" notes="$5"
  if [ "$kb" -gt 102400 ]; then  # only report >100MB
    echo -e "${category}\t${kb}\t$(human "$kb")\t${path}\t${safety}\t${notes}"
  fi
}

HOME_DIR="$HOME"

echo "=== DISK OVERVIEW ==="
df -h / | tail -1 | awk '{printf "df reports:  Total: %s  Used: %s  Free: %s  (%s)\n", $2, $3, $4, $5}'
diskutil info / 2>/dev/null | grep -E "Container (Total|Free)" | sed 's/^[[:space:]]*/apfs /' || true
echo "(APFS container free space is ground truth — df/du can over-report on firmlinked paths)"
echo ""

# Detect whether Xcode is actually installed — if not, CoreSimulator paths are firmlink
# phantoms and du over-reports them. We use this flag to suppress those entries below.
XCODE_PATH="$(xcode-select -p 2>/dev/null || true)"
HAS_XCODE=0
if [ -n "$XCODE_PATH" ] && [ -d "$XCODE_PATH" ] && [[ "$XCODE_PATH" == *Xcode.app* ]]; then
  HAS_XCODE=1
fi

echo "=== SPACE HOGS (>100MB) ==="
echo -e "CATEGORY\tSIZE_KB\tSIZE\tPATH\tSAFETY\tNOTES"

# User caches
kb=$(size_of "$HOME_DIR/Library/Caches")
emit "User Caches" "$kb" "$HOME_DIR/Library/Caches" "safe" "All regenerated on demand by apps"

# Specific large caches
for d in ms-playwright Google Homebrew; do
  kb=$(size_of "$HOME_DIR/Library/Caches/$d")
  emit "Cache: $d" "$kb" "$HOME_DIR/Library/Caches/$d" "safe" "Subdir of user caches"
done

# Homebrew cache
kb=$(size_of "/opt/homebrew")
emit "Homebrew" "$kb" "/opt/homebrew" "caution" "brew cleanup --prune=all for cache only"

# Xcode simulators — only report if Xcode is actually installed. On machines without
# Xcode, /Library/Developer/CoreSimulator is a firmlink shell and du reports phantom GB
# that won't free real space when deleted (see disk-cleanup notes).
if [ "$HAS_XCODE" = "1" ]; then
  kb=$(size_of "/Library/Developer/CoreSimulator")
  emit "Xcode Simulators (system)" "$kb" "/Library/Developer/CoreSimulator" "sudo" "Run: sudo xcrun simctl delete all"

  kb=$(size_of "$HOME_DIR/Library/Developer/CoreSimulator")
  emit "Xcode Simulators (user)" "$kb" "$HOME_DIR/Library/Developer/CoreSimulator" "safe" "Personal sim data"
fi

# Xcode DerivedData
kb=$(size_of "$HOME_DIR/Library/Developer/Xcode/DerivedData")
emit "Xcode DerivedData" "$kb" "$HOME_DIR/Library/Developer/Xcode/DerivedData" "safe" "Build artifacts, regenerated"

# Docker
kb=$(size_of "$HOME_DIR/Library/Containers/com.docker.docker")
emit "Docker" "$kb" "$HOME_DIR/Library/Containers/com.docker.docker" "caution" "docker system prune for cleanup"
kb=$(size_of "$HOME_DIR/.docker")
emit "Docker config" "$kb" "$HOME_DIR/.docker" "caution" "Docker config and data"

# Claude Desktop
kb=$(size_of "$HOME_DIR/Library/Application Support/Claude")
emit "Claude Desktop" "$kb" "$HOME_DIR/Library/Application Support/Claude" "caution" "Delete if not using Claude Desktop app"

# Node modules (top-level projects)
find "$HOME_DIR" -maxdepth 4 -name "node_modules" -type d 2>/dev/null | while read -r d; do
  kb=$(size_of "$d")
  emit "node_modules" "$kb" "$d" "safe" "npm install regenerates"
done

# Dev-tool package/build caches — these live in dot-dirs OUTSIDE ~/Library and are the
# single most common reason df/du disagree with "I haven't downloaded much." They are
# pure caches: regenerated on demand, safe to clear. Prefer the tool's own clean command
# over raw rm (resets the index cleanly): `uv cache clean`, `npm cache clean --force`.
kb=$(size_of "$HOME_DIR/.cache/uv");          emit "Cache: uv (Python)" "$kb" "$HOME_DIR/.cache/uv" "safe" "uv cache clean"
kb=$(size_of "$HOME_DIR/.npm/_cacache");       emit "Cache: npm" "$kb" "$HOME_DIR/.npm/_cacache" "safe" "npm cache clean --force"
kb=$(size_of "$HOME_DIR/.cache/puppeteer");    emit "Cache: puppeteer" "$kb" "$HOME_DIR/.cache/puppeteer" "caution" "Browser binaries; clear if not running automation"
kb=$(size_of "$HOME_DIR/.cargo/registry");     emit "Cache: cargo" "$kb" "$HOME_DIR/.cargo/registry" "safe" "Rust crate cache, re-fetched on build"
kb=$(size_of "$HOME_DIR/.bun/install/cache");  emit "Cache: bun" "$kb" "$HOME_DIR/.bun/install/cache" "safe" "bun pm cache rm"
kb=$(size_of "$HOME_DIR/Library/pnpm");        emit "Cache: pnpm" "$kb" "$HOME_DIR/Library/pnpm" "safe" "pnpm store prune"
kb=$(size_of "$HOME_DIR/Library/Caches/go-build"); emit "Cache: go-build" "$kb" "$HOME_DIR/Library/Caches/go-build" "safe" "go clean -cache"

# Next.js build caches — compiler output (NOT node_modules), disposable even on active
# projects; Next rebuilds on next dev/build. Easy multi-GB win across many worktrees.
find "$HOME_DIR" -maxdepth 6 -type d -name "cache" -path "*/.next/*" 2>/dev/null | while read -r d; do
  kb=$(size_of "$d")
  emit ".next/cache" "$kb" "$d" "safe" "Next.js build cache, rebuilds on next run"
done

# CoreSpotlight knowledge journals — known macOS bug where this on-device index balloons
# to many GB. Regenerable derived data, but it's system metadata so treat as caution.
kb=$(size_of "$HOME_DIR/Library/Metadata/CoreSpotlight/SpotlightKnowledgeEvents")
emit "Spotlight knowledge index" "$kb" "$HOME_DIR/Library/Metadata/CoreSpotlight/SpotlightKnowledgeEvents" "caution" "Regenerable; reindex via mdutil if bloated"

# Deleted Users
kb=$(size_of "/Users/Deleted Users")
emit "Deleted Users" "$kb" "/Users/Deleted Users" "sudo" "Orphaned macOS user data"

# Trash
kb=$(size_of "$HOME_DIR/.Trash")
emit "Trash" "$kb" "$HOME_DIR/.Trash" "safe" "Empty via Finder or rm -rf ~/.Trash/*"

# Mail
kb=$(size_of "$HOME_DIR/Library/Mail")
emit "Mail" "$kb" "$HOME_DIR/Library/Mail" "caution" "Manage from Mail.app"

# Messages
kb=$(size_of "$HOME_DIR/Library/Messages")
emit "Messages" "$kb" "$HOME_DIR/Library/Messages" "caution" "Old attachments in Messages"

# Application Support (total)
kb=$(size_of "$HOME_DIR/Library/Application Support")
emit "App Support (total)" "$kb" "$HOME_DIR/Library/Application Support" "caution" "Audit individual apps"

# Logs
kb=$(size_of "/private/var/log")
emit "System Logs" "$kb" "/private/var/log" "sudo" "sudo periodic daily weekly monthly"

# Time Machine snapshots
snapshot_count=$(tmutil listlocalsnapshots / 2>/dev/null | grep -c "com.apple" || true)
snapshot_count=${snapshot_count:-0}
if [ "$snapshot_count" -gt 0 ]; then
  echo -e "TM Snapshots\t0\t${snapshot_count} snapshots\t/\tsudo\ttmutil thinlocalsnapshots / 99999999999"
fi

# Large files in Downloads
kb=$(size_of "$HOME_DIR/Downloads")
emit "Downloads" "$kb" "$HOME_DIR/Downloads" "caution" "Check for old installers/DMGs"

# Large DMGs and zips in home
find "$HOME_DIR" -maxdepth 1 \( -name "*.dmg" -o -name "*.zip" -o -name "*.pkg" \) 2>/dev/null | while read -r f; do
  kb=$(size_of "$f")
  emit "Installer in ~" "$kb" "$f" "safe" "Old installer file"
done

echo ""
# Catch-all deep sweep: the targeted checks above only know about paths we've hardcoded.
# This lists every top-level home dir (incl. hidden) >1GB so unknown space hogs always
# surface — this is how we'd have caught ~/.cache/uv (14G) and ~/.npm (9G) on the first
# pass instead of the third. Cross-reference against the table above; anything large here
# NOT already listed is worth a one-level-deeper du to identify.
echo "=== DEEP SWEEP: top-level home dirs >1GB (cross-check vs table above) ==="
du -sk "$HOME_DIR"/.[!.]* "$HOME_DIR"/* 2>/dev/null | sort -rn | awk '$1 > 1048576 {printf "%6.1fG\t%s\n", $1/1048576, substr($0, index($0,$2))}'

echo ""
echo "=== DONE ==="
