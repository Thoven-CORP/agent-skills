// Runs thoven-guard-bash before every OpenCode bash call. OpenCode has no shell-hook
// config, so this plugin is the adapter: it feeds the guard the Claude-dialect payload
// and turns a deny into a thrown Error, which blocks the tool (opencode.ai/docs/plugins).
// Source: agent-skills/enforcement/opencode/thoven-guard.js. Copied out by install/opencode.py.

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Resolved beside this file, so the installed plugin finds the installed guard
// (~/.config/opencode/plugins -> ../hooks) and the repo copy finds the repo guard.
const GUARD = fileURLToPath(new URL("../hooks/thoven-guard-bash", import.meta.url));

let warned = false;

function runGuard(payload) {
  try {
    const stdout = execFileSync(GUARD, [], {
      input: JSON.stringify(payload),
      encoding: "utf8",
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return stdout.trim() ? JSON.parse(stdout) : null;
  } catch (err) {
    // Fail open, as Claude, Codex, Cursor and Devin do when a hook errors.
    if (!warned) {
      warned = true;
      console.error(`thoven-guard: guard did not run (${err.message}); allowing commands`);
    }
    return null;
  }
}

export const ThovenGuardPlugin = async (ctx) => {
  const directory = ctx?.directory;
  return {
    "tool.execute.before": async (input, output) => {
      if (input?.tool !== "bash") return;
      const command = output?.args?.command;
      if (typeof command !== "string" || !command) return;
      const verdict = runGuard({
        session_id: input.sessionID,
        cwd: output.args.workdir || directory,
        tool_input: { command },
      });
      const decision = verdict?.hookSpecificOutput;
      if (decision?.permissionDecision === "deny") {
        throw new Error(decision.permissionDecisionReason || "thoven-guard-bash denied this command");
      }
    },
  };
};
