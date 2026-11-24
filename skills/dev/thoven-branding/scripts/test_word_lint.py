import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "word_lint.py"
LOCKED_HEADER = "An online music academy built for kids."


def lint(*args, stdin=""):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        input=stdin,
        capture_output=True,
        text=True,
    )


class Refusals(unittest.TestCase):
    def test_empty_stdin_is_refused(self):
        result = lint("-", stdin="")
        self.assertEqual(result.returncode, 2)
        self.assertIn("empty", result.stderr)
        self.assertEqual(result.stdout, "")

    def test_no_args_with_empty_stdin_is_refused(self):
        self.assertEqual(lint(stdin="").returncode, 2)

    def test_whitespace_only_is_refused(self):
        result = lint("-", stdin="  \n\t\n ")
        self.assertEqual(result.returncode, 2)
        self.assertIn("empty", result.stderr)

    def test_missing_file_is_refused(self):
        result = lint("/nonexistent/thoven-copy.md")
        self.assertEqual(result.returncode, 2)
        self.assertIn("not found", result.stderr)

    def _data_file(self, content):
        handle = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
        handle.write(content)
        handle.close()
        self.addCleanup(Path(handle.name).unlink)
        return handle.name

    def test_empty_data_file_is_refused(self):
        result = lint("--data", self._data_file(""), "-", stdin=LOCKED_HEADER)
        self.assertEqual(result.returncode, 2)
        self.assertIn("data file is empty", result.stderr)

    def test_empty_data_list_is_refused(self):
        result = lint("--data", self._data_file("[]"), "-", stdin=LOCKED_HEADER)
        self.assertEqual(result.returncode, 2)

    def test_missing_data_file_is_refused(self):
        result = lint("--data", "/nonexistent/retired.json", "-", stdin=LOCKED_HEADER)
        self.assertEqual(result.returncode, 2)

    def test_entry_without_all_keys_is_refused(self):
        data = json.dumps([{"id": "x", "pattern": "\\bx\\b", "say": "y"}])
        result = lint("--data", self._data_file(data), "-", stdin=LOCKED_HEADER)
        self.assertEqual(result.returncode, 2)
        self.assertIn("why", result.stderr)

    def test_pattern_that_does_not_compile_is_refused(self):
        data = json.dumps([{"id": "x", "pattern": "(unclosed", "say": "y", "why": "z"}])
        result = lint("--data", self._data_file(data), "-", stdin=LOCKED_HEADER)
        self.assertEqual(result.returncode, 2)
        self.assertIn("does not compile", result.stderr)


class Findings(unittest.TestCase):
    def test_planted_retired_word_is_flagged_with_its_replacement(self):
        result = lint("-", stdin="Thoven is a\nmarketplace for music lessons.")
        self.assertEqual(result.returncode, 1)
        self.assertIn('<stdin>:2:1: "marketplace" -> say: online music academy', result.stdout)

    def test_homeschool_is_clean(self):
        result = lint("-", stdin="Built for homeschool families and homeschooling parents.")
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual(result.stdout, "")

    def test_locked_headers_are_clean(self):
        for header in (
            LOCKED_HEADER + "\nA music journey your kid will love, from the comfort of home.",
            "Online guitar lessons built for kids.",
        ):
            with self.subTest(header=header):
                result = lint("-", stdin=header)
                self.assertEqual(result.returncode, 0, result.stdout)

    def test_shipped_music_passport_is_clean(self):
        # The Passport counts as shipped (Andres, 2026-11-18), so the homepage journey's line passes.
        result = lint("-", stdin="Every milestone earns a stamp in their Music Passport.")
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertEqual(result.stdout, "")

    def test_diagnosis_label_is_flagged(self):
        result = lint("-", stdin="Our teachers love working with autistic kids.")
        self.assertEqual(result.returncode, 1)
        self.assertIn('"autistic" -> say: diverse learners', result.stdout)

    def test_follow_up_promise_is_flagged(self):
        result = lint("-", stdin="We keep following the student six months after the lesson.")
        self.assertEqual(result.returncode, 1)
        self.assertIn("following the student six months", result.stdout)

    def test_file_findings_name_the_path(self):
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as handle:
            handle.write("Line one.\nThe Airbnb of music lessons.\n")
        self.addCleanup(Path(handle.name).unlink)
        result = lint(handle.name)
        self.assertEqual(result.returncode, 1)
        self.assertIn(f'{handle.name}:2:5: "Airbnb"', result.stdout)


DENIED = "\n".join([
    "Reschedule Denied",
    "Your reschedule request was denied.",
    "The teacher denied the reschedule, so Wed, Nov 25 stays.",
    "Reschedule response: Denied",
    'Reason: "I can\'t reschedule that week."',
])
CLEAN_DIALOG = "\n".join([
    "Lesson not moved",
    "Emma's piano lesson stays on Wed, Nov 25 at 1:00 PM.",
    "Reason from the teacher: I'm away that week.",
])
REFUND = "\n".join([
    "Refund request",
    "From John Smith, 2 minutes ago",
    "Emma piano — Emma — Wed, Nov 25, 1:00 PM - 2:00 PM EST",
])


class Once(unittest.TestCase):
    def test_denied_dialog_flags_both_words_with_lines(self):
        result = lint("--once", "-", stdin=DENIED)
        self.assertEqual(result.returncode, 1)
        self.assertIn('"reschedule" is on lines 1, 2, 3, 4, 5', result.stdout)
        self.assertIn('"denied" is on lines 1, 2, 3, 4', result.stdout)
        self.assertIn("state each fact once", result.stdout)

    def test_clean_dialog_passes(self):
        result = lint("--once", "-", stdin=CLEAN_DIALOG)
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_stem_joins_reschedule_forms(self):
        forms = ["reschedule", "rescheduled", "reschedules", "rescheduling"]
        for start in range(2):
            with self.subTest(forms=forms[start:start + 3]):
                result = lint("--once", "-", stdin="\n".join(forms[start:start + 3]))
                self.assertEqual(result.returncode, 1)

    def test_two_lines_and_same_line_repeats_pass(self):
        self.assertEqual(lint("--once", "-", stdin="piano piano piano\nlesson\nlesson").returncode, 0)

    def test_short_and_stop_words_are_ignored(self):
        self.assertEqual(lint("--once", "-", stdin="about this\nabout that\nabout it").returncode, 0)

    def test_once_runs_retired_check(self):
        result = lint("--once", "-", stdin="A marketplace for lessons.")
        self.assertEqual(result.returncode, 1)
        self.assertIn("marketplace", result.stdout)

    def test_without_flag_repeats_are_not_flagged(self):
        self.assertEqual(lint("-", stdin=DENIED).returncode, 0)

    def test_empty_input_still_refused(self):
        self.assertEqual(lint("--once", "-", stdin="").returncode, 2)


class NewRetiredEntries(unittest.TestCase):
    def test_refund_request_trips_dash_chain(self):
        result = lint("-", stdin=REFUND)
        self.assertEqual(result.returncode, 1)
        self.assertIn("a sentence, or one labelled row per fact", result.stdout)
        self.assertEqual(result.stdout.count("->"), 1)

    def test_dash_chain_ignores_single_dash_range_and_hyphen(self):
        for text in (
            "Emma piano – Wed, Nov 25",
            "Wed, Nov 25, 1:00–2:00 PM",
            "Wed, Nov 25, 1:00 PM - 2:00 PM EST - Emma",
            "Emma—piano—Wed",
        ):
            with self.subTest(text=text):
                self.assertEqual(lint("-", stdin=text).returncode, 0)

    def test_dash_chain_flags_en_dashes(self):
        self.assertEqual(lint("-", stdin="a – b – c").returncode, 1)

    def test_makeup_with_refund_or_credit_is_flagged(self):
        for text in (
            "Your makeup is a refund.",
            "Get a credit for the make-up lesson.",
            "Makeups are credited to you.",
        ):
            with self.subTest(text=text):
                result = lint("-", stdin=text)
                self.assertEqual(result.returncode, 1)
                self.assertIn("a makeup is a missed session the teacher gives back", result.stdout)

    def test_makeup_alone_or_split_sentences_pass(self):
        for text in ("Book a makeup lesson.", "Ask for a makeup. Refunds take days.", "Your credit card is saved."):
            with self.subTest(text=text):
                self.assertEqual(lint("-", stdin=text).returncode, 0)


if __name__ == "__main__":
    unittest.main()
