---
updated: 2026-10-31
title: AREC research: agents with AREC vs video and transcripts
description: With a full AREC document, a coding agent finished a recorded design review 4 of 5 times; with a transcript, 0 of 5. Method, limits and caveats.
---

# AREC research: what agents do with a recording

The question behind AREC is simple: when a person records their screen and asks
an AI agent to act on it, what should the agent receive? The raw video, the
transcript, or a structured document that keeps the words joined to what was
on screen? Two published studies tested this with a coding agent, and their
inputs, agent submissions and grading code are public.

- In a controlled benchmark, a coding agent given a fully populated AREC
  document completed a recorded design review in **4 of 5 runs** and scored
  **11.8 of 12** on average. Given the transcript it scored **5.8**, and given
  the raw video **2.4**; neither completed a run. The agent could not take
  video input directly, so the raw-video runs worked from frames it extracted
  itself, without the audio.
- With AREC the agent used **58% fewer input tokens** and finished in **less
  than half the time** of the raw-video runs.
- In a second study on a scripted recording captured by a production recorder,
  the same AREC document completed **5 of 5** attempts with its linked frames
  and **0 of 5** without them. The transcript alone also completed 0 of 5.

## Study 1: controlled coding benchmark (August 2026)

### Setup

A 44-second synthetic screen recording of a design review asks for six changes
to a landing page. Most of them are only clear from the screen: a new headline
shown only in an on-screen note, the button to make primary picked out with a
highlight, and an item to reorder shown by a move gesture. A coding agent
received the recording in one of four forms and had to make the changes:

| Condition | What the agent received |
| --- | --- |
| Raw video | The 44-second H.264/AAC recording, with no transcript or frames |
| Transcript | The exact timestamped words, with no frames or pointer data |
| AREC | An AREC document and the six frames and crops it links to |
| Written spec | A human-written list of all six changes (a control, not a recording) |

The AREC document was rendered by a production AREC writer (in the 0.3 field
set that became 1.3) around the same transcript, the recorded pointer and
gesture data, and capture gaps. Its summary, list of requested changes and
moment captions were written by the study team, to stand in for a perfect
extraction pass. So the study measures what a fully populated AREC document
gives an agent, not the accuracy of any recorder's automatic extraction.

Each condition ran five times with OpenAI's Codex CLI (`codex exec`, version
0.147.0, model `gpt-5.6-terra`, medium reasoning) under the same prompt, the
same 720-second limit and the same tools, each in a fresh isolated repository.
Submissions were graded in Chrome under random IDs, without the condition
label, against a rubric of six requirements worth 12 points that was fixed
before the runs.

### Results

| Condition | Mean score (of 12) | Fully completed | Mean time | Mean input tokens |
| --- | --- | --- | --- | --- |
| Raw video | 2.4 | 0 of 5 | 147 s | 417,000 |
| Transcript | 5.8 | 0 of 5 | 49 s | 78,000 |
| AREC | 11.8 | 4 of 5 | 65 s | 175,000 |
| Written spec (control) | 11.0 | 1 of 5 | 47 s | 69,000 |

The agent could not attach the video directly. In all five raw-video runs it
extracted frames with local tools; it attempted transcription once, and that
failed, so no raw-video run used the spoken requests.

Every AREC run scored higher than every transcript run (11 to 12 against 3 to
7). By requirement, out of five runs each:

| Requirement | Raw video | Transcript | AREC | Written spec |
| --- | --- | --- | --- | --- |
| Headline shown only in an on-screen note | 3 | 0 | 5 | 5 |
| Button picked out by a highlight | 0 | 3 | 5 | 5 |
| Mobile menu item picked out by a highlight | 0 | 0 | 5 | 5 |
| Item order shown by a move gesture | 0 | 0 | 5 | 5 |
| Mobile overflow fix, fully spoken | 3 | 5 | 5 | 1 |
| Hover and keyboard-focus state | 0 | 3 | 4 | 4 |

The transcript kept every word but not what "this", "that" and "here" referred
to, so it failed the requirements that depended on pointing. The AREC document
named those targets in words, and the agent completed them from the text: no
AREC run opened the linked frames. The written spec matched AREC on every
pointed-at change; it scored lower overall because its runs mostly missed the
mobile overflow fix.

### Limits

The recording is synthetic and the study is exploratory: five runs per
condition, one task, one agent, run by the team that makes Clipy. The AREC
document's request text was written by that team, as described above. The
grading code was corrected once, after the first blinded pass and before the
final grading, to accept equivalent CSS that the first version wrongly
rejected. Before the correction no condition fully completed a run, and AREC
averaged 9.0 against 4.4 for the transcript and 1.8 for the raw video. Both
passes are published. Treat the numbers as a measured example, not a general
rate.

Full write-up: [AREC vs transcript, controlled AI coding benchmark](https://clipy.online/research/arec-coding-benchmark).
Code, prompts, every submission and the grader:
[github.com/clipy-recorder/clipy-arec-benchmark](https://github.com/clipy-recorder/clipy-arec-benchmark).

## Study 2: a scripted recording, thirty attempts (September 2026)

### Setup

A scripted review, with on-screen notes, outlines, an arrow and subtitles, was
recorded with Clipy's Chrome extension and processed by the normal production
pipeline. Nothing in the result was edited, apart from pointing image links at
local copies, and its mistakes were kept: the
transcript misheard part of one request, and the automatic summary turned it
into a change to a filter. The review asked for three edits: copy a headline
from a note, make one button primary, and move one card before another. A
coding agent (Codex CLI 0.153.4, model `gpt-6-astra`, high reasoning) then ran
five fresh attempts under each of six conditions.

### Results

| Condition | Fully completed | Requested edits made |
| --- | --- | --- |
| Transcript only | 0 of 5 | 0 of 15 |
| AREC without its image files | 0 of 5 | 0 of 15 |
| AREC with its linked frames | 5 of 5 | 15 of 15 |
| The same facts and frames as plain Markdown | 5 of 5 | 15 of 15 |
| The processed MP4, inspected with local video tools | 5 of 5 | 15 of 15 |
| Written spec (control) | 5 of 5 | 15 of 15 |

What the results show:

- **The frames were necessary in this recording.** Without its images, the
  AREC text did no better than the transcript; with them, every attempt
  succeeded. The frames held both the visual targets and the scripted
  subtitles, which gave cleaner wording than the transcript, and the study
  cannot separate those two effects.
- **Presentation did not decide it.** The same facts and frames flattened into
  plain Markdown also succeeded, so this study shows no advantage from AREC's
  layout itself; the frames were the decisive addition in this recording.
- **The evidence outweighed the summary's mistake.** Each successful attempt
  made the intended button change and none added a filter; in the original
  case study, the agent's own account cites the linked frames and the visible
  subtitle. The ten attempts without images declined to guess rather than
  making wrong edits.

The processed video also succeeded when the agent was allowed to inspect it
with local video tools. The AREC document reached the same result with no
video tooling, which matters for agents that can read text and open an image
but cannot process video.

### Limits

The team that makes Clipy scripted the task, knew its answers and designed the
study; it was not publicly preregistered or independently run. One recording and five
attempts per condition cannot establish general accuracy. A review after the
attempts found weaknesses in how the test harness collected results; the
retained outputs and scores are unchanged, and the report describes the
correction. The source report states all of this in full.

Full write-up: [From "this button" to working edits](https://clipy.online/research/arec-visual-case-study).

## How AREC compares with other recording formats

Each of these formats keeps part of a recording. AREC is the one designed to
hand the whole of it to an agent: what was asked, where on screen, what the
browser reported, and what is missing.

| Format | Agent reads it as text | What the person asked | Where on screen | Console and network | States what was not captured |
| --- | --- | --- | --- | --- | --- |
| AREC | Yes, Markdown | Extracted requests and the transcript | Timestamped moments with frames and pointer positions | When captured, redacted by rule | Yes, whenever a gap could be mistaken for absence |
| Video file (MP4, WebM) | No, needs a video pipeline | Only in the audio | In the pixels, unlabeled | No | No |
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
anyone can check the grading or run new attempts. Independent replications,
other agents and other recorders are welcome: open an issue on
[GitHub](https://github.com/arecformat/arec) to have a study listed here.
