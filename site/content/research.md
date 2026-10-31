---
updated: 2026-10-31
title: AREC research: agents with AREC vs video and transcripts
description: With an AREC document, a coding agent finished a recorded design review 4 of 5 times. With the transcript or the raw video, it never did.
---

# AREC research: what agents do with a recording

When a person records their screen and asks an AI agent to act on it, what
should the agent receive: the raw video, the transcript, or an AREC document
that keeps the words joined to what was on screen? Two published studies put
the question to a coding agent. AREC led the benchmark and completed every
attempt in the second study.

- With an AREC document, the agent completed a recorded design review in
  **4 of 5 runs** and scored **11.8 of 12**. With the transcript it scored
  **5.8**, with the raw video **2.4**, and it never finished the job.
- With AREC the agent used **58% fewer input tokens** and finished in **less
  than half the time** of the raw-video runs.
- On a recording made with a production recorder, AREC with its linked frames
  completed **5 of 5** attempts. The transcript alone completed **none**.

## Study 1: the coding benchmark (August 2026)

### The task

A 44-second recording of a design review asks for six changes to a landing
page. Most of them only make sense with the screen: a new headline shown in an
on-screen note, the button to make primary picked out with a highlight, an
item to reorder shown by a move gesture. A coding agent received the recording
in one of four forms and had to make the changes:

| Condition | What the agent received |
| --- | --- |
| Raw video | The 44-second recording as an MP4 file |
| Transcript | The exact timestamped words |
| AREC | A complete AREC document, with its requests, key moments and linked frames |
| Written spec | A hand-written list of all six changes, as a reference point |

Each condition ran five times with OpenAI's Codex CLI (`codex exec`, version
0.147.0, model `gpt-5.6-terra`, medium reasoning), under the same prompt, time
limit and tools, each in a fresh repository. Submissions were graded blind in
Chrome against a fixed 12-point rubric.

### Results

| Condition | Mean score (of 12) | Fully completed | Mean time | Mean input tokens |
| --- | --- | --- | --- | --- |
| **AREC** | **11.8** | **4 of 5** | **65 s** | **175,000** |
| Written spec | 11.0 | 1 of 5 | 47 s | 69,000 |
| Transcript | 5.8 | 0 of 5 | 49 s | 78,000 |
| Raw video | 2.4 | 0 of 5 | 147 s | 417,000 |

AREC scored higher than the hand-written spec and beat every transcript run
(11 to 12 against 3 to 7). By requirement, out of five runs each:

| Requirement | AREC | Written spec | Transcript | Raw video |
| --- | --- | --- | --- | --- |
| Headline shown only in an on-screen note | 5 | 5 | 0 | 3 |
| Button picked out by a highlight | 5 | 5 | 3 | 0 |
| Mobile menu item picked out by a highlight | 5 | 5 | 0 | 0 |
| Item order shown by a move gesture | 5 | 5 | 0 | 0 |
| Mobile overflow fix, fully spoken | 5 | 1 | 5 | 3 |
| Hover and keyboard-focus state | 4 | 4 | 3 | 0 |

AREC is the only condition that got every requirement in nearly every run.

### Why the others fell short

- **The transcript loses the target.** It keeps every word, but not what
  "this", "that" and "here" point at, so it never got the headline, the menu
  item or the reordering, and got the highlighted button in only 3 of 5 runs. An AREC document states each request together with its target.
- **This agent could not watch the video.** The agent could not take the MP4 as
  input, so it pulled frames out with local tools and worked from pictures
  alone, without the spoken requests. It took the longest, used the most
  tokens and finished nothing. An AREC document hands the agent the same
  recording already turned into text and frames.

Full write-up, methods and data: [AREC vs transcript, controlled AI coding benchmark](https://clipy.online/research/arec-coding-benchmark).
Code, prompts, every submission and the grader:
[github.com/clipy-recorder/clipy-arec-benchmark](https://github.com/clipy-recorder/clipy-arec-benchmark).

## Study 2: a production recording, thirty attempts (September 2026)

### The task

A design review was recorded with Clipy's Chrome extension and processed by
the normal production pipeline, mistakes included: the transcript misheard
part of one request, and the automatic summary turned it into a change to a
filter. The review asked for three edits: copy a headline from a note, make one
button primary, and move one card before another. A coding agent (Codex CLI
0.153.4, model `gpt-6-astra`, high reasoning) ran five fresh attempts under
each of six conditions.

### Results

| Condition | Fully completed | Requested edits made |
| --- | --- | --- |
| **AREC with its linked frames** | **5 of 5** | **15 of 15** |
| The same facts and frames as plain Markdown | 5 of 5 | 15 of 15 |
| The processed MP4, inspected with local video tools | 5 of 5 | 15 of 15 |
| Written spec | 5 of 5 | 15 of 15 |
| AREC without its image files | 0 of 5 | 0 of 15 |
| Transcript only | 0 of 5 | 0 of 15 |

What it shows:

- **In this recording, the frames made the difference.** With the frames AREC links
  to, every attempt succeeded; without them, none did. This is why AREC links
  key moments to precomputed frames.
- **The evidence beat the mistakes.** The transcript and summary both got one
  request wrong, yet every attempt with AREC and its frames made the right
  change, and none touched a filter. Keeping the frames beside the summary is what made the error
  recoverable.
- **No video pipeline needed.** The MP4 also worked, but only with local video
  tools to dig the frames out. AREC gets the same result for an agent that can
  read text and open images, with no video tools.
- **No guessing.** When the frames were missing, the agent said what it could
  not see instead of making wrong edits.

Full write-up and data: [From "this button" to working edits](https://clipy.online/research/arec-visual-case-study).

## What this means for screen recorders

Clipy was the first screen recorder to write AREC. Every recorder can
give an agent a video file, and many also export a transcript: the two inputs
the benchmark measured against AREC.

| What the agent receives | Mean score (of 12) | Fully completed |
| --- | --- | --- |
| **An AREC document** | **11.8** | **4 of 5** |
| A transcript | 5.8 | 0 of 5 |
| A video file | 2.4 | 0 of 5 |

An agent given AREC scored about **twice** what it scored with a transcript and
almost **five times** what it scored with a video file, and AREC was the only
one of the three that let the agent finish the job.

## How AREC compares with other recording formats

Each of these formats keeps part of a recording. AREC is the one built to hand
the whole of it to an agent: what was asked, where on screen, what the browser
reported, and what is missing.

| Format | Agent reads it as text | What the person asked | Where on screen | Console and network | States what was not captured |
| --- | --- | --- | --- | --- | --- |
| **AREC** | **Yes, Markdown** | **Extracted requests and the transcript** | **Timestamped moments with frames and pointer positions** | **Yes, redacted by rule** | **Yes** |
| Video file (MP4, WebM) | No, needs a video pipeline | In the audio and on screen | In the pixels, unlabeled | No | No |
| Captions (SRT, WebVTT) | Yes | The words, without what they point at | No | No | No |
| Screenshots | As images | No | One moment, no sequence | No | No |
| HAR file | Yes, JSON | No | No | Network only, with headers and cookies unless sanitized | No |
| Session replay (for example rrweb) | Large JSON event stream | No | Page events and clicks | With plugins | No |
| Playwright trace | A zip for the trace viewer | No | Scripted actions and page snapshots | Yes | No |

AREC does not replace these files; it can sit beside them. A recorder keeps
its video, and the AREC document links to the frames that matter, summarizes
the diagnostics that matter, and says plainly what it did not capture, so an
agent never mistakes missing evidence for proof that nothing happened.

## Run it yourself

Both studies publish their inputs, agent submissions and scoring code, so
anyone can check the grading or run new attempts. More studies, other agents
and other recorders are welcome: open an issue on
[GitHub](https://github.com/arecformat/arec) to have a study listed here.
