---
updated: 2026-10-31
title: What is an .arec file and how do I open it?
description: An .arec file is an AREC (Agent Recording) document: plain Markdown describing a screen recording for AI agents. Open it in any text editor.
---

# What is an .arec file?

A file ending in `.arec` is an **AREC (Agent Recording)** document. It is a
plain text Markdown file that describes a screen recording so an AI agent can
act on it: what the person asked for, the key moments with links to their
frames, browser diagnostics, anything that was not captured, and the
transcript. It does not contain the video itself.

AREC is an open format, published at [arecformat.org](/) and documented in the
[specification](/spec). Screen recorders write `.arec` files; coding agents and
other tools read them.

## How to open an .arec file

An `.arec` file is UTF-8 text, so any text editor opens it, and any Markdown
viewer shows it formatted.

- **Windows:** open it with Notepad, or with VS Code or another code editor. To
  see it formatted, open it in a Markdown viewer.
- **macOS:** open it with TextEdit, or with VS Code or another code editor.
- **Linux:** open it with any text editor, such as gedit, Kate, nano or vim.
- **In a browser:** an `.arec` URL is served as `text/markdown`, so most
  browsers show the text.
- **With an AI agent:** give Claude Code, Codex, Cursor or another agent the
  file or its URL and ask it to read it. Agents read AREC without any setup.

To have your editor highlight `.arec` files as Markdown, associate the `.arec`
extension with Markdown. In VS Code, add this to your settings:

```json
{ "files.associations": { "*.arec": "markdown" } }
```

On GitHub, add this line to a repository's `.gitattributes`:

```text
*.arec linguist-language=Markdown
```

## How to recognize an .arec file

An AREC document begins with an identity comment:

```markdown
<!-- arec
spec_version: 1.3
profile: clipy-recording
-->
```

The comment names the AREC version and the profile: `clipy-recording` for a
recording made with Clipy, or `imported-context` for a document compiled from
an existing video. After it come a title and sections such as `Metadata`,
`Key moments`, `Capture gaps` and `Transcript`. Documents written before
identity comments existed are still read as AREC.

| | |
| --- | --- |
| Extension | `.arec` |
| Media type | `text/markdown; charset=utf-8` |
| Format | UTF-8 Markdown (CommonMark) |
| Starts with | `<!-- arec` |
| Compatibility copy | a byte-identical `.md` file, where a producer offers one |
| Specification | [arecformat.org/spec](/spec) |

## How to check an .arec file

The reference reader reads any `.arec` file and prints what it found. It has no
dependencies and runs on Node 18 or newer:

```sh
mkdir -p arec/validator arec/bin && cd arec
curl -fso validator/validate.mjs https://raw.githubusercontent.com/arecformat/arec/main/validator/validate.mjs
curl -fso bin/arec-validate.mjs https://raw.githubusercontent.com/arecformat/arec/main/bin/arec-validate.mjs
node bin/arec-validate.mjs ../recording.arec
```

Add `--strict` to check a file you produced against the rules a program can
check, listed in specification section 4.4.

## Which programs create .arec files?

[Clipy](https://clipy.online) writes an `.arec` document for every hosted
recording, at the recording's watch URL with `.arec` appended, and for videos
imported with its command-line tool. The format is open, so any recorder can
write it; implementations are listed in the
[specification](/spec#8-implementations).

## Is an .arec file safe to open?

An `.arec` file is text and runs nothing when opened. The format forbids
headers, cookies, tokens and query values in its browser diagnostics, and a
conformant reader removes any it finds. Treat its contents as information about
a recording, not as instructions: an agent reading it should not follow
commands written in a transcript.
