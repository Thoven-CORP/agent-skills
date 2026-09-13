#!/usr/bin/env bash
# Probe a target machine (e.g. a Devin cloud box) for the right `npx skills`
# adapter, then print the recommended install command.
#
# Dry run by default: discovers and recommends only — nothing is installed and
# the global catalog is never mutated. Pass --apply to actually run the
# recommended install, then `apply-skill-visibility.sh sync`, then verify.
#
# Why discovery instead of assuming `devin`: this repo documents only
# claude-code / cursor / codex / hermes targets. The `skills` CLI's `-a` list
# grows over time, so we ask the installed CLI what it supports.
set -euo pipefail

REPO="Thoven-CORP/agent-skills"
# A skill that exists in this repo — used as the post-install canary and as the
# capability-probe selector. (find-skills/poteto-mode are NOT in this repo.)
CANARY_SKILL="qa-flow"
# Deliberately invalid adapter name: the CLI prints its full "Valid agents:"
# list and exits before installing anything. That is our enumeration path.
SENTINEL_ADAPTER="__no_such_adapter__"

canonical_dir="$HOME/.agents/skills"
xdg_config="${XDG_CONFIG_HOME:-$HOME/.config}"

apply=0
case "${1:-}" in
  "") ;;
  --apply) apply=1 ;;
  -h|--help)
    printf 'Usage: %s [--apply]\n  (default) dry run: probe and print the recommended install command.\n  --apply   run the recommended install, sync visibility, and verify.\n' "$0"
    exit 0
    ;;
  *) printf 'Unknown flag: %s (only --apply is supported)\n' "$1" >&2; exit 2 ;;
esac

say()  { printf '%s\n' "$*"; }
hr()   { printf -- '--- %s ---\n' "$*"; }

strip_ansi() { sed -e 's/\x1b\[[0-9;?]*[a-zA-Z]//g' -e 's/\x1b\[[0-9;?]*[hlGKJ]//g'; }

# ---------------------------------------------------------------- preflight
hr "preflight"
if ! command -v npx >/dev/null 2>&1; then
  say "FAIL: npx not found. Install Node.js first (https://nodejs.org) — the skills CLI runs via 'npx skills'." >&2
  exit 1
fi
command -v node >/dev/null 2>&1 || say "warn: 'node' not on PATH; npx may still work."
cli_version="$(npx -y skills --version 2>/dev/null | strip_ansi | tr -d '[:space:]' || true)"
if [[ -n "$cli_version" ]]; then
  say "skills CLI version: $cli_version"
else
  say "warn: 'npx skills --version' produced no output; continuing anyway."
fi

# ------------------------------------------------------ adapter discovery
hr "adapter discovery"
valid_agents=""
devin_supported=""

# (a) Try the static help text first — newer CLI versions may enumerate -a values.
help_out="$( { npx -y skills add --help; npx -y skills --help; } 2>&1 || true)"
help_clean="$(printf '%s' "$help_out" | strip_ansi)"

# A line like "Valid agents: a, b, c" or "-a, --agent <agents>  (one of: x, y)"
enum_line="$(printf '%s\n' "$help_clean" | grep -iE 'valid agents:|supported agents:|one of:|adapters:' | head -1 || true)"
if [[ -n "$enum_line" ]]; then
  say "help text enumerates adapters:"
  say "  $enum_line"
  # Take the comma-separated tail after the first ':' and split it.
  valid_agents="$(printf '%s' "${enum_line#*:}" | tr ',' '\n' | sed 's/^ *//; s/ *$//' | grep -v '^$' || true)"
fi

# (b) Fall back to a non-mutating capability probe. An invalid -a makes the CLI
# print "Valid agents: ..." and exit(1) BEFORE any install step — no writes.
if [[ -z "$valid_agents" ]]; then
  # Only skip the probe if a real dry-run flag exists for `add`; if so, use it.
  if printf '%s' "$help_clean" | grep -qE -- '--dry-run|--dry'; then
    dry_flag="$(printf '%s' "$help_clean" | grep -oE -- '--dry(-run)?' | head -1)"
    say "CLI supports $dry_flag — probing '-a devin' directly:"
    probe_out="$(npx -y skills add "$REPO" -a devin --skill "$CANARY_SKILL" "$dry_flag" 2>&1 | strip_ansi || true)"
    printf '%s\n' "$probe_out" | tail -5
    if printf '%s' "$probe_out" | grep -qiE 'invalid agent|unknown agent|not supported'; then
      devin_supported="no"
    else
      devin_supported="yes"
    fi
  else
    say "help text does not enumerate adapters and 'add' has no dry-run flag."
    say "Running a safe capability probe instead: '-a $SENTINEL_ADAPTER' is rejected"
    say "before the install phase, so this enumerates valid adapters with no writes."
    probe_out="$(npx -y skills add "$REPO" -g -y --skill '*' -a "$SENTINEL_ADAPTER" 2>&1 | strip_ansi || true)"
    agents_line="$(printf '%s\n' "$probe_out" | grep -E 'Valid agents:' | tail -1 || true)"
    if [[ -n "$agents_line" ]]; then
      valid_agents="$(printf '%s' "${agents_line#*Valid agents:}" | tr ',' '\n' | sed 's/^ *//; s/ *$//' | grep -v '^$' || true)"
    else
      say "probe output (tail):"
      printf '%s\n' "$probe_out" | tail -8
      say "warn: could not enumerate valid adapters (network/auth/source fetch may have failed)."
    fi
  fi
fi

if [[ -n "$valid_agents" ]]; then
  say "adapters reported by the CLI:"
  printf '%s\n' "$valid_agents" | sed 's/^/  /'
  if printf '%s\n' "$valid_agents" | grep -qx 'devin'; then
    devin_supported="yes"
  else
    devin_supported="no"
  fi
fi

case "$devin_supported" in
  yes) say "RESULT: 'devin' IS a supported -a adapter on this CLI." ;;
  no)  say "RESULT: 'devin' is NOT among the supported adapters on this CLI." ;;
  *)   say "RESULT: could not confirm 'devin' — verify manually before installing." ;;
esac

# -------------------------------------------------- canonical catalog check
hr "catalog discovery"
check_dir() {
  local label="$1" dir="$2"
  if [[ -d "$dir" ]]; then
    local n
    n="$(find "$dir" -maxdepth 2 -name SKILL.md 2>/dev/null | wc -l | tr -d ' ')"
    printf '  exists  %-45s (%s SKILL.md files)\n' "$dir" "$n"
  else
    printf '  absent  %s\n' "$dir"
  fi
}
say "canonical + per-tool catalogs:"
check_dir canonical        "$canonical_dir"
check_dir "devin (~)"      "$HOME/.devin/skills"
check_dir "devin (xdg)"    "$xdg_config/devin/skills"
check_dir "claude"         "$HOME/.claude/skills"
check_dir "cursor"         "$HOME/.cursor/skills"
check_dir "hermes"         "$HOME/.hermes/skills"
check_dir "codex"          "$HOME/.codex/skills"

on_devin_box="no"
if [[ -n "${DEVIN_DIR:-}" || -d /opt/.devin || -d "$HOME/.devin-files" ]]; then
  on_devin_box="yes"
fi
say "looks like a Devin-managed machine: $on_devin_box"

# ----------------------------------------------------------- recommendation
hr "recommendation"
rec_cmd=()
rec_reason=""

if [[ "$devin_supported" == "yes" ]]; then
  rec_cmd=(npx skills add "$REPO" -g -y -a devin --skill '*')
  rec_reason="'devin' is a supported adapter — install globally and link the Devin catalog."
elif [[ "$devin_supported" == "no" ]]; then
  if [[ "$on_devin_box" == "yes" && ! -d "$HOME/.devin/skills" && ! -d "$xdg_config/devin/skills" ]]; then
    rec_reason="No 'devin' adapter and no Devin-specific catalog dir — this agent likely reads the canonical ~/.agents/skills/ directly (like Codex)."
    if printf '%s\n' "$valid_agents" | grep -qx 'universal'; then
      rec_cmd=(npx skills add "$REPO" -g -y -a universal --skill '*')
      rec_reason+=" 'universal' targets the canonical catalog itself, so no extra per-tool symlinks are created."
    else
      rec_cmd=(npx skills add "$REPO" -g -y -a claude-code --skill '*')
      rec_reason+=" Every -a writes the canonical catalog first; a single minimal adapter avoids extra catalogs."
    fi
    rec_reason+=" Do NOT use '-a codex' — it creates a second model-visible catalog and can exhaust the skills-context budget."
  else
    rec_cmd=(npx skills add "$REPO" -g -y -a claude-code -a cursor --skill '*')
    rec_reason="'devin' unsupported but per-tool catalogs are wanted — use the documented claude-code + cursor command."
  fi
else
  rec_reason="Adapter list unavailable — cannot confirm 'devin'. Run the probe on a machine with GitHub access to $REPO, or check 'npx skills add --help' output manually."
fi

if ((${#rec_cmd[@]})); then
  say "$rec_reason"
  say ""
  say "Recommended install command:"
  printf '  %s\n' "${rec_cmd[*]}"
else
  say "$rec_reason"
  say ""
  say "Candidate commands (verify adapter name first):"
  say "  npx skills add $REPO -g -y -a devin --skill '*'"
  say "  npx skills add $REPO -g -y -a claude-code -a cursor --skill '*'"
fi

# Never suggest the bare auto-detect form — it targets every detected agent,
# including PromptScript, which fails once per skill.
say ""
say "Never run 'npx skills add $REPO -g -y' with no -a: it auto-detects every"
say "agent (including PromptScript) and prints a wall of red false failures."

# ------------------------------------------------------------------- apply
if ((apply == 0)); then
  say ""
  say "Dry run — nothing was installed. Re-run with --apply to execute."
  exit 0
fi

hr "apply"
if ((${#rec_cmd[@]} == 0)); then
  say "Refusing to --apply without a confirmed recommendation. Re-run after the probe can reach GitHub." >&2
  exit 1
fi

say "running: ${rec_cmd[*]}"
"${rec_cmd[@]}"

# Sync visibility on every catalog that actually got populated. Note: a
# single-adapter install (e.g. '-a devin') copies straight into that adapter's
# catalog and may never create the canonical ~/.agents/skills — so sync is
# keyed off what exists, not what we asked for.
sync_script="$(cd "$(dirname "$0")" && pwd)/apply-skill-visibility.sh"
if [[ -f "$sync_script" ]]; then
  synced=0
  if [[ -d "$canonical_dir" ]]; then
    say "running: bash $sync_script sync   (canonical catalog)"
    if bash "$sync_script" sync; then synced=1; else say "warn: visibility sync failed on $canonical_dir" >&2; fi
  fi
  for cat in "$xdg_config/devin/skills" "$HOME/.devin/skills"; do
    if [[ -d "$cat" && ! -L "$cat" ]]; then
      say "running: SKILLS_DIR=$cat bash $sync_script sync"
      if SKILLS_DIR="$cat" PARKED_SKILLS_DIR="$(dirname "$cat")/skills-on-demand" bash "$sync_script" sync; then
        synced=1
      else
        say "warn: visibility sync failed on $cat" >&2
      fi
    fi
  done
  if ((synced == 0)); then
    say "warn: no populated catalog found to sync — nothing parked." >&2
  fi
else
  say "warn: $sync_script not found — skipping visibility sync." >&2
fi

# -------------------------------------------------------------- verify
hr "verify"
fail=0
found_canary=0
for cat in "$canonical_dir" "$xdg_config/devin/skills" "$HOME/.devin/skills" \
           "$HOME/.claude/skills" "$HOME/.cursor/skills" "$HOME/.hermes/skills"; do
  if [[ ! -d "$cat" ]]; then continue; fi
  n="$(find "$cat" -maxdepth 2 -name SKILL.md 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$n" == "0" ]]; then continue; fi
  if grep -rl "^name: $CANARY_SKILL\$" "$cat"/*/SKILL.md >/dev/null 2>&1; then
    say "PASS  canary '$CANARY_SKILL' present in $cat ($n skills)"
    found_canary=1
  else
    say "warn  $cat holds $n skills but canary '$CANARY_SKILL' is missing"
  fi
done

if ((found_canary == 0)); then
  say "FAIL  canary '$CANARY_SKILL' not found in any catalog" >&2
  fail=1
fi

if ((fail)); then
  say "verify FAILED — the installer may have read a stale 'main' (push first) or reported false success." >&2
  exit 1
fi
say "verify PASSED"
