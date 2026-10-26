import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "check_index.py"
HEADER = "| Name | Kind | File | Paper | Source | Status | Notes |\n| --- | --- | --- | --- | --- | --- | --- |\n"


def check(art):
    return subprocess.run([sys.executable, str(SCRIPT), str(art)], capture_output=True, text=True)


class CheckIndex(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.art = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, body):
        (self.art / "INDEX.md").write_text(HEADER + body)

    def test_missing_index_is_refused(self):
        self.assertEqual(check(self.art).returncode, 2)

    def test_index_with_no_rows_is_refused(self):
        self.write("")
        result = check(self.art)
        self.assertEqual(result.returncode, 2)
        self.assertIn("no asset rows", result.stderr)

    def test_clean_index_passes(self):
        (self.art / "marks").mkdir()
        (self.art / "marks/star.svg").write_text("<svg/>")
        self.write("| star | mark | marks/star.svg | - | reused · passport | locked | - |\n")
        self.assertEqual(check(self.art).returncode, 0)

    def test_unindexed_file_is_a_finding(self):
        (self.art / "stray.png").write_bytes(b"x")
        self.write("| stamps | stamp | - | Passport TH8-0 | reused · passport | locked | - |\n")
        result = check(self.art)
        self.assertEqual(result.returncode, 1)
        self.assertIn("stray.png: file has no INDEX.md row", result.stdout)

    def test_bad_kind_status_source_and_missing_file_are_findings(self):
        self.write("| x | doodle | gone.svg | - | made it | maybe | - |\n")
        out = check(self.art).stdout
        for needle in ("kind 'doodle'", "status 'maybe'", "source must start", "gone.svg does not exist"):
            self.assertIn(needle, out)


if __name__ == "__main__":
    unittest.main()
