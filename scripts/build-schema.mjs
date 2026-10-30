#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Keeps schema/arec-1.3.schema.json in step with validator/validate.mjs.
//
// Every pattern and vocabulary the validator also enforces is copied into the
// schema from the validator's own constants, so the two accept and reject the
// same values. Edit the schema's structure and descriptions by hand; never edit
// a generated pattern, run this instead.
//
//   node scripts/build-schema.mjs           rewrite the schema
//   node scripts/build-schema.mjs --check   exit 1 if the schema has drifted (npm test runs this)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ARTIFACT_REF_PATTERN,
  CURRENT_VERSION_PATTERN,
  DYNAMIC_EXTRACTION_PATTERN,
  FORBIDDEN_DIAGNOSTIC_KEY_PATTERN,
  LEGACY_VERSION_PATTERN,
  NEWER_MINOR_PATTERN,
  POINTER_SOURCES,
  PROFILES,
  RAW_QUERY_VALUE_PATTERN,
  SPEC_VERSION_PATTERN,
  WATCH_URL_PATTERN,
} from '../validator/validate.mjs';

export const SCHEMA_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../schema/arec-1.3.schema.json');

/** The schema text with every generated value copied from the validator. */
export function expectedSchemaSource() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const defs = schema.$defs;
  // Versioning: 1.x is checked in full, legacy 0.x (or no header) is accepted.
  schema.if.properties.header.properties.spec_version.pattern = CURRENT_VERSION_PATTERN;
  defs.headerBase.properties.spec_version.anyOf = [{ pattern: LEGACY_VERSION_PATTERN }, { pattern: CURRENT_VERSION_PATTERN }];
  defs.artifactRef.pattern = ARTIFACT_REF_PATTERN;
  defs.artifactRef.not.pattern = DYNAMIC_EXTRACTION_PATTERN;
  defs.header.properties.spec_version.pattern = SPEC_VERSION_PATTERN;
  defs.header.properties.watch_url.pattern = WATCH_URL_PATTERN;
  defs.header.properties.profile.examples = [...PROFILES];
  defs.header.if.properties.spec_version.pattern = NEWER_MINOR_PATTERN;
  defs.header.else.properties.profile.enum = [...PROFILES];
  defs.keyMoment.properties.source.examples = [...POINTER_SOURCES];
  defs.noSecrets.propertyNames.not.pattern = FORBIDDEN_DIAGNOSTIC_KEY_PATTERN;
  defs.noRawQueryValues.not.pattern = RAW_QUERY_VALUE_PATTERN;
  defs.noRawQueryValues.propertyNames.not.pattern = RAW_QUERY_VALUE_PATTERN;
  return `${JSON.stringify(schema, null, 2)}\n`;
}

function main() {
  const expected = expectedSchemaSource();
  // A Windows checkout may turn LF into CRLF; the content is what matters.
  const current = fs.readFileSync(SCHEMA_PATH, 'utf8').replace(/\r\n/g, '\n');
  if (process.argv.includes('--check')) {
    if (current !== expected) {
      process.stderr.write('schema/arec-1.3.schema.json differs from validate.mjs. Run: node scripts/build-schema.mjs\n');
      process.exit(1);
    }
    process.stdout.write('Schema is in step with the validator.\n');
    return;
  }
  if (current !== expected) fs.writeFileSync(SCHEMA_PATH, expected);
  process.stdout.write(current === expected ? 'Schema already up to date.\n' : 'Rewrote schema/arec-1.3.schema.json.\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
