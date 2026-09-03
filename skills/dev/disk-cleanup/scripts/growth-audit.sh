#!/bin/bash
# Measures which directories are ACTIVELY GROWING, not just which are big.
# Size alone can't distinguish a 8G dir that is static from a 3G dir adding 1G/week.
# Prints: total size, bytes written in last 7d, bytes written in last 30d, per target.

targets=(
  ~/.codex ~/.claude ~/.cursor ~/.local ~/.cache ~/.t3 ~/.npm ~/.config
  ~/Library/Caches ~/Library/Application\ Support ~/Library/pnpm
  ~/thoven ~/Downloads /opt/homebrew
)

printf "%-42s %9s %9s %9s\n" "PATH" "TOTAL" "NEW-7d" "NEW-30d"
printf "%-42s %9s %9s %9s\n" "------------------------------------------" "---------" "---------" "---------"

human() { awk -v b="${1:-0}" 'BEGIN{
  if(b>=1073741824) printf "%.1fG",b/1073741824;
  else if(b>=1048576) printf "%.0fM",b/1048576;
  else printf "%.0fK",b/1024}'; }

for t in "${targets[@]}"; do
  [ -d "$t" ] || continue
  total=$(( $(du -sk "$t" 2>/dev/null | cut -f1) * 1024 ))
  d7=$(find "$t" -type f -mtime -7 -print0 2>/dev/null | xargs -0 stat -f%z 2>/dev/null | awk '{s+=$1}END{print s+0}')
  d30=$(find "$t" -type f -mtime -30 -print0 2>/dev/null | xargs -0 stat -f%z 2>/dev/null | awk '{s+=$1}END{print s+0}')
  printf "%-42s %9s %9s %9s\n" "${t/#$HOME/\~}" "$(human $total)" "$(human $d7)" "$(human $d30)"
done
