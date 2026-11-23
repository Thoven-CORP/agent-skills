#!/usr/bin/env bash
# mine-transcripts.sh — extract analyzable digests from Claude Code, Cursor and Codex transcripts.
#
# Raw transcripts are far too large to read (one Claude Code session hit 36 MB; Codex holds
# ~1.9 GB since 2026-09-10). This produces small, greppable artifacts an agent CAN read.
#
#   ./scripts/mine-transcripts.sh --since 2026-09-15 --out /tmp/mine
#
# Outputs, under --out:
#   index.tsv     one row per session: harness, id, project, mtime, bytes, user turns, tool calls, errors
#   prompts.tsv   HUMAN-typed turns only, with provenance. Pass --include-subagents to keep
#                 agent-authored dispatches too. The distinction matters; see NOISE below.
#   tools.tsv     harness, session, tool name, call count
#   skills.tsv    harness, session, skill or /slash invocation, count, origin. A skill counts only when
#                 it is loaded: a Skill call, a /slash command, a Read of its SKILL.md, the "Base directory
#                 for this skill" message, a Codex <skill> injection or a Codex shell read (cat, sed, head,
#                 nl) of its SKILL.md, in every origin (main, subagent, pane). An Edit, Write, rg or a
#                 path inside REPL code or an Agent prompt only mentions it.
#   repeats.tsv   runs of 3+ identical consecutive COMMANDS (not tool names). The loop signal.
#   polling.tsv   per session, calls that only wait for something. Pure waste; see mine_claude.
#   errors.tsv    failed tool results with the tool that failed
#   tokens.tsv    per-session usage, deduped by message.id, with cache_read and cache_create split
#   corrections.tsv  turns that correct, re-explain or push back, with the agent's text just before,
#                 the last skill loaded, the turn's source (Claude Code's promptSource: typed, sdk,
#                 queued; "-" when absent), every skill the session had loaded by then, and the origin:
#                 main (Andres in a main session), subagent (main writing to a Claude or Codex subagent)
#                 or pane (main or Andres inside a dispatched pane). thoven-reflect reads corrections.md,
#                 the same rows grouped by session with each transcript's path.
#
# Validation: on a 0.8GB / 232-session corpus this agreed with an independent reimplementation
# to within 0.4% on human turns and 3% on token totals. Treat that agreement as weak evidence:
# two implementations reading the same unfiltered input agree on the same false positives. Spot-
# check the actual TEXT of what a classifier matched before trusting any ratio built on it. Re-check tool counts against
#   jq -r 'select(.type=="assistant")|.message.content[]?|select(.type=="tool_use")|.name'
# if you change the extraction. Live sessions append while it runs, so expect ~1% drift.
#
# Requires: jq, sqlite3 (both ship with macOS dev tooling).
set -uo pipefail

SINCE="2026-09-15"
OUT="/tmp/mine-transcripts"
HARNESS="all"
INCLUDE_SUBAGENTS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --since)   SINCE="$2"; shift 2 ;;
    --out)     OUT="$2"; shift 2 ;;
    --harness) HARNESS="$2"; shift 2 ;;
    --include-subagents) INCLUDE_SUBAGENTS=1; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$OUT"
: > "$OUT/index.tsv"; : > "$OUT/prompts.tsv"; : > "$OUT/tools.tsv"
: > "$OUT/skills.tsv"; : > "$OUT/repeats.tsv"; : > "$OUT/errors.tsv"; : > "$OUT/tokens.tsv"; : > "$OUT/polling.tsv"; : > "$OUT/corrections.tsv"

printf 'harness\tsession\tproject\tmtime\tbytes\tuser_turns\ttool_calls\terrors\n' >> "$OUT/index.tsv"
printf 'harness\tsession\tturn\ttext\n'          >> "$OUT/prompts.tsv"
printf 'harness\tsession\ttool\tcount\n'         >> "$OUT/tools.tsv"
printf 'harness\tsession\tskill\tcount\torigin\n' >> "$OUT/skills.tsv"
printf 'harness\tsession\ttool\tconsecutive\n'   >> "$OUT/repeats.tsv"
printf 'harness\tsession\ttool\tmessage\n'       >> "$OUT/errors.tsv"
printf 'harness\tsession\tinput\toutput\tcache_read\tcache_create\n' >> "$OUT/tokens.tsv"
printf 'harness\tsession\tpolling_calls\n'  >> "$OUT/polling.tsv"
printf 'harness\tsession\tpath\tts\tlast_skill\tagent_before\ttext\tsource\tskills\torigin\n' >> "$OUT/corrections.tsv"

# A user turn is REAL only if a human typed it. Everything else arriving in the `user` slot is
# machinery, and leaving it in is not a cosmetic problem: an unfiltered corpus attributes an
# orchestrator's re-emitted prompts to the human and inflates every repeat count. On the first
# run of this script a phrase that appeared 13 times looked like the human retyping a hard-won
# gotcha; all 13 were subagent dispatches. The filter below is the finding, encoded.
#
# Eight classes, each verified present in a real corpus:
#   1 harness injections      system reminders, hooks, slash-command echoes, stdout
#   2 skill bodies            the SKILL.md text a Skill call pastes into the user slot
#   3 inter-agent relay       teammate messages and idle notifications
#   4 Codex approval scaffold the reviewer harness wrapped around a proposed action
#   5 transcript replay       prior turns re-pasted into a reviewer, up to 20x each
#   6 context injection       environment_context, AGENTS.md bodies, image envelopes
#   7 compaction summaries    the resume preamble after a context overflow
#   8 relayed pane reports    an agent's own BUILT/FIXED status line, pasted back in by the human
#
# Class 8 is subtle and it cost a published headline. A relayed pane report arrives in the user
# slot and IS pasted by the human, so authorship filters keep it -- but the human is acting as a
# transport, not instructing. Counting those as instructions, together with class 4 boilerplate
# matching on the word "evidence", inflated a prescriptive:reactive ratio from 0.95:1 to 3.5:1.
# Three separate classifiers agreed on that number because all three shared the same false
# positive. Agreement between implementations is not evidence when they read the same dirty input.
NOISE='^(<system-reminder>|<local-command-caveat>|<command-name>|<command-message>|<local-command-stdout>|<recommended_plugins>|<user-prompt-submit-hook>|<task-notification>|<ci-monitor-event>|<codex_internal_context|Caveat: The messages below|Base directory for this skill:|Another Claude session sent a message|<teammate-message|\{"type":"idle_notification|>>> (APPROVAL REQUEST|TRANSCRIPT)|Planned action JSON|Assess the exact planned action|The Codex agent has requested|The following is the Codex agent history|Reviewed Codex session id:|\\\\n\[[0-9]+\] |\[[0-9]+\] (user|assistant|tool)|<environment_context>|# AGENTS\.md instructions|<skill>|</?image>$|<subagent_notification>|\{.*"command":|This session is being continued|\\\\nSome conversation entries were omitted|Some conversation entries were omitted|(BUILT|FIXED|FIXED-[0-9]|BLOCKED|DONE|DONE_WITH_CONCERNS|NEEDS_CONTEXT|STATUS) THV-[0-9]+ )'

# Prompts recorded under a session id beginning `agent-` were written BY an agent, not by the
# human. Kept out of the human corpus unless --include-subagents is passed, because conflating
# the two is what produced the false finding described above.
AUTHOR_FILTER='^agent-'

clean() { tr '\t\n\r' '   ' | sed 's/  */ /g' | cut -c1-2000; }

# ---------------------------------------------------------------- Claude Code
mine_claude() {
  local f sid proj turns tools errs origin
  while IFS= read -r f; do
    sid=$(basename "$f" .jsonl)
    proj=$(basename "$(dirname "$f")")
    origin=main
    [[ "$sid" =~ $AUTHOR_FILTER || "$f" == */subagents/* ]] && origin=subagent
    claude_turns "$sid" "$f" > "$OUT/.turns"
    origin=$(session_origin "$origin" < "$OUT/.turns")

    # Real user turns: role=user, content is a string or carries a text block, and no tool_result.
    jq -r --arg h claude --arg s "$sid" '
      select(.type=="user" and .message.role=="user")
      | .message.content as $c
      | ( if ($c|type)=="string" then $c
          elif ($c|type)=="array" then
            (if ($c | map(select(.type=="tool_result")) | length) > 0 then empty
             else ($c | map(select(.type=="text").text) | join(" ")) end)
          else empty end )
      | select(. != null and . != "")
      | [$h, $s, .] | @tsv' "$f" 2>/dev/null \
      | awk -F"\t" -v noise="$NOISE" -v author="$AUTHOR_FILTER" -v inc="$INCLUDE_SUBAGENTS" '$3 !~ noise && (inc==1 || $2 !~ author) {print $1"\t"$2"\t"NR"\t"$3}' \
      | cut -c1-2000 >> "$OUT/prompts.tsv"

    # Column 4 is a SIGNATURE, not just the tool name. Keying repeats on the name alone is
    # useless here: consecutive Bash is the normal shape of a session (92.6% of Bash calls sit
    # in a run of 3+), so a name-keyed detector reports every working agent as looping. The
    # signature is name + the leading 60 chars of the command or path, which is what actually
    # distinguishes "making progress" from "running the same thing again".
    jq -r --arg h claude --arg s "$sid" '
      select(.type=="assistant") | .message.content[]? | select(.type=="tool_use")
      | [$h, $s, .name,
         (.name + ":" + ((.input.command // .input.file_path // .input.pattern // "")
                         | tostring | gsub("\\s+"; " ") | .[0:60]))] | @tsv' "$f" 2>/dev/null > "$OUT/.tc"

    # Polling is the expensive anti-pattern the harness already solves: it re-invokes on task
    # completion, and Monitor / notify_when_idle exist. Every poll is a full model turn against
    # a large cached prefix, so a session that watches a log file by hand pays repeatedly to
    # learn nothing. Counted separately because it is invisible in any per-tool view.
    awk -F'\t' -v h=claude -v s="$sid" '
      $4 ~ /(sleep |herdr agent wait|until \[|tail -c|\.output|&& echo READY|wait_agent)/ {n++}
      END {if (n>0) print h"\t"s"\t"n}' "$OUT/.tc" >> "$OUT/polling.tsv"

    # Skill loads: the Skill tool, /slash commands, a Read of a SKILL.md, and a "Base directory for this
    # skill" message that no Skill call or slash command just produced (that one is their echo).
    jq -rn --arg h claude --arg s "$sid" --arg o "$origin" "$SKILL_JQ"'
      foreach inputs as $e ({pending: [], out: []};
        .out = []
        | if $e.type == "assistant" then
            reduce ($e.message.content[]? | select(.type == "tool_use")) as $c (.;
              if $c.name == "Skill" then .out += [$c.input.skill // "?"] | .pending += [($c.input.skill // "") | split(":") | last]
              elif $c.name == "Read" then read_skill($c.input.file_path) as $n | (if $n == "" then . else .out += [$n] end)
              else . end)
          elif $e.type == "user" and $e.isMeta == true then
            meta_skill($e) as $n
            | if $n == "" then . elif any(.pending[]; . == $n) then .pending -= [$n] else .out += [$n] end
          elif $e.type == "user" and ($e.message.content | type) == "string" then
            ((($e.message.content | capture("<command-name>(?<c>[^<]+)</command-name>")? | .c) // "") | ltrimstr("/")) as $c
            | if $c == "" then . else .out += ["/" + $c] | .pending += [$c | split(":") | last] end
          else . end;
        .out[])
      | [$h, $s, ., $o] | @tsv' "$f" 2>/dev/null >> "$OUT/.sk"

    jq -r --arg h claude --arg s "$sid" '
      select(.type=="user") | .message.content[]? | select(.type=="tool_result" and .is_error==true)
      | [$h, $s, "?", ((.content // "" | tostring))] | @tsv' "$f" 2>/dev/null \
      | clean >> "$OUT/errors.tsv"

    # Usage must be deduped by message.id. A streamed assistant message writes many JSONL rows
    # carrying the SAME cumulative usage block, so summing rows double-counts: on one session
    # 3,011 rows represented 1,644 messages, overstating output 3.2x and cache reads 1.9x.
    # `cache_creation_input_tokens` is a separate billed bucket and was being dropped entirely.
    jq -rs --arg h claude --arg s "$sid" '
      [ .[] | select(.type=="assistant" and .message.usage != null)
            | {id: .message.id, u: .message.usage} ]
      | group_by(.id) | map(.[0].u)
      | [ $h, $s,
          (map(.input_tokens//0)               | add // 0),
          (map(.output_tokens//0)              | add // 0),
          (map(.cache_read_input_tokens//0)    | add // 0),
          (map(.cache_creation_input_tokens//0)| add // 0) ]
      | @tsv' "$f" 2>/dev/null >> "$OUT/tokens.tsv"

    turns=$(grep -c "	$sid	" "$OUT/prompts.tsv" 2>/dev/null || true)
    tools=$(wc -l < "$OUT/.tc" | tr -d ' ')
    errs=$(grep -c "^claude	$sid	" "$OUT/errors.tsv" 2>/dev/null || true)
    printf 'claude\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
      "$sid" "$proj" "$(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$f")" "$(stat -f '%z' "$f")" \
      "$turns" "$tools" "$errs" >> "$OUT/index.tsv"

    consecutive_repeats claude "$sid" < "$OUT/.tc"
    flag_corrections claude "$origin" < "$OUT/.turns"
    cut -f1-3 "$OUT/.tc" | sort | uniq -c | awk '{print $2"\t"$3"\t"$4"\t"$1}' >> "$OUT/tools.tsv"
  done < <(find ~/.claude/projects -name '*.jsonl' -type f -newermt "$SINCE" 2>/dev/null)
}

# ---------------------------------------------------------------------- Cursor
# prompt_history.json is a plain array of the user's raw prompts. Nothing else in Cursor's
# store is readable without decoding its blob format, so this harvests turns only.
mine_cursor() {
  local p sid n
  while IFS= read -r p; do
    sid=$(basename "$(dirname "$p")")
    jq -r --arg h cursor --arg s "$sid" '.[]? | select(type=="string" and length>0) | [$h,$s,.] | @tsv' "$p" 2>/dev/null \
      | awk -F"\t" -v noise="$NOISE" -v author="$AUTHOR_FILTER" -v inc="$INCLUDE_SUBAGENTS" '$3 !~ noise && (inc==1 || $2 !~ author) {print $1"\t"$2"\t"NR"\t"$3}' \
      | cut -c1-2000 >> "$OUT/prompts.tsv"
    jq -r --arg h cursor --arg s "$sid" '.[]? | select(type=="string") | select(startswith("/"))
      | [$h,$s,(split(" ")[0]),"main"] | @tsv' "$p" 2>/dev/null >> "$OUT/.sk"
    n=$(jq -r 'length' "$p" 2>/dev/null || echo 0)
    printf 'cursor\t%s\t%s\t%s\t%s\t%s\t-\t-\n' \
      "$sid" "$(basename "$(dirname "$(dirname "$p")")")" \
      "$(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$p")" "$(stat -f '%z' "$p")" "$n" >> "$OUT/index.tsv"
  done < <(find ~/.cursor/chats -name 'prompt_history.json' -newermt "$SINCE" 2>/dev/null)
}

# ----------------------------------------------------------------------- Codex
mine_codex() {
  local f sid turns tools origin
  while IFS= read -r f; do
    sid=$(basename "$f" .jsonl | sed 's/^rollout-//')
    # A Codex subagent is its own rollout file; its session_meta names the thread that spawned it.
    origin=$(jq -r 'select(.type=="session_meta")
      | if (.payload.thread_source == "subagent" or ((.payload.source | type) == "object" and .payload.source.subagent != null))
        then "subagent" else "main" end' "$f" 2>/dev/null | head -1)
    codex_turns "$sid" "$f" > "$OUT/.turns"
    origin=$(session_origin "${origin:-main}" < "$OUT/.turns")

    # A subagent's user turns are its parent's prompts, so they stay out of the human corpus.
    [[ "$origin" == subagent && "$INCLUDE_SUBAGENTS" == 0 ]] || jq -r --arg h codex --arg s "$sid" '
      select(.type=="response_item" and .payload.type=="message" and .payload.role=="user")
      | .payload.content[]? | select(.type=="input_text") | .text
      | select(. != null and . != "")
      | [$h,$s,.] | @tsv' "$f" 2>/dev/null \
      | awk -F"\t" -v noise="$NOISE" -v author="$AUTHOR_FILTER" -v inc="$INCLUDE_SUBAGENTS" '$3 !~ noise && (inc==1 || $2 !~ author) {print $1"\t"$2"\t"NR"\t"$3}' \
      | cut -c1-2000 >> "$OUT/prompts.tsv"

    # Codex skill use: the <skill> body it injects as a user turn, and shell reads of a SKILL.md.
    jq -r --arg h codex --arg s "$sid" --arg o "$origin" "$SKILL_JQ"'
      (.payload // {}) as $q
      | if ($q.type == "message" and $q.role == "user") then
          ($q.content[]? | (.text? // "") | capture("^<skill>\\s*<name>(?<n>[^<]+)</name>")? | .n)
        elif ($q.type == "function_call" or $q.type == "custom_tool_call") then
          shell_read($q.arguments // $q.input // "")[]
        else empty end
      | [$h, $s, ., $o] | @tsv' "$f" 2>/dev/null >> "$OUT/.sk"

    jq -r --arg h codex --arg s "$sid" '
      select(.payload.type=="custom_tool_call" or .payload.type=="function_call")
      | [$h,$s,(.payload.name // "?"),
         ((.payload.name // "?") + ":" + ((.payload.input // .payload.arguments // "")
            | tostring | gsub("\\s+"; " ") | .[0:60]))] | @tsv' "$f" 2>/dev/null > "$OUT/.tc"

    jq -r --arg h codex --arg s "$sid" '
      select(.type=="token_usage_record")
      | [$h,$s,(.payload.usage.input_tokens//0),(.payload.usage.output_tokens//0),(.payload.usage.cached_input_tokens//0)]
      | @tsv' "$f" 2>/dev/null \
      | awk -F'\t' '{i+=$3;o+=$4;c+=$5} END {if(NR>0) print $1"\t"$2"\t"i"\t"o"\t"c}' >> "$OUT/tokens.tsv"

    turns=$(grep -c "	$sid	" "$OUT/prompts.tsv" 2>/dev/null || true)
    tools=$(wc -l < "$OUT/.tc" | tr -d ' ')
    printf 'codex\t%s\t%s\t%s\t%s\t%s\t%s\t-\n' \
      "$sid" "$(dirname "$f" | sed 's|.*/sessions/||')" \
      "$(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$f")" "$(stat -f '%z' "$f")" "$turns" "$tools" >> "$OUT/index.tsv"

    consecutive_repeats codex "$sid" < "$OUT/.tc"
    flag_corrections codex "$origin" < "$OUT/.turns"
    cut -f1-3 "$OUT/.tc" | sort | uniq -c | awk '{print $2"\t"$3"\t"$4"\t"$1}' >> "$OUT/tools.tsv"
  done < <(find ~/.codex/sessions -name '*.jsonl' -type f -newermt "$SINCE" 2>/dev/null)
}

# Corrections are the thoven-reflect signal: a turn that pushes back on what the agent just did. Each
# row keeps the agent's text before it, the last skill loaded and every skill loaded so far, because a
# correction without its trigger cannot be routed to a skill. Rows carry their origin. In a main session
# the human is Andres. A subagent's turns are main writing to it, and a pane's turns are main relaying or
# Andres typing into it; for both, the first turn is the brief and is skipped, and the sender label or
# <teammate-message> wrapper is stripped. A bare "try again" is a retry, not a lesson. Only the
# speaker's own words count: a pasted pane report inside <pasted_content> is transport (class 8), and in a
# main session so is a herdr relay. A message re-sent word for word counts once. BRIEF's last two phrases
# are the dispatch-work v2 brief's opening lines, which survive filling its {{fields}}. A prompt Andres only
# accepted from Claude Code's suggestion chip (promptSource suggestion_accepted) is the agent's own words,
# and a compaction preamble is the harness's, so both are dropped by source. The Claude Desktop
# artifact-view wrapper is stripped rather than dropped: Andres's typed message follows it in the same turn.
CORRECTION='(i told you|i said|i already|we already|already (told|said|decided|did)|as i (said|mentioned)|again|remember|forgot|we (talked|discussed|decided|agreed)|last time|how many times|you keep|keep (doing|asking)|stop (doing|asking)|not what i|wrong|why did you|i never said|settled|stale|re-?ask|same (mistake|thing)|confused|lost|instead of)'
BRIEF='(DONE WHEN|REPORT TO|Writes to:|EXIT CRITERIA|Exit criteria|## Brief|herdr pane|Main is the Claude session|Read it in full first\. It holds the ticket)'
# herdr relays: main's prompt inside a pane session, or a pane's report typed into main. Each opens
# with a sender label ("Main:", "THV-1303 from main:", "F3 restore:", "Lock released:", "PR 319 run").
RELAY='^(MAIN|Main|main|THV-[0-9]+[^:]{0,30}|F[0-9]+[^:]{0,24}|Lock released|PR [0-9]+ run[^:]{0,30}):'
# The speaker's own words in a turn (field 6): pasted blocks and the artifact-view wrapper removed.
OWN_AWK='{ own = $6; gsub(/<pasted_content[^>]*>.*<\/pasted_content[^>]*>/, "", own)
  gsub(/<artifact-view-context[^>]*>.*<\/artifact-view-context>/, "", own); sub(/^(\\n|[ \t])+/, "", own) }'

# Prints main, subagent or pane for one session's turns. A main session whose first real turn is a
# long dispatch brief is a pane.
session_origin() {
  awk -F'\t' -v base="$1" -v noise="$NOISE" -v brief="$BRIEF" -v relay="$RELAY" '
    base != "main" {exit}
    $7 == "suggestion_accepted" || $7 == "compaction" {next}
    '"$OWN_AWK"'
    own ~ noise || own ~ relay || own == "" {next}
    {if (length($6) > 1500 && $6 ~ brief) base = "pane"; exit}
    END {print base}'
}

flag_corrections() {
  awk -F'\t' -v OFS='\t' -v h="$1" -v o="$2" -v since="$SINCE" -v noise="$NOISE" -v corr="(^|[^a-z])$CORRECTION([^a-z]|$)" -v relay="$RELAY" '
    '"$OWN_AWK"'
    o != "main" { sub(/^<teammate-message[^>]*>(\\n|[ \t])*/, "", own); sub(/(\\n|[ \t])*<\/teammate-message>(\\n|[ \t])*$/, "", own)
                  if (sub(relay, "", own)) sub(/^(\\n|[ \t])+/, "", own) }
    $7 == "suggestion_accepted" || $7 == "compaction" {next}
    own ~ noise || own ~ relay || own == "" || said[own]++ {next}
    o != "main" && !seen++ {next}
    $3 >= since && tolower(own) ~ corr && split(own, w, " ") > 3 {$6 = own; $9 = o; print h"\t"$0}' >> "$OUT/corrections.tsv"
}

# Shared by the skill readers: what counts as loading a skill, and adding one to the running set.
# Only a read loads a skill; an edit, a search or a path quoted in a prompt or REPL code mentions it.
SKILL_JQ='def read_skill($p): (($p // "") | tostring | capture("(?<n>[A-Za-z0-9._-]+)/SKILL\\.md$")? | .n) // "";
  def shell_read($t): [$t | tostring
    | scan("(?:^|[\\s\"\u0027])(?:cat|head|nl|sed)(?:\\s+-[a-z]+(?:\\s*[0-9,]+p?)?|\\s+\u0027[0-9,]+p\u0027)*\\s+[\"\u0027]?[^\\s\"\u0027]*/([A-Za-z0-9._-]+)/SKILL\\.md")
    | .[0]] | unique;
  def meta_skill($e): (($e.message.content | if type == "string" then . else ([.[]? | select(.type == "text") | .text] | join(" ")) end)
    | capture("^Base directory for this skill: [^\n]*/(?<n>[^/\n]+)")? | .n) // "";
  def loaded($n): if ($n // "") == "" then . else .skill = $n | (if any(.skills[]; . == $n) then . else .skills += [$n] end) end;'

claude_turns() {
  jq -rn --arg s "$1" --arg p "$2" "$SKILL_JQ"'
    foreach inputs as $e ({skill: "", skills: [], before: "", out: null};
      .out = null
      | if $e.type == "assistant" then
          reduce ($e.message.content[]?) as $c (.;
            if $c.type == "text" then .before = $c.text
            elif $c.type == "tool_use" and $c.name == "Skill" then loaded(($c.input.skill // "") | split(":") | last)
            elif $c.type == "tool_use" and $c.name == "Read" then loaded(read_skill($c.input.file_path))
            else . end)
        elif $e.type == "user" and $e.isMeta == true then loaded(meta_skill($e))
        elif $e.type == "user" and ($e.message.content | type) == "string" then
          .out = [$s, $p, (($e.timestamp // "")[0:16]), .skill, (.before | .[-300:]), $e.message.content,
                  (if $e.isCompactSummary then "compaction" else ($e.promptSource // "-") end), (.skills | join(","))]
        else . end;
      .out // empty) | @tsv' "$2" 2>/dev/null
}

codex_turns() {
  jq -rn --arg s "$1" --arg p "$2" "$SKILL_JQ"'
    foreach inputs as $e ({skill: "", skills: [], before: "", out: null};
      .out = null
      | ($e.payload // {}) as $q
      | if ($q.type == "function_call" or $q.type == "custom_tool_call") then
          reduce shell_read($q.arguments // $q.input // "")[] as $n (.; loaded($n))
        elif $q.type == "message" and $q.role == "assistant" then
          .before = ([$q.content[]? | .text? // empty] | join(" "))
        elif $q.type == "message" and $q.role == "user" then
          [$q.content[]? | .text? // empty] as $texts
          | reduce ($texts[] | capture("^<skill>\\s*<name>(?<n>[^<]+)</name>") | .n) as $n (.; loaded($n))
          | ([$texts[] | select(startswith("<skill>") | not)] | join(" ")) as $t
          | if $t == "" then . else
              .out = [$s, $p, (($e.timestamp // "")[0:16]), .skill, (.before | .[-300:]), $t, "-", (.skills | join(","))]
            end
        else . end;
      .out // empty) | @tsv' "$2" 2>/dev/null
}

corrections_md() {
  # The same opening words in several sessions are main forwarding a ruling to its panes: keep the first.
  awk -F'\t' 'NR == 1 || !said[substr($7, 1, 160)]++' "$OUT/corrections.tsv" > "$OUT/.corr" && mv "$OUT/.corr" "$OUT/corrections.tsv"
  awk -F'\t' 'NR > 1 {
      if ($3 != path) { path = $3; printf "\n## %s · %s · %s · %s\n\n", $1, $10, $4, $3 }
      who = ($10 == "subagent" ? "Main" : ($10 == "pane" ? "Main or Andres" : "Andres"))
      printf "- **%s** (last skill loaded: %s; skills loaded: %s)\n  - Agent before: %s\n  - %s: %s\n", $4, ($5 == "" ? "none" : $5), ($9 == "" ? "none" : $9), $6, who, $7
    }' "$OUT/corrections.tsv" > "$OUT/corrections.md"
}

# A run of 3+ identical back-to-back SIGNATURES (column 4) is the machine-visible form of "the
# agent is stuck repeating itself". Keyed on the tool name instead this finds nothing useful,
# because consecutive Bash is what a working session looks like.
consecutive_repeats() {
  awk -F'\t' -v h="$1" -v s="$2" '
    { if ($4==prev) n++; else { if (n>=3) print h"\t"s"\t"prev"\t"n; prev=$4; n=1 } }
    END { if (n>=3) print h"\t"s"\t"prev"\t"n }' >> "$OUT/repeats.tsv"
}

case "$HARNESS" in
  all)    mine_claude; mine_cursor; mine_codex ;;
  claude) mine_claude ;;
  cursor) mine_cursor ;;
  codex)  mine_codex ;;
  *) echo "unknown harness: $HARNESS" >&2; exit 2 ;;
esac

if [[ -f "$OUT/.sk" ]]; then
  sort "$OUT/.sk" | uniq -c | sort -rn | awk '{print $2"\t"$3"\t"$4"\t"$1"\t"$5}' >> "$OUT/skills.tsv"
fi
rm -f "$OUT/.tc" "$OUT/.sk" "$OUT/.turns"
corrections_md

echo "wrote $OUT"
wc -l "$OUT"/*.tsv
