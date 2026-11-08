# CELPIP Mock Tests

## Business Requirements
- CELPIP practice tests. The landing page picks the section (Reading, Listening; Writing and Speaking later).
- An MVP of a CELPIP Reading practice test.
- The Reading test has 4 parts and should mimic the real test UI (split pane: passage left, questions right; part header with countdown; Next button; no going back).
  1. Reading Correspondence: letter, 6 multiple-choice questions, then a reply with 5 fill-in-the-blank dropdowns. 11 min.
  2. Reading to Apply a Diagram: diagram (an image or static HTML page in the test folder) plus an email with 5 blanks, then 3 multiple-choice questions. 9 min.
  3. Reading for Information: passage split into paragraphs A-D; 9 statements, each matched to a paragraph or "E: not given". 10 min.
  4. Reading for Viewpoints: article, 5 multiple-choice questions, then a reader comment with 5 blanks. 13 min.
- Per-part countdown timer; auto-advance when time runs out.
- Run the full test (Next moves to the next part) or a single part (Next goes to its results).
- After the last part: results page with score, per-question correct answer and the user's answer, plus Start again and Clear result.
- Every Start begins a fresh run. Home shows Results and Clear for runs taken before.
- Adding a new test must be trivial: create `data/reading/<test-id>/` with `meta.json` and `part1.json` through `part4.json`. The app discovers tests from the filesystem; no code changes.
- Desktop and mobile layouts (mobile stacks passage above questions).
- Results pages show an estimated CELPIP level (0-12) from unofficial raw-score charts; a single part is scaled to 38 questions.

### Listening
- 6 parts, 38 questions, mimicking the real test: audio plays once, no pause, replay or going back; Next is hidden while audio plays.
  1. Listening to Problem Solving: 3 sections (3, 3, 2 questions).
  2. Listening to a Daily Life Conversation: 5 questions.
  3. Listening for Information: 6 questions.
  4. Listening to a News Item: 5 questions.
  5. Listening to a Discussion: 8 questions.
  6. Listening for Viewpoints: 6 questions.
- Parts 1-3: each question is spoken, its 4 options (text or pictures) shown, then 30 s to answer. Parts 4-6: all questions on one screen with dropdowns and a part timer (`timeLimitSec`).
- Audio is played from the source YouTube video through the YouTube IFrame Player API as clips (`{ start, end }`). Never download or host the audio.
- Adding a test: `data/listening/<test-id>/` with `meta.json` (`title`, `source` watch URL) and `part1.json` through `part6.json`. Same full-test, single-part and results behaviour as Reading.

## Technical
- Next.js (App Router, TypeScript) in the `web/` subdirectory. Test data lives at repo root in `data/reading/` and `data/listening/`.
- No user login. No database. Finished results are saved in the browser (localStorage), one per test and run (full test or single part).
- UI only from shadcn/ui components (Tailwind). Do not create custom UI components or hand-roll substitutes. If a component is missing, add it with the shadcn CLI, then use it.
- Validate test JSON with zod; one schema per part.
- Keep it simple.

## Color Scheme
- Light and dark mode via next-themes with a toggle in the header.

## Strategy
1. Write a plan with success criteria for each phase. Include project scaffolding (with .gitignore) and thorough unit tests.
2. Carry out the plan and make sure every success criterion is met.
3. Run integration tests with Playwright.
4. Fix defects.
5. The work is complete only when the MVP is built and tested, and the dev server is running and ready for the user.

## Coding Standards
1. Use the latest libraries and modern approaches.
2. Keep it simple. NEVER over-engineer; ALWAYS simplify. NO unnecessary defensive programming. No extra features.
3. Be concise. Keep the README minimal. Never use emojis.
4. Unit tests with Vitest; e2e with Playwright. Run `npm run lint`, `npm test`, and `npm run build` before declaring a phase done.