// Records this session's edits through thoven-track-edits after each tool call. The Bash guard
// reads that log to allow a path-scoped undo of this session's own files.
// Source: agent-skills/enforcement/opencode/thoven-track-edits.js. Copied out by install/opencode.py.

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolved beside this file, as thoven-guard.js resolves its guard.
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
      console.error(`thoven-track-edits: hook did not run (${why})`);
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

export const ThovenTrackEditsPlugin = async (ctx) => {
  const directory = ctx?.directory;
  return {
    "tool.execute.after": async (input) => {
      if (!input?.sessionID || !directory) return;
      const payload = trackPayload(input, directory);
      if (payload) runHook(TRACK, [], payload);
    },
  };
};
