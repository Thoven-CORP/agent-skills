#!/usr/bin/env node
"use strict";

const { argsOf, linearInput } = require("../../workspace/tools/map.js");
const { buildProjectSnapshot } = require("../../workspace/tools/engine.js");

async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = { ...argsOf(argv), json: true };
  const linear = await linearInput(options);
  return JSON.stringify(buildProjectSnapshot({ cwd, options, linear }), null, 2);
}

if (require.main === module) {
  main().then((output) => process.stdout.write(`${output}\n`)).catch((error) => {
    process.stderr.write(`reconcile failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { main };
