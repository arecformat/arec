# Contributing to AREC

AREC is meant to be implemented by people who did not write it. If a rule is
unclear, that is a defect in the specification, and an issue saying so is a
real contribution.

## Ways to help

- **Report an ambiguity.** Open an issue with the sentence from `SPEC.md`, the
  two readings you think it allows, and a small document that shows the
  difference.
- **Add a conformance fixture.** Every rule the validator checks should have a
  failing example in `fixtures/invalid/`. See `GOOD_FIRST_ISSUES.md` for the
  rules that do not have one yet.
- **Port the validator.** A reader in another language (Python, Rust, Go)
  that passes the same fixtures is one of the most useful things you can build.
- **Emit or consume AREC.** If your recorder writes AREC or your agent reads
  it, open a pull request adding it to the implementations list in the README and
  section 8 of `SPEC.md`.

## Running the checks

No install step. Node 18 or newer.

```sh
npm test
```

That checks the schema is in step with the validator, then runs the strict
producer check on every file in `fixtures/valid/` (all must pass) and every file
in `fixtures/invalid/` (each must fail, and only for the rule
`fixtures/expected.json` names for it).
Reading is lenient, so the invalid fixtures still read with warnings; the
strict check is where a broken rule becomes an error.

## Fixture rules

- One violation per invalid fixture. A file that breaks two rules cannot tell
  an implementer which one their reader caught.
- Name the file after the rule it breaks, for example
  `missing-metadata-section.arec`.
- Add a row for it to the fixtures table in `README.md`, and an entry to
  `fixtures/expected.json` with the text every error for it contains.
- Use example domains (`example.com`, `cdn.example`) and made-up ids. Never
  paste a real recording that belongs to someone.

## Changing the specification

AREC 1.4 is stable. Read the backward compatibility guarantee in `README.md`
and the stability section of `SPEC.md` before proposing a change.

- Explain the problem first: what a producer or consumer gets wrong today.
- Update `SPEC.md`, the schema if the machine-readable parts change, the
  validator, the fixtures and `CHANGELOG.md` in the same pull request. The
  schema's patterns and vocabularies are generated from the validator: run
  `node scripts/build-schema.mjs` after changing a constant in
  `validator/validate.mjs`, and edit only the schema's structure and
  descriptions by hand.
- A change must never make an earlier valid document unreadable. Readers stay
  lenient: they read what they understand and flag the rest.

## Licensing of contributions

By contributing you agree that specification text, schema and fixtures are
dedicated to the public domain (CC0 1.0) and that code (validator, `bin/`,
`scripts/`) is licensed under MIT, as `LICENSE.md` describes.
