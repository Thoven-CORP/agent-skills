#!/usr/bin/env bash
# check-skill-routes.sh — find dead skill names named inside router skills.
#
# Sibling of check-skill-pointers.sh, which does the same job for file paths.
# A router that names a destination is making a claim, and on 2026-09-19 ten of
# orchestrate's claims named skills that do not exist.
#
# Destinations are written as /name, so extraction is exact rather than a guess
# at which table column holds them. A destination without the slash is not a
# destination, which is what keeps this check honest as the tables change.
#
# Usage:
#   check-skill-routes.sh <file> [<file> ...]
#
# Exits 1 if any destination does not resolve. It indexes global skills and
# enabled plugins only. A project skill under a repo's .agents/skills resolves
# for whoever works in that repo, never for a global routing table.
set -uo pipefail

[ "$#" -ge 1 ] || { echo "Usage: $0 <file> [<file> ...]" >&2; exit 2; }

ROOTS=("$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.agents/skills-on-demand"
       "$HOME/.cursor/skills" "$HOME/.codex/skills" "$HOME/.config/devin/skills")

# Built into the CLI, so they have no directory anywhere. The filesystem cannot
# report these and a router may legitimately name them.
BUILTINS="simplify run init loop schedule update-config keybindings-help claude-api
workflow-authoring claude-in-chrome fewer-permission-prompts dataviz"

# Thoven's Next.js route roots. A skill file names these in prose ("`/teacher`
# rendered a 401px emoji"), and nothing in the token itself distinguishes an app
# route from a skill. The list is short and closed, so enumerate it.
APP_ROUTES="teacher student parent admin dev login signup onboarding"

index="$(mktemp)"; trap 'rm -f "$index"' EXIT
printf '%s\n' $BUILTINS $APP_ROUTES >> "$index"
for r in "${ROOTS[@]}"; do
  [ -d "$r" ] || continue
  # depth 4 reaches ~/.claude/skills/synced/<id>/<name>/SKILL.md, which holds
  # skills a session lists but a depth-2 walk never sees.
  find "$r" -maxdepth 4 -name SKILL.md 2>/dev/null | while read -r f; do basename "$(dirname "$f")"; done
done >> "$index"
# Plugin skills index on presence, not on enablement. Enablement lives in more
# than one place: anthropic-skills is live in a session without appearing in
# settings.json enabledPlugins, and filtering on that file called two working
# destinations dead. A false alive costs nothing here. A false dead gets a
# working route deleted.
find "$HOME/.claude/plugins" -path "*/skills/*" -name SKILL.md 2>/dev/null | while read -r f; do
  d="$(dirname "$f")"; name="$(basename "$d")"
  rel="${f#"$HOME/.claude/plugins/"}"
  if [[ "$rel" == cache/* ]]; then
    # cache/<marketplace>/<plugin>/<version>/skills/[<group>/]<name>: a plugin may nest skills in groups.
    plugin="$(cut -d/ -f3 <<<"$rel")"
  else
    up="$(dirname "$(dirname "$d")")"
    case "$(basename "$up")" in [0-9]*.[0-9]*) up="$(dirname "$up")" ;; esac
    plugin="$(basename "$up")"
  fi
  printf '%s\n%s:%s\n' "$name" "$plugin" "$name"
done >> "$index"
sort -u -o "$index" "$index"

dead=0
for file in "$@"; do
  [ -f "$file" ] || { printf 'FAIL  no such file: %s\n' "$file"; dead=1; continue; }
  while read -r name; do
    [ -n "$name" ] || continue
    if grep -qxF "$name" "$index"; then
      printf 'ok    %-44s %s\n' "/$name" "${file/#$HOME/~}"
    else
      printf 'DEAD  %-44s %s\n' "/$name" "${file/#$HOME/~}"
      dead=1
    fi
  done < <(
    if [[ "$file" == *.json ]]; then
      jq -r '.questions | to_entries[] | .value.criteria | if type=="object" then keys[] else empty end' "$file" | sort -u
    else
      # A trailing space makes an end-of-line destination match the same rule as
      # a mid-line one. A destination is never followed by a slash, which is what
      # separates /deslop from a path segment like ~/mama-frontend/app.
      sed 's|$| |' "$file" \
        | grep -ohE '(^|[^A-Za-z0-9_/<>~.-])/[a-z][a-z0-9-]*(:[a-z][a-z0-9-]*)?[^A-Za-z0-9_:/-]' \
        | grep -oE '/[a-z][a-z0-9:-]*' | sed 's|^/||' | sort -u
    fi
  )
done

for file in "$@"; do
  [[ "$file" == *.json ]] || continue
  base="$(basename "$file" .json)"
  case "$base" in
    orchestrate-frontend) md="$(dirname "$file")/../../skills/dev/orchestrate/references/frontend.md" ;;
    orchestrate-backend)  md="$(dirname "$file")/../../skills/dev/orchestrate/references/backend.md" ;;
    *) continue ;;
  esac
  [ -f "$md" ] || { printf 'FAIL  no fallback md for %s\n' "$file"; dead=1; continue; }
  keys="$(jq -r '.questions | to_entries[] | .value.criteria | if type=="object" then keys[] else empty end' "$file" | sort -u)"
  slashes="$(sed 's|$| |' "$md" \
    | grep -ohE '(^|[^A-Za-z0-9_/<>~.-])/[a-z][a-z0-9-]*(:[a-z][a-z0-9-]*)?[^A-Za-z0-9_:/-]' \
    | grep -oE '/[a-z][a-z0-9:-]*' | sed 's|^/||' | sort -u)"
  only_json="$(comm -23 <(printf '%s\n' "$keys") <(printf '%s\n' "$slashes"))"
  only_md="$(comm -13 <(printf '%s\n' "$keys") <(printf '%s\n' "$slashes"))"
  if [ -n "$only_json" ]; then
    printf 'DRIFT schema-only %s\n' "$only_json" | sed "s|^|  |"; dead=1
  fi
  if [ -n "$only_md" ]; then
    printf 'DRIFT md-only %s\n' "$only_md" | sed "s|^|  |"; dead=1
  fi
  [ -z "$only_json$only_md" ] && printf 'ok    %-44s schema matches %s\n' "$base" "${md##*/}"
done

printf '\n%s skills indexed across %s roots\n' "$(wc -l < "$index" | tr -d ' ')" "${#ROOTS[@]}"
[ "$dead" -eq 0 ] && echo "every destination resolves" || echo "unreachable destinations above. A project skill in one worktree cannot be named by a global table."
exit $dead
