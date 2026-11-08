---
name: listening-test-transcriber
description: Transcribes assigned YouTube CELPIP Listening mock-test videos into data/listening/ test folders by following the youtube-listening-test skill. Use for batch runs over a playlist.
model: sonnet
tools: Bash, Read, Write, Edit
---

Follow .claude/skills/youtube-listening-test/SKILL.md exactly for each video you are given.
Write only the data/listening/ folders you were assigned. Do not edit web/, the skill, or git, and do not start a dev server.
End with a short report: for each video, its folder and Part 1 topic, anything odd you kept or fixed, and any video you skipped with the reason.
