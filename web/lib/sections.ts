/** Test sections shown on the landing page. `unit` is what the test calls its parts. */
export const SECTIONS = {
  reading: {
    name: "Reading",
    unit: "Part",
    summary: "4 parts, 38 questions, 55-60 minutes",
    parts: [
      "Reading Correspondence",
      "Reading to Apply a Diagram",
      "Reading for Information",
      "Reading for Viewpoints",
    ],
  },
  listening: {
    name: "Listening",
    unit: "Part",
    summary: "6 parts, 38 questions, about 40 minutes",
    parts: [
      "Listening to Problem Solving",
      "Listening to a Daily Life Conversation",
      "Listening for Information",
      "Listening to a News Item",
      "Listening to a Discussion",
      "Listening for Viewpoints",
    ],
  },
  writing: {
    name: "Writing",
    unit: "Task",
    summary: "2 tasks, 150-200 words each, 53 minutes",
    parts: ["Writing an Email", "Responding to Survey Questions"],
  },
  speaking: {
    name: "Speaking",
    unit: "Task",
    summary: "8 tasks, recorded answers, about 15 minutes",
    parts: [
      "Giving Advice",
      "Talking about a Personal Experience",
      "Describing a Scene",
      "Making Predictions",
      "Comparing and Persuading",
      "Dealing with a Difficult Situation",
      "Expressing Opinions",
      "Describing an Unusual Situation",
    ],
  },
} as const

export type Section = keyof typeof SECTIONS

export const SECTION_IDS = Object.keys(SECTIONS) as Section[]
