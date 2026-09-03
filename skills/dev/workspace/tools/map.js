#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { fetchLinear, linearNotSupplied, normalizeLinear } = require("./linear.js");
const { buildProjectSnapshot } = require("./engine.js");
const { renderSnapshot, renderTree } = require("./render.js");

function argsOf(argv) {
  const result = { stdin: false, json: false, linearApi: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--stdin") result.stdin = true;
    else if (arg === "--json") result.json = true;
    else if (arg === "--linear-api") result.linearApi = true;
    else if (arg.startsWith("--")) {
      result[arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[index + 1];
      index += 1;
    }
  }
  return result;
}

function readStdin() { return fs.readFileSync(0, "utf8"); }

// Linear data is supplied by the caller: the agent fetches it through the Linear MCP connector
// and pipes it in. The API-key path is opt-in via --linear-api and is not the default.
async function linearInput(options) {
  if (options.stdin) return normalizeLinear(JSON.parse(readStdin()));
  if (options.linearJson) return normalizeLinear(JSON.parse(fs.readFileSync(path.resolve(options.linearJson), "utf8")));
  if (options.linearApi) return fetchLinear();
  return linearNotSupplied();
}

async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = argsOf(argv);
  const linear = await linearInput(options);
  if (options.feature || options.family) return renderTree(linear, options);

  const snapshot = buildProjectSnapshot({ cwd, options, linear });
  return options.json ? JSON.stringify(snapshot, null, 2) : renderSnapshot(snapshot);
}

if (require.main === module) {
  main().then((output) => process.stdout.write(`${output}\n`)).catch((error) => {
    process.stderr.write(`map failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { argsOf, linearInput, main };
