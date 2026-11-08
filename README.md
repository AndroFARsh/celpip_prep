# CELPIP Mock Tests

Reading, Listening and Writing practice tests. Next.js app in `web/`, test content in `data/reading/`, `data/listening/` and `data/writing/`.

## Run

```
cd web
npm install
npm run dev
```

Open http://localhost:3000, pick Reading, Listening or Writing, then start the full test or a single part. Finished results are saved in the browser; the test list shows Results and Clear for runs taken before.

## Deploy

Pushing to `main` publishes the site to GitHub Pages (`.github/workflows/deploy.yml`). One-time setup: repo Settings > Pages > Source: GitHub Actions.

## Test

```
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

Listening audio plays from the source YouTube video, so it needs an internet connection.

## Add a reading test

Copy `data/reading/demo-1` to `data/reading/<new-id>` and edit the JSON. It appears on the home page automatically.

- `meta.json`: `title`
- `part1.json`: letter, 6 questions, reply with 5 blanks
- `part2.json`: diagram file name, email with 5 blanks, 3 questions. The diagram is an image (png, jpg, webp, gif, svg) or a static `.html` page in the same folder
- `part3.json`: 4 paragraphs (A-D), 9 statements answered A-E (E = not given)
- `part4.json`: article, 5 questions, comment with 5 blanks

`answer` is the zero-based index of the correct option. Blanks are written as `{{1}}`, `{{2}}`, ... in the text. Files are validated on load (`web/lib/schema.ts`).

## Add a listening test

Use `data/listening/mock-2026-1` as the example; the `youtube-listening-test` skill imports one from a YouTube video.

- `meta.json`: `title`, `source` (the YouTube watch URL the audio plays from)
- Every clip is `{ "start", "end" }` in seconds of that video.
- `part1.json`: 3 `sections`, each `{ audio, questions }` with 3, 3 and 2 questions
- `part2.json`, `part3.json`: `audio`, 5 and 6 questions; each question has `audio` (the spoken question), `prompt` (its text, shown on the results page), 4 `options`, `answer`
- `part4.json` to `part6.json`: `timeLimitSec`, `audio`, 5, 8 and 6 questions with `prompt`, 4 `options`, `answer`

Options can be four picture files in the test folder (`"q8-a.jpg"`, ...). Files are validated on load (`web/lib/listening/schema.ts`).

## Add a writing test

Use `data/writing/mock-2026-1` as the example; the `youtube-writing-test` skill imports one from a YouTube video.

- `meta.json`: `title`, `source`
- `part1.json`: `timeLimitSec`, `situation`, `task` (instruction sentence), 3 `points`, `sample` (model email)
- `part2.json`: `timeLimitSec`, `title`, `situation`, `options` (A, B), `samples` (a model answer for each option)

Writing is not scored; the results page shows your response next to the samples. Files are validated on load (`web/lib/writing/schema.ts`).

If Playwright's Chromium is not available (macOS 12), run the e2e tests with Google Chrome by adding `channel: "chrome"` to the projects' `use` in a local copy of `playwright.config.ts`.
