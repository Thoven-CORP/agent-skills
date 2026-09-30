// Records this session's edits through thoven-track-edits after each tool call, and runs
// thoven-uncommitted when the session goes idle and prints its question.
// Warn only: session.idle is published after the turn has ended, so a plugin cannot hold
// the session open the way a Claude or Codex Stop hook can (opencode.ai/docs/plugins).
// Source: agent-skills/enforcement/opencode/thoven-uncommitted.js. Copied out by install/opencode.py.

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolved beside this file, as thoven-guard.js resolves its guard.
const HOOK = fileURLToPath(new URL("../hooks/thoven-uncommitted", import.meta.url));
const TRACK = fileURLToPath(new URL("../hooks/thoven-track-edits", import.meta.url));

let warned = false;

function runHook(script, args, payload) {
  const result = spawnSync(script, args, {
    input: JSON.stringify(payload),
    encoding: "utf8",
    timeout: 10000,
  });
  if (result.error || result.status !== 0) {
    // Fail open, as thoven-guard.js does.
    if (!warned) {
      warned = true;
      const why = result.error ? result.error.message : `exit ${result.status}`;
      console.error(`thoven-uncommitted: hook did not run (${why})`);
    }
    return null;
  }
  return result;
}

// OpenCode's tool call in the Claude shape thoven-track-edits reads. apply_patch names its
// paths only inside the patch, so it is recorded as a shell call and the tracker scans git.
function trackPayload(input, directory) {
  const args = input?.args ?? {};
  const base = { session_id: input?.sessionID, cwd: directory };
  switch (input?.tool) {
    case "edit":
    case "write":
      if (typeof args.filePath !== "string") return null;
      return { ...base, tool_name: "Edit", tool_input: { file_path: resolve(directory, args.filePath) } };
    case "bash":
      return { ...base, cwd: args.workdir || directory, tool_name: "Bash", tool_input: { command: args.command ?? "" } };
    case "apply_patch":
      return { ...base, tool_name: "Bash", tool_input: { command: "" } };
    default:
      return null;
  }
}

export const ThovenUncommittedPlugin = async (ctx) => {
  const directory = ctx?.directory;
  return {
    "tool.execute.after": async (input) => {
      if (!input?.sessionID || !directory) return;
      const payload = trackPayload(input, directory);
      if (payload) runHook(TRACK, [], payload);
    },
    event: async ({ event }) => {
      if (event?.type !== "session.idle") return;
      const sessionID = event.properties?.sessionID;
      if (!sessionID) return;
      const result = runHook(HOOK, ["--dialect", "warn"], { session_id: sessionID, cwd: directory });
      const message = (result?.stderr || "").trim();
      if (message) console.error(message);
    },
  };
};
