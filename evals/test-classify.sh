#!/usr/bin/env bash
# Proves enforcement/bin/classify's contract against evals/stub-classifier.sh.
set -o pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
classify="$dir/../enforcement/bin/classify"
schema="$dir/schemas/example.json"
port=8721
failures=0

check() {
  local desc="$1" got="$2" want="$3"
  if [ "$got" = "$want" ]; then
    echo "PASS: $desc"
  else
    echo "FAIL: $desc (want $want, got $got)"
    failures=$((failures + 1))
  fi
}

start_stub() {
  "$dir/stub-classifier.sh" "$port" "$1" &
  stub_pid=$!
  for _ in $(seq 1 50); do
    curl -s -o /dev/null "http://127.0.0.1:$port/" 2>/dev/null && break
    sleep 0.1
  done
}

stop_stub() {
  kill "$stub_pid" 2>/dev/null
  wait "$stub_pid" 2>/dev/null
}

export CLASSIFY_ENDPOINT="http://127.0.0.1:$port/v1/systemone"

# no key set: undecided/no-key, exit 0, and no network call was made (no stub running to answer one)
out="$(env -u TYPESAFE_API_KEY CLASSIFY_ENDPOINT="$CLASSIFY_ENDPOINT" "$classify" "$schema" <<<'hello')"
rc=$?
check "no key: exit code" "$rc" "0"
check "no key: body" "$out" '{"schema":"example","status":"undecided","reason":"no-key"}'

export TYPESAFE_API_KEY="test-key"

# missing schema file: undecided/no-schema
out="$("$classify" "$dir/schemas/does-not-exist.json" <<<'hello')"
check "missing schema" "$out" '{"schema":"does-not-exist","status":"undecided","reason":"no-schema"}'

start_stub ok
out="$(CLASSIFY_TIMEOUT=2 "$classify" "$schema" <<<'hello')"
want='{"schema":"example","status":"answered","reason":"ok","answers":{"area":{"value":"billing","confidence":0.596,"binding":false},"is_urgent":{"value":true,"confidence":0.998,"binding":true},"severity":{"value":1.03,"confidence":0.842,"binding":true}}}'
got="$(jq -c -S '.' <<<"$out")"
want_sorted="$(jq -c -S '.' <<<"$want")"
check "ok: exact answered body (default floor 0.7)" "$got" "$want_sorted"

out="$(CLASSIFY_TIMEOUT=2 CLASSIFY_FLOOR=0.95 "$classify" "$schema" <<<'hello')"
severity_binding="$(jq -r '.answers.severity.binding' <<<"$out")"
check "binding false below floor 0.95 (confidence 0.842)" "$severity_binding" "false"

out="$(CLASSIFY_TIMEOUT=2 CLASSIFY_FLOOR=0.7 "$classify" "$schema" <<<'hello')"
severity_binding="$(jq -r '.answers.severity.binding' <<<"$out")"
check "binding true above floor 0.7 (confidence 0.842)" "$severity_binding" "true"

nokey="$(env -u TYPESAFE_API_KEY CLASSIFY_ENDPOINT="$CLASSIFY_ENDPOINT" "$classify" "$schema" <<<'hello')"
check "an undecided record carries no answers key" "$(jq 'has("answers")' <<<"$nokey")" "false"

stop_stub

start_stub slow
out="$(CLASSIFY_TIMEOUT=1 "$classify" "$schema" <<<'hello')"
check "slow: timeout" "$out" '{"schema":"example","status":"undecided","reason":"timeout"}'
stop_stub

start_stub 429
out="$(CLASSIFY_TIMEOUT=2 "$classify" "$schema" <<<'hello')"
check "429: http-429" "$out" '{"schema":"example","status":"undecided","reason":"http-429"}'
stop_stub

start_stub garbage
out="$(CLASSIFY_TIMEOUT=2 "$classify" "$schema" <<<'hello')"
check "garbage: malformed" "$out" '{"schema":"example","status":"undecided","reason":"malformed"}'
stop_stub

start_stub partial
out="$("$classify" "$schema" <<<'hello')"
stop_stub
check "partial answer set is malformed, not a half-answered record" \
  "$(jq -r '.status + "/" + .reason' <<<"$out")" "undecided/malformed"

start_stub badtype
out="$("$classify" "$schema" <<<'hello')"
stop_stub
check "an undefined answer type is malformed, not a dropped key" \
  "$(jq -r '.status + "/" + .reason' <<<"$out")" "undecided/malformed"

# score-records.py must not count the skill's own instruction text. The skill
# ships the strings "status": "undecided" and "binding": true as prose, so a
# grep over a transcript reads instructions as results. That defect produced a
# score table on 2026-09-19 claiming classifier activity in three runs that had
# made no call at all.
t="$(mktemp)"
cat > "$t" <<'FIXTURE'
{"steps":[{"message":"An answer marked \"binding\": false, and every dimension when the record says \"status\": \"undecided\", is decided from the tables below."},
{"message":"in shell abc:\n{\n  \"schema\": \"investigate-intake\",\n  \"status\": \"answered\",\n  \"reason\": \"ok\",\n  \"answers\": {\n    \"category\": {\n      \"value\": \"simple_ui\",\n      \"confidence\": 0.9,\n      \"binding\": true\n    },\n    \"severity\": {\n      \"value\": 2,\n      \"confidence\": 0.1,\n      \"binding\": false\n    }\n  }\n}"}]}
FIXTURE
check "prose is not counted as a record" \
  "$(python3 "$dir/score-records.py" "$t" | cut -f1-5)" "1	1	0	1	1"
rm -f "$t"

if [ "$failures" -eq 0 ]; then

echo "All cases passed."
  exit 0
else
  echo "$failures case(s) failed."
  exit 1
fi
