"use strict";

function appendLog(markdown, entry) {
  const normalized = entry.startsWith("-") ? entry : `- ${entry}`;
  if (markdown.split("\n").some((line) => line.trim() === normalized.trim())) return markdown;
  const marker = "## Feature log";
  if (!markdown.includes(marker)) return `${markdown.trimEnd()}\n\n${marker}\n\n${normalized}\n`;
  const index = markdown.indexOf(marker) + marker.length;
  return `${markdown.slice(0, index)}\n\n${normalized}${markdown.slice(index)}`;
}

function resolveImbalance(markdown, id, resolution) {
  const lines = markdown.split("\n");
  const kept = lines.filter((line) => !(line.includes(`| ${id} |`) || line.includes(`|${id}|`)));
  return appendLog(kept.join("\n"), `RESOLVED ${id}: ${resolution}`);
}

module.exports = { appendLog, resolveImbalance };
