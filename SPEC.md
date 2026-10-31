# AREC (Agent Recording) Specification 1.3

| Specification | AREC (Agent Recording) |
| --- | --- |
| **Version** | 1.3 (stable) |
| **Updated** | 30 October 2026 |
| **Latest version** | [arecformat.org/spec](https://arecformat.org/spec) |
| **Plain text** | [arecformat.org/spec.md](https://arecformat.org/spec.md) |
| **JSON Schema** | [arec-1.3.schema.json](https://arecformat.org/schema/arec-1.3.schema.json) |
| **Reference reader and validator** | [validate.mjs](https://arecformat.org/arec/validate.mjs) and [arec-validate.mjs](https://arecformat.org/arec/arec-validate.mjs) |
| **Conformance fixtures** | [arecformat.org/arec/fixtures](https://arecformat.org/arec/fixtures/index.json) |
| **Worked example** | [relay-design-review.arec](https://arecformat.org/arec/examples/relay-design-review.arec) |
| **Version history** | [AREC changelog](https://arecformat.org/changelog) |
| **File extension** | `.arec` |
| **Media type** | `text/markdown; charset=utf-8` |
| **License** | Public domain (CC0 1.0); validator MIT |
| **Editor** | Clipy, support@clipy.online |

## Abstract

AREC (Agent Recording) is an open, Markdown-based document format that makes a screen recording readable and actionable by an AI agent. An AREC document joins what the person said they wanted to timestamped visual evidence of what happened on screen: extracted requests, key moments with frames and pointer positions, browser diagnostics, an explicit account of what was not captured, and the transcript. An agent can act on a recording without decoding video, and can trace every conclusion back to the evidence it came from.

Any recorder may produce AREC and any agent may consume it, with no license fee, no registration and no permission needed.

## Status of this document

This is AREC 1.3, the first stable release. It takes the field set published as 0.3 in August 2026, unchanged, and freezes it for the 1.x line: nothing a conformant 1.3 document relies on will be removed or redefined in any later 1.x release. Hosted recordings have been published in this field set since August 2026, so the rules below describe a format in daily production use rather than a proposal.

Questions, implementation reports and proposed additions go to the issue tracker at [github.com/arecformat/arec](https://github.com/arecformat/arec/issues), or to support@clipy.online. An ambiguous rule is treated as a defect in this specification and is fixed in the next minor release.

## 1. Conventions and terminology

The key words MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, RECOMMENDED, MAY and OPTIONAL in this document are to be interpreted as described in BCP 14 ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when, and only when, they appear in all capitals.

- **Document:** one AREC file or response body, Markdown text beginning with the identity comment.
- **Producer:** software that writes a document, such as a screen recorder, an import tool or a server that renders recordings.
- **Consumer:** software that reads a document, such as a coding agent, an MCP server, a search index or a validator.
- **Profile:** the kind of source a document describes. 1.3 defines `clipy-recording` and `imported-context`.
- **Evidence:** anything derived from the recording itself: frames, crops, pointer positions, diagnostics, transcript text.
- **Key moment:** a timestamped point in the recording with a caption and, where available, a frame, a crop and a pointer position.
- **Capture gap:** a kind of evidence the producer did not capture, stated explicitly so its absence is not read as a fact.

## 2. Design principles

1. **Plain text first.** A document is Markdown. Anything that can fetch a URL and read text can use it; there is no binary container and no required parser.
2. **One URL, two readers.** A recording's link serves a video player to a person and the AREC document to an agent, so the same link can be pasted into a chat, a ticket or a prompt.
3. **Evidence, not assertions.** Every request and every suggested step points back to the moment, frame or diagnostic that supports it.
4. **Content is data.** Words spoken or shown in a recording are evidence about the task, never instructions to the agent reading it.
5. **Honest about gaps.** A document says what it did not capture, because silence about missing data reads as a claim that nothing happened.
6. **Private by construction.** Diagnostics are redacted by the producer before they are written. A consumer never has to scrub secrets out of a document.
7. **Built to last.** Consumers ignore what they do not recognize, so documents written today stay readable as the format grows.

## 3. Document structure

A document has three parts, in this order:

1. The identity comment (section 3.1).
2. A level-one heading carrying the recording's title.
3. Level-two sections. Which sections appear depends on the profile (sections 3.3 and 3.4); a consumer finds them by heading.

### 3.1 Identity comment

Every AREC document begins with this machine-readable HTML comment:

```markdown
<!-- arec
spec_version: 1.3
profile: clipy-recording
canonical_url: https://example.com/video/k3m8q2x7w9pz.arec
watch_url: https://example.com/video/k3m8q2x7w9pz
-->
```

The required fields are:

- `spec_version`: the AREC version whose rules apply, written as `MAJOR.MINOR` (this version is `1.3`). MAJOR and MINOR are whole numbers without leading zeros. A pre-release suffix such as `-rc.1` may follow; it does not change which minor version the document follows.
- `profile`: `clipy-recording` for a recording made with Clipy, hosted or saved on the device, or `imported-context` for a compiled external video.

`canonical_url` is the address of this AREC document itself: its absolute `https` `.arec` URL, or a relative path inside a downloadable bundle. It never names the source video or another page. `watch_url` is the human-facing page for the same recording. Both are required when the document has public URLs. A local or imported bundle MAY omit them and identify its source, such as the original video's URL, in Metadata instead. Field names are fixed; producers MAY add further fields, and consumers MUST ignore fields they do not recognize.

### 3.2 Rules for every profile

Every conformant AREC document MUST:

1. Start with the AREC identity comment.
2. Include Metadata with source or watch identity, duration when known, profile, provenance, processing or completeness state, and compiler information when compiled.
3. Include a Transcript section or explicitly state why no transcript exists or is not ready.
4. Include Capture gaps, Incomplete, or equivalent completeness language whenever missing capture could otherwise be mistaken for evidence that an event did not happen.
5. Keep evidence references stable. Frame and crop URLs MUST point at precomputed artifacts; a document MUST NOT require arbitrary server-side frame extraction to be useful.
6. Remain forward-compatible. Consumers MUST ignore unknown sections and continue reading recognized sections.

Section order may vary by profile. Prose and headings may be localized or expanded as long as their meaning is preserved, and consumers match sections by meaning rather than exact heading text.

### 3.3 The clipy-recording profile

A hosted recording SHOULD contain these sections when the underlying artifact exists:

- **Metadata:** canonical AREC URL, human watch URL, created date, duration, access mode, processing state, recording type, and captured app or window identity.
- **Intent:** the classified recording type and objective.
- **Summary:** the short orientation and key points.
- **Requested changes, Fix checklist, or Action items:** the specific requests extracted from narration.
- **Suggested implementation plan:** deterministic steps derived from the extracted requests, labeled as a suggestion that the consumer MUST check against the evidence before acting on it.
- **Key moments:** timestamped JSON plus readable sections with frame URL, optional crop URL, pointer coordinates, evidence source, confidence, and an optional `motion` destination object.
- **Browser diagnostics:** the capture policy, environment, visited routes, warnings and errors, failed request metadata, dropped-event count, and page-reported attestation. Headers, bodies, cookies, tokens, and raw query values MUST NOT be present.
- **Capture gaps:** explicit missing cursor, diagnostics, app/window identity, key moments, or transcript data.
- **Transcript:** timestamped speech-to-text or labeled agent narration.

Pointer evidence uses frame-relative coordinates from 0 to 1. `click` and `fused` mean a recorded click; `hover` means the pointer rested without clicking; `draw` and `flare` mean the user deliberately marked or spotlighted a location; `motion` marks a move gesture; `deixis` means the moment comes from a spoken reference to something on screen ("this button") with no pointer event; `narration` marks agent narration. Missing telemetry is a capture gap, not proof that no click occurred. A field that is absent or `null` means the value was not captured. Consumers MUST ignore a `source` value they do not recognize rather than reject the moment.

A moment MAY carry a `motion` object when the pointer deliberately moved something from one place to another. It holds `relation` (for example `move`), the destination as `target_x` and `target_y` in the same frame-relative units, and an optional `target_frame_url`. The destination is evidence like any other, so `target_frame_url` obeys the same precomputed-artifact rule as `frame_url`.

### 3.4 The imported-context profile

An imported external video is a context bundle rather than a Clipy-hosted recording. Its canonical files are:

- `recording.arec`: the agent-facing document.
- `recording.md`: a byte-identical compatibility copy.
- `manifest.json`: version, source, provenance, hashes, classification, completeness, and frame metadata.
- `transcript.json`: raw timestamped transcript segments.
- `frames/`: selected visual evidence when the classifier determines the transcript is insufficient.

The AREC document includes Metadata, how to use the bundle, visual gaps, frames when available, and the transcript. It MUST distinguish transcript-only by design from missing visual evidence caused by a failed or incomplete import.

### 3.5 `.md` compatibility and JSON

`.arec` is canonical. A hosted implementation MAY keep `/video/<id>.md` as a compatibility URL, and a local bundle MAY include `recording.md`. When provided, the `.md` representation MUST be byte-identical to the `.arec` Markdown body and SHOULD advertise the `.arec` URL as canonical. Consumers should generate and share `.arec` links; older `.md` links remain readable.

JSON is a separate structured representation, not an AREC filename. Endpoints such as `/video/<id>.json` may expose the same evidence as typed JSON and should include the canonical `.arec` URL.

### 3.6 Optional extensions

The following sections are optional in 1.3:

- **Verification:** agent read receipts, linked proof recordings, assertions, and verification outcomes.
- **Signature:** a cryptographic signature over the document and referenced artifact hashes.
- **Full cursor path:** bounded timestamped movement samples beyond key-moment anchors.

An absent optional section makes no claim about whether that activity occurred outside the recording.

### 3.7 Example: a minimal hosted document

````markdown
<!-- arec
spec_version: 1.3
profile: clipy-recording
canonical_url: https://example.com/video/k3m8q2x7w9pz.arec
watch_url: https://example.com/video/k3m8q2x7w9pz
-->

# Export CSV button stuck loading

## Summary
Export CSV spins forever; the export request returns a 500.

## Metadata
- Format: AREC (Agent Recording)
- Spec version: 1.3
- Duration: 00:41
- Access: public
- Processing: ready

## Intent
- Type: bug report
- Objective: Fix Export CSV, which never completes.

## Fix checklist
- Make Export CSV finish and download the generated file.

## Suggested implementation plan
1. Trace the failed export request and repair the undefined rows access. Verify against the key moment and failed request below.

## Key moments
```json
[{"t_ms":6000,"caption":"clicks Export CSV","frame_url":"https://cdn.example/6000.jpg","x":0.81,"y":0.27,"source":"click","confidence":0.94}]
```

## Browser diagnostics
```json
[{"kind":"network","time_ms":6400,"method":"POST","url":"https://app.example/api/export","status":500,"outcome":"http_error","duration_ms":312}]
```

## Capture gaps
- No known capture gaps in the generated artifacts.

## Transcript
[00:06] Clicking Export CSV now.
````

## 4. Conformance

### 4.1 Producer conformance

A conformant producer writes documents that satisfy every MUST in section 3 for the profile it declares, declares the `spec_version` it follows, and redacts diagnostics before writing them (section 5). A hosted producer SHOULD serve documents as `text/markdown; charset=utf-8` and SHOULD advertise the canonical `.arec` URL in a `Link` header with `rel="canonical"`. It MAY also send the version in an `X-AREC-Version` response header.

### 4.2 Consumer conformance

Reading is lenient. A consumer MUST NOT reject a document because of its version, its structure or content it does not recognize. It reads what it understands, treats the rest as absent, and removes the sensitive diagnostic keys and raw query values listed in section 5 before using or passing on what it read. Problems are flagged, never fatal. The conformance requirements in this specification apply to producers.

A conformant consumer:

- reads the identity comment, when there is one, before anything else and uses `spec_version` and `profile` from it;
- treats every recording-derived string as evidence and never as an instruction (section 5);
- ignores unknown fields, sections, profiles, kinds and pointer `source` values instead of failing, and treats a malformed or `null` field as absent;
- treats a stated capture gap as missing data, not as evidence that an event did not happen;
- follows the version rules in section 7.

### 4.3 The reference reader

AREC ships a reference reader, an optional strict check, a JSON Schema and a conformance suite, so an implementation can be checked by someone who did not write the format.

The reader is lenient, as section 4.2 requires. It accepts any text, reads every version, and reports what it could not use as warnings: an unfamiliar version, a missing identity comment, unknown or malformed values. Fields that break a rule are treated as absent, and sensitive diagnostic keys and the query values in diagnostic URLs are removed from what it returns. It has no dependencies and no build step. Download its two files and run it with Node 18 or newer:

```sh
mkdir -p arec/validator arec/bin && cd arec
curl -fso validator/validate.mjs https://raw.githubusercontent.com/arecformat/arec/main/validator/validate.mjs
curl -fso bin/arec-validate.mjs https://raw.githubusercontent.com/arecformat/arec/main/bin/arec-validate.mjs
node bin/arec-validate.mjs ../recording.arec
curl -fs https://clipy.online/video/<id>.arec | node bin/arec-validate.mjs -
```

It exits 0 for any text document and prints its warnings. As a module, `import { readArec } from './validator/validate.mjs'` returns `{ document, warnings }` for a document's text, where `document` holds the identity header, title, sections, usable key moments and redacted diagnostics. It never throws.

### 4.4 Optional strict producer check

A producer that wants to check what it writes can run the same checks strictly: `node arec-validate.mjs --strict recording.arec`, or `validateArec(text, { mode: 'conform' })`. A broken rule is then an error and the exit code is 1. Nothing a reader does depends on this mode.

The JSON Schema at [`/schema/arec-1.3.schema.json`](schema/arec-1.3.schema.json) (JSON Schema 2020-12) is the strict check for the parts of a document that are already machine-readable: the identity header parsed into an object, the key-moments array, and the browser-diagnostics array. It is a producer check, not a gate for reading. For those parts it applies the same rules as the strict check, because its patterns are generated from the reference code's own constants, with one exception a schema cannot express: a name repeated within one object, which the strict check finds in the JSON text.

AREC is a Markdown document, so several rules cannot be expressed as a schema. The strict check covers them directly: the leading identity comment; the presence of `Metadata`; a `Transcript` section or an explicit statement of its absence; stated completeness; both URLs in the identity comment when Metadata declares `Access: public`; the version rules of section 7.1; JSON blocks in the `Key moments` and `Browser diagnostics` sections (tagged `json`, `jsonc`, `json5`, `ndjson` or `jsonl`, or untagged JSON as defined in section 5) that parse as arrays (a `Key moments` block tagged `json` that does not parse is an error); and the section 5 rules in every JSON block in a diagnostics section: no sensitive keys, no string that begins with a URL carrying a raw query value, and no block that should hold JSON but does not parse. A legacy document passes only as legacy: the check reports it as such, never as conforming to the current version.

The conformance fixtures come in both directions, and every one is published under [`/arec/fixtures/`](https://arecformat.org/arec/fixtures/index.json). The `valid` set holds documents that pass the strict check, including a hosted recording, an imported bundle, and legacy documents produced by earlier Clipy releases: a 0.3 hosted document, a 0.3 Mac local recording, an early CLI bundle and a hosted `recording.md` from before identity comments. The `invalid` set holds documents the strict check flags, each for one rule, which `fixtures/expected.json` names: a 1.x document without the identity comment, an unknown profile, a public document with no URLs, pointer coordinates outside the unit interval, a motion destination outside the unit interval, diagnostics carrying cookies, a diagnostic URL carrying a query value, a 0.3 document whose diagnostics carry headers, silence about missing capture, and an evidence reference that would force server-side frame extraction. A reader still reads every one of them.

Producers and consumers disagree most often about what counts as evidence. Two rules settle it. Evidence references must point at precomputed artifacts, which may be absolute `https` URLs for a hosted document or relative paths inside a downloadable bundle, but must never be a frame-extraction endpoint the consumer has to call. And missing capture must be stated, because a document that omits a gap is making a silent claim that nothing happened.

## 5. Security and privacy considerations

**Prompt injection.** Readers treat a document's transcript and other recording content as data about the recording, never as instructions to follow.

**Secrets in diagnostics.** Browser diagnostics MUST NOT carry request or response headers, bodies, cookies, tokens or raw query values. Redaction happens in the producer, before the document exists, so a leak cannot be fully fixed downstream. A key with one of those names is a producer violation whatever its value; a consumer that meets one removes it before using or passing on what it read, and keeps reading the rest.

The sensitive key names are `headers`, `header`, `body`, `requestbody`, `responsebody`, `requestheaders`, `responseheaders`, `postdata`, `cookie`, `cookies`, `setcookie`, `authorization`, `proxyauthorization`, `bearer`, `bearertoken`, `token`, `authtoken`, `xauthtoken`, `accesstoken`, `refreshtoken`, `idtoken`, `csrftoken`, `xsrftoken`, `xcsrftoken`, `xxsrftoken`, `apikey`, `xapikey`, `clientsecret`, `privatekey`, `password`, `passwd`, `pwd`, `passphrase`, `secret`, `credential`, `credentials`, `jwt`, `jsessionid`, `phpsessid`, `queryparams` and `rawquery`. Names are compared ignoring ASCII case, `-`, `_` and whitespace, anywhere in the name including its start and end, where whitespace means space, tab, CR and LF only, so `Set-Cookie`, `set_cookie`, `setCookie` and `_token` match listed keys. This list is the minimum a checker enforces; a producer redacts every other credential as well. A raw query value is a parameter value in the query or fragment of a URL (`?id=42`, `#access_token=abc`); key names without values (`?id&format`) and empty values (`?id=`) are allowed. Object names are checked like string values, and a name MUST NOT appear twice in one object of a diagnostics block, because a value hidden behind a repeated name would go unchecked.

These rules cover every JSON block in a diagnostics section. Only `#` headings make sections. A heading with two or more `#` opens a section that runs until the next heading with the same number of `#` or fewer. A level-one heading closes every open section, and opens one only when its whole text is `Diagnostics` or `Browser diagnostics` (in ASCII case, with one space), so a recording title other than exactly one of those never turns the whole document into a diagnostics section. A heading's text is the text after its `#` marks with leading and trailing spaces and tabs, and any closing `#` sequence, removed. Lines end at LF; a CRLF or a lone CR is read as LF. A diagnostics section is one whose heading contains the word `diagnostic` or `diagnostics`, in ASCII case, with no ASCII letter, ASCII digit, `_` or `-` directly before it and no ASCII letter, ASCII digit or `_` directly after it; a block is in it when that section, or a section it contains, is open where the block starts.

A block's tag is the first word of its fence info string, compared in ASCII case. Around the info string, the whitespace ECMAScript's `trim` removes is ignored: tab, vertical tab, form feed, space, no-break space, U+FEFF, the other Unicode space separators, LF, CR, U+2028 and U+2029 (not U+0085). From the first word, an optional `{`, then an optional `.`, and an optional trailing `}` are removed (```` ```{.json} ````). A closing fence is followed only by spaces or tabs; anything else after it, a no-break space included, leaves the block open, as in CommonMark. A block in a diagnostics section MUST hold strict JSON (no comments, no trailing commas) when it is tagged `json`, `jsonc` or `json5`; one strict JSON value per line, ignoring lines of only spaces, tabs and CRs, when it is tagged `ndjson` or `jsonl`; and when it is untagged and its first character other than space, tab, CR or LF is `{`, or is `[` on a line that is not a log line. A log line is a `[`, then characters other than `[`, `]`, `{`, `}`, `"`, CR and LF, then `]`, then optional spaces or tabs, then a character other than space, tab, CR, LF, `,`, `]` or `}` (`[HMR] connected`). Otherwise the block cannot be checked, so it fails; content that is not JSON is tagged `text`.

The strict check and the schema flag a string that begins, after optional space, tab, CR or LF, with a URL carrying a raw query value: the URL starts with a scheme and `://`, or with `/`, and ends at the first space, tab, CR or LF. A URL later in free text, such as a console message or a `text` block, is the producer's to redact; the reference reader also removes the parameter values of every URL it finds in a diagnostics section, in JSON strings and in text.

**Access control.** An AREC document has the same audience as the recording it describes. A producer MUST apply the recording's access rules (public, restricted or private) to the document as well, and SHOULD apply changes to them immediately rather than after a cache expires.

**Evidence integrity.** Evidence references point at precomputed artifacts, so a consumer never asks a server to render arbitrary frames on demand, which would otherwise be a cost and denial-of-service surface. The optional Signature extension lets a producer sign the document and the hashes of the artifacts it references.

**Personal data.** Recordings can show faces, names and screens. A document SHOULD reference frames rather than embed them, so revoking access to the recording revokes access to the frames.

## 6. Media type, encoding and file names

- A document is UTF-8 Markdown and is served as `text/markdown; charset=utf-8` ([RFC 7763](https://www.rfc-editor.org/rfc/rfc7763)). No new media type is needed: the identity comment, not the transport, says that the Markdown is AREC.
- The canonical file name in a bundle is `recording.arec`. A hosted document's canonical URL is the recording's watch URL with `.arec` appended.
- Timestamps in prose use `MM:SS` or `H:MM:SS` from the start of the recording; structured fields use milliseconds (`t_ms`, `time_ms`).
- Pointer coordinates are frame-relative, from 0 to 1, with the origin at the top left of the frame.
- Headings and prose MAY be written in any language. Field names in the identity comment and in JSON blocks are always the English names defined here.

## 7. Versioning and stability

`spec_version` is `MAJOR.MINOR`. Version 1.3 is the first stable release: it takes the field set published as 0.3, unchanged, and freezes it. The minor number carries over from 0.3 so that the version a document declares lines up with the field set it uses.

Within the 1.x line these promises hold:

- **Nothing breaks.** The identity fields, the profiles, the required sections and the conformance rules in this document stay valid for every 1.x release. A document that conforms to 1.3 conforms to every later 1.x.
- **Additions only.** A minor release MAY add optional sections, optional fields, profiles or pointer `source` values. It MUST NOT remove or redefine anything a 1.3 document relies on.
- **Breaking changes need 2.0.** A change that would make a conformant 1.x document non-conformant, or change the meaning of an existing field, is reserved for a new major version, announced in the [changelog](https://arecformat.org/changelog) before it ships.

Consumers MUST read any document whose `spec_version` has major version 1, including minor versions newer than they know. A consumer that meets an unfamiliar major version reads it on a best-effort basis, using the sections it recognizes, and flags the version; it does not refuse the document. Producers SHOULD declare the version they actually follow.

### 7.1 Backward compatibility guarantee

A document written by an older producer never stops being readable because a newer version exists.

- **Readers accept every earlier version.** A reader MUST NOT reject a document for its version, structure or unknown content. A conforming 1.x reader MUST accept every earlier published version: every 0.x document (`0.1`, `0.2`, `0.3`), with or without a pre-release suffix, every 1.x document, and a document written before identity comments existed, which has no identity comment at all. It treats content it does not find, or does not recognize, as absent, never as an error.
- **Rules apply to the version that introduced them.** A requirement added in 1.x, such as the profile values or a required field, applies only to documents declaring 1.x, and only to producers. Even the optional strict check (section 4.4) reports what a legacy document misses as warnings, never errors. The one exception is content section 5 forbids (sensitive diagnostic keys, raw query values in diagnostics, and evidence that needs on-demand frame extraction): a producer must never write it, so the strict check flags it as an error in a document of any version.
- **Producers only add within a major version.** A 1.x release MAY add optional sections, fields, profiles and values; it never removes or redefines one.
- **Breaking changes need a new major version, and readers keep the old ones.** A reader for a later major version MUST keep accepting documents of every earlier major version.


| Version | Published | Status |
| --- | --- | --- |
| 1.3 | October 2026 | Current, stable |
| 0.3 | August 2026 | Superseded by 1.3; documents stay readable (section 7.1) |
| 0.2 | July 2026 | Superseded; documents stay readable (section 7.1) |
| 0.1 | June 2026 | Superseded; documents stay readable (section 7.1) |

The format was briefly published as OAR (Open Agent Recording) before being renamed to avoid a collision with the existing `.oar` archive extension. This page always shows the current version; the [changelog](https://arecformat.org/changelog) records every change and the additions being considered for 1.4.

## 8. Implementations

- **Clipy** produces the `clipy-recording` profile for every hosted recording, whichever app made it: the web recorder, the Chrome extension, the Mac and Windows apps, the iPhone and Android apps, the CLI and the MCP server. Each one is served at the recording's watch URL with `.arec` appended.
- **The Clipy CLI** (`clipy context import`) produces the `imported-context` profile from a YouTube link, a Loom link or a local video file.
- **The reference reader** reads any AREC text leniently (section 4.3); its optional strict mode checks what a producer writes (section 4.4).
- **Consumers** need nothing special. Claude Code, Codex, Cursor, ChatGPT and any other agent that can fetch a URL can read an AREC document as Markdown; Clipy's hosted MCP server and CLI also hand AREC to agents directly.

Building a producer or consumer? Run it against the reference reader, the optional strict check and the fixtures, then open an issue or pull request at [github.com/arecformat/arec](https://github.com/arecformat/arec), or write to support@clipy.online, to be listed here.

## 9. License

AREC is free for anyone to implement, extend, translate, copy, sell or build on, for any purpose, with no permission and no attribution required.

- **Specification, schema and fixtures:** dedicated to the public domain under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). To the extent possible under law, Clipy has waived all copyright and related rights in them.
- **Reference validator:** released under the [MIT License](https://opensource.org/license/mit).
- **Patents:** Clipy will not assert any patent claim against anyone for making, using, selling or distributing an implementation of AREC.
- **The name:** anyone may say their software reads or writes AREC. A reader is conformant when it reads leniently as section 4.2 describes; to call a producer conformant, its documents should pass the strict check and the fixtures for the version it claims.

The Clipy name and logo are Clipy's trademarks and are not covered by these grants.

## 10. How to cite

> AREC (Agent Recording) Specification, version 1.3. Clipy, 15 October 2026. https://arecformat.org/spec

Cite the version you implement. The changelog lists every version and what changed in it.

## 11. References

**Normative**

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174): key words for requirement levels (BCP 14).
- [RFC 7763](https://www.rfc-editor.org/rfc/rfc7763): the `text/markdown` media type.
- [CommonMark](https://spec.commonmark.org/): the Markdown syntax a document is written in.
- [JSON Schema 2020-12](https://json-schema.org/specification): the schema language of the AREC schema.
- [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986): URI syntax for `canonical_url`, `watch_url` and evidence references.

**Informative**

- [What is an agent-readable recording?](https://clipy.online/learn/agent-readable-recording)
- [Anatomy of an AREC document](https://clipy.online/learn/markdown-twin-anatomy), an annotated walkthrough.
- [How to give your agent video context](https://clipy.online/learn/give-agents-video-context)
- [Agent context formats compared](https://clipy.online/learn/agent-context-formats-compared)
