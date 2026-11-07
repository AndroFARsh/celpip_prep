# Plan: CELPIP Reading MVP

## Layout

```
CELPIP/
  AGENTS.md                    project instructions
  PLAN.md
  README.md
  data/reading/<test-id>/      meta.json, part1.json ... part4.json
  web/                         Next.js 16 app
```

## Data model

All questions and blanks are dropdowns, as in the real test. `answer` is the zero-based index of the correct option. Blanks are `{{1}}`..`{{5}}` placeholders in text.

- `meta.json`: `{ "title" }` (id = folder name)
- `part1.json`: `{ timeLimitSec, passage, questions[6], reply: { text, blanks[5] } }`
- `part2.json`: `{ timeLimitSec, diagram: { title, columns, rows }, email: { text, blanks[5] }, questions[3] }`
- `part3.json`: `{ timeLimitSec, paragraphs[4], statements[9]: { text, answer: "A".."E" } }`
- `part4.json`: `{ timeLimitSec, passage, questions[5], comment: { text, blanks[5] } }`

Decision: part 2 diagram is a table in JSON (rendered with shadcn Table) instead of an image, so authoring needs no image files or asset route.

## Phases

### Phase 1: Scaffold [done]
- create-next-app (TS, Tailwind 4, App Router, ESLint, Turbopack, Cache Components).
- shadcn/ui new-york components via the shadcn CLI: button, card, select, badge, separator, scroll-area, table, dropdown-menu.
- next-themes, zod, geist (local fonts), vitest, testing-library, playwright.
- `.gitignore` (root and web), minimal README.

Success: lint, build pass.

### Phase 2: Data layer [done]
- `web/lib/schema.ts`: zod schemas enforcing real CELPIP counts, answer index range, placeholder/blank match.
- `web/lib/tests.ts`: `listTests()` discovers folders; `loadTest(id)` validates all parts.
- `data/reading/demo-1`: full original sample test (38 questions).

Success: unit tests for acceptance, rejection, discovery of new folders, invalid data throws.

### Phase 3: Test UI [done]
- `/`: Card per test with Start.
- `/reading/[id]`: sticky header (part title, countdown, Next/Finish), two panes with ScrollArea (stacked on mobile). No going back.
- Per-part timer (11, 9, 10, 13 min) auto-advances.
- Results: total and per-part score, table of your answer vs correct answer.
- Unknown test id returns 404 page.
- Single part: `/reading/[id]/[part]`; Next goes straight to that part's results.
- Results: `/reading/[id]/results/[full|1-4]`, saved in localStorage per test and run; Start again, Clear result, Back to tests.
- Home card: a row per run (full, parts 1-4) with Start, plus Results (score) and Clear when taken before.
- Every Start begins fresh: the runner resets when its page is hidden (Next 16 keeps visited pages alive via Activity).

Success: full flow, timer auto-advance, score matches answer key.

### Phase 4: Tests [done]
- Vitest (31 tests, incl. single part, saved results, clear, fresh start after Activity hide/show): schemas, loader, scoring, countdown hook, full-flow integration of TestRunner (perfect run 38/38, all wrong 0/38 with answers shown, answers kept across parts, timer auto-advance through all parts).
- Playwright (22 tests, incl. single part, results persistence, clear on home and results page, fresh start, desktop + Pixel 7): home, full run, skip run, theme toggle, dark mode, no horizontal scroll, mobile stacking, 404.

Success: `npm test` green; `npm run test:e2e` green.

### Phase 5: Verify and hand over [done]
- Verified on live production and dev servers: home, test page, new folder appears with no code changes, 404.
- Note: the build sandbox blocks Playwright browser downloads, so the Playwright suite must be run locally (`npx playwright install chromium && npm run test:e2e`).
