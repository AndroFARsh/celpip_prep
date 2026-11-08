import { useSyncExternalStore } from "react"

import type { Run } from "./runs"
import type { Answers } from "./scoring"
import type { Section } from "./sections"

/** Writing is not scored automatically, so its results have no `score` or `total`. */
export type SavedResult = { answers: Answers; score?: number; total?: number }

// Reading keeps its original key so results saved before other sections existed are kept.
const key = (section: Section, testId: string, run: Run) =>
  section === "reading" ? `celpip:${testId}:${run}` : `celpip:${section}:${testId}:${run}`
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

const emit = () => listeners.forEach((l) => l())

export function saveResult(section: Section, testId: string, run: Run, result: SavedResult) {
  localStorage.setItem(key(section, testId, run), JSON.stringify(result))
  emit()
}

export function clearResult(section: Section, testId: string, run: Run) {
  localStorage.removeItem(key(section, testId, run))
  emit()
}

export function useResult(section: Section, testId: string, run: Run): SavedResult | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key(section, testId, run)),
    () => null,
  )
  return raw ? JSON.parse(raw) : null
}
