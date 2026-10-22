import contextlib
import io
import json
import os
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import done_verifier as verifier


class ProcessFixture(unittest.TestCase):
    def setUp(self):
        patcher = patch.object(verifier, "SETTLE_SECS", 0)
        patcher.start()
        self.addCleanup(patcher.stop)

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


class CompletionProcessTest(ProcessFixture):
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
        for command in ("node /project/node_modules/next/dist/bin/next dev", "bundle exec rspec spec/example_spec.rb"):
            with self.subTest(command=command):
                for group in (300, 400):
                    kind, reason = self.check([
                        (300, 200, 300, "/Users/example/.codex/bin/codex-code-mode-host"),
                        (400, 300, group, command),
                    ])
                    self.assertEqual(kind, "fail")
                    self.assertIn("1 live process:", reason)
                    self.assertIn("pid 400", reason)

    def test_registered_dev_server_is_allowed_but_unregistered_same_process_blocks(self):
        command = "node /project/node_modules/next/dist/bin/next dev"
        commands = [(300, 200, 300, command)]
        self.assertEqual(self.check(commands), ("fail", "1 live process: next dev (pid 300)"))
        intent = {"pane_id": "fixture", "pid": 300, "start_time": "started", "command": command}
        with patch.object(verifier.tw, "read_json", return_value=intent), \
             patch.object(verifier, "process_start", return_value="started"):
            self.assertIsNone(self.check(commands))
        with patch.object(verifier.tw, "read_json", return_value=intent), \
             patch.object(verifier, "process_start", return_value="reused-pid"):
            self.assertEqual(self.check(commands), ("fail", "1 live process: next dev (pid 300)"))

    def test_registered_dev_server_does_not_hide_test_child(self):
        command = "node /project/node_modules/next/dist/bin/next dev"
        intent = {"pane_id": "fixture", "pid": 300, "start_time": "started", "command": command}
        with patch.object(verifier.tw, "read_json", return_value=intent), \
             patch.object(verifier, "process_start", return_value="started"):
            result = self.check([(300, 200, 300, command), (310, 300, 310, "vitest run")])
        self.assertEqual(result, ("fail", "1 live process: vitest run (pid 310)"))

    def test_dev_registration_rejects_test_and_wrong_pane_processes(self):
        procs = self.snapshot([(300, 200, 300, "node /project/node_modules/next/dist/bin/next dev"),
                               (310, 200, 310, "pnpm test"),
                               (320, 200, 320, "python3 audit.py --label 'next dev'")])
        with patch.dict(verifier.os.environ, {"TW_PANE": "fixture"}), \
             patch.object(verifier.tw, "pane_procs", return_value=(100, 200)), \
             patch.object(verifier.tw, "ps_snapshot", return_value=procs), \
             patch.object(verifier, "process_start", return_value="started"), \
             patch.object(verifier.tw, "write_json") as write_json, \
             contextlib.redirect_stdout(io.StringIO()):
            verifier.allow_process("300")
            with self.assertRaisesRegex(ValueError, "only a live development server"):
                verifier.allow_process("310")
            with self.assertRaisesRegex(ValueError, "only a live development server"):
                verifier.allow_process("320")
            with self.assertRaisesRegex(ValueError, "descendant"):
                verifier.allow_process("999")
            write_json.assert_called_once()

    def test_unrelated_commands_mentioning_runtime_names_still_block(self):
        for command in ("node /project/node_repl_task.js", "python3 audit.py --name node_repl", "sleep 600 # codex-code-mode-host"):
            with self.subTest(command=command):
                kind, reason = self.check([(300, 200, 300, command)])
                self.assertEqual(kind, "fail")
                self.assertIn("pid 300", reason)

    def test_tool_names_without_an_agent_are_not_exempt(self):
        kind, reason = self.check([(300, 100, 300, "codex app-server --listen stdio")], has_agent=False)
        self.assertEqual(kind, "fail")
        self.assertIn("pid 300", reason)

    def test_statusline_helpers_and_exiting_processes_do_not_block(self):
        for command in ("node /Users/example/.claude/hooks/gsd-statusline.js",
                        "/x/herdr-agent-usage claude-statusline", "(node)", "(herdr-agent-usag)"):
            with self.subTest(command=command):
                self.assertIsNone(self.check([(300, 200, 300, command)]))

    def test_process_that_exits_during_settle_does_not_block(self):
        before = self.snapshot([(300, 200, 300, "sleep 60")])
        after = self.snapshot([])
        with patch.object(verifier.tw, "pane_procs", return_value=(100, 200)), \
             patch.object(verifier.tw, "ps_snapshot", side_effect=[before, after]):
            self.assertIsNone(verifier.check_processes("fixture", True))


# Process trees below are shaped on real Claude panes (ps -axo pid,ppid,pgid,command) and the
# commands named in verify.log fail verdicts, 2026-10-07..22.
SNAP = ("/bin/zsh -c source /Users/example/.claude/shell-snapshots/snapshot-zsh-1792379494-vu0q2x.sh "
        "2>/dev/null || true && setopt NO_EXTENDED_GLOB NO_BARE_GLOB_QUAL 2>/dev/null || true && eval '{}' "
        "< /dev/null && pwd -P >| /tmp/claude-cwd")
PY = "/Library/Frameworks/Python.framework/Versions/3.13/Resources/Python.app/Contents/MacOS/Python"
NODE = "/opt/homebrew/Cellar/node/25.2.1/bin/node"
PNPM = "node /Users/example/Library/pnpm/store/v11/links/@/pnpm/11.28.2/abc/node_modules/pnpm/bin/pnpm.mjs"
PNPM_GUARD = "sh -c trap '' INT TERM HUP; read -r _ || kill -9 -$1 sh {}"
FE = "/Users/example/thoven/frontend-thv-1360"
NEXT_SERVER = "next-server (v14.2.35)"


class BackgroundWaitTest(ProcessFixture):
    """A Claude pane goes done while a background shell runs; the agent is woken when it ends."""

    def snapshot(self, commands):
        procs = super().snapshot(commands)
        procs[200]["cmd"] = "claude"
        return procs

    def test_a_sleep_in_a_background_shell_is_pending(self):
        for seconds in ("60", "30", "15", "10", "5", "20"):
            with self.subTest(seconds=seconds):
                self.assertEqual(self.check([
                    (300, 200, 300, SNAP.format(f"sleep {seconds}")),
                    (301, 300, 300, f"sleep {seconds}"),
                ]), ("pending", f"waiting on a background run: sleep {seconds}"))

    def test_several_sleeps_and_a_bare_snapshot_wrapper_are_pending(self):
        self.assertEqual(self.check([
            (300, 200, 300, SNAP.format("sleep 15")), (301, 300, 300, "sleep 15"),
            (310, 200, 310, SNAP.format("sleep 15")), (311, 310, 310, "sleep 15"),
            (320, 200, 320, SNAP.format("wait")),
        ]), ("pending", "waiting on 3 background runs: sleep 15, source snapshot-zsh-1792379494"))

    def test_load_gate_waiting_for_a_slot_is_pending(self):
        gate = ("bash /Users/example/thoven/agent-skills/enforcement/bin/thoven-load-gate --slots 1 "
                "--name e2e -- pnpm exec playwright test")
        self.assertEqual(self.check([
            (300, 200, 300, SNAP.format("thoven-load-gate --slots 1 --name e2e -- pnpm exec playwright test")),
            (301, 300, 300, gate),
            (302, 301, 300, "sleep 10"),
        ]), ("pending", "waiting on a background run: sleep 10"))

    def test_bin_verify_run_with_its_vitest_children_is_pending(self):
        self.assertEqual(self.check([
            (300, 200, 300, SNAP.format(f"cd {FE}; bin/verify --base origin/main")),
            (301, 300, 300, "node bin/verify --base origin/main"),
            (302, 301, 300, f"{PY} {FE}/scripts/verify/diff-lock.py {NODE} {FE}/scripts/verify/diff.mjs --base origin/main"),
            (303, 302, 303, f"{NODE} {FE}/scripts/verify/diff.mjs --base origin/main"),
            (304, 303, 304, f"{PNPM} exec vitest related ./__tests__/lib/radius-tokens.test.ts --run --retry=0"),
            (305, 304, 305, f"node {FE}/node_modules/.bin/../vitest/vitest.mjs related ./__tests__/lib/radius-tokens.test.ts --run"),
            (306, 304, 306, PNPM_GUARD.format(305)),
        ]), ("pending", "waiting on 5 background runs: diff-lock.py node diff.mjs --b, "
                        "diff.mjs --base main, pnpm.mjs exec vitest related r …"))

    def test_the_agents_own_run_of_the_verify_engine_tests_still_fails(self):
        # verify.log THV-1131: one vitest pid outlived several diff.mjs pids, so the engine was the
        # subject of the agent's own test run, not its parent.
        self.assertEqual(self.check([
            (300, 200, 300, SNAP.format("pnpm exec vitest run scripts/verify/diff-structural.test.mjs")),
            (301, 300, 300, f"{PNPM} exec vitest run scripts/verify/diff-structural.test.mjs"),
            (302, 301, 302, PNPM_GUARD.format(303)),
            (303, 301, 303, f"node {FE}/node_modules/.bin/../vitest/vitest.mjs run scripts/verify/diff-structural.test.mjs"),
            (304, 303, 304, f"{NODE} {FE}/scripts/verify/diff.mjs --base main"),
        ]), ("fail", "2 live processes: pnpm.mjs exec vitest run diff- (pid 301), vitest.mjs run diff-structural (pid 303)"))

    def test_backend_bin_verify_with_ci_fast_child_is_pending(self):
        self.assertEqual(self.check([
            (300, 200, 300, SNAP.format("bin/verify --base private-lessons-workstream")),
            (301, 300, 300, "/Users/example/.rbenv/versions/3.3.6/bin/ruby bin/verify --base private-lessons-workstream"),
            (302, 301, 302, "/bin/bash bin/ci fast"),
        ]), ("pending", "waiting on 2 background runs: verify --base private-lessons-, ci fast"))

    def test_the_agents_own_search_is_pending(self):
        self.assertEqual(self.check([
            (300, 200, 300, "/Users/example/.local/share/claude/vendor/ugrep -G --ignore-files --hidden -I -e THV-1188 ."),
        ]), ("pending", "waiting on a background run: ugrep -G --ignore-files --hidd"))

    def test_unregistered_dev_server_still_fails_and_pnpm_guard_is_not_named(self):
        self.assertEqual(self.check([
            (300, 200, 300, SNAP.format("pnpm run dev --port 3011")),
            (301, 300, 300, f"{PNPM} run dev --port 3011"),
            (302, 301, 302, NEXT_SERVER),
            (303, 301, 303, PNPM_GUARD.format(302)),
        ]), ("fail", "2 live processes: pnpm.mjs run dev --port 3011 (pid 301), next-server (v14.2.35) (pid 302)"))

    def test_sleep_beside_next_server_fails_naming_only_next_server(self):
        self.assertEqual(self.check([
            (300, 200, 300, SNAP.format("sleep 60")), (301, 300, 300, "sleep 60"),
            (310, 200, 310, NEXT_SERVER),
        ]), ("fail", "1 live process: next-server (v14.2.35) (pid 310)"))

    def test_puma_beside_locked_stack_and_search_fails_naming_only_puma(self):
        self.assertEqual(self.check([
            (300, 200, 300, f"{PY} /Users/example/thoven/tmp/run-locked-stack.py e2e"),
            (310, 200, 310, "ugrep -G --ignore-files --hidden -I -e Booking ."),
            (320, 300, 320, "puma 6.6.0 (tcp://127.0.0.1:3160) [backend-thv-1188]"),
        ]), ("fail", "1 live process: puma 6.6.0 127.0.0.1:3160) [ba (pid 320)"))

    def test_vitest_the_agent_started_itself_still_fails(self):
        kind, reason = self.check([
            (300, 200, 300, SNAP.format("pnpm exec vitest run __tests__/x.test.ts")),
            (301, 300, 300, f"{PNPM} exec vitest run __tests__/x.test.ts"),
            (302, 301, 302, PNPM_GUARD.format(301)),
        ])
        self.assertEqual((kind, reason), ("fail", "1 live process: pnpm.mjs exec vitest run x.tes (pid 301)"))


def sh(cwd, *args):
    subprocess.run(["git", "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false",
                    "-c", "user.name=t", "-c", "user.email=t@example.com", *args],
                   cwd=cwd, check=True, capture_output=True)


class DirtyTreeTest(unittest.TestCase):
    def setUp(self):
        self.top = os.path.realpath(tempfile.mkdtemp())
        sh(self.top, "init", "-q", "-b", "main")
        for name in ("a.txt", "b.txt"):
            with open(os.path.join(self.top, name), "w") as f:
                f.write("base\n")
        sh(self.top, "add", ".")
        sh(self.top, "commit", "-qm", "base")
        sh(self.top, "checkout", "-qb", "feature/thv-1188")
        self.write("a.txt", "feature\n")
        sh(self.top, "commit", "-qam", "feature")
        sh(self.top, "checkout", "-q", "main")
        self.write("a.txt", "main\n")
        sh(self.top, "commit", "-qam", "main")
        sh(self.top, "checkout", "-q", "feature/thv-1188")

    def tearDown(self):
        subprocess.run(["rm", "-rf", self.top])

    def write(self, name, text):
        with open(os.path.join(self.top, name), "w") as f:
            f.write(text)

    def test_clean_tree_passes(self):
        self.assertIsNone(verifier.check_dirty(self.top))

    def test_plain_uncommitted_files_fail(self):
        self.write("a.txt", "edit\n")
        self.write("b.txt", "edit\n")
        self.assertEqual(verifier.check_dirty(self.top), ("fail", "2 uncommitted tracked files"))

    def test_conflicted_merge_is_pending(self):
        subprocess.run(["git", "merge", "main"], cwd=self.top, capture_output=True)
        self.assertTrue(os.path.exists(os.path.join(self.top, ".git", "MERGE_HEAD")))
        self.assertEqual(verifier.check_dirty(self.top), ("pending", "merge in progress, 1 file"))

    def test_conflicted_rebase_is_pending(self):
        subprocess.run(["git", "-c", "core.hooksPath=/dev/null", "-c", "user.name=t", "-c",
                        "user.email=t@example.com", "rebase", "main"], cwd=self.top, capture_output=True)
        self.assertTrue(os.path.isdir(os.path.join(self.top, ".git", "rebase-merge")))
        self.assertEqual(verifier.check_dirty(self.top), ("pending", "rebase in progress, 1 file"))


def gh_view(state, rollup):
    return json.dumps({"number": 336, "state": state, "statusCheckRollup": rollup})


class PullRequestTest(unittest.TestCase):
    def check(self, out):
        with patch.object(verifier, "git", return_value="3"), \
             patch.object(verifier.tw, "run", return_value=(0, out, "")):
            return verifier.check_pr("/tree", "scheduling/thv-1188", False)

    def test_red_checks_are_pending_because_main_owns_the_pr(self):
        rollup = [
            {"__typename": "CheckRun", "name": "lint / discovery / contract / types",
             "status": "COMPLETED", "conclusion": "FAILURE"},
            {"__typename": "CheckRun", "name": "CI", "status": "COMPLETED", "conclusion": "FAILURE"},
            {"__typename": "CheckRun", "name": "fast", "status": "COMPLETED", "conclusion": "SUCCESS"},
        ]
        self.assertEqual(self.check(gh_view("OPEN", rollup)),
                         ("pending", "PR #336 checks red (main owns the PR): lint / discovery / contract / types, CI"))

    def test_closed_pr_still_fails(self):
        self.assertEqual(self.check(gh_view("CLOSED", [])), ("fail", "PR #336 is closed"))


class ReportTest(unittest.TestCase):
    def setUp(self):
        self.inbox = tempfile.mkdtemp()
        patcher = patch.object(verifier.tw, "INBOX", self.inbox)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.addCleanup(subprocess.run, ["rm", "-rf", self.inbox])

    def drop(self, name, text):
        path = os.path.join(self.inbox, name)
        with open(path, "w") as f:
            f.write(text)
        return path

    def test_a_ticket_prefixed_file_that_is_not_the_report_is_not_undelivered(self):
        for name, text in (("THV-1188-verify.md", "VERIFIED THV-1188\n"),
                           ("THV-1188-fixes.md", "DONE THV-1188\n"),
                           ("THV-1188-verifier-62.md", "FINDINGS THV-1188\n")):
            with self.subTest(name=name):
                path = self.drop(name, text)
                self.assertIsNone(verifier.check_report("THV-1188"))
                os.remove(path)

    def test_exact_report_without_its_own_status_line_is_not_undelivered(self):
        for text in ("# THV-1188 step 1\nresearch notes\n", "DONE THV-1189\n", "DONE THV-11880\n",
                     "notes first\nDONE THV-1188\n",
                     "[thoven verify] THV-1188 pane w5A:p29 reported done 3 times and still: x.\n"):
            with self.subTest(text=text):
                self.drop("THV-1188.md", text)
                self.assertIsNone(verifier.check_report("THV-1188"))

    def test_real_undelivered_report_fails(self):
        for text in ("DONE THV-1188 (fix round 1)\n\n## Acceptance\n",
                     "\n\n  DONE_WITH_CONCERNS THV-1188\n", "BLOCKED THV-1188 needs the API key\n"):
            with self.subTest(text=text):
                path = self.drop("THV-1188.md", text)
                self.assertEqual(verifier.check_report("THV-1188"), f"report not delivered: {path}")


class VerifyRoutingTest(unittest.TestCase):
    def test_pending_kinds_from_processes_and_tree_do_not_fail_the_pane(self):
        with patch.object(verifier, "check_processes", return_value=("pending", "waiting on a background run: sleep 60")), \
             patch.object(verifier, "repo_info", return_value=("/tree", "scheduling/thv-1188", "THV-1188")), \
             patch.object(verifier, "check_dirty", return_value=("pending", "merge in progress, 4 files")), \
             patch.object(verifier, "check_pr", return_value=None) as check_pr, \
             patch.object(verifier, "check_report", return_value=None):
            result = verifier.verify({"pane_id": "w5A:p29", "agent": "claude", "cwd": "/tree"})
        self.assertEqual(result, ("pending", ["waiting on a background run: sleep 60", "merge in progress, 4 files"], "THV-1188"))
        check_pr.assert_called_once_with("/tree", "scheduling/thv-1188", True)

    def test_a_fail_kind_still_fails(self):
        with patch.object(verifier, "check_processes", return_value=("fail", "1 live process: next-server (v14.2.35) (pid 310)")), \
             patch.object(verifier, "repo_info", return_value=("/tree", "scheduling/thv-1188", "THV-1188")), \
             patch.object(verifier, "check_dirty", return_value=("pending", "merge in progress, 4 files")), \
             patch.object(verifier, "check_pr", return_value=None), \
             patch.object(verifier, "check_report", return_value=None):
            result = verifier.verify({"pane_id": "w5A:p29", "agent": "claude", "cwd": "/tree"})
        self.assertEqual(result, ("fail", ["1 live process: next-server (v14.2.35) (pid 310)", "merge in progress, 4 files"], "THV-1188"))


CLAUDE_LIMIT = """⏺ Committed 3 files on scheduling/thv-1188.

  ⎿  You've hit your limit · resets 3pm (America/New_York)
     /upgrade to increase your usage limit.

>
"""
CLAUDE_LIMIT_OLD = "  ⎿  Claude usage limit reached. Your limit will reset at 5pm (America/New_York).\n"
CODEX_LIMIT = ("■ You've hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit "
               "https://chatgpt.com/codex/settings/usage to purchase more credits or try again in 2 hours 13 minutes.\n")
NO_LIMIT = "⏺ DONE THV-1188\n  Tests: 14 passed.\n\n>\n"


class UsageLimitTest(unittest.TestCase):
    def setUp(self):
        self.state = tempfile.mkdtemp()
        self.addCleanup(subprocess.run, ["rm", "-rf", self.state])
        for name, value in (("STATE", self.state), ("INBOX", os.path.join(self.state, "inbox"))):
            patcher = patch.object(verifier.tw, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def done(self, screen):
        def run(argv, cwd=None, timeout=20):
            if argv[1:3] == ["agent", "read"]:
                return 0, screen, ""
            return 1, "", "unexpected"
        event = json.dumps({"data": {"pane_id": "w5A:p29", "agent_status": "done"}})
        with patch.dict(verifier.os.environ, {"HERDR_PLUGIN_EVENT_JSON": event}), \
             patch.object(verifier, "is_main", return_value=False), \
             patch.object(verifier, "get_pane", return_value={"pane_id": "w5A:p29", "agent": "claude"}), \
             patch.object(verifier, "verify", return_value=("fail", ["1 uncommitted tracked file"], "THV-1188")), \
             patch.object(verifier.tw, "run", side_effect=run), \
             patch.object(verifier.tw, "set_badge", return_value=(True, "")), \
             patch.object(verifier.tw, "herdr_ok", return_value=(True, "")) as herdr_ok:
            verifier.on_event()
        prompts = [c for c in herdr_ok.call_args_list if c.args[:2] == ("agent", "prompt")]
        return verifier.tw.read_json(verifier.contract_path("w5A:p29")), prompts

    def test_a_pane_stopped_at_a_usage_limit_is_pending_and_not_nudged(self):
        for screen in (CLAUDE_LIMIT, CLAUDE_LIMIT_OLD, CODEX_LIMIT):
            with self.subTest(screen=screen[:40]):
                contract, prompts = self.done(screen)
                self.assertEqual((contract["status"], contract["reasons"], contract["nudges"]),
                                 ("pending", ["stopped at a usage limit", "1 uncommitted tracked file"], 0))
                self.assertEqual(prompts, [])
                os.remove(verifier.internal_path("w5A:p29"))

    def test_a_pane_without_a_limit_banner_is_still_nudged(self):
        contract, prompts = self.done(NO_LIMIT)
        self.assertEqual((contract["status"], contract["reasons"], contract["nudges"]),
                         ("fail", ["1 uncommitted tracked file"], 1))
        self.assertEqual(len(prompts), 1)


class DispatchRegistrationTest(unittest.TestCase):
    def setUp(self):
        self.home = tempfile.mkdtemp()
        self.state = tempfile.mkdtemp()
        for d in (self.home, self.state):
            self.addCleanup(subprocess.run, ["rm", "-rf", d])
        for patcher in (patch.dict(verifier.os.environ, {"THOVEN_DISPATCH_HOME": self.home}),
                        patch.object(verifier.tw, "STATE", self.state)):
            patcher.start()
            self.addCleanup(patcher.stop)

    def register(self, pane_key):
        os.makedirs(os.path.join(self.home, "proj", "panes"))
        with open(os.path.join(self.home, "proj", "panes", pane_key + ".json"), "w") as f:
            f.write("{}")

    def test_a_registered_pane_is_left_to_the_dispatch_tick(self):
        self.assertTrue(verifier.in_scope("w5A:p29"))
        self.register("herdr-w5A_p29")
        self.assertFalse(verifier.in_scope("w5A:p29"))
        self.assertTrue(verifier.in_scope("w5A:p3"))
        with open(os.path.join(self.state, "verify.only-panes"), "w") as f:
            f.write("w5A:p29 w5A:p3")
        self.assertFalse(verifier.in_scope("w5A:p29"))
        self.assertTrue(verifier.in_scope("w5A:p3"))

    def test_a_done_event_on_a_registered_pane_does_nothing(self):
        self.register("herdr-w5A_p29")
        event = json.dumps({"data": {"pane_id": "w5A:p29", "agent_status": "done"}})
        with patch.dict(verifier.os.environ, {"HERDR_PLUGIN_EVENT_JSON": event}), \
             patch.object(verifier, "is_main", return_value=False), \
             patch.object(verifier, "get_pane") as get_pane:
            verifier.on_event()
        get_pane.assert_not_called()
        self.assertFalse(os.path.exists(verifier.contract_path("w5A:p29")))


if __name__ == "__main__":
    unittest.main()
