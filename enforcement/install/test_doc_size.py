#!/usr/bin/env python3
"""thoven-doc-size: the Project document size counter, run as Claude Code runs it, on stdin."""
import json
import subprocess
import sys
import unittest
from pathlib import Path

HOOK = Path(__file__).resolve().parent.parent / "hooks" / "thoven-doc-size"
SAVE_DOC = "mcp__plugin_linear_linear__save_document"
SAVE_ISSUE = "mcp__plugin_linear_linear__save_issue"


def run(stdin):
    got = subprocess.run([sys.executable, str(HOOK)], input=stdin, capture_output=True, text=True)
    return got.returncode, got.stdout, got.stderr


def pre(tool, **tool_input):
    return run(json.dumps({"hook_event_name": "PreToolUse", "tool_name": tool, "tool_input": tool_input}))


def post(tool, response, **tool_input):
    return run(json.dumps({"hook_event_name": "PostToolUse", "tool_name": tool, "tool_input": tool_input,
                           "tool_response": response}))


def denied(stdout):
    out = json.loads(stdout)["hookSpecificOutput"]
    assert out["permissionDecision"] == "deny", out
    return out["permissionDecisionReason"]


def ticket(exit_count, extra_words=0):
    lines = "\n".join(f"- A parent sees result {i}. Proof: test {i} reads it." for i in range(exit_count))
    return ("Writes to: frontend on `work/thv-1`\n\n## Outcome\n\nA parent can rebook a lesson.\n\n"
            f"## Exit criteria\n\n{lines}\n\n## Leave alone\n\nThe calendar.\n" + " filler" * extra_words)


class DocSizeTest(unittest.TestCase):
    def test_post_counts_the_body_that_was_sent_not_the_shortened_result(self):
        body = "word " * 2297
        shortened = json.dumps({"title": "Spec · Booking", "content": "word " * 82 + "… (truncated, use `get_document`)"})
        code, out, _ = post(SAVE_DOC, shortened, title="Spec · Booking", content=body)
        self.assertEqual(code, 0)
        self.assertIn("2,297 of 3,000 words", json.loads(out)["hookSpecificOutput"]["additionalContext"])

    def test_post_after_a_patch_with_a_shortened_result_gives_no_count(self):
        shortened = json.dumps({"title": "Spec · Booking", "content": "word " * 82 + "… (truncated, use `get_document`)"})
        code, out, _ = post(SAVE_DOC, shortened, id="abc", patch=[{"op": "append", "text": "x"}])
        self.assertEqual(code, 0)
        context = json.loads(out)["hookSpecificOutput"]["additionalContext"]
        self.assertIn("not counted", context)
        self.assertNotIn("of 3,000", context)

    def test_empty_stdin_is_refused(self):
        for stdin in ("", "  \n"):
            with self.subTest(stdin=repr(stdin)):
                code, out, err = run(stdin)
                self.assertNotEqual(0, code)
                self.assertEqual("", out)
                self.assertIn("empty", err)

    def test_a_spec_under_the_limit_saves_and_reports_its_count_after(self):
        body = "word " * 2640
        code, out, _ = pre(SAVE_DOC, title="Spec · Passport", content=body, project="Passport")
        self.assertEqual((0, ""), (code, out))
        response = [{"type": "text", "text": json.dumps({"id": "d1", "title": "Spec · Passport", "content": body})}]
        code, out, _ = post(SAVE_DOC, response, title="Spec · Passport", content=body)
        self.assertEqual(0, code)
        self.assertEqual("Spec · Passport: 2,640 of 3,000 words",
                         json.loads(out)["hookSpecificOutput"]["additionalContext"])

    def test_an_architecture_over_the_limit_is_denied_with_count_limit_and_step(self):
        code, out, _ = pre(SAVE_DOC, title="Architecture · Passport", content="word " * 3001)
        self.assertEqual(0, code)
        reason = denied(out)
        self.assertIn("3,001 words", reason)
        self.assertIn("the limit is 3,000", reason)
        self.assertIn("Consolidate, then add: merge the lines that state one decision, cut what a frame or the "
                      "code shows, move reasoning to the Log.", reason)

    def test_table_pipes_and_bullets_are_not_words(self):
        body = "| a | b |\n- one\n## two\n" + "|---|---|\n- * #\n" * 4000
        code, out, _ = pre(SAVE_DOC, title="Spec · Pipes", content=body)
        self.assertEqual((0, ""), (code, out))

    def test_a_log_with_one_long_entry_is_denied_and_names_it(self):
        body = ("[preamble] " + "intro " * 300 + "\n\n## 2026-11-12 Exit lines own proof\n\n" + "said " * 80 +
                "\n\n## 2026-11-10 Paper is the source\n\n" + "said " * 121 + "\n")
        reason = denied(pre(SAVE_DOC, title="Log · Passport", content=body)[1])
        self.assertIn('"2026-11-10 Paper is the source" is 121 words', reason)
        self.assertNotIn("Exit lines own proof", reason)
        self.assertIn("120 words an entry", reason)

    def test_a_log_whose_entries_fit_saves_even_with_a_long_preamble(self):
        body = "intro " * 300 + "\n## 2026-11-12 One\n\n" + "said " * 120 + "\n"
        self.assertEqual((0, ""), pre(SAVE_DOC, title="Log · Passport", content=body)[:2])

    def test_a_ticket_with_two_exit_lines_is_denied(self):
        code, out, _ = pre(SAVE_ISSUE, title="Build: A parent can rebook", description=ticket(2), team="Thoven")
        self.assertEqual(0, code)
        reason = denied(out)
        self.assertIn("2 lines under Exit criteria", reason)
        self.assertIn("3 to 10", reason)

    def test_a_ticket_with_eleven_exit_lines_or_too_many_words_is_denied(self):
        self.assertIn("More means two tickets", denied(pre(SAVE_ISSUE, title="Build: X", description=ticket(11))[1]))
        reason = denied(pre(SAVE_ISSUE, title="Build: X", description=ticket(5, extra_words=400))[1])
        self.assertIn("the limit is 400", reason)

    def test_a_ticket_inside_both_limits_saves(self):
        self.assertEqual((0, ""), pre(SAVE_ISSUE, title="Build: X", description=ticket(5))[:2])

    def test_an_unknown_title_passes_in_silence(self):
        for title in ("Notes · Passport", "THV-1701 fix the logo", "spec · lower case"):
            with self.subTest(title=title):
                self.assertEqual((0, ""), pre(SAVE_DOC, title=title, content="word " * 9000)[:2])

    def test_what_it_cannot_read_passes_in_silence(self):
        cases = {
            "a patch with no full body": json.dumps({"hook_event_name": "PreToolUse", "tool_name": SAVE_DOC,
                                                     "tool_input": {"id": "d1", "patch": [{"op": "append", "text": "x " * 9000}]}}),
            "an update with a body and no title": json.dumps({"hook_event_name": "PreToolUse", "tool_name": SAVE_ISSUE,
                                                              "tool_input": {"id": "THV-1", "description": "x " * 9000}}),
            "another tool": json.dumps({"hook_event_name": "PreToolUse", "tool_name": "mcp__plugin_linear_linear__save_comment",
                                        "tool_input": {"title": "Spec · P", "body": "x " * 9000}}),
            "not JSON": "{not json",
            "a JSON list": "[1, 2]",
            "a result with no body": json.dumps({"hook_event_name": "PostToolUse", "tool_name": SAVE_DOC,
                                                 "tool_input": {}, "tool_response": "Document saved."}),
        }
        for name, stdin in cases.items():
            with self.subTest(name):
                self.assertEqual((0, ""), run(stdin)[:2])

    def test_a_saved_page_over_the_limit_tells_the_agent_after_a_patch(self):
        response = {"document": {"title": "Spec · Passport", "content": "word " * 3100}}
        code, out, _ = post(SAVE_DOC, response, id="d1", patch=[{"op": "append", "text": "more"}])
        self.assertEqual(0, code)
        out = json.loads(out)
        self.assertEqual("block", out["decision"])
        self.assertIn("3,100 words", out["reason"])


if __name__ == "__main__":
    unittest.main()
