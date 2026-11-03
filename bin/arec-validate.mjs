#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Read or check AREC documents.
//
//   node bin/arec-validate.mjs recording.arec            read leniently (default)
//   node bin/arec-validate.mjs --strict recording.arec   optional producer check
//   node bin/arec-validate.mjs --json fixtures/valid/*.arec
//   curl -fs https://example.com/video/<id>.arec | node bin/arec-validate.mjs -
//
// By default every text document is read and the exit code is 0; problems are
// printed as warnings, and sensitive diagnostic keys are reported as redacted.
// With --strict (for producers checking what they write) a document that breaks
// a rule fails and the exit code is 1. A legacy document (0.x, or no identity
// comment) is reported as LEGACY, never as conforming to the current version.

import { readFileSync } from 'node:fs';
import process from 'node:process';

import { validateArec, SPEC_VERSION } from '../validator/validate.mjs';

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const strict = args.includes('--strict');
const help = args.includes('--help') || args.includes('-h');
const unknown = args.filter((arg) => arg.startsWith('-') && arg !== '-' && !['--json', '--strict', '--help', '-h'].includes(arg));
const files = args.filter((arg) => !arg.startsWith('-') || arg === '-');

if (unknown.length > 0) {
  process.stderr.write(`Unknown option: ${unknown.join(', ')}. Run arec-validate --help.\n`);
  process.exit(2);
}

if (files.length === 0 || help) {
  process.stdout.write(
    `arec-validate (AREC ${SPEC_VERSION})\n\n` +
      'Usage: arec-validate [--strict] [--json] <file.arec ...>\n' +
      '       cat recording.arec | arec-validate -\n\n' +
      'Reads leniently by default and exits 0 for any text document.\n' +
      '--strict  optional producer check: exit 1 when a document breaks a rule.\n',
  );
  process.exit(help ? 0 : 1);
}

const mode = strict ? 'conform' : 'read';
const results = files.map((file) => {
  const source = file === '-' ? '<stdin>' : file;
  let text;
  try {
    text = file === '-' ? readStdin() : readFileSync(file, 'utf8');
  } catch (error) {
    return { ok: false, mode, source, header: null, legacy: false, errors: [`Cannot read file: ${error.message}`], warnings: [], counts: { keyMoments: 0, diagnostics: 0 } };
  }
  return validateArec(text, { source, mode });
});

const failed = results.filter((result) => !result.ok);
const legacy = results.filter((result) => result.ok && result.legacy);

if (asJson) {
  process.stdout.write(`${JSON.stringify({ ok: failed.length === 0, mode, results }, null, 2)}\n`);
} else {
  for (const result of results) {
    const status = !result.ok ? 'FAIL' : !strict ? 'READ' : result.legacy ? 'LEGACY' : 'PASS';
    process.stdout.write(`${status} ${result.source}\n`);
    for (const error of result.errors) process.stdout.write(`  error:   ${error}\n`);
    for (const warning of result.warnings) process.stdout.write(`  warning: ${warning}\n`);
  }
  if (strict) {
    const passed = results.length - failed.length - legacy.length;
    process.stdout.write(`\n${passed}/${results.length} documents conform to AREC ${SPEC_VERSION} (strict producer check).\n`);
    if (legacy.length > 0) {
      process.stdout.write(
        `${legacy.length} legacy ${legacy.length === 1 ? 'document was' : 'documents were'} accepted under the rules of section 7.1: ` +
          'only the section 5 rules are errors, the rest are warnings, and a current producer writes the identity comment with spec_version ' +
          `${SPEC_VERSION}.\n`,
      );
    }
  } else {
    process.stdout.write(`\n${results.length - failed.length}/${results.length} documents read as AREC.\n`);
  }
}

process.exit(failed.length === 0 ? 0 : 1);
