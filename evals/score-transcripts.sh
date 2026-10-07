#!/usr/bin/env bash
# Scores a run from Devin's own transcripts rather than from a terminal snapshot.
#
#   score-transcripts.sh <run-dir>
#
# A pane snapshot is a viewport and drops whatever scrolled past. The transcript
# is the whole session, which is why an early run looked like neither arm
# classified when only the label had scrolled away.
#
# Two things this must not do, both of which it did on 2026-09-19:
#
#  - Count the skill's own prose. The treatment skill ships `"binding": true` and
#    `"status": "undecided"` as instructions, so grepping a transcript for them
#    reports instructions as results. Record counts come from score-records.py,
#    which requires JSON that parses.
#  - Report a run whose arm was not the arm it claims. The global copy of the
#    skill can shadow the worktree's, and it is identical to control, so a
#    treatment pane can silently run control. ARM is checked, not assumed.
set -uo pipefail

run="${1:-}"
[ -d "$run" ] || { echo "usage: score-transcripts.sh <run-dir>" >&2; exit 2; }
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tdir="$HOME/.local/share/devin/cli/transcripts"
SIG='Run the classifier before deciding'   # present in treatment only
BODY='Step 2: Classify Bug Type'            # present in both arms' skill body

void=0
noload=0
printf '%-26s %-10s %6s %7s %5s %5s %4s %5s %6s\n' \
  CASE ARM ARM_OK INVOKED STEPS LABEL OK UNDEC BIND_T
while IFS=$'\t' read -r case arm session; do
  [ -n "${session:-}" ] || continue
  f="$tdir/$session.json"
  if [ ! -f "$f" ]; then
    printf '%-26s %-10s %4s  no transcript\n' "$case" "$arm" "-"; void=$((void+1)); continue
  fi
  has_sig=$(grep -c "$SIG" "$f" 2>/dev/null || true)
  has_body=$(grep -c "$BODY" "$f" 2>/dev/null || true)
  # A control run passes the arm check by merely LACKING the treatment line, so a
  # run where the skill never loaded at all would pass too. Both c1 control runs
  # did exactly that: zero Step 2, zero Dimension 1, and ARM_OK said yes. NOLOAD
  # is not VOID. It is the honest outcome that the skill's description never
  # matched the report, and a mandate cannot fire in a skill that never loads.
  if [ "${has_body:-0}" -eq 0 ]; then
    ok=NOLOAD
  else
    case "$arm" in
      treatment) [ "${has_sig:-0}" -gt 0 ] && ok=yes || ok=VOID ;;
      control)   [ "${has_sig:-0}" -eq 0 ] && ok=yes || ok=VOID ;;
      *)         ok=VOID ;;
    esac
  fi
  [ "$ok" = VOID ] && void=$((void+1))
  [ "$ok" = NOLOAD ] && noload=$((noload+1))
  # The dependent variable. A NOLOAD session did not fail to follow the skill's
  # instructions, it never called the skill tool, so no instruction inside
  # SKILL.md could reach it. Both arms ship an identical description, so the arms
  # are indistinguishable at this step by construction.
  invoked=$(grep -o '"function_name": "skill"' "$f" 2>/dev/null | wc -l | tr -d ' ')
  steps=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('final_metrics',{}).get('total_steps','?'))" "$f")
  # the skill documents the shape as repro=[YES|NO], so a bare YES or NO is emitted
  label=$(grep -oE 'repro=(YES|NO)' "$f" 2>/dev/null | wc -l | tr -d ' ')
  read -r _ rok rund rbt _ _ < <(python3 "$here/score-records.py" "$f")
  printf '%-26s %-10s %6s %7s %5s %5s %4s %5s %6s\n' \
    "$case" "$arm" "$ok" "${invoked:-0}" "$steps" "$label" "$rok" "$rund" "$rbt"
done < "$run/sessions.tsv"

echo
if [ "$void" -gt 0 ]; then
  echo "$void row(s) VOID: the transcript does not carry that arm's skill. Do not read the numbers."
  exit 1
fi
if [ "$noload" -gt 0 ]; then
  echo "$noload row(s) NOLOAD: the skill never entered that agent's context, so the row measures skill discovery, not mandate-following."
fi
echo "every remaining row ran the arm it claims"
