#!/usr/bin/env node
/**
 * Version bump script — updates the three places that must stay in sync:
 *
 *   1. package.json             "version": "X.Y.Z"
 *   2. src/lib/appConfig.ts     versionLabel: 'v.X.Y.Z Beta'
 *   3. public/service-worker.js CACHE_NAME = 'exercise-journal-vX.Y.Z'
 *
 * Usage:
 *   npm run version:bump 1.5.1
 *   node scripts/bump-version.js 1.5.1
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  process.stderr.write('Usage: npm run version:bump <major.minor.patch>\n');
  process.stderr.write('Example: npm run version:bump 1.5.1\n');
  process.exit(1);
}

function replaceLine(filePath, predicate, transform) {
  const raw = readFileSync(filePath, 'utf-8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const idx = lines.findIndex(predicate);
  if (idx === -1) {
    process.stderr.write('ERROR: pattern not found in ' + filePath + '\n');
    process.exit(1);
  }
  lines[idx] = transform(lines[idx]);
  writeFileSync(filePath, lines.join(eol));
}

// 1. package.json
const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
process.stdout.write('OK  package.json             -> ' + version + '\n');

// 2. src/lib/appConfig.ts  (line containing versionLabel)
replaceLine(
  join(ROOT, 'src/lib/appConfig.ts'),
  (l) => l.includes('versionLabel'),
  (l) => l.replace(/v\.\d[^']*/, 'v.' + version + ' Beta')
);
process.stdout.write('OK  src/lib/appConfig.ts     -> v.' + version + ' Beta\n');

// 3. public/service-worker.js  (line containing CACHE_NAME and exercise-journal)
replaceLine(
  join(ROOT, 'public/service-worker.js'),
  (l) => l.includes('CACHE_NAME') && l.includes('exercise-journal'),
  (l) => l.replace(/exercise-journal-v[\d.]+/, 'exercise-journal-v' + version)
);
process.stdout.write('OK  public/service-worker.js -> exercise-journal-v' + version + '\n');

process.stdout.write('\nDone. Commit with:\n');
process.stdout.write('  git add package.json src/lib/appConfig.ts public/service-worker.js\n');
process.stdout.write('  git commit -m "chore: bump version to ' + version + '"\n');
