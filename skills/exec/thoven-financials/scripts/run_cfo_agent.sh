#!/bin/bash
# CFO Weekly Analyst — launchd wrapper
# Invokes Claude headlessly to run the cfo-weekly-analyst subagent.
# Triggered by ~/Library/LaunchAgents/co.thoven.cfo-weekly.plist (Mon 7am ET)
# or manually: bash ~/.claude/skills/thoven-financials/scripts/run_cfo_agent.sh

set -euo pipefail

# Ensure tools are findable (launchd has minimal PATH)
export PATH="/Users/andresmartinez/.local/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

# Logging
LOG_DIR="/Users/andresmartinez/.claude/skills/thoven-financials/logs"
mkdir -p "$LOG_DIR"
TIMESTAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
RUN_LOG="$LOG_DIR/cfo-weekly-${TIMESTAMP}.log"

# Headless Claude invocation
# - --print: non-interactive, output to stdout
# - --max-budget-usd 3.00: hard ceiling on cost per run (typical ~$0.30-0.80 with Sonnet)
# - --no-session-persistence: don't leave session artifacts
# - PATH set above ensures Bash tool can find `mercury`
#
# CRITICAL: We MUST dispatch the cfo-weekly-analyst subagent via Task tool,
# NOT do the work directly in this parent session. The subagent has the
# strict "no shortcuts" prompt that prevents calling the deterministic
# Python script. The parent session has no such constraints.
PROMPT='You are a dispatcher. Your ONLY job is to invoke the cfo-weekly-analyst subagent via the Task tool. Do NOT do any of the analysis yourself. Do NOT call any Python scripts. Do NOT call mercury directly. Do NOT write any files yourself.

Specifically:
1. Use the Task tool with subagent_type "cfo-weekly-analyst" (or "general-purpose" if cfo-weekly-analyst is not a registered type, in which case pass the entire system prompt from ~/.claude/agents/cfo-weekly-analyst.md as context).
2. Wait for the subagent to complete.
3. Report back in ONE LINE: the path of the report file the subagent wrote, the cash balance, the runway, and the number of overages it flagged.
4. Do not produce any other output.

The subagent has explicit anti-shortcut rules in its system prompt. Trust it. Do not second-guess.

If for any reason you cannot dispatch the subagent, write a failure stub to /Users/andresmartinez/Vaults/Executive Assistant/CFO/weekly-reports/failed-$(date +%Y-%m-%d)-cfo-report.md explaining the issue, and exit.'

claude \
    --print \
    --max-budget-usd 3.00 \
    --no-session-persistence \
    --output-format text \
    "$PROMPT" \
    > "$RUN_LOG" 2>&1

EXIT=$?

if [ $EXIT -ne 0 ]; then
    echo "cfo-weekly agent FAILED (exit $EXIT) — see $RUN_LOG" >&2
    osascript -e "display notification \"CFO agent failed — see logs\" with title \"CFO Agent\"" 2>/dev/null || true
fi

# Print summary to stdout (launchd captures this in StandardOutPath)
tail -5 "$RUN_LOG"
exit $EXIT
