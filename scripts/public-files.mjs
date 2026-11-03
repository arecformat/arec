// SPDX-License-Identifier: MIT
// The files a website serves beside the specification, and the exact bytes of
// each: the JSON Schema and the frozen 1.3 schema (also at its superseded 0.3
// address), the reference reader and its command-line runner laid out to run
// from one folder, the conformance fixtures with an index and the manifest of
// expected errors, the licence, and the worked example with its frames.
//
// arecformat.org (site/) and every other host build these from the same
// function, so the copies cannot drift apart. Only the absolute links in the
// fixture index depend on where the files are served.
//
//   import { publicFiles } from './scripts/public-files.mjs';
//   for (const [rel, body] of publicFiles({ baseUrl: 'https://arecformat.org' })) ...
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expectedSchemaSource } from './build-schema.mjs';

const SPEC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const EXAMPLE_PATH = 'examples/relay-design-review.arec';

/**
 * @param {{ baseUrl: string }} options Origin the files are served from, with no trailing slash.
 * @returns {Map<string, string | Buffer>} Served path (relative, no leading slash) to file contents.
 */
export function publicFiles({ baseUrl }) {
  const base = baseUrl.replace(/\/+$/, '');
  const files = new Map();
  const read = (rel) => fs.readFileSync(path.join(SPEC, rel), 'utf8');
  const schemaText = expectedSchemaSource();

  files.set('schema/arec-1.4.schema.json', schemaText);
  // The 1.3 schema is kept byte for byte as it was published, so a document
  // that names it keeps the check it was written against. The 0.3 URL serves
  // the same field set, which 1.3 froze unchanged; only its identity differs.
  // Both identities are fixed names, not the address the file is served from.
  const frozenText = read('schema/arec-1.3.schema.json');
  files.set('schema/arec-1.3.schema.json', frozenText);
  const legacySchema = JSON.parse(frozenText);
  legacySchema.$id = 'https://clipy.online/schema/arec-0.3.schema.json';
  legacySchema.title = 'AREC (Agent Recording) 0.3, superseded by 1.3 at https://clipy.online/schema/arec-1.3.schema.json';
  files.set('schema/arec-0.3.schema.json', `${JSON.stringify(legacySchema, null, 2)}\n`);

  files.set('arec/validate.mjs', read('validator/validate.mjs'));
  // The runner sits next to the validator when served, so its import moves up a level.
  files.set(
    'arec/arec-validate.mjs',
    read('bin/arec-validate.mjs').replace("from '../validator/validate.mjs'", "from './validate.mjs'"),
  );
  files.set('arec/LICENSE.md', read('LICENSE.md'));
  files.set('arec/examples/relay-design-review.arec', read(EXAMPLE_PATH));
  // The example's frames, so it can be read without any other host.
  const frames = EXAMPLE_PATH.replace(/\.arec$/, '');
  for (const name of fs.readdirSync(path.join(SPEC, frames)).filter((f) => f.endsWith('.jpg')).sort()) {
    files.set(`arec/${frames}/${name}`, fs.readFileSync(path.join(SPEC, frames, name)));
  }

  const index = {};
  for (const kind of ['valid', 'invalid']) {
    const names = fs
      .readdirSync(path.join(SPEC, 'fixtures', kind))
      .filter((name) => name.endsWith('.arec'))
      .sort();
    index[kind] = names.map((name) => `${base}/arec/fixtures/${kind}/${name}`);
    for (const name of names) {
      files.set(`arec/fixtures/${kind}/${name}`, read(`fixtures/${kind}/${name}`));
    }
  }
  files.set('arec/fixtures/expected.json', read('fixtures/expected.json'));
  files.set(
    'arec/fixtures/index.json',
    `${JSON.stringify(
      {
        spec_version: '1.4',
        license: 'CC0-1.0',
        ...index,
        examples: [`${base}/arec/examples/relay-design-review.arec`],
      },
      null,
      2,
    )}\n`,
  );
  return files;
}
