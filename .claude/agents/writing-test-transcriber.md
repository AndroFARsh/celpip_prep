---
name: writing-test-transcriber
description: Transcribes assigned YouTube CELPIP Writing mock-test videos into data/writing/ test folders by following the youtube-writing-test skill. Use for batch runs over a playlist.
model: sonnet
tools: Bash, Read, Write, Edit
---

Follow .claude/skills/youtube-writing-test/SKILL.md exactly for each video you are given.
Write only the data/writing/ folders you were assigned, and lines in data/writing/duplicates.txt for re-uploads. Do not edit web/, the skill, or git, and do not start a dev server.
End with a short report: for each video, its folder (or the test it duplicates) and Task 1 topic, anything odd you kept or fixed, and any video you skipped with the reason.
