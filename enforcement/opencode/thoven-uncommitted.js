// Runs thoven-uncommitted when an OpenCode session goes idle and prints its question.
// Warn only: session.idle is published after the turn has ended, so a plugin cannot hold
// the session open the way a Claude or Codex Stop hook can (opencode.ai/docs/plugins).
// OpenCode writes no edit log yet, so until an edit tracker exists there this finds nothing.
// Source: agent-skills/enforcement/opencode/thoven-uncommitted.js. Copied out by install/opencode.py.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Resolved beside this file, as thoven-guard.js resolves its guard.
const HOOK = fileURLToPath(new URL("../hooks/thoven-uncommitted", import.meta.url));

let warned = false;

function runHook(payload) {
  const result = spawnSync(HOOK, ["--dialect", "warn"], {
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
    return;
  }
  const message = (result.stderr || "").trim();
  if (message) console.error(message);
}

export const ThovenUncommittedPlugin = async (ctx) => {
  const directory = ctx?.directory;
  return {
    event: async ({ event }) => {
      if (event?.type !== "session.idle") return;
      const sessionID = event.properties?.sessionID;
      if (!sessionID) return;
      runHook({ session_id: sessionID, cwd: directory });
    },
  };
};
