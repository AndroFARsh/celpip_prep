# Plan: CELPIP Writing MVP

Add a Writing section to the app (same Next.js app, shadcn/ui, results store, GitHub Pages deploy).

## Real test

2 tasks, 53 minutes. Each task: information on the left; instructions, a text box and a word count on the right. No spell check. 150-200 words.

| Task | Name | Time | Content |
|---|---|---|---|
| 1 | Writing an Email | 27 min | a situation; write an email that covers 3 bullet points |
| 2 | Responding to Survey Questions | 26 min | a survey topic with Option A and Option B; choose one and explain why |

## Source material

Playlist `PLBVkYjNQCzP8vYh53rlhYs1RqArypTFdF`: about 80 videos of 9 minutes, no chapters. Layout, checked on `HSv1DLRFAO0`:

- Instructions slide, then the Task 1 prompt (situation left, instructions and 3 bullets right), then a sample email.
- Task 2 prompt (title and situation left, Options A and B right), then "Model Answer - Option A" and "Model Answer - Option B".
- Captions are the narrator's commentary, not the prompts: the text is read from frames.
- Many videos reuse the same test under a different title, so imports must skip duplicates.

## Data model

`data/writing/<test-id>/`: `meta.json` (`title`, `source`), `part1.json`, `part2.json`. One zod schema per part.

- `part1.json`: `{ timeLimitSec: 1620, situation, task, points: string[3], sample }`. `task` is the instruction sentence ("Write an email to Sarah in about 150-200 words. ...").
- `part2.json`: `{ timeLimitSec: 1560, title, situation, options: [A, B], samples: [A, B] }`.

## Test flow

- Same as Reading: per-task countdown, auto-advance at 0, Next, no going back, full test or single task, every Start is a fresh run.
- Header: "Writing Task N: <name>" with the timer and Next.
- Left pane: "Read the following information." and the situation (Task 2 also its title).
- Right pane: task text (Task 1 bullets; Task 2 Option A/B as a radio group), a Textarea (spell check off) and a live word count.
- Mobile stacks the information above the text box.

## Results

Writing is not scored automatically, so there is no score or CELPIP level.

- Per task: the prompt, your response with its word count (badge marks counts outside 150-200), the chosen option for Task 2, and the sample answer(s) from the source (Task 2 shows both models).
- Start again, Clear result, Back to tests, as in the other sections. The test card shows "Results" without a score.
- Saved in localStorage like the others: `{ answers: { "p1": text, "p2": text, "p2-option": "A" | "B" } }`.

## Phases and success criteria

1. **Model and loader**: `lib/writing/schema.ts`, `lib/writing/tests.ts`, fixtures in `web/test/fixtures/writing/demo-1`. Done when unit tests cover valid and invalid files, discovery of new folders, and every `data/writing` test validates.
2. **UI**: Writing on the landing page, `/writing` list, runner, results. Done when component tests cover word count, option choice, Next/auto-advance, saving, results content and the test card without a score; lint, test and build pass.
3. **Content**: `youtube-writing-test` skill (fetch, pending, validate scripts) and a `writing-test-transcriber` agent; the example video `HSv1DLRFAO0` imported as `mock-2026-1`. Done when `validate.sh` passes and the test appears on `/writing`.
4. **e2e**: Playwright covers a full run, a single task, auto-saved results, clear, fresh start, mobile stacking and no horizontal scroll. Done when it passes on desktop and mobile.
5. **Docs**: AGENTS.md business requirements and README updated. Dev server running.
