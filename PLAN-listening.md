# Plan: CELPIP Listening MVP

Add a Listening section to the existing app (same Next.js app, shadcn/ui, results store, GitHub Pages deploy). A new landing page picks the section; Writing and Speaking will be added there later. Results pages show an estimated CELPIP level (0-12).

## Navigation

- `/`: landing page with one Card per section (Reading, Listening): name, short description (parts, length), and an Open button. Sections come from one list in `lib/sections.ts`, so adding Writing or Speaking later is one entry plus its routes. No placeholder cards for sections that do not exist yet.
- `/reading`: the current home page (list of reading tests), moved here.
- `/listening`: the same list for listening tests.
- Header: app title links to `/`, theme toggle stays.

## CELPIP level

CELPIP does not publish its raw-score conversion, so the level is an estimate from the widely used unofficial charts (both sections have 38 scored questions). It lives in one table per section in `lib/celpip-level.ts`:

| Level | Listening (correct of 38) | Reading (correct of 38) |
|---|---|---|
| 12 | 38 | 38 |
| 11 | 37 | 37 |
| 10 | 35-36 | 33-36 |
| 9 | 33-34 | 31-32 |
| 8 | 30-32 | 28-30 |
| 7 | 27-29 | 24-27 |
| 6 | 22-26 | 19-23 |
| 5 | 17-21 | 15-18 |
| 4 | 11-16 | 10-14 |
| 3 | 7-10 | 8-9 |
| 2 | 4-6 | 5-7 |
| 1 | 1-3 | 1-4 |
| 0 | 0 | 0 |

The charts give 10-12 as one band; 37 = 11 and 38 = 12 is our split. Levels 0-2 extend the charts at the same step size.

- Shown on the results page of a full-test run as a large "CELPIP level N (estimate)" next to the raw score, for both Reading and Listening.
- Single-part runs: the raw score is scaled to 38 and the level shown as "estimated from Part N only".
- Saved results already store `score` and `total`, so the level is computed on display; old saved results get it too.

## Source material

Playlist `PLRZwE790uWkAND6drNacEyT9sFtkxC2gH` (CareerAxis): about 38 full listening mock tests, 36-46 min each. Every video has chapters per part, auto captions, and an answer key at the end. Layout, checked on `ZuA_Fm4RNAM`:

- Parts 1-3: the passage plays over a "Playing" bar. Then each question is spoken (not shown as text) while its 4 options are on screen, followed by a 30 s countdown. Options can be images (Part 1 Q8).
- Parts 4-6: the passage plays, then all questions are shown as text with dropdown options and a countdown of about 3 min.
- Answer key: one slide per part at the end.

## Audio

Decision: play the original YouTube audio through the YouTube IFrame Player API and do not download or host it.

- Every audio clip is a segment of the source video: `{ "start": 99.5, "end": 187.0 }` in seconds.
- `player.loadVideoById({ videoId, startSeconds, endSeconds })` plays exactly that segment. The `ENDED` state marks the end of the clip.
- The player is visible (YouTube policy requires at least 200x200), small, in the left pane where the real test shows "Playing", with `controls: 0` and `disablekb: 1`. This also matches Part 5, which is a video in the real test.
- The video is fetched when the test is taken. Nothing is copied into the repo or onto GitHub Pages.
- Known limits: needs internet; monetized videos can show an ad before a clip (the question timer starts only after `ENDED`, so an ad does not use up answer time); mobile needs a tap before the first clip (the Start button provides it).

Rejected: downloading audio with yt-dlp and serving mp3 files. It is technically trivial, but it breaks YouTube's terms, adds about 18 MB per test to git (about 700 MB for the playlist), and would republish CareerAxis's copyrighted audio on the public Pages site. Possible later as a local-only, gitignored option if offline use is needed.

## Data model

`data/listening/<test-id>/`: `meta.json` plus `part1.json` through `part6.json`. Image options are files in the same folder.

- `meta.json`: `{ title, source }`. `source` is the plain watch URL; the video id comes from it.
- `Segment`: `{ start, end }` with `end > start`.
- `Question`: `{ prompt, audio?, options[4], answer }`. `answer` is the zero-based index. An option ending in `.png/.jpg/.webp` is an image file. Parts 1-3 have `audio` (the spoken question); `prompt` is its caption text and appears only on the results page. Parts 4-6 have no `audio`; `prompt` is shown, with `______` for the dropdown.
- Parts, one zod schema each:

| Part | Name | Content | Answer time |
|---|---|---|---|
| 1 | Listening to Problem Solving | 3 sections `{ audio, questions }` with 3, 3, 2 questions | 30 s per question |
| 2 | Listening to a Daily Life Conversation | `audio`, 5 questions | 30 s per question |
| 3 | Listening for Information | `audio`, 6 questions | 30 s per question |
| 4 | Listening to a News Item | `audio`, 5 questions | `timeLimitSec` 180 |
| 5 | Listening to a Discussion | `audio`, 8 questions | `timeLimitSec` 180 |
| 6 | Listening for Viewpoints | `audio`, 6 questions | `timeLimitSec` 240 (the video allows 4 min) |

38 scored questions. The video's practice task is skipped.

## Test flow (mimics the real test)

- No pause, replay, seek, or going back. Next is hidden while audio plays.
- Parts 1-3: section audio, then for each question: question audio, options shown, 30 s countdown. Next or the timer moves on.
- Parts 4-6: passage audio, then all questions on one screen with the part countdown. Time running out moves on.
- Full test (parts 1-6) or a single part, like Reading. Results page: score, per question your answer and the correct answer (plus the question text), Start again, Clear result. Every Start is a fresh run.
- Mobile: player and audio status stacked above the questions.

## Phases

### Phase 1: Shared groundwork [done]
- AGENTS.md: add Listening business requirements. README: one Listening section.
- Landing page at `/`, reading test list moved to `/reading` (see Navigation). Listening cards have the same rows as Reading (full + parts 1-6, Results, Clear).
- `lib/celpip-level.ts` and the level on the Reading results page.
- `lib/runs.ts`, `lib/results-store.ts`, `lib/tests.ts`: take a section (`reading` | `listening`). The storage key becomes `celpip:<section>:<test>:<run>`, and existing reading keys are read as before so saved results are kept.

Success: Reading unit and e2e tests pass (updated only for the `/reading` move); landing page works on desktop and mobile; unit tests for every level band boundary (e.g. listening 34 -> 9, 35 -> 10) and part scaling; Reading results show the level.

### Phase 2: Listening data layer [done]
- `lib/listening/schema.ts` (6 part schemas), loader (image options inlined as data URLs, as with the reading diagram), scoring.
- Fixture test in `web/test/fixtures/listening/`.
- First real test, `data/listening/mock-2026-1` from `ZuA_Fm4RNAM`, transcribed by hand to prove the format.

Success: unit tests for valid data, wrong counts, bad answer index, `end <= start`, missing image file, new folder discovered with no code change.

### Phase 3: Player [done]
- `hooks/use-youtube-segment.ts`: loads the IFrame API once, `play(segment)` returns a promise that resolves on `ENDED`, and reports progress for the "Playing" bar.
- A fake player for tests (segments end after a short delay), chosen with `NEXT_PUBLIC_FAKE_AUDIO=1`, so the tests never depend on YouTube.

Success: unit tests with a mocked `YT.Player`: the right `videoId/start/end` is passed, the promise resolves on `ENDED`, and a second `play` waits for the first.

### Phase 4: Listening UI [done]
- Routes: `/listening/[id]`, `/listening/[id]/[part]`, `/listening/[id]/results/[run]`, built with `generateStaticParams` for the static export.
- Runner state per part: `playing-section -> playing-question -> answering -> ...` (parts 1-3) or `playing -> answering` (parts 4-6). Uses the existing `use-countdown` and `choice-select`.

Success: full flow with the fake player; timer auto-advance; score matches the answer key; no going back.

### Phase 5: Tests [done]
- Vitest: schemas, loader, scoring, player hook, runner (perfect run 38/38, all wrong 0/38, auto-advance through all 6 parts, single part, fresh start).
- Playwright (desktop + Pixel 7, fake player): home tabs, full run, single part, results saved and cleared, no Next during audio, no horizontal scroll, dark mode.
- One manual check with the real YouTube player on the dev server: segments start and stop at the right words.

Success: `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` all green.

### Phase 6: Import the playlist [skill done; batch import not run]
- Skill `.claude/skills/youtube-listening-test/` and agent `listening-test-transcriber` (Sonnet), reusing the reading skill's `fetch.sh`, `slides.sh`, `pending.sh`.
- Segment times: chapters for the part boundaries, "Question k of n" frame changes for question starts, and `ffmpeg silencedetect` on a scratchpad audio copy (analysis only, deleted afterwards) for exact ends to within 0.5 s.
- Text: options from frames, question prompts from captions, answers from the answer-key slides.
- `validate.sh`: schema check, segments in order, inside the video length, not overlapping.
- Batch the playlist a few videos at a time (YouTube rate-limits caption downloads with HTTP 429).

Success: each imported test validates, appears on the home page, and has had its answers checked against the key; spot-check segment timing on 3 tests.

### Phase 7: Hand over [done]
- Verify on the dev and production builds; dev server running.

## Notes from the build

- Results: 132 unit tests (Vitest), 36 e2e tests (Playwright, desktop + Pixel 7; 2 mobile-only tests skip on desktop). Playwright's Chromium does not support macOS 12, so the e2e run used the installed Google Chrome (`channel: "chrome"`).
- Real YouTube player checked on the dev server with `mock-2026-1` Part 1: section clip 53.8 s for 52.4 s of audio (includes loading), question clips 3.8 s and 5.3 s for 3.6 s and 4.7 s.
- Defect found and fixed: loading the next clip replays the previous clip's ENDED event, which ended spoken questions instantly. The player now counts ENDED only after PLAYING.
- Spoken question text comes from local Whisper transcription, not YouTube captions (captions were rate-limited with HTTP 429).
- Between clips the YouTube player shows its own end screen.
