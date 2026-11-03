# Good first issues

Each section below is one piece of real work that is missing today. Before you
start, open an issue for it on GitHub (or comment on the one that already
exists) so two people do not take the same one.

## Add an invalid fixture: document with no Metadata section

The strict check (`--strict`) rejects a document without a `Metadata` heading,
but no fixture in `fixtures/invalid/` proves it. Add `missing-metadata-section.arec` that is
valid in every other way, add it to the fixtures table in the README and to
`fixtures/expected.json`, and run
`npm test`.

## Add an invalid fixture: no Transcript and no explanation

A document must have a `Transcript` section or say explicitly why there is
none. `fixtures/valid/no-transcript-declared.arec` covers the allowed case;
nothing covers the rejected one. Add `missing-transcript-unexplained.arec`.

## Add an invalid fixture: spec_version that is not semver-style

`spec_version` must be a MAJOR.MINOR version such as `1.4`. Add a fixture whose
identity comment uses something like `spec_version: latest` and check the
strict check rejects it for that reason alone.

## Add an invalid fixture: watch_url that is not https

`watch_url` is a human-facing address and must be an absolute https URL. Add a
fixture with `watch_url: http://...` (or a relative path) and confirm the strict
check's error names `watch_url`.

## Add an invalid fixture: key moments JSON that does not parse

A `Key moments` section carries a JSON block. Add a fixture where that block
has a syntax error and confirm the strict check reports it rather than
ignoring the section.

## Port the validator to Python

Write `arec_validate.py` (standard library only) that applies the same rules as
`validator/validate.mjs`: lenient reading by default, plus the strict check,
which must pass every fixture in both directions. A reader
outside JavaScript is the strongest test of whether the specification is clear
on its own.

## Port the validator to Rust

Same goal as the Python port: a small crate with a `validate(&str)` function
and a CLI, passing every fixture. This one is bigger than the rest of the list. Note any rule you had to guess at in the pull
request; those are specification bugs.

## Check the machine-readable parts against the JSON Schema

`schema/arec-1.4.schema.json` describes the identity header, key moments and
browser diagnostics, but the validator checks those by hand and never loads
the schema. Add an optional `--schema` mode that validates the extracted
objects against the schema, without adding a runtime dependency to the default
path.

## Add a --print flag that outputs the parsed document as JSON

`arec-validate --json` prints validation results, and `readArec()` already
parses a document in code. Add `--print` to the CLI so it outputs the
`document` that `readArec()` returns as JSON, and a script can read an AREC
document without writing any JavaScript.

## Editor support for .arec files

Write a short guide (or a tiny VS Code extension) that associates `.arec` with
Markdown and adds a snippet for the `<!-- arec ... -->` identity comment. Also
document the `.gitattributes` line that makes GitHub highlight `.arec` files as
Markdown: `*.arec linguist-language=Markdown`.

## Tutorial: write your first AREC document by hand

Add `docs/first-document.md`: start from an empty file, add each required part
in order (identity comment, Metadata, Transcript, capture gaps), run the
validator after each step, and show the error it prints until the document
passes.
