import { useSyncExternalStore } from "react"

import type { Run } from "./runs"
import type { Answers } from "./scoring"

export type SavedResult = { answers: Answers; score: number; total: number }

const key = (testId: string, run: Run) => `celpip:${testId}:${run}`
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

export function saveResult(testId: string, run: Run, result: SavedResult) {
  localStorage.setItem(key(testId, run), JSON.stringify(result))
  emit()
}

export function clearResult(testId: string, run: Run) {
  localStorage.removeItem(key(testId, run))
  emit()
}

export function useResult(testId: string, run: Run): SavedResult | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key(testId, run)),
    () => null,
  )
  return raw ? JSON.parse(raw) : null
}
