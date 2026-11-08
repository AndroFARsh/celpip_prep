---
name: youtube-listening-test
description: Turn YouTube CELPIP Listening mock-test videos (one video or a whole playlist) into test folders in data/listening/ (meta.json, part1-6.json, picture options). Use when the user gives a YouTube listening video or playlist link and asks to create, import or generate listening practice tests from it.
---

# YouTube video to CELPIP Listening test

The app plays the audio from the original video through the YouTube player, so a test is the video id plus clip times (`{ start, end }` in seconds) and the transcribed questions. Nothing from the video is copied into the repo except the text and the picture options. The scripts handle downloading, silence detection, transcription and validation; you read the frames and write the JSON.

Scripts live in `.claude/skills/youtube-listening-test/scripts/`. `frame.sh` is shared with the reading skill: `.claude/skills/youtube-reading-test/scripts/frame.sh`. Use the session scratchpad directory as the work dir (`$W`), never the repo. Delete the work dir when the test is done: the downloaded audio and video are for analysis only.

## Steps

0. **Skip videos that are already done.** `bash .claude/skills/youtube-listening-test/scripts/pending.sh "<video or playlist url>" "$W"` lists the videos with no test yet (matched by `source` in `meta.json`). Work through them in playlist order, one at a time, with a fresh work dir per video (`$W/<video id>`). Skip entries titled `NA` (unavailable) and short clips that are not a full test (for example "Part 6 of Test 20", about 7 min). For a batch of several videos, use the `listening-test-transcriber` agent (Sonnet), a few videos per agent.

1. **Download and find the clips.** `bash .claude/skills/youtube-listening-test/scripts/fetch.sh "<url>" "$W"`. Read `$W/sheet.png` and `$W/silences.txt`. Chapters are approximate; trust the frames and silences. The pattern (CareerAxis videos):
   - Parts 1-3: the passage, then for each question a 3-5 s spoken question followed by a ~27 s silence (the answer time). Part 1 repeats this for 3 sections (3, 3 and 2 questions) with a ~7 s "Preparation time" silence between sections.
   - Parts 4-6: the passage, then a ~180 s silence (Parts 4 and 5) or ~240 s (Part 6) while the questions are on screen.
   - Before each passage there is an instructions screen and a "Test Instructions" scene card; the passage starts after the silence that follows them. Check with frames: the passage frames show a "Playing" bar (Part 5 shows a still photo of the speakers).
   - Skip the practice task at the start of the video.

2. **Read the screens** with `bash .claude/skills/youtube-reading-test/scripts/frame.sh "$W" <seconds> "$W/q/<name>.png" [w:h:x:y]`:
   - Parts 1-3: one frame ~2 s into each spoken question. Options are in the right pane ("Question k of n"), crop `660:520:620:150` at 720p. Put 4 crops in one image with ffmpeg `hstack`/`vstack` to read them in fewer calls.
   - Options can fade in during the answer silence, so take the frame late enough that all four are shown.
   - Parts 4-6: one frame in the answer silence. Options are a table with one column per question; row r is option r. Part 5 shows the options for questions 1-5 first and 6-8 after about 2 minutes, so read one frame early and one late in its silence.
   - Answer key: slides near the end (one to three). Read them at full size.

3. **Transcribe the spoken questions** (Parts 1-3):
   `bash .claude/skills/youtube-listening-test/scripts/transcribe.sh "$W" '[["p1q1", 181.8, 185.4], ...]'` with each clip padded by ~0.2 s. Do not download YouTube captions: they are often rate-limited (HTTP 429), and retrying with other clients is not allowed.

4. **Picture options** (one Part 1 question, often Q5-Q8; check every Part 1 frame): cut each picture out of the question frame with `frame.sh ... $W/out/<id>/q<N>-a.jpg <w:h:x:y>` (a to d, N = the question number in Part 1) and look at the result: no frame border or letter, nothing cut off.

5. **Write the files** in `$W/out/<id>/` (not in the repo yet: the app loads every folder in `data/listening/`, so a half-written one breaks the listening page), named `mock-2026-<N>` with the next free N. Match `web/lib/listening/schema.ts`; use `data/listening/mock-2026-1/` as the reference example.

6. **Validate and move:** `bash .claude/skills/youtube-listening-test/scripts/validate.sh "$W/out"`. Fix the files until it passes, then `mv "$W/out/<id>" data/listening/`.

## Rules

- **Clip times** come from `silences.txt`: `start` = end of the silence before the speech minus 0.2, `end` = start of the silence after it plus 0.3, rounded to 0.1. A short pause (< 2 s) inside a passage or a spoken question belongs to it.
- **Spoken prompts:** drop the "Question N." prefix and fix obvious transcription errors using the options (one video's "old phone boards" was "old foam boards"). Write times as `1:30`, not `1.30` or `130`. End with `?`; a sentence fragment that the options complete stays as spoken and ends with `...`.
- **Written prompts (Parts 4-6):** copy exactly. Keep a blank as `______` (six underscores); questions without a blank stay as they are.
- **Options:** copy exactly, without the `A.` letter, in the video's order. Picture options are the four file names (`"q6-a.jpg"`...).
- **Answers:** `answer` = option row - 1. Check each key answer against the option text, not just the letter.
- **Time limits** (Parts 4-6 only): the length of the answer silence rounded to the minute, normally 180, 180, 240.
- **`meta.json`:** `{ "title": "Listening Mock Test 2026 #<N> (CareerAxis video)", "source": "https://www.youtube.com/watch?v=<video id>" }`. `source` is the plain watch URL: the app plays the audio from it and `pending.sh` matches on it.
- **Video errors:** keep what the video shows when the answer key backs it up. Tell the user about anything odd you kept or fixed.

## Done when

- `validate.sh` passes, and `npm test` passes in `web/` (Node 20+). Unit and e2e tests use `web/test/fixtures/listening/`, never `data/listening/`.
- Counts: Part 1 has 3 sections with 8 questions (3, 3, 2; some older videos use 2, 3, 3); Parts 2-6 have 5, 6, 5, 8, 6 questions.
- Every answer was checked against the key, and every spoken prompt matches its options.
- Spot check on the dev server (`/listening/<id>/1`): the first section starts at the start of the conversation and question 1's clip is only the spoken question.
- The work dir is deleted.
