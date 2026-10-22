import os
import threading
import unittest
from unittest.mock import patch

import testkit  # noqa: F401
from dispatch_lib import store
from dispatch_lib.model import EntryKind
from testkit import HomeCase


class Spy:
    """A file whose every write first records what a board reader could see at that moment."""

    def __init__(self, f, look):
        self.f, self.look = f, look

    def write(self, s):
        self.look()
        return self.f.write(s)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return self.f.__exit__(*exc)

    def __getattr__(self, name):
        return getattr(self.f, name)


class Publication(HomeCase):
    def setUp(self):
        super().setUp()
        os.makedirs(store.project_dir("proj"))

    def test_a_reader_never_sees_a_half_written_entry(self):
        board = store.sub("proj", "board")
        visible = []

        def look():
            visible.append(sorted(n for n in os.listdir(board) if not n.startswith(".")))

        real = os.fdopen
        with patch("os.fdopen", lambda fd, *a, **kw: Spy(real(fd, *a, **kw), look)):
            path = store.post("proj", "THV-1", EntryKind.REPORT, "line one\nline two\n", "build-thv-1", "DONE")
        self.assertTrue(visible, "the spy saw no write")
        self.assertEqual(visible[0], [], "the entry's own write happened under its final name")
        self.assertEqual([(p, e.body) for p, e in store.entries("proj")], [(path, "line one\nline two")])

    def test_concurrent_posts_both_reach_board_md(self):
        real = store.write_atomic
        second = []

        def slow_board_write(path, text):
            if path == store.board_md("proj") and not second:
                t = threading.Thread(target=store.post, args=("proj", "THV-2", EntryKind.ANSWER, "second", "main"))
                second.append(t)
                t.start()
                t.join(0.5)
            real(path, text)

        with patch.object(store, "write_atomic", slow_board_write):
            store.post("proj", "THV-1", EntryKind.ANSWER, "first", "main")
            second[0].join(5)
        with open(store.board_md("proj")) as f:
            board = f.read()
        self.assertIn("THV-1 ANSWER from main", board)
        self.assertIn("THV-2 ANSWER from main", board)

    def test_a_keyed_post_is_published_once(self):
        first = store.post("proj", "THV-1", EntryKind.ALERT, "gone", "dispatch-tick", "GONE", dedup="rex-a|GONE|pane")
        again = store.post("proj", "THV-1", EntryKind.ALERT, "gone", "dispatch-tick", "GONE", dedup="rex-a|GONE|pane")
        self.assertIsNotNone(first)
        self.assertIsNone(again)
        self.assertEqual([p for p, _ in store.entries("proj")], [first])
        self.assertEqual([n for n in os.listdir(store.sub("proj", "board")) if n.startswith(".")], [])


if __name__ == "__main__":
    unittest.main()
