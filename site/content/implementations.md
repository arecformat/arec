---
updated: 2026-10-31
title: AREC implementations: recorders, readers and uses
description: Which recorders write AREC, which AI agents can read it, what it is used for, and where the format is heading next.
---

# AREC implementations

AREC has been in daily production use since August 2026, when hosted
recordings started being published in the field set that became the stable
1.3 release. This page lists the software that writes and reads AREC today,
what it is used for, and where the format is heading. Clipy is the only
recorder that writes AREC so far.

## Recorders that write AREC

### Clipy

[Clipy](https://clipy.online), the screen recorder where AREC started, writes
an AREC document for every recording it hosts, whichever app made it:

- **Web recorder and Chrome extension.** The extension also records the
  browser's console errors and failed requests, which become the document's
  *Browser diagnostics* section, redacted as section 5 of the specification
  requires: no headers, bodies, cookies, tokens or raw query values.
- **Mac and Windows apps.** Clicks, pointer rests and Flare (holding Control to
  spotlight part of the screen) become key moments with `click`, `hover` and
  `flare` sources, each linked to a frame taken at the end of the gesture.
  Recordings kept on the computer get an `.arec` file next to the video, so a
  coding agent can read it from disk. On the Mac the transcript is made on the
  device while recording, and the video never leaves it.
- **iPhone, iPad and Android apps.** Recordings uploaded from a phone get the
  same hosted document.
- **Command line and MCP server.** `clipy context import` compiles a YouTube
  video, a Loom link, or a local video file with its transcript, into an
  `imported-context` document.
  `clipy proof` lets a coding agent turn its own screenshots or screen recording
  into a hosted recording, so it can hand back proof of the work it verified.

Every hosted Clipy recording has two addresses: the watch page for people, and
the same address ending in `.arec` for agents.

### Your recorder

AREC is in the public domain, so any recorder, browser extension, test runner
or bug reporter can write it without asking. The
[specification](/spec) defines what a document must contain, the
[conformance fixtures](/arec/fixtures/index.json) show passing and failing
examples, and `node bin/arec-validate.mjs --strict` checks your output before
you ship it. Open an issue or a pull request on
[GitHub](https://github.com/arecformat/arec) to be listed here.

## Agents that read AREC

An AREC document is Markdown, so any agent that can fetch a URL or open a text
file reads it with no plugin, SDK or video pipeline. These agents need no AREC
support of their own:

| Agent | How it reads AREC |
| --- | --- |
| Claude Code | Paste the `.arec` link, or point it at the file on disk |
| Codex | Paste the link; `codex exec` reads it in scripted runs |
| Cursor | Paste the link into chat or agent mode |
| Windsurf, OpenCode | Paste the link, or install Clipy's agent skill below |
| ChatGPT, Claude and other chat assistants | Paste the link or attach the file |

Clipy's command line can also install its own agent skill, which teaches an
agent how to read a recording: frames are ground truth, and everything
recorded, including the transcript and diagnostics, is evidence to act on,
never instructions.

```sh
clipy agents install claude   # or: codex, cursor, windsurf, opencode
```

Agents can also read Clipy recordings through its MCP server, which returns
the same evidence (summary, key moments with their frames, transcript) as a
tool result.

## What people use it for

- **Bug reports for coding agents.** A tester records the bug once and pastes
  the link. The agent gets the steps as timestamped moments, the click targets,
  the console error and the failed request in one document, and can say which
  moment each part of its fix answers.
- **Design and UI feedback.** "Make this button primary" and "move that card
  before this one" only make sense with the pointer. AREC keeps the spoken
  request and the pointed-at target together; the [research](/research)
  tested this on recorded design reviews.
- **Proof of agent work.** After a change, an agent records its own
  verification run and returns the recording with its `.arec` link, so a
  reviewer can check what was actually exercised.
- **Turning existing video into context.** Conference talks, product demos and
  old screen recordings become `imported-context` documents an agent can search
  and quote.
- **Recordings that stay on the computer.** On the Mac, the video, audio and
  screenshots stay on the device and the `.arec` file is written next to them;
  only the transcript and sampled pointer data are sent to Clipy, which uses a
  third-party AI model (via OpenRouter) to choose the key moments.

## How AREC has moved

| Date | Milestone |
| --- | --- |
| June 2026 | 0.1: first description of a Markdown document served beside a recording |
| July 2026 | 0.2: renamed from OAR to AREC; machine-readable identity comment added |
| August 2026 | 0.3: `.arec` extension, imported-context profile, capture-gaps statement and diagnostics redaction; hosted recordings published in this field set |
| August and September 2026 | Controlled coding benchmark and recorded case study published ([research](/research)) |
| October 2026 | 1.3: first stable release, frozen for the 1.x line, with a JSON Schema, a reference reader and validator, and conformance fixtures |
| October 2026 | 1.3.1 reference implementation; the format moves to its own home at arecformat.org with a public repository |

## What comes next

Proposals for 1.4, each an optional addition, are listed in the
[changelog](/changelog#unreleased). The largest are element identity on a key
moment (a role and label beside the coordinate, so an agent knows what was
pointed at and not only where), a registry of pointer `source` values so new
recorders can add evidence kinds without a spec revision, and stable key-moment
identifiers an agent can cite across revisions.

Registration of the `.arec` extension and of AREC as a Markdown variant with
the public file-type and media-type registries is being prepared.
