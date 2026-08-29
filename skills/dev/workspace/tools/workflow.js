"use strict";

const { sections } = require("./markdown.js");

const DEFAULT_LANES = ["Triage", "Backlog", "Todo", "In Progress", "Ready", "Done", "Canceled"];

function parseWorkflow(markdown) {
  const parsed = sections(markdown);
  const laneLine = markdown.match(/`Triage\s*→\s*Backlog\s*→\s*Todo\s*→\s*In Progress\s*→\s*Ready\s*→\s*Done`/);
  const folder = markdown.match(/projects\/<project>\/[\s\S]{0,500}/);
  return {
    lanes: laneLine ? DEFAULT_LANES : [],
    definitions: parsed.Definitions || "",
    featureFolderRule: folder ? folder[0].split("\n").slice(0, 14).join("\n") : "",
    projectStateRequired: /projects\/<project>\/[\s\S]*CONTINUE_HERE\.md[\s\S]*STATE\.md/.test(markdown),
    mainSessionSynthesis: /main session/i.test(markdown),
  };
}

module.exports = { DEFAULT_LANES, parseWorkflow };
