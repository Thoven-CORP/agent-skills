import unittest
from unittest.mock import patch
import done_verifier as verifier


class CompletionProcessTest(unittest.TestCase):
    def snapshot(self, commands):
        procs = {
            100: dict(pid=100, ppid=1, pgid=100, cpu=0, cmd="-zsh"),
            200: dict(pid=200, ppid=100, pgid=200, cpu=0, cmd="codex resume"),
        }
        for pid, parent, group, command in commands:
            procs[pid] = dict(pid=pid, ppid=parent, pgid=group, cpu=0, cmd=command)
        return procs

    def check(self, commands, has_agent=True):
        with patch.object(verifier.tw, "pane_procs", return_value=(100, 200 if has_agent else None)), \
             patch.object(verifier.tw, "ps_snapshot", return_value=self.snapshot(commands)):
            return verifier.check_processes("fixture", has_agent)

    def test_codex_tool_runtimes_do_not_block_completion(self):
        commands = [
            "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl",
            "/Users/example/.codex/packages/standalone/releases/0.160.1/bin/codex-code-mode-host",
            "node /Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/@oai/cua-repl/bin/cua-repl.mjs",
            "codex app-server --listen stdio",
        ]
        for command in commands:
            with self.subTest(command=command):
                self.assertIsNone(self.check([(300, 200, 300, command)]))

    def test_full_reported_process_tree_does_not_block_completion(self):
        self.assertIsNone(self.check([
            (300, 200, 300, "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl"),
            (310, 200, 310, "node /Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/@oai/cua-repl/bin/cua-repl.mjs"),
            (320, 310, 310, "/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl"),
            (330, 200, 330, "/Users/example/.codex/packages/standalone/releases/0.160.1/bin/codex-code-mode-host"),
        ]))

    def test_real_work_below_code_mode_host_still_blocks(self):
        for command in ("node /project/node_modules/next/dist/bin/next dev", "bundle exec rspec spec/example_spec.rb", "sleep 600"):
            with self.subTest(command=command):
                for group in (300, 400):
                    reason = self.check([
                        (300, 200, 300, "/Users/example/.codex/bin/codex-code-mode-host"),
                        (400, 300, group, command),
                    ])
                    self.assertIn("1 live process:", reason)
                    self.assertIn("pid 400", reason)

    def test_unrelated_commands_mentioning_runtime_names_still_block(self):
        for command in ("node /project/node_repl_task.js", "python3 audit.py --name node_repl", "sleep 600 # codex-code-mode-host"):
            with self.subTest(command=command):
                self.assertIn("pid 300", self.check([(300, 200, 300, command)]))

    def test_tool_names_without_an_agent_are_not_exempt(self):
        self.assertIn("pid 300", self.check([(300, 100, 300, "codex app-server --listen stdio")], has_agent=False))


if __name__ == "__main__":
    unittest.main()
