// reconcile-manifests.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { findStaleManifests } = require('./reconcile-manifests.js');

test('flags a ship-phase manifest as stale', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'));
  const dir = path.join(repo, 'docs/Feat_X/.dev');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'MANIFEST.md'), '| **Feature** | Feat X |\n| **Current Phase** | ship |\n');
  const stale = findStaleManifests({ repoDir: repo });
  assert.strictEqual(stale.length, 1);
  assert.strictEqual(stale[0].phase, 'ship');
});
test('does NOT flag a manifest already marked shipped/terminal', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'));
  const dir = path.join(repo, 'docs/Feat_Y/.dev');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'MANIFEST.md'), '| **Feature** | Feat Y |\n| **Current Phase** | shipped |\n');
  assert.strictEqual(findStaleManifests({ repoDir: repo }).length, 0);
});
