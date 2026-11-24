#!/usr/bin/env python3
"""Check that a skill's final report quotes the references it says it read.

Usage:
    check-reference-quotes.py REPORT --skill-dir DIR [--root DIR ...] [--require REL ...]

REPORT is a file path, or - for stdin. Each reference used is one line:
    Used: <path> § <heading>: "<quote>"
(an optional leading "- " or "* " is allowed). <path> resolves against
--skill-dir, then each --root in order; absolute and ~ paths are allowed.
<heading> must match a markdown heading in that file (case-insensitive,
trailing punctuation and surrounding backticks stripped). <quote> must be a
verbatim substring (whitespace collapsed, case-sensitive) of the text from that
heading to the next heading of the same or a higher level. A quote under 25
characters, or equal to the heading text, fails.

Prints "PASS <path> § <heading>" or "FAIL <path> § <heading>: <reason>" per line,
and "FAIL missing: <REL>" for each --require not matched by a PASSing line
whose resolved file is the resolved REL.

Exit codes:
    0  every Used line passes and every --require is met
    1  any FAIL, or a --require not met (including a report with no Used lines
       when --require is given)
    2  refused: REPORT unreadable or blank, --skill-dir not a directory, or no
       Used lines and no --require (reason on stderr)
"""
import argparse
import os
import re
import sys

MIN_QUOTE = 25
USED_RE = re.compile(r'^\s*(?:[-*]\s+)?Used:\s*(.+?)\s+§\s+(.+?):\s+"(.*)"\s*$')
HEADING_RE = re.compile(r'^(#{1,6})\s+(.*?)\s*#*\s*$')


def collapse(s):
    return re.sub(r'\s+', ' ', s).strip()


def plain(s):
    """collapse() plus markdown bold markers, so a quote of rendered text still matches its source."""
    return collapse(s.replace('**', '').replace('__', ''))


def norm_heading(s):
    s = collapse(s).strip('`').strip()
    s = re.sub(r'[\s.:;,!?]+$', '', s).strip('`').strip()
    return s.lower()


def resolve(path, bases):
    p = os.path.expanduser(path)
    if os.path.isabs(p):
        return p if os.path.isfile(p) else None
    for b in bases:
        c = os.path.join(b, p)
        if os.path.isfile(c):
            return os.path.realpath(c)
    return None


def sections(text):
    """Yield (level, heading_text, body) for each heading outside code fences."""
    lines = text.splitlines()
    heads = []
    fence = False
    for i, ln in enumerate(lines):
        if ln.lstrip().startswith(('```', '~~~')):
            fence = not fence
            continue
        if fence:
            continue
        m = HEADING_RE.match(ln)
        if m:
            heads.append((i, len(m.group(1)), m.group(2)))
    for k, (i, lvl, h) in enumerate(heads):
        end = len(lines)
        for j, l2, _ in heads[k + 1:]:
            if l2 <= lvl:
                end = j
                break
        yield lvl, h, '\n'.join(lines[i + 1:end])


def check_line(path, heading, quote, bases):
    f = resolve(path, bases)
    if f is None:
        return None, 'file not found'
    f = os.path.realpath(f)
    with open(f, encoding='utf-8') as fh:
        text = fh.read()
    want = norm_heading(heading)
    found = [(h, body) for _, h, body in sections(text) if norm_heading(h) == want]
    if not found:
        return f, 'heading not found'
    q = plain(quote)
    if len(q) < MIN_QUOTE:
        return f, 'quote shorter than %d characters' % MIN_QUOTE
    if norm_heading(q) == want:
        return f, 'quote equals the heading'
    for _, body in found:
        if q in plain(body):
            return f, None
    return f, 'quote not found under that heading'


def main(argv=None):
    ap = argparse.ArgumentParser(prog='check-reference-quotes.py')
    ap.add_argument('report')
    ap.add_argument('--skill-dir', required=True)
    ap.add_argument('--root', action='append', default=[])
    ap.add_argument('--require', action='append', default=[])
    a = ap.parse_args(argv)

    try:
        if a.report == '-':
            report = sys.stdin.read()
        else:
            with open(a.report, encoding='utf-8') as fh:
                report = fh.read()
    except (OSError, UnicodeDecodeError) as e:
        print('refused: cannot read report: %s' % e, file=sys.stderr)
        return 2
    if not report.strip():
        print('refused: report is empty', file=sys.stderr)
        return 2
    if not os.path.isdir(a.skill_dir):
        print('refused: --skill-dir is not a directory: %s' % a.skill_dir, file=sys.stderr)
        return 2

    used = [m for m in (USED_RE.match(l) for l in report.splitlines()) if m]
    if not used and not a.require:
        print('refused: no Used lines and no --require', file=sys.stderr)
        return 2

    bases = [a.skill_dir] + a.root
    ok = True
    passed = set()
    for m in used:
        path, heading, quote = m.groups()
        quote = quote.replace('\\"', '"')  # a model escapes inner quotes in its Used line
        f, err = check_line(path, heading, quote, bases)
        if err:
            ok = False
            print('FAIL %s § %s: %s' % (path, heading, err))
        else:
            passed.add(f)
            print('PASS %s § %s' % (path, heading))
    for rel in a.require:
        f = resolve(rel, bases)
        if f is None or os.path.realpath(f) not in passed:
            ok = False
            print('FAIL missing: %s' % rel)
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
