import { SECTIONS, type Section } from "./sections"

/** "full" or a part number as a string ("1", "2", ...). */
export type Run = string

const partNumbers = (section: Section) => SECTIONS[section].parts.map((_, i) => i + 1)

export const runsFor = (section: Section): Run[] => ["full", ...partNumbers(section).map(String)]
export const isRun = (section: Section, value: string) => runsFor(section).includes(value)
export const runParts = (section: Section, run: Run) => (run === "full" ? partNumbers(section) : [Number(run)])
export const runPath = (section: Section, id: string, run: Run) =>
  run === "full" ? `/${section}/${id}` : `/${section}/${id}/${run}`
export const resultsPath = (section: Section, id: string, run: Run) => `/${section}/${id}/results/${run}`
export const runLabel = (section: Section, run: Run) =>
  run === "full" ? "Full test" : `${SECTIONS[section].unit} ${run}: ${SECTIONS[section].parts[Number(run) - 1]}`
