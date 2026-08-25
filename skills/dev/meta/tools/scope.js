#!/usr/bin/env node
// Bind a herdr space label to one ledger folder. WORKFLOW §8 is the table.
//
// node scope.js '<spaceLabel>'
//   exit 0, print JSON { folder, nowHeading }
// node scope.js '<spaceLabel>' '<writePath>'
//   exit 0 if writePath is inside the bind or is STATE.md / monitor/
//   exit 1 otherwise

const path = require('node:path');
const os = require('node:os');

const THOVEN = path.join(os.homedir(), 'thoven');

const MAP = {
  '~Dashboard': {
    folder: 'thoven2.0/teacher-2.0/projects/02-dashboard',
    nowHeading: 'Teacher 2.0: Dashboard',
  },
  '~Business': {
    folder: 'thoven2.0/teacher-2.0/projects/07-business',
    nowHeading: 'Teacher 2.0: Business',
  },
  '~Onboarding': {
    folder: 'thoven2.0/teacher-2.0/projects/00-onboarding',
    nowHeading: 'Teacher 2.0: Onboarding',
  },
  '~Parent2.0': {
    folder: 'thoven2.0/parent-2.0',
    nowHeading: 'Parent 2.0',
  },
};

function normalize(label) {
  return String(label || '')
    .replace(/\s*·\s*parked\s*$/i, '')
    .trim();
}

function bind(label) {
  const key = normalize(label);
  return MAP[key] || null;
}

function allowedWrite(label, writePath) {
  const b = bind(label);
  if (!b) return { ok: false, reason: `unbound-space: ${label}` };
  const abs = path.resolve(writePath);
  const folder = path.resolve(THOVEN, b.folder);
  const state = path.resolve(THOVEN, '.workspace/STATE.md');
  const monitor = path.resolve(THOVEN, '.workspace/monitor');
  if (abs === state) return { ok: true, bind: b, via: 'state' };
  if (abs === monitor || abs.startsWith(monitor + path.sep)) {
    return { ok: true, bind: b, via: 'monitor' };
  }
  if (abs === folder || abs.startsWith(folder + path.sep)) {
    return { ok: true, bind: b, via: 'folder' };
  }
  return { ok: false, reason: `outside-bind: ${abs} not under ${folder}`, bind: b };
}

if (require.main === module) {
  const label = process.argv[2];
  const writePath = process.argv[3];
  if (!label) {
    console.error("usage: node scope.js '<spaceLabel>' [writePath]");
    process.exit(2);
  }
  const b = bind(label);
  if (!b) {
    console.error(JSON.stringify({ ok: false, reason: `unbound-space: ${label}` }, null, 2));
    process.exit(1);
  }
  if (!writePath) {
    console.log(JSON.stringify({ ok: true, folder: b.folder, nowHeading: b.nowHeading }, null, 2));
    process.exit(0);
  }
  const result = allowedWrite(label, writePath);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

module.exports = { MAP, bind, allowedWrite, normalize };
