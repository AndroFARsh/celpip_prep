# CELPIP Reading Mock Tests

Next.js app in `web/`, test content in `data/reading/`.

## Run

```
cd web
npm install
npm run dev
```

Open http://localhost:3000. Start the full test or a single part. Finished results are saved in the browser; home shows Results and Clear for runs taken before.

## Test

```
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

## Add a test

Copy `data/reading/demo-1` to `data/reading/<new-id>` and edit the JSON. It appears on the home page automatically.

- `meta.json`: `title`
- `part1.json`: letter, 6 questions, reply with 5 blanks
- `part2.json`: diagram table, email with 5 blanks, 3 questions
- `part3.json`: 4 paragraphs (A-D), 9 statements answered A-E (E = not given)
- `part4.json`: article, 5 questions, comment with 5 blanks

`answer` is the zero-based index of the correct option. Blanks are written as `{{1}}`, `{{2}}`, ... in the text. Files are validated on load (`web/lib/schema.ts`).
