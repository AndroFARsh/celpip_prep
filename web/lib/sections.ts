/** Test sections shown on the landing page. Add Speaking here when it exists. */
export const SECTIONS = {
  reading: {
    name: "Reading",
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
    summary: "2 tasks, 150-200 words each, 53 minutes",
    parts: ["Writing an Email", "Responding to Survey Questions"],
  },
} as const

export type Section = keyof typeof SECTIONS

export const SECTION_IDS = Object.keys(SECTIONS) as Section[]
