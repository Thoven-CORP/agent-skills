#!/usr/bin/env bash
# Makes the skills you actually invoke model-invocable, in every skill tree.
# Default is a dry run. --apply writes, backing up each file to SKILL.md.bak-invocable.
set -u
APPLY=0; [ "${1:-}" = "--apply" ] && APPLY=1
TREES=("$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.agents/skills-on-demand" "$HOME/.cursor/skills" "$HOME/.codex/skills")
LIST="${SKILLS_TSV:-/tmp/mine/skills.tsv}"

[ -f "$LIST" ] || { echo "no invocation data at $LIST. Run scripts/mine-transcripts.sh first." >&2; exit 2; }

# Column 3 is the skill name, which arrives as name, /name, or namespace:name.
invoked=$(awk -F'\t' 'NR>1 && $3!="" {n=$3; sub(/^\//,"",n); sub(/^[a-z0-9-]+:/,"",n); print n}' "$LIST" | sort -u)

changed=0; already=0; missing=0
for name in $invoked; do
  found=0
  for t in "${TREES[@]}"; do
    f="$t/$name/SKILL.md"
    [ -f "$f" ] || continue
    found=1
    if grep -q '^disable-model-invocation: true' "$f"; then
      printf '  %-34s %s\n' "$name" "${t/#$HOME/~}"
      changed=$((changed+1))
      if [ "$APPLY" = 1 ]; then
        cp "$f" "$f.bak-invocable"
        # Only inside frontmatter, so a body mentioning the key is left alone.
        awk 'NR==1&&/^---$/{fm=1;print;next} fm&&/^---$/{fm=0;print;next} fm&&/^disable-model-invocation: true$/{next} {print}' "$f.bak-invocable" > "$f"
      fi
    else
      already=$((already+1))
    fi
  done
  [ "$found" = 0 ] && missing=$((missing+1))
done

echo
echo "invoked skills found blocked : $changed"
echo "invoked skills already open  : $already"
echo "invoked names with no file   : $missing"
[ "$APPLY" = 1 ] && echo "APPLIED. Undo: for b in \$(find ${TREES[0]%/*} -name 'SKILL.md.bak-invocable'); do mv \"\$b\" \"\${b%.bak-invocable}\"; done" || echo "Dry run. Re-run with --apply to write."
