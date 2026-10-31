# AREC (Agent Recording)

AREC is an open, Markdown-based format for making a screen recording readable
and actionable by an AI agent. Any recorder may emit it and any agent may
consume it.

The bytes are Markdown and the media type is `text/markdown`. The `.arec`
extension identifies the semantics, not a proprietary binary container. A
conformant document joins narrated intent to timestamped visual evidence, so an
agent can understand a request without decoding video and can trace every
conclusion back to the evidence it came from.

- Specification: https://clipy.online/spec (plain text: https://clipy.online/spec.md)
- Current version: 1.3 (stable)
- Machine-readable schema: [`schema/arec-1.3.schema.json`](schema/arec-1.3.schema.json)
- License: specification, schema and fixtures in the public domain (CC0 1.0);
  validator under the MIT License. See [LICENSE.md](LICENSE.md).

## Reading is lenient

A reader never refuses an AREC document because of its version, its structure
or content it does not recognize. It reads what it understands, treats the rest
as absent and flags it, and removes sensitive diagnostic keys (headers, bodies,
cookies, tokens) and the query values in diagnostic URLs before using or passing
on what it read. The conformance rules apply to producers.

## Read a document

No install and no dependencies. Node 18 or newer.

Without cloning anything, fetch the two files from this repository:

```sh
mkdir -p arec/validator arec/bin && cd arec
curl -fso validator/validate.mjs https://raw.githubusercontent.com/arecformat/arec/main/validator/validate.mjs
curl -fso bin/arec-validate.mjs https://raw.githubusercontent.com/arecformat/arec/main/bin/arec-validate.mjs
node bin/arec-validate.mjs ../recording.arec
```

From a clone of this repository:

```sh
node bin/arec-validate.mjs recording.arec
node bin/arec-validate.mjs --json fixtures/valid/*.arec
curl -fs https://clipy.online/video/<id>.arec | node bin/arec-validate.mjs -
```

By default it reads leniently: it exits 0 for any text document and prints
warnings, including a note for each sensitive key it would remove. As a module,
`readArec(text)` returns `{ document, warnings }` and never throws; `document`
holds the identity header, title, sections, usable key moments and redacted
diagnostics, plus the Markdown with sensitive diagnostic keys and diagnostic
query values removed.

```js
import { readArec } from './validator/validate.mjs';
const { document, warnings } = readArec(text);
```

## Optional strict producer check

A producer that wants to check what it writes can run the same rules strictly.
A broken rule is then an error and the exit code is 1. Nothing a reader does
depends on this mode.

```sh
node bin/arec-validate.mjs --strict recording.arec
```

```js
import { validateArec } from './validator/validate.mjs';
const { ok, errors, warnings } = validateArec(text, { mode: 'conform' });
```

`schema/arec-1.3.schema.json` is the same strict check for the parts of a
document that are already machine-readable: the identity header parsed into an
object, the key-moments array and the browser-diagnostics array. It is a
producer check, not a gate for reading; its patterns are generated from
`validator/validate.mjs`, so the two apply the same rules, except that only the
strict check can see a name repeated within one object.

AREC is a Markdown document, so several rules cannot be expressed as a schema.
The strict check covers them directly:

- the document begins with the `<!-- arec ... -->` identity comment
- `Metadata` is present
- a `Transcript` section exists, or the document states why none does
- completeness is stated, so missing capture is never mistaken for evidence that
  an event did not happen
- evidence references point at precomputed artifacts rather than a server-side
  frame-extraction endpoint
- diagnostics carry no headers, bodies, cookies, tokens or raw query values,
  checked in every JSON block in a diagnostics section, including its
  sub-sections; a block there that should hold JSON but does not parse fails
  (tag content that is not JSON as `text`). Specification section 5 defines
  the sections and blocks exactly.

The last two are the security rules of specification section 5, so they are
errors in a document of any version. Everything else a legacy document (any
0.x version, or no identity comment) misses is a warning, and the strict check
reports such a document as `LEGACY`, never as conforming to the current
version.

Key names are compared ignoring case, `-`, `_` and whitespace (`setCookie` is
`set-cookie`); the list in specification section 5 is the minimum. A raw query
value is a parameter value in a URL's query or fragment (`?id=42`,
`#access_token=abc`), and the rule applies to strings that begin with a URL.
A URL later in free text, such as a console message or a `text` block, is the
producer's to redact; the reader also strips parameter values from every URL it
finds in a diagnostics section, including headings. It treats any word holding a
`/` followed by `?` or `#` as a URL, so text such as `3/4?k=1` is shortened to
`3/4?k` in what it returns.

Unknown sections are ignored in both modes. Forward compatibility is a
requirement of the format.

## Conformance fixtures

`fixtures/valid/` holds documents that pass the strict check, including legacy
documents in the shape earlier Clipy releases wrote them (with identifiers
replaced by example values), which every 1.x reader must accept: `legacy-0.3.arec` (a 0.3 hosted document), `legacy-0.3-mac-local.arec`
(a Mac app local recording, rendered by the 0.3-era desktop code, which wrote
no identity comment),
`legacy-0.2-cli-import.arec` (a `clipy context import` bundle, rendered by the
July 2026 CLI, which wrote no identity comment) and
`legacy-hosted-recording-md.arec` (a hosted `recording.md` rendered by the web
app before identity comments existed). `fixtures/invalid/` holds documents
the strict check flags. Each breaks one rule, and `fixtures/expected.json` names
the text every error for that file contains, so a port can check it rejects
each fixture for the right reason. A reader still reads every one of them:

| Fixture | Violates |
| --- | --- |
| `missing-identity-comment.arec` | a 1.x document must begin with the identity comment |
| `unknown-profile.arec` | `profile` must be a known value |
| `public-without-urls.arec` | a public document must carry both URLs |
| `pointer-out-of-range.arec` | pointer coordinates are frame-relative, 0 to 1 |
| `diagnostics-leak-cookies.arec` | diagnostics must be redacted |
| `diagnostics-raw-query-value.arec` | diagnostic URLs keep query keys, never values |
| `legacy-diagnostics-leak.arec` | redaction applies to legacy (0.x) documents too |
| `silent-about-missing-capture.arec` | completeness must be stated |
| `dynamic-frame-extraction.arec` | evidence must be precomputed |
| `motion-target-out-of-range.arec` | motion destinations are frame-relative, 0 to 1 |

Run the whole suite:

```sh
node bin/arec-validate.mjs fixtures/*/*.arec                 # reads all: exit 0
node bin/arec-validate.mjs --strict fixtures/valid/*.arec    # strict: exit 0
node bin/arec-validate.mjs --strict fixtures/invalid/*.arec  # strict: exit 1
```

## Profiles

`clipy-recording` is a hosted recording. `imported-context` is a bundle compiled
from an external video, where the canonical files are `recording.arec`, a
byte-identical `recording.md` compatibility copy, `manifest.json`,
`transcript.json` and an optional `frames/` directory.

## Versioning

`spec_version` is `MAJOR.MINOR`. 1.3 is the first stable release: the 0.3 field
set, frozen. Within 1.x, minor releases only add optional sections, fields,
profiles or pointer `source` values; anything that would break a conformant
document waits for 2.0. See [CHANGELOG.md](CHANGELOG.md).

### Backward compatibility guarantee

A document written by an older producer never stops being readable because a
newer version exists.

- A conforming 1.x reader MUST accept every earlier published version: every
  0.x document (`0.1`, `0.2`, `0.3`), with or without a pre-release suffix,
  every 1.x document, and a document with no identity comment,
  written before identity comments existed. Content it does not find or does
  not recognize is absent, never an error.
- A reader MUST NOT reject a document for its version, structure or unknown
  content.
- A requirement added in 1.x applies only to documents declaring 1.x, and only
  to producers. Even the optional strict check reports what a legacy document
  misses as warnings, except content the security rules of section 5 forbid,
  which is an error in a document of any version.
- Producers only add within a major version.
- A breaking change needs a new major version, and readers for it keep
  accepting every earlier major version.

A newer major version (2.x and up) is read on a best-effort basis and flagged.
The optional strict check reports it as an error, because it cannot check
rules it does not know.

## Implementations

- [Clipy](https://clipy.online) writes AREC for every hosted recording
  (`https://clipy.online/video/<id>.arec`), for recordings processed on the Mac
  by Local AI (`recording.arec` on disk), and for videos imported with
  `clipy context import`. Its MCP server and CLI read it.

Add yours with a pull request.

## Website

[arecformat.org](https://arecformat.org) is built from `site/` in this
repository: the overview, the specification, the changelog and the files
implementers download. To preview it, run `npm ci && npm run build` in `site/`
(Node 18 or newer), then `npx wrangler pages dev dist` (Node 22 or newer). See [site/README.md](site/README.md).

## Contributing

The format is meant to be implemented by people who did not write it. If a rule
is ambiguous, that is a defect in the specification. See
[CONTRIBUTING.md](CONTRIBUTING.md), and [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md)
for places to start. Add `*.arec linguist-language=Markdown` to `.gitattributes`
and GitHub highlights `.arec` files as Markdown, as this repository does.

## Feedback

Open an issue, or write to support@clipy.online. Security reports go to
security@clipy.online ([SECURITY.md](SECURITY.md)).
