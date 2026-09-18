#!/usr/bin/env bash
# Audits four levers over agent transcripts, in whichever harness wrote them.
# Called by the andres-dev-evaluation skill. Safe to run directly.
#
# Lever A  a skill was asked for and its mandated follow-ons never ran
# Lever B  a skill the model is allowed to choose, that it never chooses
# Lever C  a session that edited a lot and never ran the follow-through skills
# Lever D  tools and MCP servers carried in context and never called
#
# Deterministic about mechanism, silent about judgment. It reports counts and
# names. Deciding which gap matters is the caller's job.
set -uo pipefail

DAYS="${DAYS:-14}"
OUT="${OUT:-/tmp/dev-evaluation}"
mkdir -p "$OUT"

# Each harness writes transcripts somewhere else. Claude Code is JSONL per
# session; the others are detected the same way and skipped when absent.
declare -a ROOTS=()
[ -d "$HOME/.claude/projects" ] && ROOTS+=("claude:$HOME/.claude/projects")
[ -d "$HOME/.cursor/projects" ] && ROOTS+=("cursor:$HOME/.cursor/projects")
[ -d "$HOME/.codex/sessions" ] && ROOTS+=("codex:$HOME/.codex/sessions")
[ "${#ROOTS[@]}" -gt 0 ] || { echo "no transcript directory found for any harness"; exit 1; }

: > "$OUT/skills.tsv"   # harness  session  source  skill
: > "$OUT/tools.tsv"    # harness  session  tool    count
: > "$OUT/edits.tsv"    # harness  session  edit_count
: > "$OUT/prompts.tsv"  # harness  session  first 200 chars of a human turn

sessions=0
for entry in "${ROOTS[@]}"; do
  h="${entry%%:*}"; root="${entry#*:}"
  while IFS= read -r f; do
    sessions=$((sessions + 1))
    sid="$(basename "$f" .jsonl)"

    # A model-chosen skill is a Skill tool_use. A typed one arrives as a
    # command tag in a user turn. Same file, different shape, so tag the source
    # rather than leaving a leading slash to carry the meaning.
    jq -r --arg h "$h" --arg s "$sid" '
      select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Skill")
      | [$h,$s,"model",(.input.skill // "?" | sub("^[a-z0-9-]+:";""))] | @tsv' "$f" 2>/dev/null >> "$OUT/skills.tsv"
    jq -r --arg h "$h" --arg s "$sid" '
      select(.type=="user") | (.message.content | if type=="string" then . else "" end)
      | capture("<command-name>(?<c>[^<]+)</command-name>")? | select(.!=null)
      | [$h,$s,"typed",(.c|ltrimstr("/")|sub("^[a-z0-9-]+:";""))] | @tsv' "$f" 2>/dev/null >> "$OUT/skills.tsv"

    jq -r --arg h "$h" --arg s "$sid" '
      select(.type=="assistant") | .message.content[]? | select(.type=="tool_use") | .name' "$f" 2>/dev/null \
      | sort | uniq -c | awk -v h="$h" -v s="$sid" '{print h"\t"s"\t"$2"\t"$1}' >> "$OUT/tools.tsv"

    # Lever B compares a skill's triggers against how the ask really lands, so
    # keep human turns only. Machinery injects plenty that is not typed.
    jq -r --arg h "$h" --arg s "$sid" '
      select(.type=="user" and (.origin.kind // "human")=="human")
      | (.message.content | if type=="string" then . else "" end)
      | select(length>0)
      | select(test("^(<|Caveat:|Another Claude session|\\[SYSTEM NOTIFICATION|This session is being continued|Base directory for this skill:|\\{\"type\")") | not)
      | [$h,$s,(.[0:200]|gsub("[\n\t]";" "))] | @tsv' "$f" 2>/dev/null >> "$OUT/prompts.tsv"

    jq -r 'select(.type=="assistant") | .message.content[]?
      | select(.type=="tool_use" and (.name=="Edit" or .name=="Write" or .name=="NotebookEdit")) | .name' "$f" 2>/dev/null \
      | wc -l | awk -v h="$h" -v s="$sid" '$1>0{print h"\t"s"\t"$1}' >> "$OUT/edits.tsv"
  done < <(find "$root" -name '*.jsonl' -mtime -"$DAYS" 2>/dev/null)
done

echo "=============================================================="
echo " andres dev evaluation    last $DAYS days    $sessions sessions"
echo "=============================================================="

echo
echo "LEVER A   asked for a skill, mandated follow-ons never ran"
echo "--------------------------------------------------------------"
# poteto-mode is the router that mandates others. Read its demands from the
# skill itself so this stays true when upstream changes them.
router="$HOME/.claude/skills/poteto-mode/SKILL.md"
if [ -f "$router" ]; then
  mandated=$(grep -oE '\*\*(unslop|no-comments|technical-writing|writing-for-agents|deslop|interrogate|arena)\*\*' "$router" | tr -d '*' | sort -u)
  awk -F'\t' '$4=="poteto-mode"{print $2}' "$OUT/skills.tsv" | sort -u > "$OUT/.poteto"
  n=$(wc -l < "$OUT/.poteto" | tr -d ' ')
  if [ "$n" -eq 0 ]; then
    echo "  no poteto-mode sessions in window"
  else
    for m in $mandated; do
      hit=$(awk -F'\t' -v m="$m" 'NR==FNR{want[$1];next} $4==m && ($2 in want){print $2}' "$OUT/.poteto" "$OUT/skills.tsv" | sort -u | wc -l | tr -d ' ')
      printf '  %-20s ran in %2s of %2s poteto-mode sessions\n' "$m" "$hit" "$n"
    done
  fi
fi

echo
echo "LEVER B   model is allowed to choose it, and never does"
echo "--------------------------------------------------------------"
for f in "$HOME"/.claude/skills/*/SKILL.md; do
  grep -q '^disable-model-invocation: true' "$f" && continue
  s=$(basename "$(dirname "$f")")
  m=$(awk -F'\t' -v s="$s" '$3=="model" && $4==s' "$OUT/skills.tsv" | wc -l | tr -d ' ')
  t=$(awk -F'\t' -v s="$s" '$3=="typed" && $4==s' "$OUT/skills.tsv" | wc -l | tr -d ' ')
  [ "$m" -eq 0 ] && [ "$t" -gt 0 ] && printf '%s\t%s\n' "$t" "$s"
done | sort -rn | head -15 | awk -F'\t' '{printf "  %-38s typed %2s times, model chose it 0 times\n", $2, $1}' 
echo "  (a skill you keep typing that the model never reaches on its own)"

echo
echo "LEVER C   heavy edit session, no follow-through skill"
echo "--------------------------------------------------------------"
THRESH="${THRESH:-15}"
awk -F'\t' -v t="$THRESH" '$3>=t && $2 !~ /^agent-/{print $1"\t"$2"\t"$3}' "$OUT/edits.tsv" | sort -k3 -rn | head -20 \
| while IFS=$'\t' read -r h s n; do
    ran=$(awk -F'\t' -v s="$s" '$2==s && ($4=="unslop" || $4=="deslop" || $4=="no-comments" || $4=="technical-writing"){print $4}' "$OUT/skills.tsv" | sort -u | tr '\n' ',' | sed 's/,$//')
    [ -z "$ran" ] && printf '  %-42s %3s edits, none of unslop/deslop/technical-writing\n' "${s:0:42}" "$n"
  done
sub=$(awk -F'\t' -v t="$THRESH" '$3>=t && $2 ~ /^agent-/' "$OUT/edits.tsv" | wc -l | tr -d ' ')
echo "  (main sessions above $THRESH edits with no cleanup pass)"
echo "  $sub subagent sessions also cleared $THRESH edits; their parent owns the cleanup, so they are not counted"

echo
echo "LEVER D   carried in context, never called"
echo "--------------------------------------------------------------"
awk -F'\t' '{print $3}' "$OUT/tools.tsv" | sort -u > "$OUT/.used"
if [ -f "$HOME/.claude.json" ]; then
  python3 - "$OUT/.used" <<'PY'
import json, pathlib, sys
used = set(pathlib.Path(sys.argv[1]).read_text().split())
cfg = json.loads((pathlib.Path.home()/".claude.json").read_text())
servers = set(cfg.get("mcpServers", {}))
for p in cfg.get("projects", {}).values():
    servers |= set(p.get("mcpServers", {}))
cold = sorted(s for s in servers if not any(u.startswith(f"mcp__{s.replace('-','_')}") or s in u for u in used))
print(f"  MCP servers configured: {len(servers)}   never called in window: {len(cold)}")
for s in cold:
    print(f"    {s}")
PY
fi
echo
echo "  tools actually called: $(wc -l < "$OUT/.used" | tr -d ' ')"
echo
echo "raw tables in $OUT/"
