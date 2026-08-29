"use strict";

function sections(markdown) {
  const found = {};
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  matches.forEach((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    found[match[1].trim()] = markdown.slice(start, end).trim();
  });
  return found;
}

function table(markdown) {
  const lines = markdown.split("\n").filter((line) => /^\s*\|/.test(line));
  if (lines.length < 2) return [];
  const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
  const headers = cells(lines[0]);
  return lines.slice(2).map(cells).filter((row) => row.length === headers.length).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]]))
  );
}

module.exports = { sections, table };
