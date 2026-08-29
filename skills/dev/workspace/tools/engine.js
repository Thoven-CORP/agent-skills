"use strict";

const path = require("node:path");
const { gitFingerprint } = require("./git.js");
const { resolveProject } = require("./project.js");
const { readProjectState } = require("./project-state.js");
const { deriveSnapshot } = require("./snapshot.js");

function buildProjectSnapshot({ cwd = process.cwd(), options = {}, linear }) {
  const identity = resolveProject({ cwd, explicitDir: options.projectDir, explicitName: options.project });
  const git = gitFingerprint(options.repo || identity.dir || cwd);
  const compatibility = identity.dir ? [path.dirname(path.dirname(identity.dir))] : [];
  const projectState = identity.dir ? readProjectState(identity.dir, compatibility) : readProjectState(cwd);
  return deriveSnapshot({ identity, linear, git, projectState });
}

module.exports = { buildProjectSnapshot };
