#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Runs the conformance fixtures in both directions under the strict producer
// check (mode 'conform'): every file in fixtures/valid/ must pass, and every
// file in fixtures/invalid/ must fail for the one rule fixtures/expected.json
// names for it. Reading stays lenient; this is the check a producer runs on
// what it writes. Plain Node with no shell globbing, so it behaves the same on
// Windows, macOS and Linux.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateArec } from '../validator/validate.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const expected = JSON.parse(readFileSync(path.join(fixtures, 'expected.json'), 'utf8')).invalid;
let failures = 0;

for (const kind of ['valid', 'invalid']) {
  const dir = path.join(fixtures, kind);
  const files = readdirSync(dir).filter((f) => f.endsWith('.arec')).sort();
  if (files.length === 0) {
    console.error(`No ${kind} fixtures found in ${dir}`);
    failures += 1;
    continue;
  }
  for (const file of files) {
    const result = validateArec(readFileSync(path.join(dir, file), 'utf8'), { source: file, mode: 'conform' });
    if (kind === 'valid' && !result.ok) {
      failures += 1;
      console.error(`FAIL valid/${file}: ${result.errors.join(' | ')}`);
    } else if (kind === 'invalid' && result.ok) {
      failures += 1;
      console.error(`FAIL invalid/${file}: expected at least one error, got none`);
    } else if (kind === 'invalid' && typeof expected[file] !== 'string') {
      failures += 1;
      console.error(`FAIL invalid/${file}: no entry in fixtures/expected.json naming the rule it breaks`);
    } else if (kind === 'invalid' && result.errors.some((error) => !error.includes(expected[file]))) {
      failures += 1;
      const other = result.errors.filter((error) => !error.includes(expected[file]));
      console.error(`FAIL invalid/${file}: breaks more than the one rule it is for: ${other.join(' | ')}`);
    } else {
      console.log(`ok   ${kind}/${file}${kind === 'invalid' ? `: ${result.errors[0]}` : ''}`);
    }
  }
}

for (const file of Object.keys(expected)) {
  if (!readdirSync(path.join(fixtures, 'invalid')).includes(file)) {
    failures += 1;
    console.error(`FAIL fixtures/expected.json names ${file}, which does not exist`);
  }
}

console.log(failures === 0 ? '\nAll fixtures behave as expected.' : `\n${failures} fixture(s) misbehaved.`);
process.exit(failures === 0 ? 0 : 1);
