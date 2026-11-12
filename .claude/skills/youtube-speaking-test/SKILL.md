---
name: youtube-speaking-test
description: Turn YouTube CELPIP Speaking mock-test videos ("Task 1 to 8" full tests) into test folders in data/speaking/ (meta.json, part1-8.json, pictures). Use when the user gives a YouTube speaking video or playlist link and asks to create, import or generate speaking practice tests from it.
---

# YouTube video to CELPIP Speaking test

Use only full-test videos ("Task 1 to 8", about 30 minutes); single-task videos do not make a test. Each task shows its prompt, preparation and recording timers, then the sample answer as on-screen text. Captions are narration: read the text from the frames.

Scripts live in `.claude/skills/youtube-speaking-test/scripts/`. Use the session scratchpad directory as the work dir (call it `$W`), never the repo.

## Steps

0. **Skip videos that are already done.** `bash .claude/skills/youtube-speaking-test/scripts/pending.sh "<video or playlist url>" "$W"` lists videos with no test and not in `data/speaking/duplicates.txt`. Keep only the "Task 1 to 8" titles. One fresh work dir per video (`$W/<video id>`). For a batch, use the `speaking-test-transcriber` agent.

1. **Download and extract frames.** `bash .claude/skills/youtube-speaking-test/scripts/fetch.sh "<url>" "$W"`: frames every 10 s in `$W/frames/t_<seconds>.png`, and `$W/sheet.png` (one thumbnail per 20 s).

2. **Find the screens** on the sheet and read them at full size. Skip the practice task. For each task read the prompt screen and the "Sample Answer" screen. Task 5 has two stages: the two options (read names and bullet details), then "Your friend found another option ..." with the new option and its sample. The video's first-stage sample is not used. Task 6 has an EITHER/OR screen and "Model Answer A" and "Model Answer B".

3. **Check for a duplicate**: `grep -l "<first words of the Task 1 prompt>" data/speaking/*/part1.json`. If Task 1 and Task 3 match an existing test, append `<video id> <matching test id>` to `data/speaking/duplicates.txt` and stop.

4. **Cut out the pictures** with `bash .claude/skills/youtube-speaking-test/scripts/frame.sh "$W" <seconds> data/speaking/<id>/<name>.jpg <w:h:x:y>`: `scene.jpg` (Task 3, also used by Task 4 if the same), `option-a.jpg`, `option-b.jpg`, `option-c.jpg` (Task 5 new option), `unusual.jpg` (Task 8). Crop 1-2 px inside the picture's border. Look at each result: no red frame, no text, nothing cut off.

5. **Write the files** in `data/speaking/mock-2026-<N>/` (next free N), matching `web/lib/speaking/schema.ts`; `data/speaking/mock-2026-1/` is the reference.

6. **Validate:** `bash .claude/skills/youtube-speaking-test/scripts/validate.sh` until it passes.

## Transcription rules

- **Copy text exactly**; fix only obvious frame-reading errors. Paragraphs in samples are separated by `\n\n`. Leave out the "Sample Answer" and "Model Answer A/B" headings.
- Use the prompt screen's wording, not the sample screen's (sample screens sometimes repeat or merge prompt sentences).
- `part5.json`: `compare` is the second-stage prompt with the first option's name replaced by `{choice}` (for example "... so compare the {choice} to this new option ..."); `sampleChoice` is the option the sample defends (usually 0).
- `part6.json`: `choices` are the EITHER and OR sentences; `samples` are Model Answer A and B.
- `meta.json`: `{ "title": "Speaking Mock Test 2026 #<N> (<channel name> video)", "source": "https://www.youtube.com/watch?v=<video id>" }`.

## Done when

- `validate.sh` passes and `pending.sh` no longer lists the video.
- Every picture was looked at, every text checked against its frame, and the test appears on `/speaking`.
