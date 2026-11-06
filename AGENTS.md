# CELPIP Mock Tests

## Business Requirements
- An MVP of a CELPIP Reading practice test.
- The Reading test has 4 parts and should mimic the real test UI (split pane: passage left, questions right; part header with countdown; Next button; no going back).
  1. Reading Correspondence: letter, 6 multiple-choice questions, then a reply with 5 fill-in-the-blank dropdowns. 11 min.
  2. Reading to Apply a Diagram: diagram (a table defined in JSON) plus an email with 5 blanks, then 3 multiple-choice questions. 9 min.
  3. Reading for Information: passage split into paragraphs A-D; 9 statements, each matched to a paragraph or "E: not given". 10 min.
  4. Reading for Viewpoints: article, 5 multiple-choice questions, then a reader comment with 5 blanks. 13 min.
- Per-part countdown timer; auto-advance when time runs out.
- After the last part: results page with score, per-question correct answer and the user's answer.
- Adding a new test must be trivial: create `data/reading/<test-id>/` with `meta.json` and `part1.json` through `part4.json`. The app discovers tests from the filesystem; no code changes.
- Desktop and mobile layouts (mobile stacks passage above questions).

## Technical
- Next.js (App Router, TypeScript) in the `web/` subdirectory. Test data lives at repo root in `data/reading/`.
- No user login. No database. Answers are kept in client state only.
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