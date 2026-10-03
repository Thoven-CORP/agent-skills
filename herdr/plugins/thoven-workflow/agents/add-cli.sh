#!/usr/bin/env bash
# add-cli.sh <cli> [report-to pane] [space]
# Opens a tab in the space you came from with a tier-2 agent, briefed to work out how <cli> takes a
# model, an effort and a permission bypass, prove it on a scratch launch, and publish its
# [cli.<name>] block. herdr knows how to run the CLI; only its flags need finding (THV-1078).
# TW_ADD_CLI_DRYRUN=1 prints the launch and the brief instead.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/../lib/common.sh"
cancel() { exit 1; }
. "$HERE/../lib/agent-pick.sh"

new="$1" report_to="${2:-}" space="${3:-}"
[[ "$new" =~ ^[a-z][a-z0-9-]*$ ]] || { echo "not a CLI name: $new"; exit 2; }
name="wire-$new"
dry="${TW_ADD_CLI_DRYRUN:-0}"

IFS=$'\t' read -r cli model effort < <(ag resolve 2)
kind="$(ag meta "$cli" "$model" "$effort" | cut -f1)"
flags=()
while IFS= read -r -d '' a; do flags+=("$a"); done < <(ag launch "$cli" "$model" "$effort")

brief="$(sed -e "s|{cli}|$new|g" -e "s|{agents}|$AGENTS|g" -e "s|{publish}|$HERE/publish.sh|g" \
  -e "s|{report_to}|${report_to:-the pane that opened this tab}|g" -e "s|{herdr}|$TW_HERDR|g" "$HERE/add-cli-brief.md")"

if [ "$dry" = 1 ]; then
  printf '+ tab create --workspace %s --label "wire %s"\n' "${space:-<current>}" "$new"
  printf '+ agent start %s --kind %s -- %s\n' "$name" "$kind" "${flags[*]}"
  printf '%s\n' "----- brief -----" "$brief" "----- end -----"
  exit 0
fi

created="$("$TW_HERDR" tab create ${space:+--workspace "$space"} --cwd "$HOME/thoven/agent-skills" --label "wire $new" --no-focus)"
pane="$(jq -r '.result.root_pane.pane_id' <<<"$created")"
"$TW_HERDR" pane wait-output "$pane" --regex '\S' --timeout 15000 >/dev/null 2>&1 || true
sleep 1
"$TW_HERDR" agent start "$name" --kind "$kind" --pane "$pane" --timeout 120000 -- "${flags[@]}" >/dev/null
"$TW_HERDR" agent prompt "$name" "$brief" >/dev/null
echo "Wiring $new in a new tab, \"wire $new\" ($pane). It reports back when the block is merged."
