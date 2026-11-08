import type { Section } from "./sections"

/**
 * Estimated CELPIP level from the number of correct answers out of 38.
 * CELPIP does not publish its conversion; these bands follow the widely shared unofficial charts.
 * Entry i is the fewest correct answers for level i + 1.
 */
const MIN_CORRECT: Record<Section, number[]> = {
  listening: [1, 4, 7, 11, 17, 22, 27, 30, 33, 35, 37, 38],
  reading: [1, 5, 8, 10, 15, 19, 24, 28, 31, 33, 37, 38],
}

/** A part score is scaled to 38 questions first. */
export function celpipLevel(section: Section, score: number, total: number) {
  const scaled = Math.round((score * 38) / total)
  return MIN_CORRECT[section].filter((min) => scaled >= min).length
}
