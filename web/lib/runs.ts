import { PART_NAMES } from "./scoring"

export const RUNS = ["full", "1", "2", "3", "4"] as const
export type Run = (typeof RUNS)[number]

export const isRun = (value: string): value is Run => (RUNS as readonly string[]).includes(value)
export const runParts = (run: Run) => (run === "full" ? [1, 2, 3, 4] : [Number(run)])
export const runPath = (id: string, run: Run) => (run === "full" ? `/reading/${id}` : `/reading/${id}/${run}`)
export const resultsPath = (id: string, run: Run) => `/reading/${id}/results/${run}`
export const runLabel = (run: Run) => (run === "full" ? "Full test" : `Part ${run}: ${PART_NAMES[Number(run) - 1]}`)
