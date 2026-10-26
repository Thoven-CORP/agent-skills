import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "word_lint.py"
LOCKED_HEADER = "An online music academy built around each kid's journey."


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
            LOCKED_HEADER + "\nStart a music adventure your kid will love, from the comfort of home.",
            "Online guitar lessons built around each kid's journey.",
        ):
            with self.subTest(header=header):
                result = lint("-", stdin=header)
                self.assertEqual(result.returncode, 0, result.stdout)

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


if __name__ == "__main__":
    unittest.main()
