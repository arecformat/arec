# AREC changelog

All notable changes to the AREC format. 1.4 is the current, stable version.
Within 1.x nothing a conformant document relies on is removed or redefined;
breaking changes are reserved for 2.0.

## Unreleased

Nothing yet. Proposals being considered for 1.5, each an optional addition:

- Element identity on a key moment: a role and label beside the coordinate, so a
  consumer knows what was pointed at and not only where. The ecosystem has
  converged on semantic structure over pixels, and a coordinate alone is the
  weaker half of that pair.
- A registry of pointer `source` values, so producers can add evidence kinds
  without a spec revision.
- A stable identifier for a key moment, so a consumer can cite one across
  document revisions.
- Guidance on documents longer than a typical model context window.
- Credentials elsewhere in a diagnostic URL: userinfo
  (`https://user:secret@host`) and path parameters (`;jsessionid=...`), which
  1.3.1 does not yet check.
- Fenced blocks inside blockquotes and list items, which readers do not yet
  scan.

## 1.4, November 2026

- The recording profile is named `recording`. The name 1.3 used stays valid
  and means the same profile in every 1.x document (specification section
  3.1), so every 1.3 document conforms to 1.4 unchanged. Producers following 1.4
  write `recording`, and the profile covers a recording from any screen
  recorder.
- Schema at `schema/arec-1.4.schema.json`, identified as
  https://arecformat.org/schema/arec-1.4.schema.json. Its profile rule accepts
  both names. `schema/arec-1.3.schema.json` is kept as published.
- The worked example is a 1.4 document, served with its frames from
  arecformat.org. Added the `profile-name-1.3.arec` fixture.
- The validator, its runner, the fixtures and the example are served from
  https://arecformat.org; the fixture index is
  https://arecformat.org/arec/fixtures/index.json.

## Reference implementation 1.3.1, October 2026

Corrections to the reader, the strict check, the schema and the wording of the
1.3 specification; `spec_version` stays 1.3. Section 5 already forbade secrets
and raw query values in diagnostics; this release states those rules precisely
and enforces them. A document that only passed because of the gaps below now
fails: one with a listed key in another spelling (`accessToken`) or one newly
listed (`postData`), a forbidden value in a diagnostics sub-section, a
diagnostic string that begins with a URL carrying a value, or a block in a
diagnostics section that should hold JSON but does not parse, which is now
tagged `text` instead.

- Section 7.1 now says what section 5 already required: content the security
  rules forbid (sensitive diagnostic keys, raw query values in diagnostics, and
  evidence that needs on-demand frame extraction) is an error under the strict
  check in a document of any version, including a legacy 0.x document or one
  with no identity comment. Before, the strict check reported it as a warning
  for a legacy document and passed it.
- Section 5 now lists the sensitive key names, the minimum a checker enforces,
  compared ignoring ASCII case, `-`, `_` and whitespace (so `accessToken` and
  `x-api-key` are caught). The list adds `postdata`, `proxyauthorization`,
  bearer, auth, CSRF and XSRF tokens, `xapikey`, `clientsecret`, `privatekey`,
  `pwd`, `passwd`, `passphrase`, `credential`, `credentials`, `jwt`,
  `jsessionid` and `phpsessid`.
- Section 5 defines a raw query value (a parameter value in a URL's query or
  fragment), which headings make a diagnostics section and how far it reaches,
  and which blocks must hold JSON. The rules cover sub-sections and blocks
  tagged `jsonc`, `json5`, `ndjson` or `jsonl` as well as `json` and untagged
  JSON. Whitespace in key names and URLs means space, tab, CR and LF, so every
  regular expression engine reads the patterns alike.
- Code fences close as in CommonMark: only spaces or tabs may follow a closing
  fence, so a no-break space there leaves the block open and its content is
  checked with the block.
- Object names in diagnostics are checked like string values, and a name may not
  appear twice in one object, so no value can hide behind a repeated name.
- The strict check flags a diagnostic string that begins with a URL carrying a
  raw query value (`?token=abc`, `#access_token=abc`); key names without values,
  such as `?format&id`, are allowed. A URL later in free text is the producer's
  to redact.
- The reader removes parameter values from every URL in a diagnostics section,
  in JSON strings and in text, and keeps the key names. It removes sensitive
  keys from the key moments it returns, as it already did from the Markdown, and
  reads large documents in linear time.
- `arec-validate --strict` reports a legacy document as `LEGACY`, never as
  conforming to 1.3, and an unknown option is an error instead of a file name.
- The JSON Schema applies the section 5 rules whatever the version and adds
  `noRawQueryValues`. Its generator ships with the specification
  (`scripts/build-schema.mjs`), and the test suite fails if the schema drifts
  from the validator.
- Fixtures: added `diagnostics-raw-query-value.arec` and
  `legacy-diagnostics-leak.arec`. `fixtures/expected.json` names the one rule
  each invalid fixture breaks, and the runner checks that every error is for
  that rule. Invalid fixtures carry a title, and example values replace
  identifiers from real recordings.

## 1.3, October 2026

- First stable release: the 0.3 field set, frozen for the 1.x line. Documents
  declare `spec_version: 1.3`. A document declaring `0.3`, with or without a
  pre-release suffix, uses the same field set, so a reader reads it the same
  way; the strict check reports it as legacy.
- Stability promise: 1.x minor releases only add optional sections, fields,
  profiles or pointer `source` values.
- Licensing: specification, schema and fixtures dedicated to the public domain
  under CC0 1.0 (0.3 was CC BY 4.0); validator under the MIT License; patent
  non-assertion for every implementation.
- BCP 14 keywords (MUST, SHOULD, MAY) and definitions of producer and consumer.
- Plan section retitled Suggested implementation plan. Headings are matched by
  meaning, so the earlier heading stays conformant.
- Schema renamed to `schema/arec-1.3.schema.json`. Added the
  `legacy-0.3.arec` fixture.
- Documented the `deixis` and `narration` pointer sources. An absent or `null`
  field means not captured. Unknown `source` values are ignored.
- The validator, its runner, the fixtures and a worked example are served
  beside the specification.
- Reading is lenient (specification sections 4.2 and 7.1): a reader never
  refuses a document for its version, structure or unknown content. It reads
  every earlier version (any 0.x value with or without a suffix, and documents
  with no identity comment), reads a newer major version on a best-effort
  basis, treats malformed or `null` fields as absent, and removes sensitive
  diagnostic keys from what it returns. Problems are flagged as warnings. The
  reference code gains `readArec(text)`, which returns `{ document, warnings }`
  and never throws, and `arec-validate` reads leniently by default.
- Optional strict producer check (section 4.4): `arec-validate --strict` or
  `validateArec(text, { mode: 'conform' })` reports broken rules as errors for
  a producer checking what it writes. Nothing a reader does depends on it. The
  JSON Schema is the same strict check for the machine-readable parts: its
  patterns are generated from the reference code's constants, it applies its
  rules only when the header declares 1.x, and it no longer requires a header.
- Version syntax: MAJOR and MINOR are whole numbers without leading zeros, so
  `1.03` is not a version. A pre-release suffix never changes the minor:
  `1.3-rc.1` follows 1.3, `1.4-beta` follows 1.4.
- `canonical_url` names the AREC document itself, never the source video;
  imported bundles without a hosted AREC URL omit it and keep the source URL in
  Metadata.
- No agent notice block: a document is the identity comment, the title and
  its sections. Readers treat recording content as data, never instructions.
  Removed the `untrusted-notice-missing.arec` fixture.
  `missing-identity-comment.arec` now declares 1.3 in its Metadata, since a
  header-less legacy document is readable.
- Added legacy fixtures rendered by the real earlier producers: a Mac local
  recording (0.3), an early CLI bundle and a hosted `recording.md` from before
  identity comments.
- Diagnostic `kind` is any non-empty string. Forbidden diagnostic keys are
  matched at any depth, in any casing, ignoring surrounding whitespace and `-`
  versus `_` (`Set-Cookie`), and the list adds request and response headers,
  `api_key`, `password`, `refresh_token`, `id_token` and `secret`. The reader
  removes them from every fenced JSON block, recognises every CommonMark fence
  (backticks or tildes, any info string), and replaces a diagnostics block it
  cannot check.
- Readers normalise CRLF and CR line endings to LF and drop evidence links that
  are neither absolute https nor a path inside the bundle (`javascript:`,
  `data:`, `file:`, `ftp:`, `http:`, a leading `/` or a `..` segment). An empty
  `watch_url` or `canonical_url` means absent.

## 0.3, August 2026

- Added the `imported-context` profile for bundles compiled from an external
  video, alongside the existing profile for hosted recordings.
- Made `.arec` the canonical extension. `.md` remains a byte-identical
  compatibility representation, and when present it should advertise the `.arec`
  URL as canonical.
- Required an explicit completeness statement, so missing capture can never be
  read as evidence that an event did not happen.
- Required evidence references to point at precomputed artifacts. A document
  must not depend on arbitrary server-side frame extraction to be useful.
- Stated the diagnostics redaction rule: no headers, bodies, cookies, tokens or
  raw query values.
- Added optional `Verification`, `Signature` and full cursor path sections.
- Documented the `motion` object on a key moment (`relation`, `target_x`,
  `target_y`, optional `target_frame_url`). The destination obeys the same
  precomputed-artifact rule as `frame_url`.

## 0.2, July 2026

- Renamed the format from OAR (Open Agent Recording) to AREC, to avoid collision
  with the existing `.oar` archive extension.
- Introduced the machine-readable identity comment with `spec_version` and
  `profile`.

## 0.1, June 2026

- First published description of a markdown document served beside a recording.
