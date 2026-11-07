---
name: youtube-reading-test
description: Turn a YouTube CELPIP Reading mock-test video into a new test folder in data/reading/ (meta.json, part1-4.json, diagram). Use when the user gives a YouTube link and asks to create, import or generate a practice test from it.
---

# YouTube video to CELPIP Reading test

Mock-test videos usually have no captions: the passages, questions and options are on screen, and an answer key (often with explanations) comes at the end. You read the frames and transcribe them. The scripts handle downloading, frame extraction, cropping and validation so those steps behave the same every time.

Scripts live in `.claude/skills/youtube-reading-test/scripts/`. Use the session scratchpad directory as the work dir (call it `$W`), never the repo.

## Steps

1. **Download and extract frames.**
   `bash .claude/skills/youtube-reading-test/scripts/fetch.sh "<url>" "$W"`
   Playlist links are fine; only the one video is downloaded. The script prints the chapters from the description, saves `$W/frames/t_<seconds>.png` (one frame every 15 s), and builds `$W/sheet.png`, a contact sheet with one timestamped thumbnail per minute. If captions exist (`$W/dl/*.vtt`), use them as well, but trust the screen text.

2. **Find the screens.** Read `$W/sheet.png` first and use it to find where each part and the answer key start. Don't rely on the chapters: channels reuse one description across videos, so the timestamps can belong to a different video. Each part usually has two screens, so read an early frame and a late one for each part:
   - Part 1: letter + 6 questions, then the reply with blanks 7-11.
   - Part 2: diagram + email with blanks 1-5, then questions 6-8.
   - Part 3: paragraphs A-D + 9 statements (one screen).
   - Part 4: article + 5 questions, then the reader comment with blanks 6-10.
   - Answer key and explanations: the slides are short and fall between 15 s frames. Run `bash .claude/skills/youtube-reading-test/scripts/slides.sh "$W" <key start mm:ss>`, read `$W/slides/sheet.png` to see which slides are answer keys, then read those `s_NNN.png` files at full size. There is usually one answer-key slide per part, followed by explanation slides.

3. **Cut out the Part 2 diagram.** Pick the frame where the diagram is largest and sharpest, find its pixel box, then run
   `bash .claude/skills/youtube-reading-test/scripts/frame.sh "$W" <mm:ss> data/reading/<id>/diagram.jpg <w:h:x:y>`.
   Look at the result: no UI chrome, nothing cut off, text readable.

4. **Write the files** in `data/reading/<id>/` (kebab-case id). Match the schemas in `web/lib/schema.ts`, and use `data/reading/mock-2026/` as the reference example.

5. **Validate:** `bash .claude/skills/youtube-reading-test/scripts/validate.sh`. Fix the files until it passes, then check that the test shows up on the home page of the dev server.

## Transcription rules

- **Copy text exactly.** Fix only obvious frame-reading errors. Separate paragraphs with `\n\n`. Leave out email header lines such as `To:`/`From:`; start at the greeting.
- **Questions with a blank:** keep the blank as `______` (six underscores) in `prompt`, for example `"The project stalled due to crew ______."`. The app puts the dropdown in place of the `______`. Use only one per prompt. Questions without a blank (`"Why do print books survive?"`) stay as they are, and the dropdown appears after the text. Some videos write a sentence to complete as a fragment with "?" (`"Shoppers become more?"`). Write it as a blank instead (`"Shoppers become more ______."`).
- **Video errors:** keep what the video shows when the answer key backs it up (one video repeated a Part 3 statement on purpose and keyed it the same both times). Tell the user about anything odd you kept or fixed.
- **Blanks in the reply, email or comment:** write `{{1}}` to `{{5}}`, numbered within that text, not with the video's numbers (7-11 or 6-10). `blanks[i]` belongs to `{{i+1}}`.
- **Option order:** keep the video's order. The video shows options in a table with one column per question; `Option 1st..4th` in the answer key is the row. So `answer` = row - 1. Check each key answer against the option text, not just the row number.
- **Part 3:** `answer` is the letter from the key. Ignore extra labels such as "Not Given" printed next to an answer letter that is not E.
- **Time limits** (ignore the video's timer): part1 660, part2 540, part3 600, part4 780.
- **`meta.json`:** `{ "title": "<short name> (<channel>)" }`.

## Done when

- `validate.sh` passes, and `npm test` passes in `web/` (Node 20+).
- Counts match: Part 1 has 6 questions and 5 blanks; Part 2 has 5 blanks and 3 questions; Part 3 has 4 paragraphs and 9 statements; Part 4 has 5 questions and 5 blanks.
- Each answer was checked against the video's answer key.
- The new test appears on the home page and its diagram is readable.
