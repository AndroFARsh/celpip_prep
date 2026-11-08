---
name: youtube-writing-test
description: Turn YouTube CELPIP Writing mock-test videos (one video or a whole playlist) into test folders in data/writing/ (meta.json, part1.json, part2.json). Use when the user gives a YouTube writing video or playlist link and asks to create, import or generate writing practice tests from it.
---

# YouTube video to CELPIP Writing test

Writing videos show the two task prompts and their sample answers on screen. Captions, if any, are the narrator's commentary, not the prompts: read the text from the frames. The scripts handle downloading, frame extraction and validation.

Scripts live in `.claude/skills/youtube-writing-test/scripts/`. Use the session scratchpad directory as the work dir (call it `$W`), never the repo.

## Steps

0. **Skip videos that are already done.** Run `bash .claude/skills/youtube-writing-test/scripts/pending.sh "<video or playlist url>" "$W"`. It lists only the videos with no test yet and not listed as duplicates. Work through them in playlist order, one at a time, with a fresh work dir per video (`$W/<video id>`). For a batch of several videos, run them through the `writing-test-transcriber` agent (Sonnet).

1. **Download and extract frames.** `bash .claude/skills/youtube-writing-test/scripts/fetch.sh "<url>" "$W"`. It saves `$W/frames/t_<seconds>.png` (every 10 s) and `$W/sheet.png` (one thumbnail per 10 s).

2. **Find the screens** on `$W/sheet.png`, then read these frames at full size (the usual layout of a 9-minute video, times vary):
   - Task 1 prompt (about 0:30): situation left; instruction sentence and 3 bullets right.
   - Task 1 sample email (about 2:30).
   - Task 2 prompt (about 4:00): title and situation left; Option A and Option B right.
   - "Model Answer - Option A" (about 6:00) and "Model Answer - Option B" (about 7:40).
   If a long answer is cut off or scrolls, read a later frame too.

3. **Check for a duplicate** before writing anything: `grep -l "<first few words of the Task 1 situation>" data/writing/*/part1.json`. If it matches and Task 2 matches too, the video is a re-upload: append `<video id> <matching test id>` as a line to `data/writing/duplicates.txt` and move on.

4. **Write the files** in `data/writing/<id>/`, named `mock-2026-<N>` with the next free N. Match `web/lib/writing/schema.ts`; `data/writing/mock-2026-1/` is the reference example.

5. **Validate:** `bash .claude/skills/youtube-writing-test/scripts/validate.sh`. Fix the files until it passes.

## Transcription rules

- **Copy text exactly.** Fix only obvious frame-reading errors. Use a plain hyphen in ranges (`150-200`).
- `part1.json`: `timeLimitSec` 1620; `situation` (left pane); `task` (the instruction sentence, e.g. "Write an email to Sarah in about 150-200 words. You are asking for ..."); `points` (the 3 bullets, without "Your email should do the following things:"); `sample` (the whole email, paragraphs separated by `\n\n`, greeting and sign-off as their own paragraphs).
- `part2.json`: `timeLimitSec` 1560; `title` (the survey heading); `situation`; `options` (the text after "Option A:" and "Option B:"); `samples` (model answers for A and B, in that order, without the "Model Answer - Option X" heading).
- `meta.json`: `{ "title": "Writing Mock Test 2026 #<N> (<channel name> video)", "source": "https://www.youtube.com/watch?v=<video id>" }`. `source` is the plain watch URL with no playlist parameters.
- If a video shows only one model answer for Task 2, tell the user instead of inventing the other.

## Done when

- `validate.sh` passes, and `pending.sh` no longer lists the video.
- Every text was checked against its frame, and the test appears on `/writing` of the dev server.
