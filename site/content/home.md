---
updated: 2026-10-31
title: AREC: open file format for agent-readable screen recordings
description: AREC (Agent Recording) is an open Markdown file format that lets AI agents read a screen recording: intent, key moments, diagnostics and transcript.
---

# AREC: the open file format for agent-readable screen recordings

AREC (Agent Recording) is an open file format that makes a screen recording
readable by an AI agent. An `.arec` file is plain Markdown. It joins what the
person in the recording asked for to timestamped evidence of what happened on
screen, so an agent such as Claude Code, Codex or Cursor can act on a recording
without decoding the video, and can trace every conclusion back to the moment
it came from.

The current version is **AREC 1.3**, a stable release. The specification,
schema and test fixtures are in the public domain (CC0 1.0), and the reference
validator is MIT licensed. Anyone can write or read AREC without asking.

[Read the specification](/spec) · [What is an .arec file?](/arec-file) ·
[Implementations](/implementations) · [Research](/research) ·
[Source on GitHub](https://github.com/arecformat/arec)

## Why a file format for recordings

A video shows a person what happened, but an agent has to guess. It cannot see
which button was clicked, what the person meant by "this one", or whether a
failed request was ever captured. A transcript alone loses everything that
happened on screen.

An AREC document carries both halves, in a form a language model reads
directly:

- **Intent:** the requests extracted from what the person said.
- **Key moments:** timestamped moments with pointer positions, clicks and
  highlights, linked to precomputed frames.
- **Browser diagnostics:** console errors and failed requests, which a producer
  must redact: no headers, bodies, cookies, tokens or raw query values.
- **Capture gaps:** an explicit statement of what was not recorded, so missing
  evidence is never read as proof that nothing happened.
- **Transcript:** the full spoken text, with timestamps.

## What an AREC document looks like

Every document starts with a short identity comment, then a title and
sections:

````markdown
<!-- arec
spec_version: 1.3
profile: clipy-recording
canonical_url: https://example.com/video/k3m8q2x7w9pz.arec
watch_url: https://example.com/video/k3m8q2x7w9pz
-->

# Export CSV button stuck loading

## Metadata
- Format: AREC (Agent Recording)
- Spec version: 1.3
- Access: public

## Summary
The reporter clicks Export CSV and the button never stops loading.

## Intent
- Objective: Fix Export CSV, which never completes.

## Key moments
```json
[{"t_ms":6000,"caption":"clicks Export CSV","x":0.81,"y":0.27,"source":"click"}]
```

## Capture gaps
- No known capture gaps.

## Transcript
[00:06] I click Export CSV and it just spins.
````

The [full specification](/spec#37-example-a-minimal-hosted-document) shows a
complete document, and a [worked example](/arec/examples/relay-design-review.arec)
is available to download.

## Reading and checking AREC

Readers are lenient by design. A conformant reader never rejects a document for
its version or for content it does not recognize; it reads what it understands
and flags the rest, so any agent can read AREC today.

The reference reader and validator have no dependencies and run on Node 18 or
newer:

```sh
mkdir -p arec/validator arec/bin && cd arec
curl -fso validator/validate.mjs https://raw.githubusercontent.com/arecformat/arec/main/validator/validate.mjs
curl -fso bin/arec-validate.mjs https://raw.githubusercontent.com/arecformat/arec/main/bin/arec-validate.mjs
node bin/arec-validate.mjs ../recording.arec
```

Producers can run the same rules strictly with `--strict`, check the
machine-readable parts against the
[JSON Schema](/schema/arec-1.3.schema.json), and test themselves against the
[conformance fixtures](/arec/fixtures/index.json).

## Key facts

| | |
| --- | --- |
| Name | AREC (Agent Recording) |
| Current version | 1.3, stable |
| File extension | `.arec` |
| Media type | `text/markdown; charset=utf-8` |
| Encoding | UTF-8 Markdown (CommonMark) |
| License | Specification, schema and fixtures CC0 1.0; validator MIT |
| Source | [github.com/arecformat/arec](https://github.com/arecformat/arec) |

## Who writes and reads AREC

[Clipy](https://clipy.online) writes an AREC document for every hosted
recording, from its web recorder, Chrome extension, Mac, Windows, iPhone and
Android apps, CLI and MCP server, and for videos imported with its CLI. Any
agent that can read a URL or a Markdown file can read AREC: Claude Code, Codex,
Cursor, ChatGPT and others need nothing special.

People use it to hand bug reports and design feedback to coding agents, to
have an agent return proof of the work it verified, and to turn existing
videos into context an agent can search. [AREC implementations](/implementations)
lists the recorders, the agents and how AREC has developed.

Building a recorder, a reader or a port of the validator? Open an issue or a
pull request on [GitHub](https://github.com/arecformat/arec) to be listed.

## What the research shows

In a controlled benchmark, a coding agent given an AREC document completed a
recorded design review in 4 of 5 runs, and never once with the transcript or
the raw video. It scored 11.8 of 12 with AREC, against 5.8 with the transcript
and 2.4 with the video, and used 58% fewer input tokens than with the video. A
transcript keeps the words but loses what "this" and "that" point at; an AREC
document keeps the request and its target together. On a recording made with a
production recorder, AREC with its frames went 5 for 5.
[Read the research](/research), including how AREC compares with video files,
captions, HAR files, session replays and test traces.

## Frequently asked questions

### What does AREC stand for?

Agent Recording. The format was briefly called OAR (Open Agent Recording) and
was renamed to avoid a clash with the existing `.oar` archive extension.

### Is AREC free to use?

Yes. The specification, schema and fixtures are dedicated to the public domain
under CC0 1.0, and the validator is MIT licensed. There is no fee, no
registration and no permission to ask for, and the editor has promised not to
assert any patent against an implementation.

### Is AREC stable?

Yes. Version 1.3 is the first stable release. Within 1.x nothing a conformant
document relies on is removed or redefined; minor releases only add optional
sections, fields, profiles and values, and breaking changes are reserved for 2.0. The
[changelog](/changelog) lists every version.

### How is AREC different from a video file or a transcript?

An `.arec` file does not contain the video. It describes the recording: what
was asked, the moments that matter with links to their frames, browser
evidence, what was not captured, and the transcript. The video stays where it
is, and the agent reads the document.

### How do I open an .arec file?

With any text editor or Markdown viewer, because it is plain text. See
[What is an .arec file?](/arec-file) for details on each platform.
