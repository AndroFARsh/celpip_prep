# Plan: CELPIP Speaking MVP

Add a Speaking section (same app, shadcn/ui, results store, GitHub Pages deploy).

## Real test

8 tasks, about 15 minutes. Each task shows a prompt, a preparation countdown, then records for a fixed time and moves on by itself.

| Task | Name | Prep / speak | Content |
|---|---|---|---|
| 1 | Giving Advice | 30 / 90 s | prompt |
| 2 | Talking about a Personal Experience | 30 / 60 | prompt |
| 3 | Describing a Scene | 30 / 60 | prompt, picture |
| 4 | Making Predictions | 30 / 60 | prompt, same picture |
| 5 | Comparing and Persuading | 60 choose, 60 / 60 | 2 options (picture, details); then the pick against a new option |
| 6 | Dealing with a Difficult Situation | 60 / 60 | situation, 2 choices |
| 7 | Expressing Opinions | 30 / 90 | prompt |
| 8 | Describing an Unusual Situation | 30 / 60 | prompt, picture |

## Source material

Playlist `PLBVkYjNQCzP-L6g1IXr4Xwl5KMg2JuBTU` (129 videos): mostly one task per video, plus 30-minute "Task 1 to 8" videos that hold a whole test (about 2 distinct tests, re-uploaded). Example: `T1entXH6RWo` (Exam #1). Each task: prompt, prep and recording timers, then the sample answer as on-screen text. The video's Task 5 records for both stages and its second-stage prompt assumes the first option; the app follows the real test (choose without speaking, then argue) and keeps the pick's name as `{choice}`.

## Decisions

- Recording: `getUserMedia` on Start (a user gesture), `MediaRecorder` per task at 32 kbps.
- Storage: audio in IndexedDB (`idb-keyval`), one entry per test and run; the result itself in localStorage like the other sections, so the test card works unchanged. Clear removes both.
- Recordings are written only when the run finishes, so an abandoned run never replaces an earlier result's audio.
- Next skips the rest of the current step (prep to recording, recording to the next task), like Next elsewhere in the app.
- No score or level; results play each recording next to the sample answer(s).

## Success criteria

- Unit: loader (pictures as data URLs, invalid files), recordings store, runner (mic blocked, full flow with Next, auto-advance on timers, Task 5 default choice, release mic on leave), results (playback, samples, clear removes audio). Lint, test and build pass.
- e2e with Chrome's fake microphone: full test records 8 tasks and plays back, single task, Clear, no horizontal scroll, 404s; desktop and mobile.
- Example test `mock-2026-1` imported from `T1entXH6RWo`; `youtube-speaking-test` skill and agent for the rest.
