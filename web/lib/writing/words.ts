/** Both writing tasks ask for 150-200 words. */
export const MIN_WORDS = 150
export const MAX_WORDS = 200

export const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length

export const inRange = (words: number) => words >= MIN_WORDS && words <= MAX_WORDS

/** Keys of the saved answers: the response text of each task, and the option chosen in Task 2. */
export const responseKey = (part: number) => `p${part}`
export const OPTION_KEY = "p2-option"
export const OPTION_LABELS = ["A", "B"]
