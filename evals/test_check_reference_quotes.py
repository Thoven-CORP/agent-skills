import io
import os
import subprocess
import sys
import tempfile
import unittest

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'check-reference-quotes.py')

REF = """# Title

## Alpha

The quick brown fox jumps over the lazy dog every morning.

### Sub

A nested sentence that lives under the sub heading only.

## Beta

Beta section holds a different sentence about other things.
"""

Q = 'The quick brown fox jumps over the lazy dog every morning.'


def run(report, *args, stdin=None):
    cmd = [sys.executable, SCRIPT, report, *args]
    p = subprocess.run(cmd, input=stdin, capture_output=True, text=True)
    return p.returncode, p.stdout, p.stderr


class T(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.skill = os.path.join(self.tmp.name, 'skill')
        os.makedirs(os.path.join(self.skill, 'references'))
        self.ref = os.path.join(self.skill, 'references', 'r.md')
        with open(self.ref, 'w') as f:
            f.write(REF)

    def rep(self, text):
        p = os.path.join(self.tmp.name, 'report.txt')
        with open(p, 'w') as f:
            f.write(text)
        return p

    def go(self, text, *args):
        return run(self.rep(text), '--skill-dir', self.skill, *args)

    def line(self, heading='Alpha', quote=Q, path='references/r.md'):
        return 'Used: %s § %s: "%s"\n' % (path, heading, quote)

    def test_valid(self):
        rc, out, _ = self.go(self.line())
        self.assertEqual(rc, 0, out)
        self.assertIn('PASS references/r.md § Alpha', out)

    def test_escaped_inner_quotes(self):
        with open(os.path.join(self.skill, 'references', 'q.md'), 'w') as f:
            f.write('# Quoted\n\nShe said "hello there" to the whole quiet room.\n')
        rc, out, _ = self.go(self.line(heading='Quoted', quote='She said \\"hello there\\" to the whole quiet room.', path='references/q.md'))
        self.assertEqual(rc, 0, out)

    def test_bold_markers_in_source_are_ignored(self):
        with open(os.path.join(self.skill, 'references', 'b.md'), 'w') as f:
            f.write('# Bold\n\n**Clear over clever.** Say plainly what something is.\n')
        rc, out, _ = self.go(self.line(heading='Bold', quote='Clear over clever. Say plainly what something is.', path='references/b.md'))
        self.assertEqual(rc, 0, out)

    def test_heading_case_punct_backticks(self):
        rc, _, _ = self.go(self.line(heading='`alpha`:'))
        self.assertEqual(rc, 0)

    def test_whitespace_collapsed(self):
        rc, _, _ = self.go(self.line(quote='The quick  brown fox jumps over the lazy dog'))
        self.assertEqual(rc, 0)

    def test_nested_subsection_counts(self):
        rc, _, _ = self.go(self.line(quote='A nested sentence that lives under the sub heading'))
        self.assertEqual(rc, 0)

    def test_fabricated(self):
        rc, out, _ = self.go(self.line(quote='The quick brown fox jumps over the lazy cat every morning.'))
        self.assertEqual(rc, 1)
        self.assertIn('FAIL', out)

    def test_case_sensitive(self):
        rc, _, _ = self.go(self.line(quote=Q.lower()))
        self.assertEqual(rc, 1)

    def test_wrong_section(self):
        rc, out, _ = self.go(self.line(heading='Beta'))
        self.assertEqual(rc, 1)
        self.assertIn('not found under', out)

    def test_sub_quote_not_under_sibling(self):
        rc, _, _ = self.go(self.line(heading='Sub', quote=Q))
        self.assertEqual(rc, 1)

    def test_missing_heading(self):
        rc, out, _ = self.go(self.line(heading='Nope'))
        self.assertEqual(rc, 1)
        self.assertIn('heading not found', out)

    def test_short_quote(self):
        rc, out, _ = self.go(self.line(quote='quick brown fox'))
        self.assertEqual(rc, 1)
        self.assertIn('shorter', out)

    def test_quote_equals_heading(self):
        ref = os.path.join(self.skill, 'references', 'long.md')
        h = 'A heading that is longer than twenty-five chars'
        with open(ref, 'w') as f:
            f.write('## %s\n\nbody\n' % h)
        rc, out, _ = self.go(self.line(heading=h, quote=h, path='references/long.md'))
        self.assertEqual(rc, 1)
        self.assertIn('equals the heading', out)

    def test_empty_report_refused(self):
        rc, _, err = self.go('')
        self.assertEqual(rc, 2)
        self.assertTrue(err)

    def test_whitespace_report_refused(self):
        rc, _, _ = self.go('  \n\t\n')
        self.assertEqual(rc, 2)

    def test_empty_report_refused_even_with_require(self):
        rc, _, _ = self.go('', '--require', 'references/r.md')
        self.assertEqual(rc, 2)

    def test_stdin(self):
        rc, out, _ = run('-', '--skill-dir', self.skill, stdin=self.line())
        self.assertEqual(rc, 0, out)

    def test_stdin_empty(self):
        rc, _, _ = run('-', '--skill-dir', self.skill, stdin='')
        self.assertEqual(rc, 2)

    def test_unreadable_report(self):
        rc, _, _ = run(os.path.join(self.tmp.name, 'nope.txt'), '--skill-dir', self.skill)
        self.assertEqual(rc, 2)

    def test_bad_skill_dir(self):
        rc, _, _ = run(self.rep(self.line()), '--skill-dir', os.path.join(self.tmp.name, 'none'))
        self.assertEqual(rc, 2)

    def test_require_met(self):
        rc, _, _ = self.go(self.line(), '--require', 'references/r.md')
        self.assertEqual(rc, 0)

    def test_require_missing(self):
        other = os.path.join(self.skill, 'references', 'o.md')
        with open(other, 'w') as f:
            f.write(REF)
        rc, out, _ = self.go(self.line(), '--require', 'references/o.md')
        self.assertEqual(rc, 1)
        self.assertIn('FAIL missing: references/o.md', out)

    def test_require_not_met_by_failing_line(self):
        rc, out, _ = self.go(self.line(heading='Beta'), '--require', 'references/r.md')
        self.assertEqual(rc, 1)
        self.assertIn('FAIL missing', out)

    def test_no_used_lines_with_require_is_1(self):
        rc, out, _ = self.go('I read everything, honest.\n', '--require', 'references/r.md')
        self.assertEqual(rc, 1)
        self.assertIn('FAIL missing', out)

    def test_no_used_lines_no_require_is_2(self):
        rc, _, err = self.go('I read everything, honest.\n')
        self.assertEqual(rc, 2)
        self.assertTrue(err)

    def test_absolute_path(self):
        rc, _, _ = self.go(self.line(path=self.ref))
        self.assertEqual(rc, 0)

    def test_root_resolution(self):
        root = os.path.join(self.tmp.name, 'root')
        os.makedirs(os.path.join(root, 'shared'))
        with open(os.path.join(root, 'shared', 'x.md'), 'w') as f:
            f.write(REF)
        rc, _, _ = self.go(self.line(path='shared/x.md'), '--root', root)
        self.assertEqual(rc, 0)
        rc, _, _ = self.go(self.line(path='shared/x.md'))
        self.assertEqual(rc, 1)

    def test_bullets(self):
        for b in ('- ', '* '):
            rc, _, _ = self.go(b + self.line())
            self.assertEqual(rc, 0)

    def test_missing_file(self):
        rc, out, _ = self.go(self.line(path='references/gone.md'))
        self.assertEqual(rc, 1)
        self.assertIn('file not found', out)


if __name__ == '__main__':
    unittest.main()
