import json
import unittest

import testkit  # noqa: F401
from dispatch_lib import linear, procs
from dispatch_lib.runner import Result
from testkit import FakeRunner

PS = """\
  100     1   100   0.0 Ss   -zsh
  200   100   200   3.0 S+   claude
  210   200   200   1.0 S+   caffeinate -i -t 300
  220   200   200  40.0 S+   node /x/notion-mcp-server
  230   200   230   0.0 Ss   /bin/zsh -c source /Users/a/.claude/shell-snapshots/snapshot-zsh-1.sh && pnpm dev
  231   230   230  12.0 S    node /proj/node_modules/.bin/next dev
  240   200   240   0.0 Ss   /Users/a/.codex/bin/codex-code-mode-host
  250   200   250   0.0 Z    (zsh)
  260   200   260   0.5 S    python3 /x/mem0/mcp_server.py
"""


class LiveWork(unittest.TestCase):
    def snapshot(self, text=PS):
        return procs.snapshot(FakeRunner({("ps",): Result(0, text, "")}))

    def test_background_shell_is_work_and_infrastructure_is_not(self):
        self.assertEqual(procs.live_work(self.snapshot(), 200), ["next dev (pid 231)"])

    def test_nothing_left_after_the_shell_ends(self):
        lines = [line for line in PS.splitlines() if not line.split()[0].startswith("23")]
        self.assertEqual(procs.live_work(self.snapshot("\n".join(lines)), 200), [])

    def test_cpu_sums_the_tree_without_mcp_servers(self):
        self.assertEqual(procs.tree_cpu(self.snapshot(), 200), 15.0)
        self.assertIsNone(procs.tree_cpu(self.snapshot(), 999))


class Snapshot(unittest.TestCase):
    def test_render_orders_comments_oldest_first_and_includes_the_parent(self):
        issue = {"identifier": "THV-5", "title": "Cart", "url": "https://linear.app/t/THV-5", "description": "Build it.",
                 "state": {"name": "Todo"}, "parent": {"identifier": "THV-1", "title": "Shop", "description": "D4"},
                 "comments": {"nodes": [{"body": "second", "createdAt": "2026-10-02", "user": {"name": "Andres"}},
                                        {"body": "first", "createdAt": "2026-10-01", "user": {"name": "Main"}}]}}
        text = linear.render(issue)
        self.assertEqual(text, "# THV-5: Cart\n\nState: Todo  \nURL: https://linear.app/t/THV-5\n\n## Description\n\n"
                               "Build it.\n\n## Parent THV-1: Shop\n\nD4\n\n## Comments (2, newest last)\n\n"
                               "### 2026-10-01 Main\n\nfirst\n\n### 2026-10-02 Andres\n\nsecond\n")

    def test_fetch_sends_the_identifier_and_reports_graphql_errors(self):
        sent = {}

        def post(url, body, headers):
            sent.update(url=url, body=json.loads(body), auth=headers["Authorization"])
            return json.dumps({"errors": [{"message": "Entity not found"}]}).encode()

        with unittest.mock.patch.dict("os.environ", {"LINEAR_API_KEY": "k-test"}):
            with self.assertRaisesRegex(Exception, "Linear: Entity not found"):
                linear.fetch_issue("THV-5", post=post)
        self.assertEqual((sent["url"], sent["body"]["variables"], sent["auth"]),
                         ("https://api.linear.app/graphql", {"id": "THV-5"}, "k-test"))


import unittest.mock  # noqa: E402

if __name__ == "__main__":
    unittest.main()
